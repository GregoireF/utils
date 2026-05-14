// ─── Timing ────────────────────────────────────────────────────────────────────

/**
 * Returns a debounced version of `fn` that delays invocation until `delay` ms
 * have elapsed since the last call. Useful for rate-limiting input handlers.
 * @param fn - The function to debounce. Must return `void`.
 * @param delay - Quiet period in milliseconds before the function is called.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>): void => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Returns a `Promise` that resolves after `ms` milliseconds.
 * @param ms - Duration in milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Caching ───────────────────────────────────────────────────────────────────

/**
 * Returns a memoized version of `fn` whose results are cached by a
 * `JSON.stringify`-derived key from the arguments.
 *
 * **Caveat:** arguments must be JSON-serializable. Functions, `undefined`, and
 * circular references will produce incorrect or colliding cache keys.
 *
 * @param fn - A pure function (same args always → same result).
 */
export function memoize<Args extends readonly unknown[], Return>(
  fn: (...args: Args) => Return,
): (...args: Args) => Return {
  const cache = new Map<string, Return>()
  return (...args: Args): Return => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key) as Return
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}
