# @GregoireF/utils

A TypeScript monorepo of zero-dependency utility libraries and shared configs, used across personal and professional projects. Built to demonstrate industrial-grade practices: strict types, 100% test coverage, automated versioning, and supply-chain security.

[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![CodeQL](https://github.com/GregoireF/utils/actions/workflows/codeql.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/GregoireF/utils/badge)](https://scorecard.dev/viewer/?uri=github.com/GregoireF/utils)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen?logo=renovatebot&logoColor=white)](https://renovateapp.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## Packages

### Utilities

| Package | Version | Coverage | Description |
|---|---|---|---|
| [`@gregoiref/result`](packages/result/) | [![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fresult%40*&label=&color=blue)](https://github.com/GregoireF/utils/tags) | [![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=result&label=cov&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags) | `Result<T, E>` discriminated union — type-safe error handling without exceptions |
| [`@gregoiref/ts-utils`](packages/ts-utils/) | [![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fts-utils%40*&label=&color=blue)](https://github.com/GregoireF/utils/tags) | [![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=ts-utils&label=cov&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags) | Advanced TypeScript generics: `deepMerge`, `pick`, `groupBy`, `memoize`, and more |
| [`@gregoiref/env-validator`](packages/env-validator/) | [![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fenv-validator%40*&label=&color=blue)](https://github.com/GregoireF/utils/tags) | [![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=env-validator&label=cov&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags) | Type-safe environment validation without Zod or dotenv |
| [`@gregoiref/http-client`](packages/http-client/) | [![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fhttp-client%40*&label=&color=blue)](https://github.com/GregoireF/utils/tags) | [![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=http-client&label=cov&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags) | Typed `fetch` wrapper with interceptors, timeout, and `Result`-based error handling |
| [`@gregoiref/logger`](packages/logger/) | [![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Flogger%40*&label=&color=blue)](https://github.com/GregoireF/utils/tags) | [![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=logger&label=cov&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags) | Structured JSON logger with pluggable transports |
| [`@gregoiref/date`](packages/date/) | [![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fdate%40*&label=&color=blue)](https://github.com/GregoireF/utils/tags) | [![coverage](https://img.shields.io/codecov/c/gh/GregoireF/utils?flag=date&label=cov&logo=codecov)](https://app.codecov.io/gh/GregoireF/utils/flags) | Date helpers (format, diff, add, clamp) without date-fns or Moment |

### Shared configs

| Package | Description |
|---|---|
| [`@gregoiref/tsconfig`](configs/tsconfig/) | Strict TypeScript configs — base, node, dom, astro, nuxt |
| [`@gregoiref/biome-config`](configs/biome/) | Biome lint + format for TypeScript projects |
| [`@gregoiref/vitest-config`](configs/vitest/) | Vitest setup with 100% coverage thresholds |
| [`@gregoiref/commitlint-config`](configs/commitlint/) | Commitlint config with emoji support |
| [`@gregoiref/cz-config`](configs/cz/) | cz-git config with 12 emoji types |

---

## Why not just use X?

| Alternative | Why this instead |
|---|---|
| `axios` | Wraps `fetch` with a 5 kB runtime dep; `@gregoiref/http-client` is a thin typed shell — the only runtime dep is `@gregoiref/result` from this same monorepo |
| `zod` | Brings 15 kB for runtime validation; `@gregoiref/env-validator` covers the env-only use case at zero cost |
| `neverthrow` | A fine library — this exists to stay in the monorepo and use no external deps |
| `date-fns` | Comprehensive but heavy; `@gregoiref/date` covers the 20% of operations that handle 80% of cases |

---

## Installation

Packages are published to **GitHub Packages** under the `@gregoiref` scope. Add the registry to your `.npmrc`:

```ini
@gregoiref:registry=https://npm.pkg.github.com
```

Then install any package:

```bash
pnpm add @gregoiref/result
pnpm add @gregoiref/ts-utils
pnpm add @gregoiref/http-client
```

---

## Development

```bash
git clone https://github.com/GregoireF/utils.git
cd utils
pnpm install

# Lint + typecheck + test across all packages
pnpm turbo run check

# Build all packages
pnpm turbo run build

# Run tests with coverage
pnpm turbo run test

# Interactive guided commit (Conventional Commits + emoji)
pnpm commit
```

---

## Stack

| Tool | Role |
|---|---|
| `pnpm` workspaces | Package manager — hoisted deps, workspace protocol |
| Turborepo | Task orchestration with remote cache and `dependsOn` graph |
| TypeScript | Strictest compiler flags (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) |
| Biome | Unified lint + format — replaces ESLint + Prettier |
| Vitest | Unit tests with v8 coverage, 100% threshold enforced |
| Changesets | Per-package semver versioning + automatic CHANGELOG |
| Renovate | Automated dependency updates with SHA pinning |
| CodeQL | Static security analysis (`security-extended` query suite) |
| OSSF Scorecard | Open-source security posture scoring |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Open an issue before writing significant code.  
For security vulnerabilities, see [SECURITY.md](.github/SECURITY.md) — do not open a public issue.

---

## Author

[@GregoireF](https://github.com/GregoireF)

---

## License

[MIT](./LICENSE)
