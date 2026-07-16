import { useState } from 'react'
import useAuthStore from '../../../store/authStore'
import { useToast } from '../../components/Toast'
import { PwInput } from '../../components/primitives'

export function MasterPasswordPanel() {
  const { show } = useToast()
  const hasPw = useAuthStore(s => s.hasMasterPassword)
  const setPassword = useAuthStore(s => s.setPassword)
  const changePassword = useAuthStore(s => s.changePassword)
  const removePassword = useAuthStore(s => s.removePassword)

  const [mode, setMode] = useState<'idle' | 'set' | 'change' | 'remove'>('idle')
  const [curr, setCurr] = useState('')
  const [nw, setNw] = useState('')
  const [conf, setConf] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const reset = () => { setCurr(''); setNw(''); setConf(''); setErr(''); setMode('idle') }

  const handleSave = async () => {
    if (nw.length < 4) { setErr('Minimum 4 characters'); return }
    if (nw !== conf) { setErr('Passwords do not match'); return }
    setBusy(true)
    try {
      if (mode === 'change') {
        const ok = await changePassword(curr, nw)
        if (!ok) { setErr('Wrong current password'); return }
      } else {
        await setPassword(nw)
      }
      show('Master password saved!', 'success')
      reset()
    } finally { setBusy(false) }
  }

  const handleRemove = async () => {
    if (!curr) { setErr('Enter your current password'); return }
    setBusy(true)
    try {
      const ok = await removePassword(curr)
      if (!ok) { setErr('Wrong password'); return }
      show('Master password removed', 'info')
      reset()
    } finally { setBusy(false) }
  }

  if (mode === 'idle') return (
    <div className="mp-panel-idle">
      {hasPw ? (
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => setMode('change')} className="btn btn--secondary btn--sm" style={{ flex: 1 }}>Change</button>
          <button onClick={() => setMode('remove')} className="btn btn--danger-outline btn--sm" style={{ flex: 1 }}>Remove</button>
        </div>
      ) : (
        <button onClick={() => setMode('set')} className="btn btn--primary btn--sm btn--full">Set Master Password</button>
      )}
    </div>
  )

  return (
    <div className="mp-panel-form">
      <p className="mp-panel-form__title">
        {mode === 'set' ? 'Set password' : mode === 'change' ? 'Change password' : 'Remove password'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(mode === 'change' || mode === 'remove') && (
          <PwInput value={curr} onChange={v => { setCurr(v); setErr('') }} placeholder="Current password" />
        )}
        {mode !== 'remove' && (
          <>
            <PwInput value={nw} onChange={v => { setNw(v); setErr('') }} placeholder="New password (min. 4 chars)" />
            <PwInput value={conf} onChange={v => { setConf(v); setErr('') }} placeholder="Confirm new password" />
          </>
        )}
      </div>
      {err && <p className="msg-error" style={{ marginTop: 7 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        <button onClick={reset} className="btn btn--secondary btn--sm" style={{ flex: 1 }}>Cancel</button>
        <button onClick={mode === 'remove' ? handleRemove : handleSave} disabled={busy}
          className={`btn btn--sm ${mode === 'remove' ? 'btn--danger' : 'btn--primary'}`}
          style={{ flex: 1, opacity: busy ? 0.7 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}>
          {mode === 'remove' ? 'Remove' : 'Save'}
        </button>
      </div>
    </div>
  )
}
