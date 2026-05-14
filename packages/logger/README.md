# @gregoiref/logger

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Flogger%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![coverage](https://codecov.io/gh/GregoireF/utils/graph/badge.svg?flag=logger)](https://codecov.io/gh/GregoireF/utils)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/GregoireF/utils/tree/main/packages/logger)

Structured, typed logger with pluggable transports — zero dependencies.

## Why

`console.log` is not structured — it produces freeform text that monitoring tools cannot parse. Most structured-logging libraries (winston, pino) are heavy and Node-only. This logger outputs a plain JSON object per entry, works in any JS runtime (Node, browser, edge), and has a `child()` API to propagate context (request ID, user ID…) without repetition.

## Installation

```bash
pnpm add @gregoiref/logger
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## API

### `createLogger(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `level` | `LogLevel` | `'debug'` | Minimum severity to emit |
| `transports` | `Transport[]` | `[consoleTransport]` | Output targets |
| `context` | `Record<string, unknown>` | — | Fields merged into every entry |

Returns a `Logger` with:

| Method | Description |
|---|---|
| `.debug(message, context?)` | Emit a debug-level entry |
| `.info(message, context?)` | Emit an info-level entry |
| `.warn(message, context?)` | Emit a warn-level entry |
| `.error(message, context?)` | Emit an error-level entry |
| `.child(context)` | Return a new logger with merged context |

### `consoleTransport`

Built-in transport that writes each `LogEntry` as a JSON string to the matching `console.*` method.

### Types

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogEntry = {
  level: LogLevel
  message: string
  timestamp: string      // ISO 8601
  [key: string]: unknown // arbitrary context fields
}

type Transport = (entry: LogEntry) => void
```

## Usage

```ts
import { createLogger, consoleTransport } from '@gregoiref/logger'

// ── Basic usage ─────────────────────────────────────────────────────────────
const log = createLogger({ level: 'info' })

log.debug('ignored — below min level')
log.info('Server started', { port: 3000 })
// → {"level":"info","message":"Server started","timestamp":"…","port":3000}

log.warn('High memory usage', { heapUsed: 512 })
log.error('Unhandled exception', { error: err.message })

// ── Child loggers ────────────────────────────────────────────────────────────
const reqLog = log.child({ requestId: 'abc-123', userId: 42 })
reqLog.info('Request received', { method: 'GET', path: '/users' })
// → {"level":"info","message":"Request received","timestamp":"…",
//    "requestId":"abc-123","userId":42,"method":"GET","path":"/users"}

// ── Custom transport ─────────────────────────────────────────────────────────
const httpTransport: Transport = (entry) => {
  fetch('/logs', { method: 'POST', body: JSON.stringify(entry) })
}

const log2 = createLogger({ transports: [consoleTransport, httpTransport] })
```

## Limitations

- No built-in file, HTTP, or database transports — implement a custom `Transport` for those.
- Log entries are serialised as `JSON.stringify(entry)` in `consoleTransport`. Non-serialisable values (e.g. `Error` objects, circular refs) will be dropped or produce `{}`. Stringify the error message before passing it.
- No log rotation, batching, or async flushing — add those in a custom transport.
- `child()` creates a new logger instance with a shallow-merged context; deeply nested context objects are not deep-merged.
