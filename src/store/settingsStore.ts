import { create } from 'zustand'
import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS, loadSettings as loadSettingsFromStorage, saveSettings } from '../lib/storage'

interface SettingsState extends AppSettings {
  loaded: boolean
  loadSettings: () => Promise<void>
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  resetSettings: () => Promise<void>
}

function toAppSettings(s: SettingsState): AppSettings {
  return {
    theme: s.theme,
    defaultDigits: s.defaultDigits,
    defaultAlgorithm: s.defaultAlgorithm,
    defaultPeriod: s.defaultPeriod,
    showOtp: s.showOtp,
    autoLockMinutes: s.autoLockMinutes,
  }
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    const settings = await loadSettingsFromStorage()
    set({ ...settings, loaded: true })
  },

  updateSetting: async (key, value) => {
    set({ [key]: value } as Pick<SettingsState, typeof key>)
    await saveSettings(toAppSettings(get()))
  },

  resetSettings: async () => {
    set({ ...DEFAULT_SETTINGS })
    await saveSettings(DEFAULT_SETTINGS)
  },
}))

export default useSettingsStore

