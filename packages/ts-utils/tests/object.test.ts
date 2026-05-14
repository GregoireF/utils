import { describe, expect, expectTypeOf, it } from 'vitest'
import { deepMerge, omit, pick } from '../src/object.js'

describe('pick()', () => {
  it('extracts the specified keys', () => {
    const obj = { a: 1, b: 'two', c: true }
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: true })
  })

  it('ignores keys not present on the object', () => {
    const obj = { a: 1, b: 2 }
    // @ts-expect-error — 'z' is not a key
    expect(pick(obj, ['a', 'z'])).toEqual({ a: 1 })
  })

  it('returns an empty object for an empty keys array', () => {
    expect(pick({ a: 1 }, [])).toEqual({})
  })

  it('infers the correct return type', () => {
    const obj = { a: 1, b: 'two', c: true }
    expectTypeOf(pick(obj, ['a', 'b'])).toMatchTypeOf<{ a: number; b: string }>()
  })
})

describe('omit()', () => {
  it('removes the specified keys', () => {
    const obj = { a: 1, b: 'two', c: true }
    expect(omit(obj, ['b'])).toEqual({ a: 1, c: true })
  })

  it('returns the original shape when keys array is empty', () => {
    const obj = { a: 1, b: 2 }
    expect(omit(obj, [])).toEqual(obj)
  })

  it('does not mutate the original object', () => {
    const obj = { a: 1, b: 2 }
    omit(obj, ['a'])
    expect(obj).toEqual({ a: 1, b: 2 })
  })

  it('infers the correct return type', () => {
    const obj = { a: 1, b: 'two', c: true }
    expectTypeOf(omit(obj, ['a'])).toMatchTypeOf<{ b: string; c: boolean }>()
  })
})

describe('deepMerge()', () => {
  it('merges flat objects', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 99 }
    expect(deepMerge(target, source)).toEqual({ a: 1, b: 99 })
  })

  it('deep-merges nested objects', () => {
    const target = { nested: { x: 1, y: 2 } }
    const source = { nested: { y: 99 } }
    expect(deepMerge(target, source)).toEqual({ nested: { x: 1, y: 99 } })
  })

  it('does not mutate the target', () => {
    const target = { a: 1 }
    deepMerge(target, { a: 2 })
    expect(target.a).toBe(1)
  })

  it('ignores undefined source values', () => {
    const target = { a: 1, b: 2 }
    const result = deepMerge(target, { b: undefined })
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('overwrites arrays (does not merge them)', () => {
    const target = { arr: [1, 2, 3] }
    const source = { arr: [4, 5] }
    expect(deepMerge(target, source)).toEqual({ arr: [4, 5] })
  })

  it('ignores prototype-poisoning keys', () => {
    const before = ({} as Record<string, unknown>)['evil']
    deepMerge({ a: 1 }, { ['__proto__' as never]: { evil: true } })
    expect(({} as Record<string, unknown>)['evil']).toBe(before)
  })
})
