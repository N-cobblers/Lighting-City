import { describe, expect, it } from 'vitest'
import { parseHour, parseIntent, parsePlace } from './intent'

describe('parseHour：從句子抓小時', () => {
  it.each([
    ['明天 8 點', 8],
    ['18:30 出發', 18],
    ['晚上七點', 19],
    ['下午三點', 15],
    ['十一點', 11],
    ['十八點', 18],
    ['二十點', 20],
  ])('%s → %i', (text, hour) => {
    expect(parseHour(text)).toBe(hour)
  })

  it('沒有時間、或只有 101 這種數字時不亂抓', () => {
    expect(parseHour('早上好叫嗎')).toBeUndefined()
    expect(parseHour('台北101好叫嗎')).toBeUndefined()
  })
})

describe('parsePlace：玩家口中的地點', () => {
  it.each([
    ['從公司叫車', '公司'],
    ['市府那邊', '公司'],
    ['回家', '家'],
    ['台北101', '台北101'],
    ['去松菸', '松菸'],
    ['松山機場', '松山機場'],
    ['大安區', '大安區'],
  ])('%s → %s', (text, place) => {
    expect(parsePlace(text)).toBe(place)
  })
})

describe('parseIntent：Gemini 連不上時判斷要用哪個工具', () => {
  it('問好不好叫 → 查預報，帶日期、小時、地點', () => {
    expect(parseIntent('明天 8 點從公司叫車好叫嗎？')).toEqual({ name: 'get_forecast', args: { day: 'tomorrow', hour: 8, place: '公司' } })
  })

  it('想避開尖峰 → 排錯峰（預設晚點走）', () => {
    expect(parseIntent('幫我避開尖峰')).toEqual({ name: 'propose_offpeak', args: { mode: 'later' } })
  })

  it('提早預約 → 排錯峰的預約版', () => {
    expect(parseIntent('幫我提早預約')).toEqual({ name: 'propose_offpeak', args: { mode: 'reserve' } })
  })

  it('問任務或進度 → 查進度', () => {
    expect(parseIntent('我今天還有哪些任務？')?.name).toBe('get_progress')
    expect(parseIntent('錯峰之光還差多少')?.name).toBe('get_progress')
  })

  it('其他話題交給原本的示範回覆（例如原本的預約回家流程）', () => {
    expect(parseIntent('今天的幸運數字是？')).toBeNull()
    expect(parseIntent('幫我預約回家')).toBeNull()
  })
})
