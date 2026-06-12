use crate::db::models::Resolution;
use crate::error::AppError;
use crate::llm;
use crate::AppState;
use chrono::Utc;
use tauri::State;

#[derive(Debug, serde::Deserialize)]
pub struct GenerateResolutionRequest {
    pub activity_ids: Vec<i64>,
    pub template_id: String,
}

#[tauri::command]
pub async fn generate_resolution(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
    request: GenerateResolutionRequest,
) -> Result<i64, AppError> {
    // Get Ollama settings from DB
    let model_name = get_setting(&state.db, "ollama_model")
        .await
        .unwrap_or_else(|_| "llama3.2:latest".to_string());

    let ollama_url = get_setting(&state.db, "ollama_url")
        .await
        .unwrap_or_else(|_| "http://localhost".to_string());

    // Create Ollama client
    let client = llm::create_client(&ollama_url, 11434);

    // Generate resolution with streaming
    llm::generate::generate_resolution(
        &*state.db,
        &client,
        &app_handle,
        request.activity_ids,
        request.template_id,
        model_name,
    )
    .await
}

#[derive(Debug, serde::Deserialize)]
pub struct SaveResolutionRequest {
    pub id: i64,
    pub edited_text: String,
}

#[tauri::command]
pub async fn save_resolution(
    state: State<'_, AppState>,
    request: SaveResolutionRequest,
) -> Result<(), AppError> {
    let updated_at = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        UPDATE resolutions
        SET edited_text = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&request.edited_text)
    .bind(&updated_at)
    .bind(request.id)
    .execute(&*state.db)
    .await?;

    Ok(())
}

#[derive(Debug, serde::Deserialize)]
pub struct GetResolutionsRequest {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[tauri::command]
pub async fn get_resolutions(
    state: State<'_, AppState>,
    request: GetResolutionsRequest,
) -> Result<Vec<Resolution>, AppError> {
    let limit = request.limit.unwrap_or(50);
    let offset = request.offset.unwrap_or(0);

    let resolutions = sqlx::query_as::<_, Resolution>(
        r#"
        SELECT id, activity_ids, template_id, prompt_text, generated_text,
               edited_text, model_name, generation_duration_ms,
               created_at, updated_at
        FROM resolutions
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        "#,
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&*state.db)
    .await?;

    Ok(resolutions)
}

#[tauri::command]
pub async fn get_resolution_by_id(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Resolution, AppError> {
    let resolution = sqlx::query_as::<_, Resolution>(
        r#"
        SELECT id, activity_ids, template_id, prompt_text, generated_text,
               edited_text, model_name, generation_duration_ms,
               created_at, updated_at
        FROM resolutions
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_one(&*state.db)
    .await?;

    Ok(resolution)
}

/// Helper to get a setting value from DB
async fn get_setting(db: &sqlx::SqlitePool, key: &str) -> Result<String, AppError> {
    let row: (String,) = sqlx::query_as(
        r#"
        SELECT value FROM settings WHERE key = ?
        "#,
    )
    .bind(key)
    .fetch_one(db)
    .await?;

    Ok(row.0)
}
