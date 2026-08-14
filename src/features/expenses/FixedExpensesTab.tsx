import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Repeat as RepeatIcon, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { GlassCard } from '../../components/GlassCard'
import { getCategoryIcon } from '../../lib/icons'
import { deleteFixedExpense, listFixedExpenses } from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { FixedExpense } from '../../lib/ipc/types'
import { useToastStore } from '../../store/toastStore'
import { FixedExpenseFormModal } from './FixedExpenseFormModal'

export function FixedExpensesTab() {
  const showToast = useToastStore((s) => s.showToast)
  const [templates, setTemplates] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FixedExpense | null>(null)
  const [deleting, setDeleting] = useState<FixedExpense | null>(null)

  const refresh = useCallback(() => {
    listFixedExpenses()
      .then(setTemplates)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteFixedExpense(deleting.id)
      showToast('Fixed expense deleted')
      setDeleting(null)
      refresh()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="bg-accent-primary flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.97]"
        >
          <Plus size={14} strokeWidth={1.75} /> New Template
        </button>
      </div>

      <GlassCard className="p-0">
        {loading ? (
          <p className="text-text-secondary p-6 text-sm">Loading…</p>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={RepeatIcon}
            title="No fixed expenses yet"
            description="Set up recurring bills like rent or utilities so they show up as a monthly reminder."
          />
        ) : (
          <ul>
            {templates.map((template) => {
              const Icon = getCategoryIcon(template.categoryIcon)
              return (
                <li
                  key={template.id}
                  className="border-glass-border/50 flex items-center justify-between border-b px-4 py-3 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: template.categoryColor }}
                      aria-hidden
                    />
                    <Icon
                      size={14}
                      strokeWidth={1.75}
                      className="text-text-secondary"
                      aria-hidden
                    />
                    <div>
                      <p className="text-text-primary text-sm font-medium">{template.name}</p>
                      <p className="text-text-secondary text-xs">
                        Due day {template.dayOfMonth} · {template.categoryName}
                        {!template.isActive && ' · Paused'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-primary text-sm tabular-nums">
                      {formatCurrency(template.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(template)
                        setFormOpen(true)
                      }}
                      aria-label={`Edit ${template.name}`}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(template)}
                      aria-label={`Delete ${template.name}`}
                      className="text-text-secondary hover:text-accent-danger"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </GlassCard>

      <FixedExpenseFormModal
        open={formOpen}
        template={editing}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this fixed expense template?"
        description={
          deleting
            ? `"${deleting.name}" won't generate any more monthly pending items. Expenses already posted from it are kept.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
