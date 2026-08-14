import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../app/theme-context'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="border-glass-border bg-glass-surface text-text-secondary hover:text-text-primary hover:border-glass-border-hover flex size-9 items-center justify-center rounded-control border transition-[color,border-color,transform] duration-100 active:scale-[0.97]"
    >
      {isDark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
    </button>
  )
}
