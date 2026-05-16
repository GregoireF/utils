# @gregoiref/crypto

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Fcrypto%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Web Crypto API utilities — hashing, HMAC, AES-GCM, PBKDF2, random tokens. Zero dependencies.

Works in Node.js 22+, Cloudflare Workers, Deno, Bun, and modern browsers — anywhere the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) is available.

## Installation

```bash
pnpm add @gregoiref/crypto
```

> Requires GitHub Packages. Add to `.npmrc`:
> ```ini
> @gregoiref:registry=https://npm.pkg.github.com
> ```

---

## Encoding

```typescript
import { hex, base64url } from '@gregoiref/crypto'

hex.encode('hello')                        // '68656c6c6f'
hex.encode(new Uint8Array([0xff, 0x00]))   // 'ff00'
hex.decode('68656c6c6f')                   // Uint8Array([104, 101, 108, 108, 111])

base64url.encode('hello')                  // 'aGVsbG8'
base64url.decode('aGVsbG8')               // Uint8Array (UTF-8 bytes of 'hello')
```

Both accept `string` (UTF-8 encoded) or any `BufferSource` (ArrayBuffer, TypedArray, DataView).

---

## Hashing

```typescript
import { digest } from '@gregoiref/crypto'

const sha256 = await digest('SHA-256', 'hello')
// '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
```

Supported algorithms: `'SHA-1'` | `'SHA-256'` | `'SHA-384'` | `'SHA-512'`.

Always returns a lowercase hex string.

---

## HMAC (webhook validation)

```typescript
import { hmac, hmacVerify } from '@gregoiref/crypto'

// Compute a signature
const signature = await hmac('SHA-256', process.env.WEBHOOK_SECRET, payload)

// Validate an incoming webhook (GitHub, Stripe, etc.)
const trusted = `sha256=${signature}`
const incoming = request.headers.get('x-hub-signature-256') ?? ''
if (trusted !== incoming) throw new Error('Invalid webhook signature')

// Or use hmacVerify for constant-time comparison
const valid = await hmacVerify('SHA-256', secret, payload, receivedHex)
```

The `key` parameter accepts a `string`, `BufferSource`, or an existing `CryptoKey`.

`hmacVerify` uses the Web Crypto API's built-in constant-time comparison — safe against timing attacks.

---

## Random values

```typescript
import { randomBytes, randomHex, randomBase64url } from '@gregoiref/crypto'

randomBytes(32)       // Uint8Array(32) — cryptographically secure
randomHex()           // 64-char hex string (32 bytes)
randomHex(16)         // 32-char hex string (16 bytes)
randomBase64url()     // ~43-char URL-safe base64 string (32 bytes)
```

Backed by `crypto.getRandomValues` — no `Math.random()` involved.

---

## AES-GCM encryption

```typescript
import { generateAesKey, encryptAes, decryptAes, exportAesKey, importAesKey } from '@gregoiref/crypto'

// Generate and persist a key
const key = await generateAesKey()         // 256-bit by default
const stored = await exportAesKey(key)     // base64url string — store in env or KV

// Later: restore the key
const key = await importAesKey(stored)

// Encrypt / decrypt
const ciphertext = await encryptAes(key, 'sensitive data')
// 'iv.ciphertext' — base64url(12-byte IV) + '.' + base64url(AES-GCM output)

const plaintext = await decryptAes(key, ciphertext)
// 'sensitive data'
```

Each call to `encryptAes` uses a freshly generated random IV — the same plaintext produces a different ciphertext every time. Decryption fails with a `DOMException` if the key is wrong or the ciphertext is tampered.

---

## PBKDF2 key derivation

```typescript
import { deriveKey } from '@gregoiref/crypto'

// Derive an AES-GCM key from a password (with auto-generated salt)
const { key, salt } = await deriveKey({ password: 'user-passphrase' })
// Store salt (hex.encode(salt)) alongside your encrypted data

// Reproduce the exact same key later (for decryption)
const { key } = await deriveKey({ password: 'user-passphrase', salt })
```

Uses PBKDF2-SHA256 with 600,000 iterations ([OWASP 2023 recommendation](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)).

---

## Password hashing

```typescript
import { hashPassword, verifyPassword } from '@gregoiref/crypto'

// Hash at registration
const stored = await hashPassword('user-password')
// 'pbkdf2-sha256$600000$<hex_salt>$<hex_hash>'
await db.users.update({ id }, { passwordHash: stored })

// Verify at login
const valid = await verifyPassword(inputPassword, user.passwordHash)
if (!valid) throw new Error('Invalid credentials')
```

`verifyPassword` uses constant-time comparison (via Web Crypto HMAC) to prevent timing attacks.

> **Note:** For dedicated Node.js password storage at scale, consider `argon2` — it's memory-hard and more resistant to GPU attacks. PBKDF2 is used here because it's the only password KDF available in the standard Web Crypto API (required for Cloudflare Workers / browser compatibility).

---

## Related

- [`@gregoiref/result`](https://github.com/GregoireF/utils/tree/main/packages/result) — wrap crypto errors in `Result<T, E>` for no-throw error handling
- [`@gregoiref/env-validator`](https://github.com/GregoireF/utils/tree/main/packages/env-validator) — validate `WEBHOOK_SECRET`, `ENCRYPTION_KEY`, etc. at startup
