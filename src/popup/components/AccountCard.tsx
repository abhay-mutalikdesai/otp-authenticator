import { useRef, useState } from 'react'
import type { OtpEntry } from '../../types'
import { Avatar } from './Avatar'
import { CounterRing, ProgressRing } from './Rings'
import { OtpCode } from './OtpCode'
import { Icons } from './Icons'
import { DropMenu } from './primitives'

export interface AccountCardProps {
  entry: OtpEntry; otp: string; progress: number; seconds: number; showOtp: boolean
  selected: boolean; selectMode: boolean
  onSelect: () => void; onCopy: () => void; onShowDetail: () => void; onFav: () => void
  onEdit: () => void; onDelete: () => void; onMoveTop: () => void; onIncrement: () => void
}

/** Clicking the card copies the OTP. "View" lives in the 3-dot menu. */
export function AccountCard({ entry, otp, progress, seconds, showOtp, selected, selectMode, onSelect, onCopy, onShowDetail, onFav, onEdit, onDelete, onMoveTop, onIncrement }: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuJustClosedRef = useRef(false)
  const longRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleMenuClose = () => {
    menuJustClosedRef.current = true
    setMenuOpen(false)
    // Reset the flag after the click event cycle completes
    setTimeout(() => { menuJustClosedRef.current = false }, 0)
  }

  return (
    <div
      style={{ background: 'var(--c-surface)', borderRadius: 13, padding: '11px 10px 11px 13px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 11, border: `1.5px solid ${selected ? 'var(--c-primary)' : 'var(--c-border)'}`, cursor: 'pointer', position: 'relative', transition: 'border-color .15s', userSelect: 'none' }}
      onPointerDown={() => { longRef.current = setTimeout(() => { if (!selectMode) onSelect() }, 600) }}
      onPointerUp={() => clearTimeout(longRef.current)}
      onPointerCancel={() => clearTimeout(longRef.current)}
      onClick={() => { if (menuJustClosedRef.current) return; if (selectMode) onSelect(); else onCopy() }}>

      {selectMode && (
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${selected ? 'var(--c-primary)' : 'var(--c-border)'}`, background: selected ? 'var(--c-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
          {selected && <Icons.Check size={12} color="#fff" />}
        </div>
      )}

      <Avatar issuer={entry.issuer} account={entry.account} size={42} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--c-text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
          {entry.issuer ? `${entry.issuer} · ${entry.account}` : entry.account}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OtpCode code={otp} hidden={!showOtp} />
          {entry.type === 'hotp' && !selectMode && (
            <button onClick={e => { e.stopPropagation(); onIncrement() }}
              title="Next OTP"
              style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--c-border)', background: 'var(--c-surface2)', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Icons.Refresh size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Right-side controls: [★ if fav] [ring/counter] [3-dot + menu] */}
      {!selectMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, position: 'relative' }}>
          {entry.favourite && (
            <button onClick={e => { e.stopPropagation(); onFav() }} title="Unfavourite"
              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: '#F59E0B' }}>
              <Icons.Star size={14} filled />
            </button>
          )}
          {entry.type === 'totp' && <ProgressRing progress={progress} seconds={seconds} size={34} />}
          {entry.type === 'hotp' && <CounterRing counter={entry.counter} size={34} />}
          <button
            onClick={e => { e.stopPropagation(); if (menuOpen) { handleMenuClose() } else { setMenuOpen(true) } }}
            title="More"
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text3)', position: 'relative', zIndex: 1 }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--c-border)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', pointerEvents: 'none' }}>
              <circle cx="12" cy="5" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="12" cy="19" r="2.2" />
            </svg>
          </button>
          {menuOpen && (
            <DropMenu onClose={handleMenuClose} items={[
              { icon: <Icons.Eye size={15} />, label: 'View', action: onShowDetail },
              { icon: <Icons.Copy size={15} />, label: 'Copy OTP', action: onCopy },
              { icon: <Icons.Star size={15} filled={entry.favourite} />, label: entry.favourite ? 'Unfavourite' : 'Favourite', action: onFav },
              { icon: <Icons.ArrowUp size={15} />, label: 'Move to top', action: onMoveTop },
              { icon: <Icons.Edit size={15} />, label: 'Edit', action: onEdit },
              { icon: <Icons.Trash size={15} />, label: 'Delete', action: onDelete, danger: true },
            ]} />
          )}
        </div>
      )}
    </div>
  )
}
