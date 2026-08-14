import { invoke } from '@tauri-apps/api/core'
import type {
  BudgetSummary,
  Category,
  ConfirmFixedExpenseInput,
  CreateCategoryInput,
  CreateExpenseInput,
  CreateFixedExpenseInput,
  CreateGoalInput,
  CreateIncomeInput,
  CreateSavingsEntryInput,
  DashboardSummary,
  EntryFilter,
  Expense,
  FixedExpense,
  Goal,
  GoalProgress,
  Income,
  PendingFixedExpense,
  SavingsEntry,
  SavingsEntryFilter,
  SavingsTrendPoint,
  SetCategoryBudgetInput,
  SetOverallBudgetInput,
  SkipFixedExpenseInput,
  UpdateCategoryInput,
  UpdateExpenseInput,
  UpdateFixedExpenseInput,
  UpdateGoalInput,
  UpdateIncomeInput,
  UpdateSavingsEntryInput,
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

export function getDashboardSummary(month: string): Promise<DashboardSummary> {
  return invoke<DashboardSummary>('get_dashboard_summary', { month })
}

export function getSavingsTrend(month: string): Promise<SavingsTrendPoint[]> {
  return invoke<SavingsTrendPoint[]>('get_savings_trend', { month })
}

export function listGoals(includeArchived = false): Promise<Goal[]> {
  return invoke<Goal[]>('list_goals', { includeArchived })
}

export function listGoalProgress(includeArchived = false): Promise<GoalProgress[]> {
  return invoke<GoalProgress[]>('list_goal_progress', { includeArchived })
}

export function createGoal(input: CreateGoalInput): Promise<Goal> {
  return invoke<Goal>('create_goal', { input })
}

export function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  return invoke<Goal>('update_goal', { id, input })
}

export function setGoalActive(id: string, active: boolean): Promise<Goal> {
  return invoke<Goal>('set_goal_active', { id, active })
}

export function listSavingsEntries(filter: SavingsEntryFilter = {}): Promise<SavingsEntry[]> {
  return invoke<SavingsEntry[]>('list_savings_entries', { filter })
}

export function createSavingsEntry(input: CreateSavingsEntryInput): Promise<SavingsEntry> {
  return invoke<SavingsEntry>('create_savings_entry', { input })
}

export function updateSavingsEntry(
  id: string,
  input: UpdateSavingsEntryInput,
): Promise<SavingsEntry> {
  return invoke<SavingsEntry>('update_savings_entry', { id, input })
}

export function deleteSavingsEntry(id: string): Promise<void> {
  return invoke<void>('delete_savings_entry', { id })
}
