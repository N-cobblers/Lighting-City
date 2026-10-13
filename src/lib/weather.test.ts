import { describe, expect, it } from 'vitest'
import { forecastText, nextRideForecast } from './forecast'
import { clearScenario, rainScenario } from './weather'

// 週三早上 08:30（用當地時間建日期，CI 跑在 UTC 也不會差一天）
const wed0830 = new Date(2026, 9, 14, 8, 30)

describe('天氣示範情境', () => {
  it('傍晚下雨：今晚的叫車預報改用下雨的等車預測', () => {
    const w = rainScenario(wed0830)
    expect(nextRideForecast(wed0830, false, w.eveningPop).rain).toBe(true)
  })

  it('晴天：用晴天的等車預測，18 點比較難叫、19 點好叫很多', () => {
    const w = clearScenario(wed0830)
    expect(w.note).toBe('示範情境')
    const f = nextRideForecast(wed0830, false, w.eveningPop)
    expect(f.rain).toBe(false)
    expect(f.laterOver10).toBeLessThan(f.peakOver10)
    expect(forecastText(f, w.eveningPop)).toContain('比較難叫')
  })
})
