export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface ILogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  simulation_step: number | null;
}
