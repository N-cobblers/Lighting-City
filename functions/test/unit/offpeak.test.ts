import { describe, expect, it } from 'vitest'
import { applyTrip, cityDisplay, dayKey, hourKey, isOffpeak, MAX_CELLS, monthKey, parseTripInput, taipeiTime } from '../../src/offpeak.js'

const cell = (i: number) => `89${i.toString(16).padStart(13, '0')}`
const cells = (from: number, n: number) => Array.from({ length: n }, (_, i) => cell(from + i))
const valid = { tripId: 'trip-001', district: '信義區', requestedAt: '2026-10-13T11:05:00+08:00', reserved: false, cells: cells(0, 12) }

describe('台北時間', () => {
  it('UTC 換算成台北時間（+8，不受伺服器時區影響）', () => {
    const t = taipeiTime(Date.parse('2026-10-13T10:05:00Z'))
    expect(t).toEqual({ year: 2026, month: 10, day: 13, dow: 1, hour: 18 })
    expect(dayKey(t)).toBe('2026-10-13')
    expect(monthKey(t)).toBe('2026-10')
    expect(hourKey(t)).toBe('2026101318')
  })
  it('跨日：UTC 16:30 已經是台北隔天 00:30', () => {
    const t = taipeiTime(Date.parse('2026-10-31T16:30:00Z'))
    expect(dayKey(t)).toBe('2026-11-01')
    expect(monthKey(t)).toBe('2026-11')
    expect(t.dow).toBe(6)
  })
})

describe('錯峰判斷', () => {
  it('預約一律算錯峰', () => {
    for (let dow = 0; dow < 7; dow++) for (let hour = 0; hour < 24; hour++) expect(isOffpeak({ dow, hour }, true)).toBe(true)
  })
  it('平日 17、19 點算，18 點和其他時段不算', () => {
    for (let dow = 0; dow < 5; dow++) {
      expect(isOffpeak({ dow, hour: 17 }, false)).toBe(true)
      expect(isOffpeak({ dow, hour: 19 }, false)).toBe(true)
      expect(isOffpeak({ dow, hour: 18 }, false)).toBe(false)
      expect(isOffpeak({ dow, hour: 16 }, false)).toBe(false)
      expect(isOffpeak({ dow, hour: 20 }, false)).toBe(false)
    }
  })
  it('週末只算預約', () => {
    for (const dow of [5, 6]) for (let hour = 0; hour < 24; hour++) expect(isOffpeak({ dow, hour }, false)).toBe(false)
  })
})

describe('錯峰之光與 Points', () => {
  it('每 20 格換 1 點', () => {
    const r = applyTrip({ light: 15, points: 0 }, [], cells(0, 12))
    expect(r).toMatchObject({ light: 27, points: 1, newPoints: 1 })
    expect(r.fresh).toHaveLength(12)
  })
  it('同一格一天只算一次，一趟裡重複的格子也只算一次', () => {
    const r = applyTrip({ light: 0, points: 0 }, cells(0, 5), [...cells(3, 6), cell(3)])
    expect(r.fresh).toEqual(cells(5, 4))
    expect(r.light).toBe(4)
  })
  it('每月最多 20 點，超過不再加', () => {
    const r = applyTrip({ light: 395, points: 19 }, [], cells(0, 80))
    expect(r).toMatchObject({ light: 475, points: 20, newPoints: 1 })
    const again = applyTrip({ light: 475, points: 20 }, [], cells(100, 80))
    expect(again).toMatchObject({ points: 20, newPoints: 0 })
  })
})

describe('城市公開數字', () => {
  it('不到 20 人不顯示，否則四捨五入到 10', () => {
    expect(cityDisplay(0)).toBeNull()
    expect(cityDisplay(19)).toBeNull()
    expect(cityDisplay(20)).toBe(20)
    expect(cityDisplay(23)).toBe(20)
    expect(cityDisplay(25)).toBe(30)
    expect(cityDisplay(312)).toBe(310)
  })
})

describe('行程資料檢查', () => {
  it('格式正確就通過', () => {
    expect(parseTripInput(valid)).toEqual(valid)
  })
  it.each([
    ['沒有資料', null],
    ['tripId 有斜線', { ...valid, tripId: 'a/b' }],
    ['不是台北市的行政區', { ...valid, district: '板橋區' }],
    ['時間沒有時區', { ...valid, requestedAt: '2026-10-13T18:05:00' }],
    ['reserved 不是布林', { ...valid, reserved: 'yes' }],
    ['沒有格子', { ...valid, cells: [] }],
    ['格子太多', { ...valid, cells: cells(0, MAX_CELLS + 1) }],
    ['格子不是 H3 編號', { ...valid, cells: ['not-a-cell'] }],
  ])('%s → 拒絕', (_, data) => {
    expect(() => parseTripInput(data)).toThrow()
  })
})
