/**
 * otpauth:// URI parser
 * Format: otpauth://TYPE/LABEL?PARAMETERS
 */
import type { OtpEntry, OtpType, Algorithm, Encoding } from '../types'

type PartialEntry = Omit<OtpEntry, 'id' | 'favourite' | 'order' | 'createdAt'>

/**
 * Parse an otpauth:// URI into a partial entry object
 */
export function parseOtpauthUri(uri: string): PartialEntry {
  try {
    const url = new URL(uri)
    if (url.protocol !== 'otpauth:') throw new Error('Not an otpauth URI')

    const type = url.hostname.toLowerCase() as OtpType
    if (!['totp', 'hotp'].includes(type)) throw new Error('Invalid type')

    const label = decodeURIComponent(url.pathname.slice(1))
    let issuer = ''
    let account = label

    if (label.includes(':')) {
      const parts = label.split(':')
      issuer = parts[0].trim()
      account = parts.slice(1).join(':').trim()
    }

    const params = url.searchParams
    const secret = params.get('secret') ?? ''
    const issuerParam = params.get('issuer') ?? ''
    const algorithm = (params.get('algorithm') ?? 'SHA1').toUpperCase() as Algorithm
    const digits = parseInt(params.get('digits') ?? '6', 10)
    const period = parseInt(params.get('period') ?? '30', 10)
    const counter = parseInt(params.get('counter') ?? '0', 10)

    return {
      type,
      issuer: issuerParam || issuer,
      account,
      secret,
      encoding: 'base32' as Encoding,
      algorithm,
      digits,
      period,
      counter,
    }
  } catch (e) {
    throw new Error(`Invalid otpauth URI: ${(e as Error).message}`)
  }
}

/**
 * Build an otpauth:// URI from an entry
 */
export function buildOtpauthUri(entry: OtpEntry): string {
  const label = entry.issuer
    ? `${encodeURIComponent(entry.issuer)}:${encodeURIComponent(entry.account)}`
    : encodeURIComponent(entry.account)

  const params = new URLSearchParams({
    secret: entry.secret,
    issuer: entry.issuer ?? '',
    algorithm: entry.algorithm ?? 'SHA1',
    digits: String(entry.digits ?? 6),
  })

  if (entry.type === 'totp') {
    params.set('period', String(entry.period ?? 30))
  } else {
    params.set('counter', String(entry.counter ?? 0))
  }

  return `otpauth://${entry.type}/${label}?${params.toString()}`
}
