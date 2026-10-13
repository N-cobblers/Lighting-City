import { describe, expect, it } from 'vitest'
import { DEMO_PERSONAS, FALLBACK_CHAT, fallbackChatReply, getFallbackTasks, type Slot } from './demo'
import { ROUTES, routeById, routeCells } from '../lib/geo'
import { runTool } from '../lib/tools'

const SLOTS: Slot[] = ['morning', 'lunch', 'afternoon', 'evening']
const tue = new Date(2026, 9, 13, 8, 30)

describe('三位示範人物', () => {
  it('歷史路線、回家路線、上班路線都存在', () => {
    for (const p of DEMO_PERSONAS) {
      for (const h of p.history30d) expect(routeById(h.route), `${p.name} ${h.route}`).toBeTruthy()
      for (const id of [p.homeCard.route, p.workRoute, ...Object.values(p.routes)]) expect(routeById(id), `${p.name} ${id}`).toBeTruthy()
    }
  })

  it('示範任務沒有乘車金、沒有揪團，每個時段至少一個不用搭車的任務', () => {
    for (const p of DEMO_PERSONAS) {
      for (const slot of SLOTS) {
        const { tasks } = getFallbackTasks(slot, p.id, tue)
        for (const t of tasks) {
          expect(t.rewardCredit).toBe(0)
          expect(['walk', 'scan', 'ride']).toContain(t.kind)
          expect(`${t.title}${t.detail}`).not.toMatch(/乘車金|優惠|折/)
        }
        expect(tasks.some((t) => t.kind !== 'ride'), `${p.name} ${slot}`).toBe(true)
      }
    }
  })

  it('阿哲、小雅每個時段都有排好的「晚點走」回家卡', () => {
    for (const [id, word] of [['a-zhe', '板橋'], ['xiao-ya', '淡水']]) {
      for (const slot of SLOTS) {
        const later = getFallbackTasks(slot, id, tue).tasks.find((t) => t.id === 'later-home')
        expect(later).toMatchObject({ title: `19:00 從市府回${word}`, kind: 'ride', poiId: 'home', pinned: true })
        expect(later!.rewardCells).toBeGreaterThan(40)
      }
    }
  })

  it('小精靈的「排錯峰」照目前人物的家出卡', () => {
    const ctx = { now: tue, eveningPop: 0, tasks: [], litPct: 5, offpeak: { light: 0, points: 0 } }
    expect(runTool('propose_offpeak', {}, ctx).proposal?.task.title).toBe('19:00 從市府回家')
    const zhe = DEMO_PERSONAS.find((p) => p.id === 'a-zhe')!
    expect(runTool('propose_offpeak', {}, { ...ctx, home: zhe.homeCard }).proposal?.task.title).toBe('19:00 從市府回板橋')
  })

  it('示範對話講到回家時，說的是目前人物的家', () => {
    expect(FALLBACK_CHAT.some((f) => f.reply.includes('{home}'))).toBe(true)
    expect(fallbackChatReply('幫我叫車回家', 'xiao-han')).toContain('民生社區')
    expect(fallbackChatReply('幫我叫車回家', 'xiao-ya')).toContain('淡水')
  })
})

describe('路線', () => {
  it('分鐘數合理：市府到淡水不會再是 83 分鐘', () => {
    for (const r of ROUTES) {
      expect(r.minutes, r.id).toBeGreaterThan(0)
      expect(r.minutes, r.id).toBeLessThanOrEqual(55)
    }
    expect(routeById('tamsui-home').minutes).toBeLessThan(60)
  })

  it('長途路線沿著道路走（點數多於兩段直線），而且不超過 60 點', () => {
    for (const id of ['banciao-commute', 'banciao-home', 'tamsui-commute', 'tamsui-home', 'tamsui-weekend', 'road-spot-tamsui']) {
      const r = routeById(id)
      expect(r.path.length, id).toBeGreaterThan(10)
      expect(r.path.length, id).toBeLessThanOrEqual(60)
    }
  })

  it('小雅回淡水那一趟經過的格子遠多於 40 格（錯峰每趟最多算 40 格）', () => {
    expect(routeCells(routeById('tamsui-home').path).length).toBeGreaterThan(40)
  })
})
