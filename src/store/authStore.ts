/**
 * Centralises all master-password / app-lock logic that was previously scattered across
 * App.tsx, LockScreen, Settings, and the settings panel (each calling sha256 + localStorage
 * directly). Single responsibility: know whether a master password is set, whether the app
 * is currently locked, and mutate the password.
 *
 * Fail-safe by design: `locked` starts `true` and only flips to `false` once `checkAuth()`
 * has confirmed (asynchronously) that no master password is configured. This avoids ever
 * flashing unlocked content before storage has been read.
 */
import { create } from 'zustand'
import { sha256 } from '../lib/hash'
import { loadMasterPasswordHash, saveMasterPasswordHash } from '../lib/storage'

interface AuthState {
  checked: boolean
  hasMasterPassword: boolean
  locked: boolean

  checkAuth: () => Promise<void>
  unlockWithPassword: (password: string) => Promise<boolean>
  setPassword: (password: string) => Promise<void>
  changePassword: (current: string, next: string) => Promise<boolean>
  removePassword: (current: string) => Promise<boolean>
  lock: () => void
}

const useAuthStore = create<AuthState>((set, get) => ({
  checked: false,
  hasMasterPassword: false,
  locked: true,

  checkAuth: async () => {
    const hash = await loadMasterPasswordHash()
    set({ hasMasterPassword: Boolean(hash), locked: Boolean(hash), checked: true })
  },

  unlockWithPassword: async (password) => {
    const hash = await loadMasterPasswordHash()
    if (!hash) { set({ locked: false }); return true }
    const attempt = await sha256(password)
    if (attempt === hash) { set({ locked: false }); return true }
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
    return true
  },

  lock: () => { if (get().hasMasterPassword) set({ locked: true }) },
}))

export default useAuthStore
