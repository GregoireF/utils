# Integration: Node.js / Hono

Full bootstrap of a Node.js API with Hono. Hono is a lightweight HTTP framework (~14 kB) designed to be isomorphic (Node.js, Cloudflare Workers, Deno, Bun) — it's built on the standard Fetch API, making it directly compatible with `@gregoiref/http-client`.

> Sources: [Getting Started — Hono](https://hono.dev/docs/getting-started/basic), [Cloudflare Workers — Hono](https://hono.dev/docs/getting-started/cloudflare-workers), [HTTPException — Hono](https://hono.dev/docs/api/exception), [Middleware — Hono](https://hono.dev/docs/concepts/middleware)

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

## Environment validation at startup

Validating `process.env` before initialising the app guarantees an explicit crash at startup rather than a silent runtime error.

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

If a variable is missing or invalid, `validate()` throws immediately with all errors collected. The process stops before Hono starts.

---

## Logger and request context middleware

```typescript
// src/logger.ts
import { createLogger } from '@gregoiref/logger'
import { env } from './env'

export const logger = createLogger({ level: env.LOG_LEVEL })
```

Hono supports chained middleware ([docs](https://hono.dev/docs/concepts/middleware)). A logging middleware injects a child logger into each request context:

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

## Full bootstrap

```typescript
// src/app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { env } from './env'
import { requestLogger } from './middleware/logger'
import { logger } from './logger'
import { usersRouter } from './routes/users'

// Env validated at import time — process stops here if invalid
logger.info('Starting server', { port: env.PORT, nodeEnv: env.NODE_ENV })

export const app = new Hono()

// Global middleware
app.use(cors())
app.use(requestLogger)

// Routes
app.route('/api/users', usersRouter)

// Healthcheck
app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

// Global error handler
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

## Router with Result pattern

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

## Outbound HTTP service

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

## Strong typing for `c.env` on Cloudflare Workers

On Cloudflare Workers, env variables come through `c.env` instead of `process.env` ([docs](https://hono.dev/docs/getting-started/cloudflare-workers)). Hono supports typing via generics:

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
  // c.env.API_SECRET is typed string — no cast needed
  const secret = c.env.API_SECRET
  return c.json({ ok: true })
})
```

---

## Hono-specific notes

- `c.set()` / `c.get()` share data between middlewares (request-scoped context typed via the `Variables` generic).
- `app.onError()` is the only place unhandled `HTTPException` errors land — define it last, after all routes.
- Hono does not handle `AbortSignal` natively for server-side timeouts. The `@gregoiref/http-client` timeout covers outbound calls, not the incoming request timeout (handle that with `AbortController` if needed).
