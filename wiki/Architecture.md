# Architecture

Décisions structurelles du monorepo, ce qui a été retenu, ce qui a été rejeté, et pourquoi.

---

## Pourquoi un monorepo pour des utilitaires ?

Un repo par package = un overhead de maintenance qui explose vite : CI dupliquée, configs divergentes, versions de dépendances qui dérivent. Avec un monorepo, une seule source de vérité pour Biome, TypeScript, Vitest, les workflows CI et les configs Changesets. Les packages bénéficient tous de la même rigueur sans avoir à la réimplémenter.

Le modèle retenu — `packages/*` pour les librairies publiables, `configs/*` pour les configs partagées et publiables — vient directement de ce qu'on observe dans les monorepos industriels matures (Radix UI, shadcn/ui, TanStack).

## Stack

### pnpm + pnpm workspaces

Résolution déterministe, `node_modules` en liens symboliques (zéro duplication), `workspace:*` protocol pour les dépendances internes. Bun a été évalué et écarté : support Turborepo partiel en 2025, incompatibilités Nuxt et certains plugins Vite. À réévaluer fin 2026.

### Turborepo

Cache intelligent par package, pipeline déclaratif (`dependsOn`), intégration GitHub Actions native. Nx aurait été plus puissant mais sur-dimensionné pour un repo utilitaires personnel.

### Biome

Remplace ESLint + Prettier. Binaire Rust unique, 10–20x plus rapide sur les bases TypeScript courantes, zéro conflit lint/format. Quelques règles ESLint manquent encore — acceptable ici où les règles custom sont limitées.

### Changesets

Versioning sémantique par package indépendant. Chaque package a son propre `CHANGELOG.md` généré avec `@changesets/changelog-github` (liens PR + noms contributeurs). `release-it` a été écarté : version globale unique pour tous les packages, inadapté à un monorepo où chaque package évolue indépendamment.

Standard utilisé par shadcn/ui, Radix UI, TanStack — autant de raisons de pas réinventer.

---

## Philosophie zero-dep

Tous les packages utilitaires sont construits sans dépendances externes. Ce n'est pas du purisme — c'est un signal technique délibéré.

La décision vient d'un constat simple : la plupart des dépendances qu'on importe "par habitude" (axios, date-fns, zod pour l'env) couvrent des besoins qui tiennent en quelques dizaines de lignes de TypeScript strict. Les maintenir soi-même :

- Élimine les vulnérabilités transitives
- Force une vraie compréhension du domaine (arithmétique calendaire, parsing d'env, discriminated unions)
- Produit des bundles plus petits pour les consommateurs

L'exception documentée : `@gregoiref/http-client` dépend de `@gregoiref/result` au runtime — c'est une dépendance interne, pas externe.

---

## Sécurité CI

Five-layer security, gratuit sur les repos publics :

| Couche | Outil | Ce qu'il couvre |
|---|---|---|
| Dépendances | `pnpm audit` + Dependency Review | CVE sur les deps directes et transitives |
| Code statique | CodeQL (`security-extended`) | Injections, XSS, patterns dangereux |
| Posture globale | OSSF Scorecard | SHA pinning, permissions minimales, branch protection |
| Fuzzing | Jazzer.js (hebdomadaire) | Inputs non couverts par les tests unitaires |
| Secrets | Secretlint (pre-push hook) | Tokens et clés dans les commits |

**Note sur le score OSSF :** Un score de 7/10 en solo est le plafond structurel. Les métriques Code-Review et Branch-Protection exigent plusieurs reviewers — impossible en solo. L'OSSF le reconnaît explicitement dans sa documentation ([checks.md](https://github.com/ossf/scorecard/blob/main/docs/checks.md)). La vraie valeur du Scorecard est dans les pratiques qu'il force, pas dans le score lui-même.

---

## Coverage 100%

Seuil enforced en CI sur les 4 métriques (lines, functions, branches, statements). Démarré à 90%, relevé à 100% une fois que tous les packages ont atteint la couverture complète.

Ce seuil est pertinent ici parce que les packages sont des utilitaires purs sans I/O externe ni effets de bord. Sur une app avec des composants UI ou du réseau, 80–85% est un objectif plus réaliste.

---

## Ce qui a été rejeté

| Sujet | Rejeté | Retenu | Raison |
|---|---|---|---|
| Package manager | Bun | pnpm | Monorepo multi-framework, incompatibilités Nuxt en 2025 |
| Linting | ESLint + Prettier | Biome | Perf, config unifiée, zéro conflit |
| Versioning | `release-it` | Changesets | Version globale inadaptée à un monorepo multi-packages |
| Changelog | Format Changesets par défaut | `@changesets/changelog-github` | Pas de lien PR ni nom de contributeur dans le format par défaut |
| Validation env | Zod | `@gregoiref/env-validator` | 15 kB runtime pour valider 10 variables d'env — excessif |
| HTTP | Axios | `@gregoiref/http-client` | Axios ship son propre HTTP layer, pas un wrapper `fetch` |
| Dates | `date-fns` | `@gregoiref/date` | Couvre 80% des cas, aucune dépendance |
| Fuzzing | Snyk | Jazzer.js + `pnpm audit` | Compte externe requis, même périmètre couvert gratuitement |
| Orchestration | Nx | Turborepo | Sur-dimensionné pour un repo utils personnel |
