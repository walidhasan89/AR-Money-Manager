import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { AmountInput } from '../../components/AmountInput'
import { CategoryPicker } from '../../components/CategoryPicker'
import { DateField } from '../../components/DateField'
import { createIncome, listCategories } from '../../lib/ipc/commands'
import { parseAmountToCents } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category } from '../../lib/ipc/types'
import { useEscapeToClose } from '../../lib/useEscapeToClose'
import { useUiStore } from '../../store/uiStore'
import { useToastStore } from '../../store/toastStore'

const schema = z.object({
  amount: z.string().refine((v) => parseAmountToCents(v) !== null, 'Enter a valid amount'),
  categoryId: z.string().min(1, 'Pick a category'),
  source: z.string(),
  date: z.string().min(1, 'Pick a date'),
  note: z.string(),
})
type FormValues = z.infer<typeof schema>

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function AddIncomeModal() {
  const isOpen = useUiStore((s) => s.isAddIncomeOpen)
  const close = useUiStore((s) => s.closeAddIncome)
  const showToast = useToastStore((s) => s.showToast)

  const [categories, setCategories] = useState<Category[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', categoryId: '', source: '', date: today(), note: '' },
  })

  useEffect(() => {
    if (!isOpen) return
    listCategories('income', false)
      .then(setCategories)
      .catch(() => showToast('Could not load categories', 'error'))
  }, [isOpen, showToast])

  useEffect(() => {
    if (!isOpen) return
    reset({ amount: '', categoryId: categories[0]?.id ?? '', source: '', date: today(), note: '' })
    const focusTimer = setTimeout(() => setFocus('amount'), 0)
    return () => clearTimeout(focusTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categories])

  useEscapeToClose(isOpen, close)

  async function onSubmit(values: FormValues) {
    const cents = parseAmountToCents(values.amount)
    if (cents === null) return
    try {
      await createIncome({
        amountCents: cents,
        categoryId: values.categoryId,
        source: values.source.trim() ? values.source.trim() : null,
        date: values.date,
        note: values.note.trim() ? values.note.trim() : null,
      })
      showToast('Income added')
      close()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add income"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="glass-card relative w-full max-w-md p-6"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="text-text-secondary hover:text-text-primary absolute top-4 right-4"
            >
              <X size={18} strokeWidth={1.75} />
            </button>

            <h2 className="text-text-primary mb-4 text-lg font-semibold">Add Income</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <AmountInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
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
                    value={field.value}
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
                Add Income
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
