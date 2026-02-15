use crate::db::models::Exclusion;
use crate::error::AppError;
use crate::AppState;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub async fn get_exclusions(state: State<'_, AppState>) -> Result<Vec<Exclusion>, AppError> {
    crate::db::queries::get_exclusions(&state.db).await
}

#[tauri::command]
pub async fn add_exclusion(
    state: State<'_, AppState>,
    app_name: String,
    reason: Option<String>,
) -> Result<Exclusion, AppError> {
    let result = sqlx::query(
        "INSERT INTO exclusions (app_name, reason) VALUES (?, ?)"
    )
    .bind(&app_name)
    .bind(&reason)
    .execute(&*state.db)
    .await?;

    let id = result.last_insert_rowid();

    // Fetch the created exclusion
    let exclusion = sqlx::query_as::<_, Exclusion>(
        "SELECT * FROM exclusions WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&*state.db)
    .await?;

    Ok(exclusion)
}

#[tauri::command]
pub async fn remove_exclusion(
    state: State<'_, AppState>,
    id: i64,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM exclusions WHERE id = ?")
        .bind(id)
        .execute(&*state.db)
        .await?;

    Ok(())
}

// General settings

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub ollama_url: String,
    pub ollama_model: String,
    pub auto_delete_days: i64,
    pub pii_scrubbing_enabled: bool,
    pub poll_interval_seconds: i64,
    pub start_on_launch: bool,
    pub app_context: String,
}

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, AppError> {
    let settings = AppSettings {
        ollama_url: get_setting(&state.db, "ollama_url")
            .await
            .unwrap_or_else(|_| "http://localhost:11434".to_string()),
        ollama_model: get_setting(&state.db, "ollama_model")
            .await
            .unwrap_or_else(|_| "llama3.2:latest".to_string()),
        auto_delete_days: get_setting(&state.db, "auto_delete_days")
            .await
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(7),
        pii_scrubbing_enabled: get_setting(&state.db, "pii_scrubbing_enabled")
            .await
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(true),
        poll_interval_seconds: get_setting(&state.db, "poll_interval_seconds")
            .await
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(5),
        start_on_launch: get_setting(&state.db, "start_on_launch")
            .await
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(true),
        app_context: get_setting(&state.db, "app_context")
            .await
            .unwrap_or_else(|_| "ServiceNow".to_string()),
    };

    Ok(settings)
}

#[tauri::command]
pub async fn update_settings(
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<(), AppError> {
    set_setting(&state.db, "ollama_url", &settings.ollama_url).await?;
    set_setting(&state.db, "ollama_model", &settings.ollama_model).await?;
    set_setting(&state.db, "auto_delete_days", &settings.auto_delete_days.to_string()).await?;
    set_setting(
        &state.db,
        "pii_scrubbing_enabled",
        &settings.pii_scrubbing_enabled.to_string(),
    )
    .await?;
    set_setting(
        &state.db,
        "poll_interval_seconds",
        &settings.poll_interval_seconds.to_string(),
    )
    .await?;
    set_setting(
        &state.db,
        "start_on_launch",
        &settings.start_on_launch.to_string(),
    )
    .await?;
    set_setting(&state.db, "app_context", &settings.app_context).await?;

    Ok(())
}

// Helper functions

async fn get_setting(db: &sqlx::SqlitePool, key: &str) -> Result<String, AppError> {
    let row: (String,) = sqlx::query_as("SELECT value FROM settings WHERE key = ?")
        .bind(key)
        .fetch_one(db)
        .await?;

    Ok(row.0)
}

async fn set_setting(db: &sqlx::SqlitePool, key: &str, value: &str) -> Result<(), AppError> {
    let updated_at = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?",
    )
    .bind(key)
    .bind(value)
    .bind(&updated_at)
    .bind(value)
    .bind(&updated_at)
    .execute(db)
    .await?;

    Ok(())
}
