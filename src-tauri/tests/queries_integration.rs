//! Integration tests per docs/testing/TESTING_STRATEGY.md: round-trip each
//! query module against a real (temp file) SQLite DB, migrated exactly like
//! the app migrates it.

use app_lib::error::AppError;
use app_lib::models::{
    ConfirmFixedExpenseInput, CreateCategoryInput, CreateExpenseInput, CreateFixedExpenseInput,
    CreateGoalInput, CreateIncomeInput, CreateSavingsEntryInput, EntryFilter, SavingsEntryFilter,
    SkipFixedExpenseInput, UpdateCategoryInput, UpdateExpenseInput, UpdateFixedExpenseInput,
    UpdateGoalInput, UpdateIncomeInput, UpdateSavingsEntryInput,
};
use app_lib::queries::{
    backup, budgets, categories, dashboard, expenses, fixed_expenses, goals, income, reports,
    savings,
};
use chrono::{NaiveDate, Utc};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::{Pool, Sqlite};
use std::path::Path;
use tempfile::TempDir;

const GROCERIES: &str = "18d83cb2-4ad3-4825-a507-d8633e05512d";
const HOUSE_RENT: &str = "65db217b-b3e1-42cc-aa74-e32bd591d3c7";
const SALARY: &str = "be34f2bc-727e-494e-bb7f-fd44106b919a";

async fn fresh_pool() -> (TempDir, Pool<Sqlite>) {
    let dir = TempDir::new().expect("create temp dir");
    let db_path = dir.path().join("test.db");
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);
    let pool = SqlitePoolOptions::new()
        .connect_with(options)
        .await
        .expect("connect to temp sqlite db");

    for sql in [
        include_str!("../migrations/001_init.sql"),
        include_str!("../migrations/002_category_archive.sql"),
        include_str!("../migrations/003_fixed_expense_skips.sql"),
    ] {
        sqlx::raw_sql(sql)
            .execute(&pool)
            .await
            .expect("apply migration");
    }

    (dir, pool)
}

/// Same as `fresh_pool`, but with the journal mode explicitly forced to WAL —
/// used to reproduce the class of bug where a raw file copy of the main `.db`
/// misses commits still sitting in the `-wal` sidecar file.
async fn fresh_wal_pool() -> (TempDir, Pool<Sqlite>) {
    let dir = TempDir::new().expect("create temp dir");
    let db_path = dir.path().join("test.db");
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal);
    let pool = SqlitePoolOptions::new()
        .connect_with(options)
        .await
        .expect("connect to temp sqlite db");

    for sql in [
        include_str!("../migrations/001_init.sql"),
        include_str!("../migrations/002_category_archive.sql"),
        include_str!("../migrations/003_fixed_expense_skips.sql"),
    ] {
        sqlx::raw_sql(sql)
            .execute(&pool)
            .await
            .expect("apply migration");
    }

    (dir, pool)
}

async fn open_pool_at(path: &Path) -> Pool<Sqlite> {
    let options = SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(false);
    SqlitePoolOptions::new()
        .connect_with(options)
        .await
        .expect("connect to existing sqlite db")
}

#[tokio::test]
async fn category_create_update_archive_round_trip() {
    let (_dir, pool) = fresh_pool().await;

    let created = categories::create(
        &pool,
        CreateCategoryInput {
            name: "Pet Care".into(),
            category_type: "expense".into(),
            icon: "paw-print".into(),
            color: "#3DDC97".into(),
        },
    )
    .await
    .unwrap();
    assert_eq!(created.name, "Pet Care");
    assert!(!created.is_system);
    assert!(!created.is_archived);

    let updated = categories::update(
        &pool,
        &created.id,
        UpdateCategoryInput {
            name: "Pet Expenses".into(),
            icon: "paw-print".into(),
            color: "#FF5C7A".into(),
        },
    )
    .await
    .unwrap();
    assert_eq!(updated.name, "Pet Expenses");
    assert_eq!(updated.color, "#FF5C7A");

    let archived = categories::set_archived(&pool, &created.id, true)
        .await
        .unwrap();
    assert!(archived.is_archived);

    let active_only = categories::list(&pool, Some("expense"), false)
        .await
        .unwrap();
    assert!(!active_only.iter().any(|c| c.id == created.id));

    let including_archived = categories::list(&pool, Some("expense"), true)
        .await
        .unwrap();
    assert!(including_archived.iter().any(|c| c.id == created.id));
}

#[tokio::test]
async fn system_categories_cannot_be_renamed() {
    let (_dir, pool) = fresh_pool().await;

    let result = categories::update(
        &pool,
        GROCERIES,
        UpdateCategoryInput {
            name: "Hacked".into(),
            icon: "shopping-cart".into(),
            color: "#000000".into(),
        },
    )
    .await;

    assert!(matches!(result, Err(AppError::Validation(_))));
}

