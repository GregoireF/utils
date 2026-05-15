# TRACKING.md — Suivi technique du monorepo

> Historique vivant des décisions d'architecture, avancement par phase et points de vigilance.
> Mis à jour à chaque étape significative.

---

## Décisions structurelles

### Package manager — pnpm retenu

- **Décision :** pnpm v9 + pnpm workspaces
- **Raison :** Support natif Turborepo, résolution déterministe, node_modules en lien symlink (zéro duplication), compatibilité totale Astro / Nuxt / React.
- **Alternative écartée :** Bun — trop immature pour un monorepo multi-framework en 2025. Support Turborepo partiel, incompatibilités Nuxt et certains plugins Vite. À réévaluer en 2026.

### Orchestration — Turborepo retenu

- **Décision :** Turborepo pour l'orchestration des tâches (build, lint, test, typecheck, check)
- **Raison :** Cache intelligent par package, pipeline déclaratif dans `turbo.json`, intégration GitHub Actions native.
- **Alternative écartée :** Nx — plus puissant mais sur-dimensionné pour un repo utils perso.

### Linting & formatting — Biome retenu

- **Décision :** Biome remplace ESLint + Prettier
- **Raison :** Binaire Rust unique, 10–20x plus rapide, config centralisée dans `configs/biome`. Zéro conflit lint/format.
- **Risque connu :** Certaines règles ESLint manquantes. Acceptable pour un monorepo utils où les règles custom sont limitées.

### Structure — Monorepo utils pur

- **Décision :** `packages/*` (librairies publiables) + `configs/*` (configs internes + configs publiables)
- **Raison :** Une seule source de vérité pour les configs TS, Biome, Vitest, commitlint et cz. Extensible vers des apps démo ultérieurement sans restructuration.
- **Alternative écartée :** Un repo par techno — overhead de maintenance trop élevé, pas de config partagée.

### Release — Changesets retenu

- **Décision :** `@changesets/cli` remplace `release-it`
- **Raison :** Versioning sémantique par package indépendant. Chaque package a son propre CHANGELOG.md et sa propre version semver. Scalable pour un monorepo multi-packages. Standard industrie (shadcn/ui, radix-ui, etc.).
- **Alternative écartée :** `release-it` — version globale unique pour tous les packages, non adapté à un monorepo où chaque package évolue indépendamment.
- **Workflow :** PR "Version Packages" auto-générée par `changesets/action` sur chaque push vers `main`. Merge de la PR = publish vers GitHub Packages.

### Changelog — @changesets/changelog-github retenu

- **Décision :** `@changesets/changelog-github` pour la génération des CHANGELOG
- **Raison :** Entrées lisibles avec lien PR et nom du contributeur (`Thanks @GregoireF! — …`). Standard pour les monorepos open-source.
- **Alternative écartée :** Format par défaut Changesets — entrées trop minimalistes, pas de lien vers les PRs.

### Commits — Conventional Commits + emoji

- **Décision :** `commitizen` + `cz-git` (adapter) + `commitlint` + hooks Husky
- **Format :** `✨ feat(scope): description`
- **Configs publiables :** `@gregoiref/commitlint-config` + `@gregoiref/cz-config` — utilisables dans d'autres projets.
- **Raison :** Emoji visibles sur GitHub, format machine-lisible (Changesets + CHANGELOG), hooks enforced.

### Sécurité CI — Five-layer security

- **Décision :** `pnpm audit` + CodeQL + OSSF Scorecard + Jazzer.js + Dependency Review
- **Raison :** Gratuit pour repos publics, couvre tous les vecteurs principaux. Secretlint couvre les secrets en pre-push.
- **Alternative écartée :** Snyk — dépendance externe et compte tiers. pnpm audit + Dependency Review couvrent le même périmètre.

### Philosophie dépendances — Zero-dep par défaut

- **Décision :** Tous les packages utilitaires sont construits sans dépendances externes.
- **Raison :** Signal technique fort (maîtrise du langage), bundle size zéro, aucune vulnérabilité transitive.
- **Application :** `@gregoiref/ts-utils` (pure TS), `@gregoiref/result` (pure TS), `@gregoiref/env-validator` (validation maison type-safe), `@gregoiref/http-client` (fetch natif), `@gregoiref/logger` (console structurée), `@gregoiref/date` (Intl natif).

### Coverage — 100% enforced

