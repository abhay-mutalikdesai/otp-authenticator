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
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

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
    <div className="view-container anim-slide-right">
      <Header title={`Reorder ${tab.toUpperCase()}`} onBack={goBack} right={
        <button onClick={save} className="btn btn--primary btn--sm" style={{ marginRight: 4, padding: '6px 14px' }}>Save</button>
      } />
      <p className="reorder-hint">Drag to reorder {tab.toUpperCase()} entries</p>
      <div className="view-body" style={{ padding: '8px 11px' }}
        onDragEnter={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      >
        {items.map((entry, i) => (
          <div key={entry.id} draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', i.toString())
              e.dataTransfer.effectAllowed = 'move'
              dragIdx.current = i
            }}
            onDragEnter={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDragOver={e => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              if (dragIdx.current !== null && dragIdx.current !== i) setHoverIdx(i)
            }}
            onDragEnd={() => { dragIdx.current = null; setHoverIdx(null) }}
            onDrop={e => {
              e.preventDefault()
              if (dragIdx.current !== null && hoverIdx !== null && dragIdx.current !== hoverIdx) {
                const n = [...items]
                const [m] = n.splice(dragIdx.current, 1)
                n.splice(hoverIdx, 0, m)
                setItems(n)
              }
              dragIdx.current = null; setHoverIdx(null)
            }}
            className={`reorder-item ${hoverIdx === i ? 'reorder-item--hover' : ''}`}
            style={{ opacity: dragIdx.current === i ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <Icons.Grip size={17} color="var(--c-text3)" />
            </div>
            <div style={{ pointerEvents: 'none' }}>
              <Avatar issuer={entry.issuer} account={entry.account} size={34} />
            </div>
            <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
              <p className="reorder-item__name">{entry.issuer || entry.account}</p>
              {entry.issuer && <p className="reorder-item__account">{entry.account}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
