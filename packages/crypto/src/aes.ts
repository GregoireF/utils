import { base64url, toUint8Array } from './encoding.js'
import { randomBytes } from './random.js'

// ─── Types ────────────────────────────────────────────────────────────────────

/** AES-GCM key lengths in bits. */
export type AesKeyBits = 128 | 192 | 256

/** Separator between IV and ciphertext in the serialised format. */
const SEPARATOR = '.'

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a new AES-GCM `CryptoKey`.
 * The key is non-extractable by default — use {@link exportAesKey} to persist it.
 *
 * @param bits - Key length in bits (default: 256).
 */
export async function generateAesKey(bits: AesKeyBits = 256): Promise<CryptoKey> {
  return globalThis.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: bits },
    true,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Exports a `CryptoKey` to a URL-safe base64 string for storage.
 * @throws {DOMException} if the key is non-extractable.
 */
export async function exportAesKey(key: CryptoKey): Promise<string> {
  const raw = await globalThis.crypto.subtle.exportKey('raw', key)
  return base64url.encode(raw)
}

/**
 * Imports a URL-safe base64 AES key string (as produced by {@link exportAesKey}).
 * @param encoded - Base64url-encoded raw key bytes.
 * @param bits - Key length to validate against. Inferred from the decoded length if omitted.
 */
export async function importAesKey(encoded: string): Promise<CryptoKey> {
  const raw = base64url.decode(encoded)
  return globalThis.crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: raw.byteLength * 8 },
    true,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypts a UTF-8 plaintext string with AES-GCM using a fresh random 12-byte IV.
 *
 * The serialised format is `<base64url_iv>.<base64url_ciphertext>`.
 * Both parts are needed for decryption — store the full string.
 *
 * @param key - An AES-GCM `CryptoKey` with `encrypt` usage.
 * @param plaintext - The string to encrypt.
 * @returns A combined `"iv.ciphertext"` string in URL-safe base64 (no padding).
 */
export async function encryptAes(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = randomBytes(12)
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    toUint8Array(plaintext),
  )
  return `${base64url.encode(iv)}${SEPARATOR}${base64url.encode(ciphertext)}`
}

/**
 * Decrypts a ciphertext string produced by {@link encryptAes}.
 *
 * @param key - The same AES-GCM `CryptoKey` used during encryption.
 * @param ciphertext - The combined `"iv.ciphertext"` string from {@link encryptAes}.
 * @returns The original plaintext string.
 * @throws {Error} if the format is invalid, or `DOMException` if decryption fails (wrong key / tampered).
 */
export async function decryptAes(key: CryptoKey, ciphertext: string): Promise<string> {
  const parts = ciphertext.split(SEPARATOR)
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid ciphertext format — expected "iv.ciphertext"')
  }
  const iv = base64url.decode(parts[0])
  const data = base64url.decode(parts[1])
  const plaintext = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  )
  return new TextDecoder().decode(plaintext)
}
