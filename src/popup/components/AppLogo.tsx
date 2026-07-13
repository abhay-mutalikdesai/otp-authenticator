/**
 * Shared app brand mark (icon + name). Single source of truth for the header/about screen so
 * the in-app icon always matches the extension's manifest icon and browser-tab favicon
 * (all generated from public/favicon.svg via generate-icons.mjs).
 */
export function AppLogo({ size = 22, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
      <img src="/icons/icon-32.png" width={size} height={size} alt="" style={{ flexShrink: 0, borderRadius: 4, pointerEvents: 'none' }} />
      {withName && <span style={{ fontWeight: 700, fontSize: 15, pointerEvents: 'none' }}>OTP Authenticator</span>}
    </div>
  )
}
