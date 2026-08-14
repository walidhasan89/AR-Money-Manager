import { useCallback, useEffect, useState } from 'react'
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'
import { getCategoryIcon } from '../../lib/icons'
import { listCategories, setCategoryArchived } from '../../lib/ipc/commands'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category, CategoryType } from '../../lib/ipc/types'
import { useToastStore } from '../../store/toastStore'
import { CategoryFormModal } from './CategoryFormModal'

function CategoryGroup({
  title,
  categories,
  onEdit,
  onToggleArchive,
  onNew,
}: {
  title: string
  categories: Category[]
  onEdit: (category: Category) => void
  onToggleArchive: (category: Category) => void
  onNew: () => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-text-primary text-sm font-medium">{title}</h3>
        <button
          type="button"
          onClick={onNew}
          className="text-accent-primary flex items-center gap-1 text-xs"
        >
          <Plus size={12} strokeWidth={1.75} /> New
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.icon)
          return (
            <li
              key={category.id}
              className={`flex items-center justify-between rounded-control px-2 py-1.5 ${
                category.isArchived ? 'opacity-50' : ''
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden
                />
                <Icon size={14} strokeWidth={1.75} className="text-text-secondary" aria-hidden />
                <span className="text-text-primary">{category.name}</span>
                {category.isSystem && (
                  <span className="text-text-secondary text-[10px] uppercase">Default</span>
                )}
              </span>
              <span className="flex items-center gap-2">
                {!category.isSystem && (
                  <button
                    type="button"
                    onClick={() => onEdit(category)}
                    aria-label={`Edit ${category.name}`}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <Pencil size={13} strokeWidth={1.75} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onToggleArchive(category)}
                  aria-label={`${category.isArchived ? 'Unarchive' : 'Archive'} ${category.name}`}
                  className="text-text-secondary hover:text-text-primary"
                >
                  {category.isArchived ? (
                    <ArchiveRestore size={13} strokeWidth={1.75} />
                  ) : (
                    <Archive size={13} strokeWidth={1.75} />
                  )}
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function CategoryManager() {
  const showToast = useToastStore((s) => s.showToast)
  const [categories, setCategories] = useState<Category[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState<CategoryType>('expense')
  const [editing, setEditing] = useState<Category | null>(null)

  const refresh = useCallback(() => {
    listCategories(undefined, true)
      .then(setCategories)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleToggleArchive(category: Category) {
    try {
      await setCategoryArchived(category.id, !category.isArchived)
      showToast(category.isArchived ? 'Category unarchived' : 'Category archived')
      refresh()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  function openNew(type: CategoryType) {
    setFormType(type)
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setFormType(category.type)
    setEditing(category)
    setFormOpen(true)
  }

  return (
    <>
      <GlassCard className="flex flex-col gap-6">
        <div>
          <p className="text-text-primary font-medium">Categories</p>
          <p className="text-text-secondary text-sm">
            Default categories can be archived but not renamed. Custom categories are fully
            editable.
          </p>
        </div>

        <CategoryGroup
          title="Expense categories"
          categories={categories.filter((c) => c.type === 'expense')}
          onEdit={openEdit}
          onToggleArchive={handleToggleArchive}
          onNew={() => openNew('expense')}
        />
        <CategoryGroup
          title="Income categories"
          categories={categories.filter((c) => c.type === 'income')}
          onEdit={openEdit}
          onToggleArchive={handleToggleArchive}
          onNew={() => openNew('income')}
        />
      </GlassCard>

      <CategoryFormModal
        open={formOpen}
        categoryType={formType}
        category={editing}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />
    </>
  )
}
