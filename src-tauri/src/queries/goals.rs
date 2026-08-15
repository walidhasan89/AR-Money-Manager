use chrono::NaiveDate;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

use crate::date_utils;
use crate::error::{AppError, AppResult};
use crate::models::{CreateGoalInput, Goal, GoalProgress, UpdateGoalInput};

const SELECT: &str = "SELECT id, name, type, target_amount_cents, monthly_contribution_cents, \
    target_date, is_active, created_at, updated_at FROM goals";

pub async fn list(pool: &Pool<Sqlite>, include_archived: bool) -> AppResult<Vec<Goal>> {
    let mut sql = String::from(SELECT);
    if !include_archived {
        sql.push_str(" WHERE is_active = 1");
    }
    sql.push_str(" ORDER BY created_at");
    sqlx::query_as::<_, Goal>(&sql)
        .fetch_all(pool)
        .await
        .map_err(Into::into)
}

pub async fn get(pool: &Pool<Sqlite>, id: &str) -> AppResult<Goal> {
    sqlx::query_as::<_, Goal>(&format!("{SELECT} WHERE id = ?1"))
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(Into::into)
}

#[derive(sqlx::FromRow)]
struct GoalProgressRow {
    id: String,
    name: String,
    #[sqlx(rename = "type")]
    goal_type: String,
    target_amount_cents: Option<i64>,
    monthly_contribution_cents: Option<i64>,
    target_date: Option<String>,
    is_active: bool,
    created_at: String,
    contributed_cents: i64,
}

/// Active-goal progress (or all, with `include_archived`), each with its
/// contribution total computed in one grouped SQL query — never by summing
/// entries client-side.
pub async fn list_progress(
    pool: &Pool<Sqlite>,
    include_archived: bool,
    today: NaiveDate,
) -> AppResult<Vec<GoalProgress>> {
    let mut sql = String::from(
        "SELECT g.id, g.name, g.type, g.target_amount_cents, g.monthly_contribution_cents, \
         g.target_date, g.is_active, g.created_at, \
         COALESCE(SUM(s.amount_cents), 0) AS contributed_cents \
         FROM goals g LEFT JOIN savings_entries s ON s.goal_id = g.id AND s.deleted_at IS NULL",
    );
    if !include_archived {
        sql.push_str(" WHERE g.is_active = 1");
    }
    sql.push_str(" GROUP BY g.id ORDER BY g.created_at");

    let rows = sqlx::query_as::<_, GoalProgressRow>(&sql)
        .fetch_all(pool)
        .await?;

    let today_str = today.format("%Y-%m-%d").to_string();
    let mut progress = Vec::with_capacity(rows.len());
    for row in rows {
        let progress_percent = match row.target_amount_cents {
            Some(target) if target > 0 => {
                (row.contributed_cents as f64 / target as f64 * 100.0).clamp(0.0, 100.0)
            }
            _ => 0.0,
        };

        let projected_maturity_cents = if row.goal_type == "dps" {
            match (row.monthly_contribution_cents, &row.target_date) {
                (Some(monthly), Some(target_date)) => {
                    let created_date = row.created_at.get(..10).unwrap_or(&today_str);
                    let months = date_utils::months_between(created_date, target_date)?;
                    Some(monthly * months)
                }
                _ => None,
            }
        } else {
            None
        };

        progress.push(GoalProgress {
            id: row.id,
            name: row.name,
            goal_type: row.goal_type,
            target_amount_cents: row.target_amount_cents,
            monthly_contribution_cents: row.monthly_contribution_cents,
            target_date: row.target_date,
            is_active: row.is_active,
            created_at: row.created_at,
            contributed_cents: row.contributed_cents,
            progress_percent,
            projected_maturity_cents,
        });
    }
    Ok(progress)
}

pub async fn create(pool: &Pool<Sqlite>, input: CreateGoalInput) -> AppResult<Goal> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO goals (id, name, type, target_amount_cents, monthly_contribution_cents, target_date) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.goal_type)
    .bind(input.target_amount_cents)
    .bind(input.monthly_contribution_cents)
    .bind(&input.target_date)
    .execute(pool)
    .await?;
    get(pool, &id).await
}

pub async fn update(pool: &Pool<Sqlite>, id: &str, input: UpdateGoalInput) -> AppResult<Goal> {
    let result = sqlx::query(
        "UPDATE goals SET name = ?1, type = ?2, target_amount_cents = ?3, \
         monthly_contribution_cents = ?4, target_date = ?5, \
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?6",
    )
    .bind(&input.name)
    .bind(&input.goal_type)
    .bind(input.target_amount_cents)
    .bind(input.monthly_contribution_cents)
    .bind(&input.target_date)
    .bind(id)
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    get(pool, id).await
}

pub async fn set_active(pool: &Pool<Sqlite>, id: &str, active: bool) -> AppResult<Goal> {
    let result =
        sqlx::query("UPDATE goals SET is_active = ?1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?2")
            .bind(active)
            .bind(id)
            .execute(pool)
            .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    get(pool, id).await
}
