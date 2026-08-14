import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Landmark, PiggyBank, ShieldCheck, Trash2, Wallet, type LucideIcon } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { deleteSavingsEntry } from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { getErrorMessage } from '../../lib/ipc/types'
import type { SavingsEntry, SavingsEntryType } from '../../lib/ipc/types'
import { useDataEventsStore } from '../../store/dataEventsStore'
import { useToastStore } from '../../store/toastStore'

const TYPE_ICON: Record<SavingsEntryType, LucideIcon> = {
  general: Wallet,
  dps: Landmark,
  emergency_fund: ShieldCheck,
  goal: PiggyBank,
}

const TYPE_LABEL: Record<SavingsEntryType, string> = {
  general: 'General',
  dps: 'DPS',
  emergency_fund: 'Emergency Fund',
  goal: 'Goal',
}

interface SavingsEntriesListProps {
  entries: SavingsEntry[]
  onChanged: () => void
}

export function SavingsEntriesList({ entries, onChanged }: SavingsEntriesListProps) {
  const showToast = useToastStore((s) => s.showToast)
  const bumpSavingsVersion = useDataEventsStore((s) => s.bumpSavingsVersion)
  const [pendingDelete, setPendingDelete] = useState<SavingsEntry | null>(null)

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteSavingsEntry(pendingDelete.id)
      showToast('Entry deleted')
      bumpSavingsVersion()
      onChanged()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No savings logged yet"
        description="Contributions you log, ad-hoc or against a goal, will show up here."
      />
    )
  }

  return (
    <>
      <ul>
        {entries.map((entry) => {
          const Icon = TYPE_ICON[entry.type]
          return (
            <li
              key={entry.id}
              className="border-glass-border/50 flex items-center justify-between border-b py-2.5 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <Icon size={14} strokeWidth={1.75} className="text-text-secondary" aria-hidden />
                <div>
                  <p className="text-text-primary text-sm font-medium">
                    {entry.goalName ?? TYPE_LABEL[entry.type]}
                  </p>
                  <p className="text-text-secondary text-xs">
                    {TYPE_LABEL[entry.type]} · {format(parseISO(entry.date), 'MMM d, yyyy')}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-primary text-sm tabular-nums">
                  {formatCurrency(entry.amountCents)}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingDelete(entry)}
                  aria-label={`Delete entry from ${entry.date}`}
                  className="text-text-secondary hover:text-accent-danger p-1"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this entry?"
        description={
          pendingDelete
            ? `This removes the ${formatCurrency(pendingDelete.amountCents)} entry from ${format(parseISO(pendingDelete.date), 'MMM d, yyyy')}. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
