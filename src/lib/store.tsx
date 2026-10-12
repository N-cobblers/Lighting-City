import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadSettings, readJSON, saveSettings, writeJSON, type Settings } from './settings'
import type { Collected, Source, Task, Weather } from './types'
import { AREA_SET, cellAt, poiById, routeById, routeCells } from './geo'
import { PERSONA, slotOf } from '../data/demo'
import { luckyNumber } from './lucky'
import { fetchCwa, rainScenario } from './weather'
import demand from '../data/demand.json'

export type Tab = 'map' | 'sprite' | 'scan' | 'friends' | 'ops'
export type Toast = { id: number; text: string; tone?: 'lamp' | 'plain' }

const LIT_KEY = 'yoxi-lighting-city:lit:v4'
const COL_KEY = 'yoxi-lighting-city:collected:v1'

function initialLit(): Record<string, number> {
  const lit: Record<string, number> = {}
  for (const h of PERSONA.history30d) {
    for (const { cell } of routeCells(routeById(h.route).path)) lit[cell] = Math.min(3, (lit[cell] || 0) + 1)
  }
  for (const id of PERSONA.walkedPois) {
    const p = poiById(id)
    if (p) {
      const c = cellAt(p.lng, p.lat)
      lit[c] = Math.max(lit[c] || 0, 2)
    }
  }
  return lit
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
  weather: Weather
  lucky: number
  lit: Record<string, number>
  litPct: number
  lightCells: (cells: string[], level?: number) => number
  resetLit: () => void
  tasks: Task[]
  greeting: string
  tasksSource: Source | null
  setTasks: (t: Task[], greeting: string, source: Source) => void
  completeTask: (id: string) => void
  collected: Collected[]
  addCollected: (c: Collected) => void
  tab: Tab
  setTab: (t: Tab) => void
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  pendingRide: string | null
  requestRide: (routeId: string | null) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [simClock, setSimClock] = useState<{ h: number; m: number } | null>(null)
  const [tick, setTick] = useState(0)
  const [weather, setWeather] = useState<Weather>(() => rainScenario(new Date()))
  const [lit, setLit] = useState<Record<string, number>>(() => readJSON(LIT_KEY, initialLit()))
  const [tasks, setTaskList] = useState<Task[]>([])
  const [greeting, setGreeting] = useState('')
  const [tasksSource, setTasksSource] = useState<Source | null>(null)
  const [collected, setCollected] = useState<Collected[]>(() => readJSON(COL_KEY, [] as Collected[]))
  const [tab, setTab] = useState<Tab>('map')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pendingRide, setPendingRide] = useState<string | null>(null)
  const toastId = useRef(0)
  const litRef = useRef(lit)
  useEffect(() => {
    litRef.current = lit
  }, [lit])

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

  useEffect(() => writeJSON(LIT_KEY, lit), [lit])
  useEffect(() => writeJSON(COL_KEY, collected), [collected])

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
    setLit((prev) => {
      const next = { ...prev }
      for (const c of cells) next[c] = Math.max(next[c] || 0, level)
      litRef.current = next
      return next
    })
    return added
  }, [])

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
    weather,
    lucky: luckyNumber(now, settings.luckyOverride),
    lit,
    litPct,
    lightCells,
    resetLit: () => {
      setLit(initialLit())
      setCollected([])
    },
    tasks,
    greeting,
    tasksSource,
    setTasks: (t, g, s) => {
      setTaskList(t)
      setGreeting(g)
      setTasksSource(s)
    },
    completeTask: (id) => setTaskList((ts) => ts.map((t) => (t.id === id ? { ...t, done: true } : t))),
    collected,
    addCollected: (c) => setCollected((xs) => [c, ...xs].slice(0, 30)),
    tab,
    setTab,
    toasts,
    toast,
    pendingRide,
    requestRide: setPendingRide,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

export { slotOf }
