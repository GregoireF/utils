# @gregoiref/changeset-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fchangeset-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Shared [Changesets](https://github.com/changesets/changesets) configuration factory and changelog formatter for TypeScript monorepos.

## Why

Two problems solved in one package:

1. **Config drift** — `.changeset/config.json` copied across repos drifts. A factory function keeps the baseline in one place, overridable per project.
2. **CHANGELOG readability** — the default Changesets formatter outputs plain prose. The bundled changelog formatter adds emoji prefixes (🚀 major, ✨ minor, 🐛 patch) for instant visual scanning.

## Installation

```bash
pnpm add -D @gregoiref/changeset-config @changesets/cli
```

> Requires GitHub Packages. Add to `.npmrc`:
> ```ini
> @gregoiref:registry=https://npm.pkg.github.com
> ```

## Setup

### 1. Generate `.changeset/config.json`

Run once to create the config file:

```js
// scripts/init-changesets.mjs
import { createConfig } from '@gregoiref/changeset-config'
import { writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('.changeset', { recursive: true })
writeFileSync(
  '.changeset/config.json',
  JSON.stringify(createConfig({ repo: 'owner/repo' }), null, 2) + '\n'
)
```

```bash
node scripts/init-changesets.mjs
```

Or write `.changeset/config.json` directly:

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": ["@gregoiref/changeset-config/changelog", {}],
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### 2. Add Changesets workflow scripts

```json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version",
    "release": "changeset publish"
  }
}
```

## Changelog formatter

The `@gregoiref/changeset-config/changelog` export is a Changesets changelog formatter that prefixes each entry with an emoji based on the bump type:

| Bump type | Emoji | Meaning |
|---|---|---|
| `major` | 🚀 | Breaking change |
| `minor` | ✨ | New feature |
| `patch` | 🐛 | Bug fix / internal |

**Example CHANGELOG output:**

```markdown
## 1.2.0

### Minor Changes

- ✨ Add `retry` option to `createHttpClient` with exponential backoff

### Patch Changes

- 🐛 Fix `TimeoutError` not being caught when `AbortSignal` fires early
- 📦 Updated dependencies:
  - `@gregoiref/result@1.1.2`
```

## `createConfig` reference

```ts
createConfig(options?: {
  repo?: string                          // GitHub slug — e.g. "owner/repo"
  changelog?: string | [string, object]  // Override formatter
  baseBranch?: string                    // Default: "main"
  access?: "public" | "restricted"       // Default: "public"
  updateInternalDependencies?: "minor" | "patch"  // Default: "patch"
  ignore?: string[]                      // Packages to exclude from releases
  fixed?: string[]                       // Packages always versioned together
  linked?: string[]                      // Packages sharing a version range
}): ChangesetsConfig
```

## Workflow

See the [commit & release workflow](https://github.com/GregoireF/utils/wiki/Workflow-Commits) for the full picture: how commits feed into changesets, how changesets feed into CHANGELOG, and how the Changesets bot opens version PRs.

## Limitations

- The changelog formatter does not fetch PR links or contributor names (unlike `@changesets/changelog-github`). This avoids a `GITHUB_TOKEN` requirement and makes the formatter usable in any environment.
- This package does not install `@changesets/cli` — add it separately.
