import { useCallback, useEffect, useState } from 'react'
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

export function EntryDetail() {
  const { params, goBack, navigate } = useNavigationStore()
  const { entries, toggleFavourite, deleteEntry, incrementCounter } = useEntriesStore()
  const { show } = useToast()
  const entry = entries.find(e => e.id === params.id)
  const [otp, setOtp] = useState('------')
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
    <div className="view-container">
      <Header title="Account" onBack={goBack} />
      <div className="centered" style={{ flex: 1, color: 'var(--c-text2)' }}>Entry not found</div>
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

  return (
    <div className="view-container anim-slide-right">
      <Header title="Account" onBack={goBack} right={
        <IconBtn onClick={() => toggleFavourite(entry.id)}>
          <Icons.Star size={18} filled={entry.favourite} />
        </IconBtn>
      } />

      <div className="view-body" style={{ padding: 13 }}>
        <div className="detail-hero">
          <div className="centered" style={{ marginBottom: 10 }}>
            <Avatar issuer={entry.issuer} account={entry.account} size={52} />
          </div>
          <p className="detail-hero__name">{entry.issuer || entry.account}</p>
          {entry.issuer && <p className="detail-hero__account">{entry.account}</p>}

          <div className="detail-hero__otp-row">
            <span className={`otp-code otp-code--detail ${!showLocal ? 'otp-code--hidden' : ''}`}>
              {displayOtp}
            </span>
            {entry.type === 'totp' && <ProgressRing progress={progress} seconds={seconds} size={42} />}
            {entry.type === 'hotp' && <CounterRing counter={entry.counter} size={42} />}
          </div>

          <div className="detail-hero__actions">
            <button onClick={() => setShowLocal(v => !v)}
              className="btn btn--pill" style={{ background: 'var(--c-surface)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}>
              {showLocal ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              {showLocal ? 'Hide' : 'Show'}
            </button>
            <button onClick={copy} className="btn btn--pill btn--primary">
              <Icons.Copy size={14} /> Copy
            </button>
            {entry.type === 'hotp' && (
              <button onClick={handleIncrement} className="btn btn--pill" style={{ background: '#10B981', color: '#fff' }}>
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
            <div key={k} className={`detail-info-row ${i < arr.length - 1 ? 'detail-info-row--bordered' : ''}`}>
              <span className="detail-info-key">{k}</span>
              <span className="detail-info-val">{v}</span>
            </div>
          ))}
        </SectionCard>
      </div>

      <div className="detail-footer">
        <button onClick={() => navigate('edit', { id: entry.id })}
          className="detail-footer__btn" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)' }}>
          <Icons.Edit size={15} /> Edit
        </button>
        <button onClick={() => setConfirmDel(true)}
          className="detail-footer__btn btn--danger-outline">
          <Icons.Trash size={15} /> Delete
        </button>
      </div>

      <Confirm open={confirmDel} title="Delete account?" msg="This cannot be undone." danger
        onOk={async () => { await deleteEntry(entry.id); setConfirmDel(false); goBack(); show('Deleted', 'info') }}
        onCancel={() => setConfirmDel(false)} />
    </div>
  )
}
