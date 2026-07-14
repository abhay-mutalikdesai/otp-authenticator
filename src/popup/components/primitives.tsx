import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

      // If button is on right side of screen, anchor tooltip's right edge to button's right edge.
      // Otherwise anchor left edge to button's left edge.
      if (rect.left > w * 0.5) {
        s.right = 0
      } else {
        s.left = 0
      }

      const spaceBelow = h - rect.bottom
      const spaceAbove = rect.top
      
      if (spaceBelow < 40 && spaceAbove > spaceBelow) {
        s.bottom = '100%'
        s.marginBottom = '6px'
      } else {
        s.top = '100%'
        s.marginTop = '6px'
      }
      
      setStyle(s)
    }
  }

  return (
    <div ref={ref} style={{ display: 'inline-flex', position: 'relative' }} onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && text && (
        <div style={style}>
          <div className="anim-slide-up" style={{
            background: 'var(--c-text)',
            color: 'var(--c-surface)',
            padding: '5px 9px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {text}
          </div>
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
  const btn = (
    <button onClick={e => { if (!disabled) onClick(e) }} disabled={disabled}
      style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', background: active ? 'var(--c-primary)' : 'transparent', color: danger ? 'var(--c-danger)' : active ? '#fff' : 'var(--c-text2)', flexShrink: 0, transition: 'background .15s, color .15s', opacity: disabled ? 0.3 : 1 }}
      onMouseEnter={e => { if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-border)' }}
      onMouseLeave={e => { if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
      {children}
    </button>
  )
  return title ? <Tooltip text={disabled ? undefined : title}>{btn}</Tooltip> : btn
}

// Fixed overlay ensures menu closes on ANY click outside (including clicking the trigger button again)
export function DropMenu({ items, onClose }: {
  items: { icon: ReactNode; label: string; action: () => void; danger?: boolean }[]
  onClose: () => void
}) {
  return (
    <>
      <div onClick={onClose} data-no-drag style={{ position: 'fixed', inset: 0, zIndex: 80, cursor: 'default' }} />
      <div style={{ position: 'absolute', right: 0, top: 38, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, zIndex: 90, overflow: 'hidden', minWidth: 185 }}>
        {items.map(item => (
          <button key={item.label} onClick={e => { e.stopPropagation(); item.action(); onClose() }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', width: '100%', color: item.danger ? 'var(--c-danger)' : 'var(--c-text)', fontSize: 13, fontWeight: 500, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--c-surface2)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
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
    <div {...(windowMode ? { 'data-app-drag-region': true } : {})} style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 6px', background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', flexShrink: 0, gap: 2, zIndex: 10, position: 'relative', cursor: windowMode ? 'move' : 'default' }}>
      {onBack && <IconBtn onClick={() => onBack()}><Icons.Back size={20} /></IconBtn>}
      <span style={{ flex: 1, fontWeight: 700, fontSize: 15, marginLeft: onBack ? 4 : 8, userSelect: 'none', pointerEvents: 'none' }}>{title}</span>
      {right}
    </div>
  )
}

export function Confirm({ open, title, msg, danger, onOk, onCancel }: {
  open: boolean; title: string; msg: string; danger?: boolean; onOk: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--c-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '0 20px' }}>
      <div className="anim-slide-up" style={{ background: 'var(--c-surface)', borderRadius: 16, padding: '22px 20px', width: '100%', maxWidth: 320 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</p>
        <p style={{ color: 'var(--c-text2)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--c-surface2)', color: 'var(--c-text)', fontWeight: 600, border: '1px solid var(--c-border)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={onOk} style={{ padding: '8px 18px', borderRadius: 8, background: danger ? 'var(--c-danger)' : 'var(--c-primary)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 13 }}>{danger ? 'Delete' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Layout ─────────────────────────────────────────────────────────────────
export function SectionLabel({ text }: { text: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text2)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '14px 2px 6px' }}>{text}</p>
}
export function SectionCard({ children }: { children: ReactNode }) {
  return <div style={{ background: 'var(--c-surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--c-border)', marginBottom: 8 }}>{children}</div>
}
export function SRow({ label, children, border = true }: { label: string; children?: ReactNode; border?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: border ? '1px solid var(--c-border)' : 'none', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{label}</span>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  )
}

// ─── Form fields ────────────────────────────────────────────────────────────
export function MiniSelect({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 13, cursor: 'pointer', outline: 'none', maxWidth: 140 }}>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
export function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}
export function PwInput({ value, onChange, placeholder, onEnter, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; onEnter?: () => void; autoFocus?: boolean }) {
  const [show, setShow] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])
  return (
    <div style={{ position: 'relative' }}>
      <input ref={inputRef} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        style={{ width: '100%', padding: '9px 38px 9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-primary)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
      <button type="button" onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text2)', display: 'flex', padding: 2 }}>
        {show ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
      </button>
    </div>
  )
}
export function TextInput({ value, onChange, placeholder, type = 'text', suf }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suf?: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: suf ? '9px 38px 9px 12px' : '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-primary)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
      {suf && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>{suf}</div>}
    </div>
  )
}
export function FSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 14, appearance: 'none', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}
      onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-primary)')}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
