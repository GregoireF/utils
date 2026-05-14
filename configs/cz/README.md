# @gregoiref/cz-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fcz-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Shared [cz-git](https://cz-git.qbb.sh) configuration with emoji — interactive guided commits for Conventional Commits.

## Why

`git commit -m "fix stuff"` is the enemy of a clean changelog. This config provides a step-by-step interactive prompt that produces well-formed commits without memorising the convention — type, scope, description, body, breaking changes, all guided. The emoji is cosmetic but makes `git log --oneline` dramatically more scannable on GitHub.

## Installation

```bash
pnpm add -D @gregoiref/cz-config cz-git commitizen
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## Usage

```js
// .czrc.cjs — override scopes for your project
const base = require('@gregoiref/cz-config')
module.exports = {
  ...base,
  scopes: ['api', 'ui', 'db', 'infra'], // your package/module names
}
```

In `package.json`:

```json
{
  "config": {
    "commitizen": { "path": "node_modules/cz-git" }
  },
  "scripts": {
    "commit": "git-cz"
  }
}
```

Then run:

```bash
pnpm commit
# or: git-cz
```

## Commit Types

| Type | Emoji | Description |
|---|---|---|
| `feat` | ✨ | A new feature |
| `fix` | 🐛 | A bug fix |
| `docs` | 📝 | Documentation only |
| `style` | 💄 | Format, no functional change |
| `refactor` | ♻️ | Refactor without fix or feat |
| `perf` | ⚡️ | Performance improvement |
| `test` | ✅ | Add or fix tests |
| `build` | 📦 | Build system or dependencies |
| `ci` | 🎡 | CI/CD configuration |
| `chore` | 🔨 | Other changes outside src/test |
| `revert` | ⏪ | Revert a previous commit |
| `wip` | 🚧 | Work in progress |

## Configuration Defaults

| Option | Value |
|---|---|
| `useEmoji` | `true` |
| `emojiAlign` | `left` |
| `useAI` | `false` |
| `allowCustomScopes` | `true` |
| `allowBreakingChanges` | `['feat', 'fix']` |
| `skipQuestions` | `['footer']` |
| `breaklineChar` | `\|` (pipe) |
| `breaklineNumber` | 100 |
| `minSubjectLength` | 3 |

## Pair with

Use with [`@gregoiref/commitlint-config`](../commitlint/) to enforce the same rules at the `commit-msg` hook level, ensuring manual commits are also validated.

## Limitations

- Requires `cz-git >= 1.9.0` — earlier versions may not support all options.
- Custom scopes are allowed by default — no enforcement of a fixed scope list. Add a `scopes` array in your `.czrc.cjs` to restrict choices.
- AI commit message generation is disabled (`useAI: false`). Enable at your own discretion.
