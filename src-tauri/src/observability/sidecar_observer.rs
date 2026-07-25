use serde_json::Value;
use std::io::{BufRead, BufReader};
use std::process::ChildStderr;
use std::thread;
use std::fs;
use tauri::{AppHandle, Manager};
use tracing::{debug, error, info, trace, warn};
use chrono::Utc;
use jsonschema::{JSONSchema, Draft};
use lazy_static::lazy_static;

lazy_static! {
    static ref LOG_SCHEMA: Option<JSONSchema> = {
        let schema_str = fs::read_to_string("schemas/telemetry_log.schema.json").ok()?;
        let schema_json: Value = serde_json::from_str(&schema_str).ok()?;
        JSONSchema::options()
            .with_draft(Draft::Draft7)
            .compile(&schema_json)
            .ok()
    };
}

pub fn spawn_observer(app_handle: AppHandle, stderr: ChildStderr) {
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
    let parsed: Result<Value, _> = serde_json::from_str(&raw_line);
    
    let mut validation_error_msg = None;
    
    let is_valid_schema = match &parsed {
        Ok(json) => {
            if let Some(schema) = &*LOG_SCHEMA {
                if let Err(errors) = schema.validate(json) {
                    // Extract the first error message
                    if let Some(first_error) = errors.into_iter().next() {
                        validation_error_msg = Some(format!("Validation failed: {}", first_error));
                    }
                    false
                } else {
                    true
                }
            } else {
                warn!("Schema validation skipped: schemas/telemetry_log.schema.json could not be loaded");
                // If schema didn't load, fallback to basic check
                let basic_valid = json.get("timestamp").is_some()
                    && json.get("level").is_some()
                    && json.get("source").is_some();
                if !basic_valid {
                    validation_error_msg = Some("Basic fields missing (schema not loaded)".to_string());
                }
                basic_valid
            }
        }
        Err(e) => {
            validation_error_msg = Some(format!("JSON Parse Error: {}", e));
            false
        }
    };

    if is_valid_schema {
        let json = parsed.unwrap();
        let level_str = json.get("level").and_then(|v| v.as_str()).unwrap_or("INFO");
        let msg = json.get("message").and_then(|v| v.as_str()).unwrap_or("");
        
        match level_str {
            "TRACE" => trace!(target: "python", raw_json = %json, "{}", msg),
            "DEBUG" => debug!(target: "python", raw_json = %json, "{}", msg),
            "INFO" => info!(target: "python", raw_json = %json, "{}", msg),
            "WARN" => warn!(target: "python", raw_json = %json, "{}", msg),
            "ERROR" | "FATAL" => error!(target: "python", raw_json = %json, "{}", msg),
            _ => info!(target: "python", raw_json = %json, "{}", msg),
        }

        let _ = app_handle.emit_all("log-entry", json);
    } else {
        let fallback_timestamp = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        
        let mut fallback_metadata = serde_json::json!({
            "raw": raw_line
        });
        
        if let Some(err_msg) = &validation_error_msg {
            fallback_metadata.as_object_mut().unwrap().insert("validation_error".to_string(), Value::String(err_msg.clone()));
        }

        let fallback_json = serde_json::json!({
            "timestamp": fallback_timestamp,
            "level": "WARN",
            "source": "rust.sidecar_observer",
            "message": "Received invalid log from Python sidecar",
            "metadata": fallback_metadata,
            "simulation_step": null
        });

        warn!(
            target: "rust.sidecar_observer",
            raw_line = %raw_line,
            validation_error = ?validation_error_msg,
            "Received invalid log from Python sidecar"
        );

        let _ = app_handle.emit_all("log-entry", fallback_json);
    }
}
