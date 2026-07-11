/**
 * Session-scoped UI/auth state — survives the popup closing and reopening (e.g. clicking
 * outside the extension), but is cleared when the browser restarts. Backed by
 * `chrome.storage.session` (in-memory, cleared on browser exit); falls back to
 * `sessionStorage` in dev mode (tab-scoped, cleared on tab/browser close — same semantics).
 *
 * This is deliberately separate from lib/storage.ts: that module persists real data
 * (entries/settings/master-password hash) across browser restarts; this one only holds
 * transient "where was the user, what were they typing, are they still unlocked" state.
 */
export const SESSION_KEYS = {
  auth: 'otp_auth_unlock_session_v1',
  nav: 'otp_auth_nav_session_v1',
  draft: 'otp_auth_draft_session_v1',
} as const

export interface AuthSession {
  unlocked: boolean
  lastActiveAt: number
}

export interface DraftSession {
  view: string
  id?: string
  fields: Record<string, unknown>
  savedAt: number
}

function hasChromeSession(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.session
}

export async function getSessionValue<T>(key: string): Promise<T | undefined> {
  if (hasChromeSession()) {
    const result = await chrome.storage.session.get(key)
    return result[key] as T | undefined
  }
  try {
    const raw = sessionStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : undefined
  } catch { return undefined }
}

export async function setSessionValue(key: string, value: unknown): Promise<void> {
  if (hasChromeSession()) { await chrome.storage.session.set({ [key]: value }); return }
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* unavailable */ }
}

export async function removeSessionValue(key: string): Promise<void> {
  if (hasChromeSession()) { await chrome.storage.session.remove(key); return }
  try { sessionStorage.removeItem(key) } catch { /* ignore */ }
}
