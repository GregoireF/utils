---
"@gregoiref/result": minor
---

Add async Result utilities: `resultAll`, `resultSettled`, `withTimeout`, and `withRetry` with exponential backoff.

- `resultAll` — collect all Ok values or short-circuit on the first Err
- `resultSettled` — collect every Result regardless of outcome
- `withTimeout` — race a Result promise against a configurable deadline (`OperationTimeoutError`)
- `withRetry` — retry a fallible operation with exponential backoff and a custom `shouldRetry` predicate