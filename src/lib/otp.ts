/**
 * OTP Engine — TOTP (RFC 6238) + HOTP (RFC 4226)
 */
import type { Algorithm, Encoding, OtpEntry, ValidationResult } from '../types'
import { hmac } from './cryptoUtils'
import { decodeSecret } from './secretDecoder'

/** Convert a number to an 8-byte big-endian Uint8Array */
function toBigEndian8(num: number): Uint8Array {
  const bytes = new Uint8Array(8)
  let val = BigInt(Math.floor(num))
  for (let i = 7; i >= 0; i--) {
    bytes[i] = Number(val & 0xffn)
    val >>= 8n
  }
  return bytes
}

interface HotpOptions {
  algorithm?: Algorithm
  digits?: number
}

interface TotpOptions extends HotpOptions {
  period?: number
}

/**
 * Core HOTP generation (RFC 4226)
 */
export async function generateHOTP(
  secretBytes: Uint8Array,
  counter: number,
  { algorithm = 'SHA1', digits = 6 }: HotpOptions = {}
): Promise<string> {
  const counterBytes = toBigEndian8(counter)
  const hmacBytes = await hmac(algorithm, secretBytes, counterBytes)

  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f
  const code =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff)

  const otp = code % Math.pow(10, digits)
  return String(otp).padStart(digits, '0')
}

/**
 * TOTP generation (RFC 6238)
 */
export async function generateTOTP(
  secretBytes: Uint8Array,
  { algorithm = 'SHA1', digits = 6, period = 30 }: TotpOptions = {}
): Promise<string> {
  const T = Math.floor(Date.now() / 1000 / period)
  return generateHOTP(secretBytes, T, { algorithm, digits })
}

/**
 * Generate OTP for an entry object (handles both TOTP and HOTP)
 */
export async function generateOTP(entry: OtpEntry): Promise<string> {
  try {
    const secretBytes = decodeSecret(entry.secret, entry.encoding)
    const opts = {
      algorithm: entry.algorithm ?? 'SHA1',
      digits: entry.digits ?? 6,
      period: entry.period ?? 30,
    }
    if (entry.type === 'hotp') {
      return generateHOTP(secretBytes, entry.counter ?? 0, opts)
    }
    return generateTOTP(secretBytes, opts)
  } catch {
    return '------'
  }
}

/** Get time remaining in current TOTP period (seconds) */
export function getSecondsRemaining(period = 30): number {
  return period - (Math.floor(Date.now() / 1000) % period)
}

/** Get progress fraction (0→1) within current TOTP period */
export function getProgress(period = 30): number {
  return getSecondsRemaining(period) / period
}

/**
 * Validate that a secret can be decoded and preview OTP
 */
export async function validateAndPreview(
  secret: string,
  encoding: Encoding,
  opts: Partial<OtpEntry> = {}
): Promise<ValidationResult> {
  try {
    const bytes = decodeSecret(secret, encoding)
    if (bytes.length === 0) throw new Error('Empty secret after decoding')
    const { algorithm = 'SHA1', digits = 6, period = 30, type = 'totp', counter = 0 } = opts
    let preview: string
    if (type === 'hotp') {
      preview = await generateHOTP(bytes, counter, { algorithm, digits })
    } else {
      preview = await generateTOTP(bytes, { algorithm, digits, period })
    }
    return { valid: true, preview, error: null }
  } catch (e) {
    return { valid: false, preview: null, error: (e as Error).message }
  }
}
