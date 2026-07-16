import useSettingsStore from '../../store/settingsStore'
import { useNavigationStore } from '../../store/navigationStore'
import { Icons } from './Icons'

const SNOOZE_MS = 24 * 60 * 60 * 1000 // 24h — "Remind me later"
const LONG_SNOOZE_MS = 90 * 24 * 60 * 60 * 1000 // 90 days — "Don't show again"; bounded (not
// forever) so this security nudge can never get silenced permanently with no way back.

/** First-run nudge shown once (per snooze window) while no master password is set. */
export function MasterPasswordPrompt() {
  const updateSetting = useSettingsStore(s => s.updateSetting)
  const { navigate } = useNavigationStore()

  return (
    <div className="overlay">
      <div className="anim-slide-up mp-prompt">
        <div className="centered" style={{ marginBottom: 12 }}>
          <div className="mp-prompt__icon">
            <Icons.Lock size={24} color="#fff" />
          </div>
        </div>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, textAlign: 'center' }}>Protect your accounts</p>
        <p style={{ color: 'var(--c-text2)', fontSize: 13, marginBottom: 20, lineHeight: 1.5, textAlign: 'center' }}>
          Set a master password so this app locks itself when you're not using it.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => navigate('settings')} className="btn btn--primary btn--md btn--full"
            style={{ padding: 10, borderRadius: 10 }}>
            Enable master password
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => updateSetting('mpReminderSnoozeUntil', Date.now() + SNOOZE_MS)}
              className="btn btn--secondary btn--sm" style={{ flex: 1, fontSize: 12 }}>
              Remind me later
            </button>
            <button onClick={() => updateSetting('mpReminderSnoozeUntil', Date.now() + LONG_SNOOZE_MS)}
              className="btn btn--secondary btn--sm" style={{ flex: 1, fontSize: 12 }}>
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
