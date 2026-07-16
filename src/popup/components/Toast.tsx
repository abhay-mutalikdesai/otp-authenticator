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
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ background: TOAST_COLORS[t.type] }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
