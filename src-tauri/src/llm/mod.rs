pub mod generate;
pub mod templates;

use crate::error::AppError;
use ollama_rs::Ollama;

/// Create a new Ollama client with the given base URL
pub fn create_client(base_url: &str, port: u16) -> Ollama {
    Ollama::new(base_url.to_string(), port)
}

/// Check if Ollama is running and list available models
pub async fn check_health(client: &Ollama) -> Result<Vec<String>, AppError> {
    match client.list_local_models().await {
        Ok(models) => {
            let model_names: Vec<String> = models.iter().map(|m| m.name.clone()).collect();
            Ok(model_names)
        }
        Err(e) => Err(AppError::OllamaOffline {
            url: "http://localhost:11434".to_string(),
            reason: e.to_string(),
        }),
    }
}

/// Check if a specific model is currently loaded in memory
pub async fn is_model_loaded(client: &Ollama, model_name: &str) -> Result<bool, AppError> {
    match client.show_model_info(model_name.to_string()).await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
