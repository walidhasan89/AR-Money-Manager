import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Copy, Pencil } from 'lucide-react'
import { BudgetBar } from '../../components/BudgetBar'
import { GlassCard } from '../../components/GlassCard'
import {
  copyLastMonthBudget,
  getBudgetSummary,
  setCategoryBudget,
  setOverallBudget,
} from '../../lib/ipc/commands'
import { formatCurrency, parseAmountToCents } from '../../lib/format/currency'
import { monthLabel, shiftMonth } from '../../lib/format/month'
import { getErrorMessage } from '../../lib/ipc/types'
import type { BudgetSummary } from '../../lib/ipc/types'
import { useDataEventsStore } from '../../store/dataEventsStore'
import { useToastStore } from '../../store/toastStore'

interface BudgetAmountFieldProps {
  valueCents: number
  onSave: (cents: number) => void
}

/**
 * Shows the budget as bold, static text with a pencil button that swaps in
 * an editable input — clicking straight into a plain-looking box (the old
 * behavior) gave no visual hint the amount was editable at all. The local
 * edit buffer only needs to resync from `valueCents` when the caller
 * remounts it (via `key`) for a genuinely different budget — e.g. a month
 * change. Do not add a reset-on-prop-change effect here: that would fight
 * the user's in-progress edit every time a live update refetches the
 * summary while this field still has focus.
 */
function BudgetAmountField({ valueCents, onSave }: BudgetAmountFieldProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(() => (valueCents / 100).toFixed(2))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commit() {
    const cents = parseAmountToCents(value)
    if (cents !== null && cents !== valueCents) {
      setValue((cents / 100).toFixed(2))
      onSave(cents)
    } else {
      setValue((valueCents / 100).toFixed(2))
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setValue((valueCents / 100).toFixed(2))
            setEditing(false)
          }
        }}
        className="border-glass-border focus:border-accent-primary text-text-primary w-28 rounded-control border bg-black/10 px-2 py-1 text-right text-sm font-semibold tabular-nums outline-none transition-colors"
      />
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-accent-primary text-right text-sm font-bold tabular-nums">
        {formatCurrency(valueCents)}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit budget amount, currently ${formatCurrency(valueCents)}`}
        className="text-text-secondary hover:text-accent-primary shrink-0"
      >
        <Pencil size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}

export function BudgetsScreen() {
  const showToast = useToastStore((s) => s.showToast)
  const expensesVersion = useDataEventsStore((s) => s.expensesVersion)
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  // Bumped only when budget amounts change out from under the editable
  // fields in bulk (a copy-last-month), forcing them to remount and pick up
  // the fresh values — ordinary live-spend updates must NOT do this, or
  // they'd blow away whatever the user is mid-typing.
  const [bulkUpdateVersion, setBulkUpdateVersion] = useState(0)

  const refresh = useCallback(() => {
    getBudgetSummary(month)
      .then(setSummary)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  useEffect(() => {
    refresh()
  }, [refresh, expensesVersion])

  async function handleSetOverall(cents: number) {
    try {
      const updated = await setOverallBudget({ month, amountCents: cents })
      setSummary(updated)
      showToast('Overall budget updated')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  async function handleSetCategory(categoryId: string, cents: number) {
    try {
      const updated = await setCategoryBudget({ month, categoryId, amountCents: cents })
      setSummary(updated)
      showToast('Category budget updated')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  async function handleCopyLastMonth() {
    try {
      const count = await copyLastMonthBudget(month)
      if (count === 0) {
        showToast('No budget found for last month', 'error')
        return
      }
      const updated = await getBudgetSummary(month)
      setSummary(updated)
      setBulkUpdateVersion((v) => v + 1)
      showToast(`Copied ${count} budget${count === 1 ? '' : 's'} from last month`)
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Budgets</h1>
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

      {!summary || summary.month !== month ? (
        <p className="text-text-secondary text-sm">Loading…</p>
      ) : (
        <>
          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-text-primary font-medium">Overall Budget</h2>
              <BudgetAmountField
                key={`${month}-${bulkUpdateVersion}`}
                valueCents={summary.overallBudgetCents}
                onSave={handleSetOverall}
              />
            </div>
            <BudgetBar
              label="This month"
              spentCents={summary.overallSpentCents}
              budgetCents={summary.overallBudgetCents}
            />
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-text-primary font-medium">Category Budgets</h2>
              <button
                type="button"
                onClick={handleCopyLastMonth}
                className="text-accent-primary flex items-center gap-1.5 text-sm"
              >
                <Copy size={14} strokeWidth={1.75} /> Copy last month
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {summary.categories.map((category) => (
                <div key={category.categoryId} className="flex items-center gap-4">
                  <div className="flex-1">
                    <BudgetBar
                      label={category.categoryName}
                      spentCents={category.spentCents}
                      budgetCents={category.budgetCents}
                      dotColor={category.categoryColor}
                    />
                  </div>
                  <BudgetAmountField
                    key={`${month}-${bulkUpdateVersion}-${category.categoryId}`}
                    valueCents={category.budgetCents}
                    onSave={(cents) => handleSetCategory(category.categoryId, cents)}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}
