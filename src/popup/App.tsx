import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEventHandler } from 'react'
import useEntriesStore from '../store/entriesStore'
import useSettingsStore from '../store/settingsStore'
import useAuthStore from '../store/authStore'
import { useNavigationStore } from '../store/navigationStore'
import { ToastProvider } from './components/Toast'
import { LockScreen } from './views/LockScreen'
import { MainList } from './views/MainList'
import { EntryDetail } from './views/EntryDetail'
import { AddEditEntry } from './views/AddEditEntry'
import { Reorder } from './views/Reorder'
import { Settings } from './views/settings/Settings'
import { About } from './views/About'
import { MasterPasswordPrompt } from './components/MasterPasswordPrompt'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'

/** Max age for restoring draft form state without master password. */
const UNPROTECTED_SESSION_MAX_AGE_MS = 5 * 60 * 1000

/** Composition root. Owns app-wide concerns (data loading, theme, auto-lock, routing). */
export default function App() {
  const loadFromStorage = useEntriesStore(s => s.loadFromStorage)
  const loadSettings = useSettingsStore(s => s.loadSettings)
  const settingsLoaded = useSettingsStore(s => s.loaded)
  const theme = useSettingsStore(s => s.theme)
  const windowMode = useSettingsStore(s => s.windowMode)
  const autoLockMinutes = useSettingsStore(s => s.autoLockMinutes)
  const mpReminderSnoozeUntil = useSettingsStore(s => s.mpReminderSnoozeUntil)
  const view = useNavigationStore(s => s.view)
  const hydrateNavigation = useNavigationStore(s => s.hydrate)

  const checked = useAuthStore(s => s.checked)
  const locked = useAuthStore(s => s.locked)
  const hasMasterPassword = useAuthStore(s => s.hasMasterPassword)
  const checkAuth = useAuthStore(s => s.checkAuth)
  const lock = useAuthStore(s => s.lock)
  const touchSession = useAuthStore(s => s.touchSession)

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastTouchRef = useRef(0)

  useEffect(() => {
    (async () => {
      await loadSettings()
      loadFromStorage()
      await checkAuth(useSettingsStore.getState().autoLockMinutes)
      // Restore draft state only if unlocked.
      if (!useAuthStore.getState().locked) {
        const maxAgeMs = useAuthStore.getState().hasMasterPassword ? null : UNPROTECTED_SESSION_MAX_AGE_MS
        await hydrateNavigation(maxAgeMs)
      }
    })()
  }, [loadFromStorage, loadSettings, checkAuth, hydrateNavigation])

  // Theme
  useEffect(() => {
    const root = document.documentElement
    const apply = (dark: boolean) => dark ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme')
    if (theme === 'dark') { apply(true); return }
    if (theme === 'light') { apply(false); return }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)
    const fn = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [theme])

  // Window Mode
  useEffect(() => {
    if (settingsLoaded) {
      invoke('set_window_mode', { mode: !!windowMode }).catch(() => {})
    }
  }, [windowMode, settingsLoaded])

  // Sync auth state to rust for window mode positioning logic
  useEffect(() => {
    invoke('set_auth_state', { locked, hasMaster: hasMasterPassword }).catch(() => {})
  }, [locked, hasMasterPassword])

  // Auto-lock timer: reset on interaction, lock after idle. Refreshes session timestamp.
  const resetLockTimer = useCallback(() => {
    const now = Date.now()
    if (now - lastTouchRef.current < 2000) return
    lastTouchRef.current = now

    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    if (hasMasterPassword && !locked) {
      touchSession()
      if (autoLockMinutes > 0) {
        lockTimerRef.current = setTimeout(() => lock(), autoLockMinutes * 60 * 1000)
      }
    }
  }, [hasMasterPassword, autoLockMinutes, locked, lock, touchSession])

  useEffect(() => {
    resetLockTimer()
    return () => { if (lockTimerRef.current) clearTimeout(lockTimerRef.current) }
  }, [resetLockTimer])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    resetLockTimer()
    if (windowMode && e.button === 0) {
      const target = e.target as HTMLElement
      if (target.closest('[data-app-drag-region]') && !target.closest('button, input, a, textarea, select, [data-no-drag]')) {
        appWindow.startDragging().catch(() => {})
      }
    }
  }, [resetLockTimer, windowMode])

  const renderView = () => {
    switch (view) {
      case 'detail': return <EntryDetail />
      case 'add':
      case 'edit': return <AddEditEntry />
      case 'reorder': return <Reorder />
      case 'settings': return <Settings />
      case 'about': return <About />
      default: return <MainList onLock={lock} />
    }
  }

  // Show prompt only on main list.
  const showMpPrompt = view === 'list' && checked && !locked && settingsLoaded && !hasMasterPassword
    && Date.now() > mpReminderSnoozeUntil

  return (
    <div className="app-frame" onPointerDown={handlePointerDown} onPointerMove={resetLockTimer} onKeyDown={resetLockTimer as unknown as KeyboardEventHandler}>
      <ToastProvider>
        {!checked ? null : locked ? <LockScreen /> : <>{renderView()}{showMpPrompt && <MasterPasswordPrompt />}</>}
      </ToastProvider>
    </div>
  )
}
