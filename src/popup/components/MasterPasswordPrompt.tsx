import useSettingsStore from '../../store/settingsStore'
import { useNavigationStore } from '../../store/navigationStore'
import { Icons } from './Icons'

const SNOOZE_MS = 24 * 60 * 60 * 1000 // 24h

/** First-run nudge shown once (per snooze window) while no master password is set. */
export function MasterPasswordPrompt() {
  const updateSetting = useSettingsStore(s => s.updateSetting)
  const { navigate } = useNavigationStore()

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--c-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '0 20px' }}>
      <div className="anim-slide-up" style={{ background: 'var(--c-surface)', borderRadius: 16, padding: '22px 20px', width: '100%', maxWidth: 300 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Lock size={24} color="#fff" />
          </div>
        </div>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, textAlign: 'center' }}>Protect your accounts</p>
        <p style={{ color: 'var(--c-text2)', fontSize: 13, marginBottom: 20, lineHeight: 1.5, textAlign: 'center' }}>
          Set a master password so this app locks itself when you're not using it.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => navigate('settings')}
            style={{ padding: '10px', borderRadius: 10, background: 'var(--c-primary)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
            Enable master password
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => updateSetting('mpReminderSnoozeUntil', Date.now() + SNOOZE_MS)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--c-text)' }}>
              Remind me later
            </button>
            <button onClick={() => updateSetting('mpReminderDismissed', true)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--c-text)' }}>
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
