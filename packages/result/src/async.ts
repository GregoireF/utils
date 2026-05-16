import { type Result, err, ok } from './result.js'

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Thrown (as an `Err`) when an operation wrapped by {@link withTimeout} exceeds its time limit. */
export class OperationTimeoutError extends Error {
  /** The configured timeout in milliseconds. */
  readonly ms: number

  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
    this.name = 'OperationTimeoutError'
    this.ms = ms
  }
}

/** Options for {@link withRetry}. */
export interface RetryOptions<E> {
  /** Total number of attempts (including the first). Must be ≥ 1. Default: `3`. */
  attempts?: number
  /** Base delay in milliseconds between the first and second attempt. Default: `500`. */
  delay?: number
  /** Multiplier applied to the delay after each failed attempt (exponential backoff). Default: `2`. */
  factor?: number
  /**
   * Called before each retry with the error and zero-based attempt index.
   * Return `false` to stop retrying immediately and return the current `Err`.
   * Default: always retry.
   */
  shouldRetry?: (error: E, attempt: number) => boolean
}

// ─── Combinators ──────────────────────────────────────────────────────────────

/**
 * Runs all promises concurrently and returns `Ok` with an array of values if every
 * promise resolves to `Ok`. Returns `Err` with the first error encountered otherwise.
 *
 * Equivalent to `Promise.all` for Result-typed promises — all promises run regardless;
 * the first `Err` in the settled array wins.
 *
 * @param promises - Array of promises each resolving to a `Result`.
 */
export async function resultAll<T, E>(
  promises: readonly Promise<Result<T, E>>[],
): Promise<Result<readonly T[], E>> {
  const settled = await Promise.all(promises)
  const values: T[] = []
  for (const r of settled) {
    if (!r.ok) return r
    values.push(r.value)
  }
  return ok(values)
}

/**
 * Runs all promises concurrently and returns an array of each individual `Result`.
 * Never rejects — equivalent to `Promise.allSettled` for Result-typed promises.
 *
 * @param promises - Array of promises each resolving to a `Result`.
 */
export async function resultSettled<T, E>(
  promises: readonly Promise<Result<T, E>>[],
): Promise<readonly Result<T, E>[]> {
  return Promise.all(promises)
}

// ─── Async utilities ──────────────────────────────────────────────────────────

/**
 * Races a Result-returning promise against a deadline.
 * Returns `Err(OperationTimeoutError)` if the timeout fires before the promise resolves.
 *
 * The timer is always cleared after the race, whether the promise won or the timeout did.
 *
 * @param promise - A promise returning a `Result`.
 * @param ms - Maximum wait time in milliseconds.
 */
export async function withTimeout<T, E>(
  promise: Promise<Result<T, E>>,
  ms: number,
): Promise<Result<T, E | OperationTimeoutError>> {
  let id: ReturnType<typeof setTimeout> | undefined
  const timer = new Promise<Result<never, OperationTimeoutError>>((resolve) => {
    id = setTimeout(() => resolve(err(new OperationTimeoutError(ms))), ms)
  })
  try {
    return await Promise.race([promise, timer])
  } finally {
    clearTimeout(id)
  }
}

/**
 * Calls `fn` repeatedly until it returns `Ok` or all attempts are exhausted.
 * Delays between attempts use exponential backoff: `delay * factor^attempt`.
 *
 * @param fn - Factory called on each attempt. Receives the zero-based attempt index.
 * @param options - Retry configuration.
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => client.get('/flaky-endpoint'),
 *   { attempts: 3, delay: 300 },
 * )
 * ```
 */
export async function withRetry<T, E>(
  fn: (attempt: number) => Promise<Result<T, E>>,
  options: RetryOptions<E> = {},
): Promise<Result<T, E>> {
  const { attempts = 3, delay = 500, factor = 2, shouldRetry } = options
  let last!: Result<T, E>

  for (let i = 0; i < attempts; i++) {
    last = await fn(i)
    if (last.ok) return last
    if (shouldRetry !== undefined && !shouldRetry(last.error, i)) return last
    if (i < attempts - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay * factor ** i))
    }
  }

  return last
}
