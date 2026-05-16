import { hex, toUint8Array } from './encoding.js'
import { randomBytes } from './random.js'

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * OWASP recommended iteration count for PBKDF2-SHA256 (2023).
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
const DEFAULT_ITERATIONS = 600_000

/** Salt length in bytes. 16 bytes = 128-bit entropy — NIST SP 800-132 recommendation. */
const SALT_BYTES = 16

/** Separator used in the serialised password hash format. */
const SEP = '$'

/** Serialised format version tag. */
const FORMAT = 'pbkdf2-sha256'

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Derives a 256-bit AES-GCM `CryptoKey` from `password` using PBKDF2-SHA256.
 * Generates a random salt if none is provided.
 *
 * Returns both the derived key and the salt so callers can store the salt for future verification.
 *
 * @param options.password - The password or passphrase to derive from.
 * @param options.salt - Optional salt (auto-generated if omitted).
 * @param options.iterations - PBKDF2 iteration count (default: 600,000 — OWASP 2023).
 */
export async function deriveKey(options: {
  password: string
  salt?: string | BufferSource
  iterations?: number
}): Promise<{ key: CryptoKey; salt: Uint8Array<ArrayBuffer> }> {
  const { password, salt: rawSalt, iterations = DEFAULT_ITERATIONS } = options
  const salt = rawSalt === undefined ? randomBytes(SALT_BYTES) : toUint8Array(rawSalt)

  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    toUint8Array(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  const key = await globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )

  return { key, salt }
}

/**
 * Hashes a password for storage using PBKDF2-SHA256 with a random salt.
 *
 * The returned string encodes all parameters needed for future verification:
 * `pbkdf2-sha256$<iterations>$<hex_salt>$<hex_hash>`
 *
 * @example
 * ```ts
 * const stored = await hashPassword('my-secret-password')
 * // 'pbkdf2-sha256$600000$a3f1...$9e4b...'
 * await db.users.update({ passwordHash: stored })
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    toUint8Array(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: DEFAULT_ITERATIONS },
    baseKey,
    256,
  )
  return [FORMAT, DEFAULT_ITERATIONS, hex.encode(salt), hex.encode(bits)].join(SEP)
}

/**
 * Verifies a plaintext `password` against a hash produced by {@link hashPassword}.
 * Uses constant-time comparison via `crypto.subtle.verify` to prevent timing attacks.
 *
 * @param password - The plaintext password to test.
 * @param stored - The hash string from {@link hashPassword}.
 * @returns `true` if the password matches.
 *
 * @example
 * ```ts
 * const valid = await verifyPassword(inputPassword, user.passwordHash)
 * if (!valid) throw new Error('Invalid credentials')
 * ```
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [format, iterStr, saltHex, hashHex] = stored.split(SEP)
  if (format !== FORMAT || !iterStr || !saltHex || !hashHex) return false

  const iterations = Number.parseInt(iterStr, 10)
  if (Number.isNaN(iterations) || iterations <= 0) return false

  let salt: Uint8Array<ArrayBuffer>
  let expectedHash: Uint8Array<ArrayBuffer>
  try {
    salt = hex.decode(saltHex)
    expectedHash = hex.decode(hashHex)
  } catch {
    return false
  }

  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    toUint8Array(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    baseKey,
    256,
  )

  // Constant-time comparison via HMAC:
  // Sign a fixed message with derivedBits as key, then verify the signature
  // using expectedHash as key. Returns true iff derivedBits === expectedHash.
  const fixedMsg = new Uint8Array(1)
  const derivedKey = await globalThis.crypto.subtle.importKey(
    'raw',
    derivedBits,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await globalThis.crypto.subtle.sign('HMAC', derivedKey, fixedMsg)
  const storedKey = await globalThis.crypto.subtle.importKey(
    'raw',
    expectedHash,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return globalThis.crypto.subtle.verify('HMAC', storedKey, signature, fixedMsg)
}
