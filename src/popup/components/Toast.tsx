import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react'

export interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info' }

const ToastCtx = createContext<{ show: (msg: string, type?: Toast['type']) => void }>({ show: () => { } })
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx)

const TOAST_COLORS: Record<Toast['type'], string> = { success: '#10B981', error: '#EF4444', info: '#6366F1' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const n = useRef(0)
  const show = useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = ++n.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2400)
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', pointerEvents: 'none', width: '100%' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: TOAST_COLORS[t.type], color: '#fff', padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', animation: 'toastIn 200ms ease both' }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
