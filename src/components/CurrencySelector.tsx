import { CURRENCY_OPTIONS, useCurrencyStore } from '../store/currencyStore'

/** Settings screen's currency picker — display symbol only, amounts are never converted (docs/product/ASSUMPTIONS.md). */
export function CurrencySelector() {
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      aria-label="Currency"
      className="border-glass-border focus:border-accent-primary text-text-primary rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
    >
      {CURRENCY_OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.symbol} {option.code} — {option.label}
        </option>
      ))}
    </select>
  )
}
