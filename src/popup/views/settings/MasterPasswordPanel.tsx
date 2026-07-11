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
    <div style={{ padding: '10px 14px 12px' }}>
      {hasPw ? (
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => setMode('change')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--c-text)' }}>Change</button>
          <button onClick={() => setMode('remove')} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FFCDD2', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--c-danger)' }}>Remove</button>
        </div>
      ) : (
        <button onClick={() => setMode('set')} style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'var(--c-primary)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Set Master Password</button>
      )}
    </div>
  )

  return (
    <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--c-border)', background: 'var(--c-surface2)' }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--c-text)' }}>
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
      {err && <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 7 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        <button onClick={reset} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--c-text)' }}>Cancel</button>
        <button onClick={mode === 'remove' ? handleRemove : handleSave} disabled={busy}
          style={{ flex: 1, padding: '8px', borderRadius: 8, background: mode === 'remove' ? 'var(--c-danger)' : 'var(--c-primary)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {mode === 'remove' ? 'Remove' : 'Save'}
        </button>
      </div>
    </div>
  )
}