#[tokio::test]
async fn expense_create_list_update_delete_round_trip() {
    let (_dir, pool) = fresh_pool().await;

    let created = expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 15_000,
            category_id: GROCERIES.into(),
            date: "2026-08-10".into(),
            note: Some("Weekly shop".into()),
        },
    )
    .await
    .unwrap();
    assert_eq!(created.amount_cents, 15_000);
    assert_eq!(created.category_name, "Groceries");

    let listed = expenses::list(&pool, &EntryFilter::default())
        .await
        .unwrap();
    assert_eq!(listed.len(), 1);
    assert_eq!(listed[0].id, created.id);

    let updated = expenses::update(
        &pool,
        &created.id,
        UpdateExpenseInput {
            amount_cents: 20_000,
            category_id: GROCERIES.into(),
            date: "2026-08-11".into(),
            note: Some("Weekly shop, revised".into()),
        },
    )
    .await
    .unwrap();
    assert_eq!(updated.amount_cents, 20_000);
    assert_eq!(updated.date, "2026-08-11");

    expenses::soft_delete(&pool, &created.id).await.unwrap();

    let after_delete = expenses::list(&pool, &EntryFilter::default())
        .await
        .unwrap();
    assert!(after_delete.is_empty());

    let second_delete = expenses::soft_delete(&pool, &created.id).await;
    assert!(matches!(second_delete, Err(AppError::NotFound)));
}

#[tokio::test]
async fn expense_filters_combine_correctly() {
    let (_dir, pool) = fresh_pool().await;

    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 5_000,
            category_id: GROCERIES.into(),
            date: "2026-08-01".into(),
            note: Some("Milk and bread".into()),
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 50_000,
            category_id: HOUSE_RENT.into(),
            date: "2026-08-05".into(),
            note: Some("August rent".into()),
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 3_000,
            category_id: GROCERIES.into(),
            date: "2026-07-20".into(),
            note: Some("Snacks".into()),
        },
    )
    .await
    .unwrap();

    let filter = EntryFilter {
        date_from: Some("2026-08-01".into()),
        date_to: Some("2026-08-31".into()),
        category_ids: Some(vec![GROCERIES.into()]),
        keyword: Some("milk".into()),
        ..Default::default()
    };
    let filtered = expenses::list(&pool, &filter).await.unwrap();
    assert_eq!(filtered.len(), 1);
    assert_eq!(filtered[0].note.as_deref(), Some("Milk and bread"));

    let amount_filter = EntryFilter {
        min_amount_cents: Some(10_000),
        ..Default::default()
    };
    let by_amount = expenses::list(&pool, &amount_filter).await.unwrap();
    assert_eq!(by_amount.len(), 1);
    assert_eq!(by_amount[0].category_name, "House Rent");
}

