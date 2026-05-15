# @GregoireF/utils — Wiki

Documentation complémentaire aux READMEs du repo. Les READMEs couvrent les APIs package par package ; ce wiki couvre le contexte, les décisions, et l'intégration dans des projets réels.

## Pages

| Page | Contenu |
|---|---|
| [Architecture](Architecture) | Décisions structurelles, philosophie zero-dep, stack, ce qui a été rejeté et pourquoi |
| [Intégration Astro](Integration-Astro) | Patterns concrets dans des API routes et server endpoints Astro |
| [Intégration Nuxt 3](Integration-Nuxt) | Patterns dans des server routes et composables Nuxt 3 |
| [Intégration Node / Hono](Integration-Node) | Bootstrap complet d'une API Node.js avec Hono |

## Références rapides

**Registry GitHub Packages**
```ini
# .npmrc
@gregoiref:registry=https://npm.pkg.github.com
```

**Install**
```bash
pnpm add @gregoiref/result @gregoiref/http-client @gregoiref/logger
pnpm add @gregoiref/env-validator @gregoiref/ts-utils @gregoiref/date
```

**Packages publiés**

| Package | Rôle |
|---|---|
| `@gregoiref/result` | `Result<T, E>` — gestion d'erreurs sans exceptions |
| `@gregoiref/http-client` | Wrapper `fetch` typé, retourne `Result<T, E>` |
| `@gregoiref/logger` | Logger structuré JSON avec `child(context)` |
| `@gregoiref/env-validator` | Validation des variables d'environnement sans Zod |
| `@gregoiref/ts-utils` | Utilitaires TypeScript — `groupBy`, `pick`, `deepMerge`, `memoize`… |
| `@gregoiref/date` | Helpers date — `format`, `diff`, `add`, `clamp` sans `date-fns` |

## Repo

- [Code source](https://github.com/GregoireF/utils)
- [Getting started (cross-package examples)](https://github.com/GregoireF/utils/blob/main/docs/getting-started.md)
- [Changelog](https://github.com/GregoireF/utils/blob/main/CHANGELOG.md)
- [GitHub Releases](https://github.com/GregoireF/utils/releases)
