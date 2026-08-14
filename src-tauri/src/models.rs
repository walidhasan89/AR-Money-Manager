use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub category_type: String,
    pub icon: String,
    pub color: String,
    pub is_system: bool,
    pub is_archived: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCategoryInput {
    pub name: String,
    #[serde(rename = "type")]
    pub category_type: String,
    pub icon: String,
    pub color: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCategoryInput {
    pub name: String,
    pub icon: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Expense {
    pub id: String,
    pub amount_cents: i64,
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: String,
    pub date: String,
    pub note: Option<String>,
    pub fixed_expense_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExpenseInput {
    pub amount_cents: i64,
    pub category_id: String,
    pub date: String,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateExpenseInput {
    pub amount_cents: i64,
    pub category_id: String,
    pub date: String,
    pub note: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryFilter {
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub category_ids: Option<Vec<String>>,
    pub min_amount_cents: Option<i64>,
    pub max_amount_cents: Option<i64>,
    pub keyword: Option<String>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Income {
    pub id: String,
    pub amount_cents: i64,
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: String,
    pub source: Option<String>,
    pub date: String,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateIncomeInput {
    pub amount_cents: i64,
    pub category_id: String,
    pub source: Option<String>,
    pub date: String,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateIncomeInput {
    pub amount_cents: i64,
    pub category_id: String,
    pub source: Option<String>,
    pub date: String,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct FixedExpense {
    pub id: String,
    pub name: String,
    pub amount_cents: i64,
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: String,
    pub day_of_month: i64,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFixedExpenseInput {
    pub name: String,
    pub amount_cents: i64,
    pub category_id: String,
    pub day_of_month: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFixedExpenseInput {
    pub name: String,
    pub amount_cents: i64,
    pub category_id: String,
    pub day_of_month: i64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PendingFixedExpense {
    pub fixed_expense_id: String,
    pub name: String,
    pub amount_cents: i64,
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: String,
    pub day_of_month: i64,
    pub due_date: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfirmFixedExpenseInput {
    pub fixed_expense_id: String,
    pub amount_cents: i64,
    pub date: String,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkipFixedExpenseInput {
    pub fixed_expense_id: String,
    pub month: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CategoryBudget {
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: String,
    pub budget_cents: i64,
    pub spent_cents: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BudgetSummary {
    pub month: String,
    pub overall_budget_cents: i64,
    pub overall_spent_cents: i64,
    pub categories: Vec<CategoryBudget>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetOverallBudgetInput {
    pub month: String,
    pub amount_cents: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetCategoryBudgetInput {
    pub month: String,
    pub category_id: String,
    pub amount_cents: i64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CategorySpend {
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub amount_cents: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DailySpend {
    pub date: String,
    pub amount_cents: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardSummary {
    pub month: String,
    pub income_cents: i64,
    pub expenses_cents: i64,
    pub savings_cents: i64,
    pub remaining_cents: i64,
    pub spending_by_category: Vec<CategorySpend>,
    pub daily_spending: Vec<DailySpend>,
    pub recent_transactions: Vec<Expense>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavingsTrendPoint {
    pub month: String,
    pub total_cents: i64,
}
