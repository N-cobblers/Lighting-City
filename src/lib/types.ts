/** walk：步行到附近地點；scan：路上拍一台 yoxi 車；ride：搭 yoxi（預約或低谷時段，搭了亮兩階）。 */
export type TaskKind = 'walk' | 'scan' | 'ride'

export type Task = {
  id: string
  title: string
  detail: string
  kind: TaskKind
  poiId: string
  window: string
  rewardCells: number
  rewardCredit: number
  reason: string
  done?: boolean
}

export type Source = 'live' | 'demo'

export type WeatherBlock = { start: string; end: string; pop: number; desc?: string }
export type Weather = { source: 'cwa' | 'scenario'; desc: string; blocks: WeatherBlock[]; eveningPop: number; note?: string }

export type Collected = { plateMasked: string; sum: number; palette: string; at: number; line: string; title: string }

export type Player = { uid: string; name: string; sum: number | null; diff: number | null; plateMasked?: string; palette?: string; updatedAt: number; bot?: boolean }
