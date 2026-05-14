// ─── Types ─────────────────────────────────────────────────────────────────────

/** Represents a successful computation holding a value of type `T`. */
export type Ok<T> = Readonly<{ ok: true; value: T }>

/** Represents a failed computation holding an error of type `E`. */
export type Err<E> = Readonly<{ ok: false; error: E }>

/** Discriminated union of {@link Ok} and {@link Err}. Defaults the error type to `Error`. */
export type Result<T, E = Error> = Ok<T> | Err<E>

// ─── Error ─────────────────────────────────────────────────────────────────────

/**
 * Thrown by {@link unwrap} when called on an `Err` result.
 * Preserves the original error value for programmatic access after the catch.
 */
export class ResultError<E> extends Error {
  readonly error: E

  constructor(error: E) {
    super(`unwrap() called on Err: ${String(error)}`)
    this.name = 'ResultError'
    this.error = error
  }
}

// ─── Constructors ──────────────────────────────────────────────────────────────

/**
 * Creates a frozen `Ok<T>` result.
 * @param value - The success value to wrap.
 */
export function ok<T>(value: T): Ok<T> {
  // Object.freeze ensures runtime immutability, complementing TypeScript's Readonly<> at the type level.
  return Object.freeze({ ok: true, value })
}

/**
 * Creates a frozen `Err<E>` result.
 * @param error - The error value to wrap.
 */
export function err<E>(error: E): Err<E> {
  return Object.freeze({ ok: false, error })
}

// ─── Type Guards ───────────────────────────────────────────────────────────────

/**
 * Narrows `result` to `Ok<T>`.
 * @param result - The result to test.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok
}

/**
 * Narrows `result` to `Err<E>`.
 * @param result - The result to test.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok
}

// ─── Transforms ────────────────────────────────────────────────────────────────

/**
 * Applies `fn` to the value inside an `Ok`, leaving `Err` unchanged (functor map).
 * @param result - The source result.
 * @param fn - Mapping function applied to the success value.
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result
}

/**
 * Applies `fn` to the error inside an `Err`, leaving `Ok` unchanged.
 * @param result - The source result.
 * @param fn - Mapping function applied to the error value.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(fn(result.error))
}

/**
 * Chains a result-returning function onto an `Ok` (monadic bind / flatMap).
 * Leaves `Err` unchanged.
 * @param result - The source result.
 * @param fn - Function returning a new `Result`, applied only on `Ok`.
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result
}

// ─── Unwrappers ────────────────────────────────────────────────────────────────

/**
 * Extracts the value from an `Ok` result.
 * @param result - The result to unwrap.
 * @throws {@link ResultError} if `result` is `Err`.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value
  throw new ResultError(result.error)
}

/**
 * Extracts the value from an `Ok`, or returns `fallback` for `Err`.
 * @param result - The result to unwrap.
 * @param fallback - Value returned when `result` is `Err`.
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}

/**
 * Extracts the value from an `Ok`, or calls `fn` with the error for `Err`.
 * Prefer this over {@link unwrapOr} when the fallback depends on the error value.
 * @param result - The result to unwrap.
 * @param fn - Function producing a fallback from the error.
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.ok ? result.value : fn(result.error)
}

// ─── Async adapters ────────────────────────────────────────────────────────────

/**
 * Wraps a synchronous throwing function into a `Result`.
 * Non-`Error` throws are coerced to `Error` via `String()`.
 * @param fn - A function that may throw.
 */
export function fromThrowable<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn())
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Wraps a `Promise` into a `Result`, never rejecting.
 * Non-`Error` rejections are coerced to `Error` via `String()`.
 * @param promise - The promise to wrap.
 */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await promise)
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)))
  }
}
