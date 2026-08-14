use tauri::AppHandle;

use crate::db;
use crate::error::AppResult;
use crate::models::{DashboardSummary, SavingsTrendPoint};
use crate::queries;

const SAVINGS_TREND_MONTHS: i32 = 6;

#[tauri::command]
pub async fn get_dashboard_summary(app: AppHandle, month: String) -> AppResult<DashboardSummary> {
    let pool = db::pool(&app).await?;
    queries::dashboard::get_summary(&pool, &month).await
}

#[tauri::command]
pub async fn get_savings_trend(app: AppHandle, month: String) -> AppResult<Vec<SavingsTrendPoint>> {
    let pool = db::pool(&app).await?;
    queries::dashboard::get_savings_trend(&pool, &month, SAVINGS_TREND_MONTHS).await
}
