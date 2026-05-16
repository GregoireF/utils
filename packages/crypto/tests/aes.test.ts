import { describe, expect, it } from 'vitest'
import {
  decryptAes,
  encryptAes,
  exportAesKey,
  generateAesKey,
  importAesKey,
} from '../src/aes.js'

// ─── generateAesKey ──────────────────────────────────────────────────────────

describe('generateAesKey()', () => {
  it('generates a CryptoKey with AES-GCM algorithm', async () => {
    const key = await generateAesKey()
    expect(key.algorithm.name).toBe('AES-GCM')
  })

  it('defaults to 256-bit keys', async () => {
    const key = await generateAesKey()
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256)
  })

  it('generates 128-bit keys when requested', async () => {
    const key = await generateAesKey(128)
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(128)
  })

  it('generates different keys on each call', async () => {
    const k1 = await exportAesKey(await generateAesKey())
    const k2 = await exportAesKey(await generateAesKey())
    expect(k1).not.toBe(k2)
  })
})

// ─── exportAesKey / importAesKey ─────────────────────────────────────────────

describe('exportAesKey() / importAesKey()', () => {
  it('exports a key to a non-empty base64url string', async () => {
    const key = await generateAesKey()
    const exported = await exportAesKey(key)
    expect(typeof exported).toBe('string')
    expect(exported.length).toBeGreaterThan(0)
    expect(exported).not.toContain('=')
  })

  it('imports a previously exported key and produces the same bytes', async () => {
    const original = await generateAesKey()
    const exported = await exportAesKey(original)
    const imported = await importAesKey(exported)
    expect(await exportAesKey(imported)).toBe(exported)
  })
})

// ─── encryptAes / decryptAes ─────────────────────────────────────────────────

describe('encryptAes() / decryptAes()', () => {
  it('encrypts and decrypts back to the original plaintext', async () => {
    const key = await generateAesKey()
    const plaintext = 'Hello, World!'
    const ciphertext = await encryptAes(key, plaintext)
    expect(await decryptAes(key, ciphertext)).toBe(plaintext)
  })

  it('produces different ciphertext each call (due to random IV)', async () => {
    const key = await generateAesKey()
    const a = await encryptAes(key, 'same input')
    const b = await encryptAes(key, 'same input')
    expect(a).not.toBe(b)
  })

  it('ciphertext contains a separator dot', async () => {
    const key = await generateAesKey()
    const ct = await encryptAes(key, 'test')
    expect(ct).toContain('.')
    expect(ct.split('.').length).toBe(2)
  })

  it('handles empty plaintext', async () => {
    const key = await generateAesKey()
    const ciphertext = await encryptAes(key, '')
    expect(await decryptAes(key, ciphertext)).toBe('')
  })

  it('handles unicode plaintext', async () => {
    const key = await generateAesKey()
    const plaintext = '🔒 cipher: données sensibles'
    expect(await decryptAes(key, await encryptAes(key, plaintext))).toBe(plaintext)
  })

  it('throws when decrypting with a wrong key', async () => {
    const key1 = await generateAesKey()
    const key2 = await generateAesKey()
    const ciphertext = await encryptAes(key1, 'secret')
    await expect(decryptAes(key2, ciphertext)).rejects.toThrow()
  })

  it('throws for invalid ciphertext format (no separator)', async () => {
    const key = await generateAesKey()
    await expect(decryptAes(key, 'nodot')).rejects.toThrow(/Invalid ciphertext format/)
  })

  it('throws for invalid ciphertext format (empty parts)', async () => {
    const key = await generateAesKey()
    await expect(decryptAes(key, '.')).rejects.toThrow(/Invalid ciphertext format/)
  })
})
