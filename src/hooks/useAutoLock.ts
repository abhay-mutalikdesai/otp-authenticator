import { useEffect, useRef, useCallback } from 'react'
import useSettingsStore from '../store/settingsStore'
import useAuthStore from '../store/authStore'

export function useAutoLock() {
  const autoLockMinutes = useSettingsStore(s => s.autoLockMinutes)
  const locked = useAuthStore(s => s.locked)
  const hasMasterPassword = useAuthStore(s => s.hasMasterPassword)
  const lock = useAuthStore(s => s.lock)
  const touchSession = useAuthStore(s => s.touchSession)

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastTouchRef = useRef(0)

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

  return { resetLockTimer }
}
