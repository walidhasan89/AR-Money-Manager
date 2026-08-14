use tauri::AppHandle;

use crate::db;
use crate::error::AppResult;
use crate::models::{BudgetSummary, SetCategoryBudgetInput, SetOverallBudgetInput};
use crate::queries;
use crate::validation;

#[tauri::command]
pub async fn get_budget_summary(app: AppHandle, month: String) -> AppResult<BudgetSummary> {
    let pool = db::pool(&app).await?;
    queries::budgets::get_summary(&pool, &month).await
}

#[tauri::command]
pub async fn set_overall_budget(
    app: AppHandle,
    input: SetOverallBudgetInput,
) -> AppResult<BudgetSummary> {
    validation::amount_cents(input.amount_cents)?;
    let pool = db::pool(&app).await?;
    queries::budgets::set_overall_budget(&pool, &input.month, input.amount_cents).await
}

#[tauri::command]
pub async fn set_category_budget(
    app: AppHandle,
    input: SetCategoryBudgetInput,
) -> AppResult<BudgetSummary> {
    validation::amount_cents(input.amount_cents)?;
    validation::non_empty(&input.category_id, "Category")?;
    let pool = db::pool(&app).await?;
    queries::budgets::set_category_budget(
        &pool,
        &input.month,
        &input.category_id,
        input.amount_cents,
    )
    .await
}

#[tauri::command]
pub async fn copy_last_month_budget(app: AppHandle, month: String) -> AppResult<usize> {
    let pool = db::pool(&app).await?;
    queries::budgets::copy_last_month(&pool, &month).await
}
