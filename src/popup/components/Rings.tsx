/** Countdown ring for TOTP entries — colour and remaining seconds are purely props-driven. */
export function ProgressRing({ progress, seconds, size = 34 }: { progress: number; seconds: number; size?: number }) {
  const r = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const color = seconds <= 5 ? '#EF4444' : seconds <= 10 ? '#F59E0B' : 'var(--c-primary)'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-border)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${circ * progress} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .5s linear, stroke .3s' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.31, fontWeight: 700, fontFamily: 'Inter', fill: color, transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
        {seconds}
      </text>
    </svg>
  )
}

/** Solid ring showing the current HOTP counter value. */
export function CounterRing({ counter, size = 34 }: { counter: number; size?: number }) {
  const r = (size - 5) / 2
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-primary)" strokeWidth={3} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.30, fontWeight: 700, fontFamily: 'Inter', fill: 'var(--c-primary)' }}>
        {counter > 999 ? '···' : counter}
      </text>
    </svg>
  )
}
