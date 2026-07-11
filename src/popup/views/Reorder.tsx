import { useRef, useState } from 'react'
import useEntriesStore from '../../store/entriesStore'
import { useNavigationStore } from '../../store/navigationStore'
import { useToast } from '../components/Toast'
import { Avatar } from '../components/Avatar'
import { Icons } from '../components/Icons'
import { Header } from '../components/primitives'

export function Reorder() {
  const { params, goBack } = useNavigationStore()
  const { entries, reorderEntries } = useEntriesStore()
  const { show } = useToast()
  const tab = (params.tab as 'totp' | 'hotp') || 'totp'
  const [items, setItems] = useState(() => [...entries].filter(e => e.type === tab).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
  const dragIdx = useRef<number | null>(null)

  const save = async () => {
    const others = entries.filter(e => e.type !== tab)
    const merged = [
      ...others.map((e, i) => ({ ...e, order: i })),
      ...items.map((e, i) => ({ ...e, order: others.length + i })),
    ]
    await reorderEntries(merged)
    show('Order saved', 'success')
    goBack()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="anim-slide-right">
      <Header title={`Reorder ${tab.toUpperCase()}`} onBack={goBack} right={
        <button onClick={save} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--c-primary)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', marginRight: 4 }}>Save</button>
      } />
      <p style={{ fontSize: 12, color: 'var(--c-text2)', padding: '7px 14px', textAlign: 'center', borderBottom: '1px solid var(--c-border)', flexShrink: 0, background: 'var(--c-surface2)' }}>Drag to reorder {tab.toUpperCase()} entries</p>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 11px' }}>
        {items.map((entry, i) => (
          <div key={entry.id} draggable
            onDragStart={() => { dragIdx.current = i }}
            onDragOver={e => { e.preventDefault(); if (dragIdx.current === null || dragIdx.current === i) return; const n = [...items]; const [m] = n.splice(dragIdx.current, 1); n.splice(i, 0, m); dragIdx.current = i; setItems(n) }}
            onDrop={() => { dragIdx.current = null }}
            style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--c-surface)', borderRadius: 11, padding: '10px 13px', marginBottom: 7, cursor: 'grab', border: '1px solid var(--c-border)' }}>
            <Icons.Grip size={17} color="var(--c-text3)" />
            <Avatar issuer={entry.issuer} account={entry.account} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.issuer || entry.account}</p>
              {entry.issuer && <p style={{ fontSize: 11, color: 'var(--c-text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.account}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
