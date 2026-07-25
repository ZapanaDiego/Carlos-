use std::env;
use std::fs;
use std::io;
use std::path::Path;
use tracing_subscriber::{
    fmt,
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter,
};
use tracing_appender::non_blocking::WorkerGuard;

/// Initialize the Rust-side unified logger.
///
/// Returns a `WorkerGuard` that **must** be kept alive for the entire lifetime
/// of the application.  Dropping the guard causes the non-blocking file
/// appender to flush and stop — any logs emitted after that point will be lost.
pub fn init() -> WorkerGuard {
    let raw_env = env::var("CARLOSPP_ENV").unwrap_or_else(|_| "prod".to_string());
    let is_dev = raw_env.to_lowercase() == "dev";

    // Set filter based on environment
    let default_filter = if is_dev {
        "debug,carlospp=trace" // Very verbose for dev
    } else {
        "info,carlospp=warn"   // Quieter for prod
    };

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(default_filter));

    // Ensure logs directory exists
    let log_dir = Path::new("logs");
    if !log_dir.exists() {
        fs::create_dir_all(log_dir).expect("Failed to create logs directory");
    }

    // Configure file appender for consolidated logs
    let file_appender = tracing_appender::rolling::never("logs", "carlospp_dev.log");
    let (non_blocking_file, file_guard) = tracing_appender::non_blocking(file_appender);

    // Stderr formatting (JSON) — Rust process logs go to stderr,
    // keeping stdout clean (consistent with the project-wide rule that
    // stdout is reserved for IPC / structured data only).
    let stderr_layer = fmt::layer()
        .json()
        .with_writer(io::stderr)
        .with_target(false)
        .with_file(false)
        .with_line_number(false);

    // File formatting (JSON)
    let file_layer = fmt::layer()
        .json()
        .with_writer(non_blocking_file)
        .with_target(false)
        .with_file(false)
        .with_line_number(false);

    tracing_subscriber::registry()
        .with(env_filter)
        .with(stderr_layer)
        .with(file_layer)
        .init();

    tracing::info!(
        target: "rust.logger",
        "Rust Logger initialized. Environment: {} (raw: {}).",
        if is_dev { "dev" } else { "prod" },
        raw_env
    );

    file_guard
}
