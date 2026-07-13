import { useNavigationStore } from '../../store/navigationStore'
import { Icons } from '../components/Icons'
import { Header, SectionCard } from '../components/primitives'
import pkg from '../../../package.json'

const REPO_URL = 'https://github.com/abhay-mutalikdesai/otp-authenticator'

export function About() {
  const { goBack } = useNavigationStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="anim-slide-right">
      <Header title="About" onBack={goBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text)', textDecoration: 'none' }}>
                GitHub <Icons.ExternalLink size={14} />
              </a>
            )],
          ].map(([k, v], i, arr) => (
            <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--c-border)' : 'none', gap: 12 }}>
              <span style={{ color: 'var(--c-text2)', fontSize: 13, alignSelf: 'center' }}>{k as string}</span>
              <span style={{ fontWeight: 600, fontSize: 13, textAlign: 'right', display: 'flex', alignItems: 'center' }}>{v}</span>
            </div>
          ))}
        </SectionCard>

        <p style={{ color: 'var(--c-text)', fontSize: 12, fontStyle: 'italic', fontWeight: 800, marginTop: 22, textAlign: 'center' }}>
          Disclaimer: This app is AI generated and vibe coded.
        </p>
      </div>
    </div>
  )
}
