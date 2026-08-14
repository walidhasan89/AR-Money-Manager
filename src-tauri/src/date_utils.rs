use chrono::{Datelike, Duration, NaiveDate};

use crate::error::{AppError, AppResult};

pub fn parse_month(month: &str) -> AppResult<NaiveDate> {
    NaiveDate::parse_from_str(&format!("{month}-01"), "%Y-%m-%d")
        .map_err(|_| AppError::Validation(format!("Invalid month: {month}")))
}

/// Shifts a `YYYY-MM` string by `delta` months (negative goes backward).
pub fn shift_month(month: &str, delta: i32) -> AppResult<String> {
    let date = parse_month(month)?;
    let total_months = date.year() * 12 + (date.month() as i32 - 1) + delta;
    let year = total_months.div_euclid(12);
    let month_index = total_months.rem_euclid(12); // 0-11
    NaiveDate::from_ymd_opt(year, (month_index + 1) as u32, 1)
        .map(|d| d.format("%Y-%m").to_string())
        .ok_or_else(|| AppError::Validation(format!("Invalid month: {month}")))
}

pub fn days_in_month(month: &str) -> AppResult<u32> {
    let next = shift_month(month, 1)?;
    let next_date = parse_month(&next)?;
    Ok((next_date - Duration::days(1)).day())
}
