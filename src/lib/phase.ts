/** 一天四個時段，對齊「一天劇本」的 08:30、12:30、15:00、18:05。介面配色、地圖底圖、點亮格子顏色、小精靈表情都跟著換。 */
export type Phase = 'dawn' | 'day' | 'dusk' | 'night'

export const PHASE_LABEL: Record<Phase, string> = { dawn: '早晨', day: '白天', dusk: '黃昏', night: '夜晚' }

export function phaseOf(d: Date): Phase {
  const h = d.getHours()
  if (h >= 5 && h < 10) return 'dawn'
  if (h >= 10 && h < 15) return 'day'
  if (h >= 15 && h < 18) return 'dusk'
  return 'night'
}

/** OpenFreeMap 底圖：早晨、白天淺色，黃昏藍灰，夜晚暗色。 */
export const BASEMAP: Record<Phase, string> = {
  dawn: 'https://tiles.openfreemap.org/styles/positron',
  day: 'https://tiles.openfreemap.org/styles/positron',
  dusk: 'https://tiles.openfreemap.org/styles/fiord',
  night: 'https://tiles.openfreemap.org/styles/dark',
}

export const isLight = (p: Phase) => p === 'dawn' || p === 'day'

/** 地圖上的顏色。亮色底圖上淡黃看不見，白天改用琥珀橘系；夜晚、黃昏是暖黃光暈，越熟越亮。 */
export type MapPalette = {
  hex: [string, string, string]
  /** 1–3 階的填色透明度（還會再乘上「六角格深淺」） */
  fill: [number, number, number]
  /** 1–3 階的光暈透明度；0 代表不畫光暈 */
  glow: [number, number, number]
  outline: [string, string, string]
  grid: string
  trailGlow: string
  trailCore: string
  fallback: { bg: string; fill: string; line: string }
}

const WARM: Pick<MapPalette, 'hex' | 'fill' | 'glow' | 'outline' | 'trailGlow' | 'trailCore'> = {
  hex: ['#FFE08A', '#FFC94A', '#FFF3C4'],
  fill: [0.2, 0.45, 0.7],
  glow: [0, 0.45, 0.8],
  outline: ['#FFE08A', '#FFD873', '#FFF3C4'],
  trailGlow: '#FFC94A',
  trailCore: '#FFE9A8',
}

const AMBER: Pick<MapPalette, 'hex' | 'fill' | 'glow' | 'outline' | 'trailGlow' | 'trailCore'> = {
  hex: ['#F7C873', '#F2A93B', '#E07A1F'],
  fill: [0.3, 0.5, 0.7],
  glow: [0, 0, 0],
  outline: ['#D9A13E', '#C9851C', '#B5650F'],
  trailGlow: '#F2A93B',
  trailCore: '#C96A12',
}

export const MAP_PALETTE: Record<Phase, MapPalette> = {
  dawn: { ...AMBER, grid: '#8FA6C9', fallback: { bg: '#E4EEFB', fill: '#F4F8FE', line: '#B9CBE6' } },
  day: { ...AMBER, grid: '#9AAAC2', fallback: { bg: '#EEF2F7', fill: '#FAFBFD', line: '#C7D2E2' } },
  dusk: { ...WARM, grid: '#6A5A8C', fallback: { bg: '#2B2140', fill: '#35294F', line: '#5F4B7D' } },
  night: { ...WARM, grid: '#2B3E6B', fallback: { bg: '#0A1326', fill: '#0F1C38', line: '#2B3E6B' } },
}
