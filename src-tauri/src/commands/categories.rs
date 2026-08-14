use tauri::AppHandle;

use crate::db;
use crate::error::{AppError, AppResult};
use crate::models::{Category, CreateCategoryInput, UpdateCategoryInput};
use crate::queries;
use crate::validation;

#[tauri::command]
pub async fn list_categories(
    app: AppHandle,
    category_type: Option<String>,
    include_archived: bool,
) -> AppResult<Vec<Category>> {
    let pool = db::pool(&app).await?;
    queries::categories::list(&pool, category_type.as_deref(), include_archived).await
}

#[tauri::command]
pub async fn create_category(app: AppHandle, input: CreateCategoryInput) -> AppResult<Category> {
    validation::non_empty(&input.name, "Name")?;
    if input.category_type != "expense" && input.category_type != "income" {
        return Err(AppError::Validation(
            "Category type must be 'expense' or 'income'".into(),
        ));
    }
    let pool = db::pool(&app).await?;
    queries::categories::create(&pool, input).await
}

#[tauri::command]
pub async fn update_category(
    app: AppHandle,
    id: String,
    input: UpdateCategoryInput,
) -> AppResult<Category> {
    validation::non_empty(&input.name, "Name")?;
    let pool = db::pool(&app).await?;
    queries::categories::update(&pool, &id, input).await
}

#[tauri::command]
pub async fn set_category_archived(
    app: AppHandle,
    id: String,
    archived: bool,
) -> AppResult<Category> {
    let pool = db::pool(&app).await?;
    queries::categories::set_archived(&pool, &id, archived).await
}
