/** Hand-rolled icon set — avoids pulling in an icon library dependency for ~20 glyphs. */
type IconProps = { size?: number; color?: string }

function makeIcon(paths: string | string[]) {
  return ({ size = 20, color }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, pointerEvents: 'none' }}>
      {(Array.isArray(paths) ? paths : [paths]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

export const Icons = {
  Back: makeIcon('M15 18l-6-6 6-6'),
  Menu: makeIcon(['M4 6h16', 'M4 12h16', 'M4 18h16']),
  Plus: makeIcon('M12 5v14M5 12h14'),
  Search: makeIcon('M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'),
  Eye: makeIcon(['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z']),
  EyeOff: makeIcon(['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94', 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22']),
  Copy: makeIcon(['M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2', 'M16 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-2']),
  Edit: makeIcon('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'),
  Trash: makeIcon(['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6']),
  Refresh: makeIcon(['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15']),
  ArrowUp: makeIcon('M5 15l7-7 7 7'),
  Grip: makeIcon(['M9 5h2', 'M9 12h2', 'M9 19h2', 'M13 5h2', 'M13 12h2', 'M13 19h2']),
  Upload: makeIcon(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12']),
  Download: makeIcon(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']),
  Info: makeIcon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 8v4', 'M12 16h.01']),
  Check: makeIcon('M20 6L9 17l-5-5'),
  Close: makeIcon(['M18 6L6 18', 'M6 6l12 12']),
  Shield: makeIcon('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
  Lock: makeIcon(['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4']),
  Settings: makeIcon(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z']),
  Star: ({ size = 20, filled = false }: { size?: number; filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#F59E0B' : 'none'} stroke={filled ? '#F59E0B' : 'currentColor'}
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, pointerEvents: 'none' }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  SelectAll: makeIcon('M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'),
}
