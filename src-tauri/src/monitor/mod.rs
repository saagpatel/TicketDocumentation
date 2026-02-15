mod poller;
pub mod sanitizer;

use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::{watch, Mutex};
use tokio::task::JoinHandle;

pub struct MonitorHandle {
    task_handle: JoinHandle<()>,
    stop_tx: watch::Sender<bool>,
}

pub struct MonitorState {
    pub handle: Option<MonitorHandle>,
}

impl MonitorState {
    pub fn new() -> Self {
        Self { handle: None }
    }

    pub fn start(&mut self, db: Arc<SqlitePool>) {
        // If already running, do nothing
        if self.handle.is_some() {
            return;
        }

        // Create stop signal channel
        let (stop_tx, stop_rx) = watch::channel(false);

        // Spawn polling task
        let task_handle = tokio::spawn(async move {
            poller::start_polling(db, stop_rx).await;
        });

        self.handle = Some(MonitorHandle {
            task_handle,
            stop_tx,
        });
    }

    pub async fn stop(&mut self) {
        if let Some(handle) = self.handle.take() {
            // Send stop signal
            let _ = handle.stop_tx.send(true);

            // Wait for task to complete
            let _ = handle.task_handle.await;
        }
    }

    pub fn is_running(&self) -> bool {
        self.handle.is_some()
    }
}

// Wrapper for thread-safe access
pub type SharedMonitorState = Arc<Mutex<MonitorState>>;

pub fn create_monitor_state() -> SharedMonitorState {
    Arc::new(Mutex::new(MonitorState::new()))
}
