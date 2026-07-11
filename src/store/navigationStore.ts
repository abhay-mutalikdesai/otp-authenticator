import { create } from 'zustand'

export type View = 'list' | 'detail' | 'add' | 'edit' | 'reorder' | 'settings' | 'about'

interface NavigationState {
  view: View
  params: Record<string, any>
  history: { view: View; params: Record<string, any> }[]
  navigate: (view: View, params?: Record<string, any>) => void
  goBack: () => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  view: 'list',
  params: {},
  history: [],
  navigate: (view, params = {}) => {
    set((state) => ({
      history: [...state.history, { view: state.view, params: state.params }],
      view,
      params,
    }))
  },
  goBack: () => {
    const history = [...get().history]
    const prev = history.pop()
    if (prev) {
      set({ view: prev.view, params: prev.params, history })
    } else {
      set({ view: 'list', params: {}, history: [] })
    }
  },
}))
export default useNavigationStore;
