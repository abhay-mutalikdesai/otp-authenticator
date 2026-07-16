import { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
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
import { IconBtn, DropMenu, Confirm, Tooltip } from '../components/primitives'
import { AccountCard } from '../components/AccountCard'
import { TabBar } from '../components/TabBar'
import { EmptyState } from '../components/EmptyState'

export function MainList({ onLock }: { onLock?: () => void }) {
  const { navigate } = useNavigationStore()
  const {
    entries: allEntries, loadFromStorage, loaded,
    selectMode, selectedIds, setSelectMode, toggleSelect, selectAll, clearSelection, deleteMany,
    toggleFavourite, setFavouriteMany, moveToTop, deleteEntry, incrementCounter,
    searchQuery, setSearchQuery, favouriteFilter, setFavouriteFilter,
    getFilteredEntries,
  } = useEntriesStore(useShallow(s => ({
    entries: s.entries, loadFromStorage: s.loadFromStorage, loaded: s.loaded,
    selectMode: s.selectMode, selectedIds: s.selectedIds, setSelectMode: s.setSelectMode, toggleSelect: s.toggleSelect, selectAll: s.selectAll, clearSelection: s.clearSelection, deleteMany: s.deleteMany,
    toggleFavourite: s.toggleFavourite, setFavouriteMany: s.setFavouriteMany, moveToTop: s.moveToTop, deleteEntry: s.deleteEntry, incrementCounter: s.incrementCounter,
    searchQuery: s.searchQuery, setSearchQuery: s.setSearchQuery, favouriteFilter: s.favouriteFilter, setFavouriteFilter: s.setFavouriteFilter,
    getFilteredEntries: s.getFilteredEntries,
  })))
  const showOtp = useSettingsStore(s => s.showOtp)
  const updateSetting = useSettingsStore(s => s.updateSetting)
  const windowMode = useSettingsStore(s => s.windowMode)
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
    const code = await generateOTP(entry).catch(() => '------')
    await navigator.clipboard.writeText(code).catch(() => { })
    show('Copied!', 'success')
  }

  const handleMakeFavourites = async () => {
    if (selectedIds.size === 0) return
    await setFavouriteMany([...selectedIds], true)
    clearSelection(); setSelectMode(false)
    show('Added to favourites', 'success')
  }

  const handleRemoveFavourites = async () => {
    if (selectedIds.size === 0) return
    await setFavouriteMany([...selectedIds], false)
    clearSelection(); setSelectMode(false)
    show('Removed from favourites', 'success')
  }

  const selectedEntries = useMemo(() => allEntries.filter(e => selectedIds.has(e.id)), [allEntries, selectedIds])
  const allFav = selectedEntries.length > 0 && selectedEntries.every(e => e.favourite)
  const allNotFav = selectedEntries.length > 0 && selectedEntries.every(e => !e.favourite)

  const cardProps = (entry: OtpEntry) => ({
    entry, otp: otpMap[entry.id] || '------',
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
    <div className="view-container" style={{ position: 'relative' }}>
      {/* Header */}
      <div {...(windowMode ? { 'data-app-drag-region': true } : {})}
        className={`main-header ${windowMode ? 'header--draggable' : ''}`}>
        {selectMode ? (
          <>
            <IconBtn onClick={() => { setSelectMode(false); clearSelection() }}><Icons.Close size={19} /></IconBtn>
            <span className="select-count">{selectedIds.size} selected</span>
            <IconBtn onClick={() => selectAll()} title="Select all"><Icons.SelectAll size={17} /></IconBtn>
            <IconBtn onClick={handleMakeFavourites} title="Add to favourites" disabled={allFav || selectedIds.size === 0}>
              <Icons.Star filled={true} size={17} />
            </IconBtn>
            <IconBtn onClick={handleRemoveFavourites} title="Remove from favourites" disabled={allNotFav || selectedIds.size === 0}>
              <Icons.Star filled={false} size={17} />
            </IconBtn>
            <IconBtn danger onClick={() => selectedIds.size > 0 && setBulkDel(true)} title="Delete"><Icons.Trash size={17} /></IconBtn>
          </>
        ) : searchOpen ? (
          <>
            <IconBtn onClick={() => { setSearchOpen(false); setSearchQuery('') }}><Icons.Back size={19} /></IconBtn>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search accounts…"
              className="main-header__search-input" />
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
        <div className="centered" style={{ flex: 1, color: 'var(--c-text2)' }}>Loading…</div>
      ) : tabList.length === 0 && !searchQuery ? (
        <EmptyState type={tab} onAdd={() => navigate('add', { defaultType: tab })} />
      ) : (
        <div className="view-body" style={{ padding: '10px 11px 76px' }}>
          {tabList.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 48, color: 'var(--c-text2)' }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>No results</p>
            </div>
          ) : tabList.map(e => <AccountCard key={e.id} {...cardProps(e)} />)}
        </div>
      )}

      {/* FAB */}
      {!selectMode && (
        <div className="fab">
          <Tooltip text="Add account">
            <button onClick={() => navigate('add', { defaultType: tab })} className="fab__btn">+</button>
          </Tooltip>
        </div>
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
