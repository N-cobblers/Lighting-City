import { useId } from 'react'
import type { Palette } from '../lib/sprite3d'

const DEFAULT: Palette = { name: '暖黃', body: '#FFD35C', glow: '#FFC94A', rim: '#F2A93B' }

/** 車燈小精靈（2D）。圓形車燈鏡片的身體、同心光圈、眼睛與腮紅。 */
export function SpriteAvatar({ size = 64, palette = DEFAULT, mood = 'happy', title = '車燈小精靈' }: { size?: number; palette?: Palette; mood?: 'happy' | 'wow'; title?: string }) {
  const id = useId().replace(/:/g, '')
  const c = 32
  const cy = 34
  const r = 21.8
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <radialGradient id={`b${id}`} cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#FFF6D0" />
          <stop offset="0.45" stopColor={palette.body} />
          <stop offset="1" stopColor={palette.rim} />
        </radialGradient>
        <radialGradient id={`h${id}`}>
          <stop offset="0.55" stopColor={palette.glow} stopOpacity="0.35" />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={cy} r="31" fill={`url(#h${id})`} />
      <ellipse cx="24.2" cy="54.8" rx="3.9" ry="2.2" fill={palette.rim} />
      <ellipse cx="39.8" cy="54.8" rx="3.9" ry="2.2" fill={palette.rim} />
      <path d="M11.1 35.7 q-5.7 2.2 -6.5 7.4" stroke={palette.rim} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M52.9 35.7 q5.7 -2.6 7.4 -7.8" stroke={palette.rim} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx={c} cy={cy} r={r} fill={`url(#b${id})`} />
      <circle cx={c} cy={cy} r="17" fill="none" stroke="#FFF1BF" strokeOpacity="0.55" strokeWidth="1.1" />
      <circle cx={c} cy={cy} r="12.2" fill="none" stroke="#FFF1BF" strokeOpacity="0.35" strokeWidth="0.9" />
      <ellipse cx="25.5" cy="21.3" rx="5.7" ry="2.6" fill="#FFFBEA" fillOpacity="0.75" transform="rotate(-20 25.5 21.3)" />
      {mood === 'wow' ? (
        <>
          <circle cx="25.5" cy="33.5" r="2.9" fill="#14213D" />
          <circle cx="38.5" cy="33.5" r="2.9" fill="#14213D" />
          <ellipse cx="32" cy="41" rx="2.4" ry="2.8" fill="#14213D" />
        </>
      ) : (
        <>
          <ellipse cx="25.5" cy="33.5" rx="2.4" ry="3.3" fill="#14213D" />
          <ellipse cx="38.5" cy="33.5" rx="2.4" ry="3.3" fill="#14213D" />
          <path d="M28.5 39.6 q3.5 3.5 7 0" stroke="#14213D" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </>
      )}
      <circle cx="26.3" cy="32.2" r="1" fill="#FFFBEA" />
      <circle cx="39.4" cy="32.2" r="1" fill="#FFFBEA" />
      <ellipse cx="19.8" cy="39.1" rx="3" ry="1.7" fill="#FF8A65" fillOpacity="0.5" />
      <ellipse cx="44.2" cy="39.1" rx="3" ry="1.7" fill="#FF8A65" fillOpacity="0.5" />
      <path d="M16.8 6.1 L17.7 8.6 L20.2 9.5 L17.7 10.5 L16.8 13 L15.8 10.5 L13.3 9.5 L15.8 8.6 Z" fill="#FFE08A" />
      <path d="M32 -0.5 L33.2 2.7 L36.4 3.9 L33.2 5.1 L32 8.2 L30.8 5.1 L27.6 3.9 L30.8 2.7 Z" fill="#FFE08A" />
      <path d="M47.2 6.1 L48.2 8.6 L50.7 9.5 L48.2 10.5 L47.2 13 L46.3 10.5 L43.8 9.5 L46.3 8.6 Z" fill="#FFE08A" />
    </svg>
  )
}
