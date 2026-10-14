import wait from '../data/wait_forecast.json'

/**
 * 叫車預報：data-pipeline/scripts/14_wait_model.py 用 LightGBM 預測的逐時「叫車到上車」（彙總，不含個別行程）。
 * 每個地點×星期×小時有中位數、八成區間（第 10–90 百分位）與等超過 10 分鐘的機率，分晴天與下雨兩種情境。
 * 地點是台北市信義、松山、大安、中山四區，加上 6 個熱門上車格；示範玩家下班從市府路上車點叫車回家。
 */
type Grid = ([number, number, number, number] | null)[][]
type WaitData = { areas: Record<string, { name: string; level: string; district?: string }>; dry: Record<string, Grid>; rain: Record<string, Grid> }
const W = wait as unknown as WaitData

export const HOME_HOUR = 18
export const LATER_HOUR = 19
/** 示範玩家下班的上車點（H3 熱門上車格） */
export const PICKUP_AREA = 'spot-cityhall'
/** 降雨機率超過這個值，傍晚以後改用「下雨」情境 */
const RAIN_POP = 60

export type WaitAt = { area: string; name: string; dow: number; hour: number; p10: number; p50: number; p90: number; pOver10: number; rain: boolean }

export const areaName = (area: string) => W.areas[area]?.name || area

/** 某地點、星期（0 = 週一）、小時的等車預測；上車格沒有資料時改看所在行政區 */
export function waitAt(area: string, dow: number, hour: number, rain = false): WaitAt | null {
  const set = rain ? W.rain : W.dry
  const key = set[area] ? area : W.areas[area]?.district || '信義區'
  const v = set[key]?.[dow]?.[hour]
  if (!v) return null
  return { area: key, name: areaName(key), dow, hour, p10: v[0], p50: v[1], p90: v[2], pOver10: v[3], rain }
}

/** 白天 8–22 點中位數的中位數，當作「平常」 */
export function usualWait(area: string, dow: number) {
  const xs = Array.from({ length: 15 }, (_, i) => waitAt(area, dow, 8 + i)?.p50).filter((x): x is number => x != null).sort((a, b) => a - b)
  return xs[Math.floor(xs.length / 2)] ?? 0
}

export type RideForecast = {
  /** 換一則預報就換 key，用來決定小精靈分頁要不要亮紅點。 */
  key: string
  /** 「現在」「今天 18 點」「明天 18 點」「週一 18 點」 */
  when: string
  isToday: boolean
  isNow: boolean
  place: string
  rain: boolean
  peakLead: number
  peakRange: [number, number]
  peakOver10: number
  usualLead: number
  laterLead: number
  laterOver10: number
  /** 現在叫車，司機大約幾分鐘到。 */
  nowWait: number
}

export const dowOf = (d: Date) => (d.getDay() + 6) % 7 // 0 = 週一
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export function nextRideForecast(now: Date, rodeHomeToday: boolean, eveningPop = 0): RideForecast {
  const today = dowOf(now)
  const h = now.getHours() + now.getMinutes() / 60
  let offset = 0
  if (today >= 5 || h >= LATER_HOUR || rodeHomeToday) {
    offset = 1
    while ((today + offset) % 7 >= 5) offset++
  }
  const dow = (today + offset) % 7
  const isNow = offset === 0 && h >= HOME_HOUR - 0.5
  const rain = offset === 0 && eveningPop >= RAIN_POP
  const target = new Date(now.getTime() + offset * 86400000)
  const when = offset === 0 ? (isNow ? '現在' : `今天 ${HOME_HOUR} 點`) : offset === 1 ? `明天 ${HOME_HOUR} 點` : `週${'一二三四五六日'[dow]} ${HOME_HOUR} 點`
  const peak = waitAt(PICKUP_AREA, dow, HOME_HOUR, rain)!
  const later = waitAt(PICKUP_AREA, dow, LATER_HOUR, rain)!
  const cur = waitAt(PICKUP_AREA, today, now.getHours(), rain && now.getHours() >= 17)
  return {
    key: `${dayKey(target)}-${isNow ? 'now' : 'ahead'}`,
    when,
    isToday: offset === 0,
    isNow,
    place: peak.name,
    rain,
    peakLead: peak.p50,
    peakRange: [peak.p10, peak.p90],
    peakOver10: peak.pOver10,
    usualLead: usualWait(PICKUP_AREA, dow),
    laterLead: later.p50,
    laterOver10: later.pOver10,
    nowWait: Math.max(3, Math.round(cur?.p50 ?? peak.p50)),
  }
}

const pct = (p: number) => `${Math.round(p * 100)}%`

export function forecastText(f: RideForecast, eveningPop: number) {
  const rain = eveningPop >= RAIN_POP ? `今晚 6 點降雨機率 ${eveningPop}%。` : ''
  const range = `八成在 ${Math.round(f.peakRange[0])}–${Math.round(f.peakRange[1])} 分內`
  if (f.peakLead - f.usualLead < 0.5) return `${rain}${f.when}${f.place}還算好叫：叫車到上車約 ${f.peakLead.toFixed(1)} 分（${range}）。`
  return `${rain}${f.when}${f.place}比較難叫：叫車到上車約 ${f.peakLead.toFixed(1)} 分（${range}），等超過 10 分鐘的機率 ${pct(f.peakOver10)}；${LATER_HOUR} 點後降到 ${f.laterLead.toFixed(1)} 分。`
}
