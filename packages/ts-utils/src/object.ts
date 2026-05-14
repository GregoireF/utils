// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Recursively makes every property of `T` optional and accepts explicit `undefined`.
 * The `| undefined` union is required for `exactOptionalPropertyTypes` compatibility,
 * which distinguishes a missing property from one set to `undefined`.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> | undefined }
  : T

// ─── Internal ──────────────────────────────────────────────────────────────────

// Excludes arrays, null, and class instances — deepMerge only recurses into
// plain key-value objects, not structured types where merging would be lossy.
function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

// Guards bracket-notation writes against prototype pollution. Keys like
// `__proto__`, `constructor`, and `prototype` are unsafe because assigning
// to them on a plain object modifies the shared prototype chain.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a new object containing only the specified keys from `obj`.
 * @param obj - The source object.
 * @param keys - Keys to include in the result.
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    // hasOwnProperty.call bypasses any inherited or overridden `hasOwnProperty` on obj.
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Returns a shallow copy of `obj` without the specified keys.
 * @param obj - The source object.
 * @param keys - Keys to exclude from the result.
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result as Omit<T, K>
}

/**
 * Deep-merges `source` into `target`, recursing into plain objects.
 * Arrays, class instances, and primitives are replaced, not merged.
 * `undefined` source values are skipped, allowing partial updates without erasure.
 * @param target - Base object returned as the merged type.
 * @param source - Partial overrides applied on top of `target`.
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: DeepPartial<T>): T {
  const result = { ...target }
  for (const key of Object.keys(source) as (keyof T & string)[]) {
    if (UNSAFE_KEYS.has(key)) continue
    const srcVal = source[key]
    const tgtVal = target[key]
    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      ;(result as Record<string, unknown>)[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      )
    } else if (srcVal !== undefined) {
      ;(result as Record<string, unknown>)[key] = srcVal
    }
  }
  return result
}
