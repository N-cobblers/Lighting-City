import type { Weather, WeatherBlock } from './types'

/** 錄影當天不一定下雨，所以提供「傍晚下雨」情境。 */
export function rainScenario(now: Date): Weather {
  const d = (h: number) => {
    const x = new Date(now)
    x.setHours(h, 0, 0, 0)
    return x.toISOString()
  }
  return {
    source: 'scenario',
    desc: '多雲，傍晚起短暫陣雨',
    blocks: [
      { start: d(6), end: d(18), pop: 30, desc: '多雲' },
      { start: d(18), end: d(23), pop: 80, desc: '短暫陣雨' },
    ],
    eveningPop: 80,
    note: '示範情境',
  }
}

/** 不下雨的情境：傍晚的叫車預報用晴天的等車預測，錄錯峰點燈（晚一小時好叫很多）時用。 */
export function clearScenario(now: Date): Weather {
  const d = (h: number) => {
    const x = new Date(now)
    x.setHours(h, 0, 0, 0)
    return x.toISOString()
  }
  return {
    source: 'scenario',
    desc: '晴時多雲',
    blocks: [
      { start: d(6), end: d(18), pop: 10, desc: '晴時多雲' },
      { start: d(18), end: d(23), pop: 10, desc: '多雲' },
    ],
    eveningPop: 10,
    note: '示範情境',
  }
}

const pick = (obj: any, ...keys: string[]) => {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined) return obj[k]
    const found = Object.keys(obj).find((x) => x.toLowerCase() === k.toLowerCase())
    if (found) return obj[found]
  }
  return undefined
}

/** 中央氣象署 F-C0032-001（一般天氣預報－今明 36 小時天氣預報），臺北市。 */
export async function fetchCwa(key: string, now: Date): Promise<Weather> {
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${encodeURIComponent(key)}&format=JSON&locationName=${encodeURIComponent('臺北市')}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`氣象署 API ${res.status}`)
  const json = await res.json()
  const records = pick(json, 'records')
  const locs = pick(records, 'location', 'locations') || []
  const loc = (Array.isArray(locs) ? locs : [locs]).find((l: any) => String(pick(l, 'locationName') || '').includes('臺北')) || (Array.isArray(locs) ? locs[0] : locs)
  const els = pick(loc, 'weatherElement', 'weatherelement') || []
  const el = (name: string) => els.find((e: any) => pick(e, 'elementName') === name)
  const popEl = el('PoP')
  const wxEl = el('Wx')
  const times = (e: any) => (pick(e, 'time') || []) as any[]
  const blocks: WeatherBlock[] = times(popEl).map((t: any, i: number) => {
    const p = pick(t, 'parameter')
    const wx = times(wxEl)[i]
    return {
      start: String(pick(t, 'startTime')),
      end: String(pick(t, 'endTime')),
      pop: Number(pick(p, 'parameterName') ?? 0),
      desc: wx ? String(pick(pick(wx, 'parameter'), 'parameterName') || '') : undefined,
    }
  })
  if (!blocks.length) throw new Error('氣象署資料格式無法解析')
  const evening = new Date(now)
  evening.setHours(19, 0, 0, 0)
  const toDate = (s: string) => new Date(s.replace(' ', 'T') + (s.includes('+') ? '' : '+08:00'))
  const eveningBlock = blocks.find((b) => toDate(b.start) <= evening && evening < toDate(b.end)) || blocks[0]
  return { source: 'cwa', desc: blocks[0].desc || '', blocks, eveningPop: eveningBlock.pop }
}
