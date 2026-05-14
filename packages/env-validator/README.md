# @gregoiref/env-validator

![npm version](https://img.shields.io/npm/v/@gregoiref/env-validator)
![license](https://img.shields.io/npm/l/@gregoiref/env-validator)
![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

Type-safe environment variable validation without Zod — zero dependencies.

## Why

`process.env` is `Record<string, string | undefined>` — every access is untyped and potentially missing. Zod solves this well but adds \~60 kB to your bundle and requires a full schema runtime. This package provides the same fluent, chainable API with a tiny implementation (\~250 lines) and no runtime dependencies.

Type inference is fully static: the output type of `createEnv` is computed at compile time from the schema, with no casts.

## Installation

```bash
pnpm add @gregoiref/env-validator
```

> **Note:** `@types/node` is required for `process.env` access in Node environments.

## API

### `createEnv(schema, source?)`

Validates `source` (defaults to `process.env`) against `schema` and returns a typed object.  
Throws `EnvValidationError` listing **all** failing fields at once if any variable is invalid.

### Validators (`v.*`)

| Builder | Chainable methods | Output type |
|---|---|---|
| `v.string()` | `.optional()` `.default(val)` `.url()` | `string` |
| `v.number()` | `.optional()` `.default(val)` `.min(n)` `.max(n)` | `number` |
| `v.boolean()` | `.optional()` `.default(val)` | `boolean` |
| `v.enum(values)` | `.optional()` `.default(val)` | `typeof values[number]` |

**Optionality rules:**
- Required by default → missing variable throws.
- `.optional()` → missing variable yields `undefined`.
- `.default(val)` → missing variable yields `val`; output type stays `T` (never `undefined`).

## Usage

```ts
import { createEnv, v } from '@gregoiref/env-validator'

const env = createEnv({
  PORT:         v.number().min(1).max(65535).default(3000),
  DATABASE_URL: v.string().url(),
  NODE_ENV:     v.enum(['development', 'production', 'test'] as const),
  DEBUG:        v.boolean().optional(),
  API_KEY:      v.string(),
})

// env is fully typed:
// {
//   PORT:         number
//   DATABASE_URL: string
//   NODE_ENV:     'development' | 'production' | 'test'
//   DEBUG:        boolean | undefined
//   API_KEY:      string
// }

console.log(env.PORT)         // 3000 (or parsed from process.env.PORT)
console.log(env.NODE_ENV)     // 'development' | 'production' | 'test'
```

### Testing with a custom source

```ts
const env = createEnv(
  { HOST: v.string().default('localhost'), PORT: v.number() },
  { PORT: '8080' }, // override source — no process.env needed in tests
)
```

### Error handling

```ts
import { EnvValidationError } from '@gregoiref/env-validator'

try {
  createEnv({ API_KEY: v.string(), DB_URL: v.string().url() })
} catch (e) {
  if (e instanceof EnvValidationError) {
    console.error(e.errors)
    // ['Missing required env var: API_KEY', 'DB_URL: expected a valid URL, got "not-a-url"']
  }
}
```

## Limitations

- Only supports `string`, `number`, `boolean`, and string enums. Complex nested schemas are out of scope — use Zod for those.
- Boolean parsing accepts only `"true"`, `"false"`, `"1"`, `"0"`. Other truthy strings (e.g. `"yes"`) throw a validation error.
- No coercion between types (e.g. `v.number()` on `"3.14"` → `3.14`, but `v.number()` on `"abc"` throws).
