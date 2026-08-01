// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod observability;

use tauri::Manager;
use tracing::info;

#[tauri::command]
fn log_to_backend(level: String, message: String, source: String, metadata: serde_json::Value) {
    // This command allows the frontend to log through the unified Rust logger
    // We can map the levels and emit a tracing event
    match level.as_str() {
        "TRACE" => tracing::trace!(target: "frontend", source = %source, metadata = %metadata, "{}", message),
        "DEBUG" => tracing::debug!(target: "frontend", source = %source, metadata = %metadata, "{}", message),
        "INFO" => tracing::info!(target: "frontend", source = %source, metadata = %metadata, "{}", message),
        "WARN" => tracing::warn!(target: "frontend", source = %source, metadata = %metadata, "{}", message),
        "ERROR" | "FATAL" => tracing::error!(target: "frontend", source = %source, metadata = %metadata, "{}", message),
        _ => tracing::info!(target: "frontend", source = %source, metadata = %metadata, "{}", message),
    }
}

fn main() {
    // Initialize the observability module and logger first.
    // The guard MUST be held alive for the duration of main() — dropping it
    // would cause the non-blocking file appender to stop writing.
    let _file_log_guard = observability::logger::init();
    
    info!(target: "rust.main", "Tauri application starting up");

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // In a real app, this is where we'd spawn the sidecar.
            // tauri::api::process::Command::new_sidecar("engine")...
            // For now, we just simulate how it would be hooked up.
            // Let's assume we started it and got a child with stdout/stderr.
            // let (mut rx, mut child) = Command::new_sidecar("engine")...
            // observability::sidecar_observer::spawn_observer(app_handle, child.stderr);

            info!(target: "rust.main", "Tauri setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![log_to_backend])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
