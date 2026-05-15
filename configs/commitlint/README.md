# @gregoiref/commitlint-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fcommitlint-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Shared [commitlint](https://commitlint.js.org) configuration with emoji support — enforces Conventional Commits across all projects.

## Why

Consistent commit history is not just aesthetic — it powers automatic `CHANGELOG.md` generation, `git log --oneline` readability, and tooling like Changesets. This config enforces the format at the `commit-msg` hook level so invalid commits are rejected before they reach the repository.

The emoji prefix is optional in the pattern (`✨ feat(scope): message` or `feat(scope): message` both pass) so the config works with or without an emoji CLI.

## Installation

```bash
pnpm add -D @gregoiref/commitlint-config @commitlint/cli @commitlint/config-conventional
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## Usage

```js
// commitlint.config.js (ESM)
export default { extends: ['@gregoiref/commitlint-config'] }
```

```js
// commitlint.config.cjs (CommonJS)
module.exports = { extends: ['@gregoiref/commitlint-config'] }
```

Hook it up with Husky:

```bash
echo "pnpm exec commitlint --edit \"\$1\"" > .husky/commit-msg
chmod +x .husky/commit-msg
```

## Rules

| Rule | Value |
|---|---|
| Extends | `@commitlint/config-conventional` |
| Header pattern | `[emoji] type(scope)[!]: subject` |
| Header max length | 120 characters |
| Body max line length | 200 characters |
| `subject-case` | disabled (emoji prefix changes expectations) |

### Allowed types

| Type | Description |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Format, no functional change |
| `refactor` | Refactor without fix or feat |
| `perf` | Performance improvement |
| `test` | Add or fix tests |
| `build` | Build system or dependencies |
| `ci` | CI/CD configuration |
| `chore` | Other changes outside src/test |
| `revert` | Revert a previous commit |
| `wip` | Work in progress |

## Pair with

Use with [`@gregoiref/cz-config`](../cz/) to get an interactive guided commit CLI that produces exactly the format this config expects.

```bash
pnpm add -D @gregoiref/commitlint-config @gregoiref/cz-config commitizen cz-git
```

## Limitations

- `wip` commits are allowed by this config. Enforce "no wip on main" via branch protection rules, not commitlint.
- The emoji prefix is matched as any non-whitespace prefix followed by a space — arbitrary strings could be prefixed. This is intentional for flexibility.
