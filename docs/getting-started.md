# Getting started

Practical patterns combining multiple `@gregoiref` packages. Each example is self-contained and ready to copy.

## Installation

All packages are published to GitHub Packages. Add the registry once to your project's `.npmrc`:

```ini
@gregoiref:registry=https://npm.pkg.github.com
```

Then install what you need:

```bash
pnpm add @gregoiref/result @gregoiref/http-client @gregoiref/logger @gregoiref/env-validator
pnpm add @gregoiref/ts-utils @gregoiref/date
```

---

## Pattern 1 — HTTP service with typed error handling

`@gregoiref/http-client` returns `Result<HttpResponse<T>, HttpError | TimeoutError>` directly. Combine it with `@gregoiref/logger` to get structured error reporting with no try/catch.

```typescript
import { createHttpClient } from '@gregoiref/http-client'
import { createLogger } from '@gregoiref/logger'
import { isOk } from '@gregoiref/result'

const logger = createLogger({ level: 'info', context: { service: 'users' } })

const client = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  defaultHeaders: { Accept: 'application/json' },
})

interface User {
  id: number
  name: string
  email: string
}

export async function getUser(id: number): Promise<User | null> {
  const result = await client.get<User>(`/users/${id}`)

  if (isOk(result)) {
    logger.info('User fetched', { userId: id })
    return result.value.data
  }

  logger.error('Failed to fetch user', {
    userId: id,
    status: result.error.status,
    message: result.error.message,
  })
  return null
}
```

To propagate the error instead of swallowing it, return the `Result` directly:

```typescript
import type { Result } from '@gregoiref/result'
import type { HttpError, TimeoutError } from '@gregoiref/http-client'

export async function getUser(id: number): Promise<Result<User, HttpError | TimeoutError>> {
  return client.get<User>(`/users/${id}`)
}
```

---

## Pattern 2 — Application bootstrap with validated environment

`@gregoiref/env-validator` reads and validates `process.env` at startup, producing a fully typed config object. Pair it with `@gregoiref/logger` so the log level is driven by the environment.

```typescript
import { createValidator } from '@gregoiref/env-validator'
import { createLogger } from '@gregoiref/logger'

const v = createValidator()

const env = v.validate({
  DATABASE_URL: v.string().url(),
  PORT:         v.number().default(3000),
  LOG_LEVEL:    v.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_KEY:      v.string().min(32),
})
// env is fully typed — env.PORT is number, env.LOG_LEVEL is the union

const logger = createLogger({ level: env.LOG_LEVEL })

logger.info('App starting', { port: env.PORT })
```

If any required variable is missing or invalid, `validate()` throws with all errors collected — not just the first one.

---

## Pattern 3 — Data processing pipeline

`@gregoiref/ts-utils` provides collection helpers. Wrap multi-step transformations in `@gregoiref/result` to make failure modes explicit without exceptions.

```typescript
import { ok, err, flatMap } from '@gregoiref/result'
import { groupBy, chunk, unique } from '@gregoiref/ts-utils/array'
import { pick } from '@gregoiref/ts-utils/object'

interface Order {
  id: string
  userId: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
}

function processOrders(raw: Order[]) {
  const paid = raw.filter(o => o.status === 'paid')

  if (paid.length === 0) {
    return err(new Error('No paid orders to process'))
  }

  const byUser   = groupBy(paid, o => o.userId)
  const userIds  = unique(paid.map(o => o.userId))
  const batches  = chunk(paid, 50)
  const summary  = paid.map(o => pick(o, ['id', 'userId', 'amount']))

  return ok({ byUser, userIds, batches, summary })
}

// Caller handles the Result — no try/catch needed
const result = processOrders(orders)
if (isOk(result)) {
  console.log(`Processing ${result.value.batches.length} batches`)
}
```

---

## Pattern 4 — Date display in a UI layer

`@gregoiref/date` covers the common formatting and comparison cases without pulling in `date-fns` or `dayjs`.

```typescript
import { format, diff, add, isBefore, clamp } from '@gregoiref/date'

interface Task {
  title: string
  dueDate: Date
  createdAt: Date
}

function formatTask(task: Task) {
  const now = new Date()
  const isOverdue = !isBefore(now, task.dueDate)
  const daysLeft = diff(now, task.dueDate, 'day')

  return {
    title:     task.title,
    due:       format(task.dueDate, 'DD/MM/YYYY'),
    age:       `Created ${diff(task.createdAt, now, 'day')}d ago`,
    status:    isOverdue ? 'overdue' : `${daysLeft}d left`,
    reminder:  format(add(task.dueDate, -2, 'day'), 'YYYY-MM-DD'),
  }
}
```

---

## Pattern 5 — Child logger with request context

`@gregoiref/logger` supports `child(context)` to propagate metadata across a request lifecycle without mutation.

```typescript
import { createLogger } from '@gregoiref/logger'

const rootLogger = createLogger({ level: 'info' })

// In an HTTP handler (Hono, Express, Astro API route…)
export async function handleRequest(req: Request) {
  const requestId = crypto.randomUUID()
  const log = rootLogger.child({ requestId, path: new URL(req.url).pathname })

  log.info('Request received')

  try {
    const data = await fetchSomeData()
    log.info('Response ready', { items: data.length })
    return new Response(JSON.stringify(data))
  } catch (err) {
    log.error('Handler failed', { error: (err as Error).message })
    return new Response('Internal error', { status: 500 })
  }
}
```

---

## Related

- [Architecture decisions](../TRACKING.md) — why each package exists and what was rejected
- [Backlog](../IDEA.md) — planned packages and their status
- [Changelog](../CHANGELOG.md) — release history across all packages
