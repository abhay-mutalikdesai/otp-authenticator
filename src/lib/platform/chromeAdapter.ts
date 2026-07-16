import type { PlatformAdapter } from './types'

export const chromeAdapter: PlatformAdapter = {
  id: 'chrome',
  canDrag: false,
  canSetWindowMode: false,

  isActive() {
    return typeof chrome !== 'undefined' && !!chrome.storage?.local
  },

  // ─── Persistent Storage ─────────────────────────────────────────────────
  storageGet(keys: string[]): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => resolve(result))
    })
  },

  storageSet(key: string, value: unknown): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve())
    })
  },

  storageRemove(key: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => resolve())
    })
  },

  // ─── Session Storage ────────────────────────────────────────────────────
  async sessionGet<T>(key: string): Promise<T | undefined> {
    if (chrome.storage?.session) {
      const result = await chrome.storage.session.get(key)
      return result[key] as T | undefined
    }
    // Fallback for older Chrome versions without session storage
    try {
      const raw = sessionStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : undefined
    } catch { return undefined }
  },

  async sessionSet(key: string, value: unknown): Promise<void> {
    if (chrome.storage?.session) {
      await chrome.storage.session.set({ [key]: value })
      return
    }
    try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* unavailable */ }
  },

  async sessionRemove(key: string): Promise<void> {
    if (chrome.storage?.session) {
      await chrome.storage.session.remove(key)
      return
    }
    try { sessionStorage.removeItem(key) } catch { /* ignore */ }
  },

  // ─── Window Controls (no-op in extension) ───────────────────────────────
  startDrag() {},
  async setWindowMode(_mode: boolean): Promise<void> {},
  async syncAuthState(_locked: boolean, _hasMaster: boolean): Promise<void> {},
  async setIgnoreBlur(_ignore: boolean): Promise<void> {},
}
