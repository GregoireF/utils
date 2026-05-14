# @gregoiref/date

![npm version](https://img.shields.io/npm/v/@gregoiref/date)
![license](https://img.shields.io/npm/l/@gregoiref/date)
![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

Lightweight date utilities for TypeScript — format, diff, add, clamp — zero dependencies.

## Why

`date-fns` is excellent but adds \~20 kB to your bundle for a typical import set. For most projects, you only need half a dozen operations. This package covers the common cases with a tiny footprint and no dependencies, using the native `Date` API directly.

All functions accept `Date | string | number` as input and always return a new `Date` — no mutation.

## Installation

```bash
pnpm add @gregoiref/date
```

## API

| Function | Signature | Description |
|---|---|---|
| `format(input, pattern)` | `(DateInput, string) → string` | Format with token pattern |
| `startOf(input, unit)` | `(DateInput, DateUnit) → Date` | Start of the given unit |
| `add(input, amount, unit)` | `(DateInput, number, DateUnit) → Date` | Add (or subtract) units |
| `diff(a, b, unit)` | `(DateInput, DateInput, DateUnit) → number` | Absolute diff, truncated |
| `isSameDay(a, b)` | `(DateInput, DateInput) → boolean` | Same calendar day? |
| `isBefore(a, b)` | `(DateInput, DateInput) → boolean` | Strictly before? |
| `isAfter(a, b)` | `(DateInput, DateInput) → boolean` | Strictly after? |
| `clamp(input, min, max)` | `(DateInput, DateInput, DateInput) → Date` | Clamp to `[min, max]` |

### `DateUnit`

`'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'`

### `format` tokens (local time)

| Token | Output |
|---|---|
| `YYYY` | 4-digit year |
| `MM` | 2-digit month (01–12) |
| `DD` | 2-digit day (01–31) |
| `HH` | 2-digit hours (00–23) |
| `mm` | 2-digit minutes (00–59) |
| `ss` | 2-digit seconds (00–59) |
| `SSS` | 3-digit milliseconds (000–999) |

## Usage

```ts
import { format, startOf, add, diff, isSameDay, isBefore, isAfter, clamp } from '@gregoiref/date'

const d = new Date('2024-03-15T14:30:00')

// ── Format ──────────────────────────────────────────────────────────────────
format(d, 'YYYY-MM-DD')           // '2024-03-15'
format(d, 'HH:mm:ss')            // '14:30:00'
format(d, 'DD/MM/YYYY HH:mm')    // '15/03/2024 14:30'

// ── Boundaries ──────────────────────────────────────────────────────────────
startOf(d, 'day')    // 2024-03-15 00:00:00.000
startOf(d, 'month')  // 2024-03-01 00:00:00.000
startOf(d, 'year')   // 2024-01-01 00:00:00.000

// ── Arithmetic ──────────────────────────────────────────────────────────────
add(d, 1, 'day')     // 2024-03-16T14:30:00
add(d, -2, 'month')  // 2024-01-15T14:30:00
add(d, 90, 'minute') // 2024-03-15T16:00:00

// ── Comparison ──────────────────────────────────────────────────────────────
const a = new Date('2024-01-01')
const b = new Date('2024-06-15')

diff(a, b, 'day')    // 166
diff(a, b, 'month')  // 5

isBefore(a, b)       // true
isAfter(a, b)        // false
isSameDay(a, a)      // true

// ── Clamp ───────────────────────────────────────────────────────────────────
const min = new Date('2024-01-01')
const max = new Date('2024-12-31')
clamp(new Date('2025-03-01'), min, max) // 2024-12-31
```

## Limitations

- All operations use **local time**, not UTC. For UTC-based formatting, convert with `toISOString()` instead.
- `diff('month')` and `diff('year')` use calendar arithmetic (year/month fields), not exact milliseconds. For exact sub-day differences, use `diff('day')` or smaller.
- `format` tokens are matched left-to-right and replaced once — a pattern like `'mm-MM'` works correctly, but overlapping tokens could behave unexpectedly.
- No locale support. For internationalised dates, use `Intl.DateTimeFormat`.
