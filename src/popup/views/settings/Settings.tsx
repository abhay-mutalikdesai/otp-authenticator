import { useState } from 'react'
import useSettingsStore from '../../../store/settingsStore'
import useEntriesStore from '../../../store/entriesStore'
import useAuthStore from '../../../store/authStore'
import { useNavigationStore } from '../../../store/navigationStore'
import { useToast } from '../../components/Toast'
import { Header, SectionLabel, SectionCard, SRow, MiniSelect, Confirm } from '../../components/primitives'
import { MasterPasswordPanel } from './MasterPasswordPanel'
import { ImportExportPanel } from './ImportExportPanel'
import { platform } from '../../../lib/platform'

/**
 * - "Clear all" is split into two separate actions: Delete accounts / Reset settings
 * - Auto-lock option only shown when a master password is set
 */
export function Settings() {
  const { goBack } = useNavigationStore()
  const s = useSettingsStore()
  const entries = useEntriesStore(st => st.entries)
  const deleteAllEntries = useEntriesStore(st => st.deleteAllEntries)
  const hasPw = useAuthStore(st => st.hasMasterPassword)
  const { show } = useToast()
  const [confirmDeleteAccts, setConfirmDeleteAccts] = useState(false)
  const [confirmResetSettings, setConfirmResetSettings] = useState(false)

  const isDesktop = platform.canSetWindowMode

  return (
    <div className="view-container anim-slide-right">
      <Header title="Settings" onBack={goBack} />
      <div className="view-body" style={{ padding: '0 11px 20px' }}>

        <SectionLabel text="Display" />
        <SectionCard>
          <SRow label="Theme" border={isDesktop}>
            <MiniSelect value={s.theme} onChange={v => s.updateSetting('theme', v as never)} opts={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          </SRow>
          {isDesktop && (
            <SRow label="Window mode" border={false}>
              <MiniSelect value={String(!!s.windowMode)} onChange={v => s.updateSetting('windowMode', v === 'true' as never)} opts={[{ value: 'false', label: 'Static' }, { value: 'true', label: 'Draggable' }]} />
            </SRow>
          )}
        </SectionCard>

        <SectionLabel text="New Account Defaults" />
        <SectionCard>
          <SRow label="Algorithm">
            <MiniSelect value={s.defaultAlgorithm} onChange={v => s.updateSetting('defaultAlgorithm', v as never)} opts={[{ value: 'SHA256', label: 'SHA-256' }, { value: 'SHA1', label: 'SHA-1' }, { value: 'SHA512', label: 'SHA-512' }]} />
          </SRow>
          <SRow label="Digits">
            <MiniSelect value={String(s.defaultDigits)} onChange={v => s.updateSetting('defaultDigits', parseInt(v) as never)} opts={['4', '6', '8'].map(d => ({ value: d, label: `${d} digits` }))} />
          </SRow>
          <SRow label="Period (TOTP)" border={false}>
            <MiniSelect value={String(s.defaultPeriod)} onChange={v => s.updateSetting('defaultPeriod', parseInt(v) as never)} opts={['15', '30', '60', '90', '120'].map(p => ({ value: p, label: `${p}s` }))} />
          </SRow>
        </SectionCard>

        <SectionLabel text="Security" />
        <SectionCard>
          <SRow label="Master password" border={hasPw}>
            <span style={{ fontSize: 12, fontWeight: 700, color: hasPw ? 'var(--c-success)' : 'var(--c-text3)' }}>
              {hasPw ? '✓ Protected' : 'Not set'}
            </span>
          </SRow>
          {hasPw && (
            <SRow label="Auto-lock after" border={false}>
              <MiniSelect
                value={String(s.autoLockMinutes ?? 0)}
                onChange={v => s.updateSetting('autoLockMinutes', parseInt(v) as never)}
                opts={[
                  { value: '0', label: 'Never' },
                  { value: '1', label: '1 min' },
                  { value: '5', label: '5 min' },
                  { value: '15', label: '15 min' },
                  { value: '30', label: '30 min' },
                  { value: '60', label: '1 hour' },
                ]}
              />
            </SRow>
          )}
          <MasterPasswordPanel />
        </SectionCard>

        <SectionLabel text="Import / Export" />
        <SectionCard>
          <div style={{ padding: '12px 14px' }}>
            <ImportExportPanel hasAccounts={entries.length > 0} />
          </div>
        </SectionCard>

        <SectionLabel text="Data" />
        <SectionCard>
          <SRow label={`Delete all accounts (${entries.length})`} border>
            <button onClick={() => entries.length > 0 && setConfirmDeleteAccts(true)}
              disabled={entries.length === 0}
              className={`btn btn--sm ${entries.length === 0 ? '' : 'btn--danger'}`}
              style={entries.length === 0 ? { background: 'var(--c-border)', color: 'var(--c-text3)', cursor: 'not-allowed', padding: '5px 12px', borderRadius: 7 } : { padding: '5px 12px', borderRadius: 7 }}>
              Delete
            </button>
          </SRow>
          <SRow label="Reset settings to defaults" border={false}>
            <button onClick={() => setConfirmResetSettings(true)}
              className="btn btn--danger btn--sm" style={{ padding: '5px 12px', borderRadius: 7 }}>
              Reset
            </button>
          </SRow>
        </SectionCard>

      </div>

      <Confirm open={confirmDeleteAccts}
        title={`Delete all ${entries.length} account${entries.length !== 1 ? 's' : ''}?`}
        msg="All accounts will be permanently deleted. Your settings are kept."
        danger
        onOk={async () => { await deleteAllEntries(); setConfirmDeleteAccts(false); show('All accounts deleted', 'info') }}
        onCancel={() => setConfirmDeleteAccts(false)} />

      <Confirm open={confirmResetSettings}
        title="Reset settings?"
        msg="All settings will return to defaults. Your accounts are kept."
        onOk={async () => { await s.resetSettings(); setConfirmResetSettings(false); show('Settings reset', 'info') }}
        onCancel={() => setConfirmResetSettings(false)} />
    </div>
  )
}
