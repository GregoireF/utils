# Architecture

Key decisions behind the `@gregoiref/utils` monorepo, with rationale.

> Sources: [pnpm workspaces](https://pnpm.io/workspaces), [Turborepo docs](https://turbo.build/repo/docs), [Biome](https://biomejs.dev/internals/architecture/), [Changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md), [OpenSSF Scorecard](https://securityscorecards.dev/)

---

## Monorepo structure

```
utils/
├── packages/          # Publishable utility packages
│   ├── result/
│   ├── http-client/
│   ├── logger/
│   ├── env-validator/
│   ├── ts-utils/
│   └── date/
├── configs/           # Publishable dev-tool configs
│   ├── tsconfig/
│   ├── biome/
│   ├── vitest/
│   ├── commitlint/
│   ├── cz/
│   └── changeset/
├── wiki/              # GitHub wiki sources (auto-synced)
├── docs/              # Extended guides
└── .changeset/        # Pending version bumps
```

**Why a monorepo?** The packages are small and interdependent — `http-client` depends on `result`, `logger` is shared by everything. A monorepo lets them reference each other via `workspace:*` without a publish-install cycle, and keeps CI, versioning, and tooling in one place.

---

## Tooling decisions

### pnpm

[pnpm](https://pnpm.io) over npm/yarn for:
- Symlink-based `node_modules` — no ghost dependencies (unlisted transitive deps cannot be imported)
- Built-in workspaces with filtering (`pnpm --filter @gregoiref/result run test`)
- Significantly faster installs via content-addressable store

### Turborepo

[Turborepo](https://turbo.build) orchestrates tasks across packages with:
- Dependency-aware task ordering (build dependencies before dependents)
- Local and remote caching — unchanged packages skip CI entirely
- Parallel execution within the dependency graph

### Biome

[Biome](https://biomejs.dev) replaces ESLint + Prettier as a single tool:
- One binary, zero config conflicts between linter and formatter
- Sub-millisecond lint on individual files — no performance penalty in the editor
- Opinionated defaults — less time spent bikeshedding rules

### Changesets

[Changesets](https://github.com/changesets/changesets) handles versioning and CHANGELOG generation:
- Each meaningful change gets a `.changeset/*.md` file describing the bump and summary
- The Changesets bot accumulates them and opens a "Version Packages" PR with all bumps and CHANGELOG entries
- Merging that PR triggers automated publish — no manual `npm publish`

The custom changelog formatter (`@gregoiref/changeset-config/changelog`) adds emoji prefixes (🚀/✨/🐛) to entries for scannable CHANGELOGs.

---

## Zero-dependency philosophy

Packages in `packages/*` have **no runtime dependencies** outside the monorepo itself (`workspace:*` deps allowed). Every external dependency is:
- A potential supply-chain attack vector
- A version conflict waiting to happen in the consumer's project
- A maintenance burden that outlives the original need

If something can be done cleanly in 50 lines of TypeScript using standard APIs, it lives here.

---

## 100% test coverage

All four Vitest coverage metrics (lines, functions, branches, statements) are enforced at 100% by the shared `@gregoiref/vitest-config`. CI fails below threshold.

The rationale: these are published utility packages. A missed branch in a validator or error handler is a silent bug in downstream apps. 100% coverage doesn't guarantee correctness, but it guarantees no dead code and no untested paths — especially important for the Result and error-handling patterns used throughout.

---

## Security CI pipeline (5 layers)

| Layer | Workflow | What it checks |
|---|---|---|
| 1 | `codeql.yml` | Static analysis — JavaScript/TypeScript (CodeQL) |
| 2 | `scorecard.yml` | [OpenSSF Scorecard](https://securityscorecards.dev/) — supply chain best practices |
| 3 | `dependency-review.yml` | New dependencies with known CVEs on every PR |
| 4 | `ci.yml` (audit step) | `pnpm audit --audit-level=high` on every push |
| 5 | `size.yml` | Bundle size budget — prevents accidental size regressions |

### Why OpenSSF Scorecard?

The [Scorecard](https://securityscorecards.dev/) runs weekly and scores the repo on 18 security practices (pinned dependencies, branch protection, SAST, signed releases, etc.). It's the closest thing to an automated security audit for open-source repositories, used by [CNCF](https://www.cncf.io/blog/2022/07/13/use-the-openssf-scorecard-to-reduce-open-source-security-risks/) as a baseline for hosted projects.

---

## What was deliberately left out

| Decision | Reason |
|---|---|
| No design tokens | Separate concern — belongs in a design-system repo |
| No React / UI packages | Utility-layer only; UI depends on framework runtime |
| No ORM / database layer | Too opinionated, not reusable across projects |
| No test doubles / mocks | Use real implementations; mocks mask integration bugs |
| No API client generation | Generated clients couple to a specific backend contract |
