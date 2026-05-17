type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  route?: string
  userId?: string
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getMinLevel(): LogLevel {
  return (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
}

function formatLog(entry: LogEntry): string {
  const { level, message, timestamp, ...rest } = entry
  return JSON.stringify({ level, msg: message, ts: timestamp, ...rest })
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[getMinLevel()]) return

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  const formatted = formatLog(entry)

  switch (level) {
    case 'error':
      console.error(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    default:
      console.log(formatted)
  }
}

export function generateRequestId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    log('info', message, meta)
  },
  warn(message: string, meta?: Record<string, unknown>) {
    log('warn', message, meta)
  },
  error(message: string, meta?: Record<string, unknown>) {
    log('error', message, meta)
  },
  debug(message: string, meta?: Record<string, unknown>) {
    log('debug', message, meta)
  },
}
