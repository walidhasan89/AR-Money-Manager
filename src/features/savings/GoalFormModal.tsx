import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AmountInput } from '../../components/AmountInput'
import { DateField } from '../../components/DateField'
import { createGoal, updateGoal } from '../../lib/ipc/commands'
import { parseAmountToCents } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Goal, GoalType } from '../../lib/ipc/types'
import { useEscapeToClose } from '../../lib/useEscapeToClose'
import { useToastStore } from '../../store/toastStore'

type EditableGoal = Pick<
  Goal,
  'name' | 'type' | 'targetAmountCents' | 'monthlyContributionCents' | 'targetDate'
> & { id: string }

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'dps', label: 'DPS' },
  { value: 'emergency_fund', label: 'Emergency Fund' },
]

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['savings', 'dps', 'emergency_fund']),
    targetAmount: z.string(),
    monthlyContribution: z.string(),
    targetDate: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.targetAmount && parseAmountToCents(values.targetAmount) === null) {
      ctx.addIssue({ code: 'custom', path: ['targetAmount'], message: 'Enter a valid amount' })
    }
    if (values.type === 'dps') {
      if (!values.monthlyContribution || parseAmountToCents(values.monthlyContribution) === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['monthlyContribution'],
          message: 'Monthly installment is required for DPS',
        })
      }
      if (!values.targetDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['targetDate'],
          message: 'Target date is required for DPS',
        })
      }
    } else if (
      values.monthlyContribution &&
      parseAmountToCents(values.monthlyContribution) === null
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthlyContribution'],
        message: 'Enter a valid amount',
      })
    }
  })
type FormValues = z.infer<typeof schema>

interface GoalFormModalProps {
  open: boolean
  goal: EditableGoal | null
  onClose: () => void
  onSaved: () => void
}

function GoalFormBody({ goal, onClose, onSaved }: Omit<GoalFormModalProps, 'open'>) {
  const showToast = useToastStore((s) => s.showToast)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: goal?.name ?? '',
      type: goal?.type ?? 'savings',
      targetAmount: goal?.targetAmountCents ? (goal.targetAmountCents / 100).toFixed(2) : '',
      monthlyContribution: goal?.monthlyContributionCents
        ? (goal.monthlyContributionCents / 100).toFixed(2)
        : '',
      targetDate: goal?.targetDate ?? '',
    },
  })
  const type = useWatch({ control, name: 'type' })

  useEscapeToClose(true, onClose)

  async function onSubmit(values: FormValues) {
    const input = {
      name: values.name,
      type: values.type,
      targetAmountCents: values.targetAmount ? parseAmountToCents(values.targetAmount) : null,
      monthlyContributionCents: values.monthlyContribution
        ? parseAmountToCents(values.monthlyContribution)
        : null,
      targetDate: values.targetDate || null,
    }
    try {
      if (goal) {
        await updateGoal(goal.id, input)
        showToast('Goal updated')
      } else {
        await createGoal(input)
        showToast('Goal created')
      }
      onSaved()
      onClose()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={goal ? 'Edit goal' : 'New goal'}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="glass-modal relative w-full max-w-md p-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-text-secondary hover:text-text-primary absolute top-4 right-4"
      >
        <X size={18} strokeWidth={1.75} />
      </button>

      <h2 className="text-text-primary mb-4 text-lg font-semibold">
        {goal ? 'Edit Goal' : 'New Goal'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            {...register('name')}
            placeholder="Goal name (e.g. Emergency Fund)"
            className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-full rounded-control border bg-black/10 px-3 py-2.5 text-sm outline-none transition-colors"
          />
          {errors.name && <p className="text-accent-danger mt-1 text-xs">{errors.name.message}</p>}
        </div>

        <div>
          <p className="text-text-secondary mb-2 text-xs">Type</p>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {GOAL_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    aria-pressed={field.value === option.value}
                    className={`flex-1 rounded-control border px-3 py-2 text-sm transition-colors ${
                      field.value === option.value
                        ? 'border-accent-primary bg-accent-primary/15 text-text-primary'
                        : 'border-glass-border text-text-secondary hover:border-glass-border-hover'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div>
          <label className="text-text-secondary mb-1 block text-xs">Target amount (optional)</label>
          <Controller
            name="targetAmount"
            control={control}
            render={({ field }) => (
              <AmountInput
                value={field.value}
                onChange={field.onChange}
                error={errors.targetAmount?.message}
              />
            )}
          />
        </div>

        {type === 'dps' && (
          <div>
            <label className="text-text-secondary mb-1 block text-xs">Monthly installment</label>
            <Controller
              name="monthlyContribution"
              control={control}
              render={({ field }) => (
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.monthlyContribution?.message}
                />
              )}
            />
          </div>
        )}

        <div>
          <label className="text-text-secondary mb-1 block text-xs">
            {type === 'dps' ? 'Maturity date' : 'Target date (optional)'}
          </label>
          <Controller
            name="targetDate"
            control={control}
            render={({ field }) => (
              <DateField
                value={field.value}
                onChange={field.onChange}
                error={errors.targetDate?.message}
              />
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent-primary mt-2 rounded-control py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
        >
          {goal ? 'Save Changes' : 'Create Goal'}
        </button>
      </form>
    </motion.div>
  )
}

export function GoalFormModal({ open, goal, onClose, onSaved }: GoalFormModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-glass-modal-backdrop"
            onClick={onClose}
          />
          <GoalFormBody goal={goal} onClose={onClose} onSaved={onSaved} />
        </div>
      )}
    </AnimatePresence>
  )
}
