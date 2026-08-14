use tauri::AppHandle;

use crate::db;
use crate::error::AppResult;
use crate::models::{CreateIncomeInput, EntryFilter, Income, UpdateIncomeInput};
use crate::queries;
use crate::validation;

#[tauri::command]
pub async fn list_income(app: AppHandle, filter: EntryFilter) -> AppResult<Vec<Income>> {
    let pool = db::pool(&app).await?;
    queries::income::list(&pool, &filter).await
}

#[tauri::command]
pub async fn create_income(app: AppHandle, input: CreateIncomeInput) -> AppResult<Income> {
    validation::amount_cents(input.amount_cents)?;
    validation::iso_date(&input.date)?;
    validation::non_empty(&input.category_id, "Category")?;
    let pool = db::pool(&app).await?;
    queries::income::create(&pool, input).await
}

#[tauri::command]
pub async fn update_income(
    app: AppHandle,
    id: String,
    input: UpdateIncomeInput,
) -> AppResult<Income> {
    validation::amount_cents(input.amount_cents)?;
    validation::iso_date(&input.date)?;
    validation::non_empty(&input.category_id, "Category")?;
    let pool = db::pool(&app).await?;
    queries::income::update(&pool, &id, input).await
}

#[tauri::command]
pub async fn delete_income(app: AppHandle, id: String) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    queries::income::soft_delete(&pool, &id).await
}
