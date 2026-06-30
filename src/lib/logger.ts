/**
 * Structured logger with correlation ID support.
 * Logs as JSON lines for log aggregation systems.
 */

let correlationId: string | null = null;

export function setCorrelationId(id: string) {
  correlationId = id;
}

export function getCorrelationId(): string | null {
  return correlationId;
}

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  correlation_id?: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(correlationId ? { correlation_id: correlationId } : {}),
    ...meta,
  };
  const line = JSON.stringify(entry);
  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.warn(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
