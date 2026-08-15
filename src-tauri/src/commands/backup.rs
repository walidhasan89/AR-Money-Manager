use std::path::{Path, PathBuf};

use chrono::Utc;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{ConnectOptions, Row};
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::db;
use crate::error::AppResult;
use crate::models::{BackupLogEntry, BackupStatus};
use crate::queries;

// tauri-plugin-sql resolves "sqlite:pfm.db" against `app_config_dir()`, not
// `app_data_dir()` (see its `path_mapper` / wrapper.rs) — these differ on
// Linux (~/.config vs ~/.local/share), so backup/restore must resolve the
// live file the same way the plugin does, or every fs operation here
// silently misses it.
fn live_db_path(app: &AppHandle) -> AppResult<PathBuf> {
    Ok(app.path().app_config_dir()?.join("pfm.db"))
}

fn auto_backup_dir(app: &AppHandle) -> AppResult<PathBuf> {
    Ok(app.path().app_config_dir()?.join("backups").join("auto"))
}

#[tauri::command]
pub async fn get_backup_status(app: AppHandle) -> AppResult<BackupStatus> {
    let pool = db::pool(&app).await?;
    let last = queries::backup::get_last_manual_backup(&pool).await?;
    let last_manual_backup_at = last.map(|b| b.created_at);
    let is_stale = queries::backup::is_stale(last_manual_backup_at.as_deref(), Utc::now());
    Ok(BackupStatus {
        last_manual_backup_at,
        is_stale,
    })
}

#[tauri::command]
pub async fn create_manual_backup(app: AppHandle, path: String) -> AppResult<BackupLogEntry> {
    let live_path = live_db_path(&app)?;
    let pool = db::pool(&app).await?;
    queries::backup::checkpoint_wal(&pool).await?;
    queries::backup::copy_file(&live_path, Path::new(&path))?;

    queries::backup::log_backup(&pool, &path, "manual").await
}

/// Validates `path` (never touching the live DB if it's invalid), takes an
/// automatic safety copy of the *current* live DB, closes the live
/// connection pool, overwrites the live file with the backup, then logs the
/// safety copy into the *restored* file (not the pre-overwrite one — that
/// copy of `backups_log` is about to be discarded, so logging into it first
/// would silently lose the record the moment the file is replaced). The
/// frontend reloads the whole page on success, which re-runs
/// `lib/db/connection.ts`'s `Database.load()` from scratch — letting
/// `tauri-plugin-sql` reopen (and, if the restored file is from an older
/// app version, re-migrate) against the now-restored file, matching
/// BACKUP_STRATEGY.md's "app restarts its DB connection against the
/// restored file."
#[tauri::command]
pub async fn restore_backup(app: AppHandle, path: String) -> AppResult<()> {
    let backup_path = Path::new(&path);
    queries::backup::validate_backup_file(backup_path).await?;

    let live_path = live_db_path(&app)?;
    let auto_dir = auto_backup_dir(&app)?;
    let safety_copy_path = auto_dir.join(queries::backup::timestamped_filename(
        "pre-restore",
        Utc::now(),
    ));
    let pool = db::pool(&app).await?;
    queries::backup::checkpoint_wal(&pool).await?;
    queries::backup::copy_file(&live_path, &safety_copy_path)?;

    let instances = app.state::<DbInstances>();
    let mut lock = instances.0.write().await;
    if let Some(DbPool::Sqlite(old_pool)) = lock.remove(db::DB_URL) {
        old_pool.close().await;
    }
    drop(lock);

    queries::backup::copy_file(backup_path, &live_path)?;

    let log_options = SqliteConnectOptions::new().filename(&live_path);
    let mut log_conn = log_options.connect().await?;
    sqlx::query(
        "INSERT INTO backups_log (id, file_path, trigger) VALUES (?1, ?2, 'pre_restore_safety')",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(safety_copy_path.to_string_lossy().to_string())
    .execute(&mut log_conn)
    .await?;

    Ok(())
}

/// Called by the frontend before its first `Database.load()` of the
/// session. Compares the live DB's applied migration version (read via a
/// standalone connection — `tauri-plugin-sql` hasn't opened its pool yet at
/// this point) against the app's bundled migrations, and takes a safety
/// copy first if a migration is about to run
/// (docs/architecture/BACKUP_STRATEGY.md's pre-migration safety net).
#[tauri::command]
pub async fn check_pre_migration_backup(app: AppHandle) -> AppResult<bool> {
    let live_path = live_db_path(&app)?;
    if !live_path.is_file() {
        return Ok(false);
    }

    let options = SqliteConnectOptions::new()
        .filename(&live_path)
        .create_if_missing(false);
    let mut conn = match options.connect().await {
        Ok(conn) => conn,
        Err(_) => return Ok(false),
    };

    let applied_version: i64 =
        sqlx::query("SELECT COALESCE(MAX(version), 0) AS v FROM _sqlx_migrations")
            .fetch_one(&mut conn)
            .await
            .map(|row| row.get("v"))
            .unwrap_or(0);

    let bundled_version = crate::migrations()
        .iter()
        .map(|m| m.version)
        .max()
        .unwrap_or(0);
    if applied_version >= bundled_version {
        drop(conn);
        return Ok(false);
    }

    // A prior session may have exited without SQLite auto-checkpointing its
    // WAL file, so force one on this standalone connection before copying —
    // otherwise the safety copy can miss commits from before this launch.
    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(&mut conn)
        .await?;
    drop(conn);

    let auto_dir = auto_backup_dir(&app)?;
    let safety_copy_path = auto_dir.join(queries::backup::timestamped_filename(
        "pre-migration",
        Utc::now(),
    ));
    queries::backup::copy_file(&live_path, &safety_copy_path)?;

    // Safe to log through a fresh standalone connection: backups_log's
    // shape is unchanged by every migration currently bundled.
    let log_options = SqliteConnectOptions::new().filename(&live_path);
    let mut log_conn = log_options.connect().await?;
    sqlx::query(
        "INSERT INTO backups_log (id, file_path, trigger) VALUES (?1, ?2, 'pre_restore_safety')",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(safety_copy_path.to_string_lossy().to_string())
    .execute(&mut log_conn)
    .await?;

    Ok(true)
}
