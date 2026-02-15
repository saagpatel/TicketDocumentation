use crate::db::models::Activity;
use crate::error::AppError;
use crate::AppState;
use serde::Deserialize;
use tauri::State;

#[derive(Debug, Deserialize)]
pub struct GetActivitiesRequest {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub app_filter: Option<String>,
    pub category_filter: Option<String>,
}

#[tauri::command]
pub async fn get_activities(
    state: State<'_, AppState>,
    request: GetActivitiesRequest,
) -> Result<Vec<Activity>, AppError> {
    let limit = request.limit.unwrap_or(100);
    let offset = request.offset.unwrap_or(0);

    // Build query based on filters
    let mut query = String::from(
        "SELECT id, app_name, window_title, process_path, window_id, detected_category,
               started_at, ended_at, duration_seconds, created_at
        FROM activities WHERE 1=1",
    );

    let mut bindings: Vec<String> = Vec::new();

    if let Some(app_filter) = &request.app_filter {
        query.push_str(" AND app_name = ?");
        bindings.push(app_filter.clone());
    }

    if let Some(category_filter) = &request.category_filter {
        query.push_str(" AND detected_category = ?");
        bindings.push(category_filter.clone());
    }

    query.push_str(" ORDER BY started_at DESC LIMIT ? OFFSET ?");

    // Build query with all bindings
    let mut sqlx_query = sqlx::query_as::<_, Activity>(&query);
    for binding in bindings {
        sqlx_query = sqlx_query.bind(binding);
    }
    sqlx_query = sqlx_query.bind(limit).bind(offset);

    let activities = sqlx_query.fetch_all(&*state.db).await?;

    Ok(activities)
}
