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

- **Décision :** Turborepo pour l'orchestration des tâches (build, lint, test, typecheck)
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
- **Workflow :** PR "Version Packages" auto-générée par `changesets/action` sur chaque push vers `main`. Merge de la PR = publish npm.

### Commits — Conventional Commits + emoji

- **Décision :** `commitizen` + `cz-git` (adapter) + `commitlint` + hooks Husky
- **Format :** `✨ feat(scope): description`
- **Configs publiables :** `@gregoiref/commitlint-config` + `@gregoiref/cz-config` — utilisables dans d'autres projets via npm.
- **Raison :** Emoji visibles sur GitHub, format machine-lisible (Changesets + CHANGELOG), hooks enforced.

### Sécurité CI — Three-layer security

- **Décision :** `pnpm audit` (deps) + CodeQL (code statique) + OSSF Scorecard (posture globale)
- **Raison :** Gratuit pour repos publics, couvre les trois vecteurs principaux. Secretlint couvre les secrets en pre-push.
- **Alternative écartée :** Snyk — ajoute une dépendance externe et un compte tiers. pnpm audit couvre le même périmètre gratuitement.

### Philosophie dépendances — Zero-dep par défaut

- **Décision :** Tous les packages utilitaires sont construits sans dépendances externes.
- **Raison :** Signal technique fort (maîtrise du langage), bundle size zéro, aucune vulnérabilité transitive.
- **Application :** `@gregoiref/ts-utils` (pure TS), `@gregoiref/result` (pure TS), `@gregoiref/env-validator` (Zod écarté — validation maison type-safe), `@gregoiref/http-client` (fetch natif), `@gregoiref/logger` (console structurée), `@gregoiref/date` (Intl natif).

### Coverage — 90% minimum enforced

- **Décision :** Seuil de 90% (lines, functions, branches, statements) déclenche un échec CI.
- **Raison :** Standard élevé mais atteignable sur des packages utils purs sans I/O externe.
- **Provider :** `@vitest/coverage-v8` — pas de dep supplémentaire (bundlé avec vitest).

---

## Avancement par phase

### Phase 1 — Fondations qualité ✅

- [x] Initialisation pnpm workspace (`pnpm-workspace.yaml`)
- [x] Config Turborepo (`turbo.json` — pipelines build / lint / test / typecheck)
- [x] Package `configs/tsconfig` — base strict + node + dom + astro + nuxt
- [x] Package `configs/biome` — règles partagées lint + format
- [x] Package `configs/commitlint` → `@gregoiref/commitlint-config` (publiable)
- [x] Package `configs/cz` → `@gregoiref/cz-config` (publiable)
- [x] Setup Husky + lint-staged (pre-commit)
- [x] Setup Commitlint + cz-git avec emoji (commit-msg hook)
- [x] Setup Secretlint (pre-push hook)
- [x] `.gitignore`, `.nvmrc`, `LICENSE`, `.cspell.json`

### Phase 2 — CI/CD & automatisation ✅

- [x] Package `configs/vitest` — factory zéro-dep (createBaseConfig / createDomConfig)
- [x] GitHub Actions — workflow `ci.yml` (audit + lint + typecheck + test + coverage)
- [x] GitHub Actions — workflow `release.yml` (changesets version PR + npm publish)
- [x] GitHub Actions — workflow `codeql.yml` (analyse statique TypeScript)
- [x] GitHub Actions — workflow `scorecard.yml` (OSSF Scorecard)
- [x] Setup Changesets (`@changesets/cli` + `.changeset/config.json`)
- [x] Setup Renovate Bot (`renovate.json`)
- [x] `SECURITY.md`

### Phase 3 — Packages utilitaires core ✅

> Voir [IDEA.md](./IDEA.md) pour le backlog complet.

