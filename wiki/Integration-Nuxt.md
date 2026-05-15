# Integration: Nuxt 3

Patterns for using `@gregoiref/*` packages in a Nuxt 3 project. Examples focus on server routes (`server/api/`) and composables.

> Sources: [Server Routes — Nuxt Docs](https://nuxt.com/docs/guide/directory-structure/server), [useRuntimeConfig — Nuxt Docs](https://nuxt.com/docs/api/composables/use-runtime-config), [Data Fetching — Nuxt Docs](https://nuxt.com/docs/getting-started/data-fetching), [createError — Nuxt Docs](https://nuxt.com/docs/api/utils/create-error)

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

Nuxt 3 exposes env variables via `useRuntimeConfig()` ([official docs](https://nuxt.com/docs/api/composables/use-runtime-config)). Private (server-only) variables live under the root key; public variables under `public`.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only
    databaseUrl: process.env.DATABASE_URL,
    apiSecret:   process.env.API_SECRET,

    // Accessible on client and server
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '/api',
    },
  },
})
```

Validate the config at server startup with a Nitro plugin:

```typescript
// server/plugins/env.ts
import { createValidator } from '@gregoiref/env-validator'

const v = createValidator()

export default defineNitroPlugin(() => {
  // Validate process.env directly — more explicit than runtimeConfig for bootstrap
  v.validate({
    DATABASE_URL: v.string().url(),
    API_SECRET:   v.string().min(32),
    NODE_ENV:     v.enum(['development', 'production', 'test']).default('development'),
  })

  console.log('[env] All required variables validated')
})
```

Nuxt runs Nitro plugins at server startup — if `validate()` throws, the server does not start.

---

## Server routes with Result

Nuxt 3 server routes use `defineEventHandler` from H3. `@gregoiref/http-client` integrates directly — both use native fetch.

```typescript
// server/api/users/[id].get.ts
import { createHttpClient, HttpError, TimeoutError } from '@gregoiref/http-client'
import { isOk } from '@gregoiref/result'

const upstream = createHttpClient({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({ status: 400, statusMessage: 'Invalid user ID' })
  }

  const result = await upstream.get<{ id: number; name: string; email: string }>(`/users/${id}`)

  if (isOk(result)) {
    return result.value.data
  }

  if (result.error instanceof TimeoutError) {
    throw createError({ status: 504, statusMessage: 'Upstream timeout' })
  }

  if (result.error instanceof HttpError) {
    throw createError({ status: result.error.status, statusMessage: result.error.message })
  }

  throw createError({ status: 500, statusMessage: 'Unexpected error' })
})
```

The `isOk` + `createError` pattern cleanly maps `Result` from `http-client` to H3 errors that Nuxt serialises automatically on the client side.

---

## Structured logger in server routes

```typescript
// server/utils/logger.ts
import { createLogger } from '@gregoiref/logger'

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
})
```

```typescript
// server/api/orders/index.post.ts
import { logger } from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const log = logger.child({
    requestId: getHeader(event, 'x-request-id') ?? crypto.randomUUID(),
    route: '/api/orders',
  })

  log.info('Creating order', { userId: body.userId })

  // ... business logic

  log.info('Order created', { orderId: newOrder.id })
  return newOrder
})
```

---

## `$fetch` vs `useFetch` vs `useAsyncData`

Nuxt offers three fetching patterns ([official comparison](https://nuxt.com/docs/getting-started/data-fetching)):

| Method | When to use |
|---|---|
| `$fetch` | Mutations (POST/PUT/DELETE) in event handlers — no hydration needed |
| `useFetch` | Simple fetching in components with automatic SSR hydration |
| `useAsyncData` | Complex async logic, multiple sources, or when calling your own TypeScript service directly |

**`useAsyncData` with `@gregoiref` packages** — instead of `$fetch` to a URL, call the service directly:

```typescript
// composables/useUser.ts
import { createHttpClient } from '@gregoiref/http-client'
import { isOk } from '@gregoiref/result'

const client = createHttpClient({ baseUrl: useRuntimeConfig().public.apiBase })

export function useUser(id: MaybeRef<number>) {
  return useAsyncData(
    () => `user-${unref(id)}`,
    async () => {
      const result = await client.get<User>(`/users/${unref(id)}`)

      if (isOk(result)) return result.value.data

      // useAsyncData expects a thrown exception to enter the error state
      throw new Error(result.error.message)
    },
    { watch: [() => unref(id)] }
  )
}
```

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const { data: user, pending, error } = useUser(Number(route.params.id))
</script>
```

---

## Nuxt 3-specific notes

- `defineEventHandler` and H3 utilities (`readBody`, `getRouterParam`, `createError`) are auto-imported in `server/` — no manual imports needed.
- `useRuntimeConfig()` without an argument in a component returns only `public` variables. With `event` in a server route, it also returns private variables.
- Nuxt server routes run in Nitro — they share the same runtime as Node.js (native fetch available from Node 18), making `@gregoiref/http-client` directly compatible.
