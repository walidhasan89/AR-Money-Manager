import { describe, expect, it } from 'vitest'
import { budgetFillPercent, budgetStatus } from './budget'

describe('budgetStatus', () => {
  it('is ok when no budget is set, regardless of spend', () => {
    expect(budgetStatus(0, 0)).toBe('ok')
    expect(budgetStatus(50_000, 0)).toBe('ok')
  })

  it('is ok below 80% spent', () => {
    expect(budgetStatus(7_900, 10_000)).toBe('ok')
  })

  it('is warning at and above 80%, below 100%', () => {
    expect(budgetStatus(8_000, 10_000)).toBe('warning')
    expect(budgetStatus(9_999, 10_000)).toBe('warning')
  })

  it('is danger at and above 100%', () => {
    expect(budgetStatus(10_000, 10_000)).toBe('danger')
    expect(budgetStatus(15_000, 10_000)).toBe('danger')
  })
})

describe('budgetFillPercent', () => {
  it('is 0 when no budget is set', () => {
    expect(budgetFillPercent(5_000, 0)).toBe(0)
  })

  it('computes a rounded percentage', () => {
    expect(budgetFillPercent(3_333, 10_000)).toBe(33)
    expect(budgetFillPercent(5_000, 10_000)).toBe(50)
  })

  it('caps at 100 when overspent', () => {
    expect(budgetFillPercent(25_000, 10_000)).toBe(100)
  })
})
