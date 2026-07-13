import { useCallback, useEffect, useRef, useState } from 'react'
import type { OtpEntry } from '../../types'
import { generateOTP, getProgress, getSecondsRemaining } from '../../lib/otp'

interface OtpDataResult {
  otpMap: Record<string, string>
  progressMap: Record<string, number>
  secondsMap: Record<string, number>
  refreshOne: (entry: OtpEntry) => Promise<string>
}

/**
 * Custom hook to drive live OTP code generation and progress bars.
 * It periodically recalculates time remaining and triggers regeneration of TOTP codes
 * only for entries that have rolled over, minimizing unnecessary cryptographic work.
 */
export function useOtpData(entries: OtpEntry[]): OtpDataResult {
  const [otpMap, setOtpMap] = useState<Record<string, string>>({})
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [secondsMap, setSecondsMap] = useState<Record<string, number>>({})
  const entriesRef = useRef<OtpEntry[]>(entries)
  entriesRef.current = entries

  const generateFor = useCallback(async (list: OtpEntry[]) => {
    if (list.length === 0) return
    const results = await Promise.all(list.map(async (e) => {
      try { return [e.id, await generateOTP(e)] as const }
      catch { return [e.id, '------'] as const }
    }))
    setOtpMap((prev) => {
      const next = { ...prev }
      for (const [id, code] of results) next[id] = code
      return next
    })
  }, [])

  const entryIds = entries.map((e) => e.id).join(',')

  // Regenerate codes when visible entries change.
  useEffect(() => { generateFor(entriesRef.current) }, [generateFor, entryIds])

  // Compute initial progress synchronously for first paint.
  useEffect(() => {
    const pm: Record<string, number> = {}
    const sm: Record<string, number> = {}
    for (const e of entries) {
      if (e.type === 'totp') {
        const period = e.period ?? 30
        pm[e.id] = getProgress(period)
        sm[e.id] = getSecondsRemaining(period)
      }
    }
    setProgressMap(pm)
    setSecondsMap(sm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryIds])

  useEffect(() => {
    const id = setInterval(() => {
      const pm: Record<string, number> = {}
      const sm: Record<string, number> = {}
      const rolledOver: OtpEntry[] = []
      for (const e of entriesRef.current) {
        if (e.type !== 'totp') continue
        const period = e.period ?? 30
        const s = getSecondsRemaining(period)
        pm[e.id] = getProgress(period)
        sm[e.id] = s
        // Regenerate code only for rolled-over entries.
        if (s === period) rolledOver.push(e)
      }
      setProgressMap(pm)
      setSecondsMap(sm)
      if (rolledOver.length) generateFor(rolledOver)
    }, 500)
    return () => clearInterval(id)
  }, [generateFor])

  const refreshOne = useCallback(async (entry: OtpEntry): Promise<string> => {
    const code = await generateOTP(entry).catch(() => '------')
    setOtpMap((m) => ({ ...m, [entry.id]: code }))
    return code
  }, [])

  return { otpMap, progressMap, secondsMap, refreshOne }
}
