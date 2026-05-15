# @gregoiref/cz-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fcz-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Shared [cz-git](https://cz-git.qbb.sh) configuration with [Gitmoji](https://gitmoji.dev) — interactive guided commits for [Conventional Commits](https://www.conventionalcommits.org).

## Why

`git commit -m "fix stuff"` is the enemy of a clean changelog. This config provides a step-by-step interactive prompt that produces well-formed commits without memorising the convention — type, scope, description, body, breaking changes, all guided.

The emoji follows [Gitmoji](https://gitmoji.dev) conventions and makes `git log --oneline` scannable at a glance on GitHub.

## Installation

```bash
pnpm add -D @gregoiref/cz-config cz-git commitizen
```

> Requires GitHub Packages. Add to `.npmrc`:
> ```ini
> @gregoiref:registry=https://npm.pkg.github.com
> ```

## Setup

```js
// .czrc.cjs — override scopes for your project
const base = require('@gregoiref/cz-config')
module.exports = {
  ...base,
  scopes: [
    { value: 'api',  name: 'api:   API routes and handlers' },
    { value: 'ui',   name: 'ui:    Components and styling' },
    { value: 'db',   name: 'db:    Database models and migrations' },
    { value: 'auth', name: 'auth:  Authentication and authorization' },
    { value: 'ci',   name: 'ci:    GitHub Actions / pipelines' },
  ],
  // Enable footer for issue linking (disabled by default)
  skipQuestions: [],
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

Then run `pnpm commit` instead of `git commit`.

## Commit types

| Type | Emoji | Gitmoji | Description | CHANGELOG impact |
|---|---|---|---|---|
| `feat` | ✨ | `:sparkles:` | New user-facing feature | Minor bump |
| `fix` | 🐛 | `:bug:` | Bug fix | Patch bump |
| `docs` | 📝 | `:memo:` | Documentation only | No release |
| `style` | 💄 | `:lipstick:` | Formatting, no logic change | No release |
| `refactor` | ♻️ | `:recycle:` | Code restructure | No release |
| `perf` | ⚡️ | `:zap:` | Performance improvement | Patch bump |
| `test` | ✅ | `:white_check_mark:` | Add or fix tests | No release |
| `build` | 📦 | `:package:` | Build system / deps | No release |
| `ci` | 👷 | `:construction_worker:` | CI/CD configuration | No release |
| `chore` | 🔧 | `:wrench:` | Tooling, config, maintenance | No release |
| `security` | 🔒 | `:lock:` | Security fix or hardening | Patch bump |
| `revert` | ⏪ | `:rewind:` | Revert a previous commit | Patch bump |
| `wip` | 🚧 | `:construction:` | Work in progress | No release |

> CHANGELOG impact is handled by Changesets, not by commit type alone. Always write a changeset for `feat`, `fix`, `perf`, `security`, and `revert` changes.

## Breaking changes

Three types support breaking changes via `BREAKING CHANGE` footer: `feat`, `fix`, `refactor`.

The prompt will ask you to add `!` after the type and fill in a BREAKING CHANGE description:

```
✨ feat(auth)!: replace session tokens with JWTs

BREAKING CHANGE: cookie-based sessions are removed. Clients must send
Authorization: Bearer <token> in all requests.
```

This produces a **major version bump** in Changesets.

## Configuration defaults

| Option | Value | Notes |
|---|---|---|
| `useEmoji` | `true` | Prepends Gitmoji to header |
| `emojiAlign` | `left` | Emoji before type |
| `useAI` | `false` | No AI suggestions |
| `allowCustomScopes` | `true` | Custom scope input allowed |
| `allowBreakingChanges` | `['feat', 'fix', 'refactor']` | Types that can break API |
| `markBreakingChangeMode` | `true` | Adds `!` to header automatically |
| `skipQuestions` | `['footer']` | Issue linking hidden by default |
| `maxSubjectLength` | `50` | Subject line limit |
| `breaklineChar` | `\|` | Pipe for body line breaks |

## Pair with

Use [`@gregoiref/commitlint-config`](../commitlint/) to enforce the same rules at the `commit-msg` hook level — manual commits are also validated.

See the [commit & release workflow](https://github.com/GregoireF/utils/wiki/Workflow-Commits) for the full picture.

## Limitations

- Requires `cz-git >= 1.9.0`.
- Scope list is empty by default — define a `scopes` array in your `.czrc.cjs` for best UX.
- `wip` is intentionally allowed; block it on protected branches via branch protection rules, not here.
