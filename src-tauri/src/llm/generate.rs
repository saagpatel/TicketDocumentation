use crate::db::models::Activity;
use crate::error::AppError;
use crate::llm::templates;
use chrono::Utc;
use futures::StreamExt;
use ollama_rs::generation::completion::request::GenerationRequest;
use ollama_rs::Ollama;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::time::Instant;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmTokenEvent {
    pub resolution_id: i64,
    pub token: String,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmDoneEvent {
    pub resolution_id: i64,
    pub success: bool,
    pub error: Option<String>,
    pub duration_ms: i64,
}

/// Generate a resolution using streaming LLM
pub async fn generate_resolution(
    db: &SqlitePool,
    client: &Ollama,
    app_handle: &AppHandle,
    activity_ids: Vec<i64>,
    template_id: String,
    model_name: String,
) -> Result<i64, AppError> {
    let start_time = Instant::now();

    // 1. Load activities from DB
    let activities = load_activities_by_ids(db, &activity_ids).await?;
    if activities.is_empty() {
        return Err(AppError::Config("No activities found".to_string()));
    }

    // 2. Get template
    let template = templates::get_template(&template_id)
        .ok_or_else(|| AppError::Config(format!("Template '{}' not found", template_id)))?;

    // 3. Build activity summary
    let activity_summary = build_activity_summary(&activities);
    let category = detect_primary_category(&activities);

    // 4. Get app_context from settings
    let app_context = get_setting_value(db, "app_context")
        .await
        .unwrap_or_else(|_| "ServiceNow".to_string());

    // 5. Render template
    let mut placeholders = HashMap::new();
    placeholders.insert("activity_summary".to_string(), activity_summary);
    placeholders.insert("category".to_string(), category.clone());
    placeholders.insert("app_context".to_string(), app_context);

    let prompt = templates::render_template(template, &placeholders);

    // 6. Create resolution record in DB
    let activity_ids_json = serde_json::to_string(&activity_ids)?;
    let generation_duration_ms: Option<i64> = None;
    let empty_text = String::new();
    let result = sqlx::query(
        r#"
        INSERT INTO resolutions (activity_ids, template_id, prompt_text, generated_text, model_name, generation_duration_ms)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&activity_ids_json)
    .bind(&template_id)
    .bind(&prompt)
    .bind(&empty_text)
    .bind(&model_name)
    .bind(generation_duration_ms)
    .execute(db)
    .await?;

    let resolution_id = result.last_insert_rowid();

    // 7. Stream generation
    let mut generated_text = String::new();
    let stream_result = stream_ollama_generation(
        client,
        &model_name,
        &prompt,
        resolution_id,
        app_handle,
        &mut generated_text,
    )
    .await;

    let duration_ms = start_time.elapsed().as_millis() as i64;

    // 8. Update resolution in DB
    match stream_result {
        Ok(_) => {
            let duration_ms_opt = Some(duration_ms);
            let updated_at = Utc::now().to_rfc3339();
            sqlx::query(
                r#"
                UPDATE resolutions
                SET generated_text = ?, generation_duration_ms = ?, updated_at = ?
                WHERE id = ?
                "#,
            )
            .bind(&generated_text)
            .bind(duration_ms_opt)
            .bind(&updated_at)
            .bind(resolution_id)
            .execute(db)
            .await?;

            // Emit success event
            let _ = app_handle.emit(
                "llm-done",
                LlmDoneEvent {
                    resolution_id,
                    success: true,
                    error: None,
                    duration_ms,
                },
            );

            Ok(resolution_id)
        }
        Err(e) => {
            // Save partial output
            let duration_ms_opt = Some(duration_ms);
            let updated_at = Utc::now().to_rfc3339();
            sqlx::query(
                r#"
                UPDATE resolutions
                SET generated_text = ?, generation_duration_ms = ?, updated_at = ?
                WHERE id = ?
                "#,
            )
            .bind(&generated_text)
            .bind(duration_ms_opt)
            .bind(&updated_at)
            .bind(resolution_id)
            .execute(db)
            .await?;

            // Emit error event
            let error_msg = e.to_string();
            let _ = app_handle.emit(
                "llm-done",
                LlmDoneEvent {
                    resolution_id,
                    success: false,
                    error: Some(error_msg.clone()),
                    duration_ms,
                },
            );

            Err(e)
        }
    }
}

/// Stream generation from Ollama and emit token events
async fn stream_ollama_generation(
    client: &Ollama,
    model: &str,
    prompt: &str,
    resolution_id: i64,
    app_handle: &AppHandle,
    buffer: &mut String,
) -> Result<(), AppError> {
    let request = GenerationRequest::new(model.to_string(), prompt.to_string());

    let mut stream = client
        .generate_stream(request)
        .await
        .map_err(|e| AppError::Ollama(e.to_string()))?;

    // Stream tokens
    while let Some(responses) = stream.next().await {
        let responses = responses.map_err(|e| AppError::Ollama(e.to_string()))?;

        for response in responses {
            buffer.push_str(&response.response);

            // Emit token event
            let _ = app_handle.emit(
                "llm-token",
                LlmTokenEvent {
                    resolution_id,
                    token: response.response.clone(),
                    done: response.done,
                },
            );

            if response.done {
                return Ok(());
            }
        }
    }

    Ok(())
}

/// Load activities by IDs from database
async fn load_activities_by_ids(
    db: &SqlitePool,
    activity_ids: &[i64],
) -> Result<Vec<Activity>, AppError> {
    if activity_ids.is_empty() {
        return Ok(vec![]);
    }

    // Build placeholders for SQL IN clause - safe because we control the count
    let placeholders = (0..activity_ids.len())
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(",");

    // Build query string with placeholders (not user data)
    let query_str = format!(
        r#"
        SELECT id, app_name, window_title, process_path, window_id, detected_category,
               started_at, ended_at, duration_seconds, created_at
        FROM activities
        WHERE id IN ({})
        ORDER BY started_at ASC
        "#,
        placeholders
    );

    // Bind all IDs as parameters to prevent SQL injection
    let mut query = sqlx::query_as::<_, Activity>(&query_str);
    for id in activity_ids {
        query = query.bind(id);
    }

    let activities = query.fetch_all(db).await?;
    Ok(activities)
}

/// Build a human-readable summary of activities
fn build_activity_summary(activities: &[Activity]) -> String {
    let mut summary = String::new();

    for (i, activity) in activities.iter().enumerate() {
        let duration_text = if let Some(duration) = activity.duration_seconds {
            format!("{}s", duration)
        } else {
            "ongoing".to_string()
        };

        let title_text = if activity.window_title.is_empty() {
            String::new()
        } else {
            format!(" - {}", activity.window_title)
        };

        summary.push_str(&format!(
            "{}. {}{} ({})\n",
            i + 1,
            activity.app_name,
            title_text,
            duration_text
        ));
    }

    summary
}

/// Detect the primary category from activities
fn detect_primary_category(activities: &[Activity]) -> String {
    // Count category occurrences
    let mut category_counts: HashMap<String, usize> = HashMap::new();

    for activity in activities {
        if let Some(ref category) = activity.detected_category {
            *category_counts.entry(category.clone()).or_insert(0) += 1;
        }
    }

    // Return most common category, or "general" if none
    category_counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(category, _)| category)
        .unwrap_or_else(|| "general".to_string())
}

