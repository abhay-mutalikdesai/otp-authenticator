import type { PlatformAdapter } from './types'
import { chromeAdapter } from './chromeAdapter'
import { tauriAdapter } from './tauriAdapter'
import { webAdapter } from './webAdapter'

/**
 * Platform adapter registry — first active non-fallback adapter wins.
 * To add a new platform (Firefox, Electron, etc.), create an adapter file
 * and add it to this array. Zero changes needed in any component or store.
 */
const adapters: PlatformAdapter[] = [
  chromeAdapter,
  tauriAdapter,
  // Future: firefoxAdapter, electronAdapter
]

const adapter = adapters.find(a => a !== webAdapter && a.isActive()) ?? webAdapter

if (adapter.init) {
  adapter.init().catch(console.error)
}

export const platform = adapter
