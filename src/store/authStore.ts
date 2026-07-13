/**
 * Centralises all master-password / app-lock logic that was previously scattered across
 * App.tsx, LockScreen, Settings, and the settings panel (each calling sha256 + localStorage
 * directly). Single responsibility: know whether a master password is set, whether the app
 * is currently locked, and mutate the password.
 *
 * Fail-safe by design: `locked` starts `true` and only flips to `false` once `checkAuth()`
 * has confirmed (asynchronously) that no master password is configured. This avoids ever
 * flashing unlocked content before storage has been read.
 *
 * Unlock state also survives the popup being closed (e.g. clicking outside the extension)
 * via chrome.storage.session, which persists for the browser session but is cleared on
 * browser restart. That way the app only re-locks when the auto-lock timer actually elapses,
 * the user locks it manually, or the browser closes — not just because the popup closed.
 */
import { create } from 'zustand'
import { sha256 } from '../lib/hash'
import { loadMasterPasswordHash, saveMasterPasswordHash } from '../lib/storage'
import { getSessionValue, removeSessionValue, setSessionValue, SESSION_KEYS, type AuthSession } from '../lib/sessionState'
import useSettingsStore from './settingsStore'

interface AuthState {
  checked: boolean
  hasMasterPassword: boolean
  locked: boolean

  checkAuth: (autoLockMinutes?: number) => Promise<void>
  unlockWithPassword: (password: string) => Promise<boolean>
  setPassword: (password: string) => Promise<void>
  changePassword: (current: string, next: string) => Promise<boolean>
  removePassword: (current: string) => Promise<boolean>
  lock: () => void
  /** Refreshes the session's "last active" timestamp so elapsed idle time is measured
   * correctly even if the popup gets closed and reopened before the auto-lock timer fires. */
  touchSession: () => void
}

async function clearUiSession() {
  await Promise.all([removeSessionValue(SESSION_KEYS.nav), removeSessionValue(SESSION_KEYS.draft)])
}

const useAuthStore = create<AuthState>((set, get) => ({
  checked: false,
  hasMasterPassword: false,
  locked: true,

  checkAuth: async (autoLockMinutes = 0) => {
    const hash = await loadMasterPasswordHash()
    if (!hash) { set({ hasMasterPassword: false, locked: false, checked: true }); return }

    const session = await getSessionValue<AuthSession>(SESSION_KEYS.auth)
    const now = Date.now()
    const withinAutoLock = autoLockMinutes <= 0 || (!!session && now - session.lastActiveAt < autoLockMinutes * 60 * 1000)
    const stillUnlocked = Boolean(session?.unlocked) && withinAutoLock
    set({ hasMasterPassword: true, locked: !stillUnlocked, checked: true })
    if (stillUnlocked) await setSessionValue(SESSION_KEYS.auth, { unlocked: true, lastActiveAt: now })
    else await Promise.all([removeSessionValue(SESSION_KEYS.auth), clearUiSession()])
  },

  unlockWithPassword: async (password) => {
    const hash = await loadMasterPasswordHash()
    if (!hash) { set({ locked: false }); return true }
    const attempt = await sha256(password)
    if (attempt === hash) {
      set({ locked: false })
      await setSessionValue(SESSION_KEYS.auth, { unlocked: true, lastActiveAt: Date.now() })
      return true
    }
    return false
  },

  setPassword: async (password) => {
    await saveMasterPasswordHash(await sha256(password))
    set({ hasMasterPassword: true })
  },

  changePassword: async (current, next) => {
    const hash = await loadMasterPasswordHash()
    if (!hash || (await sha256(current)) !== hash) return false
    await saveMasterPasswordHash(await sha256(next))
    return true
  },

  removePassword: async (current) => {
    const hash = await loadMasterPasswordHash()
    if (!hash || (await sha256(current)) !== hash) return false
    await saveMasterPasswordHash(null)
    set({ hasMasterPassword: false, locked: false })
    await removeSessionValue(SESSION_KEYS.auth)
    // Protection was just turned off — surface the "set a master password" nudge again
    // even if it was previously snoozed/dismissed while a password was still set.
    await useSettingsStore.getState().updateSetting('mpReminderSnoozeUntil', 0)
    return true
  },

  lock: () => {
    if (get().hasMasterPassword) {
      set({ locked: true })
      void removeSessionValue(SESSION_KEYS.auth)
      void clearUiSession()
    }
  },

  touchSession: () => {
    if (get().hasMasterPassword && !get().locked) {
      void setSessionValue(SESSION_KEYS.auth, { unlocked: true, lastActiveAt: Date.now() })
    }
  },
}))

export default useAuthStore

