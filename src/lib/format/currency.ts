import { CURRENCY_OPTIONS, useCurrencyStore } from '../../store/currencyStore'

const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  CURRENCY_OPTIONS.map((c) => [c.code, c.symbol]),
)

/**
 * The only place cents become a display string. Money stays integer cents
 * everywhere else — never do float math on it (CLAUDE.md). `currency`
 * defaults to the user's current Settings → Currency choice (display symbol
 * only — see currencyStore.ts; amounts are never converted).
 */
export function formatCurrency(
  cents: number,
  currency: string = useCurrencyStore.getState().currency,
): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const sign = cents < 0 ? '-' : ''
  const absolute = Math.abs(cents)
  const whole = Math.floor(absolute / 100)
  const fraction = String(absolute % 100).padStart(2, '0')
  const wholeWithSeparators = whole.toLocaleString('en-US')
  return `${sign}${symbol}${wholeWithSeparators}.${fraction}`
}

/**
 * Parses a user-typed amount string (e.g. "1,250.50" or "500") into integer
 * cents. Returns null for anything that isn't a valid non-negative amount.
 */
export function parseAmountToCents(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, '')
  if (trimmed === '') return null
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null

  const [wholePart, fractionPart = ''] = trimmed.split('.')
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}
