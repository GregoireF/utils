# Contributing to @GregoireF/utils

This is primarily a personal showcase repository demonstrating industrial TypeScript practices. External contributions are welcome, but please understand that response times may vary and not every PR will be merged.

**Start with an issue** before writing significant code — to align on scope and avoid wasted effort.

---

## Requirements

- Node.js ≥ 22 (see `.nvmrc`)
- pnpm ≥ 9 (`npm install -g pnpm`)

---

## Setup

```bash
git clone https://github.com/GregoireF/utils.git
cd utils
pnpm install
```

---

## Development Workflow

```bash
# Run everything (lint + typecheck + tests) across all packages
pnpm turbo run check

# Run for a single package
pnpm --filter @gregoiref/result run check

# Build all packages
pnpm turbo run build

# Run tests in watch mode (one package)
pnpm --filter @gregoiref/ts-utils run test:watch

# Interactive guided commit
pnpm commit
```

---

## Code Standards

### Zero external dependencies on utility packages

Runtime dependencies in `packages/*` are forbidden. Use only TypeScript and the runtime's native APIs. This is the core philosophy — see `TRACKING.md` for the rationale.

### Strict TypeScript

All code must comply with the strictest compiler flags (see `configs/tsconfig/base.json`):
- `exactOptionalPropertyTypes`
- `noUncheckedIndexedAccess`
- `noPropertyAccessFromIndexSignature`

### Coverage ≥ 90%

All four coverage metrics (lines, functions, branches, statements) must stay above 90%. This is enforced by the Vitest threshold and will fail CI.

### JSDoc on all public APIs

Every exported function, class, type, and interface must have a `/** */` JSDoc block. Include `@param`, `@returns`, and `@throws` where relevant. One-liners are fine for simple symbols.

### No unnecessary comments

Comments explain *why*, not *what*. Self-documenting code is the goal — the JSDoc covers what. Add an inline comment only when the reasoning behind a non-obvious decision would surprise a future reader.

---

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) with optional emoji prefix. The `commit-msg` hook enforces this automatically.

```
✨ feat(result): add flatMap combinator
🐛 fix(http-client): handle empty response body on DELETE
📝 docs(ts-utils): add @param annotations to deepMerge
♻️  refactor(env-validator): extract parseBoolean to module scope
```

Use the interactive CLI to avoid mistakes:

```bash
pnpm commit
```

**Allowed types:** `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` `wip`

---

## Branching

| Branch | Purpose |
|---|---|
| `main` | Protected — always publishable |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation-only changes |
| `chore/<name>` | Tooling, dependencies, config |

---

## Adding a New Package

1. Create `packages/<name>/` with the standard structure:
   ```
   packages/<name>/
   ├── src/
   │   ├── index.ts
   │   ├── <name>.ts
   │   └── <name>.test.ts
   ├── package.json
   ├── tsconfig.json
   ├── tsconfig.build.json
   ├── vitest.config.ts
   └── README.md
   ```
2. Use an existing package as a template (e.g., `packages/result/`).
3. Add `devDependencies` referencing `@gregoiref/biome-config`, `@gregoiref/tsconfig`, `@gregoiref/vitest-config` with `workspace:*`.
4. Evaluate the package against the three IDEA.md criteria before opening a PR.

---

## Pull Request Checklist

Before opening a PR, verify:

- [ ] `pnpm turbo run check` passes with zero errors
- [ ] Coverage ≥ 90% (`pnpm turbo run test` shows coverage table)
- [ ] TypeScript strict-mode compliant (`pnpm turbo run typecheck`)
- [ ] JSDoc on all exported symbols
- [ ] README.md updated if the public API changed
- [ ] Changeset added for user-facing changes (see below)
- [ ] No external runtime dependencies introduced in `packages/*`

---

## Adding a Changeset

Any change visible to package consumers (new API, bug fix, breaking change) requires a changeset:

```bash
pnpm changeset
```

Follow the prompts to select affected packages, bump type (patch / minor / major), and write a one-line description. The generated file in `.changeset/` is committed alongside your code.

Changes that do NOT require a changeset: documentation-only, test-only, internal refactors with no public API impact.

---

## Security

See [SECURITY.md](.github/SECURITY.md) for the vulnerability reporting process.  
Do not open public GitHub issues for security vulnerabilities.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
