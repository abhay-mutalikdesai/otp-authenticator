/**
 * Shared app brand mark (icon + name). Single source of truth for the header/about screen so
 * the in-app icon always matches the extension's manifest icon and browser-tab favicon
 * (all generated from public/favicon.svg via generate-icons.mjs).
 */
export function AppLogo({ size = 22, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img src="/icons/icon-32.png" width={size} height={size} alt="" style={{ flexShrink: 0, borderRadius: 4 }} />
      {withName && <span style={{ fontWeight: 700, fontSize: 15 }}>OTP Authenticator</span>}
    </div>
  )
}
