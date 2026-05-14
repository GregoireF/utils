import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce, memoize, sleep } from '../src/function.js'

describe('debounce()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call fn before the delay', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)
    debounced()
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls fn after the delay', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)
    debounced()
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets the timer on each call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 200)
    debounced()
    vi.advanceTimersByTime(100)
    debounced()
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('passes the last arguments to fn', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('first')
    debounced('last')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('last')
  })
})

describe('sleep()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after the specified delay', async () => {
    const resolved = vi.fn()
    sleep(500).then(resolved)
    expect(resolved).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(500)
    expect(resolved).toHaveBeenCalledOnce()
  })

  it('returns a Promise<void>', () => {
    const result = sleep(0)
    expect(result).toBeInstanceOf(Promise)
  })
})

describe('memoize()', () => {
  it('returns the same result for identical arguments', () => {
    const fn = vi.fn((n: number) => n * 2)
    const memo = memoize(fn)
    expect(memo(5)).toBe(10)
    expect(memo(5)).toBe(10)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('calls fn again for different arguments', () => {
    const fn = vi.fn((n: number) => n * 2)
    const memo = memoize(fn)
    memo(1)
    memo(2)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('works with multiple arguments', () => {
    const fn = vi.fn((a: number, b: number) => a + b)
    const memo = memoize(fn)
    expect(memo(1, 2)).toBe(3)
    expect(memo(1, 2)).toBe(3)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('distinguishes different argument shapes', () => {
    const fn = vi.fn((a: number, b: number) => a + b)
    const memo = memoize(fn)
    memo(1, 2)
    memo(2, 1)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
