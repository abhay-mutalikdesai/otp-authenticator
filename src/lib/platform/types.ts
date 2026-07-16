export interface PlatformAdapter {
  /** Unique platform identifier */
  readonly id: 'chrome' | 'tauri' | 'web'

  /** Check if the current environment matches this adapter */
  isActive(): boolean

  /** Initialize the adapter if needed */
  init?(): Promise<void>

  // ─── Capabilities ─────────────────────────────────────────────────────────
  /** Whether the platform supports window dragging */
  readonly canDrag: boolean
  /** Whether the platform supports always-on-top / pinned window mode */
  readonly canSetWindowMode: boolean

  // ─── Persistent Storage ───────────────────────────────────────────────────
  /** Get multiple keys from persistent storage */
  storageGet(keys: string[]): Promise<Record<string, unknown>>
  /** Set a key in persistent storage */
  storageSet(key: string, value: unknown): Promise<void>
  /** Remove a key from persistent storage */
  storageRemove(key: string): Promise<void>

  // ─── Session Storage ──────────────────────────────────────────────────────
  /** Get a value from session-scoped storage (survives popup close, cleared on browser/app exit) */
  sessionGet<T>(key: string): Promise<T | undefined>
  /** Set a value in session-scoped storage */
  sessionSet(key: string, value: unknown): Promise<void>
  /** Remove a value from session-scoped storage */
  sessionRemove(key: string): Promise<void>

  // ─── Window Controls ──────────────────────────────────────────────────────
  /** Start a window drag operation (if supported) */
  startDrag(): void
  /** Set the window mode (e.g. pinned/always on top) */
  setWindowMode(mode: boolean): Promise<void>
  /** Sync auth state with the host platform (if supported) */
  syncAuthState(locked: boolean, hasMaster: boolean): Promise<void>
  /** Tell the platform to ignore window blur events (e.g. when opening a native file dialog) */
  setIgnoreBlur(ignore: boolean): Promise<void>
}
