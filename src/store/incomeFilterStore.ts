import { create } from 'zustand'
import type { EntryFilter } from '../lib/ipc/types'

interface IncomeFilterState {
  filter: EntryFilter
  setFilter: (filter: EntryFilter) => void
}

export const useIncomeFilterStore = create<IncomeFilterState>((set) => ({
  filter: {},
  setFilter: (filter) => set({ filter }),
}))
