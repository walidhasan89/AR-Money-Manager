export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  isSystem: boolean
  isArchived: boolean
  createdAt: string
}

export interface CreateCategoryInput {
  name: string
  type: CategoryType
  icon: string
  color: string
}

export interface UpdateCategoryInput {
  name: string
  icon: string
  color: string
}

export interface EntryFilter {
  dateFrom?: string
  dateTo?: string
  categoryIds?: string[]
  minAmountCents?: number
  maxAmountCents?: number
  keyword?: string
}

export interface Expense {
  id: string
  amountCents: number
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  date: string
  note: string | null
  fixedExpenseId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseInput {
  amountCents: number
  categoryId: string
  date: string
  note: string | null
}

export type UpdateExpenseInput = CreateExpenseInput

export interface Income {
  id: string
  amountCents: number
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  source: string | null
  date: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateIncomeInput {
  amountCents: number
  categoryId: string
  source: string | null
  date: string
  note: string | null
}

export type UpdateIncomeInput = CreateIncomeInput

export interface FixedExpense {
  id: string
  name: string
  amountCents: number
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  dayOfMonth: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFixedExpenseInput {
  name: string
  amountCents: number
  categoryId: string
  dayOfMonth: number
}

export interface UpdateFixedExpenseInput extends CreateFixedExpenseInput {
  isActive: boolean
}

export interface PendingFixedExpense {
  fixedExpenseId: string
  name: string
  amountCents: number
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  dayOfMonth: number
  dueDate: string
}

export interface ConfirmFixedExpenseInput {
  fixedExpenseId: string
  amountCents: number
  date: string
  note: string | null
}

export interface SkipFixedExpenseInput {
  fixedExpenseId: string
  month: string
}

export interface CategoryBudget {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  budgetCents: number
  spentCents: number
}

export interface BudgetSummary {
  month: string
  overallBudgetCents: number
  overallSpentCents: number
  categories: CategoryBudget[]
}

export interface SetOverallBudgetInput {
  month: string
  amountCents: number
}

export interface SetCategoryBudgetInput {
  month: string
  categoryId: string
  amountCents: number
}

export interface CategorySpend {
  categoryId: string
  categoryName: string
  categoryColor: string
  amountCents: number
}

export interface DailySpend {
  date: string
  amountCents: number
}

export interface DashboardSummary {
  month: string
  incomeCents: number
  expensesCents: number
  savingsCents: number
  remainingCents: number
  spendingByCategory: CategorySpend[]
  dailySpending: DailySpend[]
  recentTransactions: Expense[]
}

export interface SavingsTrendPoint {
  month: string
  totalCents: number
}

export type GoalType = 'savings' | 'dps' | 'emergency_fund'

export interface Goal {
  id: string
  name: string
  type: GoalType
  targetAmountCents: number | null
  monthlyContributionCents: number | null
  targetDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGoalInput {
  name: string
  type: GoalType
  targetAmountCents: number | null
  monthlyContributionCents: number | null
  targetDate: string | null
}

export type UpdateGoalInput = CreateGoalInput

export interface GoalProgress {
  id: string
  name: string
  type: GoalType
  targetAmountCents: number | null
  monthlyContributionCents: number | null
  targetDate: string | null
  isActive: boolean
  createdAt: string
  contributedCents: number
  progressPercent: number
  projectedMaturityCents: number | null
}

export type SavingsEntryType = 'general' | 'dps' | 'emergency_fund' | 'goal'

export interface SavingsEntry {
  id: string
  amountCents: number
  type: SavingsEntryType
  goalId: string | null
  goalName: string | null
  date: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSavingsEntryInput {
  amountCents: number
  type: SavingsEntryType
  goalId: string | null
  date: string
  note: string | null
}

export type UpdateSavingsEntryInput = CreateSavingsEntryInput

export interface SavingsEntryFilter {
  dateFrom?: string
  dateTo?: string
  goalId?: string
  entryType?: SavingsEntryType
}

export type AppErrorKind = 'validation' | 'notFound' | 'database' | 'io'

export interface AppError {
  kind: AppErrorKind
  message?: string
}

export function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && error !== null && 'kind' in error
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    if (error.kind === 'notFound') return 'That item no longer exists.'
    return error.message ?? 'Something went wrong.'
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
