/**
 * Persistence layer — chrome.storage.local in the extension, localStorage fallback in dev.
 *
 * Design notes:
 * - Entries, settings, and the master-password hash each live under their OWN storage key.
 *   This keeps the three concerns fully isolated so a write to one can never race with or
 *   clobber a concurrent write to another (previously all three were merged into a single
 *   blob that every store read-modified-wrote, which is a classic lost-update race).
 * - Writes to a given key are serialized (queued) so two rapid updates to the same domain
 *   always apply in call order, never "last response wins".
 * - A one-time migration reads the legacy combined blob (if present) and legacy master
 *   password key, splits them into the new keys, then removes the old ones.
 */
import type { AppSettings, OtpEntry } from '../types'

const ENTRIES_KEY = 'otp_auth_entries_v1'
const SETTINGS_KEY = 'otp_auth_settings_v1'
const MASTER_PW_KEY = 'otp_auth_master_pw_hash_v1'

/** v0 storage shape — a single combined blob under this key. */
const LEGACY_DATA_KEY = 'otp_authenticator_data'
/** v0 master password hash lived directly in localStorage under this key. */
const LEGACY_MP_KEY = 'otp_master_pw_hash'

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultDigits: 6,
  defaultAlgorithm: 'SHA256',
  defaultPeriod: 30,
  showOtp: true,
  autoLockMinutes: 0,
}

interface LegacyAppData {
  entries?: OtpEntry[]
  settings?: Partial<AppSettings>
}

// ─── Low-level key/value access ────────────────────────────────────────────
function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local
}

function rawGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.get(key, (result) => resolve(result[key] as T | undefined))
      return
    }
    try {
      const raw = localStorage.getItem(key)
      resolve(raw !== null ? (JSON.parse(raw) as T) : undefined)
    } catch {
      resolve(undefined)
    }
  })
}

function rawSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.set({ [key]: value }, () => resolve())
      return
    }
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota exceeded / unavailable */ }
    resolve()
  })
}

function rawRemove(key: string): Promise<void> {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.remove(key, () => resolve())
      return
    }
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    resolve()
  })
}

// Per-key write queue so concurrent writes to the same key resolve in call order.
const writeQueues = new Map<string, Promise<unknown>>()
function queuedSet(key: string, value: unknown): Promise<void> {
  const prior = writeQueues.get(key) ?? Promise.resolve()
  const next = prior.then(() => rawSet(key, value), () => rawSet(key, value))
  writeQueues.set(key, next)
  return next
}
function queuedRemove(key: string): Promise<void> {
  const prior = writeQueues.get(key) ?? Promise.resolve()
  const next = prior.then(() => rawRemove(key), () => rawRemove(key))
  writeQueues.set(key, next)
  return next
}

// ─── One-time legacy migration ─────────────────────────────────────────────
let migrationPromise: Promise<void> | null = null
function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const legacy = await rawGet<LegacyAppData>(LEGACY_DATA_KEY)
      if (legacy) {
        const [hasEntries, hasSettings] = await Promise.all([
          rawGet<OtpEntry[]>(ENTRIES_KEY),
          rawGet<Partial<AppSettings>>(SETTINGS_KEY),
        ])
        const tasks: Promise<void>[] = []
        if (!hasEntries && legacy.entries) tasks.push(rawSet(ENTRIES_KEY, legacy.entries))
        if (!hasSettings && legacy.settings) tasks.push(rawSet(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...legacy.settings }))
        await Promise.all(tasks)
        await rawRemove(LEGACY_DATA_KEY)
      }
    })()
  }
  return migrationPromise
}

// ─── Entries ────────────────────────────────────────────────────────────────
export async function loadEntries(): Promise<OtpEntry[]> {
  await ensureMigrated()
  return (await rawGet<OtpEntry[]>(ENTRIES_KEY)) ?? []
}

export async function saveEntries(entries: OtpEntry[]): Promise<void> {
  await queuedSet(ENTRIES_KEY, entries)
}

export async function clearEntries(): Promise<void> {
  await queuedRemove(ENTRIES_KEY)
}

// ─── Settings ───────────────────────────────────────────────────────────────
export async function loadSettings(): Promise<AppSettings> {
  await ensureMigrated()
  const stored = await rawGet<Partial<AppSettings>>(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await queuedSet(SETTINGS_KEY, settings)
}

// ─── Master password hash ───────────────────────────────────────────────────
export async function loadMasterPasswordHash(): Promise<string | null> {
  const existing = await rawGet<string>(MASTER_PW_KEY)
  if (existing) return existing
  // Migrate from the legacy localStorage-only key used in earlier versions.
  try {
    const legacy = localStorage.getItem(LEGACY_MP_KEY)
    if (legacy) {
      await saveMasterPasswordHash(legacy)
      localStorage.removeItem(LEGACY_MP_KEY)
      return legacy
    }
  } catch { /* localStorage unavailable */ }
  return null
}

export async function saveMasterPasswordHash(hash: string | null): Promise<void> {
  if (hash) await queuedSet(MASTER_PW_KEY, hash)
  else await queuedRemove(MASTER_PW_KEY)
}
