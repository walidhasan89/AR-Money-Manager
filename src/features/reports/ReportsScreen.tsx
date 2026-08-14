import { useCallback, useEffect, useState } from 'react'
import { addMonths, format, parse, subMonths } from 'date-fns'
import { save } from '@tauri-apps/plugin-dialog'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  PiggyBank,
  Receipt,
  Scale,
  Wallet,
} from 'lucide-react'
import { BudgetBar } from '../../components/BudgetBar'
import { EmptyState } from '../../components/EmptyState'
import { GlassCard } from '../../components/GlassCard'
import { KpiTile } from '../../components/KpiTile'
import { exportReportCsv, getReportSummary } from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { ReportSummary } from '../../lib/ipc/types'
import { useDataEventsStore } from '../../store/dataEventsStore'
import { useToastStore } from '../../store/toastStore'

function monthLabel(month: string): string {
  return format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')
}

function shiftMonth(month: string, delta: number): string {
  const date = parse(month, 'yyyy-MM', new Date())
  const shifted = delta > 0 ? addMonths(date, delta) : subMonths(date, -delta)
  return format(shifted, 'yyyy-MM')
}

export function ReportsScreen() {
  const showToast = useToastStore((s) => s.showToast)
  const expensesVersion = useDataEventsStore((s) => s.expensesVersion)
  const savingsVersion = useDataEventsStore((s) => s.savingsVersion)
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [report, setReport] = useState<ReportSummary | null>(null)

  const refresh = useCallback(() => {
    getReportSummary(month)
      .then(setReport)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  useEffect(() => {
    refresh()
  }, [refresh, expensesVersion, savingsVersion])

  async function handleExport() {
    try {
      const path = await save({
        defaultPath: `report-${month}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      })
      if (!path) return
      await exportReportCsv(path, month)
      showToast('Report exported')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  const ready = report && report.month === month

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Reports</h1>
        <div className="flex items-center gap-4">
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
          <button
            type="button"
            onClick={handleExport}
            className="border-glass-border text-text-secondary hover:text-text-primary flex items-center gap-1.5 rounded-control border px-3 py-2 text-sm transition-colors"
          >
            <Download size={14} strokeWidth={1.75} /> Export CSV
          </button>
        </div>
      </div>

      {!ready ? (
        <p className="text-text-secondary text-sm">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Income" valueCents={report.incomeCents} icon={Wallet} tone="success" />
            <KpiTile label="Expenses" valueCents={report.expensesCents} icon={Receipt} />
            <KpiTile
              label="Savings"
              valueCents={report.savingsCents}
              icon={PiggyBank}
              tone="success"
            />
            <KpiTile
              label="Net"
              valueCents={report.remainingCents}
              icon={Scale}
              tone={report.remainingCents < 0 ? 'danger' : 'success'}
            />
          </div>

          <GlassCard>
            <h2 className="text-text-primary mb-3 font-medium">Budget Adherence</h2>
            <BudgetBar
              label="Overall"
              spentCents={report.overallSpentCents}
              budgetCents={report.overallBudgetCents}
            />
          </GlassCard>

          <GlassCard>
            <h2 className="text-text-primary mb-4 font-medium">Category Breakdown</h2>
            {report.categories.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No spending yet"
                description="This month's category breakdown will appear here once you log an expense."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-glass-border text-text-secondary border-b text-left text-xs">
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 text-right font-medium">Spent</th>
                      <th className="pb-2 text-right font-medium">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.categories.map((category) => (
                      <tr
                        key={category.categoryId}
                        className="border-glass-border/50 border-b last:border-0"
                      >
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: category.categoryColor }}
                              aria-hidden
                            />
                            <span className="text-text-primary">{category.categoryName}</span>
                          </div>
                        </td>
                        <td className="text-text-primary py-2 text-right tabular-nums">
                          {formatCurrency(category.spentCents)}
                        </td>
                        <td className="text-text-secondary py-2 text-right tabular-nums">
                          {category.budgetCents > 0 ? formatCurrency(category.budgetCents) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-glass-border border-t">
                      <td className="text-text-primary py-2 font-medium">Total</td>
                      <td className="text-text-primary py-2 text-right font-medium tabular-nums">
                        {formatCurrency(report.expensesCents)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  )
}