#[tokio::test]
async fn income_create_list_update_delete_round_trip() {
    let (_dir, pool) = fresh_pool().await;

    let created = income::create(
        &pool,
        CreateIncomeInput {
            amount_cents: 500_000,
            category_id: SALARY.into(),
            source: Some("Acme Corp".into()),
            date: "2026-08-01".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    assert_eq!(created.source.as_deref(), Some("Acme Corp"));

    let listed = income::list(&pool, &EntryFilter::default()).await.unwrap();
    assert_eq!(listed.len(), 1);

    let updated = income::update(
        &pool,
        &created.id,
        UpdateIncomeInput {
            amount_cents: 550_000,
            category_id: SALARY.into(),
            source: Some("Acme Corp".into()),
            date: "2026-08-01".into(),
            note: Some("Includes bonus".into()),
        },
    )
    .await
    .unwrap();
    assert_eq!(updated.amount_cents, 550_000);

    income::soft_delete(&pool, &created.id).await.unwrap();
    let after_delete = income::list(&pool, &EntryFilter::default()).await.unwrap();
    assert!(after_delete.is_empty());
}

#[tokio::test]
async fn fixed_expense_pending_only_shows_on_or_after_due_day() {
    let (_dir, pool) = fresh_pool().await;

    let template = fixed_expenses::create(
        &pool,
        CreateFixedExpenseInput {
            name: "House Rent".into(),
            amount_cents: 500_000,
            category_id: HOUSE_RENT.into(),
            day_of_month: 5,
        },
    )
    .await
    .unwrap();

    let before_due = NaiveDate::from_ymd_opt(2026, 8, 3).unwrap();
    let pending_before = fixed_expenses::list_pending(&pool, "2026-08", before_due)
        .await
        .unwrap();
    assert!(pending_before.is_empty(), "not due yet on Aug 3");

    let on_due_day = NaiveDate::from_ymd_opt(2026, 8, 5).unwrap();
    let pending_on = fixed_expenses::list_pending(&pool, "2026-08", on_due_day)
        .await
        .unwrap();
    assert_eq!(pending_on.len(), 1);
    assert_eq!(pending_on[0].fixed_expense_id, template.id);
    assert_eq!(pending_on[0].due_date, "2026-08-05");

    let past_month = fixed_expenses::list_pending(&pool, "2026-07", on_due_day)
        .await
        .unwrap();
    assert_eq!(
        past_month.len(),
        1,
        "unconfirmed past months are always overdue"
    );
}

#[tokio::test]
async fn confirming_a_fixed_expense_posts_a_linked_expense_and_clears_pending() {
    let (_dir, pool) = fresh_pool().await;

    let template = fixed_expenses::create(
        &pool,
        CreateFixedExpenseInput {
            name: "House Rent".into(),
            amount_cents: 500_000,
            category_id: HOUSE_RENT.into(),
            day_of_month: 5,
        },
    )
    .await
    .unwrap();

    let today = NaiveDate::from_ymd_opt(2026, 8, 5).unwrap();
    assert_eq!(
        fixed_expenses::list_pending(&pool, "2026-08", today)
            .await
            .unwrap()
            .len(),
        1
    );

    let posted = fixed_expenses::confirm(
        &pool,
        ConfirmFixedExpenseInput {
            fixed_expense_id: template.id.clone(),
            amount_cents: 500_000,
            date: "2026-08-05".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    assert_eq!(
        posted.fixed_expense_id.as_deref(),
        Some(template.id.as_str())
    );
    assert_eq!(posted.category_name, "House Rent");

    let pending_after = fixed_expenses::list_pending(&pool, "2026-08", today)
        .await
        .unwrap();
    assert!(
        pending_after.is_empty(),
        "confirmed items drop off the pending list"
    );
}

#[tokio::test]
async fn skipping_a_fixed_expense_clears_pending_without_posting_an_expense() {
    let (_dir, pool) = fresh_pool().await;

    let template = fixed_expenses::create(
        &pool,
        CreateFixedExpenseInput {
            name: "House Rent".into(),
            amount_cents: 500_000,
            category_id: HOUSE_RENT.into(),
            day_of_month: 5,
        },
    )
    .await
    .unwrap();

    fixed_expenses::skip(
        &pool,
        SkipFixedExpenseInput {
            fixed_expense_id: template.id.clone(),
            month: "2026-08".into(),
        },
    )
    .await
    .unwrap();

    let today = NaiveDate::from_ymd_opt(2026, 8, 5).unwrap();
    let pending = fixed_expenses::list_pending(&pool, "2026-08", today)
        .await
        .unwrap();
    assert!(pending.is_empty());

    let posted_expenses = expenses::list(&pool, &EntryFilter::default())
        .await
        .unwrap();
    assert!(
        posted_expenses.is_empty(),
        "skip must not post a real expense"
    );
}

#[tokio::test]
async fn deactivating_a_fixed_expense_template_removes_it_from_pending() {
    let (_dir, pool) = fresh_pool().await;

    let template = fixed_expenses::create(
        &pool,
        CreateFixedExpenseInput {
            name: "House Rent".into(),
            amount_cents: 500_000,
            category_id: HOUSE_RENT.into(),
            day_of_month: 5,
        },
    )
    .await
    .unwrap();

    fixed_expenses::update(
        &pool,
        &template.id,
        UpdateFixedExpenseInput {
            name: template.name.clone(),
            amount_cents: template.amount_cents,
            category_id: template.category_id.clone(),
            day_of_month: template.day_of_month,
            is_active: false,
        },
    )
    .await
    .unwrap();

    let today = NaiveDate::from_ymd_opt(2026, 8, 5).unwrap();
    let pending = fixed_expenses::list_pending(&pool, "2026-08", today)
        .await
        .unwrap();
    assert!(pending.is_empty());
}

#[tokio::test]
async fn budget_summary_aggregates_spend_per_category_and_overall() {
    let (_dir, pool) = fresh_pool().await;

    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 5_000,
            category_id: GROCERIES.into(),
            date: "2026-08-01".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 3_000,
            category_id: GROCERIES.into(),
            date: "2026-08-15".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    // Different month — must not be counted.
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 99_000,
            category_id: GROCERIES.into(),
            date: "2026-07-15".into(),
            note: None,
        },
    )
    .await
    .unwrap();

    budgets::set_overall_budget(&pool, "2026-08", 100_000)
        .await
        .unwrap();
    let summary = budgets::set_category_budget(&pool, "2026-08", GROCERIES, 10_000)
        .await
        .unwrap();

    assert_eq!(summary.overall_budget_cents, 100_000);
    assert_eq!(
        summary.overall_spent_cents, 8_000,
        "only August expenses count"
    );

    let groceries = summary
        .categories
        .iter()
        .find(|c| c.category_id == GROCERIES)
        .unwrap();
    assert_eq!(groceries.budget_cents, 10_000);
    assert_eq!(groceries.spent_cents, 8_000);

    let house_rent = summary
        .categories
        .iter()
        .find(|c| c.category_id == HOUSE_RENT)
        .unwrap();
    assert_eq!(house_rent.budget_cents, 0, "no budget set yet");
    assert_eq!(house_rent.spent_cents, 0, "no spend yet");
}

#[tokio::test]
async fn setting_a_budget_twice_updates_in_place_not_duplicates() {
    let (_dir, pool) = fresh_pool().await;

    budgets::set_overall_budget(&pool, "2026-08", 50_000)
        .await
        .unwrap();
    let summary = budgets::set_overall_budget(&pool, "2026-08", 75_000)
        .await
        .unwrap();
    assert_eq!(summary.overall_budget_cents, 75_000);

    let row_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM budgets WHERE month = '2026-08' AND category_id IS NULL",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(
        row_count, 1,
        "re-setting the overall budget must not duplicate the row"
    );

    budgets::set_category_budget(&pool, "2026-08", GROCERIES, 10_000)
        .await
        .unwrap();
    let summary = budgets::set_category_budget(&pool, "2026-08", GROCERIES, 20_000)
        .await
        .unwrap();
    let groceries = summary
        .categories
        .iter()
        .find(|c| c.category_id == GROCERIES)
        .unwrap();
    assert_eq!(groceries.budget_cents, 20_000);

    let category_row_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM budgets WHERE month = '2026-08' AND category_id = ?1",
    )
    .bind(GROCERIES)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(category_row_count, 1);
}

