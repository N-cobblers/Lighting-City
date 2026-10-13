import type { Task } from './types'
import { CELLS_PER_POINT } from './offpeak'
import { HOME_HOUR, LATER_HOUR, PICKUP_AREA, dowOf, waitAt } from './forecast'

/**
 * 小精靈可以用的工具（Gemini function calling）。Gemini 連不上時，intent.ts 用關鍵字判斷意圖，呼叫同一組工具。
 * 「排錯峰」只提出方案，玩家按確認才會加任務卡。
 */
export type ToolName = 'get_forecast' | 'get_progress' | 'propose_offpeak'
export const TOOL_LABEL: Record<ToolName, string> = { get_forecast: '查預報', get_progress: '查進度', propose_offpeak: '排錯峰' }

export type ToolCtx = { now: Date; eveningPop: number; tasks: Task[]; litPct: number; offpeak: { light: number; points: number } }
export type Proposal = { summary: string; task: Task }
export type ToolResult = { response: Record<string, unknown>; proposal?: Proposal }

/** 玩家口中的地點 → 預測模型的地點 */
export const PLACES: Record<string, string> = {
  公司: PICKUP_AREA,
  市府: PICKUP_AREA,
  家: '松山區',
  台北101: 'spot-101',
  松菸: 'spot-songyan',
  松山機場: 'spot-airport',
  信義區: '信義區',
  松山區: '松山區',
  大安區: '大安區',
  中山區: '中山區',
}

const clampHour = (h: unknown, fallback: number) => {
  const n = Math.round(Number(h))
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : fallback
}

function getForecast(args: Record<string, unknown>, ctx: ToolCtx): ToolResult {
  const placeWord = typeof args.place === 'string' && PLACES[args.place] ? args.place : '公司'
  const tomorrow = args.day === 'tomorrow'
  const day = new Date(ctx.now.getTime() + (tomorrow ? 86400000 : 0))
  const dow = dowOf(day)
  const hour = clampHour(args.hour, tomorrow ? 8 : Math.max(ctx.now.getHours(), 6))
  const rain = !tomorrow && ctx.eveningPop >= 60 && hour >= 17
  const w = waitAt(PLACES[placeWord], dow, hour, rain)
  if (!w) return { response: { 錯誤: '這個時段沒有預測資料' } }
  // 前後兩小時內，找一個中位數最短的時段
  let best = w
  for (const dh of [-2, -1, 1, 2]) {
    const x = waitAt(PLACES[placeWord], dow, hour + dh, rain)
    if (x && x.p50 < best.p50 - 0.3) best = x
  }
  return {
    response: {
      地點: w.name,
      時間: `${tomorrow ? '明天' : '今天'} ${hour} 點`,
      叫車到上車中位數分鐘: w.p50,
      八成區間分鐘: [w.p10, w.p90],
      等超過10分鐘機率: w.pOver10,
      天氣情境: rain ? '下雨' : '不下雨',
      比較好叫的時段: best.hour !== hour ? { 小時: best.hour, 中位數分鐘: best.p50 } : null,
      來源: 'LightGBM 預測（yoxi 競賽資料彙總）',
    },
  }
}

function getProgress(_args: Record<string, unknown>, ctx: ToolCtx): ToolResult {
  const left = ctx.tasks.filter((t) => !t.done).map((t) => t.title)
  return {
    response: {
      今天還沒完成的任務: left,
      地圖點亮比例: `${ctx.litPct}%`,
      錯峰之光: `${ctx.offpeak.light % CELLS_PER_POINT}/${CELLS_PER_POINT} 格`,
      本月和泰Points: ctx.offpeak.points,
    },
  }
}

function proposeOffpeak(args: Record<string, unknown>, ctx: ToolCtx): ToolResult {
  const reserve = args.mode === 'reserve'
  const hour = clampHour(args.hour, reserve ? HOME_HOUR : LATER_HOUR)
  const w = waitAt(PICKUP_AREA, dowOf(ctx.now), hour, ctx.eveningPop >= 60 && hour >= 17)
  const p50 = w ? w.p50.toFixed(1) : '?'
  const task: Task = reserve
    ? { id: 'reserved-home', title: `已預約 ${hour}:10 回家`, detail: `${hour}:10 從市府路上車點出發，一路點亮回家的路。`, kind: 'ride', poiId: 'home', window: `${hour}:10`, rewardCells: 12, rewardCredit: 0, reason: '預約讓司機提早安排，尖峰也準時', pinned: true }
    : { id: 'later-home', title: `${hour}:00 從市府回家`, detail: `${hour} 點後出發，一路點亮回家的路。`, kind: 'ride', poiId: 'home', window: `${hour}:00–${hour}:30`, rewardCells: 12, rewardCredit: 0, reason: `${hour} 點信義區叫車到上車約 ${p50} 分`, pinned: true }
  const summary = reserve ? `預約 ${hour}:10 從市府路上車點回家，路線亮兩階` : `${hour}:00 後再從市府回家，那時叫車到上車約 ${p50} 分，路線亮兩階`
  return { response: { 提案: summary, 狀態: '等玩家按確認，還沒加入任務' }, proposal: { summary, task } }
}

export function runTool(name: string, args: object | undefined, ctx: ToolCtx): ToolResult {
  const a = (args || {}) as Record<string, unknown>
  if (name === 'get_forecast') return getForecast(a, ctx)
  if (name === 'get_progress') return getProgress(a, ctx)
  if (name === 'propose_offpeak') return proposeOffpeak(a, ctx)
  return { response: { 錯誤: `沒有這個工具：${name}` } }
}

/** Gemini 連不上時，用工具結果組一句示範回覆 */
export function describeTool(name: ToolName, r: ToolResult): string {
  const x = r.response as any
  if (x.錯誤) return x.錯誤
  if (name === 'get_forecast') {
    const better = x.比較好叫的時段 ? `改 ${x.比較好叫的時段.小時} 點約 ${x.比較好叫的時段.中位數分鐘} 分，比較好叫。` : ''
    return `${x.時間}${x.地點}叫車到上車約 ${x.叫車到上車中位數分鐘} 分（八成在 ${Math.round(x.八成區間分鐘[0])}–${Math.round(x.八成區間分鐘[1])} 分內），等超過 10 分鐘的機率 ${Math.round(x.等超過10分鐘機率 * 100)}%。${better}`
  }
  if (name === 'get_progress') {
    const left: string[] = x.今天還沒完成的任務
    return `${left.length ? `今天還有 ${left.length} 個任務：${left.join('、')}。` : '今天的任務都完成了！'}地圖點亮 ${x.地圖點亮比例}，錯峰之光 ${x.錯峰之光}，本月和泰 Points ${x.本月和泰Points} 點。`
  }
  return `幫你想好了：${x.提案}。要排進今天的任務嗎？`
}
