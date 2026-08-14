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
import { createExpense, listCategories } from '../../lib/ipc/commands'
import { parseAmountToCents } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category } from '../../lib/ipc/types'
import { useEscapeToClose } from '../../lib/useEscapeToClose'
import { useUiStore } from '../../store/uiStore'
import { useToastStore } from '../../store/toastStore'
import { useDataEventsStore } from '../../store/dataEventsStore'

const schema = z.object({
  amount: z.string().refine((v) => parseAmountToCents(v) !== null, 'Enter a valid amount'),
  categoryId: z.string().min(1, 'Pick a category'),
  date: z.string().min(1, 'Pick a date'),
  note: z.string(),
})
type FormValues = z.infer<typeof schema>

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function QuickAddExpenseModal() {
  const isOpen = useUiStore((s) => s.isQuickAddOpen)
  const close = useUiStore((s) => s.closeQuickAdd)
  const lastUsedCategoryId = useUiStore((s) => s.lastUsedExpenseCategoryId)
  const setLastUsedCategoryId = useUiStore((s) => s.setLastUsedExpenseCategoryId)
  const showToast = useToastStore((s) => s.showToast)
  const bumpExpensesVersion = useDataEventsStore((s) => s.bumpExpensesVersion)

  const [categories, setCategories] = useState<Category[]>([])
  const [noteOpen, setNoteOpen] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', categoryId: '', date: today(), note: '' },
  })

  useEffect(() => {
    if (!isOpen) return
    listCategories('expense', false)
      .then(setCategories)
      .catch(() => showToast('Could not load categories', 'error'))
  }, [isOpen, showToast])

  useEffect(() => {
    if (!isOpen) return
    const defaultCategory =
      categories.find((c) => c.id === lastUsedCategoryId)?.id ?? categories[0]?.id ?? ''
    reset({ amount: '', categoryId: defaultCategory, date: today(), note: '' })
    const focusTimer = setTimeout(() => setFocus('amount'), 0)
    return () => clearTimeout(focusTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categories])

  function handleClose() {
    setNoteOpen(false)
    close()
  }

  useEscapeToClose(isOpen, handleClose)

  async function onSubmit(values: FormValues) {
    const cents = parseAmountToCents(values.amount)
    if (cents === null) return
    try {
      await createExpense({
        amountCents: cents,
        categoryId: values.categoryId,
        date: values.date,
        note: values.note.trim() ? values.note.trim() : null,
      })
      setLastUsedCategoryId(values.categoryId)
      bumpExpensesVersion()
      showToast('Expense added')
      handleClose()
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
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick add expense"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="glass-card relative w-full max-w-md p-6"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="text-text-secondary hover:text-text-primary absolute top-4 right-4"
            >
              <X size={18} strokeWidth={1.75} />
            </button>

            <h2 className="text-text-primary mb-4 text-lg font-semibold">Quick Add Expense</h2>

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

              {noteOpen ? (
                <textarea
                  {...register('note')}
                  placeholder="Note (optional)"
                  rows={2}
                  className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-full resize-none rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="text-accent-primary self-start text-xs"
                >
                  + Add note
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent-primary mt-2 rounded-control py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
              >
                Add Expense
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
