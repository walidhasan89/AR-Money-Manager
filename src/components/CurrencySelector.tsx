import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { CURRENCY_OPTIONS, useCurrencyStore } from '../store/currencyStore'
import { useEscapeToClose } from '../lib/useEscapeToClose'

/**
 * Settings screen's currency picker — display symbol only, amounts are never
 * converted (docs/product/ASSUMPTIONS.md). A custom listbox instead of a
 * native <select>: native selects render their closed box, option list, and
 * scrollbars with the WebView's own theme regardless of our design tokens
 * (see the color-scheme fix in CHANGELOG.md), and never picked up the glass
 * look anyway. This one matches CommandPalette's glass-modal + accent
 * conventions instead.
 */
export function CurrencySelector() {
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = CURRENCY_OPTIONS.find((c) => c.code === currency) ?? CURRENCY_OPTIONS[0]!

  useEscapeToClose(isOpen, () => setIsOpen(false))

  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [isOpen])

  function choose(code: string) {
    setCurrency(code)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Currency"
        onClick={() => setIsOpen((v) => !v)}
        className={`border-glass-border flex w-72 items-center justify-between gap-2 rounded-control border bg-black/10 px-3 py-2 text-sm transition-colors hover:border-glass-border-hover ${
          isOpen ? 'border-accent-primary' : ''
        }`}
      >
        <span className="text-text-primary flex min-w-0 items-center gap-2">
          <span className="text-accent-primary w-4 shrink-0 text-center tabular-nums">
            {selected.symbol}
          </span>
          <span className="truncate">
            {selected.code} — {selected.label}
          </span>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className={`text-text-secondary shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-label="Currency"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="glass-modal absolute top-full right-0 z-20 mt-2 max-h-72 w-72 overflow-y-auto p-1.5"
          >
            {CURRENCY_OPTIONS.map((option) => {
              const isSelected = option.code === currency
              return (
                <li key={option.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => choose(option.code)}
                    className={`flex w-full items-center justify-between gap-2 rounded-control px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent-primary/15 text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-glass-surface'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="w-4 shrink-0 text-center tabular-nums">{option.symbol}</span>
                      <span className="truncate">
                        {option.code} — {option.label}
                      </span>
                    </span>
                    {isSelected && (
                      <Check
                        size={14}
                        strokeWidth={2}
                        className="text-accent-primary shrink-0"
                        aria-hidden
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
