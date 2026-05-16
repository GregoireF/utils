import { hex, toUint8Array } from './encoding.js'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Algorithms supported by {@link digest}. */
export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

/** Algorithms supported by {@link hmac} and {@link hmacVerify}. SHA-1 is excluded intentionally. */
export type HmacAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

// ─── Internal ─────────────────────────────────────────────────────────────────

async function importHmacKey(
  key: string | BufferSource | CryptoKey,
  algorithm: HmacAlgorithm,
): Promise<CryptoKey> {
  if (key instanceof CryptoKey) return key
  return globalThis.crypto.subtle.importKey(
    'raw',
    toUint8Array(key),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign', 'verify'],
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes a cryptographic hash of `data` using the given algorithm.
 * Returns the digest as a lowercase hex string.
 *
 * @example
 * ```ts
 * const hash = await digest('SHA-256', 'hello')
 * // '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
 * ```
 */
export async function digest(
  algorithm: HashAlgorithm,
  data: string | BufferSource,
): Promise<string> {
  const buffer = await globalThis.crypto.subtle.digest(algorithm, toUint8Array(data))
  return hex.encode(buffer)
}

/**
 * Computes an HMAC signature over `data` using `key`.
 * Returns the signature as a lowercase hex string.
 *
 * The key can be a raw string (UTF-8 encoded), a `BufferSource`, or an existing `CryptoKey`.
 *
 * @example
 * ```ts
 * // Validate a GitHub webhook
 * const signature = await hmac('SHA-256', process.env.WEBHOOK_SECRET, payload)
 * const trusted = `sha256=${signature}`
 * ```
 */
export async function hmac(
  algorithm: HmacAlgorithm,
  key: string | BufferSource | CryptoKey,
  data: string | BufferSource,
): Promise<string> {
  const cryptoKey = await importHmacKey(key, algorithm)
  const buffer = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, toUint8Array(data))
  return hex.encode(buffer)
}

/**
 * Verifies an HMAC `signature` (hex string) over `data` using `key`.
 * Uses the Web Crypto API's constant-time comparison to prevent timing attacks.
 *
 * @param signature - Hex-encoded HMAC to verify against.
 * @returns `true` if the signature is valid.
 *
 * @example
 * ```ts
 * const valid = await hmacVerify('SHA-256', secret, payload, receivedSignature)
 * if (!valid) throw new Error('Invalid webhook signature')
 * ```
 */
export async function hmacVerify(
  algorithm: HmacAlgorithm,
  key: string | BufferSource | CryptoKey,
  data: string | BufferSource,
  signature: string,
): Promise<boolean> {
  const cryptoKey = await importHmacKey(key, algorithm)
  let sigBytes: Uint8Array
  try {
    sigBytes = (await import('./encoding.js')).hex.decode(signature)
  } catch {
    return false
  }
  return globalThis.crypto.subtle.verify('HMAC', cryptoKey, sigBytes, toUint8Array(data))
}
