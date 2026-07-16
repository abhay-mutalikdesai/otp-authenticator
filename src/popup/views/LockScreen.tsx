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
    <div className="lock-screen">
      <div className="lock-screen__icon">
        <Icons.Lock size={30} color="#fff" />
      </div>
      <p className="lock-screen__title">App Locked</p>
      <p className="lock-screen__subtitle">Enter your master password</p>
      <div className="lock-screen__form">
        <div style={{ marginBottom: err ? 6 : 14 }}>
          <PwInput value={pw} onChange={v => { setPw(v); setErr('') }} placeholder="Master password" onEnter={check} autoFocus />
        </div>
        {err && <p className="msg-error" style={{ marginBottom: 12, textAlign: 'center' }}>{err}</p>}
        <button onClick={check} disabled={!pw || busy}
          className={`btn btn--lg btn--full ${!pw || busy ? '' : 'btn--primary'}`}
          style={!pw || busy ? { background: 'var(--c-border)', color: 'var(--c-text3)', cursor: 'not-allowed', borderRadius: 12, fontSize: 15 } : { borderRadius: 12, fontSize: 15 }}>
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    </div>
  )
}