- [x] `@gregoiref/result` — Pattern `Result<T, E>` (zero-dep) — 100% coverage, JSDoc, README
- [x] `@gregoiref/ts-utils` — Génériques TypeScript avancés (zero-dep) — 100% coverage, JSDoc, README
- [x] `@gregoiref/env-validator` — Validation env type-safe sans Zod (zero-dep) — 99% coverage, JSDoc, README

### Phase 4 — Packages avancés ✅

- [x] `@gregoiref/http-client` — fetch wrapper typé, interceptors, timeout (zero-dep) — 96% coverage, JSDoc, README
- [x] `@gregoiref/logger` — logger structuré JSON, transports pluggables (zero-dep) — 100% coverage, JSDoc, README
- [x] `@gregoiref/date` — helpers date sans dépendance, format/diff/add/clamp (zero-dep) — 100% coverage, JSDoc, README

### Phase 4b — Documentation & homogénéité ✅

- [x] JSDoc exhaustif sur toutes les APIs publiques (10 fichiers source)
- [x] Section separators + commentaires "pourquoi" dans tous les fichiers source
- [x] README complet par package (9 READMEs : 6 packages + 3 configs)
- [x] Configs renommées scope `@gregoiref/` (biome-config, tsconfig, vitest-config — publiables)
- [x] `CONTRIBUTING.md`, `.editorconfig`, `.gitattributes`, `.npmrc`, `SECURITY.md` complets
- [x] `turbo.json` outputs typecheck corrigés (suppression warnings CI)
- [x] `pnpm audit --audit-level=moderate` (renforcé depuis `high`)

### Phase 5 — Design system & publication

- [ ] `@gregoiref/design-tokens` — CSS vars + TS + Tailwind + UnoCSS
- [ ] npm publish scope `@gregoiref` (org à créer si pas déjà fait)
- [ ] Premier commit + tag git baseline
- [ ] Publication npm des 9 packages prêts via Changesets

---

## Points de vigilance

| Sujet | Risque | Mitigation |
|---|---|---|
| Bun | Immature pour monorepo multi-framework | Rester sur pnpm, réévaluer fin 2025 |
| Biome | Règles manquantes vs ESLint | Acceptable, surveiller les releases |
| Turborepo cache | Cache distant payant chez Vercel | Cache local pour l'instant |
| npm publish | Scope `@gregoiref` à revendiquer | Créer le compte npm org avant la phase 5 |
| Renovate | PRs automatiques trop fréquentes | Schedule lundi matin, prConcurrentLimit=5 |
| Codecov | Token secret requis | `fail_ci_if_error: false` — non bloquant |
| OSSF Scorecard | Repo doit être public | OK — objectif GitHub public |

---

## Changelog décisionnel

| Date | Décision |
|---|---|
| 2025-05 | Choix stack initiale : pnpm + Turborepo + Biome + Husky |
| 2025-05 | Structure monorepo utils pur retenue (pas de repo par techno) |
| 2025-05 | Bun écarté — réévaluation prévue fin 2025 |
| 2026-05 | `release-it` remplacé par Changesets — versioning par package |
| 2026-05 | commitlint-config + cz-config extraits en packages publiables |
| 2026-05 | Philosophie zero-dep adoptée pour tous les packages utilitaires |
| 2026-05 | Coverage 90% minimum enforced en CI |
| 2026-05 | Stack sécurité : pnpm audit + CodeQL + OSSF Scorecard |
| 2026-05 | Phases 3 + 4 complétées — 6 packages utilitaires prêts |
| 2026-05 | Configs renommées `@gregoiref/` (biome-config, tsconfig, vitest-config) — publiables |
| 2026-05 | `pnpm audit --audit-level=moderate` (renforcé depuis `high`) |
| 2026-05 | JSDoc exhaustif + section separators + "pourquoi" sur tous les fichiers source |
| 2026-05 | 9 READMEs complets (badges, motivation, API, exemples, limitations) |
| 2026-05 | Ajout `.editorconfig`, `.gitattributes`, `.npmrc`, `CONTRIBUTING.md` |
