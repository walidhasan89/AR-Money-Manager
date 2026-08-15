import { addMonths, format, parse, subMonths } from 'date-fns'

/** Shared by every screen with a month selector (Dashboard, Budgets, Calendar). */
export function monthLabel(month: string): string {
  return format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')
}

export function shiftMonth(month: string, delta: number): string {
  const date = parse(month, 'yyyy-MM', new Date())
  const shifted = delta > 0 ? addMonths(date, delta) : subMonths(date, -delta)
  return format(shifted, 'yyyy-MM')
}
