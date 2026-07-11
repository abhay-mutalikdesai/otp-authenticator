import { create } from 'zustand'
import type { OtpEntry } from '../types'
import { clearEntries, loadEntries, saveEntries } from '../lib/storage'

function generateUUID(): string {
  return crypto.randomUUID()
}

interface EntriesState {
  entries: OtpEntry[]
  selectMode: boolean
  selectedIds: Set<string>
  searchQuery: string
  loaded: boolean
  favouriteFilter: boolean

  loadFromStorage: () => Promise<void>
  addEntry: (entry: Omit<OtpEntry, 'id' | 'favourite' | 'order' | 'createdAt'>) => Promise<OtpEntry>
  updateEntry: (id: string, patch: Partial<OtpEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  deleteMany: (ids: string[]) => Promise<void>
  deleteAllEntries: () => Promise<void>
  reorderEntries: (newEntries: OtpEntry[]) => Promise<void>
  toggleFavourite: (id: string) => Promise<void>
  moveToTop: (id: string) => Promise<void>
  incrementCounter: (id: string) => Promise<void>

  setSelectMode: (val: boolean) => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setSearchQuery: (q: string) => void
  setFavouriteFilter: (val: boolean) => void
  getFilteredEntries: () => OtpEntry[]
}

const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  selectMode: false,
  selectedIds: new Set<string>(),
  searchQuery: '',
  loaded: false,
  favouriteFilter: false,

  loadFromStorage: async () => {
    const entries = await loadEntries()
    set({ entries, loaded: true })
  },

  addEntry: async (entry) => {
    const newEntry: OtpEntry = {
      ...entry,
      id: generateUUID(),
      favourite: false,
      order: get().entries.length,
      createdAt: new Date().toISOString(),
      counter: entry.counter ?? 0,
    }
    const entries = [...get().entries, newEntry]
    set({ entries })
    await saveEntries(entries)
    return newEntry
  },

  updateEntry: async (id, patch) => {
    const entries = get().entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
    set({ entries })
    await saveEntries(entries)
  },

  deleteEntry: async (id) => {
    const entries = get().entries.filter((e) => e.id !== id)
    set({ entries })
    await saveEntries(entries)
  },

  deleteMany: async (ids) => {
    const idSet = new Set(ids)
    const entries = get().entries.filter((e) => !idSet.has(e.id))
    set({ entries })
    await saveEntries(entries)
  },

  deleteAllEntries: async () => {
    set({ entries: [] })
    await clearEntries()
  },

  reorderEntries: async (newEntries) => {
    const entries = newEntries.map((e, i) => ({ ...e, order: i }))
    set({ entries })
    await saveEntries(entries)
  },

  toggleFavourite: async (id) => {
    const entry = get().entries.find((e) => e.id === id)
    if (entry) await get().updateEntry(id, { favourite: !entry.favourite })
  },

  moveToTop: async (id) => {
    const entries = get().entries
    const target = entries.find((e) => e.id === id)
    if (!target) return
    // Reorder within the same type group only
    const sameType = [...entries.filter((e) => e.type === target.type)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const idx = sameType.findIndex((e) => e.id === id)
    if (idx <= 0) return
    // Move to front within same-type group
    const reorderedSameType = [sameType[idx], ...sameType.slice(0, idx), ...sameType.slice(idx + 1)]
    const otherType = entries.filter((e) => e.type !== target.type).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    // Reassign orders: same-type first (0..n-1), then other-type (n..m)
    const sameWithOrder = reorderedSameType.map((e, i) => ({ ...e, order: i }))
    const otherWithOrder = otherType.map((e, i) => ({ ...e, order: sameWithOrder.length + i }))
    await get().reorderEntries([...sameWithOrder, ...otherWithOrder])
  },

  incrementCounter: async (id) => {
    const entry = get().entries.find((e) => e.id === id)
    if (entry) await get().updateEntry(id, { counter: (entry.counter || 0) + 1 })
  },

  setSelectMode: (val) => set({ selectMode: val, selectedIds: new Set() }),
  toggleSelect: (id) => {
    const selectedIds = new Set(get().selectedIds)
    if (selectedIds.has(id)) selectedIds.delete(id)
    else selectedIds.add(id)
    set({ selectedIds })
  },
  selectAll: () => set({ selectedIds: new Set(get().entries.map((e) => e.id)) }),
  clearSelection: () => set({ selectedIds: new Set() }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFavouriteFilter: (val) => set({ favouriteFilter: val }),

  getFilteredEntries: () => {
    const { entries, searchQuery, favouriteFilter } = get()
    const q = searchQuery.toLowerCase().trim()
    let filtered = q
      ? entries.filter(
          (e) =>
            (e.issuer || '').toLowerCase().includes(q) ||
            (e.account || '').toLowerCase().includes(q)
        )
      : entries

    if (favouriteFilter) {
      filtered = filtered.filter((e) => e.favourite)
    }

    return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  },
}))

export default useEntriesStore

