import { forwardRef, type InputHTMLAttributes } from 'react'
import { CURRENCY_OPTIONS, useCurrencyStore } from '../store/currencyStore'

interface AmountInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value: string
  onChange: (value: string) => void
  error?: string
  currencySymbol?: string
}

/** Currency-aware, big touch/click target — the first field in Quick Add.
 * Defaults its symbol to Settings → Currency (display only, see
 * currencyStore.ts) so it always matches formatCurrency() elsewhere. */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, error, currencySymbol, className = '', ...rest }, ref) => {
    const currency = useCurrencyStore((s) => s.currency)
    const symbol =
      currencySymbol ?? CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol ?? currency
    return (
      <div>
        <div
          className={`border-glass-border focus-within:border-accent-primary flex items-center gap-2 rounded-control border bg-black/10 px-4 py-3 transition-colors ${className}`}
        >
          <span className="text-text-secondary tabular-nums text-2xl">{symbol}</span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.00"
            className="text-text-primary tabular-nums placeholder:text-text-secondary/50 w-full bg-transparent text-2xl font-semibold outline-none"
            {...rest}
          />
        </div>
        {error && <p className="text-accent-danger mt-1 text-xs">{error}</p>}
      </div>
    )
  },
)
AmountInput.displayName = 'AmountInput'
