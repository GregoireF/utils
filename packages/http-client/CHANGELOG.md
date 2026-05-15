# @gregoiref/http-client

## 0.0.1

### Patch Changes

- 57371b6: Refactor error handling to return `Result<HttpResponse<T>, HttpError | TimeoutError>` instead of throwing. All methods now return a `Result` discriminated union — check `result.ok` to branch on success or failure. `HttpError` and `TimeoutError` are `Err` values; unexpected network errors and external `AbortSignal` cancellations still propagate as thrown exceptions.

  Also adds `@gregoiref/result` as a runtime dependency.

  - @gregoiref/result@0.0.0
