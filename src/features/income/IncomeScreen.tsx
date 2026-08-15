import { useCallback, useEffect, useState } from 'react'
import { save } from '@tauri-apps/plugin-dialog'
import { Download, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EntryFilterBar } from '../../components/EntryFilterBar'
import { EmptyState } from '../../components/EmptyState'
import { GlassCard } from '../../components/GlassCard'
import { getCategoryIcon } from '../../lib/icons'
import { deleteIncome, exportIncomeCsv, listCategories, listIncome } from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Category, Income } from '../../lib/ipc/types'
import { useDataEventsStore } from '../../store/dataEventsStore'
import { useIncomeFilterStore } from '../../store/incomeFilterStore'
import { useToastStore } from '../../store/toastStore'
import { useUiStore } from '../../store/uiStore'
import { EditIncomeModal } from './EditIncomeModal'

export function IncomeScreen() {
  const filter = useIncomeFilterStore((s) => s.filter)
  const setFilter = useIncomeFilterStore((s) => s.setFilter)
  const showToast = useToastStore((s) => s.showToast)
  const openAddIncome = useUiStore((s) => s.openAddIncome)
  const bumpIncomeVersion = useDataEventsStore((s) => s.bumpIncomeVersion)

  const [categories, setCategories] = useState<Category[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Income | null>(null)
  const [deleting, setDeleting] = useState<Income | null>(null)

  const refresh = useCallback(() => {
    listIncome(filter)
      .then(setIncome)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useEffect(() => {
    listCategories('income', true)
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
        defaultPath: 'income.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      })
      if (!path) return
      await exportIncomeCsv(path, filter)
      showToast('Income exported')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteIncome(deleting.id)
      showToast('Income deleted')
      bumpIncomeVersion()
      setDeleting(null)
      refresh()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Income</h1>
      </div>

      <EntryFilterBar categories={categories} filter={filter} onChange={setFilter} />

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
          onClick={openAddIncome}
          className="bg-accent-success flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium text-black transition-[transform] duration-100 active:scale-[0.97]"
        >
          <Plus size={14} strokeWidth={1.75} /> Add Income
        </button>
      </div>

      <GlassCard className="p-0">
        {loading ? (
          <p className="text-text-secondary p-6 text-sm">Loading…</p>
        ) : income.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No income logged yet"
            description="Add your first income entry with the Add Income button above."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary border-glass-border border-b text-left text-xs uppercase">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {income.map((entry) => {
                const Icon = getCategoryIcon(entry.categoryIcon)
                return (
                  <tr key={entry.id} className="border-glass-border/50 border-b last:border-0">
                    <td className="text-text-secondary px-4 py-3 tabular-nums">{entry.date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: entry.categoryColor }}
                          aria-hidden
                        />
                        <Icon
                          size={14}
                          strokeWidth={1.75}
                          className="text-text-secondary"
                          aria-hidden
                        />
                        <span className="text-text-primary">{entry.categoryName}</span>
                      </span>
                    </td>
                    <td className="text-text-secondary px-4 py-3">{entry.source ?? '—'}</td>
                    <td className="text-text-secondary px-4 py-3">{entry.note ?? '—'}</td>
                    <td className="text-accent-success px-4 py-3 text-right tabular-nums">
                      {formatCurrency(entry.amountCents)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(entry)}
                          aria-label={`Edit income of ${formatCurrency(entry.amountCents)} on ${entry.date}`}
                          className="text-text-secondary hover:text-text-primary"
                        >
                          <Pencil size={14} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(entry)}
                          aria-label={`Delete income of ${formatCurrency(entry.amountCents)} on ${entry.date}`}
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

      <EditIncomeModal income={editing} onClose={() => setEditing(null)} onSaved={refresh} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this income entry?"
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
