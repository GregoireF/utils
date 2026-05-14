# @gregoiref/result

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fresult%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![coverage](https://codecov.io/gh/GregoireF/utils/graph/badge.svg?flag=result)](https://codecov.io/gh/GregoireF/utils)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/GregoireF/utils/tree/main/packages/result)

Type-safe `Result<T, E>` pattern for TypeScript — zero dependencies.

## Why

Exceptions are invisible in function signatures. A function that returns `User` might throw an `AuthError`, a `NetworkError`, or a plain `Error` — nothing in the type tells you. The `Result` pattern makes the happy path and the failure path equally explicit in the return type, so the compiler forces you to handle both.

No external library needed: the entire implementation is \~70 lines of pure TypeScript.

## Installation

```bash
pnpm add @gregoiref/result
```

## API

| Symbol | Signature | Description |
|---|---|---|
| `Ok<T>` | `Readonly<{ ok: true; value: T }>` | Successful result type |
| `Err<E>` | `Readonly<{ ok: false; error: E }>` | Failed result type |
| `Result<T, E>` | `Ok<T> \| Err<E>` | Discriminated union (default `E = Error`) |
| `ok(value)` | `(T) → Ok<T>` | Create a frozen Ok |
| `err(error)` | `(E) → Err<E>` | Create a frozen Err |
| `isOk(result)` | `(Result) → result is Ok<T>` | Type guard |
| `isErr(result)` | `(Result) → result is Err<E>` | Type guard |
| `map(result, fn)` | `(Result<T,E>, T→U) → Result<U,E>` | Transform Ok value |
| `mapErr(result, fn)` | `(Result<T,E>, E→F) → Result<T,F>` | Transform Err value |
| `flatMap(result, fn)` | `(Result<T,E>, T→Result<U,E>) → Result<U,E>` | Monadic bind |
| `unwrap(result)` | `(Result<T,E>) → T` | Extract value or throw `ResultError` |
| `unwrapOr(result, fallback)` | `(Result<T,E>, T) → T` | Extract value or return fallback |
| `unwrapOrElse(result, fn)` | `(Result<T,E>, E→T) → T` | Extract value or compute fallback |
| `fromThrowable(fn)` | `(() → T) → Result<T, Error>` | Wrap a throwing function |
| `fromPromise(promise)` | `(Promise<T>) → Promise<Result<T, Error>>` | Wrap a promise |

## Usage

```ts
import { ok, err, isOk, map, unwrapOr, fromThrowable } from '@gregoiref/result'

// ── Basic construction ──────────────────────────────────────────────────────
const success = ok(42)        // Ok<number>
const failure = err('oops')   // Err<string>

// ── Type-safe branching ─────────────────────────────────────────────────────
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err('division by zero')
  return ok(a / b)
}

const result = divide(10, 2)
if (isOk(result)) {
  console.log(result.value) // 5
}

// ── Transform without unwrapping ────────────────────────────────────────────
const doubled = map(divide(10, 2), (n) => n * 2) // Ok<number> | Err<string>

// ── Safe fallback ───────────────────────────────────────────────────────────
const value = unwrapOr(divide(10, 0), 0) // 0

// ── Wrapping legacy code ────────────────────────────────────────────────────
const parsed = fromThrowable(() => JSON.parse(rawInput))
```

## Limitations

- `ok()` and `err()` call `Object.freeze()` — the wrapped value itself is not deep-frozen.
- `fromThrowable` and `fromPromise` always produce `Result<T, Error>`. If you need a richer error type, catch and map manually.
- No `async` variants of `map` / `flatMap` — compose with `fromPromise` instead.