/// Helper to get a setting value from DB
async fn get_setting_value(db: &SqlitePool, key: &str) -> Result<String, AppError> {
    let row: (String,) = sqlx::query_as("SELECT value FROM settings WHERE key = ?")
        .bind(key)
        .fetch_one(db)
        .await?;
    Ok(row.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_activity_summary() {
        let activities = vec![
            Activity {
                id: 1,
                app_name: "Chrome".to_string(),
                window_title: "Jira - INC-1234".to_string(),
                process_path: "/Applications/Chrome.app".to_string(),
                window_id: "1".to_string(),
                detected_category: Some("incident".to_string()),
                started_at: "2024-01-01T10:00:00Z".to_string(),
                ended_at: Some("2024-01-01T10:05:00Z".to_string()),
                duration_seconds: Some(300),
                created_at: "2024-01-01T10:00:00Z".to_string(),
            },
            Activity {
                id: 2,
                app_name: "Terminal".to_string(),
                window_title: "".to_string(),
                process_path: "/usr/bin/terminal".to_string(),
                window_id: "2".to_string(),
                detected_category: Some("incident".to_string()),
                started_at: "2024-01-01T10:05:00Z".to_string(),
                ended_at: Some("2024-01-01T10:10:00Z".to_string()),
                duration_seconds: Some(300),
                created_at: "2024-01-01T10:05:00Z".to_string(),
            },
        ];

        let summary = build_activity_summary(&activities);
        assert!(summary.contains("1. Chrome - Jira - INC-1234 (300s)"));
        assert!(summary.contains("2. Terminal (300s)"));
    }

    #[test]
    fn test_detect_primary_category() {
        let activities = vec![
            Activity {
                id: 1,
                app_name: "Chrome".to_string(),
                window_title: "".to_string(),
                process_path: "".to_string(),
                window_id: "".to_string(),
                detected_category: Some("incident".to_string()),
                started_at: "".to_string(),
                ended_at: None,
                duration_seconds: None,
                created_at: "".to_string(),
            },
            Activity {
                id: 2,
                app_name: "Terminal".to_string(),
                window_title: "".to_string(),
                process_path: "".to_string(),
                window_id: "".to_string(),
                detected_category: Some("incident".to_string()),
                started_at: "".to_string(),
                ended_at: None,
                duration_seconds: None,
                created_at: "".to_string(),
            },
            Activity {
                id: 3,
                app_name: "Slack".to_string(),
                window_title: "".to_string(),
                process_path: "".to_string(),
                window_id: "".to_string(),
                detected_category: Some("service_request".to_string()),
                started_at: "".to_string(),
                ended_at: None,
                duration_seconds: None,
                created_at: "".to_string(),
            },
        ];

        let category = detect_primary_category(&activities);
        assert_eq!(category, "incident");
    }

    #[test]
    fn test_detect_primary_category_none() {
        let activities = vec![Activity {
            id: 1,
            app_name: "Chrome".to_string(),
            window_title: "".to_string(),
            process_path: "".to_string(),
            window_id: "".to_string(),
            detected_category: None,
            started_at: "".to_string(),
            ended_at: None,
            duration_seconds: None,
            created_at: "".to_string(),
        }];

        let category = detect_primary_category(&activities);
        assert_eq!(category, "general");
    }
}
