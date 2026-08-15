import { Keyboard } from 'lucide-react'
import { GLOBAL_SHORTCUTS } from '../../app/shortcuts'
import { GlassCard } from '../../components/GlassCard'

export function ShortcutsReference() {
  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-glass-surface border-glass-border flex size-10 items-center justify-center rounded-full border">
          <Keyboard size={18} strokeWidth={1.75} className="text-text-secondary" />
        </div>
        <div>
          <p className="text-text-primary font-medium">Keyboard shortcuts</p>
          <p className="text-text-secondary text-sm">Available from anywhere in the app.</p>
        </div>
      </div>
      <ul className="divide-glass-border flex flex-col divide-y">
        {GLOBAL_SHORTCUTS.map((shortcut) => (
          <li key={shortcut.keys} className="flex items-center justify-between py-2 text-sm">
            <span className="text-text-secondary">{shortcut.description}</span>
            <kbd className="border-glass-border bg-glass-surface text-text-primary rounded-control border px-2 py-1 font-mono text-xs">
              {shortcut.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
