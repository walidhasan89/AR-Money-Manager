import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { addMonths, format, parse, subMonths } from 'date-fns'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, PiggyBank, Receipt, Scale, Wallet } from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'
import { KpiTile } from '../../components/KpiTile'
import { getBudgetSummary, getDashboardSummary, getSavingsTrend } from '../../lib/ipc/commands'
import { getErrorMessage } from '../../lib/ipc/types'
import type { BudgetSummary, DashboardSummary, SavingsTrendPoint } from '../../lib/ipc/types'
import { useDataEventsStore } from '../../store/dataEventsStore'
import { useToastStore } from '../../store/toastStore'
import { AmbientBackground } from './AmbientBackground'
import { BudgetVsActualCard } from './charts/BudgetVsActualCard'
import { DailySpendingChart } from './charts/DailySpendingChart'
import { SavingsTrendChart } from './charts/SavingsTrendChart'
import { SpendingDonutChart } from './charts/SpendingDonutChart'
import { PendingFixedExpensesWidget } from './PendingFixedExpensesWidget'
import { RecentTransactionsPanel } from './RecentTransactionsPanel'

function monthLabel(month: string): string {
  return format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')
}

function shiftMonth(month: string, delta: number): string {
  const date = parse(month, 'yyyy-MM', new Date())
  const shifted = delta > 0 ? addMonths(date, delta) : subMonths(date, -delta)
  return format(shifted, 'yyyy-MM')
}

interface FadeInCardProps {
  index: number
  children: ReactNode
}

/** Staggered fade+scale-in for dashboard cards, 60ms/card per DESIGN_SYSTEM.md. */
function FadeInCard({ index, children }: FadeInCardProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: prefersReducedMotion ? 0 : index * 0.06,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  )
}

export function DashboardScreen() {
  const showToast = useToastStore((s) => s.showToast)
  const expensesVersion = useDataEventsStore((s) => s.expensesVersion)
  const currentMonth = format(new Date(), 'yyyy-MM')
  const [month, setMonth] = useState(currentMonth)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [savingsTrend, setSavingsTrend] = useState<SavingsTrendPoint[]>([])
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null)

  const refresh = useCallback(() => {
    Promise.all([getDashboardSummary(month), getSavingsTrend(month), getBudgetSummary(month)])
      .then(([nextSummary, nextTrend, nextBudget]) => {
        setSummary(nextSummary)
        setSavingsTrend(nextTrend)
        setBudgetSummary(nextBudget)
      })
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  useEffect(() => {
    refresh()
  }, [refresh, expensesVersion])

  const ready = summary && summary.month === month && budgetSummary && budgetSummary.month === month

  return (
    <div className="relative flex flex-col gap-6">
      <AmbientBackground />

      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Previous month"
            className="text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>
          <span className="text-text-primary w-32 text-center text-sm font-medium">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Next month"
            className="text-text-secondary hover:text-text-primary"
          >
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {month === currentMonth && <PendingFixedExpensesWidget />}

      {!ready ? (
        <p className="text-text-secondary text-sm">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FadeInCard index={0}>
              <KpiTile
                label="Income"
                valueCents={summary.incomeCents}
                icon={Wallet}
                tone="success"
              />
            </FadeInCard>
            <FadeInCard index={1}>
              <KpiTile label="Expenses" valueCents={summary.expensesCents} icon={Receipt} />
            </FadeInCard>
            <FadeInCard index={2}>
              <KpiTile
                label="Savings"
                valueCents={summary.savingsCents}
                icon={PiggyBank}
                tone="success"
              />
            </FadeInCard>
            <FadeInCard index={3}>
              <KpiTile
                label="Remaining"
                valueCents={summary.remainingCents}
                icon={Scale}
                tone={summary.remainingCents < 0 ? 'danger' : 'success'}
              />
            </FadeInCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FadeInCard index={4}>
              <GlassCard>
                <h2 className="text-text-primary mb-4 font-medium">Spending by Category</h2>
                <SpendingDonutChart data={summary.spendingByCategory} />
              </GlassCard>
            </FadeInCard>
            <FadeInCard index={5}>
              <GlassCard>
                <h2 className="text-text-primary mb-4 font-medium">Daily Spending</h2>
                <DailySpendingChart data={summary.dailySpending} />
              </GlassCard>
            </FadeInCard>
            <FadeInCard index={6}>
              <GlassCard>
                <h2 className="text-text-primary mb-4 font-medium">Budget vs Actual</h2>
                <BudgetVsActualCard categories={budgetSummary.categories} />
              </GlassCard>
            </FadeInCard>
            <FadeInCard index={7}>
              <GlassCard>
                <h2 className="text-text-primary mb-4 font-medium">Savings Trend</h2>
                <SavingsTrendChart data={savingsTrend} />
              </GlassCard>
            </FadeInCard>
          </div>

          <FadeInCard index={8}>
            <GlassCard>
              <RecentTransactionsPanel transactions={summary.recentTransactions} />
            </GlassCard>
          </FadeInCard>
        </>
      )}
    </div>
  )
}
