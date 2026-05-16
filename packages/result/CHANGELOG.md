# @gregoiref/result

## 1.1.0

### Minor Changes

- ✨ Add async Result utilities: `resultAll`, `resultSettled`, `withTimeout`, and `withRetry` with exponential backoff.

  - `resultAll` — collect all Ok values or short-circuit on the first Err
  - `resultSettled` — collect every Result regardless of outcome
  - `withTimeout` — race a Result promise against a configurable deadline (`OperationTimeoutError`)
  - `withRetry` — retry a fallible operation with exponential backoff and a custom `shouldRetry` predicate

## 1.0.0

### Major Changes

- [#5](https://github.com/GregoireF/utils/pull/5) [`f4b45c8`](https://github.com/GregoireF/utils/commit/f4b45c824cec961ac6107c44954cfca1ba77adc1) Thanks [@GregoireF](https://github.com/GregoireF)! - First stable release (1.0.0) — all packages reach production-ready status.

  Each package ships with 100% test coverage, full TypeScript types, zero runtime dependencies, and a complete API surface. Metadata (`repository`, `bugs`) and homepage URLs are now accurate across all packages. Changelogs are now generated with PR links via `@changesets/changelog-github`.
