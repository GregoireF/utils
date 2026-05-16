import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import {
  OperationTimeoutError,
  resultAll,
  resultSettled,
  withRetry,
  withTimeout,
} from '../src/async.js'
import { err, ok } from '../src/result.js'
import type { Result } from '../src/result.js'

// ─── resultAll ───────────────────────────────────────────────────────────────

describe('resultAll()', () => {
  it('returns Ok([]) for an empty array', async () => {
    const r = await resultAll([])
    expect(r).toEqual(ok([]))
  })

  it('returns Ok with all values when every promise resolves to Ok', async () => {
    const r = await resultAll([
      Promise.resolve(ok(1)),
      Promise.resolve(ok(2)),
      Promise.resolve(ok(3)),
    ])
    expect(r).toEqual(ok([1, 2, 3]))
  })

  it('returns the first Err when any promise resolves to Err', async () => {
    const firstError = new Error('first')
    const r = await resultAll([
      Promise.resolve(ok(1)),
      Promise.resolve(err(firstError)),
      Promise.resolve(err(new Error('second'))),
    ])
    expect(r).toEqual(err(firstError))
  })

  it('returns Err when all promises resolve to Err', async () => {
    const e = new Error('only')
    const r = await resultAll([Promise.resolve(err(e))])
    expect(r).toEqual(err(e))
  })

  it('infers the correct Ok type', async () => {
    const r = await resultAll([Promise.resolve(ok('a')), Promise.resolve(ok('b'))])
    expectTypeOf(r).toMatchTypeOf<Result<readonly string[], Error>>()
  })
})

// ─── resultSettled ───────────────────────────────────────────────────────────

describe('resultSettled()', () => {
  it('returns [] for an empty array', async () => {
    const r = await resultSettled([])
    expect(r).toEqual([])
  })

  it('returns all Ok values when every promise resolves to Ok', async () => {
    const r = await resultSettled([
      Promise.resolve(ok('a')),
      Promise.resolve(ok('b')),
    ])
    expect(r).toEqual([ok('a'), ok('b')])
  })

  it('returns all results when mixed Ok and Err', async () => {
    const e = new Error('fail')
    const r = await resultSettled([
      Promise.resolve(ok(1)),
      Promise.resolve(err(e)),
      Promise.resolve(ok(3)),
    ])
    expect(r).toEqual([ok(1), err(e), ok(3)])
  })

  it('returns all Err values when every promise resolves to Err', async () => {
    const e1 = new Error('a')
    const e2 = new Error('b')
    const r = await resultSettled([Promise.resolve(err(e1)), Promise.resolve(err(e2))])
    expect(r).toEqual([err(e1), err(e2)])
  })
})

// ─── withTimeout ─────────────────────────────────────────────────────────────

describe('withTimeout()', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns Ok when the promise resolves before the timeout', async () => {
    const promise = Promise.resolve(ok(42))
    const r = await withTimeout(promise, 1000)
    expect(r).toEqual(ok(42))
  })

  it('returns Err(OperationTimeoutError) when the timeout fires first', async () => {
    const neverResolves = new Promise<Result<never, never>>(() => {})
    const racePromise = withTimeout(neverResolves, 100)
    vi.advanceTimersByTime(100)
    const r = await racePromise
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toBeInstanceOf(OperationTimeoutError)
    expect(r.ok === false && (r.error as OperationTimeoutError).ms).toBe(100)
  })

  it('propagates an existing Err without waiting for the timeout', async () => {
    const e = new Error('upstream')
    const promise = Promise.resolve(err(e))
    const r = await withTimeout(promise, 1000)
    expect(r).toEqual(err(e))
  })

  it('OperationTimeoutError has correct message and name', () => {
    const te = new OperationTimeoutError(500)
    expect(te.message).toBe('Operation timed out after 500ms')
    expect(te.name).toBe('OperationTimeoutError')
    expect(te.ms).toBe(500)
    expect(te).toBeInstanceOf(Error)
  })

  it('infers the correct type', () => {
    const p: Promise<Result<string, TypeError>> = Promise.resolve(ok('x'))
    expectTypeOf(withTimeout(p, 100)).resolves.toMatchTypeOf<
      Result<string, TypeError | OperationTimeoutError>
    >()
  })
})

// ─── withRetry ───────────────────────────────────────────────────────────────

describe('withRetry()', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns Ok immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue(ok(1))
    const r = await withRetry(fn)
    expect(r).toEqual(ok(1))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries and returns Ok on a later attempt', async () => {
    const e = new Error('fail')
    const fn = vi
      .fn()
      .mockResolvedValueOnce(err(e))
      .mockResolvedValueOnce(err(e))
      .mockResolvedValue(ok('done'))

    const promise = withRetry(fn, { attempts: 3, delay: 100, factor: 1 })
    await vi.runAllTimersAsync()
    const r = await promise
    expect(r).toEqual(ok('done'))
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('returns the last Err after all attempts are exhausted', async () => {
    const e = new Error('always fails')
    const fn = vi.fn().mockResolvedValue(err(e))

    const promise = withRetry(fn, { attempts: 3, delay: 50, factor: 1 })
    await vi.runAllTimersAsync()
    const r = await promise
    expect(r).toEqual(err(e))
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('stops retrying early when shouldRetry returns false', async () => {
    const fatal = new Error('fatal — do not retry')
    const fn = vi.fn().mockResolvedValue(err(fatal))
    const shouldRetry = vi.fn().mockReturnValue(false)

    const r = await withRetry(fn, { attempts: 5, shouldRetry })
    expect(r).toEqual(err(fatal))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledTimes(1)
  })

  it('passes the zero-based attempt index to fn and shouldRetry', async () => {
    const e = new Error('e')
    const fn = vi.fn().mockResolvedValue(err(e))
    const shouldRetry = vi.fn().mockReturnValue(true)

    const promise = withRetry(fn, { attempts: 3, delay: 10, factor: 1, shouldRetry })
    await vi.runAllTimersAsync()
    await promise

    expect(fn).toHaveBeenNthCalledWith(1, 0)
    expect(fn).toHaveBeenNthCalledWith(2, 1)
    expect(fn).toHaveBeenNthCalledWith(3, 2)
    expect(shouldRetry).toHaveBeenNthCalledWith(1, e, 0)
    expect(shouldRetry).toHaveBeenNthCalledWith(2, e, 1)
  })

  it('applies exponential backoff between attempts', async () => {
    const e = new Error('e')
    const fn = vi.fn().mockResolvedValue(err(e))
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    const promise = withRetry(fn, { attempts: 3, delay: 100, factor: 3 })
    await vi.runAllTimersAsync()
    await promise

    // attempt 0 → attempt 1: delay * factor^0 = 100ms
    // attempt 1 → attempt 2: delay * factor^1 = 300ms
    const delays = setTimeoutSpy.mock.calls
      .filter(c => typeof c[1] === 'number' && (c[1] === 100 || c[1] === 300))
      .map(c => c[1])
    expect(delays).toContain(100)
    expect(delays).toContain(300)
  })

  it('uses defaults: 3 attempts, 500ms delay, factor 2', async () => {
    const e = new Error('e')
    const fn = vi.fn().mockResolvedValue(err(e))
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    const promise = withRetry(fn)
    await vi.runAllTimersAsync()
    await promise

    expect(fn).toHaveBeenCalledTimes(3)
    const delays = setTimeoutSpy.mock.calls
      .filter(c => c[1] === 500 || c[1] === 1000)
      .map(c => c[1])
    expect(delays).toContain(500)
    expect(delays).toContain(1000)
  })
})
