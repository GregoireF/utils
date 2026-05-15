# Intégration Astro

Patterns d'utilisation des packages `@gregoiref/*` dans un projet Astro. Les exemples supposent Astro en mode `output: 'server'` ou `'hybrid'` — les endpoints API nécessitent le rendu serveur.

> Sources : [Endpoints — Astro Docs](https://docs.astro.build/en/guides/endpoints/), [Environment Variables — Astro Docs](https://docs.astro.build/en/guides/environment-variables/)

---

## Setup

```ini
# .npmrc (à la racine du projet Astro)
@gregoiref:registry=https://npm.pkg.github.com
```

```bash
pnpm add @gregoiref/env-validator @gregoiref/http-client @gregoiref/logger @gregoiref/result
```

---

## Validation des variables d'environnement

Astro distingue deux catégories de variables d'env ([doc officielle](https://docs.astro.build/en/guides/environment-variables/)) :

- `PUBLIC_*` — accessibles client et serveur via `import.meta.env`
- Tout le reste — serveur uniquement via `import.meta.env`

`@gregoiref/env-validator` se branche directement dessus. À mettre dans un module chargé une seule fois au démarrage serveur.

```typescript
// src/lib/env.ts
import { createValidator } from '@gregoiref/env-validator'

const v = createValidator()

// import.meta.env retourne les variables comme strings — le validator cast et valide
export const env = v.validate({
  DATABASE_URL:    v.string().url(),
  API_SECRET:      v.string().min(32),
  PUBLIC_API_BASE: v.string().url(),
  PORT:            v.number().default(4321),
})
// env est entièrement typé : env.PORT est number, env.DATABASE_URL est string
```

Si une variable est manquante ou invalide, `validate()` lève avec toutes les erreurs collectées — pas seulement la première.

---

## Logger avec contexte de requête

Astro API routes reçoivent un objet `APIContext`. Créer un child logger par requête propagule le contexte sans mutation du logger racine.

```typescript
// src/lib/logger.ts
import { createLogger } from '@gregoiref/logger'

export const rootLogger = createLogger({ level: 'info' })
```

```typescript
// src/pages/api/users/[id].ts
import type { APIRoute } from 'astro'
import { rootLogger } from '@/lib/logger'
import { isOk } from '@gregoiref/result'
import { userService } from '@/services/user'

export const GET: APIRoute = async ({ params, request }) => {
  const log = rootLogger.child({
    requestId: crypto.randomUUID(),
    path: new URL(request.url).pathname,
  })

  const id = Number(params.id)
  if (isNaN(id)) {
    log.warn('Invalid ID', { raw: params.id })
    return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 })
  }

  log.info('Fetching user', { userId: id })
  const result = await userService.getById(id)

  if (isOk(result)) {
    log.info('User found', { userId: id })
    return new Response(JSON.stringify(result.value), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  log.error('User not found', { userId: id, error: result.error.message })
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
}
```

---

## Service HTTP sortant

Les API routes Astro peuvent faire des appels HTTP sortants (proxy, agrégation). `@gregoiref/http-client` retourne `Result<HttpResponse<T>, HttpError | TimeoutError>` — aucun try/catch nécessaire.

```typescript
// src/services/github.ts
import { createHttpClient } from '@gregoiref/http-client'
import { env } from '@/lib/env'

const github = createHttpClient({
  baseUrl: 'https://api.github.com',
  timeout: 8000,
  defaultHeaders: {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  },
})

export interface GithubRepo {
  full_name: string
  stargazers_count: number
  description: string | null
}

export const githubService = {
  getRepo: (owner: string, repo: string) =>
    github.get<GithubRepo>(`/repos/${owner}/${repo}`),
}
```

```typescript
// src/pages/api/repos/[owner]/[repo].ts
import type { APIRoute } from 'astro'
import { isOk, isErr } from '@gregoiref/result'
import { HttpError, TimeoutError } from '@gregoiref/http-client'
import { githubService } from '@/services/github'

export const GET: APIRoute = async ({ params }) => {
  const { owner, repo } = params
  const result = await githubService.getRepo(owner!, repo!)

  if (isOk(result)) {
    return new Response(JSON.stringify(result.value.data), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (result.error instanceof TimeoutError) {
    return new Response(JSON.stringify({ error: 'GitHub timeout' }), { status: 504 })
  }

  if (result.error instanceof HttpError) {
    // Propage le status code de GitHub (404, 403, etc.)
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: result.error.status,
    })
  }

  return new Response(JSON.stringify({ error: 'Unknown error' }), { status: 500 })
}
```

---

## Dates dans les réponses API

```typescript
// src/pages/api/events.ts
import type { APIRoute } from 'astro'
import { format, isBefore, diff } from '@gregoiref/date'

export const GET: APIRoute = async () => {
  const events = await db.events.findAll()

  const now = new Date()
  const formatted = events.map(event => ({
    ...event,
    date:      format(event.date, 'DD/MM/YYYY HH:mm'),
    isPast:    !isBefore(now, event.date),
    daysUntil: isBefore(now, event.date) ? diff(now, event.date, 'day') : null,
  }))

  return new Response(JSON.stringify(formatted), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## Notes Astro spécifiques

- Les API routes Astro utilisent la **Fetch API standard** (`Request`/`Response`) — pas d'abstraction propriétaire. `@gregoiref/http-client` s'y intègre sans adaptation.
- `import.meta.env` est statiquement analysé par Vite au build — les variables non préfixées `PUBLIC_` ne sont jamais exposées dans le bundle client.
- Pour les variables d'env avec `astro.config.mjs`, utiliser `process.env` (pas `import.meta.env`) — Vite n'a pas encore traité le fichier de config.
