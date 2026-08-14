import { invoke } from '@tauri-apps/api/core'
import type {
  BudgetSummary,
  Category,
  ConfirmFixedExpenseInput,
  CreateCategoryInput,
  CreateExpenseInput,
  CreateFixedExpenseInput,
  CreateIncomeInput,
  EntryFilter,
  Expense,
  FixedExpense,
  Income,
  PendingFixedExpense,
  SetCategoryBudgetInput,
  SetOverallBudgetInput,
  SkipFixedExpenseInput,
  UpdateCategoryInput,
  UpdateExpenseInput,
  UpdateFixedExpenseInput,
  UpdateIncomeInput,
} from './types'

/**
 * Typed wrappers around Tauri `invoke()` calls — the only way the frontend
 * talks to Rust. No raw command names or payloads outside this module.
 */
export function getAppVersion(): Promise<string> {
  return invoke<string>('get_app_version')
}

export function listCategories(
  categoryType?: 'expense' | 'income',
  includeArchived = false,
): Promise<Category[]> {
  return invoke<Category[]>('list_categories', { categoryType, includeArchived })
}

export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return invoke<Category>('create_category', { input })
}

export function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  return invoke<Category>('update_category', { id, input })
}

export function setCategoryArchived(id: string, archived: boolean): Promise<Category> {
  return invoke<Category>('set_category_archived', { id, archived })
}

export function listExpenses(filter: EntryFilter = {}): Promise<Expense[]> {
  return invoke<Expense[]>('list_expenses', { filter })
}

export function createExpense(input: CreateExpenseInput): Promise<Expense> {
  return invoke<Expense>('create_expense', { input })
}

export function updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
  return invoke<Expense>('update_expense', { id, input })
}

export function deleteExpense(id: string): Promise<void> {
  return invoke<void>('delete_expense', { id })
}

export function listIncome(filter: EntryFilter = {}): Promise<Income[]> {
  return invoke<Income[]>('list_income', { filter })
}

export function createIncome(input: CreateIncomeInput): Promise<Income> {
  return invoke<Income>('create_income', { input })
}

export function updateIncome(id: string, input: UpdateIncomeInput): Promise<Income> {
  return invoke<Income>('update_income', { id, input })
}

export function deleteIncome(id: string): Promise<void> {
  return invoke<void>('delete_income', { id })
}

export function listFixedExpenses(): Promise<FixedExpense[]> {
  return invoke<FixedExpense[]>('list_fixed_expenses')
}

export function createFixedExpense(input: CreateFixedExpenseInput): Promise<FixedExpense> {
  return invoke<FixedExpense>('create_fixed_expense', { input })
}

export function updateFixedExpense(
  id: string,
  input: UpdateFixedExpenseInput,
): Promise<FixedExpense> {
  return invoke<FixedExpense>('update_fixed_expense', { id, input })
}

export function deleteFixedExpense(id: string): Promise<void> {
  return invoke<void>('delete_fixed_expense', { id })
}

export function listPendingFixedExpenses(month: string): Promise<PendingFixedExpense[]> {
  return invoke<PendingFixedExpense[]>('list_pending_fixed_expenses', { month })
}

export function confirmFixedExpense(input: ConfirmFixedExpenseInput): Promise<Expense> {
  return invoke<Expense>('confirm_fixed_expense', { input })
}

export function skipFixedExpense(input: SkipFixedExpenseInput): Promise<void> {
  return invoke<void>('skip_fixed_expense', { input })
}

export function exportExpensesCsv(path: string, filter: EntryFilter = {}): Promise<void> {
  return invoke<void>('export_expenses_csv', { path, filter })
}

export function exportIncomeCsv(path: string, filter: EntryFilter = {}): Promise<void> {
  return invoke<void>('export_income_csv', { path, filter })
}

export function getBudgetSummary(month: string): Promise<BudgetSummary> {
  return invoke<BudgetSummary>('get_budget_summary', { month })
}

export function setOverallBudget(input: SetOverallBudgetInput): Promise<BudgetSummary> {
  return invoke<BudgetSummary>('set_overall_budget', { input })
}

export function setCategoryBudget(input: SetCategoryBudgetInput): Promise<BudgetSummary> {
  return invoke<BudgetSummary>('set_category_budget', { input })
}

export function copyLastMonthBudget(month: string): Promise<number> {
  return invoke<number>('copy_last_month_budget', { month })
}
