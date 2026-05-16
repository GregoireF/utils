import { describe, expect, it } from 'vitest'
import { base64url, hex, toUint8Array } from '../src/encoding.js'

// ─── toUint8Array ─────────────────────────────────────────────────────────────

describe('toUint8Array()', () => {
  it('encodes a string to UTF-8 bytes', () => {
    const bytes = toUint8Array('hello')
    expect(bytes).toEqual(new Uint8Array([104, 101, 108, 108, 111]))
  })

  it('returns a Uint8Array as-is', () => {
    const input = new Uint8Array([1, 2, 3])
    expect(toUint8Array(input)).toBe(input)
  })

  it('wraps an ArrayBuffer', () => {
    const buf = new Uint8Array([7, 8]).buffer
    expect(toUint8Array(buf)).toEqual(new Uint8Array([7, 8]))
  })

  it('wraps a DataView', () => {
    const buf = new Uint8Array([10, 20]).buffer
    const view = new DataView(buf)
    expect(toUint8Array(view)).toEqual(new Uint8Array([10, 20]))
  })
})

// ─── hex ─────────────────────────────────────────────────────────────────────

describe('hex.encode()', () => {
  it('encodes known bytes to hex', () => {
    expect(hex.encode(new Uint8Array([0x00, 0xff, 0x0f]))).toBe('00ff0f')
  })

  it('encodes a string by UTF-8 then hex', () => {
    // 'ab' → [0x61, 0x62]
    expect(hex.encode('ab')).toBe('6162')
  })

  it('returns empty string for empty input', () => {
    expect(hex.encode(new Uint8Array([]))).toBe('')
  })
})

describe('hex.decode()', () => {
  it('decodes a hex string to bytes', () => {
    expect(hex.decode('00ff0f')).toEqual(new Uint8Array([0x00, 0xff, 0x0f]))
  })

  it('decodes uppercase hex', () => {
    expect(hex.decode('AABBCC')).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]))
  })

  it('returns empty Uint8Array for empty string', () => {
    expect(hex.decode('')).toEqual(new Uint8Array([]))
  })

  it('throws RangeError for odd-length string', () => {
    expect(() => hex.decode('abc')).toThrowError(RangeError)
  })

  it('throws RangeError for invalid hex characters', () => {
    expect(() => hex.decode('zz')).toThrowError(RangeError)
  })
})

describe('hex round-trip', () => {
  it('encodes and decodes back to original bytes', () => {
    const original = new Uint8Array([1, 2, 3, 255, 0, 128])
    expect(hex.decode(hex.encode(original))).toEqual(original)
  })
})

// ─── base64url ───────────────────────────────────────────────────────────────

describe('base64url.encode()', () => {
  it('encodes known bytes', () => {
    // [0xfb, 0xff, 0xfe] → 6-bit groups: 62,63,63,62 → standard '+//+' → url-safe '-__-'
    expect(base64url.encode(new Uint8Array([0xfb, 0xff, 0xfe]))).toBe('-__-')
  })

  it('encodes without padding', () => {
    // Single byte [1] → standard 'AQ==' → base64url 'AQ'
    expect(base64url.encode(new Uint8Array([1]))).toBe('AQ')
  })

  it('returns empty string for empty input', () => {
    expect(base64url.encode(new Uint8Array([]))).toBe('')
  })
})

describe('base64url.decode()', () => {
  it('decodes a base64url string without padding', () => {
    // '_7_-' → standard '/7/+' → 6-bit: 63,59,63,62 → [0xff, 0xbf, 0xfe]
    expect(base64url.decode('_7_-')).toEqual(new Uint8Array([0xff, 0xbf, 0xfe]))
  })

  it('decodes a base64url string with padding', () => {
    expect(base64url.decode('AQ==')).toEqual(new Uint8Array([1]))
  })

  it('returns empty Uint8Array for empty string', () => {
    expect(base64url.decode('')).toEqual(new Uint8Array([]))
  })
})

describe('base64url round-trip', () => {
  it('encodes and decodes back to original bytes', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255])
    expect(base64url.decode(base64url.encode(original))).toEqual(original)
  })
})