#[tokio::test]
async fn copy_last_month_duplicates_prior_budgets() {
    let (_dir, pool) = fresh_pool().await;

    let copied_when_empty = budgets::copy_last_month(&pool, "2026-08").await.unwrap();
    assert_eq!(
        copied_when_empty, 0,
        "nothing to copy when July has no budget"
    );

    budgets::set_overall_budget(&pool, "2026-07", 100_000)
        .await
        .unwrap();
    budgets::set_category_budget(&pool, "2026-07", GROCERIES, 15_000)
        .await
        .unwrap();
    budgets::set_category_budget(&pool, "2026-07", HOUSE_RENT, 50_000)
        .await
        .unwrap();

    let copied = budgets::copy_last_month(&pool, "2026-08").await.unwrap();
    assert_eq!(copied, 3);

    let summary = budgets::get_summary(&pool, "2026-08").await.unwrap();
    assert_eq!(summary.overall_budget_cents, 100_000);
    let groceries = summary
        .categories
        .iter()
        .find(|c| c.category_id == GROCERIES)
        .unwrap();
    assert_eq!(groceries.budget_cents, 15_000);
    let house_rent = summary
        .categories
        .iter()
        .find(|c| c.category_id == HOUSE_RENT)
        .unwrap();
    assert_eq!(house_rent.budget_cents, 50_000);
}

