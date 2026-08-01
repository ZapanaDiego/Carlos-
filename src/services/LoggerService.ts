import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useLogStore } from '../store/logStore';
import { LogLevel, ILogEntry } from '../types/log.types';

class LoggerService {
  private isInitialized = false;
  private _isSendingError = false; // Guard against recursive error loops

  public init() {
    if (this.isInitialized) return;
    
    // Listen for events from Rust backend
    listen<ILogEntry>('log-entry', (event) => {
      useLogStore.getState().addLog(event.payload);
    });

    // Capture global React/window errors
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError('window.onerror', message.toString(), { source, lineno, colno, errorStack: error?.stack });
    };

    window.onunhandledrejection = (event) => {
      this.captureError('window.onunhandledrejection', event.reason?.message || 'Unhandled Promise Rejection', { reason: event.reason });
    };

    this.isInitialized = true;
    this.sendLog('INFO', 'Frontend LoggerService initialized', 'frontend.logger');
  }

  private captureError(source: string, message: string, metadata: Record<string, unknown>) {
    // Prevent infinite recursion: if sending a previous error to the backend
    // itself caused an error that triggered window.onerror, break the cycle.
    if (this._isSendingError) return;

    const entry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      source,
      message,
      metadata,
      simulation_step: null // UI errors happen outside simulation context
    };
    useLogStore.getState().addLog(entry);
    // Also send it to Rust backend, guarded against recursion
    this._isSendingError = true;
    invoke('log_to_backend', {
      level: entry.level,
      message: entry.message,
      source: entry.source,
      metadata: entry.metadata
    }).catch(() => {
      // Intentionally swallow — we already added to local store above.
      // Using console.error here could theoretically re-trigger window.onerror
      // in edge cases, so we stay silent.
    }).finally(() => {
      this._isSendingError = false;
    });
  }

  public sendLog(level: LogLevel, message: string, source: string = 'frontend', metadata: Record<string, unknown> = {}) {
    const entry: ILogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      metadata,
      simulation_step: null // Frontend generally logs without simulation context
    };

    // 1. Add to local store immediately for UI
    useLogStore.getState().addLog(entry);

    // 2. Send to Rust backend to write to carlospp_dev.log
    invoke('log_to_backend', {
      level,
      message,
      source,
      metadata
    }).catch(e => {
        console.error("Failed to send log to backend", e);
    });
  }
}

export const loggerService = new LoggerService();
