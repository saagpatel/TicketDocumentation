mod commands;
mod db;
mod error;
mod llm;
mod monitor;
mod panel;
mod pattern;
mod tray;

use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

pub struct AppState {
    pub db: Arc<SqlitePool>,
    pub monitor: monitor::SharedMonitorState,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Set activation policy to Accessory (no dock icon)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Initialize database
            let app_data_dir = app.path().app_data_dir()?;
            let db_pool =
                tauri::async_runtime::block_on(async { db::init_database(app_data_dir).await })?;

            // Create shared state
            let db_arc = Arc::new(db_pool);
            let monitor_state = monitor::create_monitor_state();

            // Store state
            app.manage(AppState {
                db: db_arc,
                monitor: monitor_state,
            });

            // Create tray icon
            tray::create_tray(app.handle())?;

            // Get the main window and configure it as a panel
            if let Some(window) = app.get_webview_window("main") {
                panel::setup_panel(window.clone());

                // Register global shortcut (Cmd+Shift+T)
                let window_clone = window.clone();
                app.global_shortcut()
                    .on_shortcut("CmdOrCtrl+Shift+T", move |_app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            match window_clone.is_visible() {
                                Ok(true) => {
                                    let _ = window_clone.hide();
                                }
                                Ok(false) => {
                                    let _ = window_clone.show();
                                    let _ = window_clone.set_focus();
                                }
                                Err(e) => {
                                    eprintln!("Failed to check window visibility: {}", e);
                                }
                            }
                        }
                    })
                    .ok();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::monitoring::start_monitoring,
            commands::monitoring::stop_monitoring,
            commands::monitoring::get_monitoring_status,
            commands::settings::get_exclusions,
            commands::settings::add_exclusion,
            commands::settings::remove_exclusion,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::ollama::check_ollama_status,
            commands::resolution::generate_resolution,
            commands::resolution::save_resolution,
            commands::resolution::get_resolutions,
            commands::resolution::get_resolution_by_id,
            commands::activities::get_activities,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
