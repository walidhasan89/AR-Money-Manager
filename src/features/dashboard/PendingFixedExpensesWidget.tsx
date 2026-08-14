import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Check, X as SkipIcon } from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'
import { getCategoryIcon } from '../../lib/icons'
import { listPendingFixedExpenses, skipFixedExpense } from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { PendingFixedExpense } from '../../lib/ipc/types'
import { useToastStore } from '../../store/toastStore'
import { ConfirmFixedExpenseModal } from './ConfirmFixedExpenseModal'

export function PendingFixedExpensesWidget() {
  const showToast = useToastStore((s) => s.showToast)
  const [pending, setPending] = useState<PendingFixedExpense[]>([])
  const [confirming, setConfirming] = useState<PendingFixedExpense | null>(null)

  const refresh = useCallback(() => {
    const month = format(new Date(), 'yyyy-MM')
    listPendingFixedExpenses(month)
      .catch((error) => {
        showToast(getErrorMessage(error), 'error')
        return [] as PendingFixedExpense[]
      })
      .then(setPending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleSkip(item: PendingFixedExpense) {
    try {
      const month = format(new Date(), 'yyyy-MM')
      await skipFixedExpense({ fixedExpenseId: item.fixedExpenseId, month })
      showToast(`${item.name} skipped for this month`)
      refresh()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  if (pending.length === 0) return null

  return (
    <GlassCard className="p-0">
      <div className="border-glass-border border-b px-4 py-3">
        <p className="text-text-primary font-medium">
          {pending.length} fixed expense{pending.length === 1 ? '' : 's'} due — unconfirmed
        </p>
        <p className="text-text-secondary text-sm">
          Confirm to post them as real expenses, or skip for this month.
        </p>
      </div>
      <ul>
        {pending.map((item) => {
          const Icon = getCategoryIcon(item.categoryIcon)
          return (
            <li
              key={item.fixedExpenseId}
              className="border-glass-border/50 flex items-center justify-between border-b px-4 py-3 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.categoryColor }}
                  aria-hidden
                />
                <Icon size={14} strokeWidth={1.75} className="text-text-secondary" aria-hidden />
                <div>
                  <p className="text-text-primary text-sm font-medium">{item.name}</p>
                  <p className="text-text-secondary text-xs">Due {item.dueDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-primary text-sm tabular-nums">
                  {formatCurrency(item.amountCents)}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirming(item)}
                  aria-label={`Confirm ${item.name}`}
                  className="bg-accent-success/15 text-accent-success flex size-7 items-center justify-center rounded-full"
                >
                  <Check size={14} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSkip(item)}
                  aria-label={`Skip ${item.name} this month`}
                  className="bg-glass-surface text-text-secondary hover:text-text-primary flex size-7 items-center justify-center rounded-full"
                >
                  <SkipIcon size={14} strokeWidth={2} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmFixedExpenseModal
        pending={confirming}
        onClose={() => setConfirming(null)}
        onConfirmed={refresh}
      />
    </GlassCard>
  )
}
