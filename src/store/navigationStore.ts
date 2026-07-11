import { create } from 'zustand'
import { getSessionValue, removeSessionValue, setSessionValue, SESSION_KEYS } from '../lib/sessionState'

export type View = 'list' | 'detail' | 'add' | 'edit' | 'reorder' | 'settings' | 'about'

type HistoryEntry = { view: View; params: Record<string, any> }
interface PersistedNav { view: View; params: Record<string, any>; history: HistoryEntry[]; savedAt: number }

interface NavigationState {
  view: View
  params: Record<string, any>
  history: HistoryEntry[]
  navigate: (view: View, params?: Record<string, any>) => void
  goBack: () => void
  /** Restores the last-known screen from a previous popup session (before the popup was
   * closed by clicking outside it). `maxAgeMs` caps how stale that state may be — pass
   * `null` for no cap (master password enabled: state lives until locked/browser close). */
  hydrate: (maxAgeMs: number | null) => Promise<void>
}

function persist(state: { view: View; params: Record<string, any>; history: HistoryEntry[] }) {
  void setSessionValue(SESSION_KEYS.nav, { ...state, savedAt: Date.now() })
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  view: 'list',
  params: {},
  history: [],
  navigate: (view, params = {}) => {
    set((state) => {
      const next = { history: [...state.history, { view: state.view, params: state.params }], view, params }
      persist(next)
      return next
    })
  },
  goBack: () => {
    const history = [...get().history]
    const prev = history.pop()
    const next = prev ? { view: prev.view, params: prev.params, history } : { view: 'list' as View, params: {}, history: [] }
    set(next)
    persist(next)
  },
  hydrate: async (maxAgeMs) => {
    const saved = await getSessionValue<PersistedNav>(SESSION_KEYS.nav)
    if (!saved) return
    if (maxAgeMs !== null && Date.now() - saved.savedAt > maxAgeMs) {
      await removeSessionValue(SESSION_KEYS.nav)
      return
    }
    set({ view: saved.view, params: saved.params, history: saved.history })
  },
}))
export default useNavigationStore;
