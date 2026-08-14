import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AmountInput } from '../../components/AmountInput'
import { CategoryPicker } from '../../components/CategoryPicker'
import { createFixedExpense, listCategories, updateFixedExpense } from '../../lib/ipc/commands'
import { parseAmountToCents } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category, FixedExpense } from '../../lib/ipc/types'
import { useEscapeToClose } from '../../lib/useEscapeToClose'
import { useToastStore } from '../../store/toastStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.string().refine((v) => parseAmountToCents(v) !== null, 'Enter a valid amount'),
  categoryId: z.string().min(1, 'Pick a category'),
  dayOfMonth: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 28, 'Day 1–28'),
})
type FormValues = z.infer<typeof schema>

interface FixedExpenseFormModalProps {
  open: boolean
  template: FixedExpense | null
  onClose: () => void
  onSaved: () => void
}

export function FixedExpenseFormModal({
  open,
  template,
  onClose,
  onSaved,
}: FixedExpenseFormModalProps) {
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
    if (!open) return
    listCategories('expense', true)
      .then(setCategories)
      .catch(() => showToast('Could not load categories', 'error'))
    reset({
      name: template?.name ?? '',
      amount: template ? (template.amountCents / 100).toFixed(2) : '',
      categoryId: template?.categoryId ?? '',
      dayOfMonth: template ? String(template.dayOfMonth) : '1',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template])

  useEscapeToClose(open, onClose)

  async function onSubmit(values: FormValues) {
    const cents = parseAmountToCents(values.amount)
    if (cents === null) return
    try {
      if (template) {
        await updateFixedExpense(template.id, {
          name: values.name,
          amountCents: cents,
          categoryId: values.categoryId,
          dayOfMonth: Number(values.dayOfMonth),
          isActive: template.isActive,
        })
        showToast('Fixed expense updated')
      } else {
        await createFixedExpense({
          name: values.name,
          amountCents: cents,
          categoryId: values.categoryId,
          dayOfMonth: Number(values.dayOfMonth),
        })
        showToast('Fixed expense created')
      }
      onSaved()
      onClose()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <AnimatePresence>
      {open && (
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
            aria-label={template ? 'Edit fixed expense' : 'New fixed expense'}
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

            <h2 className="text-text-primary mb-4 text-lg font-semibold">
              {template ? 'Edit Fixed Expense' : 'New Fixed Expense'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <input
                  {...register('name')}
                  placeholder="Name (e.g. House Rent)"
                  className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-full rounded-control border bg-black/10 px-3 py-2.5 text-sm outline-none transition-colors"
                />
                {errors.name && (
                  <p className="text-accent-danger mt-1 text-xs">{errors.name.message}</p>
                )}
              </div>

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

              <div>
                <label className="text-text-secondary mb-1 block text-xs">
                  Day of month due (1–28)
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  {...register('dayOfMonth')}
                  className="border-glass-border focus:border-accent-primary text-text-primary w-24 rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
                />
                {errors.dayOfMonth && (
                  <p className="text-accent-danger mt-1 text-xs">{errors.dayOfMonth.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent-primary mt-2 rounded-control py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
              >
                {template ? 'Save Changes' : 'Create Template'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
