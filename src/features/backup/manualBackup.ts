import { save } from '@tauri-apps/plugin-dialog'
import { format } from 'date-fns'
import { createManualBackup } from '../../lib/ipc/commands'
import { getErrorMessage } from '../../lib/ipc/types'

/**
 * Shared by the Backup screen's "Back Up Now" button and the global
 * `Ctrl+B` shortcut, so backup can be triggered from any screen
 * (docs/architecture/BACKUP_STRATEGY.md).
 */
export async function runManualBackup(
  showToast: (message: string, variant?: 'success' | 'error') => void,
): Promise<void> {
  try {
    const defaultPath = `finance-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.sqlite`
    const path = await save({
      defaultPath,
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }],
    })
    if (!path) return
    await createManualBackup(path)
    showToast('Backup saved')
  } catch (error) {
    showToast(getErrorMessage(error), 'error')
  }
}
