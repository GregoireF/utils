import { describe, expect, it } from 'vitest'
import { add, clamp, diff, format, isAfter, isBefore, isSameDay, startOf } from '../src/date.js'

// Fixed reference date: 2026-03-15 14:30:45.123 (local time)
const REF = new Date(2026, 2, 15, 14, 30, 45, 123)

// ─── format() ────────────────────────────────────────────────────────────────

describe('format()', () => {
  it('formats YYYY-MM-DD', () => {
    expect(format(REF, 'YYYY-MM-DD')).toBe('2026-03-15')
  })

  it('formats HH:mm:ss', () => {
    expect(format(REF, 'HH:mm:ss')).toBe('14:30:45')
  })

  it('formats milliseconds with SSS', () => {
    expect(format(REF, 'SSS')).toBe('123')
  })

  it('formats a full ISO-like pattern', () => {
    expect(format(REF, 'YYYY-MM-DD HH:mm:ss.SSS')).toBe('2026-03-15 14:30:45.123')
  })

  it('accepts a timestamp number as input', () => {
    expect(format(REF.getTime(), 'YYYY-MM-DD')).toBe('2026-03-15')
  })

  it('accepts a date string as input', () => {
    expect(format('2026-01-01T00:00:00.000Z', 'YYYY')).toMatch(/^20/)
  })

  it('throws RangeError for an invalid date string', () => {
    expect(() => format('not-a-date', 'YYYY')).toThrow(RangeError)
  })
})

// ─── startOf() ───────────────────────────────────────────────────────────────

describe('startOf()', () => {
  it('start of year — Jan 1 00:00:00', () => {
    const d = startOf(REF, 'year')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(0)
  })

  it('start of month — 1st at 00:00:00', () => {
    const d = startOf(REF, 'month')
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(0)
  })

  it('start of day — same date at 00:00:00', () => {
    const d = startOf(REF, 'day')
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
  })

  it('start of hour — same hour at :00:00', () => {
    const d = startOf(REF, 'hour')
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
  })

  it('start of minute — same minute at :00', () => {
    const d = startOf(REF, 'minute')
    expect(d.getMinutes()).toBe(30)
    expect(d.getSeconds()).toBe(0)
  })

  it('start of second — truncates milliseconds', () => {
    const d = startOf(REF, 'second')
    expect(d.getSeconds()).toBe(45)
    expect(d.getMilliseconds()).toBe(0)
  })

  it('start of millisecond — returns a copy of the date', () => {
    const d = startOf(REF, 'millisecond')
    expect(d.getTime()).toBe(REF.getTime())
    expect(d).not.toBe(REF)
  })
})

// ─── add() ───────────────────────────────────────────────────────────────────

describe('add()', () => {
  it('adds years', () => {
    expect(add(REF, 2, 'year').getFullYear()).toBe(2028)
  })

  it('adds months', () => {
    expect(add(REF, 3, 'month').getMonth()).toBe(5)
  })

  it('adds days', () => {
    expect(add(REF, 10, 'day').getDate()).toBe(25)
  })

  it('adds hours', () => {
    expect(add(REF, 2, 'hour').getHours()).toBe(16)
  })

  it('adds minutes', () => {
    expect(add(REF, 15, 'minute').getMinutes()).toBe(45)
  })

  it('adds seconds', () => {
    expect(add(REF, 30, 'second').getSeconds()).toBe(15)
  })

  it('adds milliseconds', () => {
    expect(add(REF, 500, 'millisecond').getMilliseconds()).toBe(623)
  })

  it('subtracts with negative amounts', () => {
    expect(add(REF, -1, 'year').getFullYear()).toBe(2025)
  })

  it('does not mutate the input', () => {
    const original = REF.getTime()
    add(REF, 1, 'day')
    expect(REF.getTime()).toBe(original)
  })
})

// ─── diff() ──────────────────────────────────────────────────────────────────

describe('diff()', () => {
  const a = new Date(2026, 0, 1)
  const b = new Date(2026, 0, 11)

  it('returns absolute difference in days', () => {
    expect(diff(a, b, 'day')).toBe(10)
    expect(diff(b, a, 'day')).toBe(10)
  })

  it('returns difference in hours', () => {
    expect(diff(a, b, 'hour')).toBe(240)
  })

  it('returns difference in minutes', () => {
    expect(diff(a, b, 'minute')).toBe(14400)
  })

  it('returns difference in seconds', () => {
    expect(diff(a, b, 'second')).toBe(864000)
  })

  it('returns difference in milliseconds', () => {
    expect(diff(a, b, 'millisecond')).toBe(864000000)
  })

  it('returns difference in months', () => {
    const jan = new Date(2026, 0, 1)
    const apr = new Date(2026, 3, 1)
    expect(diff(jan, apr, 'month')).toBe(3)
  })

  it('returns difference in years', () => {
    const y2024 = new Date(2024, 0, 1)
    const y2026 = new Date(2026, 0, 1)
    expect(diff(y2024, y2026, 'year')).toBe(2)
  })

  it('truncates partial units', () => {
    const x = new Date(2026, 0, 1, 0, 0, 0)
    const y = new Date(2026, 0, 1, 1, 30, 0)
    expect(diff(x, y, 'hour')).toBe(1)
  })
})

// ─── isSameDay() ─────────────────────────────────────────────────────────────

describe('isSameDay()', () => {
  it('returns true for the same day', () => {
    expect(isSameDay(new Date(2026, 0, 15, 9, 0), new Date(2026, 0, 15, 23, 59))).toBe(true)
  })

  it('returns false for different days', () => {
    expect(isSameDay(new Date(2026, 0, 15), new Date(2026, 0, 16))).toBe(false)
  })

  it('returns false for different months', () => {
    expect(isSameDay(new Date(2026, 0, 15), new Date(2026, 1, 15))).toBe(false)
  })
})

// ─── isBefore() / isAfter() ──────────────────────────────────────────────────

describe('isBefore()', () => {
  it('returns true when a < b', () => {
    expect(isBefore(new Date(2025, 0, 1), new Date(2026, 0, 1))).toBe(true)
  })

  it('returns false when a === b', () => {
    expect(isBefore(REF, REF)).toBe(false)
  })

  it('returns false when a > b', () => {
    expect(isBefore(new Date(2026, 0, 1), new Date(2025, 0, 1))).toBe(false)
  })
})

describe('isAfter()', () => {
  it('returns true when a > b', () => {
    expect(isAfter(new Date(2026, 0, 1), new Date(2025, 0, 1))).toBe(true)
  })

  it('returns false when a === b', () => {
    expect(isAfter(REF, REF)).toBe(false)
  })

  it('returns false when a < b', () => {
    expect(isAfter(new Date(2025, 0, 1), new Date(2026, 0, 1))).toBe(false)
  })
})

// ─── clamp() ─────────────────────────────────────────────────────────────────

describe('clamp()', () => {
  const min = new Date(2026, 0, 1)
  const max = new Date(2026, 11, 31)

  it('returns the date unchanged when within range', () => {
    expect(clamp(REF, min, max).getTime()).toBe(REF.getTime())
  })

  it('clamps to min when date is before min', () => {
    const before = new Date(2025, 0, 1)
    expect(clamp(before, min, max).getTime()).toBe(min.getTime())
  })

  it('clamps to max when date is after max', () => {
    const after = new Date(2027, 0, 1)
    expect(clamp(after, min, max).getTime()).toBe(max.getTime())
  })
})
