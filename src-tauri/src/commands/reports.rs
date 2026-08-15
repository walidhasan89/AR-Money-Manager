use tauri::AppHandle;

use crate::db;
use crate::error::AppResult;
use crate::models::ReportSummary;
use crate::queries;

#[tauri::command]
pub async fn get_report_summary(app: AppHandle, month: String) -> AppResult<ReportSummary> {
    let pool = db::pool(&app).await?;
    queries::reports::get_report(&pool, &month).await
}
