use chrono::{Datelike, NaiveDate};
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{
    ConfirmFixedExpenseInput, CreateFixedExpenseInput, Expense, FixedExpense, PendingFixedExpense,
    SkipFixedExpenseInput, UpdateFixedExpenseInput,
};

const SELECT: &str =
    "SELECT f.id, f.name, f.amount_cents, f.category_id, c.name AS category_name, \
    c.color AS category_color, c.icon AS category_icon, f.day_of_month, f.is_active, f.created_at, f.updated_at \
    FROM fixed_expenses f JOIN categories c ON c.id = f.category_id";

pub async fn list(pool: &Pool<Sqlite>) -> AppResult<Vec<FixedExpense>> {
    sqlx::query_as::<_, FixedExpense>(&format!("{SELECT} ORDER BY f.day_of_month, f.name"))
        .fetch_all(pool)
        .await
        .map_err(Into::into)
}

pub async fn get(pool: &Pool<Sqlite>, id: &str) -> AppResult<FixedExpense> {
    sqlx::query_as::<_, FixedExpense>(&format!("{SELECT} WHERE f.id = ?1"))
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(Into::into)
}

pub async fn create(
    pool: &Pool<Sqlite>,
    input: CreateFixedExpenseInput,
) -> AppResult<FixedExpense> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO fixed_expenses (id, name, amount_cents, category_id, day_of_month) VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(&id)
    .bind(&input.name)
    .bind(input.amount_cents)
    .bind(&input.category_id)
    .bind(input.day_of_month)
    .execute(pool)
    .await?;
    get(pool, &id).await
}

pub async fn update(
    pool: &Pool<Sqlite>,
    id: &str,
    input: UpdateFixedExpenseInput,
) -> AppResult<FixedExpense> {
    let result = sqlx::query(
        "UPDATE fixed_expenses SET name = ?1, amount_cents = ?2, category_id = ?3, day_of_month = ?4, \
         is_active = ?5, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?6",
    )
    .bind(&input.name)
    .bind(input.amount_cents)
    .bind(&input.category_id)
    .bind(input.day_of_month)
    .bind(input.is_active)
    .bind(id)
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    get(pool, id).await
}

pub async fn delete(pool: &Pool<Sqlite>, id: &str) -> AppResult<()> {
    let result = sqlx::query("DELETE FROM fixed_expenses WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

#[derive(sqlx::FromRow)]
struct PendingRow {
    id: String,
    name: String,
    amount_cents: i64,
    category_id: String,
    category_name: String,
    category_color: String,
    category_icon: String,
    day_of_month: i64,
}

/// A template is pending for `month` when it's active, has neither a posted
/// expense nor an explicit skip recorded for that month yet, and its due day
/// has actually arrived (past months are always overdue-due; future months
/// never are; the current month depends on `today`).
pub async fn list_pending(
    pool: &Pool<Sqlite>,
    month: &str,
    today: NaiveDate,
) -> AppResult<Vec<PendingFixedExpense>> {
    let current_month = today.format("%Y-%m").to_string();

    let rows = sqlx::query_as::<_, PendingRow>(
        "SELECT f.id, f.name, f.amount_cents, f.category_id, c.name AS category_name, c.color AS category_color, c.icon AS category_icon, f.day_of_month \
         FROM fixed_expenses f JOIN categories c ON c.id = f.category_id \
         WHERE f.is_active = 1 \
         AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.fixed_expense_id = f.id AND strftime('%Y-%m', e.date) = ?1) \
         AND NOT EXISTS (SELECT 1 FROM fixed_expense_skips s WHERE s.fixed_expense_id = f.id AND s.month = ?1) \
         ORDER BY f.day_of_month",
    )
    .bind(month)
    .fetch_all(pool)
    .await?;

    let pending = rows
        .into_iter()
        .filter(|row| {
            if month < current_month.as_str() {
                true
            } else if month == current_month {
                row.day_of_month <= i64::from(today.day())
            } else {
                false
            }
        })
        .map(|row| PendingFixedExpense {
            due_date: format!("{month}-{:02}", row.day_of_month),
            fixed_expense_id: row.id,
            name: row.name,
            amount_cents: row.amount_cents,
            category_id: row.category_id,
            category_name: row.category_name,
            category_color: row.category_color,
            category_icon: row.category_icon,
            day_of_month: row.day_of_month,
        })
        .collect();

    Ok(pending)
}

pub async fn confirm(pool: &Pool<Sqlite>, input: ConfirmFixedExpenseInput) -> AppResult<Expense> {
    let template = get(pool, &input.fixed_expense_id).await?;
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO expenses (id, amount_cents, category_id, date, note, fixed_expense_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(&id)
    .bind(input.amount_cents)
    .bind(&template.category_id)
    .bind(&input.date)
    .bind(&input.note)
    .bind(&input.fixed_expense_id)
    .execute(pool)
    .await?;

    crate::queries::expenses::get(pool, &id).await
}

pub async fn skip(pool: &Pool<Sqlite>, input: SkipFixedExpenseInput) -> AppResult<()> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT OR IGNORE INTO fixed_expense_skips (id, fixed_expense_id, month) VALUES (?1, ?2, ?3)",
    )
    .bind(&id)
    .bind(&input.fixed_expense_id)
    .bind(&input.month)
    .execute(pool)
    .await?;
    Ok(())
}
