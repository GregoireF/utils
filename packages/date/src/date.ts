// ─── Types ─────────────────────────────────────────────────────────────────────

/** Calendar and time units accepted by all date utility functions. */
export type DateUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'

/** Anything that can unambiguously describe a point in time. */
export type DateInput = Date | string | number

// ─── Internal ──────────────────────────────────────────────────────────────────

// Always constructs a fresh Date so callers cannot accidentally mutate the original.
function toDate(input: DateInput): Date {
  if (input instanceof Date) return new Date(input)
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) throw new RangeError(`Invalid date: ${String(input)}`)
  return d
}

// ─── Format ────────────────────────────────────────────────────────────────────

/**
 * Formats a date using a pattern string (local time).
 *
 * Supported tokens: `YYYY` `MM` `DD` `HH` `mm` `ss` `SSS`
 *
 * @param input - The date to format.
 * @param pattern - A string containing one or more tokens.
 * @returns The formatted string with all tokens replaced.
 *
 * @example
 * format(new Date('2024-03-15T09:05:03'), 'YYYY-MM-DD HH:mm') // "2024-03-15 09:05"
 */
export function format(input: DateInput, pattern: string): string {
  const d = toDate(input)
  return pattern
    .replace('YYYY', String(d.getFullYear()).padStart(4, '0'))
    .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
    .replace('DD', String(d.getDate()).padStart(2, '0'))
    .replace('HH', String(d.getHours()).padStart(2, '0'))
    .replace('mm', String(d.getMinutes()).padStart(2, '0'))
    .replace('ss', String(d.getSeconds()).padStart(2, '0'))
    .replace('SSS', String(d.getMilliseconds()).padStart(3, '0'))
}

// ─── Boundaries ────────────────────────────────────────────────────────────────

/**
 * Returns a new `Date` at the start of the given unit for `input`.
 * All sub-units are zeroed out (e.g. start of `'day'` = midnight, start of `'year'` = Jan 1 00:00).
 *
 * @param input - The reference date.
 * @param unit - The granularity at which to truncate.
 */
export function startOf(input: DateInput, unit: DateUnit): Date {
  const d = toDate(input)
  switch (unit) {
    case 'year':
      return new Date(d.getFullYear(), 0, 1)
    case 'month':
      return new Date(d.getFullYear(), d.getMonth(), 1)
    case 'day':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    case 'hour':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours())
    case 'minute':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())
    case 'second':
      return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
      )
    case 'millisecond':
      return new Date(d)
  }
}

// ─── Arithmetic ────────────────────────────────────────────────────────────────

/**
 * Returns a new `Date` with `amount` units added to `input`.
 * Pass a negative `amount` to subtract.
 *
 * Year and month additions use calendar arithmetic so the day-of-month is preserved
 * (JavaScript's `Date` constructor handles month overflow, e.g. March 31 + 1 month → April 30).
 * Sub-day units use millisecond arithmetic for precision.
 *
 * @param input - The base date.
 * @param amount - Number of units to add (negative to subtract).
 * @param unit - The unit of addition.
 */
export function add(input: DateInput, amount: number, unit: DateUnit): Date {
  const d = toDate(input)
  switch (unit) {
    case 'year':
      return new Date(
        d.getFullYear() + amount,
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds(),
      )
    case 'month':
      return new Date(
        d.getFullYear(),
        d.getMonth() + amount,
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds(),
      )
    case 'day':
      return new Date(d.getTime() + amount * 864e5)
    case 'hour':
      return new Date(d.getTime() + amount * 36e5)
    case 'minute':
      return new Date(d.getTime() + amount * 6e4)
    case 'second':
      return new Date(d.getTime() + amount * 1e3)
    case 'millisecond':
      return new Date(d.getTime() + amount)
  }
}

// ─── Comparison ────────────────────────────────────────────────────────────────

/**
 * Returns the absolute difference between two dates in the given unit (truncated, not rounded).
 * The order of `a` and `b` does not matter.
 *
 * Month and year diffs use calendar arithmetic; sub-day units use millisecond arithmetic.
 *
 * @param a - First date.
 * @param b - Second date.
 * @param unit - The unit of the returned value.
 */
export function diff(a: DateInput, b: DateInput, unit: DateUnit): number {
  const da = toDate(a)
  const db = toDate(b)
  const ms = Math.abs(da.getTime() - db.getTime())
  switch (unit) {
    case 'millisecond':
      return ms
    case 'second':
      return Math.trunc(ms / 1e3)
    case 'minute':
      return Math.trunc(ms / 6e4)
    case 'hour':
      return Math.trunc(ms / 36e5)
    case 'day':
      return Math.trunc(ms / 864e5)
    case 'month': {
      const years = Math.abs(da.getFullYear() - db.getFullYear())
      const months = Math.abs(da.getMonth() - db.getMonth())
      return years * 12 + months
    }
    case 'year':
      return Math.abs(da.getFullYear() - db.getFullYear())
  }
}

/**
 * Returns `true` if `a` and `b` fall on the same calendar day (time is ignored).
 * @param a - First date.
 * @param b - Second date.
 */
export function isSameDay(a: DateInput, b: DateInput): boolean {
  const da = toDate(a)
  const db = toDate(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

/**
 * Returns `true` if `a` is strictly before `b`.
 * @param a - The earlier candidate.
 * @param b - The later candidate.
 */
export function isBefore(a: DateInput, b: DateInput): boolean {
  return toDate(a).getTime() < toDate(b).getTime()
}

/**
 * Returns `true` if `a` is strictly after `b`.
 * @param a - The later candidate.
 * @param b - The earlier candidate.
 */
export function isAfter(a: DateInput, b: DateInput): boolean {
  return toDate(a).getTime() > toDate(b).getTime()
}

/**
 * Clamps `input` to the range `[min, max]`.
 * Returns `min` if `input < min`, `max` if `input > max`, otherwise `input`.
 * @param input - The date to clamp.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive).
 */
export function clamp(input: DateInput, min: DateInput, max: DateInput): Date {
  const d = toDate(input).getTime()
  return new Date(Math.min(Math.max(d, toDate(min).getTime()), toDate(max).getTime()))
}
