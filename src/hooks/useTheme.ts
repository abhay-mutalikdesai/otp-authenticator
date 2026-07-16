import { useEffect } from 'react'
import useSettingsStore from '../store/settingsStore'

export function useTheme() {
  const theme = useSettingsStore(s => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const apply = (dark: boolean) => dark ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme')
    
    if (theme === 'dark') { apply(true); return }
    if (theme === 'light') { apply(false); return }
    
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)
    
    const fn = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [theme])
}
