use chrono::Local;
use tauri::AppHandle;

use crate::db;
use crate::error::AppResult;
use crate::models::{
    ConfirmFixedExpenseInput, CreateFixedExpenseInput, Expense, FixedExpense, PendingFixedExpense,
    SkipFixedExpenseInput, UpdateFixedExpenseInput,
};
use crate::queries;
use crate::validation;

#[tauri::command]
pub async fn list_fixed_expenses(app: AppHandle) -> AppResult<Vec<FixedExpense>> {
    let pool = db::pool(&app).await?;
    queries::fixed_expenses::list(&pool).await
}

#[tauri::command]
pub async fn create_fixed_expense(
    app: AppHandle,
    input: CreateFixedExpenseInput,
) -> AppResult<FixedExpense> {
    validation::non_empty(&input.name, "Name")?;
    validation::amount_cents(input.amount_cents)?;
    validation::non_empty(&input.category_id, "Category")?;
    validation::day_of_month(input.day_of_month)?;
    let pool = db::pool(&app).await?;
    queries::fixed_expenses::create(&pool, input).await
}

#[tauri::command]
pub async fn update_fixed_expense(
    app: AppHandle,
    id: String,
    input: UpdateFixedExpenseInput,
) -> AppResult<FixedExpense> {
    validation::non_empty(&input.name, "Name")?;
    validation::amount_cents(input.amount_cents)?;
    validation::non_empty(&input.category_id, "Category")?;
    validation::day_of_month(input.day_of_month)?;
    let pool = db::pool(&app).await?;
    queries::fixed_expenses::update(&pool, &id, input).await
}

#[tauri::command]
pub async fn delete_fixed_expense(app: AppHandle, id: String) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    queries::fixed_expenses::delete(&pool, &id).await
}

#[tauri::command]
pub async fn list_pending_fixed_expenses(
    app: AppHandle,
    month: String,
) -> AppResult<Vec<PendingFixedExpense>> {
    let pool = db::pool(&app).await?;
    let today = Local::now().date_naive();
    queries::fixed_expenses::list_pending(&pool, &month, today).await
}

#[tauri::command]
pub async fn confirm_fixed_expense(
    app: AppHandle,
    input: ConfirmFixedExpenseInput,
) -> AppResult<Expense> {
    validation::amount_cents(input.amount_cents)?;
    validation::iso_date(&input.date)?;
    let pool = db::pool(&app).await?;
    queries::fixed_expenses::confirm(&pool, input).await
}

#[tauri::command]
pub async fn skip_fixed_expense(app: AppHandle, input: SkipFixedExpenseInput) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    queries::fixed_expenses::skip(&pool, input).await
}
