import { createContext, useContext } from 'react'

export type Theme = 'dark' | 'light'
export type ThemePreference = 'system' | Theme

export interface ThemeContextValue {
  /** The resolved theme actually applied to the document — 'system' is never exposed here. */
  theme: Theme
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  /** Flips between light/dark for the header's compact button (docs/ui-ux/DESIGN_SYSTEM.md's Ctrl+D); moves off 'system' if that was selected. */
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
