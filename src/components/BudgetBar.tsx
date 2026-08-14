import { motion } from 'framer-motion'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { budgetFillPercent, budgetStatus } from '../lib/budget'
import { formatCurrency } from '../lib/format/currency'

interface BudgetBarProps {
  label: string
  spentCents: number
  budgetCents: number
  dotColor?: string
}

const STATUS_FILL: Record<string, string> = {
  ok: 'bg-accent-primary',
  warning: 'bg-accent-warning',
  danger: 'bg-accent-danger',
}

/** Color is never the only signal — warning/danger always pair with an icon. */
export function BudgetBar({ label, spentCents, budgetCents, dotColor }: BudgetBarProps) {
  const status = budgetStatus(spentCents, budgetCents)
  const fill = budgetFillPercent(spentCents, budgetCents)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          {dotColor && (
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: dotColor }}
              aria-hidden
            />
          )}
          <span className="text-text-primary">{label}</span>
          {status === 'warning' && (
            <AlertTriangle
              size={13}
              strokeWidth={2}
              className="text-accent-warning"
              aria-label="Approaching budget"
            />
          )}
          {status === 'danger' && (
            <AlertCircle
              size={13}
              strokeWidth={2}
              className="text-accent-danger"
              aria-label="Over budget"
            />
          )}
        </span>
        <span className="text-text-secondary tabular-nums">
          {formatCurrency(spentCents)} / {budgetCents > 0 ? formatCurrency(budgetCents) : '—'}
        </span>
      </div>
      <div className="bg-glass-surface h-2 w-full overflow-hidden rounded-full">
        <motion.div
          className={`h-full rounded-full ${STATUS_FILL[status]}`}
          initial={false}
          animate={
            status === 'danger'
              ? { width: `${fill}%`, opacity: [1, 0.6, 1] }
              : { width: `${fill}%`, opacity: 1 }
          }
          transition={
            status === 'danger'
              ? {
                  width: { duration: 0.4, ease: 'easeOut' },
                  opacity: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                }
              : { duration: 0.4, ease: 'easeOut' }
          }
        />
      </div>
    </div>
  )
}
