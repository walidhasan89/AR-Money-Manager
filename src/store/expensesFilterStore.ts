import { create } from 'zustand'
import type { EntryFilter } from '../lib/ipc/types'

interface ExpensesFilterState {
  filter: EntryFilter
  setFilter: (filter: EntryFilter) => void
  clearFilter: () => void
}

/** Session-only (not persisted across restarts) so filters survive navigating away and back. */
export const useExpensesFilterStore = create<ExpensesFilterState>((set) => ({
  filter: {},
  setFilter: (filter) => set({ filter }),
  clearFilter: () => set({ filter: {} }),
}))
