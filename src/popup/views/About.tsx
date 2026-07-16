import { useNavigationStore } from '../../store/navigationStore'
import { Icons } from '../components/Icons'
import { Header, SectionCard } from '../components/primitives'
import pkg from '../../../package.json'

const REPO_URL = 'https://github.com/abhay-mutalikdesai/otp-authenticator'

export function About() {
  const { goBack } = useNavigationStore()
  return (
    <div className="view-container anim-slide-right">
      <Header title="About" onBack={goBack} />
      <div className="view-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/icons/icon-128.png" width={72} height={72} alt="" style={{ marginBottom: 14, marginTop: 16 }} />
        <p style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>OTP Authenticator</p>
        <p style={{ color: 'var(--c-text2)', fontSize: 13, marginBottom: 12 }}>Secure · Private · Local-first</p>

        <SectionCard>
          {[
            ['Version', pkg.version],
            ['Standards', 'TOTP (RFC 6238), HOTP (RFC 4226)'],
            ['Algorithms', 'SHA-1, SHA-256, SHA-512'],
            ['Crypto', 'Web Crypto API'],
            ['Security', 'SHA-256 master password'],
            ['Source code', (
              <a key="source-code" href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text)', textDecoration: 'none' }}>
                GitHub <Icons.ExternalLink size={14} />
              </a>
            )],
          ].map(([k, v], i, arr) => (
            <div key={k as string} className={`detail-info-row ${i < arr.length - 1 ? 'detail-info-row--bordered' : ''}`} style={{ gap: 12 }}>
              <span className="detail-info-key" style={{ alignSelf: 'center' }}>{k as string}</span>
              <span className="detail-info-val" style={{ textAlign: 'right', display: 'flex', alignItems: 'center' }}>{v}</span>
            </div>
          ))}
        </SectionCard>

        <p className="about-disclaimer">
          Disclaimer: This app is AI generated and vibe coded.
        </p>
      </div>
    </div>
  )
}
