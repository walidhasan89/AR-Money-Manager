import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AmountInput } from '../../components/AmountInput'
import { DateField } from '../../components/DateField'
import { confirmFixedExpense } from '../../lib/ipc/commands'
import { parseAmountToCents } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { PendingFixedExpense } from '../../lib/ipc/types'
import { useToastStore } from '../../store/toastStore'

const schema = z.object({
  amount: z.string().refine((v) => parseAmountToCents(v) !== null, 'Enter a valid amount'),
  date: z.string().min(1, 'Pick a date'),
  note: z.string(),
})
type FormValues = z.infer<typeof schema>

interface ConfirmFixedExpenseModalProps {
  pending: PendingFixedExpense | null
  onClose: () => void
  onConfirmed: () => void
}

function ConfirmFixedExpenseBody({
  pending,
  onClose,
  onConfirmed,
}: {
  pending: PendingFixedExpense
  onClose: () => void
  onConfirmed: () => void
}) {
  const showToast = useToastStore((s) => s.showToast)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: (pending.amountCents / 100).toFixed(2),
      date: pending.dueDate,
      note: '',
    },
  })

  async function onSubmit(values: FormValues) {
    const cents = parseAmountToCents(values.amount)
    if (cents === null) return
    try {
      await confirmFixedExpense({
        fixedExpenseId: pending.fixedExpenseId,
        amountCents: cents,
        date: values.date,
        note: values.note.trim() ? values.note.trim() : null,
      })
      showToast(`${pending.name} confirmed`)
      onConfirmed()
      onClose()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Confirm ${pending.name}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="glass-card relative w-full max-w-sm p-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-text-secondary hover:text-text-primary absolute top-4 right-4"
      >
        <X size={18} strokeWidth={1.75} />
      </button>

      <h2 className="text-text-primary mb-1 text-lg font-semibold">Confirm {pending.name}</h2>
      <p className="text-text-secondary mb-4 text-sm">{pending.categoryName}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <AmountInput
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
            />
          )}
        />
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DateField value={field.value} onChange={field.onChange} error={errors.date?.message} />
          )}
        />
        <textarea
          {...register('note')}
          placeholder="Note (optional)"
          rows={2}
          className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-full resize-none rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent-primary mt-2 rounded-control py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
        >
          Confirm & Post Expense
        </button>
      </form>
    </motion.div>
  )
}

export function ConfirmFixedExpenseModal({
  pending,
  onClose,
  onConfirmed,
}: ConfirmFixedExpenseModalProps) {
  return (
    <AnimatePresence>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <ConfirmFixedExpenseBody pending={pending} onClose={onClose} onConfirmed={onConfirmed} />
        </div>
      )}
    </AnimatePresence>
  )
}
