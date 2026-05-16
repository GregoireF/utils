import { describe, expect, it } from 'vitest'
import { digest, hmac, hmacVerify } from '../src/hash.js'

// Known test vectors — independently verified against Node.js crypto module.
const SHA256_OF_HELLO = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
const SHA512_OF_HELLO =
  '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043'
// Note: the above constant is used only for length verification (128 hex chars = 64 bytes)
const HMAC_SHA256_SECRET_HELLO = '88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b'

// ─── digest ──────────────────────────────────────────────────────────────────

describe('digest()', () => {
  it('computes SHA-256 of a string', async () => {
    expect(await digest('SHA-256', 'hello')).toBe(SHA256_OF_HELLO)
  })

  it('computes SHA-256 of Uint8Array bytes', async () => {
    const bytes = new TextEncoder().encode('hello')
    expect(await digest('SHA-256', bytes)).toBe(SHA256_OF_HELLO)
  })

  it('computes SHA-512 of a string and returns 128-char hex', async () => {
    const result = await digest('SHA-512', 'hello')
    expect(result).toHaveLength(128)
    expect(result).toMatch(/^[0-9a-f]{128}$/)
  })

  it('returns lowercase hex', async () => {
    const result = await digest('SHA-256', 'hello')
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('returns different hashes for different inputs', async () => {
    const a = await digest('SHA-256', 'hello')
    const b = await digest('SHA-256', 'world')
    expect(a).not.toBe(b)
  })

  it('returns consistent results for the same input', async () => {
    expect(await digest('SHA-256', 'consistent')).toBe(await digest('SHA-256', 'consistent'))
  })
})

// ─── hmac ─────────────────────────────────────────────────────────────────────

describe('hmac()', () => {
  it('computes HMAC-SHA256 with a string key', async () => {
    expect(await hmac('SHA-256', 'secret', 'hello')).toBe(HMAC_SHA256_SECRET_HELLO)
  })

  it('computes HMAC-SHA256 with a BufferSource key', async () => {
    const key = new TextEncoder().encode('secret')
    expect(await hmac('SHA-256', key, 'hello')).toBe(HMAC_SHA256_SECRET_HELLO)
  })

  it('returns different signatures for different keys', async () => {
    const a = await hmac('SHA-256', 'key1', 'data')
    const b = await hmac('SHA-256', 'key2', 'data')
    expect(a).not.toBe(b)
  })

  it('returns different signatures for different data', async () => {
    const a = await hmac('SHA-256', 'key', 'data1')
    const b = await hmac('SHA-256', 'key', 'data2')
    expect(a).not.toBe(b)
  })

  it('returns lowercase hex', async () => {
    const result = await hmac('SHA-256', 'k', 'd')
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('accepts an existing CryptoKey', async () => {
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('secret'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    )
    expect(await hmac('SHA-256', key, 'hello')).toBe(HMAC_SHA256_SECRET_HELLO)
  })
})

// ─── hmacVerify ──────────────────────────────────────────────────────────────

describe('hmacVerify()', () => {
  it('returns true for a valid signature', async () => {
    const sig = await hmac('SHA-256', 'secret', 'payload')
    expect(await hmacVerify('SHA-256', 'secret', 'payload', sig)).toBe(true)
  })

  it('returns false for a tampered signature', async () => {
    const sig = await hmac('SHA-256', 'secret', 'payload')
    const tampered = sig.slice(0, -2) + 'ff'
    expect(await hmacVerify('SHA-256', 'secret', 'payload', tampered)).toBe(false)
  })

  it('returns false for a wrong key', async () => {
    const sig = await hmac('SHA-256', 'secret', 'payload')
    expect(await hmacVerify('SHA-256', 'wrong-key', 'payload', sig)).toBe(false)
  })

  it('returns false for tampered data', async () => {
    const sig = await hmac('SHA-256', 'secret', 'payload')
    expect(await hmacVerify('SHA-256', 'secret', 'tampered', sig)).toBe(false)
  })

  it('returns false for an invalid hex signature string', async () => {
    expect(await hmacVerify('SHA-256', 'secret', 'payload', 'not-valid-hex!!!')).toBe(false)
  })

  it('returns false for an odd-length hex string', async () => {
    expect(await hmacVerify('SHA-256', 'secret', 'payload', 'abc')).toBe(false)
  })
})
