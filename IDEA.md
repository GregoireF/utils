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
| `[ prêt ]` | Implémenté, testé, documenté — prêt pour publication npm |
| `[ publié ]` | Disponible sur npm |
| `[ écarté ]` | Raison documentée |

---

## Configs partagées

Ces packages sont les fondations du monorepo. Tous sont désormais dans le scope `@gregoiref/` et publiables.

### `@gregoiref/tsconfig` `[ prêt ]`

Config TypeScript stricte déclinée en plusieurs presets :

- `base.json` — strict, ES2022, moduleResolution bundler, exactOptionalPropertyTypes, noUncheckedIndexedAccess
- `node.json` — étend base, types Node
- `dom.json` — étend base, types DOM
- `astro.json` — étend base, compatible Astro
- `nuxt.json` — étend base, compatible Nuxt

---

### `@gregoiref/biome-config` `[ prêt ]`

Config Biome centralisée, consommée par tous les packages via `"extends"`.

- Règles lint Biome recommandées + overrides maison (unused vars, no-any warn, cognitive complexity)
- Règles format (2 espaces, 100 chars, LF, single quotes)
- Override test files : `useLiteralKeys` off (nécessaire avec `noPropertyAccessFromIndexSignature`)
- Ignore patterns communs (`dist/`, `.turbo/`, `node_modules/`)

---

### `@gregoiref/vitest-config` `[ prêt ]`

Preset Vitest partagé avec seuil de coverage enforced.

- `createBaseConfig()` — environment node, coverage v8 90% sur les 4 métriques
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

## Librairies utilitaires TypeScript

### `@gregoiref/result` `[ prêt ]`

Pattern `Result<T, E>` inspiré de Rust — gestion d'erreurs sans exceptions.

- `ok()`, `err()`, `isOk()`, `isErr()`
- `map()`, `mapErr()`, `flatMap()` — transforms
- `unwrap()`, `unwrapOr()`, `unwrapOrElse()` — extractors
- `fromThrowable()`, `fromPromise()` — async adapters
- 100% coverage, JSDoc exhaustif, README complet

**Signal technique :** Maîtrise des patterns fonctionnels, discriminated unions, types génériques.

---

### `@gregoiref/ts-utils` `[ prêt ]`

Helpers TypeScript génériques réutilisables, sans dépendances externes.

- **Object** : `pick`, `omit`, `deepMerge`
- **Array** : `groupBy`, `chunk`, `unique`, `uniqueBy`
- **Function** : `debounce`, `sleep`, `memoize`
- **Types** : `Nullable<T>`, `DeepPartial<T>`, `DeepRequired<T>`, `Prettify<T>`, `ValueOf<T>`
- 100% coverage, JSDoc exhaustif, README complet

**Signal technique :** Maîtrise des génériques TypeScript avancés, types utilitaires, strictMode maximal.

---

### `@gregoiref/env-validator` `[ prêt ]`

Validation des variables d'environnement type-safe sans Zod.

- Fluent builder : `v.string()`, `v.number()`, `v.boolean()`, `v.enum()`
- Chaînable : `.optional()`, `.default()`, `.url()`, `.min()`, `.max()`
- Collecte toutes les erreurs avant de lancer (pas de fail-fast)
- Inférence de type automatique sans cast
- 99% coverage, JSDoc exhaustif, README complet

**Signal technique :** Inférence TypeScript via littéraux de types génériques, pattern builder fluent.
**Alternative connue :** `t3-env` (cité dans le README du package).

---

### `@gregoiref/http-client` `[ prêt ]`

Wrapper autour de `fetch` natif, typé et configurable.

- `createHttpClient({ baseUrl, defaultHeaders, timeout, interceptors })`
- Méthodes : `get`, `post`, `put`, `patch`, `delete`, `request`
- `HttpError` et `TimeoutError` typées
- Intercepteurs request/response
- `AbortSignal.any()` pour combiner timeout + signal externe
- 96% coverage, JSDoc exhaustif, README complet

**Signal technique :** Fetch API avancée, AbortController, generics, patterns résilience.
**Pourquoi pas Axios :** Démontrer qu'on peut construire soi-même ce que les devs importent aveuglément.

---

### `@gregoiref/logger` `[ prêt ]`

Logger structuré léger pour Node et edge runtimes.

- `createLogger({ level, transports, context })`
- Niveaux : debug, info, warn, error
- `child(context)` — propagation de contexte sans mutation
- Transport par défaut : `consoleTransport` (JSON stringify vers console.*)
- 100% coverage, JSDoc exhaustif, README complet

**Signal technique :** Pluggable architecture, child loggers, structured logging pattern.

---

### `@gregoiref/date` `[ prêt ]`

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

## Ordre de développement — état actuel

| # | Package | Statut |
|---|---|---|
| 1 | `@gregoiref/tsconfig` | `[ prêt ]` |
| 2 | `@gregoiref/biome-config` | `[ prêt ]` |
| 3 | `@gregoiref/vitest-config` | `[ prêt ]` |
| 4 | `@gregoiref/commitlint-config` | `[ publié ]` |
| 5 | `@gregoiref/cz-config` | `[ publié ]` |
| 6 | `@gregoiref/result` | `[ prêt ]` |
| 7 | `@gregoiref/ts-utils` | `[ prêt ]` |
| 8 | `@gregoiref/env-validator` | `[ prêt ]` |
| 9 | `@gregoiref/http-client` | `[ prêt ]` |
| 10 | `@gregoiref/logger` | `[ prêt ]` |
| 11 | `@gregoiref/date` | `[ prêt ]` |
| 12 | `@gregoiref/design-tokens` | `[ validé ]` |
