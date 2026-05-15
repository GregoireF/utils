# Intégration Node.js / Hono

Bootstrap complet d'une API Node.js avec Hono. Hono est un framework HTTP léger (~14 kB) conçu pour être isomorphe (Node.js, Cloudflare Workers, Deno, Bun) — il s'appuie sur la Fetch API standard, ce qui le rend directement compatible avec `@gregoiref/http-client`.

> Sources : [Getting Started — Hono](https://hono.dev/docs/getting-started/basic), [Cloudflare Workers — Hono](https://hono.dev/docs/getting-started/cloudflare-workers), [HTTPException — Hono](https://hono.dev/docs/api/exception), [Middleware — Hono](https://hono.dev/docs/concepts/middleware)

---

## Setup

```ini
# .npmrc
@gregoiref:registry=https://npm.pkg.github.com
```

```bash
pnpm add hono @hono/node-server
pnpm add @gregoiref/env-validator @gregoiref/http-client @gregoiref/logger @gregoiref/result
```

---

## Validation de l'environnement au démarrage

Valider `process.env` avant d'initialiser l'app garantit un crash explicite au démarrage plutôt qu'une erreur silencieuse à l'exécution.

```typescript
// src/env.ts
import { createValidator } from '@gregoiref/env-validator'

const v = createValidator()

export const env = v.validate({
  PORT:         v.number().default(3000),
  DATABASE_URL: v.string().url(),
  API_SECRET:   v.string().min(32),
  LOG_LEVEL:    v.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV:     v.enum(['development', 'production', 'test']).default('development'),
})
```

Si une variable est manquante ou invalide, `validate()` throw immédiatement avec toutes les erreurs collectées. Le processus s'arrête avant que Hono ne démarre.

---

## Logger et middleware de contexte de requête

```typescript
// src/logger.ts
import { createLogger } from '@gregoiref/logger'
import { env } from './env'

export const logger = createLogger({ level: env.LOG_LEVEL })
```

Hono supporte un middleware en chaîne ([doc](https://hono.dev/docs/concepts/middleware)). Un middleware de logging injecte un child logger dans le contexte de chaque requête :

```typescript
// src/middleware/logger.ts
import type { MiddlewareHandler } from 'hono'
import { logger } from '../logger'

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const requestId = crypto.randomUUID()
  const log = logger.child({
    requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
  })

  c.set('log', log)
  const start = Date.now()

  await next()

  log.info('Request completed', {
    status: c.res.status,
    durationMs: Date.now() - start,
  })
}
```

---

## Bootstrap complet

```typescript
// src/app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { env } from './env'
import { requestLogger } from './middleware/logger'
import { logger } from './logger'
import { usersRouter } from './routes/users'

// Variables d'env validées à l'import — process s'arrête ici si invalide
logger.info('Starting server', { port: env.PORT, nodeEnv: env.NODE_ENV })

export const app = new Hono()

// Middleware globaux
app.use(cors())
app.use(requestLogger)

// Routes
app.route('/api/users', usersRouter)

// Healthcheck
app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

// Erreur globale
app.onError((err, c) => {
  const log = c.get('log') ?? logger

  if (err instanceof HTTPException) {
    log.warn('HTTP exception', { status: err.status, message: err.message })
    return c.json({ error: err.message }, err.status)
  }

  log.error('Unhandled error', { error: (err as Error).message })
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
```

```typescript
// src/index.ts
import { serve } from '@hono/node-server'
import { app } from './app'
import { env } from './env'
import { logger } from './logger'

serve({ fetch: app.fetch, port: env.PORT }, () => {
  logger.info('Server ready', { port: env.PORT })
})
```

---

## Router avec Result

```typescript
// src/routes/users.ts
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { isOk } from '@gregoiref/result'
import { HttpError, TimeoutError } from '@gregoiref/http-client'
import { userService } from '../services/user'

export const usersRouter = new Hono()

usersRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const log = c.get('log')

  if (isNaN(id)) {
    throw new HTTPException(400, { message: 'Invalid user ID' })
  }

  log?.info('Fetching user', { userId: id })
  const result = await userService.getById(id)

  if (isOk(result)) {
    return c.json(result.value)
  }

  if (result.error instanceof TimeoutError) {
    throw new HTTPException(504, { message: 'Upstream timeout' })
  }

  if (result.error instanceof HttpError) {
    throw new HTTPException(result.error.status as 400 | 404 | 500, {
      message: result.error.message,
    })
  }

  throw new HTTPException(500, { message: 'Unexpected error' })
})

usersRouter.post('/', async (c) => {
  const body = await c.req.json<{ name: string; email: string }>()
  const log = c.get('log')

  const result = await userService.create(body)

  if (isOk(result)) {
    log?.info('User created', { userId: result.value.id })
    return c.json(result.value, 201)
  }

  throw new HTTPException(422, { message: result.error.message })
})
```

---

## Service HTTP sortant

```typescript
// src/services/user.ts
import { createHttpClient } from '@gregoiref/http-client'
import { env } from '../env'

const client = createHttpClient({
  baseUrl: env.USERS_API_URL,
  timeout: 5000,
  defaultHeaders: {
    Authorization: `Bearer ${env.API_SECRET}`,
  },
})

export interface User {
  id: number
  name: string
  email: string
}

export const userService = {
  getById: (id: number) => client.get<User>(`/users/${id}`),
  create:  (data: Omit<User, 'id'>) => client.post<User>('/users', data),
}
```

---

## Typage fort de `c.env` pour Cloudflare Workers

Sur Cloudflare Workers, les variables d'env passent par `c.env` et non `process.env` ([doc](https://hono.dev/docs/getting-started/cloudflare-workers)). Hono supporte le typage via generics :

```typescript
// src/types.ts
export type Bindings = {
  DATABASE_URL: string
  API_SECRET:   string
  LOG_LEVEL:    'debug' | 'info' | 'warn' | 'error'
}

export type Variables = {
  log: ReturnType<typeof import('./logger').logger.child>
}

// src/app.ts
import { Hono } from 'hono'
import type { Bindings, Variables } from './types'

export const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.get('/api/config', (c) => {
  // c.env.API_SECRET est typé string — pas de cast nécessaire
  const secret = c.env.API_SECRET
  return c.json({ ok: true })
})
```

---

## Notes Hono spécifiques

- `c.set()` / `c.get()` pour partager des données entre middlewares (contexte de requête typé via le generic `Variables`).
- `app.onError()` est le seul endroit où les `HTTPException` non catchées atterrissent — à définir en dernier, après toutes les routes.
- Hono ne gère pas `AbortSignal` de façon native pour les timeouts serveur — le timeout de `@gregoiref/http-client` couvre les appels sortants, pas le timeout d'entrée (à gérer avec `AbortController` si nécessaire).
