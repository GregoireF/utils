# @gregoiref/http-client

![npm version](https://img.shields.io/npm/v/@gregoiref/http-client)
![license](https://img.shields.io/npm/l/@gregoiref/http-client)
![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![coverage](https://img.shields.io/badge/coverage-96%25-brightgreen)

Typed `fetch` wrapper with interceptors, timeout, and structured errors — zero dependencies.

## Why

The native `fetch` API is untyped, has no built-in timeout support, and exposes no interception layer. Axios solves all of this but ships its own HTTP layer rather than wrapping `fetch`, making it heavier and harder to polyfill on edge runtimes. This client is a thin typed shell around `fetch` — no new network primitives, no bundle weight.

## Installation

```bash
pnpm add @gregoiref/http-client
```

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
| `.get<T>(url, opts?)` | → `Promise<HttpResponse<T>>` |
| `.post<T>(url, body?, opts?)` | → `Promise<HttpResponse<T>>` |
| `.put<T>(url, body?, opts?)` | → `Promise<HttpResponse<T>>` |
| `.patch<T>(url, body?, opts?)` | → `Promise<HttpResponse<T>>` |
| `.delete<T>(url, opts?)` | → `Promise<HttpResponse<T>>` |
| `.request<T>(url, opts?)` | → `Promise<HttpResponse<T>>` |

### `HttpResponse<T>`

```ts
interface HttpResponse<T> {
  data: T                        // Parsed body (JSON or plain text)
  status: number
  headers: Record<string, string>
}
```

### Errors

| Class | Thrown when |
|---|---|
| `HttpError` | Response status is non-2xx — exposes `.status` and `.response` |
| `TimeoutError` | Request exceeds the configured timeout |

## Usage

```ts
import { createHttpClient, HttpError, TimeoutError } from '@gregoiref/http-client'

const api = createHttpClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: { Authorization: `Bearer ${token}` },
  timeout: 5000,
})

// ── GET ─────────────────────────────────────────────────────────────────────
const { data, status } = await api.get<User[]>('/users')

// ── POST ─────────────────────────────────────────────────────────────────────
const { data: created } = await api.post<User>('/users', { name: 'Alice' })

// ── Error handling ───────────────────────────────────────────────────────────
try {
  await api.get('/protected')
} catch (e) {
  if (e instanceof HttpError)    console.error(e.status, e.response)
  if (e instanceof TimeoutError) console.error('Request timed out')
}

// ── Interceptors ─────────────────────────────────────────────────────────────
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

// ── Per-request timeout override ─────────────────────────────────────────────
await api.get('/slow-endpoint', { timeout: 30_000 })

// ── External cancellation ────────────────────────────────────────────────────
const controller = new AbortController()
setTimeout(() => controller.abort(), 2000)
await api.get('/stream', { signal: controller.signal })
```

## Limitations

- JSON bodies only — binary, `FormData`, and streaming bodies require the raw `.request()` method with a custom `RequestInit`.
- `responseInterceptors` run after the 2xx check — they do not see error responses. Inspect error responses in the `HttpError.response` field.
- No automatic retry logic — implement retries in a `requestInterceptor` or wrap calls externally.
- Requires `AbortSignal.any` (Node ≥ 18.17, Chrome 116). Polyfill needed for older targets.
