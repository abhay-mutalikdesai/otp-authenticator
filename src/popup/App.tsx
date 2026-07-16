import { useCallback, useEffect } from 'react'
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
import { platform } from '../lib/platform'
import { useAutoLock } from '../hooks/useAutoLock'
import { useTheme } from '../hooks/useTheme'

/** Max age for restoring draft form state without master password. */
const UNPROTECTED_SESSION_MAX_AGE_MS = 5 * 60 * 1000

/** Composition root. Owns app-wide concerns (data loading, theme, auto-lock, routing). */
export default function App() {
  const loadFromStorage = useEntriesStore(s => s.loadFromStorage)
  const loadSettings = useSettingsStore(s => s.loadSettings)
  const settingsLoaded = useSettingsStore(s => s.loaded)
  const windowMode = useSettingsStore(s => s.windowMode)
  const mpReminderSnoozeUntil = useSettingsStore(s => s.mpReminderSnoozeUntil)
  const view = useNavigationStore(s => s.view)
  const hydrateNavigation = useNavigationStore(s => s.hydrate)

  const checked = useAuthStore(s => s.checked)
  const locked = useAuthStore(s => s.locked)
  const hasMasterPassword = useAuthStore(s => s.hasMasterPassword)
  const checkAuth = useAuthStore(s => s.checkAuth)
  const lock = useAuthStore(s => s.lock)

  // Use custom hooks for isolated concerns
  useTheme()
  const { resetLockTimer } = useAutoLock()

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

  // Window Mode
  useEffect(() => {
    if (settingsLoaded) {
      platform.setWindowMode(!!windowMode).catch(() => {})
    }
  }, [windowMode, settingsLoaded])

  // Sync auth state to platform for window mode positioning logic
  useEffect(() => {
    platform.syncAuthState(locked, hasMasterPassword).catch(() => {})
  }, [locked, hasMasterPassword])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    resetLockTimer()
    if (windowMode && e.button === 0) {
      const target = e.target as HTMLElement
      if (target.closest('[data-app-drag-region]') && !target.closest('button, input, a, textarea, select, [data-no-drag]')) {
        platform.startDrag()
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
