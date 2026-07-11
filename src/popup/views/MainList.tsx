import { useEffect, useMemo, useState } from 'react'
import useEntriesStore from '../../store/entriesStore'
import useSettingsStore from '../../store/settingsStore'
import useAuthStore from '../../store/authStore'
import { useNavigationStore } from '../../store/navigationStore'
import type { OtpEntry } from '../../types'
import { generateOTP, getProgress, getSecondsRemaining } from '../../lib/otp'
import { useOtpData } from '../hooks/useOtpData'
import { useToast } from '../components/Toast'
import { AppLogo } from '../components/AppLogo'
import { Icons } from '../components/Icons'
import { IconBtn, DropMenu, Confirm } from '../components/primitives'
import { AccountCard } from '../components/AccountCard'
import { TabBar } from '../components/TabBar'
import { EmptyState } from '../components/EmptyState'

export function MainList({ onLock }: { onLock?: () => void }) {
  const { navigate } = useNavigationStore()
  const {
    entries: allEntries, loadFromStorage, loaded,
    selectMode, selectedIds, setSelectMode, toggleSelect, selectAll, clearSelection, deleteMany,
    toggleFavourite, moveToTop, deleteEntry, incrementCounter,
    searchQuery, setSearchQuery, favouriteFilter, setFavouriteFilter,
    getFilteredEntries,
  } = useEntriesStore()
  const showOtp = useSettingsStore(s => s.showOtp)
  const updateSetting = useSettingsStore(s => s.updateSetting)
  const hasMasterPw = useAuthStore(s => s.hasMasterPassword)
  const { show } = useToast()

  const [tab, setTab] = useState<'totp' | 'hotp'>('totp')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [delId, setDelId] = useState<string | null>(null)
  const [bulkDel, setBulkDel] = useState(false)

  useEffect(() => { if (!loaded) loadFromStorage() }, [loaded, loadFromStorage])

  const filtered = useMemo(() => getFilteredEntries(), [allEntries, searchQuery, favouriteFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  const totpList = useMemo(() => filtered.filter(e => e.type === 'totp'), [filtered])
  const hotpList = useMemo(() => filtered.filter(e => e.type === 'hotp'), [filtered])
  const tabList = tab === 'totp' ? totpList : hotpList

  const { otpMap, progressMap, secondsMap, refreshOne } = useOtpData(tabList)

  const handleCopy = async (entry: OtpEntry) => {
    // Always generate a fresh code regardless of showOtp visibility state
    const code = await generateOTP(entry).catch(() => '------')
    await navigator.clipboard.writeText(code).catch(() => { })
    show('Copied!', 'success')
  }

  const cardProps = (entry: OtpEntry) => ({
    entry, otp: otpMap[entry.id] || '------',
    // Each entry uses its own period-specific progress and countdown
    progress: progressMap[entry.id] ?? getProgress(entry.period ?? 30),
    seconds: secondsMap[entry.id] ?? getSecondsRemaining(entry.period ?? 30),
    showOtp,
    selected: selectedIds.has(entry.id), selectMode,
    onSelect: () => { if (!selectMode) setSelectMode(true); toggleSelect(entry.id) },
    onCopy: () => handleCopy(entry),
    onShowDetail: () => navigate('detail', { id: entry.id }),
    onFav: () => toggleFavourite(entry.id),
    onMoveTop: () => { moveToTop(entry.id); show('Moved to top', 'info') },
    onEdit: () => navigate('edit', { id: entry.id }),
    onDelete: () => setDelId(entry.id),
    onIncrement: async () => {
      await incrementCounter(entry.id)
      const updated = useEntriesStore.getState().entries.find(e => e.id === entry.id)
      if (updated) await refreshOne(updated)
    },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 4px', background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        {selectMode ? (
          <>
            <IconBtn onClick={() => { setSelectMode(false); clearSelection() }}><Icons.Close size={19} /></IconBtn>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 14, marginLeft: 6 }}>{selectedIds.size} selected</span>
            <IconBtn onClick={() => selectAll()} title="Select all"><Icons.SelectAll size={17} /></IconBtn>
            <IconBtn danger onClick={() => selectedIds.size > 0 && setBulkDel(true)} title="Delete"><Icons.Trash size={17} /></IconBtn>
          </>
        ) : searchOpen ? (
          <>
            <IconBtn onClick={() => { setSearchOpen(false); setSearchQuery('') }}><Icons.Back size={19} /></IconBtn>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search accounts…"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: 'var(--c-text)', outline: 'none' }} />
            {searchQuery && <IconBtn onClick={() => setSearchQuery('')}><Icons.Close size={17} /></IconBtn>}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, marginLeft: 6 }}>
              <AppLogo size={22} />
            </div>
            <IconBtn onClick={() => updateSetting('showOtp', !showOtp)} title={showOtp ? 'Hide OTPs' : 'Show OTPs'}>
              {showOtp ? <Icons.Eye size={17} /> : <Icons.EyeOff size={17} />}
            </IconBtn>
            <IconBtn onClick={() => setFavouriteFilter(!favouriteFilter)} active={favouriteFilter} title="Favourites">
              <Icons.Star size={17} filled={favouriteFilter} />
            </IconBtn>
            <IconBtn onClick={() => setSearchOpen(true)} title="Search"><Icons.Search size={17} /></IconBtn>
            {hasMasterPw && onLock && <IconBtn onClick={() => onLock()} title="Lock app"><Icons.Lock size={17} /></IconBtn>}
            <div style={{ position: 'relative' }}>
              <IconBtn onClick={() => setMenuOpen(v => !v)} title="Menu"><Icons.Menu size={17} /></IconBtn>
              {menuOpen && (
                <DropMenu onClose={() => setMenuOpen(false)} items={[
                  { icon: <Icons.SelectAll size={16} />, label: 'Select entries', action: () => setSelectMode(true) },
                  { icon: <Icons.Grip size={16} />, label: 'Reorder', action: () => navigate('reorder', { tab }) },
                  { icon: <Icons.Settings size={16} />, label: 'Settings', action: () => navigate('settings') },
                  { icon: <Icons.Info size={16} />, label: 'About', action: () => navigate('about') },
                ]} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Tab bar */}
      {!searchOpen && !selectMode && (
        <TabBar tab={tab} onTab={t => { setTab(t); clearSelection() }} totpCount={totpList.length} hotpCount={hotpList.length} />
      )}

      {/* Body */}
      {!loaded ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text2)' }}>Loading…</div>
      ) : tabList.length === 0 && !searchQuery ? (
        <EmptyState type={tab} onAdd={() => navigate('add', { defaultType: tab })} />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 11px 76px' }}>
          {tabList.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 48, color: 'var(--c-text2)' }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>No results</p>
            </div>
          ) : tabList.map(e => <AccountCard key={e.id} {...cardProps(e)} />)}
        </div>
      )}

      {/* FAB */}
      {!selectMode && (
        <button onClick={() => navigate('add', { defaultType: tab })} title="Add account"
          style={{ position: 'absolute', bottom: 18, right: 14, width: 52, height: 52, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, fontSize: 26, transition: 'transform .15s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}>
          +
        </button>
      )}

      <Confirm open={delId !== null} title="Delete account?" msg="This cannot be undone." danger
        onOk={async () => { await deleteEntry(delId!); setDelId(null); show('Deleted', 'info') }}
        onCancel={() => setDelId(null)} />
      <Confirm
        open={bulkDel}
        title={`Delete ${selectedIds.size} account${selectedIds.size !== 1 ? 's' : ''}?`}
        msg="This cannot be undone." danger
        onOk={async () => { await deleteMany([...selectedIds]); clearSelection(); setSelectMode(false); setBulkDel(false); show('Deleted', 'info') }}
        onCancel={() => setBulkDel(false)} />
    </div>
  )
}
