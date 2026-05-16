// ─── Internal helpers ─────────────────────────────────────────────────────────

const encoder = new TextEncoder()

/** Converts a string or any BufferSource to Uint8Array without copying when possible. */
export function toUint8Array(input: string | BufferSource): Uint8Array<ArrayBuffer> {
  if (typeof input === 'string') return encoder.encode(input)
  if (input instanceof Uint8Array) return new Uint8Array(input)
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBuffer(str: string): Uint8Array<ArrayBuffer> {
  if (str.length % 2 !== 0) throw new RangeError('Hex string length must be even')
  const bytes = new Uint8Array(str.length / 2)
  for (let i = 0; i < str.length; i += 2) {
    const byte = parseInt(str.slice(i, i + 2), 16)
    if (Number.isNaN(byte)) throw new RangeError(`Invalid hex character at position ${i}`)
    bytes[i / 2] = byte
  }
  return bytes
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  let binary = ''
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBuffer(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Hex encoding and decoding utilities.
 * Accepts strings (UTF-8 encoded) or any `BufferSource` (ArrayBuffer, TypedArray, DataView).
 */
export const hex = {
  /** Encodes data to a lowercase hex string. */
  encode(data: string | BufferSource): string {
    const bytes = toUint8Array(data)
    return bufferToHex(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  },

  /**
   * Decodes a lowercase or uppercase hex string to a `Uint8Array`.
   * @throws {RangeError} if the string has an odd number of characters or invalid hex digits.
   */
  decode: hexToBuffer,
}

/**
 * URL-safe base64 encoding and decoding utilities (RFC 4648 §5, no padding).
 * Accepts strings (UTF-8 encoded) or any `BufferSource`.
 */
export const base64url = {
  /** Encodes data to a URL-safe base64 string without padding. */
  encode(data: string | BufferSource): string {
    const bytes = toUint8Array(data)
    return bufferToBase64url(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  },

  /** Decodes a URL-safe base64 string (with or without `=` padding) to a `Uint8Array`. */
  decode: base64urlToBuffer,
}
