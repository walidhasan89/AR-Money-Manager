//! Integration tests per docs/testing/TESTING_STRATEGY.md: round-trip each
//! query module against a real (temp file) SQLite DB, migrated exactly like
//! the app migrates it.

use app_lib::error::AppError;
use app_lib::models::{
    ConfirmFixedExpenseInput, CreateCategoryInput, CreateExpenseInput, CreateFixedExpenseInput,
    CreateIncomeInput, EntryFilter, SkipFixedExpenseInput, UpdateCategoryInput, UpdateExpenseInput,
    UpdateFixedExpenseInput, UpdateIncomeInput,
};
use app_lib::queries::{categories, expenses, fixed_expenses, income};
use chrono::NaiveDate;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Pool, Sqlite};
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
