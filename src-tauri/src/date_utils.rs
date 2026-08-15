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

/// Whole months between two `YYYY-MM-DD` dates, rounded up when `end` falls
/// past `start`'s day-of-month anniversary (a partial month still counts as
/// one more installment period). Returns 0 if `end` is on or before `start`.
pub fn months_between(start: &str, end: &str) -> AppResult<i64> {
    let start_date = NaiveDate::parse_from_str(start, "%Y-%m-%d")
        .map_err(|_| AppError::Validation(format!("Invalid date: {start}")))?;
    let end_date = NaiveDate::parse_from_str(end, "%Y-%m-%d")
        .map_err(|_| AppError::Validation(format!("Invalid date: {end}")))?;

    let whole_months = (end_date.year() - start_date.year()) as i64 * 12
        + (end_date.month() as i64 - start_date.month() as i64);
    let rounded = if end_date.day() > start_date.day() {
        whole_months + 1
    } else {
        whole_months
    };
    Ok(rounded.max(0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn months_between_rounds_up_partial_months() {
        assert_eq!(months_between("2026-01-15", "2026-01-15").unwrap(), 0);
        assert_eq!(months_between("2026-01-15", "2026-02-15").unwrap(), 1);
        assert_eq!(months_between("2026-01-15", "2026-02-20").unwrap(), 2);
        assert_eq!(months_between("2026-01-15", "2026-02-10").unwrap(), 1);
        assert_eq!(months_between("2026-01-15", "2031-01-15").unwrap(), 60);
    }

    #[test]
    fn months_between_clamps_non_positive_ranges_to_zero() {
        assert_eq!(months_between("2026-06-01", "2026-01-01").unwrap(), 0);
    }
}
