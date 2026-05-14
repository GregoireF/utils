import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import {
  ResultError,
  err,
  flatMap,
  fromPromise,
  fromThrowable,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  unwrap,
  unwrapOr,
  unwrapOrElse,
} from '../src/result.js'
import type { Err, Ok, Result } from '../src/result.js'

// ─── Constructors ────────────────────────────────────────────────────────────

describe('ok()', () => {
  it('sets ok: true with the given value', () => {
    const r = ok(42)
    expect(r.ok).toBe(true)
    expect(r.value).toBe(42)
  })

  it('works with null and undefined', () => {
    expect(ok(null).value).toBeNull()
    expect(ok(undefined).value).toBeUndefined()
  })

  it('is readonly — value cannot be mutated', () => {
    const r = ok({ x: 1 })
    expect(() => {
      ;(r as { ok: boolean }).ok = false
    }).toThrow()
  })

  it('infers the correct type', () => {
    expectTypeOf(ok(1)).toMatchTypeOf<Ok<number>>()
    expectTypeOf(ok('hello')).toMatchTypeOf<Ok<string>>()
  })
})

describe('err()', () => {
  it('sets ok: false with the given error', () => {
    const r = err(new Error('oops'))
    expect(r.ok).toBe(false)
    expect(r.error).toBeInstanceOf(Error)
  })

  it('works with string errors', () => {
    const r = err('not found')
    expect(r.error).toBe('not found')
  })

  it('infers the correct type', () => {
    expectTypeOf(err(new Error())).toMatchTypeOf<Err<Error>>()
    expectTypeOf(err('msg')).toMatchTypeOf<Err<string>>()
  })
})

// ─── Type guards ─────────────────────────────────────────────────────────────

describe('isOk()', () => {
  it('returns true for Ok', () => {
    expect(isOk(ok(1))).toBe(true)
  })

  it('returns false for Err', () => {
    expect(isOk(err('e'))).toBe(false)
  })

  it('narrows the type to Ok<T>', () => {
    const r: Result<number, string> = ok(42)
    if (isOk(r)) {
      expectTypeOf(r).toMatchTypeOf<Ok<number>>()
      expectTypeOf(r.value).toBeNumber()
    }
  })
})

describe('isErr()', () => {
  it('returns true for Err', () => {
    expect(isErr(err('fail'))).toBe(true)
  })

  it('returns false for Ok', () => {
    expect(isErr(ok(1))).toBe(false)
  })

  it('narrows the type to Err<E>', () => {
    const r: Result<number, string> = err('oops')
    if (isErr(r)) {
      expectTypeOf(r).toMatchTypeOf<Err<string>>()
      expectTypeOf(r.error).toBeString()
    }
  })
})

// ─── Transformers ─────────────────────────────────────────────────────────────

describe('map()', () => {
  it('transforms the value of an Ok', () => {
    const r = map(ok(2), (n) => n * 3)
    expect(r).toEqual(ok(6))
  })

  it('passes Err through unchanged', () => {
    const e = err('fail')
    const r = map(e, (n: number) => n * 3)
    expect(r).toEqual(e)
  })

  it('infers the mapped type', () => {
    const r: Result<string, never> = map(ok(1), (n) => String(n))
    expect(isOk(r)).toBe(true)
  })
})

describe('mapErr()', () => {
  it('transforms the error of an Err', () => {
    const r = mapErr(err('raw'), (e) => new Error(e))
    expect(isErr(r)).toBe(true)
    expect((r as Err<Error>).error).toBeInstanceOf(Error)
  })

  it('passes Ok through unchanged', () => {
    const o = ok(42)
    expect(mapErr(o, () => 'new')).toEqual(o)
  })
})

