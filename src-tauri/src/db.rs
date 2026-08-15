use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::error::AppError;

pub const DB_URL: &str = "sqlite:pfm.db";

/// Reuses the pool `tauri-plugin-sql` opened (and migrated) when the
/// frontend called `Database.load()` at startup. Every custom command runs
/// its own typed, parameterized queries against this pool — the frontend
/// never sends a SQL string over IPC (docs/architecture/ARCHITECTURE.md).
pub async fn pool<R: Runtime>(app: &AppHandle<R>) -> Result<Pool<Sqlite>, AppError> {
    let instances = app.state::<DbInstances>();
    let lock = instances.0.read().await;
    match lock.get(DB_URL) {
        Some(DbPool::Sqlite(pool)) => Ok(pool.clone()),
        _ => Err(AppError::Database(
            "database connection not initialized yet".into(),
        )),
    }
}
