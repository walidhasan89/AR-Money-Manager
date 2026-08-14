import { useEffect, useState } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { ThemeToggle } from '../../components/ThemeToggle'
import { getAppVersion } from '../../lib/ipc/commands'
import { CategoryManager } from './CategoryManager'

export function SettingsScreen() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    getAppVersion()
      .then(setVersion)
      .catch(() => setVersion('unknown'))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Settings</h1>
      <GlassCard className="divide-glass-border flex flex-col divide-y">
        <div className="flex items-center justify-between pb-4">
          <div>
            <p className="text-text-primary font-medium">Theme</p>
            <p className="text-text-secondary text-sm">Dark by default, switch anytime.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-text-primary font-medium">Currency</p>
            <p className="text-text-secondary text-sm">BDT (৳) — configurable later.</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-text-primary font-medium">App version</p>
            <p className="text-text-secondary text-sm">Reported live via the Tauri IPC bridge.</p>
          </div>
          <p className="text-text-primary tabular-nums">{version ?? '…'}</p>
        </div>
      </GlassCard>

      <CategoryManager />
    </div>
  )
}
