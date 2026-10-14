import { describe, expect, it } from 'vitest'
import { applyOffpeak, CELLS_PER_POINT, emptyOffpeak, isOffpeak, MONTHLY_CAP, PEAK_HOUR, TRIP_CAP_CELLS } from './offpeak'
import * as server from '../../functions/src/offpeak'

// 2026/10/12 是週一；用當地時間建立日期，App 的判斷也看當地時間
const at = (day: number, hour: number, minute = 5) => new Date(2026, 9, day, hour, minute)
const cells = (from: number, n: number) => Array.from({ length: n }, (_, i) => `cell-${from + i}`)

describe('錯峰判斷', () => {
  it('預約一律算錯峰（平日尖峰、週末都算）', () => {
    expect(isOffpeak(at(13, 18), true)).toBe(true)
    expect(isOffpeak(at(17, 18), true)).toBe(true)
  })
  it('週末只算預約', () => {
    for (const day of [17, 18]) for (let h = 0; h < 24; h++) expect(isOffpeak(at(day, h), false)).toBe(false)
  })
  it('平日 17、19 點算，18 點和其他時段不算', () => {
    for (let day = 12; day <= 16; day++) {
      expect(isOffpeak(at(day, 17), false)).toBe(true)
      expect(isOffpeak(at(day, 19), false)).toBe(true)
      expect(isOffpeak(at(day, 18), false)).toBe(false)
      expect(isOffpeak(at(day, 16), false)).toBe(false)
      expect(isOffpeak(at(day, 20), false)).toBe(false)
    }
  })
})

describe('錯峰之光與 Points', () => {
  it('同一格一天只算一次，一趟裡重複的格子也只算一次', () => {
    const s0 = emptyOffpeak(at(13, 9))
    const a = applyOffpeak(s0, [...cells(0, 10), 'cell-3'], at(13, 19))
    expect(a.counted).toBe(10)
    const b = applyOffpeak(a.next, cells(5, 10), at(13, 19, 40))
    expect(b.counted).toBe(5)
    expect(b.next.light).toBe(15)
  })
  it('隔天同一格可以再算', () => {
    const a = applyOffpeak(emptyOffpeak(at(13, 9)), cells(0, 10), at(13, 19))
    const b = applyOffpeak(a.next, cells(0, 10), at(14, 19))
    expect(b.counted).toBe(10)
  })
  it(`每 ${CELLS_PER_POINT} 格換 1 點，每月最多 ${MONTHLY_CAP} 點`, () => {
    let s = emptyOffpeak(at(1, 9))
    let newPoints = 0
    // 每天一趟長途，每趟最多算 40 格：10 天剛好 400 格＝20 點，第 11 天不再加
    for (let day = 1; day <= 11; day++) {
      const r = applyOffpeak(s, cells(0, 80), new Date(2026, 9, day, 19, 5))
      s = r.next
      newPoints = r.newPoints
    }
    expect(s.light).toBe(440)
    expect(s.points).toBe(MONTHLY_CAP)
    expect(newPoints).toBe(0)
  })
  it('每趟最多 2 點：小雅一趟 167 格只算 40 格', () => {
    const r = applyOffpeak(emptyOffpeak(at(13, 9)), cells(0, 167), at(13, 19))
    expect(r).toMatchObject({ counted: TRIP_CAP_CELLS, capped: 127, newPoints: 2 })
    expect(r.next.light).toBe(40)
    // 超過的格子照樣閃爍
    expect(Object.keys(r.next.shimmer)).toHaveLength(167)
  })
  it('超過的格子不留到下一趟：同一天再走同一段不會再算', () => {
    const a = applyOffpeak(emptyOffpeak(at(13, 9)), cells(0, 167), at(13, 8))
    const b = applyOffpeak(a.next, cells(0, 167), at(13, 19))
    expect(b).toMatchObject({ counted: 0, capped: 0, newPoints: 0 })
    expect(b.next.light).toBe(40)
  })
  it('累積到一半的錯峰之光加上一趟長途，也只多換 2 點', () => {
    const a = applyOffpeak(emptyOffpeak(at(13, 9)), cells(0, 19), at(13, 8))
    expect(a.newPoints).toBe(0)
    const b = applyOffpeak(a.next, cells(100, 120), at(13, 19))
    expect(b).toMatchObject({ counted: 40, newPoints: 2 })
    expect(b.next).toMatchObject({ light: 59, points: 2 })
  })
  it('短程不受影響：12 格就算 12 格', () => {
    const r = applyOffpeak(emptyOffpeak(at(13, 9)), cells(0, 12), at(13, 19))
    expect(r).toMatchObject({ counted: 12, capped: 0, newPoints: 0 })
  })
  it('換月時錯峰之光和 Points 歸零，閃爍的格子保留', () => {
    const a = applyOffpeak(emptyOffpeak(at(30, 9)), cells(0, 30), at(31, 19))
    expect(a.next.points).toBe(1)
    const b = applyOffpeak(a.next, cells(100, 5), new Date(2026, 10, 1, 19, 5))
    expect(b.next).toMatchObject({ month: '2026-11', light: 5, points: 0 })
    expect(Object.keys(b.next.shimmer)).toContain('cell-0')
  })
})

describe('App 和 Cloud Functions 的規則一致', () => {
  it('常數相同', () => {
    expect(PEAK_HOUR).toBe(server.PEAK_HOUR)
    expect(CELLS_PER_POINT).toBe(server.CELLS_PER_POINT)
    expect(MONTHLY_CAP).toBe(server.MONTHLY_CAP)
    expect(TRIP_CAP_CELLS).toBe(server.TRIP_CAP_CELLS)
  })
  it('同一串行程，App 和後端算出的錯峰之光與 Points 一樣', () => {
    const trips = [cells(0, 12), cells(5, 30), cells(100, 167), cells(0, 167), cells(300, 41)]
    let app = emptyOffpeak(at(13, 9))
    let month = { light: 0, points: 0 }
    let dayCells: string[] = []
    for (const [i, trip] of trips.entries()) {
      const a = applyOffpeak(app, trip, at(13, 8 + i))
      const b = server.applyTrip(month, dayCells, trip)
      expect(a.counted).toBe(b.counted)
      expect(a.newPoints).toBe(b.newPoints)
      expect(a.next.light).toBe(b.light)
      app = a.next
      month = { light: b.light, points: b.points }
      dayCells = [...dayCells, ...b.fresh]
    }
  })
  it('一週 7 天 × 24 小時 × 是否預約，判斷結果都一樣', () => {
    for (let day = 12; day <= 18; day++) {
      for (let hour = 0; hour < 24; hour++) {
        for (const reserved of [false, true]) {
          const d = at(day, hour)
          const dow = (d.getDay() + 6) % 7
          expect(isOffpeak(d, reserved)).toBe(server.isOffpeak({ dow, hour }, reserved))
        }
      }
    }
  })
})
