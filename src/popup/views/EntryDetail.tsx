import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import useSettingsStore from '../../store/settingsStore'
import useEntriesStore from '../../store/entriesStore'
import { useNavigationStore } from '../../store/navigationStore'
import type { OtpEntry } from '../../types'
import { generateOTP, getProgress, getSecondsRemaining } from '../../lib/otp'
import { detectEncoding } from '../../lib/secretDecoder'
import { useToast } from '../components/Toast'
import { Avatar } from '../components/Avatar'
import { CounterRing, ProgressRing } from '../components/Rings'
import { Icons } from '../components/Icons'
import { Header, IconBtn, Confirm, SectionCard } from '../components/primitives'

/**
 * - OTP code + ring are side by side (not stacked)
 * - "Move top" removed; Edit + Delete are sticky at the bottom
 * - Hide/Copy/Next buttons have equal height
 */
export function EntryDetail() {
  const { params, goBack, navigate } = useNavigationStore()
  const { entries, toggleFavourite, deleteEntry, incrementCounter } = useEntriesStore()
  const { show } = useToast()
  const entry = entries.find(e => e.id === params.id)
  const [otp, setOtp] = useState('------')
  // Seed from THIS entry's own period so the first paint is never wrong for non-default periods.
  const [progress, setProgress] = useState(() => getProgress(entry?.period))
  const [seconds, setSeconds] = useState(() => getSecondsRemaining(entry?.period))
  const defaultShow = useSettingsStore(s => s.showOtp)
  const [showLocal, setShowLocal] = useState(defaultShow)
  const [confirmDel, setConfirmDel] = useState(false)

  const refresh = useCallback(async (e?: OtpEntry) => {
    const t = e || entry; if (!t) return '------'
    const code = await generateOTP(t).catch(() => '------')
    setOtp(code); return code
  }, [entry])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    if (!entry || entry.type !== 'totp') return
    const id = setInterval(() => {
      const s = getSecondsRemaining(entry.period)
      setSeconds(s); setProgress(getProgress(entry.period))
      if (s === entry.period) refresh()
    }, 500)
    return () => clearInterval(id)
  }, [entry, refresh])

  if (!entry) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Account" onBack={goBack} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text2)' }}>Entry not found</div>
    </div>
  )

  const handleIncrement = async () => {
    await incrementCounter(entry.id)
    const updated = useEntriesStore.getState().entries.find(e => e.id === entry.id)
    if (updated) await refresh(updated)
    show('Counter incremented', 'info')
  }

  const copy = async () => {
    const code = await refresh()
    await navigator.clipboard.writeText(code as string).catch(() => { })
    show('Copied!', 'success')
  }

  const displayOtp = showLocal
    ? `${otp.slice(0, Math.ceil(otp.length / 2))} ${otp.slice(Math.ceil(otp.length / 2))}`
    : '••• •••'

  const actionBtnStyle = (bg: string, col: string, bdr: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '9px 14px', borderRadius: 20, background: bg, color: col, border: bdr,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="anim-slide-right">
      <Header title="Account" onBack={goBack} right={
        <IconBtn onClick={() => toggleFavourite(entry.id)}>
          <Icons.Star size={18} filled={entry.favourite} />
        </IconBtn>
      } />

      <div style={{ flex: 1, overflowY: 'auto', padding: 13 }}>
        <div style={{ background: 'var(--c-surface2)', borderRadius: 16, padding: 18, marginBottom: 11, border: '1px solid var(--c-border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <Avatar issuer={entry.issuer} account={entry.account} size={52} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{entry.issuer || entry.account}</p>
          {entry.issuer && <p style={{ color: 'var(--c-text2)', fontSize: 13, marginBottom: 12 }}>{entry.account}</p>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 14, minHeight: 52 }}>
            <span style={{ fontSize: 34, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.08em', color: showLocal ? 'var(--c-primary)' : 'var(--c-text3)' }}>
              {displayOtp}
            </span>
            {entry.type === 'totp' && <ProgressRing progress={progress} seconds={seconds} size={42} />}
            {entry.type === 'hotp' && <CounterRing counter={entry.counter} size={42} />}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setShowLocal(v => !v)}
              style={actionBtnStyle('var(--c-surface)', 'var(--c-text)', '1px solid var(--c-border)')}>
              {showLocal ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              {showLocal ? 'Hide' : 'Show'}
            </button>
            <button onClick={copy}
              style={actionBtnStyle('var(--c-primary)', '#fff', 'none')}>
              <Icons.Copy size={14} /> Copy
            </button>
            {entry.type === 'hotp' && (
              <button onClick={handleIncrement}
                style={actionBtnStyle('#10B981', '#fff', 'none')}>
                <Icons.Refresh size={14} /> Next
              </button>
            )}
          </div>
        </div>

        <SectionCard>
          {[
            ['Type', entry.type.toUpperCase()],
            ['Algorithm', entry.algorithm],
            ['Encoding', (entry.encoding === 'auto' ? detectEncoding(entry.secret) : entry.encoding).toUpperCase()],
            ['Digits', String(entry.digits)],
            entry.type === 'totp' ? ['Period', `${entry.period}s`] : ['Counter', String(entry.counter)],
            ['Created', new Date(entry.createdAt).toLocaleDateString()],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
              <span style={{ color: 'var(--c-text2)', fontSize: 13 }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
            </div>
          ))}
        </SectionCard>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 13px 12px', borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)', display: 'flex', gap: 8 }}>
        <button onClick={() => navigate('edit', { id: entry.id })}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)' }}>
          <Icons.Edit size={15} /> Edit
        </button>
        <button onClick={() => setConfirmDel(true)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid #FFCDD2', background: '#FFF5F5', color: 'var(--c-danger)' }}>
          <Icons.Trash size={15} /> Delete
        </button>
      </div>

      <Confirm open={confirmDel} title="Delete account?" msg="This cannot be undone." danger
        onOk={async () => { await deleteEntry(entry.id); setConfirmDel(false); goBack(); show('Deleted', 'info') }}
        onCancel={() => setConfirmDel(false)} />
    </div>
  )
}
