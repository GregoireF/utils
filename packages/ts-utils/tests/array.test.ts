import { describe, expect, expectTypeOf, it } from 'vitest'
import { chunk, groupBy, unique, uniqueBy } from '../src/array.js'

describe('groupBy()', () => {
  it('groups items by the key function', () => {
    const items = [
      { type: 'a', val: 1 },
      { type: 'b', val: 2 },
      { type: 'a', val: 3 },
    ]
    expect(groupBy(items, (i) => i.type)).toEqual({
      a: [
        { type: 'a', val: 1 },
        { type: 'a', val: 3 },
      ],
      b: [{ type: 'b', val: 2 }],
    })
  })

  it('returns an empty object for an empty array', () => {
    expect(groupBy([], (i: { k: string }) => i.k)).toEqual({})
  })

  it('handles a single item', () => {
    expect(groupBy([{ k: 'x' }], (i) => i.k)).toEqual({ x: [{ k: 'x' }] })
  })

  it('infers the correct return type', () => {
    expectTypeOf(groupBy([1, 2], String)).toMatchTypeOf<Record<string, number[]>>()
  })
})

describe('chunk()', () => {
  it('splits an array into chunks of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns one chunk when size >= array length', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]])
  })

  it('returns an empty array for an empty input', () => {
    expect(chunk([], 3)).toEqual([])
  })

  it('handles chunk size of 1', () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]])
  })

  it('throws RangeError for size < 1', () => {
    expect(() => chunk([1, 2], 0)).toThrow(RangeError)
    expect(() => chunk([1, 2], -1)).toThrow(RangeError)
  })
})

describe('unique()', () => {
  it('removes duplicate primitives', () => {
    expect(unique([1, 2, 1, 3, 2])).toEqual([1, 2, 3])
  })

  it('preserves order of first occurrence', () => {
    expect(unique(['b', 'a', 'b', 'c'])).toEqual(['b', 'a', 'c'])
  })

  it('returns the same array when all elements are unique', () => {
    expect(unique([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('returns an empty array for empty input', () => {
    expect(unique([])).toEqual([])
  })
})

describe('uniqueBy()', () => {
  it('deduplicates by key function', () => {
    const items = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice (dup)' },
    ]
    expect(uniqueBy(items, (i) => i.id)).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
  })

  it('keeps first occurrence', () => {
    const items = [{ v: 'a' }, { v: 'b' }, { v: 'a' }]
    expect(uniqueBy(items, (i) => i.v)).toEqual([{ v: 'a' }, { v: 'b' }])
  })

  it('returns an empty array for empty input', () => {
    expect(uniqueBy([], (i: { id: number }) => i.id)).toEqual([])
  })
})
