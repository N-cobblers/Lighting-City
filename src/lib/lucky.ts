/** 每日幸運數字：依日期算出，全台同一個，落在 10–26（四位數車牌加總最常見的範圍）。 */
export function luckyNumber(date: Date, override?: string): number {
  const o = Number(override)
  if (override && Number.isFinite(o) && o >= 0 && o <= 36) return Math.round(o)
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return 10 + (Math.abs(h) % 17)
}

/** 從辨識出的文字找出車牌，統一成「ABC-1234」格式。 */
export function extractPlate(texts: string[]): string | null {
  const joined = texts.map((t) => t.toUpperCase().replace(/[^A-Z0-9-]/g, (ch) => (ch === '一' || ch === '—' || ch === '–' ? '-' : ''))).join(' ')
  const fixes: Record<string, string> = { O: '0', I: '1', L: '1', Z: '2', S: '5', B: '8', G: '6' }
  const candidates = joined.match(/[A-Z0-9]{2,4}-?[A-Z0-9]{2,4}/g) || []
  for (const raw of candidates) {
    const m = raw.replace('-', '')
    // 新式：3 碼英文 + 4 碼數字
    const letters = m.slice(0, 3)
    const digits = m.slice(3).split('').map((c) => fixes[c] || c).join('')
    if (/^[A-Z]{3}$/.test(letters) && /^\d{4}$/.test(digits)) return `${letters}-${digits}`
    // 舊式：4 碼數字 + 2 碼英文，或 2 碼英文 + 4 碼數字
    if (/^\d{4}[A-Z]{2}$/.test(m)) return `${m.slice(0, 4)}-${m.slice(4)}`
    if (/^[A-Z]{2}\d{4}$/.test(m)) return `${m.slice(0, 2)}-${m.slice(2)}`
  }
  return null
}

export function plateDigitSum(plate: string): number {
  return plate.replace(/\D/g, '').split('').reduce((s, d) => s + Number(d), 0)
}

export function maskPlate(plate: string) {
  return plate.replace(/(\d{2})$/, '**')
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const SALT = 'yoxi-lighting-city-demo'

/**
 * 示範車隊名單：只存「車牌＋鹽」的雜湊，不存車牌本身。
 * 對應可列印的虛構示範車牌 TDX-3963、TDX-5528、TDX-1832、TDX-7708。
 */
export const DEMO_FLEET_HASHES = new Set<string>([
  'd028814023fc28dea87e3a895b7cf6938ae9a42bfb96edc994fcfd7c24b8bb5b',
  'f44dce7e9c2106ac419e0b06acfa72b707cc702de5199ab3caef3191b08edde4',
  'a76b9016aadb7764bd94fd553d91618a697e3517393c402b8b185661142e26e0',
  'e18631577789fe804aaf6c0e5d767badf627776b7a54170b0062efa0f0e5c19f',
])

export async function plateHash(plate: string) {
  return sha256Hex(`${SALT}:${plate.replace('-', '')}`)
}

export async function isFleetPlate(plate: string, hashes: Set<string>) {
  return hashes.has(await plateHash(plate))
}

export const SPRITE_PALETTES = [
  { name: '暖黃', body: '#FFD35C', glow: '#FFC94A', rim: '#F2A93B' },
  { name: '薄荷', body: '#8FF0C8', glow: '#58E0B0', rim: '#2FB88C' },
  { name: '櫻粉', body: '#FFB3C7', glow: '#FF8FB0', rim: '#E86A92' },
  { name: '天藍', body: '#9ED8FF', glow: '#6CC2FF', rim: '#3A9BE0' },
  { name: '橘光', body: '#FFB46B', glow: '#FF9A3D', rim: '#E07A1F' },
]

export function paletteFor(sum: number) {
  return SPRITE_PALETTES[sum % SPRITE_PALETTES.length]
}
