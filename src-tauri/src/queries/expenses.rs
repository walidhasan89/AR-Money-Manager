use sqlx::{Pool, QueryBuilder, Sqlite};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{CreateExpenseInput, EntryFilter, Expense, UpdateExpenseInput};

const SELECT: &str = "SELECT e.id, e.amount_cents, e.category_id, c.name AS category_name, \
    c.color AS category_color, c.icon AS category_icon, e.date, e.note, e.fixed_expense_id, \
    e.created_at, e.updated_at \
    FROM expenses e JOIN categories c ON c.id = e.category_id";

fn apply_filter<'a>(qb: &mut QueryBuilder<'a, Sqlite>, filter: &'a EntryFilter) {
    if let Some(date_from) = &filter.date_from {
        qb.push(" AND e.date >= ").push_bind(date_from);
    }
    if let Some(date_to) = &filter.date_to {
        qb.push(" AND e.date <= ").push_bind(date_to);
    }
    if let Some(min) = filter.min_amount_cents {
        qb.push(" AND e.amount_cents >= ").push_bind(min);
    }
    if let Some(max) = filter.max_amount_cents {
        qb.push(" AND e.amount_cents <= ").push_bind(max);
    }
    if let Some(keyword) = &filter.keyword {
        let trimmed = keyword.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{}%", trimmed.replace('%', "\\%").replace('_', "\\_"));
            qb.push(" AND e.note LIKE ")
                .push_bind(pattern)
                .push(" ESCAPE '\\'");
        }
    }
    if let Some(category_ids) = &filter.category_ids {
        if !category_ids.is_empty() {
            qb.push(" AND e.category_id IN (");
            let mut separated = qb.separated(", ");
            for id in category_ids {
                separated.push_bind(id);
            }
            separated.push_unseparated(")");
        }
    }
}

pub async fn list(pool: &Pool<Sqlite>, filter: &EntryFilter) -> AppResult<Vec<Expense>> {
    let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new(SELECT);
    qb.push(" WHERE e.deleted_at IS NULL");
    apply_filter(&mut qb, filter);
    qb.push(" ORDER BY e.date DESC, e.created_at DESC");

    qb.build_query_as::<Expense>()
        .fetch_all(pool)
        .await
        .map_err(Into::into)
}

pub async fn get(pool: &Pool<Sqlite>, id: &str) -> AppResult<Expense> {
    sqlx::query_as::<_, Expense>(&format!(
        "{SELECT} WHERE e.id = ?1 AND e.deleted_at IS NULL"
    ))
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(Into::into)
}

pub async fn create(pool: &Pool<Sqlite>, input: CreateExpenseInput) -> AppResult<Expense> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO expenses (id, amount_cents, category_id, date, note) VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(&id)
    .bind(input.amount_cents)
    .bind(&input.category_id)
    .bind(&input.date)
    .bind(&input.note)
    .execute(pool)
    .await?;
    get(pool, &id).await
}

pub async fn update(
    pool: &Pool<Sqlite>,
    id: &str,
    input: UpdateExpenseInput,
) -> AppResult<Expense> {
    let result = sqlx::query(
        "UPDATE expenses SET amount_cents = ?1, category_id = ?2, date = ?3, note = ?4, \
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?5 AND deleted_at IS NULL",
    )
    .bind(input.amount_cents)
    .bind(&input.category_id)
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
        "UPDATE expenses SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?1 AND deleted_at IS NULL",
    )
    .bind(id)
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
