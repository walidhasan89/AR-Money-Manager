use sqlx::{Pool, Sqlite};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::{Category, CreateCategoryInput, UpdateCategoryInput};

const SELECT: &str =
    "SELECT id, name, type, icon, color, is_system, is_archived, created_at FROM categories";

pub async fn list(
    pool: &Pool<Sqlite>,
    category_type: Option<&str>,
    include_archived: bool,
) -> AppResult<Vec<Category>> {
    let mut sql = String::from(SELECT);
    let mut clauses: Vec<&str> = Vec::new();
    if category_type.is_some() {
        clauses.push("type = ?1");
    }
    if !include_archived {
        clauses.push("is_archived = 0");
    }
    if !clauses.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&clauses.join(" AND "));
    }
    sql.push_str(" ORDER BY type, name");

    let mut query = sqlx::query_as::<_, Category>(&sql);
    if let Some(t) = category_type {
        query = query.bind(t);
    }
    query.fetch_all(pool).await.map_err(Into::into)
}

pub async fn get(pool: &Pool<Sqlite>, id: &str) -> AppResult<Category> {
    sqlx::query_as::<_, Category>(&format!("{SELECT} WHERE id = ?1"))
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(Into::into)
}

pub async fn create(pool: &Pool<Sqlite>, input: CreateCategoryInput) -> AppResult<Category> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO categories (id, name, type, icon, color, is_system) VALUES (?1, ?2, ?3, ?4, ?5, 0)",
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.category_type)
    .bind(&input.icon)
    .bind(&input.color)
    .execute(pool)
    .await?;
    get(pool, &id).await
}

pub async fn update(
    pool: &Pool<Sqlite>,
    id: &str,
    input: UpdateCategoryInput,
) -> AppResult<Category> {
    let result = sqlx::query(
        "UPDATE categories SET name = ?1, icon = ?2, color = ?3 WHERE id = ?4 AND is_system = 0",
    )
    .bind(&input.name)
    .bind(&input.icon)
    .bind(&input.color)
    .bind(id)
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::Validation(
            "Only custom categories can be edited".into(),
        ));
    }
    get(pool, id).await
}

pub async fn set_archived(pool: &Pool<Sqlite>, id: &str, archived: bool) -> AppResult<Category> {
    let result = sqlx::query("UPDATE categories SET is_archived = ?1 WHERE id = ?2")
        .bind(archived)
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    get(pool, id).await
}
