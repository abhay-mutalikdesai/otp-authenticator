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

/** No-restore window for in-progress screen/form state when no master password is set —
 * there's no lock to bound its lifetime otherwise, so cap it short. */
const UNPROTECTED_SESSION_MAX_AGE_MS = 5 * 60 * 1000

/**
 * Composition root — owns app-wide concerns only (data loading, theme, auto-lock, routing).
 * All view/UI logic lives in ./views and ./components; all persistence & OTP/auth logic in
 * ../store and ../lib. This file intentionally does very little on its own.
 */
export default function App() {
  const loadFromStorage = useEntriesStore(s => s.loadFromStorage)
  const loadSettings = useSettingsStore(s => s.loadSettings)
  const settingsLoaded = useSettingsStore(s => s.loaded)
  const theme = useSettingsStore(s => s.theme)
  const autoLockMinutes = useSettingsStore(s => s.autoLockMinutes)
  const mpReminderSnoozeUntil = useSettingsStore(s => s.mpReminderSnoozeUntil)
  const { view, hydrate: hydrateNavigation } = useNavigationStore()

  const checked = useAuthStore(s => s.checked)
  const locked = useAuthStore(s => s.locked)
  const hasMasterPassword = useAuthStore(s => s.hasMasterPassword)
  const checkAuth = useAuthStore(s => s.checkAuth)
  const lock = useAuthStore(s => s.lock)
  const touchSession = useAuthStore(s => s.touchSession)

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    (async () => {
      await loadSettings()
      loadFromStorage()
      await checkAuth(useSettingsStore.getState().autoLockMinutes)
      // Restore the last screen/in-progress form only once we know the app is actually
      // unlocked — otherwise a closed popup reopening while locked would briefly reveal it.
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

  // Auto-lock timer — reset on any interaction, lock after configured idle time. Also
  // refreshes the session's last-active timestamp so elapsed idle time is measured
  // correctly even if the popup is closed and reopened before the timer fires.
  const resetLockTimer = useCallback(() => {
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

  // Only shown on the main list — otherwise it would immediately re-cover the Settings
  const showMpPrompt = view === 'list' && checked && !locked && settingsLoaded && !hasMasterPassword
    && Date.now() > mpReminderSnoozeUntil

  return (
    <div className="app-frame" onPointerDown={resetLockTimer} onKeyDown={resetLockTimer as unknown as KeyboardEventHandler}>
      <ToastProvider>
        {!checked ? null : locked ? <LockScreen /> : <>{renderView()}{showMpPrompt && <MasterPasswordPrompt />}</>}
      </ToastProvider>
    </div>
  )
}
