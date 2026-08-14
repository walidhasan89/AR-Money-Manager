import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ThemeContext,
  type Theme,
  type ThemeContextValue,
  type ThemePreference,
} from './theme-context'

const STORAGE_KEY = 'pfm-theme'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function readInitialPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark'
}

/**
 * Dark/light/system per docs/ui-ux/UI_UX_GUIDE.md's Settings section; dark
 * stays the initial preference until the user opts into 'system' or 'light'
 * (docs/ui-ux/DESIGN_SYSTEM.md's "dark by default"). Persists to
 * localStorage for now — see docs/product/ASSUMPTIONS.md #22 for why this
 * isn't the `settings` table yet.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readInitialPreference)
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_MEDIA_QUERY).matches,
  )

  // Subscribes to the OS-level preference so 'system' tracks it live, even
  // while the app stays open across a change — a legitimate effect, unlike
  // deriving `theme` below, which is plain computation from other state.
  useEffect(() => {
    const media = window.matchMedia(DARK_MEDIA_QUERY)
    const onChange = () => setSystemPrefersDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const theme: Theme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function setPreference(next: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, next)
    setPreferenceState(next)
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      setPreference,
      toggleTheme: () => setPreference(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, preference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
