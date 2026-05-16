# @gregoiref/utils — Wiki

Zero-dependency TypeScript utilities for Node.js, Cloudflare Workers, and modern JS runtimes.

---

## Pages

| Page | Description |
|---|---|
| [Architecture](Architecture) | Monorepo decisions, tooling, security layers, philosophy |
| [Workflow: Commits & Releases](Workflow-Commits) | Full commit → changeset → PR → publish workflow |
| [Integration: Astro](Integration-Astro) | Patterns for Astro API routes |
| [Integration: Nuxt 3](Integration-Nuxt) | Patterns for Nuxt 3 server routes |
| [Integration: Node.js / Hono](Integration-Node) | Full Hono app bootstrap |

---

## Quick install

```ini
# .npmrc
@gregoiref:registry=https://npm.pkg.github.com
```

```bash
pnpm add @gregoiref/result
pnpm add @gregoiref/crypto
pnpm add @gregoiref/http-client
pnpm add @gregoiref/logger
pnpm add @gregoiref/env-validator
pnpm add @gregoiref/ts-utils
pnpm add @gregoiref/date
```

---

## Packages

| Package | Description |
|---|---|
| [`@gregoiref/result`](https://github.com/GregoireF/utils/tree/main/packages/result) | Typed `Result<T, E>` — no-throw error handling |
| [`@gregoiref/crypto`](https://github.com/GregoireF/utils/tree/main/packages/crypto) | Web Crypto API — hashing, HMAC, AES-GCM, PBKDF2, random |
| [`@gregoiref/http-client`](https://github.com/GregoireF/utils/tree/main/packages/http-client) | Fetch wrapper returning `Result` — no try/catch |
| [`@gregoiref/logger`](https://github.com/GregoireF/utils/tree/main/packages/logger) | Structured JSON logger with child context |
| [`@gregoiref/env-validator`](https://github.com/GregoireF/utils/tree/main/packages/env-validator) | Runtime env validation with types — fail fast at startup |
| [`@gregoiref/ts-utils`](https://github.com/GregoireF/utils/tree/main/packages/ts-utils) | General TypeScript utilities |
| [`@gregoiref/date`](https://github.com/GregoireF/utils/tree/main/packages/date) | Lightweight date formatting and comparison |

---

## Dev configs

| Package | Description |
|---|---|
| [`@gregoiref/cz-config`](https://github.com/GregoireF/utils/tree/main/configs/cz) | Commitizen (cz-git) config with Gitmoji |
| [`@gregoiref/commitlint-config`](https://github.com/GregoireF/utils/tree/main/configs/commitlint) | commitlint config — Conventional Commits + emoji |
| [`@gregoiref/changeset-config`](https://github.com/GregoireF/utils/tree/main/configs/changeset) | Changesets factory + emoji changelog formatter |

---

## Source

[github.com/GregoireF/utils](https://github.com/GregoireF/utils) — MIT license
