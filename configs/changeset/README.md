# @gregoiref/changeset-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fchangeset-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Shared [Changesets](https://github.com/changesets/changesets) configuration factory for TypeScript monorepos.

## Why

Changesets' default config leaves `changelog` as a plain string with no PR links, and `access` unset (which breaks publish for scoped packages). Copying `.changeset/config.json` by hand across repos drifts over time. This factory provides a single opinionated baseline — `@changesets/changelog-github` for human-readable changelogs with PR links and contributor names, `access: "public"`, and sensible dependency update settings — overridable per project.

## Installation

```bash
pnpm add -D @gregoiref/changeset-config
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## Usage

Generate `.changeset/config.json` via a one-time script:

```js
// scripts/init-changesets.mjs
import { createConfig } from '@gregoiref/changeset-config';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('.changeset', { recursive: true });
writeFileSync(
  '.changeset/config.json',
  JSON.stringify(createConfig({ baseBranch: 'main' }), null, 2) + '\n'
);
```

```sh
node scripts/init-changesets.mjs
```

## Defaults

| Key | Default |
|---|---|
| `changelog` | `["@changesets/changelog-github", { "repo": "owner/repo" }]` |
| `commit` | `false` |
| `access` | `"public"` |
| `baseBranch` | `"main"` |
| `updateInternalDependencies` | `"patch"` |
| `ignore` | `[]` |

All defaults can be overridden by passing an object to `createConfig`.

## Limitations

- `@changesets/changelog-github` requires a `GITHUB_TOKEN` (or `GITHUB_TOKEN` secret in CI) with `repo` read access to resolve PR links and contributor names.
- The `repo` field in the changelog config must match the actual GitHub repo slug — pass it explicitly: `createConfig({ changelog: { repo: "owner/repo" } })`.
- This package does not install Changesets — add `@changesets/cli` separately.
