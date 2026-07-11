/**
 * Parses pasted/uploaded import text (JSON export or otpauth:// URI lines) into entry data,
 * without persisting anything. Kept separate from the UI so the "is this text importable?"
 * check (used to enable/disable the Import button) and the actual import share one code path.
 */
import type { Algorithm, Encoding, OtpEntry } from '../types'
import { parseOtpauthUri } from './otpauthUri'

export type ParsedImportEntry = Omit<OtpEntry, 'id' | 'favourite' | 'order' | 'createdAt'>

export interface ParsedImport {
  entries: ParsedImportEntry[]
  error: string | null
}

function fromJsonRecord(raw: unknown): ParsedImportEntry {
  const e = raw as Record<string, unknown>
  if (!e || typeof e !== 'object' || !e.secret || !e.account) {
    throw new Error('Each entry needs at least "account" and "secret"')
  }
  return {
    type: e.type === 'hotp' ? 'hotp' : 'totp',
    issuer: typeof e.issuer === 'string' ? e.issuer : '',
    account: String(e.account),
    secret: String(e.secret),
    encoding: (e.encoding as Encoding) || 'auto',
    algorithm: (e.algorithm as Algorithm) || 'SHA256',
    digits: Number(e.digits) || 6,
    period: Number(e.period) || 30,
    counter: Number(e.counter) || 0,
  }
}

/** Parse import text without side effects. Returns an empty, error-free result for blank input. */
export function parseImportText(text: string): ParsedImport {
  const t = text.trim()
  if (!t) return { entries: [], error: null }

  try {
    if (t.startsWith('[') || t.startsWith('{')) {
      const data = JSON.parse(t)
      const list = Array.isArray(data) ? data : [data]
      if (list.length === 0) return { entries: [], error: 'No accounts found in JSON' }
      return { entries: list.map(fromJsonRecord), error: null }
    }
    const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return { entries: [], error: null }
    return { entries: lines.map((line) => parseOtpauthUri(line)), error: null }
  } catch (e) {
    return { entries: [], error: (e as Error).message }
  }
}
