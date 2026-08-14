import { afterEach, describe, expect, it } from 'vitest'
import { formatCurrency, parseAmountToCents } from './currency'
import { useCurrencyStore } from '../../store/currencyStore'

describe('formatCurrency', () => {
  afterEach(() => {
    useCurrencyStore.getState().setCurrency('BDT')
  })

  it('formats whole and fractional cents with the BDT symbol by default', () => {
    expect(formatCurrency(0)).toBe('৳0.00')
    expect(formatCurrency(5)).toBe('৳0.05')
    expect(formatCurrency(100)).toBe('৳1.00')
    expect(formatCurrency(125_050)).toBe('৳1,250.50')
  })

  it('formats negative cents with a leading minus before the symbol', () => {
    expect(formatCurrency(-125_050)).toBe('-৳1,250.50')
  })

  it('falls back to the currency code when no symbol is known', () => {
    expect(formatCurrency(1000, 'XYZ')).toBe('XYZ10.00')
  })

  it('defaults to the current currency-store selection, symbol only (no conversion)', () => {
    useCurrencyStore.getState().setCurrency('USD')
    expect(formatCurrency(125_050)).toBe('$1,250.50')
  })
})

describe('parseAmountToCents', () => {
  it('parses plain integers as whole units', () => {
    expect(parseAmountToCents('500')).toBe(50_000)
  })

  it('parses decimals with one or two fraction digits', () => {
    expect(parseAmountToCents('12.5')).toBe(1250)
    expect(parseAmountToCents('12.50')).toBe(1250)
    expect(parseAmountToCents('1250.99')).toBe(125_099)
  })

  it('strips thousands separators', () => {
    expect(parseAmountToCents('1,250.50')).toBe(125_050)
  })

  it('rejects empty, negative, and malformed input', () => {
    expect(parseAmountToCents('')).toBeNull()
    expect(parseAmountToCents('-5')).toBeNull()
    expect(parseAmountToCents('abc')).toBeNull()
    expect(parseAmountToCents('1.999')).toBeNull()
    expect(parseAmountToCents('1.2.3')).toBeNull()
  })
})
