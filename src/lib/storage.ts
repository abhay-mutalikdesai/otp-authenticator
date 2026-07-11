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
 * - Extension upgrades keep chrome.storage.local intact (Chrome never clears storage on
 *   update, only on uninstall), so no migration is needed for users already on the split-key
 *   format. For anyone upgrading from the older single-blob format, a one-time migration
 *   reads the legacy combined blob (if present) and legacy master-password key, splits them
 *   into the new keys, then removes the old ones. A persisted flag guarantees this legacy
 *   check only ever runs once per install, not on every popup open.
 * - Entries + settings + the migration check are fetched together in a SINGLE batched
 *   chrome.storage.local.get() call per popup session, instead of one round trip per key.
 */
import type { AppSettings, OtpEntry } from '../types'

const ENTRIES_KEY = 'otp_auth_entries_v1'
const SETTINGS_KEY = 'otp_auth_settings_v1'
const MASTER_PW_KEY = 'otp_auth_master_pw_hash_v1'
const MIGRATED_FLAG_KEY = 'otp_auth_migrated_v1'

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

function rawGetMany(keys: string[]): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.get(keys, (result) => resolve(result))
      return
    }
    const out: Record<string, unknown> = {}
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key)
        if (raw !== null) out[key] = JSON.parse(raw)
      } catch { /* ignore unreadable key */ }
    }
    resolve(out)
  })
}

function rawGet<T>(key: string): Promise<T | undefined> {
  return rawGetMany([key]).then((result) => result[key] as T | undefined)
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

// ─── Bootstrap: entries + settings + one-time legacy migration ─────────────
// Fetched together in a single round trip and cached for the lifetime of this popup
// session — entries/settings are only ever loaded once at startup (subsequent reads go
// through the in-memory Zustand stores), so caching here is safe and removes redundant
// storage round trips on every popup open.
interface BootstrapResult {
  entries: OtpEntry[]
  settings: AppSettings
}

let bootstrapPromise: Promise<BootstrapResult> | null = null
function bootstrap(): Promise<BootstrapResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const result = await rawGetMany([ENTRIES_KEY, SETTINGS_KEY, MIGRATED_FLAG_KEY, LEGACY_DATA_KEY])
      let entries = result[ENTRIES_KEY] as OtpEntry[] | undefined
      let settings = result[SETTINGS_KEY] as Partial<AppSettings> | undefined
      const migrated = Boolean(result[MIGRATED_FLAG_KEY])
      const legacy = result[LEGACY_DATA_KEY] as LegacyAppData | undefined

      // Only ever attempt the legacy migration once per install — the flag is set below
      // regardless of whether legacy data was actually found, so every popup open after the
      // very first one (per install/upgrade) skips this branch entirely.
      if (!migrated) {
        const tasks: Promise<void>[] = []
        if (legacy) {
          if (entries === undefined && legacy.entries) { entries = legacy.entries; tasks.push(rawSet(ENTRIES_KEY, entries)) }
          if (settings === undefined && legacy.settings) { settings = { ...DEFAULT_SETTINGS, ...legacy.settings }; tasks.push(rawSet(SETTINGS_KEY, settings)) }
          tasks.push(rawRemove(LEGACY_DATA_KEY))
        }
        tasks.push(rawSet(MIGRATED_FLAG_KEY, true))
        await Promise.all(tasks)
      }

      return { entries: entries ?? [], settings: { ...DEFAULT_SETTINGS, ...settings } }
    })()
  }
  return bootstrapPromise
}

// ─── Entries ────────────────────────────────────────────────────────────────
export async function loadEntries(): Promise<OtpEntry[]> {
  return (await bootstrap()).entries
}

export async function saveEntries(entries: OtpEntry[]): Promise<void> {
  await queuedSet(ENTRIES_KEY, entries)
}

export async function clearEntries(): Promise<void> {
  await queuedRemove(ENTRIES_KEY)
}

// ─── Settings ───────────────────────────────────────────────────────────────
export async function loadSettings(): Promise<AppSettings> {
  return (await bootstrap()).settings
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await queuedSet(SETTINGS_KEY, settings)
}

// ─── Master password hash ───────────────────────────────────────────────────
// Kept OUTSIDE the shared bootstrap cache above: unlike entries/settings, this value can
// change multiple times within a single popup session (set/change/remove password), so it
// must always be read fresh rather than served from a one-time cached snapshot.
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

