import { useTheme } from '../app/theme-context'
import type { ThemePreference } from '../app/theme-context'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/** Settings screen's full System/Light/Dark control — the header's `ThemeToggle` stays a quick light/dark flip (Ctrl+D). */
export function ThemePreferenceSelector() {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label="Theme"
      className="border-glass-border flex gap-1 rounded-control border p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
          className={`rounded-control px-3 py-1.5 text-sm transition-colors ${
            preference === option.value
              ? 'bg-accent-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
