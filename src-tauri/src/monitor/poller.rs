use active_win_pos_rs::get_active_window;
use chrono::Utc;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::watch;
use tokio::time::{interval, Duration};
use super::sanitizer;
use crate::pattern;

#[derive(Debug, Clone)]
struct LastActivity {
    app_name: String,
    window_title: String,
    started_at: String,
}

pub async fn start_polling(
    db: Arc<SqlitePool>,
    mut stop_rx: watch::Receiver<bool>,
) {
    let mut interval = interval(Duration::from_secs(5));
    let mut last_activity: Option<LastActivity> = None;

    // Load exclusions cache
    let mut exclusions = load_exclusions(&db).await;
    let mut tick_count = 0u32;

    loop {
        tokio::select! {
            _ = interval.tick() => {
                tick_count += 1;

                // Check if we should stop
                if *stop_rx.borrow() {
                    break;
                }

                // Get current active window
                match get_active_window() {
                    Ok(window_info) => {
                        let current_app = window_info.app_name.clone();

                        // Check if app is excluded
                        if exclusions.contains(&current_app) {
                            continue;
                        }

                        // Sanitize window title before storing
                        let current_title = sanitizer::sanitize_title(&window_info.title);

                        // Check if activity changed
                        let is_new_activity = match &last_activity {
                            None => true,
                            Some(last) => {
                                last.app_name != current_app || last.window_title != current_title
                            }
                        };

                        // Periodically refresh exclusions (every 60 seconds = 12 ticks)
                        if tick_count % 12 == 0 {
                            exclusions = load_exclusions(&db).await;
                        }

                        if is_new_activity {
                            let now = Utc::now().to_rfc3339();

                            // Close previous activity if exists
                            if let Some(ref last) = last_activity {
                                if let Err(e) = close_activity(&db, &last.started_at, &now).await {
                                    eprintln!("Failed to close activity: {}", e);
                                }
                            }

                            // Detect category
                            let category = pattern::detect_category(&current_app, &current_title);

                            // Insert new activity
                            if let Err(e) = insert_activity(
                                &db,
                                &current_app,
                                &current_title,
                                &window_info.process_path.to_string_lossy(),
                                &format!("{}", window_info.window_id),
                                category.as_deref(),
                                &now,
                            ).await {
                                eprintln!("Failed to insert activity: {}", e);
                            }

                            // Update last activity
                            last_activity = Some(LastActivity {
                                app_name: current_app,
                                window_title: current_title,
                                started_at: now,
                            });
                        }
                    }
                    Err(_) => {
                        // Log permission or window access errors
                        // Note: active-win-pos-rs returns () as error type, so we can't display details
                        eprintln!("Failed to get active window (possible permission issue or no active window)");
                    }
                }
            }
            _ = stop_rx.changed() => {
                if *stop_rx.borrow() {
                    break;
                }
            }
        }
    }

    // Close final activity when stopping
    if let Some(last) = last_activity {
        let now = Utc::now().to_rfc3339();
        if let Err(e) = close_activity(&db, &last.started_at, &now).await {
            eprintln!("Failed to close final activity: {}", e);
        }
    }
}

async fn insert_activity(
    pool: &SqlitePool,
    app_name: &str,
    window_title: &str,
    process_path: &str,
    window_id: &str,
    detected_category: Option<&str>,
    started_at: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO activities (app_name, window_title, process_path, window_id, detected_category, started_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(app_name)
    .bind(window_title)
    .bind(process_path)
    .bind(window_id)
    .bind(detected_category)
    .bind(started_at)
    .execute(pool)
    .await?;

    Ok(())
}

async fn close_activity(
    pool: &SqlitePool,
    started_at: &str,
    ended_at: &str,
) -> Result<(), sqlx::Error> {
    // Calculate duration in seconds
    let started = chrono::DateTime::parse_from_rfc3339(started_at).ok();
    let ended = chrono::DateTime::parse_from_rfc3339(ended_at).ok();

    let duration_seconds = if let (Some(start), Some(end)) = (started, ended) {
        (end.timestamp() - start.timestamp()).max(0)
    } else {
        0
    };

    sqlx::query(
        r#"
        UPDATE activities
        SET ended_at = ?, duration_seconds = ?
        WHERE started_at = ? AND ended_at IS NULL
        "#,
    )
    .bind(ended_at)
    .bind(duration_seconds)
    .bind(started_at)
    .execute(pool)
    .await?;

    Ok(())
}

async fn load_exclusions(pool: &SqlitePool) -> Vec<String> {
    let result: Result<Vec<String>, sqlx::Error> = sqlx::query_scalar(
        "SELECT app_name FROM exclusions"
    )
    .fetch_all(pool)
    .await;

    result.unwrap_or_default()
}
