# @gregoiref/vitest-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fvitest-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Shared Vitest configuration with v8 coverage thresholds — base (node) and dom variants.

## Why

Vitest's default coverage setup has no thresholds and no standard reporter output. Without enforced thresholds, coverage silently degrades as new code is added without tests. This config enforces **100% on all four metrics** (lines, functions, branches, statements) and outputs HTML + JSON summary reports alongside the text table — making coverage visible in CI and in the browser.

## Installation

```bash
pnpm add -D @gregoiref/vitest-config vitest @vitest/coverage-v8
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## Usage

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { createBaseConfig } from '@gregoiref/vitest-config/base'

export default defineConfig({ test: createBaseConfig() })
```

For DOM / browser testing (requires `jsdom`):

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { createDomConfig } from '@gregoiref/vitest-config/dom'

export default defineConfig({ test: createDomConfig() })
```

Pass overrides to customise for a specific package:

```ts
export default defineConfig({
  test: createBaseConfig({
    setupFiles: ['./src/test-setup.ts'],
    testTimeout: 10_000,
  }),
})
```

## Defaults

| Setting | `base` | `dom` |
|---|---|---|
| `globals` | `true` | `true` |
| `environment` | `node` | `jsdom` |
| Coverage provider | `v8` | `v8` |
| Coverage threshold | 100% (lines/fns/branches/stmts) | same |
| Coverage reporters | `text`, `json-summary`, `html` | same |
| Coverage includes | `src/**` | `src/**` |
| Coverage excludes | `*.d.ts`, `*.test.ts`, `*.spec.ts` | same |

## Exports

| Entry | Function |
|---|---|
| `@gregoiref/vitest-config/base` | `createBaseConfig(overrides?)` |
| `@gregoiref/vitest-config/dom` | `createDomConfig(overrides?)` |

## Limitations

- Requires `vitest >= 2.0.0` and `@vitest/coverage-v8` as peer dependencies.
- The `dom` config requires `jsdom` — install it separately: `pnpm add -D jsdom`.
- Coverage thresholds fail the test run if not met. To temporarily lower them, pass `coverage: { thresholds: { lines: 90 } }` in the overrides object.
