import type { ToolName } from './tools'

/** Gemini 連不上時的備援：用關鍵字判斷玩家想用哪個工具，參數盡量從句子裡抓。 */
export type Intent = { name: ToolName; args: Record<string, unknown> }

const DIGITS: Record<string, number> = { 零: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }

/** 「8 點」「18:30」「八點」「十一點」「晚上七點」→ 小時（0–23） */
export function parseHour(text: string): number | undefined {
  const t = text.replace(/\s/g, '')
  let h: number | undefined
  const num = t.match(/(\d{1,2})(?:[點:：])/)
  if (num) h = Number(num[1])
  else {
    const zh = t.match(/([零一二兩三四五六七八九十]{1,3})點/)
    if (zh) {
      const s = zh[1]
      if (s.startsWith('十')) h = 10 + (s.length > 1 ? DIGITS[s[1]] ?? 0 : 0)
      else if (s.length > 1 && s[1] === '十') h = DIGITS[s[0]] * 10 + (s.length > 2 ? DIGITS[s[2]] ?? 0 : 0)
      else h = DIGITS[s[0]]
    }
  }
  if (h == null || h > 23) return undefined
  if (/晚上|傍晚|下班|下午/.test(t) && h < 12) h += 12
  return h
}

export function parsePlace(text: string): string | undefined {
  if (/公司|市府|上班/.test(text)) return '公司'
  if (/101/.test(text)) return '台北101'
  if (/松菸|松山文創/.test(text)) return '松菸'
  if (/機場/.test(text)) return '松山機場'
  for (const d of ['信義區', '松山區', '大安區', '中山區']) if (text.includes(d) || text.includes(d.slice(0, 2))) return d
  if (/家|民生/.test(text)) return '家'
  return undefined
}

export function parseIntent(text: string): Intent | null {
  const t = text.replace(/\s/g, '')
  const hour = parseHour(t)
  if (/錯峰|避開|避峰|晚點走|幫我排|排一下|提早預約|不想等/.test(t)) {
    return { name: 'propose_offpeak', args: { mode: /提早預約|預約/.test(t) && !/晚點/.test(t) ? 'reserve' : 'later', ...(hour != null ? { hour } : {}) } }
  }
  if (/好叫|難叫|等多久|要等|叫得到|預報|幾點叫|塞不塞/.test(t)) {
    const day = /明天|明早|明晚/.test(t) ? 'tomorrow' : 'today'
    return { name: 'get_forecast', args: { day, ...(hour != null ? { hour } : {}), ...(parsePlace(t) ? { place: parsePlace(t) } : {}) } }
  }
  if (/任務|進度|點亮多少|錯峰之光|Points|點數/i.test(t)) return { name: 'get_progress', args: {} }
  return null
}
