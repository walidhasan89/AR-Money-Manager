import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Plus, Save, Search, Wallet, type LucideIcon } from 'lucide-react'
import { runManualBackup } from '../features/backup/manualBackup'
import { useToastStore } from '../store/toastStore'
import { useUiStore } from '../store/uiStore'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { navItems } from './navConfig'
import { useTheme } from './theme-context'

interface Command {
  id: string
  label: string
  group: 'Go to' | 'Actions'
  icon: LucideIcon
  shortcut?: string
  run: () => void
}

function useCommands(): Command[] {
  const openQuickAdd = useUiStore((s) => s.openQuickAdd)
  const openAddIncome = useUiStore((s) => s.openAddIncome)
  const showToast = useToastStore((s) => s.showToast)
  const { toggleTheme } = useTheme()
  const navigate = useNavigate()

  return useMemo<Command[]>(
    () => [
      ...navItems.map((item) => ({
        id: `nav-${item.path}`,
        label: item.label,
        group: 'Go to' as const,
        icon: item.icon,
        run: () => navigate(item.path),
      })),
      {
        id: 'quick-add-expense',
        label: 'Quick Add Expense',
        group: 'Actions',
        icon: Plus,
        shortcut: 'Ctrl+E',
        run: openQuickAdd,
      },
      {
        id: 'add-income',
        label: 'Add Income',
        group: 'Actions',
        icon: Wallet,
        shortcut: 'Ctrl+I',
        run: openAddIncome,
      },
      {
        id: 'back-up-now',
        label: 'Back Up Now',
        group: 'Actions',
        icon: Save,
        shortcut: 'Ctrl+B',
        run: () => runManualBackup(showToast),
      },
      {
        id: 'toggle-theme',
        label: 'Toggle Light/Dark Theme',
        group: 'Actions',
        icon: Moon,
        shortcut: 'Ctrl+D',
        run: toggleTheme,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/** Only mounted while open, so `query`/`activeIndex` always start fresh — no reset-on-open effect needed. */
function CommandPaletteBody({ onClose }: { onClose: () => void }) {
  const commands = useCommands()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [query, commands])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEscapeToClose(true, onClose)

  function runCommand(command: Command | undefined) {
    if (!command) return
    command.run()
    onClose()
  }

  function onQueryChange(value: string) {
    setQuery(value)
    setActiveIndex(0)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(filtered[activeIndex])
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      className="glass-card relative flex w-full max-w-lg flex-col overflow-hidden p-0"
    >
      <div className="border-glass-border flex items-center gap-2 border-b px-4 py-3">
        <Search size={16} strokeWidth={1.75} className="text-text-secondary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Jump to a screen or run an action…"
          aria-label="Command palette search"
          className="text-text-primary placeholder:text-text-secondary/60 w-full bg-transparent text-sm outline-none"
        />
      </div>
      <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
        {filtered.length === 0 && (
          <li className="text-text-secondary px-3 py-6 text-center text-sm">
            No matching screens or actions.
          </li>
        )}
        {filtered.map((command, index) => {
          const showGroupHeader = index === 0 || filtered[index - 1]!.group !== command.group
          const Icon = command.icon
          return (
            <li key={command.id}>
              {showGroupHeader && (
                <p className="text-text-secondary px-3 pt-2 pb-1 text-xs font-medium tracking-wide uppercase">
                  {command.group}
                </p>
              )}
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runCommand(command)}
                className={`flex w-full items-center justify-between gap-2 rounded-control px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? 'bg-accent-primary/15 text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={14} strokeWidth={1.75} />
                  {command.label}
                </span>
                {command.shortcut && (
                  <kbd className="border-glass-border text-text-secondary rounded-control border px-1.5 py-0.5 font-mono text-[10px]">
                    {command.shortcut}
                  </kbd>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

export function CommandPalette() {
  const isOpen = useUiStore((s) => s.isCommandPaletteOpen)
  const close = useUiStore((s) => s.closeCommandPalette)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/50"
            onClick={close}
          />
          <CommandPaletteBody onClose={close} />
        </div>
      )}
    </AnimatePresence>
  )
}
