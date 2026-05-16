import { describe, expect, it } from 'vitest'
import { deriveKey, hashPassword, verifyPassword } from '../src/pbkdf2.js'

// Use low iteration counts in tests to avoid slow suites.
// Production always uses the DEFAULT_ITERATIONS constant (600,000).
const FAST_ITERATIONS = 1000

// ─── deriveKey ───────────────────────────────────────────────────────────────

describe('deriveKey()', () => {
  it('returns a CryptoKey and a Uint8Array salt', async () => {
    const { key, salt } = await deriveKey({ password: 'pass', iterations: FAST_ITERATIONS })
    expect(key).toBeInstanceOf(CryptoKey)
    expect(salt).toBeInstanceOf(Uint8Array)
    expect(salt.byteLength).toBe(16)
  })

  it('generates a different salt on each call', async () => {
    const a = await deriveKey({ password: 'pass', iterations: FAST_ITERATIONS })
    const b = await deriveKey({ password: 'pass', iterations: FAST_ITERATIONS })
    expect(a.salt).not.toEqual(b.salt)
  })

  it('produces the same key for the same password and salt', async () => {
    const { salt } = await deriveKey({ password: 'pass', iterations: FAST_ITERATIONS })
    const { key: k1 } = await deriveKey({ password: 'pass', salt, iterations: FAST_ITERATIONS })
    const { key: k2 } = await deriveKey({ password: 'pass', salt, iterations: FAST_ITERATIONS })
    const [raw1, raw2] = await Promise.all([
      globalThis.crypto.subtle.exportKey('raw', k1),
      globalThis.crypto.subtle.exportKey('raw', k2),
    ])
    expect(new Uint8Array(raw1)).toEqual(new Uint8Array(raw2))
  })

  it('produces different keys for different passwords (same salt)', async () => {
    const { salt } = await deriveKey({ password: 'a', iterations: FAST_ITERATIONS })
    const { key: k1 } = await deriveKey({ password: 'a', salt, iterations: FAST_ITERATIONS })
    const { key: k2 } = await deriveKey({ password: 'b', salt, iterations: FAST_ITERATIONS })
    const [raw1, raw2] = await Promise.all([
      globalThis.crypto.subtle.exportKey('raw', k1),
      globalThis.crypto.subtle.exportKey('raw', k2),
    ])
    expect(new Uint8Array(raw1)).not.toEqual(new Uint8Array(raw2))
  })

  it('accepts a string salt', async () => {
    const { key } = await deriveKey({
      password: 'pass',
      salt: 'fixed-salt',
      iterations: FAST_ITERATIONS,
    })
    expect(key).toBeInstanceOf(CryptoKey)
  })
})

// ─── hashPassword / verifyPassword ───────────────────────────────────────────

describe('hashPassword() / verifyPassword()', () => {
  it('hashPassword returns a non-empty string', async () => {
    const hash = await hashPassword('my-password')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('hashPassword output contains four $-separated segments', async () => {
    const hash = await hashPassword('password')
    const parts = hash.split('$')
    expect(parts).toHaveLength(4)
    expect(parts[0]).toBe('pbkdf2-sha256')
  })

  it('hashPassword produces different hashes for the same password (random salt)', async () => {
    const a = await hashPassword('same')
    const b = await hashPassword('same')
    expect(a).not.toBe(b)
  })

  it('verifyPassword returns true for the correct password', async () => {
    const stored = await hashPassword('correct-horse-battery-staple')
    expect(await verifyPassword('correct-horse-battery-staple', stored)).toBe(true)
  })

  it('verifyPassword returns false for the wrong password', async () => {
    const stored = await hashPassword('correct-horse-battery-staple')
    expect(await verifyPassword('wrong-password', stored)).toBe(false)
  })

  it('verifyPassword returns false for an empty string against a real hash', async () => {
    const stored = await hashPassword('password')
    expect(await verifyPassword('', stored)).toBe(false)
  })

  it('verifyPassword returns false for a malformed stored hash', async () => {
    expect(await verifyPassword('password', 'not-a-hash')).toBe(false)
  })

  it('verifyPassword returns false for wrong algorithm prefix', async () => {
    const stored = await hashPassword('pass')
    const tampered = stored.replace('pbkdf2-sha256', 'sha1')
    expect(await verifyPassword('pass', tampered)).toBe(false)
  })

  it('verifyPassword returns false for a non-numeric iteration count', async () => {
    expect(await verifyPassword('pass', 'pbkdf2-sha256$NaN$aabbcc$ddeeff')).toBe(false)
  })

  it('verifyPassword returns false for invalid hex in salt or hash segments', async () => {
    expect(await verifyPassword('pass', 'pbkdf2-sha256$1000$not-hex$not-hex')).toBe(false)
  })
})
