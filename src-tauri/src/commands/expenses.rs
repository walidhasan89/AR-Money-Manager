use tauri::AppHandle;

use crate::db;
use crate::error::AppResult;
use crate::models::{CreateExpenseInput, EntryFilter, Expense, UpdateExpenseInput};
use crate::queries;
use crate::validation;

#[tauri::command]
pub async fn list_expenses(app: AppHandle, filter: EntryFilter) -> AppResult<Vec<Expense>> {
    let pool = db::pool(&app).await?;
    queries::expenses::list(&pool, &filter).await
}

#[tauri::command]
pub async fn create_expense(app: AppHandle, input: CreateExpenseInput) -> AppResult<Expense> {
    validation::amount_cents(input.amount_cents)?;
    validation::iso_date(&input.date)?;
    validation::non_empty(&input.category_id, "Category")?;
    let pool = db::pool(&app).await?;
    queries::expenses::create(&pool, input).await
}

#[tauri::command]
pub async fn update_expense(
    app: AppHandle,
    id: String,
    input: UpdateExpenseInput,
) -> AppResult<Expense> {
    validation::amount_cents(input.amount_cents)?;
    validation::iso_date(&input.date)?;
    validation::non_empty(&input.category_id, "Category")?;
    let pool = db::pool(&app).await?;
    queries::expenses::update(&pool, &id, input).await
}

#[tauri::command]
pub async fn delete_expense(app: AppHandle, id: String) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    queries::expenses::soft_delete(&pool, &id).await
}
