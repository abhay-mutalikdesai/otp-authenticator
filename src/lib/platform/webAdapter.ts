import type { PlatformAdapter } from './types'

export const webAdapter: PlatformAdapter = {
  id: 'web',
  canDrag: false,
  canSetWindowMode: false,

  isActive() {
    return true // Fallback, always true
  },

  // ─── Persistent Storage ─────────────────────────────────────────────────
  async storageGet(keys: string[]): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {}
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key)
        if (raw !== null) out[key] = JSON.parse(raw)
      } catch {
        // ignore unreadable key
      }
    }
    return out
  },

  async storageSet(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // quota exceeded / unavailable
    }
  },

  async storageRemove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },

  // ─── Session Storage ────────────────────────────────────────────────────
  async sessionGet<T>(key: string): Promise<T | undefined> {
    try {
      const raw = sessionStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : undefined
    } catch { return undefined }
  },

  async sessionSet(key: string, value: unknown): Promise<void> {
    try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* unavailable */ }
  },

  async sessionRemove(key: string): Promise<void> {
    try { sessionStorage.removeItem(key) } catch { /* ignore */ }
  },

  // ─── Window Controls (no-op for web fallback) ──────────────────────────
  startDrag() {},
  async setWindowMode(_mode: boolean): Promise<void> {},
  async syncAuthState(_locked: boolean, _hasMaster: boolean): Promise<void> {},
  async setIgnoreBlur(_ignore: boolean): Promise<void> {},
}
