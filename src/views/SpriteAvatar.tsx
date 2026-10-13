import { useId } from 'react'
import type { Palette } from '../lib/sprite3d'
import type { Phase } from '../lib/phase'
import { SPRITE_PALETTES } from '../lib/lucky'

const DEFAULT: Palette = SPRITE_PALETTES[1] // 暖黃
const DUSK: Palette = SPRITE_PALETTES[0] // 琥珀
const INK = '#1B1E36'
const MOUTH = '#3B2034'

/** 四角星（星星眼、亮點） */
const star = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r} ${cy} L${cx + r * 0.3} ${cy + r * 0.3} L${cx} ${cy + r} L${cx - r * 0.3} ${cy + r * 0.3} L${cx - r} ${cy} L${cx - r * 0.3} ${cy - r * 0.3} Z`

/**
 * 車燈小精靈（2D，和拍車畫面的 3D 版同一個角色）：會發光的暖光球、頭頂一圈車燈 LED 光環、短短的手、大眼睛與兩個反光點、腮紅。
 * phase 只影響玩家自己的小精靈：早晨睡眼惺忪、白天笑臉、黃昏琥珀光加圍巾、夜晚光更強加星星眼。
 */
export function SpriteAvatar({ size = 64, palette, mood = 'happy', title = '車燈小精靈', phase }: { size?: number; palette?: Palette; mood?: 'happy' | 'wow'; title?: string; phase?: Phase }) {
  const id = useId().replace(/:/g, '')
  const pal = palette || (phase === 'dusk' ? DUSK : DEFAULT)
  const night = phase === 'night'
  const eyes = mood === 'wow' ? 'wow' : phase === 'dawn' ? 'sleepy' : night ? 'star' : 'open'
  const cx = 32
  const cy = 38
  const r = 19
  // 頭頂 LED 光環上的 8 顆亮點
  const leds = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    return [cx + Math.cos(a) * 9.6, 10.6 + Math.sin(a) * 3.3] as const
  })
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <radialGradient id={`b${id}`} cx="44%" cy="40%" r="62%">
          <stop offset="0" stopColor="#FFF4D0" />
          <stop offset="0.5" stopColor={pal.body} />
          <stop offset="0.86" stopColor={pal.rim} />
          <stop offset="1" stopColor={pal.glow} />
        </radialGradient>
        <radialGradient id={`h${id}`}>
          <stop offset="0.5" stopColor={pal.glow} stopOpacity={night ? '0.6' : '0.32'} />
          <stop offset="1" stopColor={pal.glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`g${id}`} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r="27" fill={`url(#h${id})`} />
      {/* 短短的手 */}
      <path d="M15.2 41.5 L11.2 47.6" stroke={pal.rim} strokeWidth="4.8" strokeLinecap="round" />
      <path d="M48.8 41.5 L52.8 47.6" stroke={pal.rim} strokeWidth="4.8" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={`url(#b${id})`} />
      <ellipse cx="38.6" cy="25.6" rx="4.6" ry="2.2" fill="#FFFBEA" fillOpacity="0.55" transform="rotate(25 38.6 25.6)" />
      {/* 頭頂的車燈 LED 光環 */}
      <ellipse cx={cx} cy="10.6" rx="9.6" ry="3.3" fill="none" stroke="#FFCF6E" strokeWidth="3.6" strokeOpacity="0.55" filter={`url(#g${id})`} />
      <ellipse cx={cx} cy="10.6" rx="9.6" ry="3.3" fill="none" stroke="#FFCF6E" strokeWidth="2.1" />
      {leds.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.75" fill="#FFFDF5" />
      ))}
      {eyes === 'open' && (
        <>
          <ellipse cx="25.3" cy="37" rx="3.3" ry="4.4" fill={INK} />
          <ellipse cx="38.7" cy="37" rx="3.3" ry="4.4" fill={INK} />
        </>
      )}
      {eyes === 'wow' && (
        <>
          <ellipse cx="25.3" cy="36.6" rx="3.8" ry="4.9" fill={INK} />
          <ellipse cx="38.7" cy="36.6" rx="3.8" ry="4.9" fill={INK} />
        </>
      )}
      {(eyes === 'open' || eyes === 'wow') && (
        <>
          <circle cx="26.5" cy="35.2" r="1.35" fill="#FFFFFF" />
          <circle cx="24.3" cy="38.9" r="0.6" fill="#FFFFFF" />
          <circle cx="39.9" cy="35.2" r="1.35" fill="#FFFFFF" />
          <circle cx="37.7" cy="38.9" r="0.6" fill="#FFFFFF" />
        </>
      )}
      {eyes === 'sleepy' && (
        <>
          <path d="M22.2 37 q3.1 2.6 6.2 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M35.6 37 q3.1 2.6 6.2 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <text x="49" y="25" fontSize="7.5" fontWeight="700" fontFamily="Fredoka, sans-serif" fill="#6C7FA6">
            z
          </text>
          <text x="53.5" y="19" fontSize="9.5" fontWeight="700" fontFamily="Fredoka, sans-serif" fill="#6C7FA6">
            z
          </text>
        </>
      )}
      {eyes === 'star' && (
        <>
          <path d={star(25.3, 37, 4.6)} fill={INK} />
          <path d={star(38.7, 37, 4.6)} fill={INK} />
          <circle cx="26.2" cy="35.8" r="0.7" fill="#FFFFFF" />
          <circle cx="39.6" cy="35.8" r="0.7" fill="#FFFFFF" />
        </>
      )}
      <ellipse cx="19.6" cy="42.6" rx="3.2" ry="1.8" fill="#FF7E5F" fillOpacity="0.45" />
      <ellipse cx="44.4" cy="42.6" rx="3.2" ry="1.8" fill="#FF7E5F" fillOpacity="0.45" />
      {eyes === 'wow' ? <ellipse cx="32" cy="45" rx="2.2" ry="2.6" fill={MOUTH} /> : <path d="M29.2 43.6 q2.8 2.8 5.6 0" stroke={MOUTH} strokeWidth="1.5" strokeLinecap="round" fill="none" />}
      {phase === 'dusk' && (
        <>
          <path d="M15.6 49.4 q16.4 7.6 32.8 0 l-1.3 4 q-15.1 6.8 -30.2 0 Z" fill="#D9485F" />
          <path d="M41.4 52.9 l4.1 6.7 l-3.9 1.1 l-2.3 -6.9 Z" fill="#B93A50" />
        </>
      )}
      {eyes !== 'sleepy' && <path d={star(51.5, 19.5, night ? 3.4 : 2.6)} fill="#FFE08A" />}
      {night && <path d={star(12.5, 22, 2.4)} fill="#FFE08A" />}
    </svg>
  )
}
