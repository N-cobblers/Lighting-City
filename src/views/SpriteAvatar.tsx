import { useId } from 'react'
import type { Palette } from '../lib/sprite3d'
import type { Phase } from '../lib/phase'

const DEFAULT: Palette = { name: '暖黃', body: '#FFD35C', glow: '#FFC94A', rim: '#F2A93B' }
const DUSK: Palette = { name: '橘光', body: '#FFB46B', glow: '#FF9A3D', rim: '#E07A1F' }
const INK = '#14213D'

/**
 * 車燈小精靈（2D）。圓形車燈鏡片的身體、同心光圈、眼睛與腮紅。
 * phase 只影響玩家自己的小精靈：早晨睡眼惺忪、白天笑臉、黃昏橘光加圍巾、夜晚光更強加星星眼。AR 的 3D 模型不受影響。
 */
export function SpriteAvatar({ size = 64, palette, mood = 'happy', title = '車燈小精靈', phase }: { size?: number; palette?: Palette; mood?: 'happy' | 'wow'; title?: string; phase?: Phase }) {
  const id = useId().replace(/:/g, '')
  const pal = palette || (phase === 'dusk' ? DUSK : DEFAULT)
  const c = 32
  const cy = 34
  const r = 21.8
  const night = phase === 'night'
  const eyes = mood === 'wow' ? 'wow' : phase === 'dawn' ? 'sleepy' : night ? 'star' : 'open'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <radialGradient id={`b${id}`} cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#FFF6D0" />
          <stop offset="0.45" stopColor={pal.body} />
          <stop offset="1" stopColor={pal.rim} />
        </radialGradient>
        <radialGradient id={`h${id}`}>
          <stop offset={night ? '0.45' : '0.55'} stopColor={pal.glow} stopOpacity={night ? '0.7' : '0.35'} />
          <stop offset="1" stopColor={pal.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={cy} r="31" fill={`url(#h${id})`} />
      <ellipse cx="24.2" cy="54.8" rx="3.9" ry="2.2" fill={pal.rim} />
      <ellipse cx="39.8" cy="54.8" rx="3.9" ry="2.2" fill={pal.rim} />
      <path d="M11.1 35.7 q-5.7 2.2 -6.5 7.4" stroke={pal.rim} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M52.9 35.7 q5.7 -2.6 7.4 -7.8" stroke={pal.rim} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx={c} cy={cy} r={r} fill={`url(#b${id})`} />
      <circle cx={c} cy={cy} r="17" fill="none" stroke="#FFF1BF" strokeOpacity="0.55" strokeWidth="1.1" />
      <circle cx={c} cy={cy} r="12.2" fill="none" stroke="#FFF1BF" strokeOpacity="0.35" strokeWidth="0.9" />
      <ellipse cx="25.5" cy="21.3" rx="5.7" ry="2.6" fill="#FFFBEA" fillOpacity="0.75" transform="rotate(-20 25.5 21.3)" />
      {eyes === 'wow' && (
        <>
          <circle cx="25.5" cy="33.5" r="2.9" fill={INK} />
          <circle cx="38.5" cy="33.5" r="2.9" fill={INK} />
          <ellipse cx="32" cy="41" rx="2.4" ry="2.8" fill={INK} />
        </>
      )}
      {eyes === 'open' && (
        <>
          <ellipse cx="25.5" cy="33.5" rx="2.4" ry="3.3" fill={INK} />
          <ellipse cx="38.5" cy="33.5" rx="2.4" ry="3.3" fill={INK} />
        </>
      )}
      {eyes === 'sleepy' && (
        <>
          <path d="M22.6 33.6 q2.9 2.3 5.8 0" stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none" />
          <path d="M35.6 33.6 q2.9 2.3 5.8 0" stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none" />
          <text x="47" y="21" fontSize="8" fontWeight="700" fontFamily="Fredoka, sans-serif" fill="#6C7FA6">
            z
          </text>
          <text x="51.5" y="14" fontSize="10.5" fontWeight="700" fontFamily="Fredoka, sans-serif" fill="#6C7FA6">
            z
          </text>
        </>
      )}
      {eyes === 'star' && (
        <>
          <path d="M25.5 29.6 L26.7 32.3 L29.4 33.5 L26.7 34.7 L25.5 37.4 L24.3 34.7 L21.6 33.5 L24.3 32.3 Z" fill={INK} />
          <path d="M38.5 29.6 L39.7 32.3 L42.4 33.5 L39.7 34.7 L38.5 37.4 L37.3 34.7 L34.6 33.5 L37.3 32.3 Z" fill={INK} />
        </>
      )}
      {eyes !== 'wow' && <path d="M28.5 39.6 q3.5 3.5 7 0" stroke={INK} strokeWidth="1.3" strokeLinecap="round" fill="none" />}
      {(eyes === 'open' || eyes === 'wow') && (
        <>
          <circle cx="26.3" cy="32.2" r="1" fill="#FFFBEA" />
          <circle cx="39.4" cy="32.2" r="1" fill="#FFFBEA" />
        </>
      )}
      <ellipse cx="19.8" cy="39.1" rx="3" ry="1.7" fill="#FF8A65" fillOpacity="0.5" />
      <ellipse cx="44.2" cy="39.1" rx="3" ry="1.7" fill="#FF8A65" fillOpacity="0.5" />
      {phase === 'dusk' && (
        <>
          <path d="M13.6 46.2 q18.4 8.6 36.8 0 l-1.4 4.4 q-17 7.8 -34 0 Z" fill="#D9485F" />
          <path d="M42.6 50.2 l4.6 7.6 l-4.4 1.2 l-2.6 -7.8 Z" fill="#B93A50" />
        </>
      )}
      <path d="M16.8 6.1 L17.7 8.6 L20.2 9.5 L17.7 10.5 L16.8 13 L15.8 10.5 L13.3 9.5 L15.8 8.6 Z" fill="#FFE08A" />
      <path d="M32 -0.5 L33.2 2.7 L36.4 3.9 L33.2 5.1 L32 8.2 L30.8 5.1 L27.6 3.9 L30.8 2.7 Z" fill="#FFE08A" />
      {eyes !== 'sleepy' && <path d="M47.2 6.1 L48.2 8.6 L50.7 9.5 L48.2 10.5 L47.2 13 L46.3 10.5 L43.8 9.5 L46.3 8.6 Z" fill="#FFE08A" />}
    </svg>
  )
}
