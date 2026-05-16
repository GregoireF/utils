import { base64url, hex } from './encoding.js'

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates `length` cryptographically secure random bytes.
 * Backed by `crypto.getRandomValues` — available in Node 18+, Cloudflare Workers, and browsers.
 */
export function randomBytes(length: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(length))
}

/**
 * Generates a cryptographically secure random hex string.
 * @param byteLength - Number of random bytes (default: 32 → 64-character hex string).
 *
 * @example
 * ```ts
 * const token = randomHex()    // 64-char hex, suitable for session tokens
 * const short = randomHex(16)  // 32-char hex
 * ```
 */
export function randomHex(byteLength = 32): string {
  return hex.encode(randomBytes(byteLength))
}

/**
 * Generates a cryptographically secure random URL-safe base64 string (no padding).
 * @param byteLength - Number of random bytes (default: 32 → ~43-character base64url string).
 *
 * @example
 * ```ts
 * const token = randomBase64url()   // ~43 chars, URL-safe, suitable for API keys
 * ```
 */
export function randomBase64url(byteLength = 32): string {
  return base64url.encode(randomBytes(byteLength))
}
