export function OtpCode({ code, hidden }: { code: string; hidden?: boolean }) {
  if (hidden) {
    return <span className="otp-code otp-code--hidden">••• •••</span>
  }
  const mid = Math.ceil(code.length / 2)
  return (
    <span className="otp-code">
      {code.slice(0, mid)} {code.slice(mid)}
    </span>
  )
}
