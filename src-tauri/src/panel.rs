#[cfg(target_os = "macos")]
pub fn setup_panel(window: tauri::WebviewWindow) {
    // Keep lightweight floating-panel behavior without external panel plugin.
    let _ = window.set_always_on_top(true);
}

#[cfg(not(target_os = "macos"))]
pub fn setup_panel(_window: tauri::WebviewWindow) {
    // No-op on non-macOS platforms
}
