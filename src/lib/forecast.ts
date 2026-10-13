import demand from '../data/demand.json'

/**
 * 示範玩家「你的下一趟」預報：平日 18:00 從市府附近叫車回民生社區。
 * 數字是 demand.json 裡信義區各星期幾、逐時的「叫車到上車」中位數（彙總資料），和營運頁用同一份。
 */
const LEAD: number[][] = (demand as any).profiles['台北市信義區'].lead_p50

export const HOME_HOUR = 18
export const LATER_HOUR = 19

export type RideForecast = {
  /** 換一則預報就換 key，用來決定小精靈分頁要不要亮紅點。 */
  key: string
  /** 「現在」「今天 18 點」「明天 18 點」「週一 18 點」 */
  when: string
  isToday: boolean
  isNow: boolean
  peakLead: number
  usualLead: number
  laterLead: number
  /** 現在叫車，司機大約幾分鐘到。 */
  nowWait: number
}

const dowOf = (d: Date) => (d.getDay() + 6) % 7 // 0 = 週一
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

function usual(dow: number) {
  const xs = LEAD[dow].slice(8, 23).slice().sort((a, b) => a - b)
  return xs[Math.floor(xs.length / 2)]
}

export function nextRideForecast(now: Date, rodeHomeToday: boolean): RideForecast {
  const today = dowOf(now)
  const h = now.getHours() + now.getMinutes() / 60
  let offset = 0
  if (today >= 5 || h >= LATER_HOUR || rodeHomeToday) {
    offset = 1
    while ((today + offset) % 7 >= 5) offset++
  }
  const dow = (today + offset) % 7
  const isNow = offset === 0 && h >= HOME_HOUR - 0.5
  const target = new Date(now.getTime() + offset * 86400000)
  const when = offset === 0 ? (isNow ? '現在' : `今天 ${HOME_HOUR} 點`) : offset === 1 ? `明天 ${HOME_HOUR} 點` : `週${'一二三四五六日'[dow]} ${HOME_HOUR} 點`
  return {
    key: `${dayKey(target)}-${isNow ? 'now' : 'ahead'}`,
    when,
    isToday: offset === 0,
    isNow,
    peakLead: LEAD[dow][HOME_HOUR],
    usualLead: usual(dow),
    laterLead: LEAD[dow][LATER_HOUR],
    nowWait: Math.max(3, Math.round(LEAD[today][now.getHours()])),
  }
}

export function forecastText(f: RideForecast, eveningPop: number) {
  const rain = eveningPop >= 60 ? `今晚 6 點降雨機率 ${eveningPop}%。` : ''
  const peak = f.peakLead.toFixed(1)
  const base = f.usualLead.toFixed(1)
  if (f.peakLead - f.usualLead < 0.5) return `${rain}${f.when}信義區還算好叫：叫車到上車約 ${peak} 分（平常 ${base} 分）。`
  return `${rain}${f.when}信義區比較難叫：叫車到上車約 ${peak} 分（平常 ${base} 分），${LATER_HOUR} 點後降到 ${f.laterLead.toFixed(1)} 分。`
}
