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

/**
 * Composition root — owns app-wide concerns only (data loading, theme, auto-lock, routing).
 * All view/UI logic lives in ./views and ./components; all persistence & OTP/auth logic in
 * ../store and ../lib. This file intentionally does very little on its own.
 */
export default function App() {
  const loadFromStorage = useEntriesStore(s => s.loadFromStorage)
  const loadSettings = useSettingsStore(s => s.loadSettings)
  const theme = useSettingsStore(s => s.theme)
  const autoLockMinutes = useSettingsStore(s => s.autoLockMinutes)
  const { view } = useNavigationStore()

  const checked = useAuthStore(s => s.checked)
  const locked = useAuthStore(s => s.locked)
  const hasMasterPassword = useAuthStore(s => s.hasMasterPassword)
  const checkAuth = useAuthStore(s => s.checkAuth)
  const lock = useAuthStore(s => s.lock)

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    loadFromStorage()
    loadSettings()
    checkAuth()
  }, [loadFromStorage, loadSettings, checkAuth])

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

  // Auto-lock timer — reset on any interaction, lock after configured idle time
  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    if (hasMasterPassword && autoLockMinutes > 0 && !locked) {
      lockTimerRef.current = setTimeout(() => lock(), autoLockMinutes * 60 * 1000)
    }
  }, [hasMasterPassword, autoLockMinutes, locked, lock])

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

  return (
    <div className="app-frame" onPointerDown={resetLockTimer} onKeyDown={resetLockTimer as unknown as KeyboardEventHandler}>
      <ToastProvider>
        {!checked ? null : locked ? <LockScreen /> : renderView()}
      </ToastProvider>
    </div>
  )
}
