# @GregoireF/utils

Monorepo de librairies utilitaires TypeScript — configs partagées, helpers typés et outils transverses utilisés à travers mes projets personnels (Astro, Nuxt, React).

Construit avec **pnpm workspaces** + **Turborepo** pour démontrer une approche industrielle du développement fullstack : qualité de code enforced, CI/CD automatisée, versioning sémantique par package et sécurité intégrée dès la base.

**Philosophie : zéro dépendance externe sur les packages utilitaires.** Chaque package est construit avec TypeScript pur ou les APIs natives du runtime.

[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions)
[![codecov](https://codecov.io/gh/GregoireF/utils/branch/main/graph/badge.svg)](https://codecov.io/gh/GregoireF/utils)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/GregoireF/utils/badge)](https://scorecard.dev/viewer/?uri=github.com/GregoireF/utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Structure

```
utils/
├── packages/                   ← librairies publiables (@gregoiref/*)
│   ├── result/                 ← @gregoiref/result
│   ├── ts-utils/               ← @gregoiref/ts-utils
│   ├── env-validator/          ← @gregoiref/env-validator
│   ├── http-client/            ← @gregoiref/http-client
│   ├── logger/                 ← @gregoiref/logger
│   └── date/                   ← @gregoiref/date
├── configs/                    ← configs partagées (toutes publiables)
│   ├── tsconfig/               ← @gregoiref/tsconfig
│   ├── biome/                  ← @gregoiref/biome-config
│   ├── vitest/                 ← @gregoiref/vitest-config
│   ├── commitlint/             ← @gregoiref/commitlint-config
│   └── cz/                     ← @gregoiref/cz-config
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              ← audit · lint · typecheck · test · coverage
│   │   ├── release.yml         ← changesets version PR + npm publish
│   │   ├── codeql.yml          ← analyse statique TypeScript
│   │   └── scorecard.yml       ← OSSF Scorecard
│   └── SECURITY.md
├── .changeset/                 ← changesets (versioning par package)
├── turbo.json
├── pnpm-workspace.yaml
├── renovate.json
├── CONTRIBUTING.md
├── TRACKING.md                 ← décisions techniques
└── IDEA.md                     ← backlog des packages
```

---

## Stack technique

| Outil | Rôle |
|---|---|
| `pnpm` | Package manager — workspaces, zéro duplication |
| `turborepo` | Orchestration des tâches monorepo avec cache |
| `typescript` | Typage strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) |
| `biome` | Linting + formatting unifié (remplace ESLint + Prettier) |
| `husky` | Git hooks — pre-commit, commit-msg, pre-push |
| `lint-staged` | Biome uniquement sur les fichiers modifiés |
| `commitlint` | Enforce Conventional Commits + emoji |
| `cz-git` | CLI guidée avec sélection de type et scope |
| `secretlint` | Détection de secrets avant chaque push |
| `vitest` | Tests unitaires avec coverage v8 (seuil 90%) |
| `changesets` | Versioning semver par package + CHANGELOG auto |
| `renovate` | Mises à jour de dépendances automatisées |
| **CodeQL** | Analyse statique de sécurité (`security-extended`) |
| **OSSF Scorecard** | Score de sécurité open source |

---

## Packages publiables

### Configs partagées

| Package | Statut | Description |
|---|---|---|
| `@gregoiref/tsconfig` | `[ prêt ]` | Configs TypeScript strictes — base, node, dom, astro, nuxt |
| `@gregoiref/biome-config` | `[ prêt ]` | Config Biome lint + format pour projets TypeScript |
| `@gregoiref/vitest-config` | `[ prêt ]` | Config Vitest avec seuil 90% — base (node) et dom |
| `@gregoiref/commitlint-config` | `[ publié ]` | Config commitlint avec support emoji |
| `@gregoiref/cz-config` | `[ publié ]` | Config cz-git avec 12 types emoji |

### Librairies utilitaires

| Package | Statut | Description |
|---|---|---|
| `@gregoiref/result` | `[ prêt ]` | Pattern `Result<T, E>` zero-dep — 100% coverage |
| `@gregoiref/ts-utils` | `[ prêt ]` | Génériques TypeScript avancés zero-dep — 100% coverage |
| `@gregoiref/env-validator` | `[ prêt ]` | Validation env type-safe sans Zod zero-dep — 99% coverage |
| `@gregoiref/http-client` | `[ prêt ]` | fetch wrapper typé, interceptors, timeout zero-dep — 96% coverage |
| `@gregoiref/logger` | `[ prêt ]` | Logger structuré JSON, transports pluggables zero-dep — 100% coverage |
| `@gregoiref/date` | `[ prêt ]` | Helpers date sans dépendance (format, diff, add, clamp) — 100% coverage |
| `@gregoiref/design-tokens` | `[ planifié ]` | Tokens CSS + TS + Tailwind |

---

## Démarrage rapide

```bash
git clone https://github.com/GregoireF/utils.git
cd utils
pnpm install

# Lint + typecheck + tests sur tous les packages
pnpm turbo run check

# Builder tous les packages
pnpm turbo run build
```

---

## Convention de commits

Les commits suivent [Conventional Commits](https://www.conventionalcommits.org/) avec emoji via la CLI guidée :

```bash
pnpm commit
```

Format : `✨ feat(ts-utils): add pick and omit helpers`

Les configs commitlint et cz-git sont publiées et réutilisables dans tes propres projets :

```bash
pnpm add -D @gregoiref/commitlint-config @gregoiref/cz-config
```

```js
// commitlint.config.js
export default { extends: ['@gregoiref/commitlint-config'] }

// .czrc.cjs
const base = require('@gregoiref/cz-config')
module.exports = { ...base, scopes: [/* tes scopes */] }
```

---

## Contribuer

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) — les PRs sont bienvenues, mais ouvre d'abord une issue.

Pour les vulnérabilités de sécurité, voir [SECURITY.md](.github/SECURITY.md).

---

## Auteur

[@GregoireF](https://github.com/GregoireF)

---

## Licence

MIT
