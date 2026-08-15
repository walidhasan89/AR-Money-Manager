mod commands;
pub mod date_utils;
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
        .plugin(tauri_plugin_opener::init())
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
            commands::dashboard::get_dashboard_summary,
            commands::dashboard::get_savings_trend,
            commands::dashboard::get_calendar_summary,
            commands::goals::list_goals,
            commands::goals::list_goal_progress,
            commands::goals::create_goal,
            commands::goals::update_goal,
            commands::goals::set_goal_active,
            commands::savings::list_savings_entries,
            commands::savings::create_savings_entry,
            commands::savings::update_savings_entry,
            commands::savings::delete_savings_entry,
            commands::reports::get_report_summary,
            commands::csv_export::export_report_csv,
            commands::backup::get_backup_status,
            commands::backup::create_manual_backup,
            commands::backup::restore_backup,
            commands::backup::check_pre_migration_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
