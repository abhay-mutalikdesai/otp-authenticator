import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { Icons } from '../components/Icons'
import { PwInput } from '../components/primitives'

export function LockScreen() {
  const unlockWithPassword = useAuthStore(s => s.unlockWithPassword)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const check = async () => {
    if (!pw || busy) return
    setBusy(true); setErr('')
    const ok = await unlockWithPassword(pw)
    if (!ok) { setErr('Wrong password'); setPw('') }
    setBusy(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--c-surface)' }}>
      <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icons.Lock size={30} color="#fff" />
      </div>
      <p style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>App Locked</p>
      <p style={{ fontSize: 13, color: 'var(--c-text2)', marginBottom: 24 }}>Enter your master password</p>
      <div style={{ width: '100%', maxWidth: 280 }}>
        <div style={{ marginBottom: err ? 6 : 14 }}>
          <PwInput value={pw} onChange={v => { setPw(v); setErr('') }} placeholder="Master password" onEnter={check} autoFocus />
        </div>
        {err && <p style={{ fontSize: 12, color: 'var(--c-danger)', marginBottom: 12, textAlign: 'center' }}>{err}</p>}
        <button onClick={check} disabled={!pw || busy}
          style={{ width: '100%', padding: '12px', borderRadius: 12, background: (!pw || busy) ? 'var(--c-border)' : 'var(--c-primary)', color: (!pw || busy) ? 'var(--c-text3)' : '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: (!pw || busy) ? 'not-allowed' : 'pointer' }}>
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    </div>
  )
}
