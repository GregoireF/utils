// ─── Grouping ──────────────────────────────────────────────────────────────────

/**
 * Groups an array's elements by the string key returned from `key`.
 * @param arr - The source array.
 * @param key - Function deriving the group key from each element.
 * @returns A plain object mapping each key to its matching elements, in insertion order.
 */
export function groupBy<T>(arr: readonly T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of arr) {
    const k = key(item)
    // Read before write to avoid a compound `??=` assignment, which Biome flags
    // as noAssignInExpressions when used as a standalone statement.
    const bucket = result[k] ?? []
    result[k] = bucket
    bucket.push(item)
  }
  return result
}

// ─── Splitting ─────────────────────────────────────────────────────────────────

/**
 * Splits an array into consecutive chunks of at most `size` elements.
 * The last chunk may be smaller if the array length is not evenly divisible.
 * @param arr - The source array.
 * @param size - Maximum number of elements per chunk (must be >= 1).
 * @throws {RangeError} if `size` is less than 1.
 */
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (size < 1) throw new RangeError(`chunk size must be >= 1, got ${size}`)
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(Array.from(arr.slice(i, i + size)))
  }
  return result
}

// ─── Deduplication ─────────────────────────────────────────────────────────────

/**
 * Returns a new array with duplicate values removed, preserving insertion order.
 * Uses strict equality (`===`) via `Set`.
 * @param arr - The source array.
 */
export function unique<T>(arr: readonly T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Returns a new array with duplicates removed based on a derived key.
 * The first occurrence of each key is kept; insertion order is preserved.
 * @param arr - The source array.
 * @param key - Function deriving the comparison key from each element.
 */
export function uniqueBy<T>(arr: readonly T[], key: (item: T) => unknown): T[] {
  const seen = new Set<unknown>()
  return arr.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
