# @gregoiref/crypto

## 0.2.0

### Minor Changes

- ✨ New package: `@gregoiref/crypto` — Web Crypto API utilities with zero dependencies.

  Works in Node.js 22+, Cloudflare Workers, Deno, Bun, and modern browsers.

  - **Encoding** — `hex` and `base64url` encode/decode for strings and `BufferSource`
  - **Hashing** — `digest` (SHA-1/256/384/512) and HMAC (`hmac`, `hmacVerify`) with constant-time verification
  - **Random** — `randomBytes`, `randomHex`, `randomBase64url` backed by `crypto.getRandomValues`
  - **AES-GCM** — `generateAesKey`, `encryptAes`, `decryptAes`, `exportAesKey`, `importAesKey`
  - **PBKDF2** — `deriveKey` for key derivation and `hashPassword` / `verifyPassword` for password storage (600 000 iterations, OWASP 2023)
