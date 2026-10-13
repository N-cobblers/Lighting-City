/**
 * 錯峰點燈的判斷與計點規則（純邏輯，沒有用到 Firebase，方便單元測試）。
 * 規則和 App 的 src/lib/offpeak.ts 一致：
 * - 預約一律算錯峰；週末只算預約。
 * - 平日在自己那區的尖峰（信義區 18 點）前後一小時出發，也就是 17、19 點，才算錯峰；18 點不算。
 * - 錯峰行程點亮的格子累積成「錯峰之光」：同一格一天只算一次，每 20 格換 1 點和泰 Points，每人每月最多 20 點。
 * 時間一律換算成台北時間（UTC+8，台灣沒有日光節約時間），伺服器在哪個時區都一樣。
 */
export const PEAK_HOUR = 18
export const CELLS_PER_POINT = 20
export const MONTHLY_CAP = 20
/** 城市彙總：每區每小時至少這麼多人錯峰才公開，而且四捨五入到 10，無法從數字反推是誰 */
export const CITY_MIN_RIDERS = 20
/** 一趟行程最多帶幾格（雙北的路線取樣後通常 10–30 格） */
export const MAX_CELLS = 80

export const DISTRICTS = ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'] as const

export type TaipeiTime = { year: number; month: number; day: number; /** 0 = 週一 */ dow: number; hour: number }

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000
const pad = (n: number) => String(n).padStart(2, '0')

export function taipeiTime(ms: number): TaipeiTime {
  const d = new Date(ms + TAIPEI_OFFSET_MS)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), dow: (d.getUTCDay() + 6) % 7, hour: d.getUTCHours() }
}

export const dayKey = (t: TaipeiTime) => `${t.year}-${pad(t.month)}-${pad(t.day)}`
export const monthKey = (t: TaipeiTime) => `${t.year}-${pad(t.month)}`
export const hourKey = (t: TaipeiTime) => `${t.year}${pad(t.month)}${pad(t.day)}${pad(t.hour)}`

export function isOffpeak(t: Pick<TaipeiTime, 'dow' | 'hour'>, reserved: boolean) {
  if (reserved) return true
  if (t.dow >= 5) return false
  return t.hour === PEAK_HOUR - 1 || t.hour === PEAK_HOUR + 1
}

export type MonthState = { light: number; points: number }

/** 一趟錯峰行程：只算今天還沒算過的格子，每 20 格換 1 點，每月最多 20 點。 */
export function applyTrip(month: MonthState, dayCells: readonly string[], cells: readonly string[]) {
  const seen = new Set(dayCells)
  const fresh = [...new Set(cells)].filter((c) => !seen.has(c))
  const light = month.light + fresh.length
  const points = Math.min(MONTHLY_CAP, Math.floor(light / CELLS_PER_POINT))
  return { fresh, light, points, newPoints: Math.max(0, points - month.points) }
}

/** 公開的城市數字：人數不到 20 就不顯示，否則四捨五入到 10。 */
export function cityDisplay(riders: number): number | null {
  return riders >= CITY_MIN_RIDERS ? Math.round(riders / 10) * 10 : null
}

export type TripInput = { tripId: string; district: (typeof DISTRICTS)[number]; requestedAt: string; reserved: boolean; cells: string[] }

const TRIP_ID = /^[A-Za-z0-9_-]{1,64}$/
/** H3 第 9 級格子的 15 位十六進位編號 */
const H3_CELL = /^[0-9a-f]{15}$/
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

/** 檢查 App 送來的行程；格式不對就丟出錯誤（訊息給開發者看）。 */
export function parseTripInput(data: unknown): TripInput {
  const o = data as Record<string, unknown> | null
  if (!o || typeof o !== 'object') throw new Error('缺少行程資料')
  const { tripId, district, requestedAt, reserved, cells } = o
  if (typeof tripId !== 'string' || !TRIP_ID.test(tripId)) throw new Error('tripId 只能是 1–64 個英數字、底線或連字號')
  if (typeof district !== 'string' || !(DISTRICTS as readonly string[]).includes(district)) throw new Error('district 必須是台北市的行政區')
  if (typeof requestedAt !== 'string' || !ISO_TIME.test(requestedAt) || Number.isNaN(Date.parse(requestedAt))) throw new Error('requestedAt 必須是含時區的 ISO 時間')
  if (typeof reserved !== 'boolean') throw new Error('reserved 必須是 true 或 false')
  if (!Array.isArray(cells) || cells.length === 0 || cells.length > MAX_CELLS) throw new Error(`cells 必須有 1–${MAX_CELLS} 格`)
  if (!cells.every((c) => typeof c === 'string' && H3_CELL.test(c))) throw new Error('cells 必須是 H3 第 9 級格子編號')
  return { tripId, district: district as TripInput['district'], requestedAt, reserved, cells: cells as string[] }
}
