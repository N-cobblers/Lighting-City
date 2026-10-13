import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cellToChildren, getResolution } from 'h3-js'
import { loadSettings, readJSON, saveSettings, writeJSON, type Settings } from './settings'
import type { Collected, Source, Task, Weather } from './types'
import { AREA_SET, RES, cellAt, poiById, routeById, routeCells } from './geo'
import { PERSONA, slotOf } from '../data/demo'
import { luckyNumber } from './lucky'
import { fetchCwa, rainScenario } from './weather'
import { phaseOf, type Phase } from './phase'
import { applyOffpeak, emptyOffpeak, liveShimmer, sanitizeOffpeak, type OffpeakState } from './offpeak'
import demand from '../data/demand.json'

export type Tab = 'map' | 'scan' | 'friends' | 'sprite'
export type Toast = { id: number; text: string; tone?: 'lamp' | 'plain' }
/** 從小精靈或任務卡發出的搭車請求。reserved = 預約（一律算錯峰，路線亮兩階）；waitMin 有值時先顯示等車。 */
export type RideRequest = { routeId?: string; taskId?: string; reserved?: boolean; waitMin?: number }

const LIT_KEY = 'yoxi-lighting-city:lit:v6'
const VISIT_KEY = 'yoxi-lighting-city:visits:v2'
const LEGACY_LIT_KEYS = ['yoxi-lighting-city:lit:v5', 'yoxi-lighting-city:lit:v4']
const LEGACY_VISIT_KEYS = ['yoxi-lighting-city:visits:v1']
const COL_KEY = 'yoxi-lighting-city:collected:v1'
const FORECAST_SEEN_KEY = 'yoxi-lighting-city:forecast-seen:v1'
const HOME_RIDE_KEY = 'yoxi-lighting-city:home-ride:v1'
const OFFPEAK_KEY = 'yoxi-lighting-city:offpeak:v1'
const DAY_MS = 24 * 60 * 60 * 1000
const GLOW_FADE_DAYS = 7

type VisitHistory = Record<string, number[]>

function expandToCurrentResolution<T>(cells: Record<string, T>): Record<string, T> {
  const expanded: Record<string, T> = {}
  for (const [cell, value] of Object.entries(cells)) {
    const children = getResolution(cell) < RES ? cellToChildren(cell, RES) : [cell]
    for (const child of children) expanded[child] = value
  }
  return expanded
}

function loadBaseLit(): Record<string, number> {
  const current = readJSON<Record<string, number> | null>(LIT_KEY, null)
  if (current && typeof current === 'object') return current
  for (const key of LEGACY_LIT_KEYS) {
    const legacy = readJSON<Record<string, number> | null>(key, null)
    if (legacy && typeof legacy === 'object') return expandToCurrentResolution(legacy)
  }
  return initialBaseLit()
}

function initialBaseLit(): Record<string, number> {
  const lit: Record<string, number> = {}
  for (const id of PERSONA.walkedPois) {
    const p = poiById(id)
    if (p) lit[cellAt(p.lng, p.lat)] = 2
  }
  return lit
}

function initialVisitHistory(now = Date.now()): VisitHistory {
  const visits: VisitHistory = {}
  for (const h of PERSONA.history30d) {
    const visitedAt = now - (30 - h.day) * DAY_MS
    for (const { cell } of routeCells(routeById(h.route).path)) {
      visits[cell] = [...(visits[cell] || []), visitedAt].sort((a, b) => a - b).slice(-3)
    }
  }
  return visits
}

function loadVisitHistory(): VisitHistory {
  const stored = readJSON<VisitHistory | null>(VISIT_KEY, null)
  if (stored && typeof stored === 'object') {
    return expandToCurrentResolution(Object.fromEntries(
      Object.entries(stored)
        .filter(([, times]) => Array.isArray(times))
        .map(([cell, times]) => [cell, times.filter((time) => Number.isFinite(time)).sort((a, b) => a - b).slice(-3)]),
    ))
  }

  for (const key of LEGACY_VISIT_KEYS) {
    const legacyVisits = readJSON<VisitHistory | null>(key, null)
    if (legacyVisits && typeof legacyVisits === 'object') {
      return expandToCurrentResolution(legacyVisits)
    }
  }

  // Preserve an existing prototype map when upgrading from the previous storage format.
  const legacy = LEGACY_LIT_KEYS.map((key) => readJSON<Record<string, number> | null>(key, null)).find((value) => value && typeof value === 'object')
  if (legacy && typeof legacy === 'object') {
    const now = Date.now()
    const visits = Object.fromEntries(
      Object.entries(legacy).map(([cell, level]) => [
        cell,
        Array.from({ length: Math.max(1, Math.min(3, Math.round(level) || 1)) }, (_, i) => now - (2 - i) * DAY_MS),
      ]),
    )
    return expandToCurrentResolution(visits)
  }
  return initialVisitHistory()
}

