use crate::error::AppError;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringStatus {
    pub is_running: bool,
    pub has_screen_recording_permission: bool,
    pub activities_today: u64,
}

#[tauri::command]
pub async fn start_monitoring(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut monitor = state.monitor.lock().await;
    monitor.start(state.db.clone());
    Ok(())
}

#[tauri::command]
pub async fn stop_monitoring(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut monitor = state.monitor.lock().await;
    monitor.stop().await;
    Ok(())
}

#[tauri::command]
pub async fn get_monitoring_status(state: State<'_, AppState>) -> Result<MonitoringStatus, AppError> {
    let monitor = state.monitor.lock().await;
    let is_running = monitor.is_running();

    // Check if we have screen recording permission by testing active-win-pos-rs
    let has_permission = check_screen_recording_permission();

    // Count activities from today
    let activities_today = count_activities_today(&state.db).await?;

    Ok(MonitoringStatus {
        is_running,
        has_screen_recording_permission: has_permission,
        activities_today,
    })
}

fn check_screen_recording_permission() -> bool {
    // Try to get active window - if title is empty AND app_name is not empty, permission not granted
    match active_win_pos_rs::get_active_window() {
        Ok(window) => !window.title.is_empty() && !window.app_name.is_empty(),
        Err(_) => false,
    }
}

async fn count_activities_today(pool: &sqlx::SqlitePool) -> Result<u64, AppError> {
    let today_start = chrono::Utc::now()
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .expect("0:0:0 is always valid time")
        .and_utc()
        .to_rfc3339();

    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM activities WHERE started_at >= ?"
    )
    .bind(today_start)
    .fetch_one(pool)
    .await?;

    Ok(count as u64)
}
