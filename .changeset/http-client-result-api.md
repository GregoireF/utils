---
"@gregoiref/http-client": patch
---

Refactor error handling to return `Result<HttpResponse<T>, HttpError | TimeoutError>` instead of throwing. All methods now return a `Result` discriminated union — check `result.ok` to branch on success or failure. `HttpError` and `TimeoutError` are `Err` values; unexpected network errors and external `AbortSignal` cancellations still propagate as thrown exceptions.

Also adds `@gregoiref/result` as a runtime dependency.
