use std::path::Path;

use chrono::{DateTime, Duration, Utc};
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{ConnectOptions, Pool, Row, Sqlite};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::BackupLogEntry;

const SELECT: &str = "SELECT id, file_path, created_at, trigger FROM backups_log";

/// Tables that must exist for a file to be accepted as a restorable backup
/// of this app's database — not just any valid SQLite file.
const REQUIRED_TABLES: [&str; 5] = [
    "categories",
    "expenses",
    "income_entries",
    "savings_entries",
    "backups_log",
];

pub async fn list_backups(pool: &Pool<Sqlite>) -> AppResult<Vec<BackupLogEntry>> {
    sqlx::query_as::<_, BackupLogEntry>(&format!("{SELECT} ORDER BY created_at DESC"))
        .fetch_all(pool)
        .await
        .map_err(Into::into)
}

pub async fn get_last_manual_backup(pool: &Pool<Sqlite>) -> AppResult<Option<BackupLogEntry>> {
    sqlx::query_as::<_, BackupLogEntry>(&format!(
        "{SELECT} WHERE trigger = 'manual' ORDER BY created_at DESC LIMIT 1"
    ))
    .fetch_optional(pool)
    .await
    .map_err(Into::into)
}

pub async fn log_backup(
    pool: &Pool<Sqlite>,
    file_path: &str,
    trigger: &str,
) -> AppResult<BackupLogEntry> {
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO backups_log (id, file_path, trigger) VALUES (?1, ?2, ?3)")
        .bind(&id)
        .bind(file_path)
        .bind(trigger)
        .execute(pool)
        .await?;
    sqlx::query_as::<_, BackupLogEntry>(&format!("{SELECT} WHERE id = ?1"))
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(Into::into)
}

/// A backup is stale when there's no manual backup on record, or the most
/// recent one is more than 14 days old (docs/architecture/BACKUP_STRATEGY.md).
pub fn is_stale(last_manual_backup_at: Option<&str>, now: DateTime<Utc>) -> bool {
    let Some(at) = last_manual_backup_at else {
        return true;
    };
    let Ok(parsed) = DateTime::parse_from_rfc3339(at) else {
        return true;
    };
    now.signed_duration_since(parsed) > Duration::days(14)
}

/// Opens `path` read-only (never creating it) and checks it has the core
/// tables this app expects, so a garbage or unrelated `.sqlite` file is
/// rejected *before* anything about the live database is touched.
pub async fn validate_backup_file(path: &Path) -> AppResult<()> {
    if !path.is_file() {
        return Err(AppError::Validation("Backup file does not exist".into()));
    }
    let options = SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(false);
    let mut conn = options
        .connect()
        .await
        .map_err(|_| AppError::Validation("File is not a valid SQLite database".into()))?;

    let rows = sqlx::query("SELECT name FROM sqlite_master WHERE type = 'table'")
        .fetch_all(&mut conn)
        .await
        .map_err(|_| AppError::Validation("File is not a valid SQLite database".into()))?;
    let table_names: Vec<String> = rows.iter().map(|r| r.get::<String, _>("name")).collect();

    let missing = REQUIRED_TABLES
        .iter()
        .find(|required| !table_names.iter().any(|name| name == *required));
    if missing.is_some() {
        return Err(AppError::Validation(
            "File doesn't look like a Personal Finance Manager backup".into(),
        ));
    }
    Ok(())
}

/// Forces every commit currently sitting in the `-wal` sidecar file to be
/// written into the main database file. The live DB runs in WAL mode, so a
/// raw file copy of just the main file can silently miss recent commits
/// that haven't been auto-checkpointed yet — this must run against the live
/// pool immediately before any `copy_file` that reads the live db.
pub async fn checkpoint_wal(pool: &Pool<Sqlite>) -> AppResult<()> {
    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(pool)
        .await?;
    Ok(())
}

/// Copies `source` to `dest`, creating `dest`'s parent directory if needed.
pub fn copy_file(source: &Path, dest: &Path) -> AppResult<()> {
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::copy(source, dest)?;
    Ok(())
}

/// `<prefix>-YYYY-MM-DD-HHmmss.sqlite`, for automatic (non-user-named)
/// safety copies.
pub fn timestamped_filename(prefix: &str, now: DateTime<Utc>) -> String {
    format!("{prefix}-{}.sqlite", now.format("%Y-%m-%d-%H%M%S"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_stale_when_no_backup_on_record() {
        assert!(is_stale(None, Utc::now()));
    }

    #[test]
    fn is_stale_past_fourteen_days() {
        let now = Utc::now();
        let recent = (now - Duration::days(5)).to_rfc3339();
        let old = (now - Duration::days(20)).to_rfc3339();
        assert!(!is_stale(Some(&recent), now));
        assert!(is_stale(Some(&old), now));
    }
}
