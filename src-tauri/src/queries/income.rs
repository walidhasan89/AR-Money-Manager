use sqlx::{Pool, QueryBuilder, Sqlite};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{CreateIncomeInput, EntryFilter, Income, UpdateIncomeInput};

const SELECT: &str = "SELECT i.id, i.amount_cents, i.category_id, c.name AS category_name, \
    c.color AS category_color, c.icon AS category_icon, i.source, i.date, i.note, \
    i.created_at, i.updated_at \
    FROM income_entries i JOIN categories c ON c.id = i.category_id";

fn apply_filter<'a>(qb: &mut QueryBuilder<'a, Sqlite>, filter: &'a EntryFilter) {
    if let Some(date_from) = &filter.date_from {
        qb.push(" AND i.date >= ").push_bind(date_from);
    }
    if let Some(date_to) = &filter.date_to {
        qb.push(" AND i.date <= ").push_bind(date_to);
    }
    if let Some(min) = filter.min_amount_cents {
        qb.push(" AND i.amount_cents >= ").push_bind(min);
    }
    if let Some(max) = filter.max_amount_cents {
        qb.push(" AND i.amount_cents <= ").push_bind(max);
    }
    if let Some(keyword) = &filter.keyword {
        let trimmed = keyword.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{}%", trimmed.replace('%', "\\%").replace('_', "\\_"));
            qb.push(" AND (i.note LIKE ")
                .push_bind(pattern.clone())
                .push(" ESCAPE '\\' OR i.source LIKE ")
                .push_bind(pattern)
                .push(" ESCAPE '\\')");
        }
    }
    if let Some(category_ids) = &filter.category_ids {
        if !category_ids.is_empty() {
            qb.push(" AND i.category_id IN (");
            let mut separated = qb.separated(", ");
            for id in category_ids {
                separated.push_bind(id);
            }
            separated.push_unseparated(")");
        }
    }
}

pub async fn list(pool: &Pool<Sqlite>, filter: &EntryFilter) -> AppResult<Vec<Income>> {
    let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new(SELECT);
    qb.push(" WHERE i.deleted_at IS NULL");
    apply_filter(&mut qb, filter);
    qb.push(" ORDER BY i.date DESC, i.created_at DESC");

    qb.build_query_as::<Income>()
        .fetch_all(pool)
        .await
        .map_err(Into::into)
}

pub async fn get(pool: &Pool<Sqlite>, id: &str) -> AppResult<Income> {
    sqlx::query_as::<_, Income>(&format!(
        "{SELECT} WHERE i.id = ?1 AND i.deleted_at IS NULL"
    ))
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(Into::into)
}

pub async fn create(pool: &Pool<Sqlite>, input: CreateIncomeInput) -> AppResult<Income> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO income_entries (id, amount_cents, category_id, source, date, note) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(&id)
    .bind(input.amount_cents)
    .bind(&input.category_id)
    .bind(&input.source)
    .bind(&input.date)
    .bind(&input.note)
    .execute(pool)
    .await?;
    get(pool, &id).await
}

pub async fn update(pool: &Pool<Sqlite>, id: &str, input: UpdateIncomeInput) -> AppResult<Income> {
    let result = sqlx::query(
        "UPDATE income_entries SET amount_cents = ?1, category_id = ?2, source = ?3, date = ?4, note = ?5, \
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?6 AND deleted_at IS NULL",
    )
    .bind(input.amount_cents)
    .bind(&input.category_id)
    .bind(&input.source)
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
        "UPDATE income_entries SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?1 AND deleted_at IS NULL",
    )
    .bind(id)
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
