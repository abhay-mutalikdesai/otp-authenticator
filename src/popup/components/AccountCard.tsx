import { useRef, useState, memo } from 'react'
import type { OtpEntry } from '../../types'
import { Avatar } from './Avatar'
import { CounterRing, ProgressRing } from './Rings'
import { OtpCode } from './OtpCode'
import { Icons } from './Icons'
import { DropMenu, Tooltip } from './primitives'

export interface AccountCardProps {
  entry: OtpEntry; otp: string; progress: number; seconds: number; showOtp: boolean
  selected: boolean; selectMode: boolean
  onSelect: () => void; onCopy: () => void; onShowDetail: () => void; onFav: () => void
  onEdit: () => void; onDelete: () => void; onMoveTop: () => void; onIncrement: () => void
}

/** Clicking the card copies the OTP. "View" lives in the 3-dot menu. */
export const AccountCard = memo(function AccountCard({ entry, otp, progress, seconds, showOtp, selected, selectMode, onSelect, onCopy, onShowDetail, onFav, onEdit, onDelete, onMoveTop, onIncrement }: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuJustClosedRef = useRef(false)
  const longRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleMenuClose = () => {
    menuJustClosedRef.current = true
    setMenuOpen(false)
    setTimeout(() => { menuJustClosedRef.current = false }, 0)
  }

  return (
    <div
      className={`account-card ${selected ? 'account-card--selected' : ''}`}
      onPointerDown={() => { longRef.current = setTimeout(() => { if (!selectMode) onSelect() }, 600) }}
      onPointerUp={() => clearTimeout(longRef.current)}
      onPointerCancel={() => clearTimeout(longRef.current)}
      onClick={() => { if (menuJustClosedRef.current) return; if (selectMode) onSelect(); else onCopy() }}>

      {selectMode && (
        <div className={`account-card__select-dot ${selected ? 'account-card__select-dot--active' : ''}`}>
          {selected && <Icons.Check size={12} color="#fff" />}
        </div>
      )}

      <Avatar issuer={entry.issuer} account={entry.account} size={42} />

      <div className="account-card__info">
        <div className="account-card__label">
          {entry.issuer ? `${entry.issuer} · ${entry.account}` : entry.account}
        </div>
        <div className="account-card__otp-row">
          <OtpCode code={otp} hidden={!showOtp} />
          {entry.type === 'hotp' && !selectMode && (
            <Tooltip text="Next OTP">
              <button onClick={e => { e.stopPropagation(); onIncrement() }} className="account-card__hotp-btn">
                <Icons.Refresh size={13} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Right-side controls: [★ if fav] [ring/counter] [3-dot + menu] */}
      {!selectMode && (
        <div className="account-card__controls">
          {entry.favourite && (
            <Tooltip text="Unfavourite">
              <button onClick={e => { e.stopPropagation(); onFav() }} className="account-card__fav-btn">
                <Icons.Star size={14} filled />
              </button>
            </Tooltip>
          )}
          {entry.type === 'totp' && <ProgressRing progress={progress} seconds={seconds} size={34} />}
          {entry.type === 'hotp' && <CounterRing counter={entry.counter} size={34} />}
          <Tooltip text="More">
            <button
              onClick={e => { e.stopPropagation(); if (menuOpen) { handleMenuClose() } else { setMenuOpen(true) } }}
              className="account-card__more-btn">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', pointerEvents: 'none' }}>
                <circle cx="12" cy="5" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="12" cy="19" r="2.2" />
              </svg>
            </button>
          </Tooltip>
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
}, (prev, next) => {
  return prev.entry === next.entry &&
    prev.otp === next.otp &&
    prev.progress === next.progress &&
    prev.seconds === next.seconds &&
    prev.showOtp === next.showOtp &&
    prev.selected === next.selected &&
    prev.selectMode === next.selectMode
})
