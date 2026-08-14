mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod queries;
mod validation;

use tauri_plugin_sql::{Migration, MigrationKind};

fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "init",
            sql: include_str!("../migrations/001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "category_archive",
            sql: include_str!("../migrations/002_category_archive.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "fixed_expense_skips",
            sql: include_str!("../migrations/003_fixed_expense_skips.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:pfm.db", migrations())
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::get_app_version,
            commands::categories::list_categories,
            commands::categories::create_category,
            commands::categories::update_category,
            commands::categories::set_category_archived,
            commands::expenses::list_expenses,
            commands::expenses::create_expense,
            commands::expenses::update_expense,
            commands::expenses::delete_expense,
            commands::income::list_income,
            commands::income::create_income,
            commands::income::update_income,
            commands::income::delete_income,
            commands::fixed_expenses::list_fixed_expenses,
            commands::fixed_expenses::create_fixed_expense,
            commands::fixed_expenses::update_fixed_expense,
            commands::fixed_expenses::delete_fixed_expense,
            commands::fixed_expenses::list_pending_fixed_expenses,
            commands::fixed_expenses::confirm_fixed_expense,
            commands::fixed_expenses::skip_fixed_expense,
            commands::csv_export::export_expenses_csv,
            commands::csv_export::export_income_csv,
            commands::budgets::get_budget_summary,
            commands::budgets::set_overall_budget,
            commands::budgets::set_category_budget,
            commands::budgets::copy_last_month_budget,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
