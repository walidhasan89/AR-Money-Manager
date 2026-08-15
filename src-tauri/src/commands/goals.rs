use chrono::Local;
use tauri::AppHandle;

use crate::db;
use crate::error::{AppError, AppResult};
use crate::models::{CreateGoalInput, Goal, GoalProgress, UpdateGoalInput};
use crate::queries;
use crate::validation;

const GOAL_TYPES: [&str; 3] = ["savings", "dps", "emergency_fund"];

fn validate_goal_fields(
    name: &str,
    goal_type: &str,
    target_amount_cents: Option<i64>,
    monthly_contribution_cents: Option<i64>,
    target_date: Option<&str>,
) -> AppResult<()> {
    validation::non_empty(name, "Name")?;
    if !GOAL_TYPES.contains(&goal_type) {
        return Err(AppError::Validation(
            "Goal type must be 'savings', 'dps', or 'emergency_fund'".into(),
        ));
    }
    if let Some(amount) = target_amount_cents {
        validation::amount_cents(amount)?;
    }
    if let Some(amount) = monthly_contribution_cents {
        validation::amount_cents(amount)?;
    }
    if let Some(date) = target_date {
        validation::iso_date(date)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn list_goals(app: AppHandle, include_archived: bool) -> AppResult<Vec<Goal>> {
    let pool = db::pool(&app).await?;
    queries::goals::list(&pool, include_archived).await
}

#[tauri::command]
pub async fn list_goal_progress(
    app: AppHandle,
    include_archived: bool,
) -> AppResult<Vec<GoalProgress>> {
    let pool = db::pool(&app).await?;
    let today = Local::now().date_naive();
    queries::goals::list_progress(&pool, include_archived, today).await
}

#[tauri::command]
pub async fn create_goal(app: AppHandle, input: CreateGoalInput) -> AppResult<Goal> {
    validate_goal_fields(
        &input.name,
        &input.goal_type,
        input.target_amount_cents,
        input.monthly_contribution_cents,
        input.target_date.as_deref(),
    )?;
    let pool = db::pool(&app).await?;
    queries::goals::create(&pool, input).await
}

#[tauri::command]
pub async fn update_goal(app: AppHandle, id: String, input: UpdateGoalInput) -> AppResult<Goal> {
    validate_goal_fields(
        &input.name,
        &input.goal_type,
        input.target_amount_cents,
        input.monthly_contribution_cents,
        input.target_date.as_deref(),
    )?;
    let pool = db::pool(&app).await?;
    queries::goals::update(&pool, &id, input).await
}

#[tauri::command]
pub async fn set_goal_active(app: AppHandle, id: String, active: bool) -> AppResult<Goal> {
    let pool = db::pool(&app).await?;
    queries::goals::set_active(&pool, &id, active).await
}
