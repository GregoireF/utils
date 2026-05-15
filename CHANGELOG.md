# Changelog

All notable changes to this monorepo are documented here. Each package has its own detailed changelog — this file provides a cross-package release overview.

For per-package changelogs, see:

| Package | Changelog |
|---|---|
| `@gregoiref/result` | [packages/result/CHANGELOG.md](packages/result/CHANGELOG.md) |
| `@gregoiref/ts-utils` | [packages/ts-utils/CHANGELOG.md](packages/ts-utils/CHANGELOG.md) |
| `@gregoiref/env-validator` | [packages/env-validator/CHANGELOG.md](packages/env-validator/CHANGELOG.md) |
| `@gregoiref/http-client` | [packages/http-client/CHANGELOG.md](packages/http-client/CHANGELOG.md) |
| `@gregoiref/logger` | [packages/logger/CHANGELOG.md](packages/logger/CHANGELOG.md) |
| `@gregoiref/date` | [packages/date/CHANGELOG.md](packages/date/CHANGELOG.md) |
| `@gregoiref/tsconfig` | [configs/tsconfig/CHANGELOG.md](configs/tsconfig/CHANGELOG.md) |
| `@gregoiref/biome-config` | [configs/biome/CHANGELOG.md](configs/biome/CHANGELOG.md) |
| `@gregoiref/vitest-config` | [configs/vitest/CHANGELOG.md](configs/vitest/CHANGELOG.md) |
| `@gregoiref/commitlint-config` | [configs/commitlint/CHANGELOG.md](configs/commitlint/CHANGELOG.md) |
| `@gregoiref/cz-config` | [configs/cz/CHANGELOG.md](configs/cz/CHANGELOG.md) |
| `@gregoiref/changeset-config` | [configs/changeset/CHANGELOG.md](configs/changeset/CHANGELOG.md) |

Full release history with PR links and contributor names is also available on [GitHub Releases](https://github.com/GregoireF/utils/releases).

---

## 2026-05 — Initial release (v1.0.0)

First stable release of all 12 packages.

**Utility packages**

- `@gregoiref/result` v1.0.0 — `Result<T, E>` pattern: `ok`, `err`, `map`, `flatMap`, `fromPromise`, and more. Zero dependencies, 100% coverage, fuzz-tested.
- `@gregoiref/ts-utils` v1.0.0 — Object (`pick`, `omit`, `deepMerge`), array (`groupBy`, `chunk`, `unique`), and function (`debounce`, `memoize`, `sleep`) utilities with tree-shakable sub-path exports. Fuzz-tested.
- `@gregoiref/env-validator` v1.0.0 — Fluent builder for environment validation: `.string()`, `.number()`, `.boolean()`, `.enum()`, chainable with `.optional()`, `.default()`, `.url()`. Infers type automatically. Fuzz-tested.
- `@gregoiref/http-client` v1.0.0 — Typed `fetch` wrapper returning `Result<HttpResponse<T>, HttpError | TimeoutError>`. Request/response interceptors, configurable timeout, `AbortSignal` support.
- `@gregoiref/logger` v1.0.0 — Structured JSON logger with pluggable transports and `child(context)` propagation. No external deps.
- `@gregoiref/date` v1.0.0 — `format`, `diff`, `add`, `startOf`, `clamp`, `isSameDay`, `isBefore`, `isAfter` — covering common date operations without `date-fns` or `dayjs`.

**Shared config packages**

- `@gregoiref/tsconfig` v1.0.0 — Strict TypeScript presets: base, node, dom, astro, nuxt.
- `@gregoiref/biome-config` v1.0.0 — Biome lint + format baseline for TypeScript projects.
- `@gregoiref/vitest-config` v1.0.0 — Vitest preset with 100% coverage threshold, node and jsdom environments.
- `@gregoiref/commitlint-config` v1.0.0 — Commitlint config with emoji support and 12 conventional types.
- `@gregoiref/cz-config` v1.0.0 — cz-git guided commit config with emoji, 12 types, and custom scopes.
- `@gregoiref/changeset-config` v1.0.0 — Changesets config factory: `createConfig(overrides?)` generates `.changeset/config.json` with `@changesets/changelog-github` and sensible monorepo defaults.
