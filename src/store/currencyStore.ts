import { create } from 'zustand'

const STORAGE_KEY = 'pfm-currency'

export interface CurrencyOption {
  code: string
  label: string
  symbol: string
}

/** Display-only — switching currency relabels amounts, it never converts
 * them (money stays integer cents everywhere, CLAUDE.md). See
 * docs/product/ASSUMPTIONS.md for why this isn't a real FX feature. */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'BDT', label: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
]

function readInitialCurrency(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && CURRENCY_OPTIONS.some((c) => c.code === stored) ? stored : 'BDT'
}

interface CurrencyState {
  currency: string
  setCurrency: (code: string) => void
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: readInitialCurrency(),
  setCurrency: (code) => {
    localStorage.setItem(STORAGE_KEY, code)
    set({ currency: code })
  },
}))
