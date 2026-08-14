export interface Shortcut {
  keys: string
  description: string
}

/** Single source of truth for every global keyboard shortcut — shown in Settings and used to build the shortcut switch itself. */
export const GLOBAL_SHORTCUTS: Shortcut[] = [
  { keys: 'Ctrl+K', description: 'Open the command palette' },
  { keys: 'Ctrl+E', description: 'Quick Add Expense' },
  { keys: 'Ctrl+I', description: 'Add Income' },
  { keys: 'Ctrl+B', description: 'Back up now' },
  { keys: 'Ctrl+D', description: 'Toggle light/dark theme' },
  { keys: 'Esc', description: 'Close the open dialog or modal' },
]
