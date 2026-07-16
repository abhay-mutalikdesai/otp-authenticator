import { ReactNode, useEffect, useRef, useState } from 'react'
import useSettingsStore from '../../store/settingsStore'
import { Icons } from './Icons'

export function Tooltip({ text, children }: { text?: string; children: ReactNode }) {
  const [show, setShow] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (!text) return
    setShow(true)
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const w = document.documentElement.clientWidth || window.innerWidth
      const h = document.documentElement.clientHeight || window.innerHeight

      let s: React.CSSProperties = {
        position: 'absolute',
        zIndex: 99999,
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }

      if (rect.left > w * 0.5) { s.right = 0 } else { s.left = 0 }

      const spaceBelow = h - rect.bottom
      const spaceAbove = rect.top
      if (spaceBelow < 40 && spaceAbove > spaceBelow) {
        s.bottom = '100%'; s.marginBottom = '6px'
      } else {
        s.top = '100%'; s.marginTop = '6px'
      }
      setStyle(s)
    }
  }

  return (
    <div ref={ref} className="tooltip-wrap" onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && text && (
        <div style={style}>
          <div className="anim-slide-up tooltip-bubble">{text}</div>
        </div>
      )}
    </div>
  )
}

// ─── Buttons & menus ────────────────────────────────────────────────────────
export function IconBtn({ children, onClick, danger, active, title, disabled }: {
  children: ReactNode; onClick: (e: React.MouseEvent) => void
  danger?: boolean; active?: boolean; title?: string; disabled?: boolean
}) {
  const cls = ['icon-btn', active && 'icon-btn--active', danger && 'icon-btn--danger'].filter(Boolean).join(' ')
  const btn = <button onClick={e => { if (!disabled) onClick(e) }} disabled={disabled} className={cls}>{children}</button>
  return title ? <Tooltip text={disabled ? undefined : title}>{btn}</Tooltip> : btn
}

// Fixed overlay ensures menu closes on ANY click outside (including clicking the trigger button again)
export function DropMenu({ items, onClose }: {
  items: { icon: ReactNode; label: string; action: () => void; danger?: boolean }[]
  onClose: () => void
}) {
  return (
    <>
      <div onClick={onClose} data-no-drag className="drop-menu-backdrop" />
      <div className="drop-menu">
        {items.map(item => (
          <button key={item.label}
            onClick={e => { e.stopPropagation(); item.action(); onClose() }}
            className={`drop-menu__item ${item.danger ? 'drop-menu__item--danger' : ''}`}>
            {item.icon}<span style={{ marginLeft: 2 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  const windowMode = useSettingsStore(s => s.windowMode)
  return (
    <div {...(windowMode ? { 'data-app-drag-region': true } : {})} className={`header ${windowMode ? 'header--draggable' : ''}`}>
      {onBack && <IconBtn onClick={() => onBack()}><Icons.Back size={20} /></IconBtn>}
      <span className="header__title" style={{ marginLeft: onBack ? 4 : 8 }}>{title}</span>
      {right}
    </div>
  )
}

export function Confirm({ open, title, msg, danger, onOk, onCancel }: {
  open: boolean; title: string; msg: string; danger?: boolean; onOk: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="overlay">
      <div className="anim-slide-up confirm-modal">
        <p className="confirm-modal__title">{title}</p>
        <p className="confirm-modal__msg">{msg}</p>
        <div className="confirm-modal__actions">
          <button onClick={onCancel} className="btn btn--secondary btn--sm">Cancel</button>
          <button onClick={onOk} className={`btn btn--sm ${danger ? 'btn--danger' : 'btn--primary'}`}
            style={{ padding: '8px 18px' }}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Layout ─────────────────────────────────────────────────────────────────
export function SectionLabel({ text }: { text: string }) {
  return <p className="section-label">{text}</p>
}
export function SectionCard({ children }: { children: ReactNode }) {
  return <div className="section-card">{children}</div>
}
export function SRow({ label, children, border = true }: { label: string; children?: ReactNode; border?: boolean }) {
  return (
    <div className={`section-row ${border ? 'section-row--bordered' : ''}`}>
      <span className="section-row__label">{label}</span>
      {children && <div className="section-row__value">{children}</div>}
    </div>
  )
}

// ─── Form fields ────────────────────────────────────────────────────────────
export function MiniSelect({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="mini-select">
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
export function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      {children}
      {error && <p className="field__error">{error}</p>}
    </div>
  )
}
export function PwInput({ value, onChange, placeholder, onEnter, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; onEnter?: () => void; autoFocus?: boolean }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])
  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }
  return (
    <div className="input-wrap">
      <input ref={inputRef} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        className="input input--with-suffix" style={{ paddingRight: 60 }} />
      <div className="pw-actions">
        <button type="button" onClick={handleCopy} className="pw-toggle" style={{ position: 'static', transform: 'none' }} title="Copy secret">
          {copied ? <Icons.Check size={16} color="var(--c-success, #22c55e)" /> : <Icons.Copy size={16} />}
        </button>
        <button type="button" onClick={() => setShow(v => !v)} className="pw-toggle" style={{ position: 'static', transform: 'none' }} title={show ? 'Hide' : 'Show'}>
          {show ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
        </button>
      </div>
    </div>
  )
}
export function TextInput({ value, onChange, placeholder, type = 'text', suf }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suf?: ReactNode }) {
  return (
    <div className="input-wrap">
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`input ${suf ? 'input--with-suffix' : ''}`} />
      {suf && <div className="input-suffix">{suf}</div>}
    </div>
  )
}
export function FSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="select">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