function glowLevel(times: number[], now: number) {
  if (!times.length) return 0
  const recentCount = times.filter((time) => now - time < 30 * DAY_MS).length
  const repeats = Math.max(1, Math.min(3, recentCount))
  const lastVisit = Math.max(...times)
  const fade = Math.floor(Math.max(0, now - lastVisit) / (GLOW_FADE_DAYS * DAY_MS))
  return Math.max(1, repeats - fade)
}

export const LOW_WINDOWS = [
  { district: '信義區', hours: (demand as any).low_windows['台北市信義區'].hours as number[] },
  { district: '松山區', hours: (demand as any).low_windows['台北市松山區'].hours as number[] },
]

type Store = {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  now: Date
  setClock: (h: number, m: number) => void
  resetClock: () => void
  clockIsSim: boolean
  /** 依（劇本）時間算出的時段：早晨、白天、黃昏、夜晚 */
  phase: Phase
  weather: Weather
  lucky: number
  lit: Record<string, number>
  litPct: number
  lightCells: (cells: string[], level?: number) => number
  recordRideCells: (cells: string[], boost?: number) => { newCells: number; renewedCells: number }
  resetLit: () => void
  tasks: Task[]
  greeting: string
  tasksSource: Source | null
  setTasks: (t: Task[], greeting: string, source: Source) => void
  addTask: (t: Task) => void
  completeTask: (id: string) => void
  focusTask: string | null
  setFocusTask: (id: string | null) => void
  collected: Collected[]
  addCollected: (c: Collected) => void
  tab: Tab
  setTab: (t: Tab) => void
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  pendingRide: RideRequest | null
  requestRide: (r: RideRequest | null) => void
  /** 今天已經搭車回家了（日期字串），預報就改成下一個平日。 */
  homeRideDay: string
  markHomeRide: () => void
  forecastSeenKey: string
  markForecastSeen: (key: string) => void
  /** 錯峰點燈：記一趟錯峰行程經過的格子，回傳這次算到幾格、換到幾點和泰 Points */
  recordOffpeak: (cells: string[]) => { counted: number; newPoints: number; light: number }
  /** 3 天內錯峰點亮、地圖上要閃爍的格子 */
  shimmer: string[]
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [simClock, setSimClock] = useState<{ h: number; m: number } | null>(null)
  const [tick, setTick] = useState(0)
  const [weather, setWeather] = useState<Weather>(() => rainScenario(new Date()))
  const [baseLit, setBaseLit] = useState<Record<string, number>>(() => loadBaseLit())
  const [visits, setVisits] = useState<VisitHistory>(() => loadVisitHistory())
  const [tasks, setTaskList] = useState<Task[]>([])
  const [greeting, setGreeting] = useState('')
  const [tasksSource, setTasksSource] = useState<Source | null>(null)
  const [collected, setCollected] = useState<Collected[]>(() => readJSON(COL_KEY, [] as Collected[]))
  const [tab, setTab] = useState<Tab>('map')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pendingRide, setPendingRide] = useState<RideRequest | null>(null)
  const [focusTask, setFocusTask] = useState<string | null>(null)
  const [homeRideDay, setHomeRideDay] = useState(() => readJSON(HOME_RIDE_KEY, ''))
  const [forecastSeenKey, setForecastSeenKey] = useState(() => readJSON(FORECAST_SEEN_KEY, ''))
  const [offpeak, setOffpeak] = useState<OffpeakState>(() => sanitizeOffpeak(readJSON(OFFPEAK_KEY, null)))
  const offpeakRef = useRef(offpeak)
  const toastId = useRef(0)
  const baseLitRef = useRef(baseLit)
  const visitsRef = useRef(visits)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const now = useMemo(() => {
    const d = new Date()
    if (simClock) d.setHours(simClock.h, simClock.m, 0, 0)
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simClock, tick])

  const lit = useMemo(() => {
    const levels = { ...baseLit }
    for (const [cell, times] of Object.entries(visits)) levels[cell] = Math.max(levels[cell] || 0, glowLevel(times, now.getTime()))
    return levels
  }, [baseLit, visits, now])
  const litRef = useRef(lit)
  litRef.current = lit

  useEffect(() => writeJSON(LIT_KEY, baseLit), [baseLit])
  useEffect(() => writeJSON(VISIT_KEY, visits), [visits])
  useEffect(() => writeJSON(COL_KEY, collected), [collected])
  useEffect(() => writeJSON(FORECAST_SEEN_KEY, forecastSeenKey), [forecastSeenKey])
  useEffect(() => writeJSON(HOME_RIDE_KEY, homeRideDay), [homeRideDay])
  useEffect(() => writeJSON(OFFPEAK_KEY, offpeak), [offpeak])

  useEffect(() => {
    let cancelled = false
    if (settings.weatherMode === 'live' && settings.cwaKey.trim()) {
      fetchCwa(settings.cwaKey.trim(), new Date())
        .then((w) => !cancelled && setWeather(w))
        .catch((e) => {
          if (cancelled) return
          const fallback = rainScenario(new Date())
          setWeather({ ...fallback, note: `氣象署資料讀取失敗（${e.message}），改用示範情境` })
        })
    } else {
      setWeather(rainScenario(new Date()))
    }
    return () => {
      cancelled = true
    }
  }, [settings.weatherMode, settings.cwaKey])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'plain') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  const lightCells = useCallback((cells: string[], level = 3) => {
    const added = cells.filter((c) => (litRef.current[c] || 0) < level).length
    setBaseLit((prev) => {
      const next = { ...prev }
      for (const c of cells) next[c] = Math.max(next[c] || 0, level)
      baseLitRef.current = next
      return next
    })
    return added
  }, [])

  const recordRideCells = useCallback((cells: string[], boost = 1) => {
    const nowMs = Date.now()
    const previous = visitsRef.current
    const next = { ...previous }
    let newCells = 0
    let renewedCells = 0
    for (const cell of cells) {
      const times = previous[cell] || []
      if (times.length === 0 && !baseLitRef.current[cell]) newCells++
      else renewedCells++
      next[cell] = [...times, ...Array(Math.max(1, boost)).fill(nowMs)].slice(-3)
    }
    visitsRef.current = next
    setVisits(next)
    return { newCells, renewedCells }
  }, [])

  const recordOffpeak = useCallback((cells: string[]) => {
    const r = applyOffpeak(offpeakRef.current, cells)
    offpeakRef.current = r.next
    setOffpeak(r.next)
    return { counted: r.counted, newPoints: r.newPoints, light: r.next.light }
  }, [])

  const shimmer = useMemo(() => Object.keys(liveShimmer(offpeak.shimmer, Date.now())), [offpeak, now])

  const litPct = useMemo(() => {
    let n = 0
    for (const c of Object.keys(lit)) if (AREA_SET.has(c)) n++
    return Math.round((n / AREA_SET.size) * 100)
  }, [lit])

  const value: Store = {
    settings,
    updateSettings,
    now,
    setClock: (h, m) => setSimClock({ h, m }),
    resetClock: () => setSimClock(null),
    clockIsSim: !!simClock,
    phase: phaseOf(now),
    weather,
    lucky: luckyNumber(now, settings.luckyOverride),
    lit,
    litPct,
    lightCells,
    recordRideCells,
    resetLit: () => {
      const nextBase = initialBaseLit()
      const nextVisits = initialVisitHistory()
      baseLitRef.current = nextBase
      visitsRef.current = nextVisits
      setBaseLit(nextBase)
      setVisits(nextVisits)
      setCollected([])
      offpeakRef.current = emptyOffpeak()
      setOffpeak(offpeakRef.current)
    },
    tasks,
    greeting,
    tasksSource,
    setTasks: (t, g, s) => {
      // 小精靈排好的卡（晚點走、準時預約）換時段也留著，早上決定、傍晚還能出發
      setTaskList((prev) => [...t, ...prev.filter((x) => x.pinned && !x.done && !t.some((y) => y.id === x.id))])
      setGreeting(g)
      setTasksSource(s)
    },
    addTask: (t) => setTaskList((ts) => [...ts.filter((x) => x.id !== t.id), t]),
    completeTask: (id) => setTaskList((ts) => ts.map((t) => (t.id === id ? { ...t, done: true } : t))),
    focusTask,
    setFocusTask,
    collected,
    addCollected: (c) => setCollected((xs) => [c, ...xs].slice(0, 30)),
    tab,
    setTab,
    toasts,
    toast,
    pendingRide,
    requestRide: setPendingRide,
    homeRideDay,
    markHomeRide: () => setHomeRideDay(new Date().toDateString()),
    forecastSeenKey,
    markForecastSeen: setForecastSeenKey,
    recordOffpeak,
    shimmer,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

export { slotOf }
