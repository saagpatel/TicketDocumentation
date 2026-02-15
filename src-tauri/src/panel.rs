#[cfg(target_os = "macos")]
use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
#[cfg(target_os = "macos")]
use cocoa::base::id;

#[cfg(target_os = "macos")]
pub fn setup_panel(window: tauri::WebviewWindow) {
    use tauri_nspanel::WebviewWindowExt as NsPanelWebviewWindowExt;

    // Convert window to NSPanel
    let panel = match window.to_panel() {
        Ok(p) => p,
        Err(e) => {
            // eprintln is acceptable here - this is platform-specific UI setup code
            eprintln!("Failed to convert window to panel: {}", e);
            return;
        }
    };

    unsafe {
        // Cast the panel to an id (NSPanel inherits from NSWindow)
        let ns_panel: id = &*panel as *const _ as id;

        // Make panel float above other windows
        ns_panel.setCollectionBehavior_(
            NSWindowCollectionBehavior::NSWindowCollectionBehaviorTransient
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorMoveToActiveSpace
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
        );

        // Make it non-activating (doesn't steal focus)
        ns_panel.setLevel_(25); // NSPopUpMenuWindowLevel equivalent
    }
}

#[cfg(not(target_os = "macos"))]
pub fn setup_panel(_window: tauri::WebviewWindow) {
    // No-op on non-macOS platforms
}
