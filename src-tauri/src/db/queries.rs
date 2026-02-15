use sqlx::SqlitePool;
use crate::db::models::*;
use crate::error::AppError;

// Placeholder query functions - will be implemented as needed
pub async fn get_activities(
    pool: &SqlitePool,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Activity>, AppError> {
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    let activities = sqlx::query_as::<_, Activity>(
        "SELECT * FROM activities ORDER BY started_at DESC LIMIT ? OFFSET ?"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok(activities)
}

pub async fn get_exclusions(pool: &SqlitePool) -> Result<Vec<Exclusion>, AppError> {
    let exclusions = sqlx::query_as::<_, Exclusion>(
        "SELECT * FROM exclusions ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(exclusions)
}

pub async fn get_settings(pool: &SqlitePool) -> Result<Vec<Setting>, AppError> {
    let settings = sqlx::query_as::<_, Setting>(
        "SELECT * FROM settings"
    )
    .fetch_all(pool)
    .await?;

    Ok(settings)
}
