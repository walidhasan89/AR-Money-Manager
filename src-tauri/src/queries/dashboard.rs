use std::collections::HashMap;

use sqlx::{Pool, Sqlite};

use crate::date_utils::{days_in_month, shift_month};
use crate::error::AppResult;
use crate::models::{
    CalendarDay, CategorySpend, DailySpend, DashboardSummary, Expense, SavingsTrendPoint,
};

const EXPENSE_SELECT: &str =
    "SELECT e.id, e.amount_cents, e.category_id, c.name AS category_name, \
    c.color AS category_color, c.icon AS category_icon, e.date, e.note, e.fixed_expense_id, \
    e.created_at, e.updated_at \
    FROM expenses e JOIN categories c ON c.id = e.category_id";

pub async fn get_summary(pool: &Pool<Sqlite>, month: &str) -> AppResult<DashboardSummary> {
    let income_cents: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(SUM(amount_cents), 0) FROM income_entries \
         WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1",
    )
    .bind(month)
    .fetch_one(pool)
    .await?;

    let expenses_cents: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(SUM(amount_cents), 0) FROM expenses \
         WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1",
    )
    .bind(month)
    .fetch_one(pool)
    .await?;

    let savings_cents: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(SUM(amount_cents), 0) FROM savings_entries \
         WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1",
    )
    .bind(month)
    .fetch_one(pool)
    .await?;

    let remaining_cents = income_cents - expenses_cents - savings_cents;

    let spending_by_category = sqlx::query_as::<_, CategorySpend>(
        "SELECT c.id AS category_id, c.name AS category_name, c.color AS category_color, \
         SUM(e.amount_cents) AS amount_cents \
         FROM expenses e JOIN categories c ON c.id = e.category_id \
         WHERE e.deleted_at IS NULL AND strftime('%Y-%m', e.date) = ?1 \
         GROUP BY c.id \
         ORDER BY amount_cents DESC",
    )
    .bind(month)
    .fetch_all(pool)
    .await?;

    let raw_daily = sqlx::query_as::<_, (String, i64)>(
        "SELECT date, SUM(amount_cents) FROM expenses \
         WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1 \
         GROUP BY date",
    )
    .bind(month)
    .fetch_all(pool)
    .await?;
    let daily_map: HashMap<String, i64> = raw_daily.into_iter().collect();

    let days = days_in_month(month)?;
    let daily_spending = (1..=days)
        .map(|day| {
            let date = format!("{month}-{day:02}");
            let amount_cents = *daily_map.get(&date).unwrap_or(&0);
            DailySpend { date, amount_cents }
        })
        .collect();

    let recent_transactions = sqlx::query_as::<_, Expense>(&format!(
        "{EXPENSE_SELECT} WHERE e.deleted_at IS NULL AND strftime('%Y-%m', e.date) = ?1 \
         ORDER BY e.date DESC, e.created_at DESC LIMIT 8"
    ))
    .bind(month)
    .fetch_all(pool)
    .await?;

    Ok(DashboardSummary {
        month: month.to_string(),
        income_cents,
        expenses_cents,
        savings_cents,
        remaining_cents,
        spending_by_category,
        daily_spending,
        recent_transactions,
    })
}

/// Every day of `month`, zero-filled, with that day's total income and
/// expense amounts — the Calendar screen's data source. Two separate
/// grouped queries (income, expenses) merged in memory rather than a join,
/// since joining two independently-aggregated per-date sums would multiply
/// rows across dates that have entries in both tables.
pub async fn get_calendar_summary(pool: &Pool<Sqlite>, month: &str) -> AppResult<Vec<CalendarDay>> {
    let raw_expenses = sqlx::query_as::<_, (String, i64)>(
        "SELECT date, SUM(amount_cents) FROM expenses \
         WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1 \
         GROUP BY date",
    )
    .bind(month)
    .fetch_all(pool)
    .await?;
    let expense_map: HashMap<String, i64> = raw_expenses.into_iter().collect();

    let raw_income = sqlx::query_as::<_, (String, i64)>(
        "SELECT date, SUM(amount_cents) FROM income_entries \
         WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1 \
         GROUP BY date",
    )
    .bind(month)
    .fetch_all(pool)
    .await?;
    let income_map: HashMap<String, i64> = raw_income.into_iter().collect();

    let days = days_in_month(month)?;
    let calendar_days = (1..=days)
        .map(|day| {
            let date = format!("{month}-{day:02}");
            CalendarDay {
                income_cents: *income_map.get(&date).unwrap_or(&0),
                expense_cents: *expense_map.get(&date).unwrap_or(&0),
                date,
            }
        })
        .collect();
    Ok(calendar_days)
}

/// Trailing `months` (inclusive of `month`), oldest first, for the savings
/// trend chart. Anchored to the dashboard's selected month, not "today", so
/// browsing a past month shows the trend leading up to it.
pub async fn get_savings_trend(
    pool: &Pool<Sqlite>,
    month: &str,
    months: i32,
) -> AppResult<Vec<SavingsTrendPoint>> {
    let mut points = Vec::with_capacity(months.max(0) as usize);
    for i in (0..months).rev() {
        let point_month = shift_month(month, -i)?;
        let total_cents: i64 = sqlx::query_scalar::<_, i64>(
            "SELECT COALESCE(SUM(amount_cents), 0) FROM savings_entries \
             WHERE deleted_at IS NULL AND strftime('%Y-%m', date) = ?1",
        )
        .bind(&point_month)
        .fetch_one(pool)
        .await?;
        points.push(SavingsTrendPoint {
            month: point_month,
            total_cents,
        });
    }
    Ok(points)
}
