# Intégration Nuxt 3

Patterns d'utilisation des packages `@gregoiref/*` dans un projet Nuxt 3. Les exemples ciblent principalement les server routes (`server/api/`) et les composables.

> Sources : [Server Routes — Nuxt Docs](https://nuxt.com/docs/guide/directory-structure/server), [useRuntimeConfig — Nuxt Docs](https://nuxt.com/docs/api/composables/use-runtime-config), [Data Fetching — Nuxt Docs](https://nuxt.com/docs/getting-started/data-fetching), [createError — Nuxt Docs](https://nuxt.com/docs/api/utils/create-error)

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

## Validation des variables d'environnement

Nuxt 3 expose les variables d'env via `useRuntimeConfig()` ([doc officielle](https://nuxt.com/docs/api/composables/use-runtime-config)). Les variables privées (server-only) sont sous la clé racine, les publiques sous `public`.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only
    databaseUrl: process.env.DATABASE_URL,
    apiSecret:   process.env.API_SECRET,

    // Accessible client + serveur
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '/api',
    },
  },
})
```

Valider la config au démarrage du serveur avec un plugin Nitro :

```typescript
// server/plugins/env.ts
import { createValidator } from '@gregoiref/env-validator'

const v = createValidator()

export default defineNitroPlugin(() => {
  // Valide process.env directement — plus explicite que runtimeConfig pour le bootstrap
  v.validate({
    DATABASE_URL: v.string().url(),
    API_SECRET:   v.string().min(32),
    NODE_ENV:     v.enum(['development', 'production', 'test']).default('development'),
  })

  console.log('[env] All required variables validated')
})
```

Nuxt execute les plugins Nitro au démarrage serveur — si `validate()` lève, le serveur ne démarre pas.

---

## Server routes avec Result

Nuxt 3 server routes utilisent `defineEventHandler` de H3. `@gregoiref/http-client` s'intègre directement : les deux s'appuient sur fetch natif.

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

Le pattern `isOk` + `createError` mappe proprement les `Result` de `http-client` vers les erreurs H3 que Nuxt sait sérialiser côté client.

---

## Logger structuré dans les server routes

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

  // ... logique métier

  log.info('Order created', { orderId: newOrder.id })
  return newOrder
})
```

---

## $fetch vs useFetch vs useAsyncData

Nuxt propose trois patterns de fetching ([comparatif officiel](https://nuxt.com/docs/getting-started/data-fetching)) :

| Méthode | Quand l'utiliser |
|---|---|
| `$fetch` | Mutations (POST/PUT/DELETE) dans les event handlers, pas de hydration nécessaire |
| `useFetch` | Fetching simple dans les composants, hydration SSR automatique |
| `useAsyncData` | Logique async complexe, sources multiples, ou quand on veut appeler son propre service TypeScript |

**`useAsyncData` avec les packages `@gregoiref`** — c'est là que ça devient intéressant. Au lieu de `$fetch` vers une URL, on appelle directement le service :

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

      // useAsyncData s'attend à une exception pour passer en état error
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

## Notes Nuxt 3 spécifiques

- `defineEventHandler` et les utilitaires H3 (`readBody`, `getRouterParam`, `createError`) sont auto-importés dans `server/` — pas besoin de les importer manuellement.
- `useRuntimeConfig()` sans argument dans un composant retourne uniquement les variables `public`. Avec `event` dans une server route, il retourne aussi les variables privées.
- Les server routes Nuxt tournent dans Nitro — elles partagent le même runtime que Node.js (fetch natif disponible à partir de Node 18), ce qui rend `@gregoiref/http-client` directement compatible.
