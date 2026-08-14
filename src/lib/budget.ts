export type BudgetStatus = 'ok' | 'warning' | 'danger'

/**
 * Thresholds per docs/phases/PHASE_3.md: warning >= 80%, danger >= 100%.
 * No budget set (0 or less) is never a warning/danger — there's nothing to
 * be over yet.
 */
export function budgetStatus(spentCents: number, budgetCents: number): BudgetStatus {
  if (budgetCents <= 0) return 'ok'
  const ratio = spentCents / budgetCents
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.8) return 'warning'
  return 'ok'
}

/** Bar fill percentage, capped at 100 so overspending doesn't overflow the track. */
export function budgetFillPercent(spentCents: number, budgetCents: number): number {
  if (budgetCents <= 0) return 0
  return Math.min(100, Math.round((spentCents / budgetCents) * 100))
}
