import { Icons } from './Icons'

export function EmptyState({ type, onAdd }: { type: 'totp' | 'hotp'; onAdd: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icons.Shield size={36} color="var(--c-primary)" />
      </div>
      <p className="empty-state__title">No {type.toUpperCase()} accounts</p>
      <p className="empty-state__desc">
        {type === 'totp' ? 'Add a time-based OTP account to get started.' : 'Add a counter-based HOTP account.'}
      </p>
      <button onClick={onAdd} className="btn btn--primary btn--md" style={{ gap: 8, padding: '10px 22px', borderRadius: 12, fontSize: 14 }}>
        <Icons.Plus size={17} color="#fff" /> Add Account
      </button>
    </div>
  )
}
