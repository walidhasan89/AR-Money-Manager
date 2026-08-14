import { DatabaseBackup } from 'lucide-react'
import { PlaceholderScreen } from '../../components/PlaceholderScreen'

export function BackupScreen() {
  return (
    <PlaceholderScreen
      title="Backup"
      icon={DatabaseBackup}
      phase={7}
      description="Manual backup/restore, automatic safety copies, and CSV export/import."
    />
  )
}
