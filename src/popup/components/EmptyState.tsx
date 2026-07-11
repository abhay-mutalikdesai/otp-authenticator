import { Icons } from './Icons'

export function EmptyState({ type, onAdd }: { type: 'totp' | 'hotp'; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icons.Shield size={36} color="var(--c-primary)" />
      </div>
      <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>No {type.toUpperCase()} accounts</p>
      <p style={{ fontSize: 13, color: 'var(--c-text2)', lineHeight: 1.6, marginBottom: 24 }}>
        {type === 'totp' ? 'Add a time-based OTP account to get started.' : 'Add a counter-based HOTP account.'}
      </p>
      <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, background: 'var(--c-primary)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
        <Icons.Plus size={17} color="#fff" /> Add Account
      </button>
    </div>
  )
}
