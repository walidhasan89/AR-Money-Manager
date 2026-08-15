use std::collections::HashMap;
use std::io::Write;

use sqlx::{Pool, Sqlite};

use crate::commands::csv_export::cents_to_decimal_string;
use crate::error::AppResult;
use crate::models::{ReportCategoryBreakdown, ReportSummary};
use crate::queries::{budgets, dashboard};

/// Combines the Dashboard's month summary with the Budgets month summary —
/// never re-derives income/expenses/savings/budget totals independently, so
/// the report can't drift from what the Dashboard already shows for the
/// same month (docs/phases/PHASE_6.md testing requirement).
pub async fn get_report(pool: &Pool<Sqlite>, month: &str) -> AppResult<ReportSummary> {
    let dashboard_summary = dashboard::get_summary(pool, month).await?;
    let budget_summary = budgets::get_summary(pool, month).await?;

    let budget_by_category: HashMap<&str, i64> = budget_summary
        .categories
        .iter()
        .map(|c| (c.category_id.as_str(), c.budget_cents))
        .collect();

    let categories = dashboard_summary
        .spending_by_category
        .into_iter()
        .map(|c| ReportCategoryBreakdown {
            budget_cents: budget_by_category
                .get(c.category_id.as_str())
                .copied()
                .unwrap_or(0),
            category_id: c.category_id,
            category_name: c.category_name,
            category_color: c.category_color,
            spent_cents: c.amount_cents,
        })
        .collect();

    Ok(ReportSummary {
        month: month.to_string(),
        income_cents: dashboard_summary.income_cents,
        expenses_cents: dashboard_summary.expenses_cents,
        savings_cents: dashboard_summary.savings_cents,
        remaining_cents: dashboard_summary.remaining_cents,
        overall_budget_cents: budget_summary.overall_budget_cents,
        overall_spent_cents: budget_summary.overall_spent_cents,
        categories,
    })
}

/// A structured summary export, not a raw row dump (docs/phases/PHASE_6.md):
/// a metric/value block for the month's totals, a blank-line separator,
/// then the category breakdown table. The two blocks have different column
/// counts, so the writer must be built with `flexible(true)` — csv::Writer
/// rejects inconsistent record lengths by default, the same as Reader.
pub fn write_report_csv<W: Write>(writer: W, report: &ReportSummary) -> csv::Result<()> {
    let mut writer = csv::WriterBuilder::new().flexible(true).from_writer(writer);

    writer.write_record(["Metric", "Value"])?;
    writer.write_record(["Month", &report.month])?;
    writer.write_record(["Income", &cents_to_decimal_string(report.income_cents)])?;
    writer.write_record(["Expenses", &cents_to_decimal_string(report.expenses_cents)])?;
    writer.write_record(["Savings", &cents_to_decimal_string(report.savings_cents)])?;
    writer.write_record([
        "Remaining",
        &cents_to_decimal_string(report.remaining_cents),
    ])?;
    writer.write_record([
        "Overall Budget",
        &cents_to_decimal_string(report.overall_budget_cents),
    ])?;
    writer.write_record([
        "Overall Spent",
        &cents_to_decimal_string(report.overall_spent_cents),
    ])?;
    writer.write_record(Vec::<&str>::new())?;

    writer.write_record(["Category", "Spent", "Budget"])?;
    for category in &report.categories {
        writer.write_record([
            category.category_name.as_str(),
            &cents_to_decimal_string(category.spent_cents),
            &cents_to_decimal_string(category.budget_cents),
        ])?;
    }
    writer.flush()?;
    Ok(())
}
