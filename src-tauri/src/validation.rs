use crate::error::{AppError, AppResult};

pub fn amount_cents(value: i64) -> AppResult<()> {
    if value < 0 {
        return Err(AppError::Validation(
            "Amount must be zero or greater".into(),
        ));
    }
    Ok(())
}

pub fn iso_date(value: &str) -> AppResult<()> {
    chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d")
        .map(|_| ())
        .map_err(|_| AppError::Validation(format!("Invalid date: {value}")))
}

pub fn non_empty(value: &str, field: &str) -> AppResult<()> {
    if value.trim().is_empty() {
        return Err(AppError::Validation(format!("{field} is required")));
    }
    Ok(())
}

pub fn day_of_month(value: i64) -> AppResult<()> {
    if !(1..=28).contains(&value) {
        return Err(AppError::Validation(
            "Day of month must be between 1 and 28".into(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn amount_cents_rejects_negative() {
        assert!(amount_cents(-1).is_err());
        assert!(amount_cents(0).is_ok());
        assert!(amount_cents(500).is_ok());
    }

    #[test]
    fn iso_date_accepts_only_valid_dates() {
        assert!(iso_date("2026-08-14").is_ok());
        assert!(iso_date("2026-02-30").is_err());
        assert!(iso_date("not-a-date").is_err());
        assert!(iso_date("2026/08/14").is_err());
    }

    #[test]
    fn day_of_month_rejects_out_of_range() {
        assert!(day_of_month(0).is_err());
        assert!(day_of_month(1).is_ok());
        assert!(day_of_month(28).is_ok());
        assert!(day_of_month(29).is_err());
    }

    #[test]
    fn non_empty_rejects_blank_strings() {
        assert!(non_empty("", "Name").is_err());
        assert!(non_empty("   ", "Name").is_err());
        assert!(non_empty("Groceries", "Name").is_ok());
    }
}
