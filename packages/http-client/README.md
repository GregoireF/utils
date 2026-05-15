# @gregoiref/http-client

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fhttp-client%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=http-client&label=coverage&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)

Typed `fetch` wrapper with interceptors, timeout, and `Result<T, E>` error handling.

## Why

The native `fetch` API is untyped, has no built-in timeout support, and exposes no interception layer. Axios solves all of this but ships its own HTTP layer rather than wrapping `fetch`, making it heavier and harder to polyfill on edge runtimes. This client is a thin typed shell around `fetch` — no new network primitives, no bundle weight — with errors modelled as `Result<T, E>` values rather than thrown exceptions.

## Installation

```bash
pnpm add @gregoiref/http-client
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

Requires an environment with the global `fetch`, `Request`, `Response`, and `AbortSignal.any` (Node ≥ 18, modern browsers, Deno, Bun).

## API

### `createHttpClient(options?)`

| Option | Type | Description |
|---|---|---|
| `baseUrl` | `string` | Prepended to every request URL |
| `defaultHeaders` | `Record<string, string>` | Merged into every request |
| `timeout` | `number` | Default timeout in ms (overridable per request) |
| `requestInterceptors` | `Interceptor<RequestInit>[]` | Applied in order before the fetch |
| `responseInterceptors` | `Interceptor<Response>[]` | Applied in order after a successful fetch |

Returns an object with:

| Method | Signature |
|---|---|
| `.get<T>(url, opts?)` | → `Promise<Result<HttpResponse<T>, HttpError \| TimeoutError>>` |
| `.post<T>(url, body?, opts?)` | → `Promise<Result<HttpResponse<T>, HttpError \| TimeoutError>>` |
| `.put<T>(url, body?, opts?)` | → `Promise<Result<HttpResponse<T>, HttpError \| TimeoutError>>` |
| `.patch<T>(url, body?, opts?)` | → `Promise<Result<HttpResponse<T>, HttpError \| TimeoutError>>` |
| `.delete<T>(url, opts?)` | → `Promise<Result<HttpResponse<T>, HttpError \| TimeoutError>>` |
| `.request<T>(url, opts?)` | → `Promise<Result<HttpResponse<T>, HttpError \| TimeoutError>>` |

### `HttpResponse<T>`

```ts
interface HttpResponse<T> {
  data: T                        // Parsed body (JSON or plain text)
  status: number
  headers: Record<string, string>
}
```

### Errors

`HttpError` and `TimeoutError` are returned as `Err` values — they never throw. Unexpected errors (network failure, external `AbortSignal` cancellation) propagate as thrown exceptions.

| Class | Condition |
|---|---|
| `HttpError` | Response status is non-2xx — exposes `.status` and `.response` |
| `TimeoutError` | Request exceeded the configured timeout |

## Usage

```ts
import { isOk, isErr } from '@gregoiref/result'
import { createHttpClient, HttpError, TimeoutError } from '@gregoiref/http-client'

const api = createHttpClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: { Authorization: `Bearer ${token}` },
  timeout: 5000,
})

// ── GET ──────────────────────────────────────────────────────────────────────
const result = await api.get<User[]>('/users')
if (isOk(result)) {
  const { data, status } = result.value
}

// ── POST ─────────────────────────────────────────────────────────────────────
const created = await api.post<User>('/users', { name: 'Alice' })

// ── Result-based error handling ───────────────────────────────────────────────
if (isErr(created)) {
  if (created.error instanceof HttpError)    console.error(created.error.status)
  if (created.error instanceof TimeoutError) console.error('Request timed out')
}

// ── Interceptors ──────────────────────────────────────────────────────────────
const authedApi = createHttpClient({
  baseUrl: 'https://api.example.com',
  requestInterceptors: [
    (init) => ({
      ...init,
      headers: { ...(init.headers as Record<string, string>), 'X-Request-ID': crypto.randomUUID() },
    }),
  ],
  responseInterceptors: [
    (res) => { console.log(`← ${res.status}`); return res },
  ],
})

// ── Per-request timeout override ──────────────────────────────────────────────
await api.get('/slow-endpoint', { timeout: 30_000 })

// ── External cancellation (throws, not Err) ───────────────────────────────────
const controller = new AbortController()
setTimeout(() => controller.abort(), 2000)
try {
  await api.get('/stream', { signal: controller.signal })
} catch {
  // external abort propagates as a thrown error
}
```

## Limitations

- JSON bodies only — binary, `FormData`, and streaming bodies require the raw `.request()` method with a custom `RequestInit`.
- `responseInterceptors` run after the 2xx check — they do not see error responses. Inspect error responses in the `HttpError.response` field.
- No automatic retry logic — implement retries in a `requestInterceptor` or wrap calls externally.
- Requires `AbortSignal.any` (Node ≥ 18.17, Chrome 116). Polyfill needed for older targets.
- External `AbortSignal` cancellation propagates as a thrown exception, not as an `Err` — it falls outside the `HttpError | TimeoutError` error contract.

## Related

- [`@gregoiref/result`](../result/) — the `Result<T, E>` type returned by every method
- [`@gregoiref/logger`](../logger/) — pair with child loggers for structured request tracing
- [Getting started — Pattern 1](../../docs/getting-started.md#pattern-1--http-service-with-typed-error-handling) — full combined example
