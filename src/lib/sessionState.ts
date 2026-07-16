/**
 * Session-scoped UI/auth state — survives the popup closing and reopening (e.g. clicking
 * outside the extension), but is cleared when the browser restarts. Routed through the
 * platform adapter so each environment uses its optimal session backend:
 *   - Chrome Extension → chrome.storage.session (in-memory, cleared on browser exit)
 *   - Tauri Desktop   → in-memory Map (survives show/hide, cleared on app exit)
 *   - Web fallback    → sessionStorage (tab-scoped, cleared on tab/browser close)
 *
 * This is deliberately separate from lib/storage.ts: that module persists real data
 * (entries/settings/master-password hash) across browser restarts; this one only holds
 * transient "where was the user, what were they typing, are they still unlocked" state.
 */
import { platform } from './platform'

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

export async function getSessionValue<T>(key: string): Promise<T | undefined> {
  return platform.sessionGet<T>(key)
}

export async function setSessionValue(key: string, value: unknown): Promise<void> {
  return platform.sessionSet(key, value)
}

export async function removeSessionValue(key: string): Promise<void> {
  return platform.sessionRemove(key)
}
