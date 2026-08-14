import { useCallback, useEffect, useState } from 'react'
import { save } from '@tauri-apps/plugin-dialog'
import { Download, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EntryFilterBar } from '../../components/EntryFilterBar'
import { EmptyState } from '../../components/EmptyState'
import { GlassCard } from '../../components/GlassCard'
import { getCategoryIcon } from '../../lib/icons'
import {
  deleteExpense,
  exportExpensesCsv,
  listCategories,
  listExpenses,
} from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category, Expense } from '../../lib/ipc/types'
import { useExpensesFilterStore } from '../../store/expensesFilterStore'
import { useToastStore } from '../../store/toastStore'
import { useUiStore } from '../../store/uiStore'
import { EditExpenseModal } from './EditExpenseModal'

export function ExpensesTable() {
  const filter = useExpensesFilterStore((s) => s.filter)
  const setFilter = useExpensesFilterStore((s) => s.setFilter)
  const showToast = useToastStore((s) => s.showToast)
  const openQuickAdd = useUiStore((s) => s.openQuickAdd)

  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const refresh = useCallback(() => {
    listExpenses(filter)
      .then(setExpenses)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useEffect(() => {
    listCategories('expense', true)
      .then(setCategories)
      .catch(() => showToast('Could not load categories', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleExport() {
    try {
      const path = await save({
        defaultPath: 'expenses.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      })
      if (!path) return
      await exportExpensesCsv(path, filter)
      showToast('Expenses exported')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteExpense(deleting.id)
      showToast('Expense deleted')
      setDeleting(null)
      refresh()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <EntryFilterBar categories={categories} filter={filter} onChange={setFilter} />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="border-glass-border text-text-secondary hover:text-text-primary flex items-center gap-1.5 rounded-control border px-3 py-2 text-sm transition-colors"
        >
          <Download size={14} strokeWidth={1.75} /> Export CSV
        </button>
        <button
          type="button"
          onClick={openQuickAdd}
          className="bg-accent-primary flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.97]"
        >
          <Plus size={14} strokeWidth={1.75} /> Add
        </button>
      </div>

      <GlassCard className="p-0">
        {loading ? (
          <p className="text-text-secondary p-6 text-sm">Loading…</p>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Add your first expense with Ctrl+E or the Add button above."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary border-glass-border border-b text-left text-xs uppercase">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const Icon = getCategoryIcon(expense.categoryIcon)
                return (
                  <tr key={expense.id} className="border-glass-border/50 border-b last:border-0">
                    <td className="text-text-secondary px-4 py-3 tabular-nums">{expense.date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: expense.categoryColor }}
                          aria-hidden
                        />
                        <Icon
                          size={14}
                          strokeWidth={1.75}
                          className="text-text-secondary"
                          aria-hidden
                        />
                        <span className="text-text-primary">{expense.categoryName}</span>
                      </span>
                    </td>
                    <td className="text-text-secondary px-4 py-3">{expense.note ?? '—'}</td>
                    <td className="text-text-primary px-4 py-3 text-right tabular-nums">
                      {formatCurrency(expense.amountCents)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(expense)}
                          aria-label={`Edit expense of ${formatCurrency(expense.amountCents)} on ${expense.date}`}
                          className="text-text-secondary hover:text-text-primary"
                        >
                          <Pencil size={14} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(expense)}
                          aria-label={`Delete expense of ${formatCurrency(expense.amountCents)} on ${expense.date}`}
                          className="text-text-secondary hover:text-accent-danger"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </GlassCard>

      <EditExpenseModal expense={editing} onClose={() => setEditing(null)} onSaved={refresh} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this expense?"
        description={
          deleting
            ? `${formatCurrency(deleting.amountCents)} · ${deleting.categoryName} · ${deleting.date}. This removes it from your records.`
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
