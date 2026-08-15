use tauri::AppHandle;

use crate::db;
use crate::error::{AppError, AppResult};
use crate::models::{
    CreateSavingsEntryInput, SavingsEntry, SavingsEntryFilter, UpdateSavingsEntryInput,
};
use crate::queries;
use crate::validation;

const ENTRY_TYPES: [&str; 4] = ["general", "dps", "emergency_fund", "goal"];

fn validate_entry_type(entry_type: &str) -> AppResult<()> {
    if !ENTRY_TYPES.contains(&entry_type) {
        return Err(AppError::Validation(
            "Type must be 'general', 'dps', 'emergency_fund', or 'goal'".into(),
        ));
    }
    Ok(())
}

#[tauri::command]
pub async fn list_savings_entries(
    app: AppHandle,
    filter: SavingsEntryFilter,
) -> AppResult<Vec<SavingsEntry>> {
    let pool = db::pool(&app).await?;
    queries::savings::list(&pool, &filter).await
}

#[tauri::command]
pub async fn create_savings_entry(
    app: AppHandle,
    input: CreateSavingsEntryInput,
) -> AppResult<SavingsEntry> {
    validation::amount_cents(input.amount_cents)?;
    validate_entry_type(&input.entry_type)?;
    validation::iso_date(&input.date)?;
    let pool = db::pool(&app).await?;
    queries::savings::create(&pool, input).await
}

#[tauri::command]
pub async fn update_savings_entry(
    app: AppHandle,
    id: String,
    input: UpdateSavingsEntryInput,
) -> AppResult<SavingsEntry> {
    validation::amount_cents(input.amount_cents)?;
    validate_entry_type(&input.entry_type)?;
    validation::iso_date(&input.date)?;
    let pool = db::pool(&app).await?;
    queries::savings::update(&pool, &id, input).await
}

#[tauri::command]
pub async fn delete_savings_entry(app: AppHandle, id: String) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    queries::savings::soft_delete(&pool, &id).await
}
