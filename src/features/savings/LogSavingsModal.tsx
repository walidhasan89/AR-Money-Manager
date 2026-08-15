import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AmountInput } from '../../components/AmountInput'
import { DateField } from '../../components/DateField'
import { createSavingsEntry } from '../../lib/ipc/commands'
import { parseAmountToCents } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Goal, SavingsEntryType } from '../../lib/ipc/types'
import { useEscapeToClose } from '../../lib/useEscapeToClose'
import { useDataEventsStore } from '../../store/dataEventsStore'
import { useToastStore } from '../../store/toastStore'

type GoalOption = Pick<Goal, 'id' | 'name' | 'type'>

const schema = z.object({
  amount: z.string().refine((v) => parseAmountToCents(v) !== null, 'Enter a valid amount'),
  goalId: z.string(),
  adHocType: z.enum(['general', 'emergency_fund']),
  date: z.string().min(1, 'Date is required'),
  note: z.string(),
})
type FormValues = z.infer<typeof schema>

function resolveEntryType(
  goal: GoalOption | undefined,
  adHocType: 'general' | 'emergency_fund',
): SavingsEntryType {
  if (!goal) return adHocType
  return goal.type === 'savings' ? 'goal' : goal.type
}

interface LogSavingsModalProps {
  open: boolean
  goals: GoalOption[]
  initialGoalId: string | null
  onClose: () => void
  onSaved: () => void
}

function LogSavingsBody({
  goals,
  initialGoalId,
  onClose,
  onSaved,
}: Omit<LogSavingsModalProps, 'open'>) {
  const showToast = useToastStore((s) => s.showToast)
  const bumpSavingsVersion = useDataEventsStore((s) => s.bumpSavingsVersion)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      goalId: initialGoalId ?? '',
      adHocType: 'general',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    },
  })
  const goalId = useWatch({ control, name: 'goalId' })
  const selectedGoal = goals.find((g) => g.id === goalId)

  useEscapeToClose(true, onClose)

  async function onSubmit(values: FormValues) {
    const cents = parseAmountToCents(values.amount)
    if (cents === null) return
    try {
      await createSavingsEntry({
        amountCents: cents,
        type: resolveEntryType(selectedGoal, values.adHocType),
        goalId: values.goalId || null,
        date: values.date,
        note: values.note.trim() || null,
      })
      showToast('Savings logged')
      bumpSavingsVersion()
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
      aria-label="Log savings"
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

      <h2 className="text-text-primary mb-4 text-lg font-semibold">Log Savings</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <AmountInput
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
              autoFocus
            />
          )}
        />

        <div>
          <label className="text-text-secondary mb-1 block text-xs">Goal (optional)</label>
          <select
            {...register('goalId')}
            className="border-glass-border focus:border-accent-primary text-text-primary w-full rounded-control border bg-black/10 px-3 py-2.5 text-sm outline-none transition-colors"
          >
            <option value="">No goal (ad-hoc)</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </div>

        {!goalId && (
          <div>
            <p className="text-text-secondary mb-2 text-xs">Type</p>
            <Controller
              name="adHocType"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {(['general', 'emergency_fund'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => field.onChange(option)}
                      aria-pressed={field.value === option}
                      className={`flex-1 rounded-control border px-3 py-2 text-sm transition-colors ${
                        field.value === option
                          ? 'border-accent-primary bg-accent-primary/15 text-text-primary'
                          : 'border-glass-border text-text-secondary hover:border-glass-border-hover'
                      }`}
                    >
                      {option === 'general' ? 'General' : 'Emergency Fund'}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        )}

        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DateField value={field.value} onChange={field.onChange} error={errors.date?.message} />
          )}
        />

        <div>
          <input
            {...register('note')}
            placeholder="Note (optional)"
            className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-full rounded-control border bg-black/10 px-3 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent-primary mt-2 rounded-control py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
        >
          Log Savings
        </button>
      </form>
    </motion.div>
  )
}

export function LogSavingsModal({
  open,
  goals,
  initialGoalId,
  onClose,
  onSaved,
}: LogSavingsModalProps) {
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
          <LogSavingsBody
            goals={goals}
            initialGoalId={initialGoalId}
            onClose={onClose}
            onSaved={onSaved}
          />
        </div>
      )}
    </AnimatePresence>
  )
}
