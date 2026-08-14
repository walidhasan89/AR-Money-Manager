use chrono::{Datelike, NaiveDate};
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{BudgetSummary, CategoryBudget};

pub async fn get_summary(pool: &Pool<Sqlite>, month: &str) -> AppResult<BudgetSummary> {
    let overall_budget_cents: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT amount_cents FROM budgets WHERE month = ?1 AND category_id IS NULL",
    )
    .bind(month)
    .fetch_optional(pool)
    .await?
    .unwrap_or(0);

    let overall_spent_cents: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(SUM(amount_cents), 0) FROM expenses \
         WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1",
    )
    .bind(month)
    .fetch_one(pool)
    .await?;

    let categories = sqlx::query_as::<_, CategoryBudget>(
        "SELECT c.id AS category_id, c.name AS category_name, c.color AS category_color, \
         c.icon AS category_icon, COALESCE(b.amount_cents, 0) AS budget_cents, \
         COALESCE((SELECT SUM(e.amount_cents) FROM expenses e \
             WHERE e.deleted_at IS NULL AND e.category_id = c.id AND strftime('%Y-%m', e.date) = ?1), 0) AS spent_cents \
         FROM categories c \
         LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ?1 \
         WHERE c.type = 'expense' AND c.is_archived = 0 \
         ORDER BY c.name",
    )
    .bind(month)
    .fetch_all(pool)
    .await?;

    Ok(BudgetSummary {
        month: month.to_string(),
        overall_budget_cents,
        overall_spent_cents,
        categories,
    })
}

/// SQLite's UNIQUE constraint treats every NULL as distinct, so it can't be
/// relied on for an `ON CONFLICT` upsert of the overall budget row
/// (`category_id IS NULL`). `IS` (unlike `=`) treats `NULL IS NULL` as true
/// while still behaving like `=` for non-null values, so this select-then-
/// write covers both the overall and per-category cases uniformly.
async fn upsert_budget(
    pool: &Pool<Sqlite>,
    month: &str,
    category_id: Option<&str>,
    amount_cents: i64,
) -> AppResult<()> {
    let existing_id = sqlx::query_scalar::<_, String>(
        "SELECT id FROM budgets WHERE month = ?1 AND category_id IS ?2",
    )
    .bind(month)
    .bind(category_id)
    .fetch_optional(pool)
    .await?;

    match existing_id {
        Some(id) => {
            sqlx::query(
                "UPDATE budgets SET amount_cents = ?1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?2",
            )
            .bind(amount_cents)
            .bind(&id)
            .execute(pool)
            .await?;
        }
        None => {
            let id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO budgets (id, month, category_id, amount_cents) VALUES (?1, ?2, ?3, ?4)",
            )
            .bind(&id)
            .bind(month)
            .bind(category_id)
            .bind(amount_cents)
            .execute(pool)
            .await?;
        }
    }
    Ok(())
}

pub async fn set_overall_budget(
    pool: &Pool<Sqlite>,
    month: &str,
    amount_cents: i64,
) -> AppResult<BudgetSummary> {
    upsert_budget(pool, month, None, amount_cents).await?;
    get_summary(pool, month).await
}

pub async fn set_category_budget(
    pool: &Pool<Sqlite>,
    month: &str,
    category_id: &str,
    amount_cents: i64,
) -> AppResult<BudgetSummary> {
    upsert_budget(pool, month, Some(category_id), amount_cents).await?;
    get_summary(pool, month).await
}

fn previous_month(month: &str) -> AppResult<String> {
    let date = NaiveDate::parse_from_str(&format!("{month}-01"), "%Y-%m-%d")
        .map_err(|_| AppError::Validation(format!("Invalid month: {month}")))?;
    let prev = if date.month() == 1 {
        NaiveDate::from_ymd_opt(date.year() - 1, 12, 1)
    } else {
        NaiveDate::from_ymd_opt(date.year(), date.month() - 1, 1)
    }
    .ok_or_else(|| AppError::Validation(format!("Invalid month: {month}")))?;
    Ok(prev.format("%Y-%m").to_string())
}

/// Copies every budget row (overall + per-category) from the prior month
/// into `month`, upserting so re-running it is idempotent. Returns how many
/// rows were copied (0 if the prior month has no budget set).
pub async fn copy_last_month(pool: &Pool<Sqlite>, month: &str) -> AppResult<usize> {
    let prev_month = previous_month(month)?;

    let rows = sqlx::query_as::<_, (Option<String>, i64)>(
        "SELECT category_id, amount_cents FROM budgets WHERE month = ?1",
    )
    .bind(&prev_month)
    .fetch_all(pool)
    .await?;

    let count = rows.len();
    for (category_id, amount_cents) in rows {
        upsert_budget(pool, month, category_id.as_deref(), amount_cents).await?;
    }
    Ok(count)
}
