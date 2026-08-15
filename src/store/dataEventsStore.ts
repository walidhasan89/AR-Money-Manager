import { create } from 'zustand'

interface DataEventsState {
  expensesVersion: number
  bumpExpensesVersion: () => void
  savingsVersion: number
  bumpSavingsVersion: () => void
  incomeVersion: number
  bumpIncomeVersion: () => void
}

/**
 * Bumped by every expense/savings/income create/update/delete/confirm call
 * site. Screens that must stay live without a manual refresh (e.g. Budgets,
 * Dashboard, Calendar) subscribe to the relevant counter as a useEffect
 * dependency and refetch when it changes.
 */
export const useDataEventsStore = create<DataEventsState>((set) => ({
  expensesVersion: 0,
  bumpExpensesVersion: () => set((state) => ({ expensesVersion: state.expensesVersion + 1 })),
  savingsVersion: 0,
  bumpSavingsVersion: () => set((state) => ({ savingsVersion: state.savingsVersion + 1 })),
  incomeVersion: 0,
  bumpIncomeVersion: () => set((state) => ({ incomeVersion: state.incomeVersion + 1 })),
}))
