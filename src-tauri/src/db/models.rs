use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Activity {
    pub id: i64,
    pub app_name: String,
    pub window_title: String,
    pub process_path: String,
    pub window_id: String,
    pub detected_category: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_seconds: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Resolution {
    pub id: i64,
    pub activity_ids: String, // JSON array string
    pub template_id: String,
    pub prompt_text: String,
    pub generated_text: String,
    pub edited_text: Option<String>,
    pub model_name: String,
    pub generation_duration_ms: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    pub prompt_template: String,
    pub is_builtin: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Exclusion {
    pub id: i64,
    pub app_name: String,
    pub reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}
