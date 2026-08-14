//! Migration/schema tests per docs/testing/TESTING_STRATEGY.md ("Database testing").
//! Applies the real 001_init.sql (the same file the app runs) against a fresh
//! in-memory SQLite DB, so any syntax error or schema drift fails here first.

use rusqlite::Connection;

const INIT_SQL: &str = include_str!("../migrations/001_init.sql");

fn fresh_db() -> Connection {
    let conn = Connection::open_in_memory().expect("open in-memory db");
    conn.execute_batch(INIT_SQL).expect("apply 001_init.sql");
    conn
}

#[test]
fn creates_all_expected_tables() {
    let conn = fresh_db();
    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .unwrap();
    let tables: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .unwrap()
        .map(|r| r.unwrap())
        .collect();

    for expected in [
        "categories",
        "income_entries",
        "expenses",
        "fixed_expenses",
        "savings_entries",
        "goals",
        "budgets",
        "settings",
        "backups_log",
    ] {
        assert!(
            tables.iter().any(|t| t == expected),
            "expected table `{expected}` to exist, found: {tables:?}"
        );
    }
}

#[test]
fn seeds_expected_categories() {
    let conn = fresh_db();

    let total: i64 = conn
        .query_row("SELECT COUNT(*) FROM categories", [], |r| r.get(0))
        .unwrap();
    assert_eq!(total, 18, "14 expense + 4 income seeded categories");

    let expense: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM categories WHERE type = 'expense'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(expense, 14);

    let income: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM categories WHERE type = 'income'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(income, 4);

    let all_system: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM categories WHERE is_system = 0",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(
        all_system, 0,
        "all seeded categories should be marked is_system = 1"
    );
}

#[test]
fn seeds_default_settings() {
    let conn = fresh_db();
    let currency: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'currency'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(currency, "BDT");

    let theme: String = conn
        .query_row("SELECT value FROM settings WHERE key = 'theme'", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(theme, "dark");
}

#[test]
fn amount_columns_are_integer_not_real() {
    let conn = fresh_db();
    for (table, column) in [
        ("income_entries", "amount_cents"),
        ("expenses", "amount_cents"),
        ("fixed_expenses", "amount_cents"),
        ("savings_entries", "amount_cents"),
        ("budgets", "amount_cents"),
    ] {
        let mut stmt = conn
            .prepare(&format!("PRAGMA table_info({table})"))
            .unwrap();
        let col_type: String = stmt
            .query_map([], |row| {
                let name: String = row.get(1)?;
                let ty: String = row.get(2)?;
                Ok((name, ty))
            })
            .unwrap()
            .map(|r| r.unwrap())
            .find(|(name, _)| name == column)
            .map(|(_, ty)| ty)
            .unwrap_or_else(|| panic!("{table}.{column} not found"));
        assert_eq!(
            col_type, "INTEGER",
            "{table}.{column} must be INTEGER cents, never REAL"
        );
    }
}

#[test]
fn foreign_key_violation_is_rejected() {
    let conn = fresh_db();
    conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
    let result = conn.execute(
        "INSERT INTO expenses (id, amount_cents, category_id, date) VALUES (?1, 500, 'does-not-exist', '2026-08-14')",
        rusqlite::params!["expense-1"],
    );
    assert!(
        result.is_err(),
        "expense with a non-existent category_id should be rejected"
    );
}

#[test]
fn one_budget_per_category_per_month_is_enforced() {
    let conn = fresh_db();
    let category_id = "18d83cb2-4ad3-4825-a507-d8633e05512d"; // Groceries
    conn.execute(
        "INSERT INTO budgets (id, month, category_id, amount_cents) VALUES (?1, '2026-08', ?2, 500000)",
        rusqlite::params!["budget-1", category_id],
    )
    .unwrap();

    let result = conn.execute(
        "INSERT INTO budgets (id, month, category_id, amount_cents) VALUES (?1, '2026-08', ?2, 999999)",
        rusqlite::params!["budget-2", category_id],
    );
    assert!(
        result.is_err(),
        "duplicate (month, category_id) budget should violate UNIQUE constraint"
    );
}

#[test]
fn negative_amounts_are_rejected() {
    let conn = fresh_db();
    let category_id = "18d83cb2-4ad3-4825-a507-d8633e05512d"; // Groceries
    let result = conn.execute(
        "INSERT INTO expenses (id, amount_cents, category_id, date) VALUES (?1, -100, ?2, '2026-08-14')",
        rusqlite::params!["expense-negative", category_id],
    );
    assert!(result.is_err(), "amount_cents must be >= 0");
}
