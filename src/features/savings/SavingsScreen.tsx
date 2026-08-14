import { useCallback, useEffect, useState } from 'react'
import { PiggyBank, Plus, Wallet } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { GlassCard } from '../../components/GlassCard'
import { listGoalProgress, listSavingsEntries, setGoalActive } from '../../lib/ipc/commands'
import { getErrorMessage } from '../../lib/ipc/types'
import type { GoalProgress, SavingsEntry } from '../../lib/ipc/types'
import { useToastStore } from '../../store/toastStore'
import { GoalCard } from './GoalCard'
import { GoalFormModal } from './GoalFormModal'
import { LogSavingsModal } from './LogSavingsModal'
import { SavingsEntriesList } from './SavingsEntriesList'

export function SavingsScreen() {
  const showToast = useToastStore((s) => s.showToast)
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [entries, setEntries] = useState<SavingsEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalProgress | null>(null)
  const [archiving, setArchiving] = useState<GoalProgress | null>(null)
  const [logSavingsOpen, setLogSavingsOpen] = useState(false)
  const [logSavingsGoalId, setLogSavingsGoalId] = useState<string | null>(null)

  const refresh = useCallback(() => {
    Promise.all([listGoalProgress(false), listSavingsEntries()])
      .then(([nextGoals, nextEntries]) => {
        setGoals(nextGoals)
        setEntries(nextEntries)
        setLoaded(true)
      })
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function openNewGoal() {
    setEditingGoal(null)
    setGoalFormOpen(true)
  }

  function openEditGoal(goal: GoalProgress) {
    setEditingGoal(goal)
    setGoalFormOpen(true)
  }

  function openLogSavings(goalId: string | null) {
    setLogSavingsGoalId(goalId)
    setLogSavingsOpen(true)
  }

  async function handleConfirmArchive() {
    if (!archiving) return
    try {
      await setGoalActive(archiving.id, false)
      showToast(`${archiving.name} archived`)
      refresh()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setArchiving(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Savings</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openLogSavings(null)}
            className="border-glass-border text-text-secondary hover:text-text-primary flex items-center gap-1.5 rounded-control border px-3 py-2 text-sm transition-colors"
          >
            <Wallet size={14} strokeWidth={1.75} /> Log Savings
          </button>
          <button
            type="button"
            onClick={openNewGoal}
            className="bg-accent-primary flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium text-white transition-[transform] duration-100 active:scale-[0.97]"
          >
            <Plus size={14} strokeWidth={2} /> New Goal
          </button>
        </div>
      </div>

      {!loaded ? (
        <p className="text-text-secondary text-sm">Loading…</p>
      ) : (
        <>
          {goals.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon={PiggyBank}
                title="No goals yet"
                description="Create a savings goal, DPS plan, or emergency fund to start tracking progress."
              />
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onContribute={openLogSavings}
                  onEdit={openEditGoal}
                  onArchive={setArchiving}
                />
              ))}
            </div>
          )}

          <GlassCard>
            <h2 className="text-text-primary mb-4 font-medium">All Savings</h2>
            <SavingsEntriesList entries={entries} onChanged={refresh} />
          </GlassCard>
        </>
      )}

      <GoalFormModal
        open={goalFormOpen}
        goal={editingGoal}
        onClose={() => setGoalFormOpen(false)}
        onSaved={refresh}
      />

      <LogSavingsModal
        open={logSavingsOpen}
        goals={goals}
        initialGoalId={logSavingsGoalId}
        onClose={() => setLogSavingsOpen(false)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={archiving !== null}
        title="Archive this goal?"
        description={
          archiving
            ? `${archiving.name} will move out of your active goals. Its logged contributions and history are kept.`
            : ''
        }
        confirmLabel="Archive"
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  )
}
