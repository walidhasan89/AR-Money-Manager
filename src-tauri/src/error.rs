#[derive(Debug, thiserror::Error, serde::Serialize)]
#[serde(tag = "kind", content = "message", rename_all = "camelCase")]
pub enum AppError {
    #[error("{0}")]
    Validation(String),
    #[error("not found")]
    NotFound,
    #[error("database error: {0}")]
    Database(String),
    #[error("io error: {0}")]
    Io(String),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound,
            other => AppError::Database(other.to_string()),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

impl From<csv::Error> for AppError {
    fn from(err: csv::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
