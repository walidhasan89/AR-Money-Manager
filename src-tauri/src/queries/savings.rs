use sqlx::{Pool, QueryBuilder, Sqlite};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{
    CreateSavingsEntryInput, SavingsEntry, SavingsEntryFilter, UpdateSavingsEntryInput,
};

const SELECT: &str = "SELECT s.id, s.amount_cents, s.type, s.goal_id, g.name AS goal_name, \
    s.date, s.note, s.created_at, s.updated_at \
    FROM savings_entries s LEFT JOIN goals g ON g.id = s.goal_id";

fn apply_filter<'a>(qb: &mut QueryBuilder<'a, Sqlite>, filter: &'a SavingsEntryFilter) {
    if let Some(date_from) = &filter.date_from {
        qb.push(" AND s.date >= ").push_bind(date_from);
    }
    if let Some(date_to) = &filter.date_to {
        qb.push(" AND s.date <= ").push_bind(date_to);
    }
    if let Some(goal_id) = &filter.goal_id {
        qb.push(" AND s.goal_id = ").push_bind(goal_id);
    }
    if let Some(entry_type) = &filter.entry_type {
        qb.push(" AND s.type = ").push_bind(entry_type);
    }
}

pub async fn list(
    pool: &Pool<Sqlite>,
    filter: &SavingsEntryFilter,
) -> AppResult<Vec<SavingsEntry>> {
    let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new(SELECT);
    qb.push(" WHERE s.deleted_at IS NULL");
    apply_filter(&mut qb, filter);
    qb.push(" ORDER BY s.date DESC, s.created_at DESC");

    qb.build_query_as::<SavingsEntry>()
        .fetch_all(pool)
        .await
        .map_err(Into::into)
}

pub async fn get(pool: &Pool<Sqlite>, id: &str) -> AppResult<SavingsEntry> {
    sqlx::query_as::<_, SavingsEntry>(&format!(
        "{SELECT} WHERE s.id = ?1 AND s.deleted_at IS NULL"
    ))
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(Into::into)
}

pub async fn create(
    pool: &Pool<Sqlite>,
    input: CreateSavingsEntryInput,
) -> AppResult<SavingsEntry> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO savings_entries (id, amount_cents, type, goal_id, date, note) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(&id)
    .bind(input.amount_cents)
    .bind(&input.entry_type)
    .bind(&input.goal_id)
    .bind(&input.date)
    .bind(&input.note)
    .execute(pool)
    .await?;
    get(pool, &id).await
}

pub async fn update(
    pool: &Pool<Sqlite>,
    id: &str,
    input: UpdateSavingsEntryInput,
) -> AppResult<SavingsEntry> {
    let result = sqlx::query(
        "UPDATE savings_entries SET amount_cents = ?1, type = ?2, goal_id = ?3, date = ?4, note = ?5, \
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?6 AND deleted_at IS NULL",
    )
    .bind(input.amount_cents)
    .bind(&input.entry_type)
    .bind(&input.goal_id)
    .bind(&input.date)
    .bind(&input.note)
    .bind(id)
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    get(pool, id).await
}

pub async fn soft_delete(pool: &Pool<Sqlite>, id: &str) -> AppResult<()> {
    let result = sqlx::query(
        "UPDATE savings_entries SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?1 AND deleted_at IS NULL",
    )
    .bind(id)
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
