use crate::error::AppError;
use crate::llm;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub is_running: bool,
    pub models: Vec<String>,
    pub active_model: Option<String>,
}

#[tauri::command]
pub async fn check_ollama_status(state: State<'_, AppState>) -> Result<OllamaStatus, AppError> {
    // Create Ollama client (default localhost:11434)
    let client = llm::create_client("http://localhost", 11434);

    // Try to get models list
    match llm::check_health(&client).await {
        Ok(models) => {
            // Get active model from settings
            let active_model = get_setting(&state.db, "ollama_model").await.ok();

            Ok(OllamaStatus {
                is_running: true,
                models,
                active_model,
            })
        }
        Err(_) => {
            // Ollama is not running
            Ok(OllamaStatus {
                is_running: false,
                models: vec![],
                active_model: None,
            })
        }
    }
}

/// Helper to get a setting value from DB
async fn get_setting(db: &sqlx::SqlitePool, key: &str) -> Result<String, AppError> {
    let row: (String,) = sqlx::query_as("SELECT value FROM settings WHERE key = ?")
        .bind(key)
        .fetch_one(db)
        .await?;
    Ok(row.0)
}
