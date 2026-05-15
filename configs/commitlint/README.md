# @gregoiref/commitlint-config

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fcommitlint-config%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Shared [commitlint](https://commitlint.js.org) configuration — enforces [Conventional Commits](https://www.conventionalcommits.org) with optional emoji prefix support.

## Why

Consistent commit history powers automatic CHANGELOG generation, clear `git log --oneline` output, and reliable Changesets versioning. This config enforces the format at the `commit-msg` hook so invalid commits are caught before they reach the repository.

The emoji prefix is **optional** in the pattern — both `✨ feat(scope): message` and `feat(scope): message` pass — so the config works with or without a cz-git prompt.

## Installation

```bash
pnpm add -D @gregoiref/commitlint-config @commitlint/cli @commitlint/config-conventional
```

> Requires GitHub Packages. Add to `.npmrc`:
> ```ini
> @gregoiref:registry=https://npm.pkg.github.com
> ```

## Setup

```js
// commitlint.config.cjs
module.exports = { extends: ['@gregoiref/commitlint-config'] }
```

Hook it up with Husky:

```bash
pnpm add -D husky
pnpm exec husky init
echo 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
```

Or with [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks):

```json
{
  "simple-git-hooks": {
    "commit-msg": "pnpm exec commitlint --edit $1"
  }
}
```

## Commit format

```
[emoji] type(scope)[!]: subject   ← header (max 100 chars)
                                  ← blank line
Body lines, max 100 chars each.   ← optional
                                  ← blank line
BREAKING CHANGE: description      ← footer (max 100 chars per line)
close #123
```

**Valid examples:**

```
✨ feat(http-client): add retry with exponential backoff
🐛 fix(logger): prevent duplicate timestamp in structured output
📝 docs: add getting-started guide for Nuxt integration
♻️ refactor(result): simplify isOk type guard inference
✨ feat(auth)!: replace session tokens with JWTs
```

**The `!` notation** (breaking change) is also valid:

```
feat(auth)!: replace session tokens with JWTs

BREAKING CHANGE: cookie-based sessions removed. Send Authorization: Bearer <token>.
```

## Rules

| Rule | Level | Value | Why |
|---|---|---|---|
| `header-max-length` | error | 100 | Angular style guide; GitHub renders 72–100 cleanly |
| `body-max-line-length` | error | 100 | Terminal-friendly, matches conventional default |
| `footer-max-line-length` | error | 100 | Consistent with body |
| `subject-case` | disabled | — | Emoji prefix breaks uppercase detection |
| `body-leading-blank` | warning | always | Git convention: blank line before body |
| `footer-leading-blank` | warning | always | Required for `BREAKING CHANGE` parsing |
| `type-case` | error | lower-case | Inherited from config-conventional |
| `type-empty` | error | never | Inherited from config-conventional |
| `subject-empty` | error | never | Inherited from config-conventional |
| `subject-full-stop` | error | never `.` | Inherited from config-conventional |

## Allowed types

| Type | Emoji | Triggers release |
|---|---|---|
| `feat` | ✨ | Yes — minor |
| `fix` | 🐛 | Yes — patch |
| `perf` | ⚡️ | Yes — patch |
| `security` | 🔒 | Yes — patch |
| `revert` | ⏪ | Yes — patch |
| `docs` | 📝 | No |
| `style` | 💄 | No |
| `refactor` | ♻️ | No |
| `test` | ✅ | No |
| `build` | 📦 | No |
| `ci` | 👷 | No |
| `chore` | 🔧 | No |
| `wip` | 🚧 | No |

> "Triggers release" means you should write a Changeset — commitlint does not enforce this.

## Pair with

Use [`@gregoiref/cz-config`](../cz/) to get a guided commit CLI that produces exactly the format this config validates. The two configs share the same type list and emoji set.

See the [commit & release workflow](https://github.com/GregoireF/utils/wiki/Workflow-Commits) for the full picture.

## Limitations

- `wip` is allowed — block it on protected branches via branch protection, not here.
- Emoji is matched as "any non-whitespace sequence followed by a space" — arbitrary prefixes technically pass. This is intentional to avoid false positives with different emoji encodings.
