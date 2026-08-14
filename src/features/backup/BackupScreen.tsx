import { useCallback, useEffect, useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { open } from '@tauri-apps/plugin-dialog'
import { AlertTriangle, DatabaseBackup, Save, Upload } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { GlassCard } from '../../components/GlassCard'
import { getBackupStatus, restoreBackup } from '../../lib/ipc/commands'
import { getErrorMessage } from '../../lib/ipc/types'
import type { BackupStatus } from '../../lib/ipc/types'
import { useToastStore } from '../../store/toastStore'
import { runManualBackup } from './manualBackup'

export function BackupScreen() {
  const showToast = useToastStore((s) => s.showToast)
  const [status, setStatus] = useState<BackupStatus | null>(null)
  const [reminderDismissed, setReminderDismissed] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [pendingRestorePath, setPendingRestorePath] = useState<string | null>(null)

  const refresh = useCallback(() => {
    getBackupStatus()
      .then(setStatus)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleBackUpNow() {
    setBackingUp(true)
    try {
      await runManualBackup(showToast)
      refresh()
    } finally {
      setBackingUp(false)
    }
  }

  async function handlePickRestoreFile() {
    try {
      const path = await open({
        multiple: false,
        filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }],
      })
      if (!path) return
      setPendingRestorePath(path)
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    }
  }

  async function handleConfirmRestore() {
    if (!pendingRestorePath) return
    setRestoring(true)
    try {
      await restoreBackup(pendingRestorePath)
      showToast('Restore complete — reloading…')
      window.location.reload()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      setRestoring(false)
      setPendingRestorePath(null)
    }
  }

  const restoreFileName = pendingRestorePath?.split(/[/\\]/).pop() ?? ''

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Backup</h1>

      {status?.isStale && !reminderDismissed && (
        <div className="bg-accent-warning/10 border-accent-warning/30 flex items-center justify-between gap-3 rounded-control border px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} strokeWidth={2} className="text-accent-warning shrink-0" />
            <p className="text-text-primary text-sm">
              {status.lastManualBackupAt
                ? "It's been over 14 days since your last backup."
                : "You haven't made a backup yet."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReminderDismissed(true)}
            className="text-text-secondary hover:text-text-primary text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <GlassCard className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-glass-surface border-glass-border flex size-10 items-center justify-center rounded-full border">
            <DatabaseBackup size={18} strokeWidth={1.75} className="text-text-secondary" />
          </div>
          <div>
            <p className="text-text-primary font-medium">Manual Backup</p>
            <p className="text-text-secondary text-sm">
              {status?.lastManualBackupAt
                ? `Last backup ${formatDistanceToNow(parseISO(status.lastManualBackupAt), { addSuffix: true })}`
                : 'No backups yet'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBackUpNow}
          disabled={backingUp}
          className="bg-accent-primary flex items-center justify-center gap-1.5 self-start rounded-control px-4 py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-60"
        >
          <Save size={14} strokeWidth={2} /> {backingUp ? 'Backing up…' : 'Back Up Now'}
          <span className="text-white/60">Ctrl+B</span>
        </button>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-glass-surface border-glass-border flex size-10 items-center justify-center rounded-full border">
            <Upload size={18} strokeWidth={1.75} className="text-text-secondary" />
          </div>
          <div>
            <p className="text-text-primary font-medium">Restore</p>
            <p className="text-text-secondary text-sm">
              Replace all current data with a previously saved backup file.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handlePickRestoreFile}
          disabled={restoring}
          className="border-glass-border text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 self-start rounded-control border px-4 py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          <Upload size={14} strokeWidth={1.75} /> Restore from Backup…
        </button>
      </GlassCard>

      <ConfirmDialog
        open={pendingRestorePath !== null}
        title="Restore this backup?"
        description={`This replaces all current data with the contents of "${restoreFileName}". Your current data will be safely copied first, but this can't be undone from within the app. The app will reload when it's done.`}
        confirmLabel={restoring ? 'Restoring…' : 'Restore'}
        danger
        onConfirm={handleConfirmRestore}
        onCancel={() => setPendingRestorePath(null)}
      />
    </div>
  )
}