describe('flatMap()', () => {
  it('chains Ok results', () => {
    const parse = (s: string): Result<number, string> =>
      Number.isNaN(Number(s)) ? err('NaN') : ok(Number(s))

    const r = flatMap(ok('42'), parse)
    expect(r).toEqual(ok(42))
  })

  it('short-circuits on first Err', () => {
    const r = flatMap(err('step1'), (_: number) => ok(99))
    expect(r).toEqual(err('step1'))
  })

  it('propagates inner Err', () => {
    const r = flatMap(ok('abc'), (s) => (Number.isNaN(Number(s)) ? err('NaN') : ok(Number(s))))
    expect(r).toEqual(err('NaN'))
  })
})

// ─── Extractors ───────────────────────────────────────────────────────────────

describe('unwrap()', () => {
  it('returns the value for Ok', () => {
    expect(unwrap(ok('hello'))).toBe('hello')
  })

  it('throws ResultError for Err', () => {
    expect(() => unwrap(err('boom'))).toThrowError(ResultError)
  })

  it('includes the original error in ResultError', () => {
    const originalError = new Error('original')
    try {
      unwrap(err(originalError))
    } catch (e) {
      expect(e).toBeInstanceOf(ResultError)
      expect((e as ResultError<Error>).error).toBe(originalError)
    }
  })

  it('ResultError has descriptive message', () => {
    try {
      unwrap(err('bad value'))
    } catch (e) {
      expect((e as Error).message).toContain('bad value')
    }
  })
})

describe('unwrapOr()', () => {
  it('returns value for Ok', () => {
    expect(unwrapOr(ok(5), 0)).toBe(5)
  })

  it('returns fallback for Err', () => {
    expect(unwrapOr(err('fail'), 99)).toBe(99)
  })
})

describe('unwrapOrElse()', () => {
  it('returns value for Ok', () => {
    expect(unwrapOrElse(ok(5), () => 0)).toBe(5)
  })

  it('calls fn with the error for Err', () => {
    const fn = vi.fn().mockReturnValue(42)
    const result = unwrapOrElse(err('oops'), fn)
    expect(result).toBe(42)
    expect(fn).toHaveBeenCalledWith('oops')
  })
})

// ─── Converters ───────────────────────────────────────────────────────────────

describe('fromThrowable()', () => {
  it('returns Ok when fn succeeds', () => {
    expect(fromThrowable(() => JSON.parse('{"a":1}'))).toEqual(ok({ a: 1 }))
  })

  it('returns Err with an Error when fn throws an Error', () => {
    const r = fromThrowable(() => JSON.parse('invalid'))
    expect(isErr(r)).toBe(true)
    expect((r as Err<Error>).error).toBeInstanceOf(Error)
  })

  it('wraps non-Error thrown values in an Error', () => {
    const r = fromThrowable(() => {
      throw 'string error'
    })
    expect(isErr(r)).toBe(true)
    expect((r as Err<Error>).error.message).toContain('string error')
  })
})

describe('fromPromise()', () => {
  it('returns Ok when promise resolves', async () => {
    const r = await fromPromise(Promise.resolve(42))
    expect(r).toEqual(ok(42))
  })

  it('returns Err when promise rejects with an Error', async () => {
    const r = await fromPromise(Promise.reject(new Error('async fail')))
    expect(isErr(r)).toBe(true)
    expect((r as Err<Error>).error.message).toBe('async fail')
  })

  it('wraps non-Error rejections in an Error', async () => {
    const r = await fromPromise(Promise.reject('string rejection'))
    expect(isErr(r)).toBe(true)
    expect((r as Err<Error>).error).toBeInstanceOf(Error)
  })
})

// ─── ResultError ──────────────────────────────────────────────────────────────

describe('ResultError', () => {
  it('is an instance of Error', () => {
    expect(new ResultError('x')).toBeInstanceOf(Error)
  })

  it('has name "ResultError"', () => {
    expect(new ResultError('x').name).toBe('ResultError')
  })

  it('exposes the original error via .error', () => {
    const originalError = { code: 404 }
    const re = new ResultError(originalError)
    expect(re.error).toBe(originalError)
  })
})