async fn insert_savings_entry(pool: &Pool<Sqlite>, amount_cents: i64, date: &str) {
    sqlx::query(
        "INSERT INTO savings_entries (id, amount_cents, type, date) VALUES (?1, ?2, 'general', ?3)",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(amount_cents)
    .bind(date)
    .execute(pool)
    .await
    .unwrap();
}

#[tokio::test]
async fn dashboard_summary_matches_underlying_data_exactly() {
    let (_dir, pool) = fresh_pool().await;

    income::create(
        &pool,
        CreateIncomeInput {
            amount_cents: 500_000,
            category_id: SALARY.into(),
            source: None,
            date: "2026-08-01".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 5_000,
            category_id: GROCERIES.into(),
            date: "2026-08-03".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 3_000,
            category_id: GROCERIES.into(),
            date: "2026-08-03".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 50_000,
            category_id: HOUSE_RENT.into(),
            date: "2026-08-05".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    // Different month — must not leak into August totals.
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 99_000,
            category_id: GROCERIES.into(),
            date: "2026-07-15".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    insert_savings_entry(&pool, 20_000, "2026-08-10").await;

    let summary = dashboard::get_summary(&pool, "2026-08").await.unwrap();

    assert_eq!(summary.income_cents, 500_000);
    assert_eq!(
        summary.expenses_cents, 58_000,
        "5_000 + 3_000 + 50_000, July excluded"
    );
    assert_eq!(summary.savings_cents, 20_000);
    assert_eq!(summary.remaining_cents, 500_000 - 58_000 - 20_000);

    let groceries = summary
        .spending_by_category
        .iter()
        .find(|c| c.category_id == GROCERIES)
        .unwrap();
    assert_eq!(
        groceries.amount_cents, 8_000,
        "5_000 + 3_000 combined for the day"
    );
    let house_rent = summary
        .spending_by_category
        .iter()
        .find(|c| c.category_id == HOUSE_RENT)
        .unwrap();
    assert_eq!(house_rent.amount_cents, 50_000);
    assert!(
        !summary
            .spending_by_category
            .iter()
            .any(|c| c.category_name == "Dining"),
        "categories with zero spend should not appear in the donut breakdown"
    );

    assert_eq!(summary.daily_spending.len(), 31, "August has 31 days");
    let day3 = summary
        .daily_spending
        .iter()
        .find(|d| d.date == "2026-08-03")
        .unwrap();
    assert_eq!(day3.amount_cents, 8_000);
    let day1 = summary
        .daily_spending
        .iter()
        .find(|d| d.date == "2026-08-01")
        .unwrap();
    assert_eq!(
        day1.amount_cents, 0,
        "days with no spend must still appear, at zero"
    );

    assert_eq!(summary.recent_transactions.len(), 3);
    assert_eq!(
        summary.recent_transactions[0].date, "2026-08-05",
        "most recent first"
    );
}

#[tokio::test]
async fn savings_trend_covers_trailing_months_in_order() {
    let (_dir, pool) = fresh_pool().await;

    insert_savings_entry(&pool, 10_000, "2026-06-15").await;
    insert_savings_entry(&pool, 15_000, "2026-08-01").await;
    insert_savings_entry(&pool, 5_000, "2026-08-20").await;

    let trend = dashboard::get_savings_trend(&pool, "2026-08", 3)
        .await
        .unwrap();

    assert_eq!(trend.len(), 3);
    assert_eq!(trend[0].month, "2026-06");
    assert_eq!(trend[0].total_cents, 10_000);
    assert_eq!(trend[1].month, "2026-07");
    assert_eq!(trend[1].total_cents, 0);
    assert_eq!(trend[2].month, "2026-08");
    assert_eq!(trend[2].total_cents, 20_000);
}

async fn insert_goal_with_created_at(
    pool: &Pool<Sqlite>,
    name: &str,
    goal_type: &str,
    monthly_contribution_cents: i64,
    target_date: &str,
    created_at: &str,
) -> String {
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO goals (id, name, type, monthly_contribution_cents, target_date, created_at, updated_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
    )
    .bind(&id)
    .bind(name)
    .bind(goal_type)
    .bind(monthly_contribution_cents)
    .bind(target_date)
    .bind(created_at)
    .execute(pool)
    .await
    .unwrap();
    id
}

#[tokio::test]
async fn goal_create_update_archive_round_trip() {
    let (_dir, pool) = fresh_pool().await;

    let created = goals::create(
        &pool,
        CreateGoalInput {
            name: "Emergency Fund".into(),
            goal_type: "emergency_fund".into(),
            target_amount_cents: Some(1_000_000),
            monthly_contribution_cents: None,
            target_date: None,
        },
    )
    .await
    .unwrap();
    assert_eq!(created.name, "Emergency Fund");
    assert!(created.is_active);

    let updated = goals::update(
        &pool,
        &created.id,
        UpdateGoalInput {
            name: "6-Month Emergency Fund".into(),
            goal_type: "emergency_fund".into(),
            target_amount_cents: Some(1_200_000),
            monthly_contribution_cents: None,
            target_date: None,
        },
    )
    .await
    .unwrap();
    assert_eq!(updated.name, "6-Month Emergency Fund");
    assert_eq!(updated.target_amount_cents, Some(1_200_000));

    let archived = goals::set_active(&pool, &created.id, false).await.unwrap();
    assert!(!archived.is_active);

    let active_only = goals::list(&pool, false).await.unwrap();
    assert!(!active_only.iter().any(|g| g.id == created.id));

    let including_archived = goals::list(&pool, true).await.unwrap();
    assert!(including_archived.iter().any(|g| g.id == created.id));
}

#[tokio::test]
async fn goal_progress_aggregates_contributions_and_caps_at_100_percent() {
    let (_dir, pool) = fresh_pool().await;

    let goal = goals::create(
        &pool,
        CreateGoalInput {
            name: "New Laptop".into(),
            goal_type: "savings".into(),
            target_amount_cents: Some(100_000),
            monthly_contribution_cents: None,
            target_date: None,
        },
    )
    .await
    .unwrap();

    savings::create(
        &pool,
        CreateSavingsEntryInput {
            amount_cents: 40_000,
            entry_type: "goal".into(),
            goal_id: Some(goal.id.clone()),
            date: "2026-08-01".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    savings::create(
        &pool,
        CreateSavingsEntryInput {
            amount_cents: 90_000,
            entry_type: "goal".into(),
            goal_id: Some(goal.id.clone()),
            date: "2026-08-15".into(),
            note: None,
        },
    )
    .await
    .unwrap();

    let today = NaiveDate::from_ymd_opt(2026, 8, 20).unwrap();
    let progress = goals::list_progress(&pool, false, today).await.unwrap();
    let goal_progress = progress.iter().find(|p| p.id == goal.id).unwrap();

    assert_eq!(goal_progress.contributed_cents, 130_000, "40_000 + 90_000");
    assert_eq!(
        goal_progress.progress_percent, 100.0,
        "contributions past target must cap at 100%, not overshoot"
    );
}

#[tokio::test]
async fn dps_goal_projects_maturity_from_installment_and_tenure() {
    let (_dir, pool) = fresh_pool().await;

    let goal_id = insert_goal_with_created_at(
        &pool,
        "DPS - 5yr",
        "dps",
        5_000,
        "2031-01-01",
        "2026-01-01T00:00:00.000Z",
    )
    .await;

    let today = NaiveDate::from_ymd_opt(2026, 8, 1).unwrap();
    let progress = goals::list_progress(&pool, false, today).await.unwrap();
    let dps = progress.iter().find(|p| p.id == goal_id).unwrap();

    assert_eq!(
        dps.projected_maturity_cents,
        Some(5_000 * 60),
        "5_000/month across a 5-year (60-month) tenure"
    );
}

#[tokio::test]
async fn logging_a_contribution_updates_goal_progress_and_dashboard_savings_kpi() {
    let (_dir, pool) = fresh_pool().await;

    let goal = goals::create(
        &pool,
        CreateGoalInput {
            name: "DPS - 3yr".into(),
            goal_type: "dps".into(),
            target_amount_cents: None,
            monthly_contribution_cents: Some(5_000),
            target_date: Some("2029-01-01".into()),
        },
    )
    .await
    .unwrap();

    let before = dashboard::get_summary(&pool, "2026-08").await.unwrap();
    assert_eq!(before.savings_cents, 0);

    savings::create(
        &pool,
        CreateSavingsEntryInput {
            amount_cents: 5_000,
            entry_type: "dps".into(),
            goal_id: Some(goal.id.clone()),
            date: "2026-08-10".into(),
            note: None,
        },
    )
    .await
    .unwrap();

    let today = NaiveDate::from_ymd_opt(2026, 8, 10).unwrap();
    let progress = goals::list_progress(&pool, false, today).await.unwrap();
    let goal_progress = progress.iter().find(|p| p.id == goal.id).unwrap();
    assert_eq!(goal_progress.contributed_cents, 5_000);

    let after = dashboard::get_summary(&pool, "2026-08").await.unwrap();
    assert_eq!(
        after.savings_cents, 5_000,
        "the dashboard's Savings KPI must reflect the new contribution immediately"
    );
}

#[tokio::test]
async fn savings_entries_can_be_created_listed_updated_and_soft_deleted() {
    let (_dir, pool) = fresh_pool().await;

    let created = savings::create(
        &pool,
        CreateSavingsEntryInput {
            amount_cents: 10_000,
            entry_type: "general".into(),
            goal_id: None,
            date: "2026-08-05".into(),
            note: Some("ad-hoc top-up".into()),
        },
    )
    .await
    .unwrap();
    assert_eq!(created.entry_type, "general");
    assert!(created.goal_id.is_none());

    let updated = savings::update(
        &pool,
        &created.id,
        UpdateSavingsEntryInput {
            amount_cents: 12_000,
            entry_type: "general".into(),
            goal_id: None,
            date: "2026-08-05".into(),
            note: Some("ad-hoc top-up, corrected".into()),
        },
    )
    .await
    .unwrap();
    assert_eq!(updated.amount_cents, 12_000);

    let filtered = savings::list(
        &pool,
        &SavingsEntryFilter {
            date_from: Some("2026-08-01".into()),
            date_to: Some("2026-08-31".into()),
            goal_id: None,
            entry_type: Some("general".into()),
        },
    )
    .await
    .unwrap();
    assert_eq!(filtered.len(), 1);

    savings::soft_delete(&pool, &created.id).await.unwrap();
    let after_delete = savings::list(&pool, &SavingsEntryFilter::default())
        .await
        .unwrap();
    assert!(!after_delete.iter().any(|e| e.id == created.id));
}

#[tokio::test]
async fn report_matches_dashboard_summary_for_same_month() {
    let (_dir, pool) = fresh_pool().await;

    income::create(
        &pool,
        CreateIncomeInput {
            amount_cents: 500_000,
            category_id: SALARY.into(),
            source: None,
            date: "2026-08-01".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 15_000,
            category_id: GROCERIES.into(),
            date: "2026-08-05".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    insert_savings_entry(&pool, 10_000, "2026-08-10").await;
    budgets::set_overall_budget(&pool, "2026-08", 200_000)
        .await
        .unwrap();

    let dashboard_summary = dashboard::get_summary(&pool, "2026-08").await.unwrap();
    let report = reports::get_report(&pool, "2026-08").await.unwrap();

    assert_eq!(report.income_cents, dashboard_summary.income_cents);
    assert_eq!(report.expenses_cents, dashboard_summary.expenses_cents);
    assert_eq!(report.savings_cents, dashboard_summary.savings_cents);
    assert_eq!(report.remaining_cents, dashboard_summary.remaining_cents);
}

#[tokio::test]
async fn report_category_breakdown_sums_to_total_expenses_including_archived_categories() {
    let (_dir, pool) = fresh_pool().await;

    let side_category = categories::create(
        &pool,
        CreateCategoryInput {
            name: "One-off".into(),
            category_type: "expense".into(),
            icon: "more-horizontal".into(),
            color: "#9AA3B2".into(),
        },
    )
    .await
    .unwrap();

    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 20_000,
            category_id: GROCERIES.into(),
            date: "2026-08-05".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 7_500,
            category_id: side_category.id.clone(),
            date: "2026-08-06".into(),
            note: None,
        },
    )
    .await
    .unwrap();

    // Archive the category *after* it has spend — a budget-scoped
    // (active-only) query would silently drop this category's spend from
    // the breakdown, which would break the "sums to total" invariant.
    categories::set_archived(&pool, &side_category.id, true)
        .await
        .unwrap();

    let report = reports::get_report(&pool, "2026-08").await.unwrap();
    let breakdown_total: i64 = report.categories.iter().map(|c| c.spent_cents).sum();

    assert_eq!(breakdown_total, report.expenses_cents);
    assert_eq!(report.expenses_cents, 27_500);
    assert!(
        report
            .categories
            .iter()
            .any(|c| c.category_id == side_category.id),
        "an archived category with spend this month must still appear in the breakdown"
    );
}

#[tokio::test]
async fn report_csv_export_is_well_formed_and_contains_expected_totals() {
    let (_dir, pool) = fresh_pool().await;

    income::create(
        &pool,
        CreateIncomeInput {
            amount_cents: 500_000,
            category_id: SALARY.into(),
            source: None,
            date: "2026-08-01".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    expenses::create(
        &pool,
        CreateExpenseInput {
            amount_cents: 15_000,
            category_id: GROCERIES.into(),
            date: "2026-08-05".into(),
            note: None,
        },
    )
    .await
    .unwrap();
    budgets::set_category_budget(&pool, "2026-08", GROCERIES, 20_000)
        .await
        .unwrap();

    let report = reports::get_report(&pool, "2026-08").await.unwrap();

    let mut buffer: Vec<u8> = Vec::new();
    reports::write_report_csv(&mut buffer, &report).unwrap();

    let mut reader = csv::ReaderBuilder::new()
        .flexible(true)
        .has_headers(false)
        .from_reader(buffer.as_slice());
    let records: Vec<csv::StringRecord> = reader.records().map(|r| r.unwrap()).collect();

    let find_metric = |name: &str| -> String {
        records
            .iter()
            .find(|r| r.get(0) == Some(name))
            .unwrap_or_else(|| panic!("missing metric row: {name}"))
            .get(1)
            .unwrap()
            .to_string()
    };
    assert_eq!(find_metric("Month"), "2026-08");
    assert_eq!(find_metric("Income"), "5000.00");
    assert_eq!(find_metric("Expenses"), "150.00");

    let groceries_row = records
        .iter()
        .find(|r| r.get(0) == Some("Groceries"))
        .expect("category breakdown row for Groceries");
    assert_eq!(groceries_row.get(1), Some("150.00"), "spent");
    assert_eq!(groceries_row.get(2), Some("200.00"), "budget");
}

async fn insert_backup_log(pool: &Pool<Sqlite>, file_path: &str, trigger: &str, created_at: &str) {
    sqlx::query(
        "INSERT INTO backups_log (id, file_path, trigger, created_at) VALUES (?1, ?2, ?3, ?4)",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(file_path)
    .bind(trigger)
    .bind(created_at)
    .execute(pool)
    .await
    .unwrap();
}

#[tokio::test]
async fn manual_backup_produces_row_count_matching_file() {
    let (dir, pool) = fresh_pool().await;
    let live_path = dir.path().join("test.db");

    for i in 0..3 {
        expenses::create(
            &pool,
            CreateExpenseInput {
                amount_cents: 1_000 * (i + 1),
                category_id: GROCERIES.into(),
                date: "2026-08-01".into(),
                note: None,
            },
        )
        .await
        .unwrap();
    }
    let original_count = expenses::list(&pool, &EntryFilter::default())
        .await
        .unwrap()
        .len();

    let backup_dir = TempDir::new().unwrap();
    let backup_path = backup_dir
        .path()
        .join("finance-backup-2026-08-14-1200.sqlite");
    backup::copy_file(&live_path, &backup_path).unwrap();

    let backup_pool = open_pool_at(&backup_path).await;
    let backup_count = expenses::list(&backup_pool, &EntryFilter::default())
        .await
        .unwrap()
        .len();

    assert_eq!(backup_count, original_count);
    assert_eq!(backup_count, 3);
}

#[tokio::test]
async fn restore_swaps_live_db_and_creates_safety_copy_first() {
    let (live_dir, live_pool) = fresh_pool().await;
    let live_path = live_dir.path().join("test.db");
    expenses::create(
        &live_pool,
        CreateExpenseInput {
            amount_cents: 1_000,
            category_id: GROCERIES.into(),
            date: "2026-08-01".into(),
            note: Some("Live data".into()),
        },
    )
    .await
    .unwrap();

    let (backup_dir, backup_pool) = fresh_pool().await;
    let backup_path = backup_dir.path().join("test.db");
    expenses::create(
        &backup_pool,
        CreateExpenseInput {
            amount_cents: 2_000,
            category_id: GROCERIES.into(),
            date: "2026-08-02".into(),
            note: Some("Backup data".into()),
        },
    )
    .await
    .unwrap();
    backup_pool.close().await;

    backup::validate_backup_file(&backup_path).await.unwrap();

    let auto_dir = TempDir::new().unwrap();
    let safety_copy_path = auto_dir.path().join("pre-restore-test.sqlite");
    backup::copy_file(&live_path, &safety_copy_path).unwrap();

    live_pool.close().await;
    backup::copy_file(&backup_path, &live_path).unwrap();

    let restored_pool = open_pool_at(&live_path).await;
    let restored = expenses::list(&restored_pool, &EntryFilter::default())
        .await
        .unwrap();
    assert_eq!(restored.len(), 1);
    assert_eq!(
        restored[0].note.as_deref(),
        Some("Backup data"),
        "live DB must now contain the restored backup's data"
    );

    let safety_pool = open_pool_at(&safety_copy_path).await;
    let preserved = expenses::list(&safety_pool, &EntryFilter::default())
        .await
        .unwrap();
    assert_eq!(preserved.len(), 1);
    assert_eq!(
        preserved[0].note.as_deref(),
        Some("Live data"),
        "the pre-restore safety copy must preserve what was live before the restore"
    );
}

#[tokio::test]
async fn restoring_invalid_file_fails_without_touching_live_data() {
    let (live_dir, live_pool) = fresh_pool().await;
    let live_path = live_dir.path().join("test.db");
    expenses::create(
        &live_pool,
        CreateExpenseInput {
            amount_cents: 5_000,
            category_id: GROCERIES.into(),
            date: "2026-08-01".into(),
            note: Some("Untouched live data".into()),
        },
    )
    .await
    .unwrap();

    let garbage_dir = TempDir::new().unwrap();
    let garbage_path = garbage_dir.path().join("not-a-backup.sqlite");
    std::fs::write(&garbage_path, b"this is not a sqlite database").unwrap();

    let live_bytes_before = std::fs::read(&live_path).unwrap();
    let result = backup::validate_backup_file(&garbage_path).await;
    assert!(result.is_err());

    let live_bytes_after = std::fs::read(&live_path).unwrap();
    assert_eq!(
        live_bytes_before, live_bytes_after,
        "live DB file must be byte-for-byte unchanged after a rejected restore"
    );

    let still_live = expenses::list(&live_pool, &EntryFilter::default())
        .await
        .unwrap();
    assert_eq!(still_live[0].note.as_deref(), Some("Untouched live data"));

    // A structurally-valid but wrong-schema SQLite file must also be rejected.
    let (empty_dir, empty_pool) = fresh_pool().await;
    let empty_path = empty_dir.path().join("test.db");
    sqlx::raw_sql("DROP TABLE backups_log")
        .execute(&empty_pool)
        .await
        .unwrap();
    empty_pool.close().await;
    let wrong_schema_result = backup::validate_backup_file(&empty_path).await;
    assert!(wrong_schema_result.is_err());
}

#[tokio::test]
async fn stale_backup_reminder_reflects_last_manual_backup_and_ignores_safety_copies() {
    let (_dir, pool) = fresh_pool().await;
    let now = Utc::now();

    let old_manual = (now - chrono::Duration::days(20)).to_rfc3339();
    insert_backup_log(&pool, "/backups/old.sqlite", "manual", &old_manual).await;
    let recent_safety = now.to_rfc3339();
    insert_backup_log(
        &pool,
        "/backups/auto/safety.sqlite",
        "pre_restore_safety",
        &recent_safety,
    )
    .await;

    let last = backup::get_last_manual_backup(&pool)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(
        last.file_path, "/backups/old.sqlite",
        "a recent pre_restore_safety row must not count as the last manual backup"
    );
    assert!(backup::is_stale(Some(&last.created_at), now));

    let recent_manual = (now - chrono::Duration::days(2)).to_rfc3339();
    insert_backup_log(&pool, "/backups/new.sqlite", "manual", &recent_manual).await;

    let last = backup::get_last_manual_backup(&pool)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(last.file_path, "/backups/new.sqlite");
    assert!(!backup::is_stale(Some(&last.created_at), now));
}

#[tokio::test]
async fn wal_checkpoint_makes_recent_commits_visible_in_a_raw_file_copy() {
    let (dir, pool) = fresh_wal_pool().await;
    let live_path = dir.path().join("test.db");
    assert!(
        dir.path().join("test.db-wal").exists(),
        "WAL sidecar file should exist once the pool has written to a WAL-mode db"
    );

    for i in 0..3 {
        expenses::create(
            &pool,
            CreateExpenseInput {
                amount_cents: 500 * (i + 1),
                category_id: GROCERIES.into(),
                date: "2026-08-01".into(),
                note: None,
            },
        )
        .await
        .unwrap();
    }

    backup::checkpoint_wal(&pool).await.unwrap();

    // Copy only the main `.db` file, exactly like a real backup/safety copy
    // does — without the checkpoint above, the `-wal` sidecar could still
    // hold these commits and this copy would silently miss them.
    let dest_dir = TempDir::new().unwrap();
    let dest_path = dest_dir.path().join("copied.db");
    backup::copy_file(&live_path, &dest_path).unwrap();

    let copied_pool = open_pool_at(&dest_path).await;
    let copied_count = expenses::list(&copied_pool, &EntryFilter::default())
        .await
        .unwrap()
        .len();
    assert_eq!(
        copied_count, 3,
        "all committed rows must survive a raw copy once checkpointed"
    );
}
