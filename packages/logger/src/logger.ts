// ─── Types ─────────────────────────────────────────────────────────────────────

/** Severity level in ascending order: `debug` < `info` < `warn` < `error`. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Structured log entry passed to every transport.
 * The index signature allows arbitrary context fields to be merged in at the call site.
 */
export type LogEntry = {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

/** A function that receives a {@link LogEntry} and writes it somewhere (console, file, HTTP…). */
export type Transport = (entry: LogEntry) => void

/** Options accepted by {@link createLogger}. */
export interface LoggerOptions {
  /** Minimum severity to emit. Messages below this level are silently dropped. */
  level?: LogLevel
  /** Output targets. Defaults to {@link consoleTransport}. */
  transports?: Transport[]
  /** Fields merged into every log entry produced by this logger instance. */
  context?: Record<string, unknown>
}

/** The public logger interface returned by {@link createLogger}. */
export interface Logger {
  /** Emits a debug-level message. */
  debug(message: string, context?: Record<string, unknown>): void
  /** Emits an info-level message. */
  info(message: string, context?: Record<string, unknown>): void
  /** Emits a warn-level message. */
  warn(message: string, context?: Record<string, unknown>): void
  /** Emits an error-level message. */
  error(message: string, context?: Record<string, unknown>): void
  /**
   * Returns a new child logger that inherits this instance's settings and
   * permanently merges `context` into every entry it emits.
   * Changes to the child do not affect the parent.
   */
  child(context: Record<string, unknown>): Logger
}

// ─── Internal ──────────────────────────────────────────────────────────────────

// Numeric levels allow a single `<` comparison to filter messages instead of
// a switch statement or indexOf search on the string union.
const LEVELS: Readonly<Record<LogLevel, number>> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// ─── Transports ────────────────────────────────────────────────────────────────

/**
 * Built-in transport that writes each entry as a compact JSON string to the
 * matching `console.*` method (`debug` / `info` / `warn` / `error`).
 */
export const consoleTransport: Transport = (entry) => {
  const fn = { debug: console.debug, info: console.info, warn: console.warn, error: console.error }[
    entry.level
  ]
  fn(JSON.stringify(entry))
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a structured logger with pluggable transports.
 *
 * @param options - Logger configuration.
 * @returns A {@link Logger} instance.
 *
 * @example
 * ```ts
 * const log = createLogger({ level: 'info' })
 * log.info('Server started', { port: 3000 })
 *
 * const reqLog = log.child({ requestId: 'abc-123' })
 * reqLog.warn('Slow response', { duration: 1200 })
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    level: minLevel = 'debug',
    transports = [consoleTransport],
    context: baseContext,
  } = options

  function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVELS[level] < LEVELS[minLevel]) return
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...baseContext,
      ...context,
    }
    for (const transport of transports) {
      transport(entry)
    }
  }

  return {
    debug: (message, context) => emit('debug', message, context),
    info: (message, context) => emit('info', message, context),
    warn: (message, context) => emit('warn', message, context),
    error: (message, context) => emit('error', message, context),
    child: (childContext) =>
      createLogger({
        level: minLevel,
        transports,
        context: { ...baseContext, ...childContext },
      }),
  }
}
