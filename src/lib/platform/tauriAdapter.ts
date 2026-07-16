import type { PlatformAdapter } from './types'

/** In-memory session store for Tauri — sessionStorage is unreliable because
 *  hiding/showing the window can reset it in some WebView configurations. */
const tauriSession = new Map<string, unknown>()

export const tauriAdapter: PlatformAdapter = {
  id: 'tauri',
  canDrag: true,
  canSetWindowMode: true,

  isActive() {
    return typeof window !== 'undefined' && '__TAURI_IPC__' in window
  },

  async init(): Promise<void> {
    // Inject Tauri metadata that the @tauri-apps/api expects when running
    // outside the native shell (e.g. during vite dev). This was previously
    // in a standalone init.ts file that ran on every platform.
    if (!(window as any).__TAURI_METADATA__) {
      (window as any).__TAURI_METADATA__ = { __currentWindow: 'main' }
    }
  },

  // ─── Persistent Storage ─────────────────────────────────────────────────
  async storageGet(keys: string[]): Promise<Record<string, unknown>> {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/api/fs')
    const out: Record<string, unknown> = {}
    for (const key of keys) {
      try {
        const fileName = `${key}.json`
        if (await exists(fileName, { dir: BaseDirectory.AppConfig })) {
          const raw = await readTextFile(fileName, { dir: BaseDirectory.AppConfig })
          out[key] = JSON.parse(raw)
        }
      } catch {
        // ignore unreadable key
      }
    }
    return out
  },

  async storageSet(key: string, value: unknown): Promise<void> {
    const { writeTextFile, BaseDirectory, createDir, exists } = await import('@tauri-apps/api/fs')
    const { appConfigDir } = await import('@tauri-apps/api/path')
    try {
      const configDir = await appConfigDir()
      if (!(await exists(configDir))) {
        await createDir(configDir, { recursive: true })
      }
      await writeTextFile(`${key}.json`, JSON.stringify(value), { dir: BaseDirectory.AppConfig })
    } catch (e) {
      console.error('Failed to write to Tauri FS', e)
    }
  },

  async storageRemove(key: string): Promise<void> {
    const { removeFile, exists, BaseDirectory } = await import('@tauri-apps/api/fs')
    try {
      const fileName = `${key}.json`
      if (await exists(fileName, { dir: BaseDirectory.AppConfig })) {
        await removeFile(fileName, { dir: BaseDirectory.AppConfig })
      }
    } catch {
      // ignore
    }
  },

  // ─── Session Storage ────────────────────────────────────────────────────
  async sessionGet<T>(key: string): Promise<T | undefined> {
    return tauriSession.get(key) as T | undefined
  },

  async sessionSet(key: string, value: unknown): Promise<void> {
    tauriSession.set(key, value)
  },

  async sessionRemove(key: string): Promise<void> {
    tauriSession.delete(key)
  },

  // ─── Window Controls ───────────────────────────────────────────────────
  startDrag() {
    import('@tauri-apps/api/window').then(({ appWindow }) => {
      appWindow.startDragging().catch(() => {})
    })
  },

  async setWindowMode(mode: boolean): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/tauri')
    invoke('set_window_mode', { mode }).catch(() => {})
  },

  async syncAuthState(locked: boolean, hasMaster: boolean): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/tauri')
    invoke('set_auth_state', { locked, hasMaster }).catch(() => {})
  },

  async setIgnoreBlur(ignore: boolean): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/tauri')
    invoke('set_ignore_blur', { ignore }).catch(() => {})
  },
}
