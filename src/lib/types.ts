export type TaskKind = 'walk' | 'ride' | 'group'

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
