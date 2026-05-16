import { describe, expect, it } from 'vitest'
import { randomBase64url, randomBytes, randomHex } from '../src/random.js'

// ─── randomBytes ─────────────────────────────────────────────────────────────

describe('randomBytes()', () => {
  it('returns a Uint8Array of the requested length', () => {
    expect(randomBytes(16)).toHaveLength(16)
    expect(randomBytes(32)).toHaveLength(32)
    expect(randomBytes(0)).toHaveLength(0)
  })

  it('returns different values on each call', () => {
    const a = randomBytes(32)
    const b = randomBytes(32)
    expect(a).not.toEqual(b)
  })
})

// ─── randomHex ───────────────────────────────────────────────────────────────

describe('randomHex()', () => {
  it('returns a 64-character hex string by default (32 bytes)', () => {
    const token = randomHex()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns a hex string of the correct length for custom byte counts', () => {
    expect(randomHex(16)).toHaveLength(32)
    expect(randomHex(1)).toHaveLength(2)
  })

  it('returns different values on each call', () => {
    expect(randomHex()).not.toBe(randomHex())
  })
})

// ─── randomBase64url ─────────────────────────────────────────────────────────

describe('randomBase64url()', () => {
  it('returns a URL-safe base64 string without padding by default', () => {
    const token = randomBase64url()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token).not.toContain('=')
    expect(token).not.toContain('+')
    expect(token).not.toContain('/')
  })

  it('returns approximately the expected length (32 bytes → ~43 chars)', () => {
    const token = randomBase64url()
    // ceil(32 * 4 / 3) = 43 chars without padding
    expect(token.length).toBeGreaterThanOrEqual(42)
    expect(token.length).toBeLessThanOrEqual(44)
  })

  it('returns different values on each call', () => {
    expect(randomBase64url()).not.toBe(randomBase64url())
  })

  it('accepts custom byte lengths', () => {
    const token16 = randomBase64url(16)
    expect(token16.length).toBeGreaterThanOrEqual(21)
    expect(token16.length).toBeLessThanOrEqual(22)
  })
})
