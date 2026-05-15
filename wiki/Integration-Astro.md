# Integration: Astro

Patterns for using `@gregoiref/*` packages in an Astro project. Examples assume `output: 'server'` or `'hybrid'` mode — API endpoints require server-side rendering.

> Sources: [Endpoints — Astro Docs](https://docs.astro.build/en/guides/endpoints/), [Environment Variables — Astro Docs](https://docs.astro.build/en/guides/environment-variables/)

---

## Setup

```ini
# .npmrc
@gregoiref:registry=https://npm.pkg.github.com
```

```bash
pnpm add @gregoiref/env-validator @gregoiref/http-client @gregoiref/logger @gregoiref/result
```

---

## Environment validation

Astro has two categories of env variables ([official docs](https://docs.astro.build/en/guides/environment-variables/)):

- `PUBLIC_*` — accessible on client and server via `import.meta.env`
- Everything else — server-only via `import.meta.env`

`@gregoiref/env-validator` hooks into this directly. Place it in a module loaded once at server startup.

```typescript
// src/lib/env.ts
import { createValidator } from '@gregoiref/env-validator'

const v = createValidator()

// import.meta.env returns all variables as strings — the validator casts and validates
export const env = v.validate({
  DATABASE_URL:    v.string().url(),
  API_SECRET:      v.string().min(32),
  PUBLIC_API_BASE: v.string().url(),
  PORT:            v.number().default(4321),
})
// env is fully typed: env.PORT is number, env.DATABASE_URL is string
```

If a variable is missing or invalid, `validate()` throws immediately with all errors collected — not just the first.

---

## Logger with request context

Astro API routes receive an `APIContext` object. Creating a child logger per request propagates context without mutating the root logger.

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

## Outbound HTTP service

Astro API routes can make outbound HTTP calls (proxy, aggregation). `@gregoiref/http-client` returns `Result<HttpResponse<T>, HttpError | TimeoutError>` — no try/catch needed.

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
import { isOk } from '@gregoiref/result'
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
    // Propagate GitHub's status code (404, 403, etc.)
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: result.error.status,
    })
  }

  return new Response(JSON.stringify({ error: 'Unknown error' }), { status: 500 })
}
```

---

## Date formatting in API responses

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

## Astro-specific notes

- Astro API routes use the **standard Fetch API** (`Request`/`Response`) — no proprietary abstraction. `@gregoiref/http-client` integrates without any adapter.
- `import.meta.env` is statically analysed by Vite at build time — variables without the `PUBLIC_` prefix are never exposed in the client bundle.
- For env variables in `astro.config.mjs`, use `process.env` (not `import.meta.env`) — Vite has not processed the config file yet.
