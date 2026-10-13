import type { Task } from './types'
import { routeById, routeCells } from './geo'
import { LATER_HOUR, PICKUP_AREA, dowOf, waitAt } from './forecast'

/**
 * 小精靈排的回家卡（晚點走、準時預約）。三位示範玩家都在市府附近上班，所以都從市府路上車點出發；
 * word 是卡片上的「回 X」（小涵「家」、阿哲「板橋」、小雅「淡水」），route 是從市府回家的路線。
 * 卡片的 poiId 一律是 'home'，搭車時再換成目前玩家的家。
 */
export type Home = { word: string; route: string }

export const LATER_TASK_ID = 'later-home'
export const RESERVED_TASK_ID = 'reserved-home'
export const DEFAULT_HOME: Home = { word: '家', route: 'evening-home' }

const back = (h: Home) => `回${h.word}`

/** 回家路線會經過幾格（卡片上的「點亮 N 格」） */
export const homeCells = (h: Home) => routeCells(routeById(h.route).path).length

/** 「晚點走」：尖峰後一小時再從市府出發 */
export function laterHomeTask(h: Home, now: Date, hour = LATER_HOUR, rain = false): Task {
  const w = waitAt(PICKUP_AREA, dowOf(now), hour, rain && hour >= 17)
  const p50 = w ? w.p50.toFixed(1) : '?'
  return {
    id: LATER_TASK_ID,
    title: `${hour}:00 從市府${back(h)}`,
    detail: `${hour} 點後出發，一路點亮${back(h)}的路。`,
    kind: 'ride',
    poiId: 'home',
    window: `${hour}:00–${hour}:30`,
    rewardCells: homeCells(h),
    rewardCredit: 0,
    reason: `${hour} 點後市府叫車到上車約 ${p50} 分`,
    pinned: true,
  }
}

/** 「準時預約」：預約 hour:10 從市府出發 */
export function reservedHomeTask(h: Home, hour: number): Task {
  return {
    id: RESERVED_TASK_ID,
    title: `已預約 ${hour}:10 ${back(h)}`,
    detail: `${hour}:10 從市府路上車點出發，一路點亮${back(h)}的路。`,
    kind: 'ride',
    poiId: 'home',
    window: `${hour}:10`,
    rewardCells: homeCells(h),
    rewardCredit: 0,
    reason: '預約讓司機提早安排，尖峰也準時',
    pinned: true,
  }
}
