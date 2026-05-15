# @gregoiref/ts-utils

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fts-utils%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=ts-utils&label=coverage&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/GregoireF/utils/tree/main/packages/ts-utils)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)

Typed TypeScript utility functions — `pick`, `omit`, `groupBy`, `deepMerge`, `memoize`, and more — zero dependencies.

## Why

Every project ends up copying the same handful of utility functions. This package provides a small, strict, fully-tested set that works correctly under TypeScript's most aggressive compiler options (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`).

## Installation

```bash
pnpm add @gregoiref/ts-utils
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## API

### Object utilities

| Symbol | Signature | Description |
|---|---|---|
| `pick(obj, keys)` | `(T, K[]) → Pick<T, K>` | New object with only the listed keys |
| `omit(obj, keys)` | `(T, K[]) → Omit<T, K>` | Shallow copy without the listed keys |
| `deepMerge(target, source)` | `(T, DeepPartial<T>) → T` | Recursively merge source into target |
| `DeepPartialObject<T>` | type alias | `DeepPartial` re-export from this module |

### Array utilities

| Symbol | Signature | Description |
|---|---|---|
| `groupBy(arr, key)` | `(T[], T→string) → Record<string, T[]>` | Group elements by derived key |
| `chunk(arr, size)` | `(T[], number) → T[][]` | Split into fixed-size chunks |
| `unique(arr)` | `(T[]) → T[]` | Remove duplicate values (strict equality) |
| `uniqueBy(arr, key)` | `(T[], T→unknown) → T[]` | Remove duplicates by derived key |

### Function utilities

| Symbol | Signature | Description |
|---|---|---|
| `debounce(fn, delay)` | `(T, number) → T` | Delay invocation until quiet period elapses |
| `sleep(ms)` | `(number) → Promise<void>` | Async pause |
| `memoize(fn)` | `((...Args)→R) → (...Args)→R` | Cache results by JSON-serialized args |

### Type utilities

| Symbol | Description |
|---|---|
| `Nullable<T>` | `T \| null \| undefined` |
| `DeepPartial<T>` | Every nested property optional (compatible with `exactOptionalPropertyTypes`) |
| `DeepRequired<T>` | Every nested property required and non-nullable |
| `Prettify<T>` | Expands intersected types in IDE hovers |
| `ValueOf<T>` | Union of all value types in an object type |

## Usage

```ts
// Full barrel import
import { pick, omit, deepMerge, groupBy, chunk, unique, uniqueBy } from '@gregoiref/ts-utils'
import { debounce, sleep, memoize } from '@gregoiref/ts-utils'
import type { Nullable, DeepPartial, Prettify } from '@gregoiref/ts-utils'

// Sub-path imports for smaller bundles
import { pick, omit, deepMerge } from '@gregoiref/ts-utils/object'
import { groupBy, chunk, unique, uniqueBy } from '@gregoiref/ts-utils/array'
import { debounce, sleep, memoize } from '@gregoiref/ts-utils/function'

// ── Objects ─────────────────────────────────────────────────────────────────
const user = { id: 1, name: 'Alice', role: 'admin' }
pick(user, ['id', 'name'])         // { id: 1, name: 'Alice' }
omit(user, ['role'])               // { id: 1, name: 'Alice' }

deepMerge({ a: 1, b: { c: 2 } }, { b: { c: 99 } })
// { a: 1, b: { c: 99 } }

// ── Arrays ──────────────────────────────────────────────────────────────────
groupBy(['one', 'two', 'three'], (s) => String(s.length))
// { '3': ['one', 'two'], '5': ['three'] }

chunk([1, 2, 3, 4, 5], 2)         // [[1, 2], [3, 4], [5]]
unique([1, 2, 2, 3])              // [1, 2, 3]
uniqueBy([{ id: 1 }, { id: 1 }], (x) => x.id) // [{ id: 1 }]

// ── Functions ───────────────────────────────────────────────────────────────
const onResize = debounce(() => console.log('resized'), 200)
await sleep(500)

const expensiveFn = memoize((n: number) => n * n)
expensiveFn(4) // computed
expensiveFn(4) // cached
```

## Limitations

- `deepMerge` only recurses into plain objects — arrays and class instances are replaced, not merged.
- `memoize` uses `JSON.stringify` for cache keys; non-serializable arguments (functions, `undefined`, circular refs) will produce incorrect results.
- `debounce` does not expose a `.cancel()` method — use a dedicated library if you need that.
