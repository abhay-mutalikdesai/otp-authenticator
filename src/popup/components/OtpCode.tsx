export function OtpCode({ code, hidden }: { code: string; hidden?: boolean }) {
  if (hidden) {
    return <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 22, letterSpacing: '0.1em', color: 'var(--c-text3)' }}>••• •••</span>
  }
  const mid = Math.ceil(code.length / 2)
  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 22, letterSpacing: '0.06em', color: 'var(--c-primary)' }}>
      {code.slice(0, mid)} {code.slice(mid)}
    </span>
  )
}
