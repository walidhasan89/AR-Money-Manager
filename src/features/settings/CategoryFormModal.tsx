import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createCategory, updateCategory } from '../../lib/ipc/commands'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category, CategoryType } from '../../lib/ipc/types'
import { CATEGORY_COLORS } from '../../lib/categoryColors'
import { CATEGORY_ICONS } from '../../lib/icons'
import { useEscapeToClose } from '../../lib/useEscapeToClose'
import { useToastStore } from '../../store/toastStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})
type FormValues = z.infer<typeof schema>

interface CategoryFormModalProps {
  open: boolean
  categoryType: CategoryType
  category: Category | null
  onClose: () => void
  onSaved: () => void
}

/**
 * Only mounted while `open` is true, so its icon/color/name state always
 * initializes fresh from `category` — no reset-on-prop-change effect needed.
 */
function CategoryFormBody({
  categoryType,
  category,
  onClose,
  onSaved,
}: Omit<CategoryFormModalProps, 'open'>) {
  const showToast = useToastStore((s) => s.showToast)
  const [icon, setIcon] = useState(category?.icon ?? 'shopping-cart')
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]!)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: category?.name ?? '' },
  })

  useEscapeToClose(true, onClose)

  async function onSubmit(values: FormValues) {
    try {
      if (category) {
        await updateCategory(category.id, { name: values.name, icon, color })
        showToast('Category updated')
      } else {
        await createCategory({ name: values.name, type: categoryType, icon, color })
        showToast('Category created')
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
      aria-label={category ? 'Edit category' : 'New category'}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="glass-modal relative w-full max-w-sm p-6"
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
        {category
          ? 'Edit Category'
          : `New ${categoryType === 'expense' ? 'Expense' : 'Income'} Category`}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            {...register('name')}
            placeholder="Category name"
            className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-full rounded-control border bg-black/10 px-3 py-2.5 text-sm outline-none transition-colors"
          />
          {errors.name && <p className="text-accent-danger mt-1 text-xs">{errors.name.message}</p>}
        </div>

        <div>
          <p className="text-text-secondary mb-2 text-xs">Icon</p>
          <div className="grid grid-cols-8 gap-2">
            {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                aria-label={name}
                aria-pressed={icon === name}
                className={`flex size-8 items-center justify-center rounded-control border transition-colors ${
                  icon === name
                    ? 'border-accent-primary bg-accent-primary/15'
                    : 'border-glass-border hover:border-glass-border-hover'
                }`}
              >
                <Icon size={14} strokeWidth={1.75} className="text-text-primary" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-text-secondary mb-2 text-xs">Color</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                aria-pressed={color === c}
                className={`size-7 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-110 border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent-primary mt-2 rounded-control py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
        >
          {category ? 'Save Changes' : 'Create Category'}
        </button>
      </form>
    </motion.div>
  )
}

export function CategoryFormModal({
  open,
  categoryType,
  category,
  onClose,
  onSaved,
}: CategoryFormModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-glass-modal-backdrop"
            onClick={onClose}
          />
          <CategoryFormBody
            categoryType={categoryType}
            category={category}
            onClose={onClose}
            onSaved={onSaved}
          />
        </div>
      )}
    </AnimatePresence>
  )
}
