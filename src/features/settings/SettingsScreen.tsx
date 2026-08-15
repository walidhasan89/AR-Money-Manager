import { useEffect, useState } from 'react'
import { CurrencySelector } from '../../components/CurrencySelector'
import { GlassCard } from '../../components/GlassCard'
import { ThemePreferenceSelector } from '../../components/ThemePreferenceSelector'
import { getAppVersion } from '../../lib/ipc/commands'
import { CategoryManager } from './CategoryManager'
import { ShortcutsReference } from './ShortcutsReference'

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
      {/* relative z-10: without an explicit stacking order, this card and
          ShortcutsReference below it (siblings, each their own stacking
          context via backdrop-filter) paint in DOM order — so the currency
          dropdown, which extends past this card's bottom edge while open,
          would get covered by ShortcutsReference painting on top of it. */}
      <GlassCard className="divide-glass-border relative z-10 flex flex-col divide-y">
        <div className="flex items-center justify-between pb-4">
          <div>
            <p className="text-text-primary font-medium">Theme</p>
            <p className="text-text-secondary text-sm">Dark by default, or follow your OS.</p>
          </div>
          <ThemePreferenceSelector />
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-text-primary font-medium">Currency</p>
            <p className="text-text-secondary text-sm">
              Changes the symbol shown throughout the app — amounts aren't converted.
            </p>
          </div>
          <CurrencySelector />
        </div>
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-text-primary font-medium">App version</p>
            <p className="text-text-secondary text-sm">Reported live via the Tauri IPC bridge.</p>
          </div>
          <p className="text-text-primary tabular-nums">{version ?? '…'}</p>
        </div>
      </GlassCard>

      <ShortcutsReference />

      <CategoryManager />
    </div>
  )
}
