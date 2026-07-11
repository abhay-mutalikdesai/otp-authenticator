export function TabBar({ tab, onTab, totpCount, hotpCount }: { tab: 'totp' | 'hotp'; onTab: (t: 'totp' | 'hotp') => void; totpCount: number; hotpCount: number }) {
  return (
    <div style={{ display: 'flex', padding: '8px 12px 0', gap: 6, background: 'var(--c-surface2)', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
      {([['totp', 'TOTP', totpCount], ['hotp', 'HOTP', hotpCount]] as const).map(([t, label, cnt]) => (
        <button key={t} onClick={() => onTab(t)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0 9px', borderRadius: 0, background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: `2.5px solid ${tab === t ? 'var(--c-primary)' : 'transparent'}`, color: tab === t ? 'var(--c-primary)' : 'var(--c-text2)', fontWeight: tab === t ? 700 : 500, fontSize: 13, transition: 'color .15s, border-color .15s' }}>
          {label}
          <span style={{ fontSize: 11, fontWeight: 700, background: tab === t ? 'var(--c-primary)' : 'var(--c-border)', color: tab === t ? '#fff' : 'var(--c-text3)', borderRadius: 10, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>{cnt}</span>
        </button>
      ))}
    </div>
  )
}
