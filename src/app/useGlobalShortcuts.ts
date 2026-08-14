import { useEffect } from 'react'
import { runManualBackup } from '../features/backup/manualBackup'
import { useToastStore } from '../store/toastStore'
import { useUiStore } from '../store/uiStore'
import { useTheme } from './theme-context'

/** Ctrl+E / Ctrl+I / Ctrl+D / Ctrl+B / Ctrl+K per docs/ui-ux/UI_UX_GUIDE.md's shortcut table. */
export function useGlobalShortcuts() {
  const openQuickAdd = useUiStore((s) => s.openQuickAdd)
  const openAddIncome = useUiStore((s) => s.openAddIncome)
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette)
  const { toggleTheme } = useTheme()
  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return
      switch (e.key.toLowerCase()) {
        case 'e':
          e.preventDefault()
          openQuickAdd()
          break
        case 'i':
          e.preventDefault()
          openAddIncome()
          break
        case 'd':
          e.preventDefault()
          toggleTheme()
          break
        case 'b':
          e.preventDefault()
          runManualBackup(showToast)
          break
        case 'k':
          e.preventDefault()
          toggleCommandPalette()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openQuickAdd, openAddIncome, toggleTheme, showToast, toggleCommandPalette])
}
