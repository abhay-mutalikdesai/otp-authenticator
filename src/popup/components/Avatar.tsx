const AV_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#0EA5E9', '#3B82F6', '#7C3AED', '#06B6D4']

function getAvatarColor(s: string): string {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}

function getInitials(issuer: string, account: string): string {
  const s = (issuer || account || '?').trim()
  const w = s.split(/\s+/)
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : s.slice(0, 2).toUpperCase()
}

export function Avatar({ issuer, account, size = 40 }: { issuer?: string; account?: string; size?: number }) {
  const bg = getAvatarColor(issuer || account || '?')
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: Math.round(size * 0.36), flexShrink: 0, userSelect: 'none' }}>
      {getInitials(issuer || '', account || '?')}
    </div>
  )
}
