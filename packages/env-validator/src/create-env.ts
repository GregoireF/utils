import type { AnyValidator, InferValidator } from './validators.js'

// ─── Error ─────────────────────────────────────────────────────────────────────

/**
 * Thrown by {@link createEnv} when one or more environment variables fail validation.
 * All errors are collected before throwing so every misconfigured variable is reported at once,
 * rather than stopping at the first failure.
 */
export class EnvValidationError extends Error {
  /** All validation error messages, one per failing variable. */
  readonly errors: readonly string[]

  constructor(errors: readonly string[]) {
    super(`Environment validation failed:\n${errors.map((e) => `  • ${e}`).join('\n')}`)
    this.name = 'EnvValidationError'
    this.errors = errors
  }
}

// ─── Internal types ────────────────────────────────────────────────────────────

type Schema = Record<string, AnyValidator>
type InferSchema<S extends Schema> = { [K in keyof S]: InferValidator<S[K]> }

// _resolve is an internal protocol implemented by each validator class.
// It is kept off the public AnyValidator union to avoid leaking implementation details.
type Resolvable = {
  _resolve(key: string, raw: string | undefined): { value: unknown } | { error: string }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Validates environment variables against a schema and returns a fully-typed object.
 * All validation errors are collected before throwing so every misconfiguration
 * is surfaced in a single error message.
 *
 * @param schema - A record of field names mapped to validators from `v.*`.
 * @param source - The raw string map to read from. Defaults to `process.env`.
 * @throws {@link EnvValidationError} if any field fails validation.
 *
 * @example
 * ```ts
 * const env = createEnv({
 *   PORT: v.number().default(3000),
 *   DATABASE_URL: v.string().url(),
 *   NODE_ENV: v.enum(['development', 'production'] as const),
 * })
 * ```
 */
export function createEnv<S extends Schema>(
  schema: S,
  source: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): InferSchema<S> {
  const result: Record<string, unknown> = {}
  const errors: string[] = []

  for (const key of Object.keys(schema)) {
    const validator = schema[key] as unknown as Resolvable
    const parsed = validator._resolve(key, source[key])
    if ('error' in parsed) {
      errors.push(parsed.error)
    } else {
      result[key] = parsed.value
    }
  }

  if (errors.length > 0) throw new EnvValidationError(errors)

  return result as InferSchema<S>
}
