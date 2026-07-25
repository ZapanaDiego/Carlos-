use serde_json::Value;
use std::io::{BufRead, BufReader};
use std::process::{ChildStderr, Command, Stdio};
use std::thread;
use tauri::{AppHandle, Manager};
use tracing::{debug, error, info, trace, warn};
use chrono::Utc;

pub fn spawn_observer(app_handle: AppHandle, mut stderr: ChildStderr) {
    // In a real Tauri app this would probably use tokio::spawn or a thread
    // since tauri uses tokio under the hood. For simplicity, we use std::thread here
    // as stderr reading is blocking, but it's on a separate thread so it won't block the main event loop.
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            match line {
                Ok(raw_line) => {
                    handle_log_line(&app_handle, raw_line);
                }
                Err(e) => {
                    warn!(
                        target: "rust.sidecar_observer",
                        "Failed to read line from Python sidecar stderr: {}",
                        e
                    );
                    break;
                }
            }
        }
    });
}

fn handle_log_line(app_handle: &AppHandle, raw_line: String) {
    // Validate if it is valid JSON and matches the schema minimally
    let parsed: Result<Value, _> = serde_json::from_str(&raw_line);
    
    let is_valid_schema = match &parsed {
        Ok(json) => {
            json.get("timestamp").is_some()
                && json.get("level").is_some()
                && json.get("source").is_some()
                && json.get("message").is_some()
                && json.get("metadata").is_some()
                && json.get("simulation_step").is_some()
        }
        Err(_) => false,
    };

    if is_valid_schema {
        // Line is valid JSON matching our schema
        let json = parsed.unwrap();
        
        // Log it to the consolidated log using tracing
        // Note: Ideally we'd preserve the exact level, but tracing macros require static levels.
        // We'll log it as info for now, but the JSON payload contains the true level.
        // Actually, since we want tracing to write the JSON to the file, and we are already emitting
        // JSON from the tracing formatter, we could just emit a tracing event with the raw fields.
        let level_str = json.get("level").and_then(|v| v.as_str()).unwrap_or("INFO");
        let msg = json.get("message").and_then(|v| v.as_str()).unwrap_or("");
        let source = json.get("source").and_then(|v| v.as_str()).unwrap_or("python.sidecar");
        
        match level_str {
            "TRACE" => trace!(target: "python", raw_json = %json, "{}", msg),
            "DEBUG" => debug!(target: "python", raw_json = %json, "{}", msg),
            "INFO" => info!(target: "python", raw_json = %json, "{}", msg),
            "WARN" => warn!(target: "python", raw_json = %json, "{}", msg),
            "ERROR" | "FATAL" => error!(target: "python", raw_json = %json, "{}", msg),
            _ => info!(target: "python", raw_json = %json, "{}", msg),
        }

        // Emit to frontend
        let _ = app_handle.emit_all("log-entry", json);
    } else {
        // Invalid line
        let fallback_timestamp = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let fallback_json = serde_json::json!({
            "timestamp": fallback_timestamp,
            "level": "WARN",
            "source": "rust.sidecar_observer",
            "message": "Received invalid log from Python sidecar",
            "metadata": {
                "raw": raw_line
            },
            "simulation_step": null
        });

        // Log via tracing
        warn!(
            target: "rust.sidecar_observer",
            raw_line = %raw_line,
            "Received invalid log from Python sidecar"
        );

        // Emit to frontend
        let _ = app_handle.emit_all("log-entry", fallback_json);
    }
}
