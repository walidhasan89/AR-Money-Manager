import { create } from 'zustand'

const LAST_EXPENSE_CATEGORY_KEY = 'pfm-last-expense-category'

interface UiState {
  isQuickAddOpen: boolean
  openQuickAdd: () => void
  closeQuickAdd: () => void
  isAddIncomeOpen: boolean
  openAddIncome: () => void
  closeAddIncome: () => void
  lastUsedExpenseCategoryId: string | null
  setLastUsedExpenseCategoryId: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  isQuickAddOpen: false,
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
  isAddIncomeOpen: false,
  openAddIncome: () => set({ isAddIncomeOpen: true }),
  closeAddIncome: () => set({ isAddIncomeOpen: false }),
  lastUsedExpenseCategoryId: localStorage.getItem(LAST_EXPENSE_CATEGORY_KEY),
  setLastUsedExpenseCategoryId: (id) => {
    localStorage.setItem(LAST_EXPENSE_CATEGORY_KEY, id)
    set({ lastUsedExpenseCategoryId: id })
  },
}))
