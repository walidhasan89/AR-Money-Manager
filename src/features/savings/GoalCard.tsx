import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Archive,
  CheckCircle2,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'
import { formatCurrency } from '../../lib/format/currency'
import type { GoalProgress, GoalType } from '../../lib/ipc/types'

const TYPE_ICON: Record<GoalType, LucideIcon> = {
  savings: PiggyBank,
  dps: Landmark,
  emergency_fund: ShieldCheck,
}

const TYPE_LABEL: Record<GoalType, string> = {
  savings: 'Savings',
  dps: 'DPS',
  emergency_fund: 'Emergency Fund',
}

interface GoalCardProps {
  goal: GoalProgress
  onContribute: (goalId: string) => void
  onEdit: (goal: GoalProgress) => void
  onArchive: (goal: GoalProgress) => void
}

export function GoalCard({ goal, onContribute, onEdit, onArchive }: GoalCardProps) {
  const Icon = TYPE_ICON[goal.type]
  const hasTarget = goal.targetAmountCents != null && goal.targetAmountCents > 0
  const isComplete = hasTarget && goal.progressPercent >= 100

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="bg-glass-surface border-glass-border flex size-8 shrink-0 items-center justify-center rounded-full border">
            <Icon size={15} strokeWidth={1.75} className="text-text-secondary" aria-hidden />
          </div>
          <div>
            <p className="text-text-primary font-medium">{goal.name}</p>
            <p className="text-text-secondary text-xs">{TYPE_LABEL[goal.type]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            aria-label={`Edit ${goal.name}`}
            className="text-text-secondary hover:text-text-primary p-1"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onArchive(goal)}
            aria-label={`Archive ${goal.name}`}
            className="text-text-secondary hover:text-text-primary p-1"
          >
            <Archive size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {hasTarget ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-text-primary tabular-nums">
              {formatCurrency(goal.contributedCents)}
            </span>
            <span className="text-text-secondary tabular-nums">
              of {formatCurrency(goal.targetAmountCents ?? 0)}
            </span>
          </div>
          <div className="bg-glass-surface h-2 w-full overflow-hidden rounded-full">
            <motion.div
              className={`h-full rounded-full ${isComplete ? 'bg-accent-success' : 'bg-accent-primary'}`}
              initial={false}
              animate={{ width: `${goal.progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          {isComplete && (
            <p className="text-accent-success mt-1.5 flex items-center gap-1 text-xs">
              <CheckCircle2 size={12} strokeWidth={2} /> Goal reached
            </p>
          )}
        </div>
      ) : (
        <p className="text-text-primary text-xl font-semibold tabular-nums">
          {formatCurrency(goal.contributedCents)}
        </p>
      )}

      {goal.type === 'dps' && (
        <div className="border-glass-border flex flex-col gap-1.5 border-t pt-3 text-xs">
          {goal.monthlyContributionCents != null && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Monthly installment</span>
              <span className="text-text-primary tabular-nums">
                {formatCurrency(goal.monthlyContributionCents)}
              </span>
            </div>
          )}
          {goal.targetDate && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Maturity date</span>
              <span className="text-text-primary">
                {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {goal.projectedMaturityCents != null && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Projected maturity</span>
              <span className="text-text-primary tabular-nums">
                {formatCurrency(goal.projectedMaturityCents)}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => onContribute(goal.id)}
        className="border-glass-border text-accent-primary hover:border-glass-border-hover flex items-center justify-center gap-1.5 rounded-control border py-2 text-sm font-medium transition-colors"
      >
        <Plus size={14} strokeWidth={2} /> Add contribution
      </button>
    </GlassCard>
  )
}
