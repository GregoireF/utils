# @gregoiref/changeset-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fchangeset-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Shared [Changesets](https://github.com/changesets/changesets) configuration factory for TypeScript monorepos.

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## Install

```sh
pnpm add -D @gregoiref/changeset-config
```

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
| `changelog` | `@changesets/cli/changelog` |
| `commit` | `false` |
| `access` | `"public"` |
| `baseBranch` | `"main"` |
| `updateInternalDependencies` | `"patch"` |
| `ignore` | `[]` |

All defaults can be overridden by passing an object to `createConfig`.
