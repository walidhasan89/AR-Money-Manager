use std::fs::File;

use tauri::AppHandle;

use crate::db;
use crate::error::AppResult;
use crate::models::EntryFilter;
use crate::queries;

pub(crate) fn cents_to_decimal_string(cents: i64) -> String {
    let sign = if cents < 0 { "-" } else { "" };
    let abs = cents.unsigned_abs();
    format!("{sign}{}.{:02}", abs / 100, abs % 100)
}

/// Writes only to `path`, which the frontend must obtain from a native save
/// dialog (tauri-plugin-dialog) — never a path it constructs itself, per the
/// "exports only touch user-picked paths" security rule.
#[tauri::command]
pub async fn export_expenses_csv(
    app: AppHandle,
    path: String,
    filter: EntryFilter,
) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    let rows = queries::expenses::list(&pool, &filter).await?;

    let file = File::create(&path)?;
    let mut writer = csv::Writer::from_writer(file);
    writer.write_record(["Date", "Category", "Amount", "Note"])?;
    for row in &rows {
        writer.write_record([
            row.date.as_str(),
            row.category_name.as_str(),
            &cents_to_decimal_string(row.amount_cents),
            row.note.as_deref().unwrap_or(""),
        ])?;
    }
    writer.flush()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_cents_as_decimal() {
        assert_eq!(cents_to_decimal_string(125_050), "1250.50");
        assert_eq!(cents_to_decimal_string(5), "0.05");
        assert_eq!(cents_to_decimal_string(0), "0.00");
        assert_eq!(cents_to_decimal_string(100), "1.00");
    }
}

#[tauri::command]
pub async fn export_income_csv(app: AppHandle, path: String, filter: EntryFilter) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    let rows = queries::income::list(&pool, &filter).await?;

    let file = File::create(&path)?;
    let mut writer = csv::Writer::from_writer(file);
    writer.write_record(["Date", "Category", "Source", "Amount", "Note"])?;
    for row in &rows {
        writer.write_record([
            row.date.as_str(),
            row.category_name.as_str(),
            row.source.as_deref().unwrap_or(""),
            &cents_to_decimal_string(row.amount_cents),
            row.note.as_deref().unwrap_or(""),
        ])?;
    }
    writer.flush()?;
    Ok(())
}

#[tauri::command]
pub async fn export_report_csv(app: AppHandle, path: String, month: String) -> AppResult<()> {
    let pool = db::pool(&app).await?;
    let report = queries::reports::get_report(&pool, &month).await?;

    let file = File::create(&path)?;
    queries::reports::write_report_csv(file, &report)?;
    Ok(())
}
