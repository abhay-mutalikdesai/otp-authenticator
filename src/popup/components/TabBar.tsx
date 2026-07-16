export function TabBar({ tab, onTab, totpCount, hotpCount }: { tab: 'totp' | 'hotp'; onTab: (t: 'totp' | 'hotp') => void; totpCount: number; hotpCount: number }) {
  return (
    <div className="tab-bar">
      {([['totp', 'TOTP', totpCount], ['hotp', 'HOTP', hotpCount]] as const).map(([t, label, cnt]) => (
        <button key={t} onClick={() => onTab(t)}
          className={`tab-bar__btn ${tab === t ? 'tab-bar__btn--active' : ''}`}>
          {label}
          <span className={`tab-bar__badge ${tab === t ? 'tab-bar__badge--active' : ''}`}>{cnt}</span>
        </button>
      ))}
    </div>
  )
}
