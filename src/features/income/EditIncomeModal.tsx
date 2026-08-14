import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AmountInput } from '../../components/AmountInput'
import { CategoryPicker } from '../../components/CategoryPicker'
import { DateField } from '../../components/DateField'
import { listCategories, updateIncome } from '../../lib/ipc/commands'
import { parseAmountToCents } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category, Income } from '../../lib/ipc/types'
import { useToastStore } from '../../store/toastStore'

const schema = z.object({
  amount: z.string().refine((v) => parseAmountToCents(v) !== null, 'Enter a valid amount'),
  categoryId: z.string().min(1, 'Pick a category'),
  source: z.string(),
  date: z.string().min(1, 'Pick a date'),
  note: z.string(),
})
type FormValues = z.infer<typeof schema>

interface EditIncomeModalProps {
  income: Income | null
  onClose: () => void
  onSaved: () => void
}

export function EditIncomeModal({ income, onClose, onSaved }: EditIncomeModalProps) {
  const showToast = useToastStore((s) => s.showToast)
  const [categories, setCategories] = useState<Category[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!income) return
    listCategories('income', true)
      .then(setCategories)
      .catch(() => showToast('Could not load categories', 'error'))
    reset({
      amount: (income.amountCents / 100).toFixed(2),
      categoryId: income.categoryId,
      source: income.source ?? '',
      date: income.date,
      note: income.note ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income])

  async function onSubmit(values: FormValues) {
    if (!income) return
    const cents = parseAmountToCents(values.amount)
    if (cents === null) return
    try {
      await updateIncome(income.id, {
        amountCents: cents,
        categoryId: values.categoryId,
        source: values.source.trim() ? values.source.trim() : null,
        date: values.date,
        note: values.note.trim() ? values.note.trim() : null,
      })
      showToast('Income updated')
      onSaved()
      onClose()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <AnimatePresence>
      {income && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Edit income"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="glass-card relative w-full max-w-md p-6"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-text-secondary hover:text-text-primary absolute top-4 right-4"
            >
              <X size={18} strokeWidth={1.75} />
            </button>

            <h2 className="text-text-primary mb-4 text-lg font-semibold">Edit Income</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <AmountInput
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.amount?.message}
                  />
                )}
              />
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <CategoryPicker
                    categories={categories}
                    value={field.value || null}
                    onChange={field.onChange}
                    error={errors.categoryId?.message}
                  />
                )}
              />
              <input
                {...register('source')}
                placeholder="Source (e.g. employer name)"
                className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-full rounded-control border bg-black/10 px-3 py-2.5 text-sm outline-none transition-colors"
              />
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DateField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.date?.message}
                  />
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
                className="bg-accent-success mt-2 rounded-control py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
              >
                Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
