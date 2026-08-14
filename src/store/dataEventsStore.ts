import { create } from 'zustand'

interface DataEventsState {
  expensesVersion: number
  bumpExpensesVersion: () => void
}

/**
 * Bumped by every expense create/update/delete/confirm call site. Screens
 * that must stay live without a manual refresh (e.g. Budgets) subscribe to
 * this as a useEffect dependency and refetch when it changes.
 */
export const useDataEventsStore = create<DataEventsState>((set) => ({
  expensesVersion: 0,
  bumpExpensesVersion: () => set((state) => ({ expensesVersion: state.expensesVersion + 1 })),
}))
