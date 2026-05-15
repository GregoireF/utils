# IDEA.md — Backlog des packages

> Ce fichier sert de backlog vivant. Chaque idée est évaluée selon trois critères :
> **Utilité réelle** (est-ce que je l'utiliserais dans mes projets ?),
> **Signal technique** (est-ce que ça démontre une vraie compétence ?),
> **Complexité** (est-ce faisable proprement en autonomie ?).

---

## Légende

| Statut | Signification |
|---|---|
| `[ idée ]` | Concept brut, pas encore évalué |
| `[ validé ]` | Décision prise, pas encore démarré |
| `[ en cours ]` | Développement actif |
| `[ prêt ]` | Implémenté, testé, documenté — prêt pour publication |
| `[ publié ]` | Disponible sur GitHub Packages |
| `[ écarté ]` | Raison documentée |

---

## Configs partagées

Ces packages sont les fondations du monorepo. Tous sont dans le scope `@gregoiref/` et publiés sur GitHub Packages.

### `@gregoiref/tsconfig` `[ publié ]`

Config TypeScript stricte déclinée en plusieurs presets :

- `base.json` — strict, ES2022, moduleResolution bundler, exactOptionalPropertyTypes, noUncheckedIndexedAccess
- `node.json` — étend base, types Node
- `dom.json` — étend base, types DOM
- `astro.json` — étend base, compatible Astro
- `nuxt.json` — étend base, compatible Nuxt

---

### `@gregoiref/biome-config` `[ publié ]`

Config Biome centralisée, consommée par tous les packages via `"extends"`.

- Règles lint Biome recommandées + overrides maison (unused vars, no-any warn, cognitive complexity)
- Règles format (2 espaces, 100 chars, LF, single quotes)
- Override test files : `useLiteralKeys` off (nécessaire avec `noPropertyAccessFromIndexSignature`)
- Ignore patterns communs (`dist/`, `.turbo/`, `node_modules/`)

---

### `@gregoiref/vitest-config` `[ publié ]`

Preset Vitest partagé avec seuil de coverage enforced à 100%.

- `createBaseConfig()` — environment node, coverage v8 100% sur les 4 métriques
- `createDomConfig()` — même config mais jsdom

---

### `@gregoiref/commitlint-config` `[ publié ]`

Config commitlint avec support emoji optionnel.

- Pattern header : `[emoji] type(scope)[!]: message`
- 12 types autorisés (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, wip)
- Header max 120 chars, body max 200 chars

---

### `@gregoiref/cz-config` `[ publié ]`

Config cz-git pour une CLI guidée de commits.

- 12 types avec emoji
- Scopes custom autorisés
- Breaking changes limités à feat et fix

---

### `@gregoiref/changeset-config` `[ publié ]`

Factory de configuration Changesets pour monorepos TypeScript.

- `createConfig(overrides?)` — génère un objet de config `.changeset/config.json` avec des valeurs par défaut adaptées aux monorepos TypeScript
- Préconfigure `@changesets/changelog-github` pour des changelogs avec liens PR et noms contributeurs

---

## Librairies utilitaires TypeScript

### `@gregoiref/result` `[ publié ]`

Pattern `Result<T, E>` inspiré de Rust — gestion d'erreurs sans exceptions.

- `ok()`, `err()`, `isOk()`, `isErr()`
- `map()`, `mapErr()`, `flatMap()` — transforms
- `unwrap()`, `unwrapOr()`, `unwrapOrElse()` — extractors
- `fromThrowable()`, `fromPromise()` — async adapters
- 100% coverage, JSDoc exhaustif, README complet, fuzz target

**Signal technique :** Maîtrise des patterns fonctionnels, discriminated unions, types génériques.

---

### `@gregoiref/ts-utils` `[ publié ]`

Helpers TypeScript génériques réutilisables, sans dépendances externes.

- **Object** : `pick`, `omit`, `deepMerge`
- **Array** : `groupBy`, `chunk`, `unique`, `uniqueBy`
- **Function** : `debounce`, `sleep`, `memoize`
- **Types** : `Nullable<T>`, `DeepPartial<T>`, `DeepRequired<T>`, `Prettify<T>`, `ValueOf<T>`
- Sub-path exports tree-shakables : `@gregoiref/ts-utils/array`, `/object`, `/function`
- 100% coverage, JSDoc exhaustif, README complet, fuzz target

**Signal technique :** Maîtrise des génériques TypeScript avancés, types utilitaires, strictMode maximal.

---

### `@gregoiref/env-validator` `[ publié ]`

Validation des variables d'environnement type-safe sans Zod.

- Fluent builder : `v.string()`, `v.number()`, `v.boolean()`, `v.enum()`
- Chaînable : `.optional()`, `.default()`, `.url()`, `.min()`, `.max()`
- Collecte toutes les erreurs avant de lancer (pas de fail-fast)
- Inférence de type automatique sans cast
- 100% coverage, JSDoc exhaustif, README complet, fuzz target

**Signal technique :** Inférence TypeScript via littéraux de types génériques, pattern builder fluent.
**Alternative connue :** `t3-env` (cité dans le README du package).

---

### `@gregoiref/http-client` `[ publié ]`

Wrapper autour de `fetch` natif, typé et configurable.

- `createHttpClient({ baseUrl, defaultHeaders, timeout, interceptors })`
- Méthodes : `get`, `post`, `put`, `patch`, `delete`, `request`
- `HttpError` et `TimeoutError` typées
- Intercepteurs request/response
- `AbortSignal.any()` pour combiner timeout + signal externe
- Retourne `Result<HttpResponse<T>, HttpError | TimeoutError>` — pas d'exceptions
- 100% coverage, JSDoc exhaustif, README complet

**Signal technique :** Fetch API avancée, AbortController, generics, patterns résilience.
**Pourquoi pas Axios :** Démontrer qu'on peut construire soi-même ce que les devs importent aveuglément.

---

### `@gregoiref/logger` `[ publié ]`

Logger structuré léger pour Node et edge runtimes.

- `createLogger({ level, transports, context })`
- Niveaux : debug, info, warn, error
- `child(context)` — propagation de contexte sans mutation
- Transport par défaut : `consoleTransport` (JSON stringify vers console.*)
- 100% coverage, JSDoc exhaustif, README complet

**Signal technique :** Pluggable architecture, child loggers, structured logging pattern.

---

### `@gregoiref/date` `[ publié ]`

Helpers de manipulation de dates sans dépendance externe.

- `format(input, pattern)` — tokens YYYY MM DD HH mm ss SSS
- `startOf(input, unit)` — début d'unité (année, mois, jour, heure…)
- `add(input, amount, unit)` — arithmétique calendaire et ms
- `diff(a, b, unit)` — différence absolue tronquée
- `isSameDay`, `isBefore`, `isAfter`, `clamp`
- 100% coverage, JSDoc exhaustif, README complet

**Signal technique :** Arithmétique calendaire, gestion robuste de Date native.
**Pourquoi pas date-fns :** Démontrer qu'on peut éviter les dépendances lourdes pour des cas simples.

---

## Idées à évaluer

### `@gregoiref/design-tokens` `[ validé ]`

Tokens de design partagés entre les projets Astro, Nuxt et React.

- Couleurs, typographie, espacement, breakpoints
- Export CSS variables + export JS/TS typé
- Compatible Tailwind (`tailwind.config` généré depuis les tokens)
- Compatible UnoCSS

**Signal technique :** Architecture design system, cohérence cross-framework.
**Complexité :** Élevée — à traiter après publication des packages utilitaires.

---

## Packages écartés

| Package | Raison |
|---|---|
| `@gregoiref/i18n` | Trop complexe, `i18next` ou `vue-i18n` couvrent déjà le besoin |
| `@gregoiref/auth` | Domaine trop large, risque d'exposer publiquement de mauvaises pratiques de sécurité |
| `@gregoiref/orm` | Prisma et Drizzle font déjà ça bien — inutile de réinventer |

---

## État actuel — tous les packages

| # | Package | Statut | Coverage | Fuzz |
|---|---|---|---|---|
| 1 | `@gregoiref/tsconfig` | `[ publié ]` | n/a | — |
| 2 | `@gregoiref/biome-config` | `[ publié ]` | n/a | — |
| 3 | `@gregoiref/vitest-config` | `[ publié ]` | n/a | — |
| 4 | `@gregoiref/commitlint-config` | `[ publié ]` | n/a | — |
| 5 | `@gregoiref/cz-config` | `[ publié ]` | n/a | — |
| 6 | `@gregoiref/changeset-config` | `[ publié ]` | n/a | — |
| 7 | `@gregoiref/result` | `[ publié ]` | 100% | ✅ |
| 8 | `@gregoiref/ts-utils` | `[ publié ]` | 100% | ✅ |
| 9 | `@gregoiref/env-validator` | `[ publié ]` | 100% | ✅ |
| 10 | `@gregoiref/http-client` | `[ publié ]` | 100% | — |
| 11 | `@gregoiref/logger` | `[ publié ]` | 100% | — |
| 12 | `@gregoiref/date` | `[ publié ]` | 100% | — |
| 13 | `@gregoiref/design-tokens` | `[ validé ]` | — | — |
