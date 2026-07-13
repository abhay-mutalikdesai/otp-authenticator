import type { Encoding } from '../types'

/** Base32 alphabet (RFC 4648) */
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function decodeBase32(input: string): Uint8Array {
  const str = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')
  const bytes: number[] = []
  let bits = 0
  let value = 0
  for (const char of str) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx < 0) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(bytes)
}

function decodeBase64(input: string): Uint8Array {
  const str = input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  const binary = atob(str)
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)))
}

function decodeHex(input: string): Uint8Array {
  const str = input.replace(/\s/g, '')
  const bytes: number[] = []
  for (let i = 0; i < str.length; i += 2) {
    bytes.push(parseInt(str.slice(i, i + 2), 16))
  }
  return new Uint8Array(bytes)
}

export function detectEncoding(secret: string): Encoding {
  const s = secret.trim().toUpperCase().replace(/=+$/, '')
  // Base32 is checked first and wins any ambiguity (e.g. a string made up only of A-F/2-7,
  // which is valid as both hex and Base32) since it's the standard encoding for OTP secrets
  // (Google Authenticator, Microsoft Authenticator, etc.) — hex secrets are comparatively rare
  // and will still be detected correctly as long as they contain any digit outside 2-7.
  if (/^[A-Z2-7]+$/.test(s)) return 'base32'
  if (/^[0-9A-F]+$/.test(s) && s.length % 2 === 0) return 'hex'
  return 'base64'
}

export function decodeSecret(secret: string, encoding: Encoding = 'auto'): Uint8Array {
  const s = secret.trim()
  const effective = encoding === 'auto' ? detectEncoding(s) : encoding
  switch (effective) {
    case 'base32': return decodeBase32(s)
    case 'base64': return decodeBase64(s)
    case 'hex':    return decodeHex(s)
    default:       return decodeBase32(s)
  }
}