- **Décision :** Seuil de 100% (lines, functions, branches, statements) déclenche un échec CI.
- **Raison :** Standard élevé mais atteignable sur des packages utils purs sans I/O externe. Élimine toute régression silencieuse.
- **Provider :** `@vitest/coverage-v8` — pas de dep supplémentaire (bundlé avec vitest).
- **Historique :** Démarré à 90%, relevé à 100% après que tous les packages ont atteint la couverture complète.

### Fuzzing — Jazzer.js retenu

- **Décision :** Jazzer.js (`@jazzer.js/core`) pour le fuzzing coverage-guided, exécuté en CI hebdomadaire.
- **Raison :** Seul fuzzeur JavaScript compatible OSSF Scorecard. Détecte les inputs non couverts par les tests unitaires (dépassements, pollution de prototype, edge cases d'encoding).
- **Cibles :** `result`, `env-validator`, `ts-utils` — les trois packages qui traitent des inputs arbitraires.

---

## Avancement par phase

### Phase 1 — Fondations qualité ✅

- [x] Initialisation pnpm workspace (`pnpm-workspace.yaml`)
- [x] Config Turborepo (`turbo.json` — pipelines build / lint / test / typecheck / check)
- [x] Package `configs/tsconfig` → `@gregoiref/tsconfig` (publiable)
- [x] Package `configs/biome` → `@gregoiref/biome-config` (publiable)
- [x] Package `configs/commitlint` → `@gregoiref/commitlint-config` (publiable)
- [x] Package `configs/cz` → `@gregoiref/cz-config` (publiable)
- [x] Package `configs/changeset` → `@gregoiref/changeset-config` (publiable)
- [x] Setup Husky + lint-staged (pre-commit)
- [x] Setup Commitlint + cz-git avec emoji (commit-msg hook)
- [x] Setup Secretlint (pre-push hook)
- [x] `.gitignore`, `.nvmrc`, `LICENSE`, `.cspell.json`, `.editorconfig`, `.gitattributes`, `.npmrc`

### Phase 2 — CI/CD & automatisation ✅

- [x] Package `configs/vitest` → `@gregoiref/vitest-config` (publiable)
- [x] `ci.yml` — audit + lint + typecheck + test + upload coverage par flag Codecov
- [x] `release.yml` — Changesets version PR + publish GitHub Packages avec provenance NPM
- [x] `codeql.yml` — analyse statique TypeScript (`security-extended`) + schedule hebdomadaire
- [x] `scorecard.yml` — OSSF Scorecard (score actuel : 7.0/10)
- [x] `pr-title.yml` — Lint commitlint du titre de PR (injection script sécurisée via env var)
- [x] `auto-approve.yml` — Approbation automatique post-CI + auto-merge Renovate
- [x] `size.yml` — Budget bundle size via size-limit, commentaire sur chaque PR
- [x] `weekly-compat.yml` — CI hebdomadaire avec `--latest` deps (ouvre une issue si échec)
- [x] `fuzz.yml` — Fuzzing Jazzer.js hebdomadaire (lundi 7:00 UTC, 3 targets × 60s)
- [x] `nightly.yml` — Publication canary quotidienne (3:00 UTC, tag `canary`, avec provenance)
- [x] `dependency-review.yml` — Bloque les CVEs high-severity et licences GPL/AGPL sur les PRs
- [x] Setup Changesets + Renovate Bot (`renovate.json`)
- [x] `SECURITY.md`, `CONTRIBUTING.md`, PR template, issue templates

### Phase 3 — Packages utilitaires core ✅

- [x] `@gregoiref/result` — Pattern `Result<T, E>` (zero-dep) — 100% coverage, JSDoc, README
- [x] `@gregoiref/ts-utils` — Génériques TypeScript avancés (zero-dep) — 100% coverage, JSDoc, README
- [x] `@gregoiref/env-validator` — Validation env type-safe sans Zod (zero-dep) — 100% coverage, JSDoc, README

### Phase 4 — Packages avancés ✅

- [x] `@gregoiref/http-client` — fetch wrapper typé, interceptors, timeout — 100% coverage, JSDoc, README
- [x] `@gregoiref/logger` — logger structuré JSON, transports pluggables — 100% coverage, JSDoc, README
- [x] `@gregoiref/date` — helpers date sans dépendance, format/diff/add/clamp — 100% coverage, JSDoc, README

### Phase 4b — Documentation & homogénéité ✅

- [x] JSDoc exhaustif sur toutes les APIs publiques
- [x] README complet par package — badges, motivation, API, exemples, limitations
- [x] Badges uniformisés : version (GitHub tags), CI, coverage (Codecov shields.io par flag), license, zero-deps, TypeScript strict, Node ≥22
- [x] Root README : CI, CodeQL, OpenSSF Scorecard, Renovate, License + table packages complète
- [x] `CONTRIBUTING.md`, `SECURITY.md`, PR template, issue templates à jour
- [x] TRACKING.md, IDEA.md à jour

### Phase 5 — Publication & supply-chain ✅

- [x] Publication 1.0.0 sur GitHub Packages (12 packages : 6 utils + 6 configs)
- [x] Tags git `@gregoiref/<package>@1.0.0` créés pour chaque package
- [x] Changelogs générés avec `@changesets/changelog-github` (liens PR + noms contributeurs)
- [x] Scorecard Dangerous-Workflow corrigé (injection script → env var)
- [x] Scorecard Token-Permissions corrigé (permissions job-level uniquement)
- [x] Alertes code-scanning #22 (Code-Review) et #39 (SAST) dismissées avec justification
- [x] Dependency Graph + Dependabot activés sur le repo
- [x] Fuzz targets opérationnels (`fuzz/result.fuzz.js`, `fuzz/ts-utils.fuzz.js`, `fuzz/env-validator.fuzz.js`)
- [x] `.size-limit.json` configuré (budgets : result/logger/env-validator ≤5 kB, ts-utils/date/http-client ≤10 kB)

### Phase 6 — Design system (à venir)

- [ ] `@gregoiref/design-tokens` — CSS vars + TS + Tailwind + UnoCSS

---

## Points de vigilance

| Sujet | Risque | Mitigation |
|---|---|---|
| Bun | Immature pour monorepo multi-framework | Rester sur pnpm, réévaluer fin 2026 |
| Biome | Règles manquantes vs ESLint | Acceptable, surveiller les releases |
| Turborepo cache | Cache distant payant chez Vercel | Cache local pour l'instant |
| OSSF Code-Review | Métrique temporelle — 2/10 actuellement | Auto-approve actif sur chaque PR ; monte organiquement |
| OSSF SAST | 8/10 plafonné — commits bot non analysés | Limitation GitHub anti-loop ; pas de correctif sans deploy key |
| GitHub Packages | Authentification GitHub requise pour install | Documenter `.npmrc` dans chaque README et Installation |
| Canary dist-tag | Risque d'install involontaire en prod | Documenter le dist-tag `canary` explicitement |
| Jazzer.js OSSF | Détecté uniquement via CI (pas en local) | `fuzz.yml` actif — détection Scorecard correcte |

---

## Changelog décisionnel

| Date | Décision |
|---|---|
| 2025-05 | Choix stack initiale : pnpm + Turborepo + Biome + Husky |
| 2025-05 | Structure monorepo utils pur retenue (pas de repo par techno) |
| 2025-05 | Bun écarté — réévaluation prévue fin 2026 |
| 2026-05 | `release-it` remplacé par Changesets — versioning par package |
| 2026-05 | commitlint-config + cz-config + changeset-config extraits en packages publiables |
| 2026-05 | Philosophie zero-dep adoptée pour tous les packages utilitaires |
| 2026-05 | Coverage relevé de 90% à 100% — enforced CI |
| 2026-05 | Stack sécurité renforcée : pnpm audit + CodeQL + OSSF Scorecard + Jazzer.js + Dependency Review |
| 2026-05 | Phases 3 + 4 complétées — 6 packages utilitaires publiés à 100% coverage |
| 2026-05 | Configs renommées `@gregoiref/` (biome-config, tsconfig, vitest-config) — publiables |
| 2026-05 | JSDoc exhaustif + section separators sur tous les fichiers source |
| 2026-05 | Publication 1.0.0 sur GitHub Packages — 12 packages |
| 2026-05 | `@changesets/changelog-github` adopté — changelogs avec liens PR et noms contributeurs |
| 2026-05 | 7 nouveaux workflows CI (pr-title, auto-approve, size, weekly-compat, fuzz, nightly, dependency-review) |
| 2026-05 | Scorecard : score 7.0/10 — régressions Dangerous-Workflow + Token-Permissions corrigées |
| 2026-05 | Badges uniformisés : shields.io Codecov par flag, TypeScript strict, Node ≥22 |
| 2026-05 | Dependency Graph + Dependabot activés ; alertes #22 et #39 dismissées |
