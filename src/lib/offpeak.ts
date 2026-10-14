import { HOME_HOUR } from './forecast'

/**
 * 錯峰點燈：不發優惠券，用光讓人錯峰。
 * 避開自己那區的尖峰（信義區平日 18 點）前後一小時出發，或提早預約，路線亮兩階；
 * 亮起來的格子累積成「錯峰之光」，每 20 格換 1 點和泰 Points，每趟最多 2 點（一趟最多 40 格計入），每人每月最多 20 點。
 * 正式版用 yoxi 自己的行程紀錄判斷是否錯峰；原型用模擬行程，點燈足跡仍只存在手機。
 */
export const PEAK_HOUR = HOME_HOUR
export const CELLS_PER_POINT = 20
export const MONTHLY_CAP = 20
/** 一趟最多算幾格錯峰之光（＝每趟最多 2 點）；長途超過的格子照樣發光，但不累計，也不留到下一趟 */
export const TRIP_CAP_CELLS = 40
export const SHIMMER_DAYS = 3
/** 城市層級的錯峰人數（示範數字；正式版用去識別化的彙總統計） */
export const CITY_DEMO = { today: 312, tomorrow: 128 }

const DAY_MS = 24 * 60 * 60 * 1000
const dowOf = (d: Date) => (d.getDay() + 6) % 7 // 0 = 週一

/** 預約一律算錯峰；現在出發只有平日在尖峰前後一小時（17、19 點）才算，週末只算預約。 */
export function isOffpeak(now: Date, reserved: boolean) {
  if (reserved) return true
  if (dowOf(now) >= 5) return false
  const h = now.getHours()
  return h === PEAK_HOUR - 1 || h === PEAK_HOUR + 1
}

export type OffpeakState = {
  /** 這個月（YYYY-MM），換月時錯峰之光與 Points 歸零 */
  month: string
  /** 本月累積的錯峰之光（格） */
  light: number
  /** 本月換到的和泰 Points */
  points: number
  /** dayCells 屬於哪一天 */
  day: string
  /** 今天已經算過的格子：同一格一天只算一次 */
  dayCells: string[]
  /** 錯峰點亮的格子 → 點亮時間，3 天內在地圖上閃爍 */
  shimmer: Record<string, number>
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const dayKey = (d: Date) => d.toDateString()

export const emptyOffpeak = (now = new Date()): OffpeakState => ({ month: monthKey(now), light: 0, points: 0, day: dayKey(now), dayCells: [], shimmer: {} })

export function liveShimmer(shimmer: Record<string, number>, nowMs: number) {
  return Object.fromEntries(Object.entries(shimmer).filter(([, t]) => Number.isFinite(t) && nowMs - t < SHIMMER_DAYS * DAY_MS))
}

/**
 * 記一趟錯峰行程：只算今天還沒算過的格子，一趟最多 40 格，每 20 格換 1 點，每月最多 20 點。
 * 超過 40 格的部分照樣閃爍，也記成今天算過，所以不會留到下一趟。capped = 這趟因為每趟上限沒算到的格數。
 */
export function applyOffpeak(prev: OffpeakState, cells: string[], now = new Date()) {
  let s = prev
  if (s.month !== monthKey(now)) s = { ...emptyOffpeak(now), shimmer: s.shimmer }
  if (s.day !== dayKey(now)) s = { ...s, day: dayKey(now), dayCells: [] }
  const seen = new Set(s.dayCells)
  const fresh = [...new Set(cells)].filter((c) => !seen.has(c))
  const counted = Math.min(fresh.length, TRIP_CAP_CELLS)
  const light = s.light + counted
  const points = Math.min(MONTHLY_CAP, Math.floor(light / CELLS_PER_POINT))
  const t = now.getTime()
  const shimmer = liveShimmer(s.shimmer, t)
  for (const c of cells) shimmer[c] = t
  const next: OffpeakState = { ...s, light, points, dayCells: [...s.dayCells, ...fresh], shimmer }
  return { next, counted, capped: fresh.length - counted, newPoints: points - s.points }
}

/** localStorage 讀回來的資料可能是舊格式或被改過，欄位不對就從頭開始。 */
export function sanitizeOffpeak(v: unknown): OffpeakState {
  const o = v as Partial<OffpeakState> | null
  if (!o || typeof o !== 'object' || typeof o.month !== 'string' || !Array.isArray(o.dayCells)) return emptyOffpeak()
  return {
    month: o.month,
    light: Math.max(0, Number(o.light) || 0),
    points: Math.max(0, Math.min(MONTHLY_CAP, Number(o.points) || 0)),
    day: typeof o.day === 'string' ? o.day : dayKey(new Date()),
    dayCells: o.dayCells.filter((c) => typeof c === 'string'),
    shimmer: liveShimmer(o.shimmer && typeof o.shimmer === 'object' ? o.shimmer : {}, Date.now()),
  }
}
