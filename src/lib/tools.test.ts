import { describe, expect, it } from 'vitest'
import { describeTool, runTool, type ToolCtx } from './tools'
import { waitAt } from './forecast'
import type { Task } from './types'

// 用當地時間建日期，CI 跑在 UTC 也不會差一天
const tue1230 = new Date(2026, 9, 13, 12, 30)
const task = (id: string, done = false): Task => ({ id, title: `任務 ${id}`, detail: '', kind: 'walk', poiId: 'sunyatsen', window: '全天', rewardCells: 1, rewardCredit: 0, reason: '', done })
const ctx = (patch: Partial<ToolCtx> = {}): ToolCtx => ({ now: tue1230, eveningPop: 0, tasks: [task('a'), task('b', true)], litPct: 9, offpeak: { light: 27, points: 1 }, ...patch })

describe('等車預測資料', () => {
  it('每一格的八成區間包住中位數，機率在 0–1 之間', () => {
    for (const area of ['信義區', '松山區', 'spot-cityhall', 'spot-101']) {
      for (let dow = 0; dow < 7; dow++) {
        for (let h = 0; h < 24; h++) {
          const w = waitAt(area, dow, h)
          expect(w).not.toBeNull()
          expect(w!.p10).toBeLessThanOrEqual(w!.p50)
          expect(w!.p50).toBeLessThanOrEqual(w!.p90)
          expect(w!.pOver10).toBeGreaterThanOrEqual(0)
          expect(w!.pOver10).toBeLessThanOrEqual(1)
        }
      }
    }
  })
})

describe('查預報', () => {
  it('明天 8 點從公司：回傳中位數、八成區間與地點', () => {
    const r = runTool('get_forecast', { place: '公司', day: 'tomorrow', hour: 8 }, ctx()).response as any
    expect(r.地點).toContain('市府')
    expect(r.時間).toBe('明天 8 點')
    expect(r.叫車到上車中位數分鐘).toBeGreaterThan(0)
    expect(r.八成區間分鐘[0]).toBeLessThanOrEqual(r.叫車到上車中位數分鐘)
    expect(r.天氣情境).toBe('不下雨')
  })

  it('今天傍晚降雨機率高時改用下雨情境', () => {
    const r = runTool('get_forecast', { place: '公司', hour: 18 }, ctx({ eveningPop: 80 })).response as any
    expect(r.天氣情境).toBe('下雨')
  })

  it('不認得的地點改看公司，小時超出範圍改用預設', () => {
    const r = runTool('get_forecast', { place: '月球', hour: 99 }, ctx()).response as any
    expect(r.地點).toContain('市府')
    expect(r.時間).toBe('今天 12 點')
  })

  it('示範回覆會講八成區間', () => {
    expect(describeTool('get_forecast', runTool('get_forecast', { place: '公司', hour: 18 }, ctx()))).toContain('八成在')
  })
})

describe('排錯峰：只提案，不直接加任務', () => {
  it('預設是 19:00 晚點走的卡', () => {
    const r = runTool('propose_offpeak', {}, ctx())
    expect(r.proposal?.task).toMatchObject({ id: 'later-home', kind: 'ride', window: '19:00–19:30', pinned: true })
    expect((r.response as any).狀態).toContain('還沒加入')
  })

  it('預約版是 18:10 出發', () => {
    const r = runTool('propose_offpeak', { mode: 'reserve' }, ctx())
    expect(r.proposal?.task).toMatchObject({ id: 'reserved-home', window: '18:10', pinned: true })
  })
})

describe('查進度', () => {
  it('列出沒完成的任務與錯峰之光進度', () => {
    const r = runTool('get_progress', {}, ctx()).response as any
    expect(r.今天還沒完成的任務).toEqual(['任務 a'])
    expect(r.錯峰之光).toBe('7/20 格')
    expect(r.本月和泰Points).toBe(1)
  })

  it('沒有的工具回錯誤，不會丟例外', () => {
    expect(runTool('book_taxi', {}, ctx()).response).toHaveProperty('錯誤')
  })
})
