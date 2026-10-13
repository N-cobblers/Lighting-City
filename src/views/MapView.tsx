import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type Map as MlMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useStore, LOW_WINDOWS } from '../lib/store'
import { AREA_CELLS, CENTER, POIS, cellAt, cellsFeatureCollection, interpolateAlong, lineFeature, neighbours, pathLengthKm, poiById, routeById, routeCells, samplePath, type LngLat, type Route } from '../lib/geo'
import { generateTasks } from '../lib/ai'
import { slotOf, SLOT_LABEL } from '../data/demo'
import type { Task, TaskKind } from '../lib/types'
import districts from '../data/districts.json'
import { BASEMAP, MAP_PALETTE, isLight, type Phase } from '../lib/phase'
import { CELLS_PER_POINT, isOffpeak } from '../lib/offpeak'
import { SpriteAvatar } from './SpriteAvatar'

/** 底圖載入失敗時的離線底圖（行政區界），顏色跟著時段。 */
function fallbackStyle(phase: Phase): StyleSpecification {
  const f = MAP_PALETTE[phase].fallback
  return {
    version: 8,
    sources: { districts: { type: 'geojson', data: districts as any } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': f.bg } },
      { id: 'd-fill', type: 'fill', source: 'districts', paint: { 'fill-color': f.fill, 'fill-opacity': 1 } },
      { id: 'd-line', type: 'line', source: 'districts', paint: { 'line-color': f.line, 'line-width': 1.2 } },
    ],
  }
}

type Three<T> = [T, T, T]
const byLevel = <T,>(v: Three<T>) => ['match', ['get', 'level'], 1, v[0], 2, v[1], v[2]] as any
const times = (v: Three<number>, k: number) => v.map((x) => x * k) as Three<number>

/** 點亮格子、格線、搭車軌跡的顏色與透明度。opacity 是「六角格深淺」（0–1）；亮色底圖上淡色看不清楚，所以白天乘兩倍。 */
function applyPaint(map: MlMap, phase: Phase, opacity: number) {
  if (!map.getLayer('lit-fill')) return
  const p = MAP_PALETTE[phase]
  const k = isLight(phase) ? Math.min(1, opacity * 2) : opacity
  const outline: Three<number> = isLight(phase) ? [0.45, 0.7, 0.9] : [0.25, 0.5, 0.8]
  map.setPaintProperty('area-line', 'line-color', p.grid)
  map.setPaintProperty('area-line', 'line-opacity', 0.55 * k)
  map.setPaintProperty('lit-fill', 'fill-color', byLevel(p.hex))
  map.setPaintProperty('lit-fill', 'fill-opacity', byLevel(times(p.fill, k)))
  map.setPaintProperty('lit-glow', 'line-color', byLevel(p.hex))
  map.setPaintProperty('lit-glow', 'line-opacity', byLevel(times(p.glow, Math.min(1, opacity * 2))))
  map.setPaintProperty('lit-line', 'line-color', byLevel(p.outline))
  map.setPaintProperty('lit-line', 'line-opacity', byLevel(times(outline, k)))
  map.setPaintProperty('trail-glow', 'line-color', p.trailGlow)
  map.setPaintProperty('trail-core', 'line-color', p.trailCore)
  map.setPaintProperty('offpeak-glow', 'line-color', shimmerColor(phase))
  map.setPaintProperty('offpeak-glow', 'line-opacity', shimmerOpacity(opacity, true))
}

/** 錯峰點亮的格子和一般點亮同色，多一層閃爍的光；白底上白熱光看不到，白天用琥珀色。 */
const shimmerColor = (phase: Phase) => (isLight(phase) ? MAP_PALETTE[phase].hex[1] : MAP_PALETTE[phase].hex[2])
const shimmerOpacity = (opacity: number, bright: boolean) => (bright ? 0.95 : 0.2) * Math.min(1, opacity * 2)
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 任務類型的線條圖示：步行是腳印、拍車是相機、搭車是車。 */
function KindIcon({ kind }: { kind: TaskKind }) {
  const common = { viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  if (kind === 'walk')
    return (
      <svg {...common}>
        <path d="M8 3.5c1.7 0 2.6 2 2.3 4.4-.3 2-1.2 3.6-2.6 3.6S5.4 10 5.5 7.7C5.6 5.3 6.4 3.5 8 3.5Z" />
        <path d="M6.2 15h3.2" />
        <path d="M16 8.5c1.7 0 2.6 2 2.3 4.4-.3 2-1.2 3.6-2.6 3.6s-2.3-1.5-2.2-3.8c.1-2.4.9-4.2 2.5-4.2Z" />
        <path d="M14.2 20h3.2" />
      </svg>
    )
  if (kind === 'scan')
    return (
      <svg {...common}>
        <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2L9.2 5h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
        <circle cx="12" cy="13" r="3.4" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M5.5 12.5 7.2 7.6A1.5 1.5 0 0 1 8.6 6.6h6.8a1.5 1.5 0 0 1 1.4 1L18.5 12.5" />
      <path d="M4 12.5h16v4.5H4Z" />
      <circle cx="7.6" cy="17.2" r="1.6" />
      <circle cx="16.4" cy="17.2" r="1.6" />
    </svg>
  )
}

const KIND_LABEL: Record<TaskKind, string> = { walk: '步行', scan: '拍車', ride: '搭 yoxi' }
// 不搭車的任務排前面，搭車（加倍）的排最後
const KIND_ORDER: Record<TaskKind, number> = { walk: 0, scan: 1, ride: 2 }

function taskRoute(t: Task): Route {
  if (t.poiId === 'home') return routeById('evening-home')
  if (t.poiId === 'spot-songyan' || t.poiId === 'songyan') return routeById('afternoon-songyan')
  if (t.poiId === 'work' || t.poiId === 'spot-cityhall') return routeById('morning-work')
  const from = poiById('spot-cityhall')!
  const to = poiById(t.poiId) || poiById('sunyatsen')!
  const path: LngLat[] = [
    [from.lng, from.lat],
    [to.lng, from.lat],
    [to.lng, to.lat],
  ]
  return { id: `dyn-${t.poiId}`, name: t.title, from: from.id, to: to.id, path, minutes: Math.round(pathLengthKm(path) * 3 + 3) }
}

export function MapView() {
  const s = useStore()
  const [gridOpacity, setGridOpacity] = useState(35)
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const carRef = useRef<maplibregl.Marker | null>(null)
  const [mapNote, setMapNote] = useState('')
  const [riding, setRiding] = useState<{ name: string; minutes: number; pct: number } | null>(null)
  const [waiting, setWaiting] = useState<number | null>(null)
  const [genBusy, setGenBusy] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [sheetH, setSheetH] = useState(300)
  const [pop, setPop] = useState<{ id: number; text: string; sparkle: boolean } | null>(null)
  const [idx, setIdx] = useState(0)
  const rail = useRef<HTMLUListElement>(null)
  const popId = useRef(0)
  const litRef = useRef(s.lit)
  const gridOpacityRef = useRef(gridOpacity)
  const phaseRef = useRef(s.phase)
  const nowRef = useRef(s.now)
  const shimmerRef = useRef(s.shimmer)
  // 最近一趟的軌跡；換底圖重新疊圖層時接著畫，不會整條消失
  const trailRef = useRef<LngLat[]>([])
  // 底圖是否載好；剛換時段時還在載入，搭車要等它好了再開始
  const styleReady = useRef(false)
  const swapPending = useRef(false)
  const tabRef = useRef(s.tab)
  nowRef.current = s.now
  shimmerRef.current = s.shimmer
  tabRef.current = s.tab
  const usingFallback = useRef(false)
  const fallbackRef = useRef<() => void>(() => {})
  litRef.current = s.lit
  gridOpacityRef.current = gridOpacity
  const sheetRef = useRef<HTMLElement>(null)
  const sheetPad = () => {
    const h = box.current?.clientHeight || 700
    const sh = sheetRef.current?.getBoundingClientRect().height || 300
    return Math.min(h * 0.6, sh)
  }
  const slot = slotOf(s.now)

  // 換底圖（setStyle）後圖層會清空，style.load 時重新疊上
  const addLayers = useCallback((map: MlMap) => {
    if (map.getSource('area')) return
    map.addSource('area', { type: 'geojson', data: cellsFeatureCollection(AREA_CELLS) as any })
    map.addSource('lit', { type: 'geojson', data: cellsFeatureCollection(Object.keys(litRef.current), (c) => ({ level: litRef.current[c] })) as any })
    map.addSource('trail', { type: 'geojson', data: lineFeature(trailRef.current.length > 1 ? trailRef.current : []) as any })
    map.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-width': 0.8 } })
    map.addLayer({ id: 'lit-fill', type: 'fill', source: 'lit', paint: {} })
    // 熟悉、常去的格子外圍一圈光暈（白天不畫）
    map.addLayer({ id: 'lit-glow', type: 'line', source: 'lit', layout: { 'line-join': 'round' }, paint: { 'line-width': byLevel([0, 6, 10]), 'line-blur': byLevel([0, 6, 10]) } })
    map.addLayer({ id: 'lit-line', type: 'line', source: 'lit', paint: { 'line-width': 1 } })
    // 錯峰點燈的格子：3 天內多一層慢慢閃爍的光（透明度用 transition 漸變）
    map.addSource('offpeak', { type: 'geojson', data: cellsFeatureCollection(shimmerRef.current) as any })
    map.addLayer({ id: 'offpeak-glow', type: 'line', source: 'offpeak', layout: { 'line-join': 'round' }, paint: { 'line-width': 5, 'line-blur': 4, 'line-opacity-transition': { duration: 1600, delay: 0 } } as any })
    map.addLayer({ id: 'trail-glow', type: 'line', source: 'trail', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': 12, 'line-blur': 8, 'line-opacity': 0.65 } })
    map.addLayer({ id: 'trail-core', type: 'line', source: 'trail', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': 3 } })
    applyPaint(map, phaseRef.current, gridOpacityRef.current / 100)
  }, [])

  // map init
  useEffect(() => {
    if (!box.current) return
    const map = new maplibregl.Map({ container: box.current, style: BASEMAP[phaseRef.current], center: CENTER, zoom: 13.25, attributionControl: { compact: true }, pitchWithRotate: false, dragRotate: false })
    mapRef.current = map
    const fallback = () => {
      if (usingFallback.current) return
      usingFallback.current = true
      setMapNote('底圖載入失敗，改用離線底圖')
      styleReady.current = false
      map.setStyle(fallbackStyle(phaseRef.current), { diff: false })
    }
    fallbackRef.current = fallback
    const timer = setTimeout(() => {
      if (!map.isStyleLoaded()) fallback()
    }, 7000)
    map.on('style.load', () => {
      clearTimeout(timer)
      styleReady.current = true
      addLayers(map)
      box.current?.classList.remove('swap')
      if (!usingFallback.current) setMapNote('')
    })
    map.once('idle', () => {
      const b = new maplibregl.LngLatBounds([121.5495, 25.0275], [121.5785, 25.0630])
      map.fitBounds(b, { padding: { top: 70, bottom: sheetPad() + 10, left: 24, right: 24 }, duration: 0 })
    })
    map.on('error', (e: any) => {
      // 單張圖磚載不到不算底圖失敗，只有樣式本身載不到才改用離線底圖
      if (e?.sourceId || e?.tile) return
      const msg = String(e?.error?.message || '')
      if (!map.isStyleLoaded() && /style|Failed to fetch|NetworkError|load/i.test(msg)) fallback()
    })
    // yoxi 上車點與地標
    for (const p of POIS) {
      const el = document.createElement('div')
      el.className = `poi poi-${p.kind}`
      el.title = p.name
      if (p.kind === 'home' || p.kind === 'work') el.textContent = p.kind === 'home' ? '家' : '公司'
      new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
    }
    const car = document.createElement('div')
    car.className = 'car'
    car.innerHTML = '<span class="beam"></span><span class="body"></span>'
    carRef.current = new maplibregl.Marker({ element: car }).setLngLat(CENTER)
    return () => {
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
    }
  }, [addLayers])

  // Keep the lit layer in sync with the footprint.
  useEffect(() => {
    const map = mapRef.current
    const src = map?.getSource('lit') as maplibregl.GeoJSONSource | undefined
    if (src) src.setData(cellsFeatureCollection(Object.keys(s.lit), (c) => ({ level: s.lit[c] })) as any)
  }, [s.lit])

  useEffect(() => {
    const map = mapRef.current
    if (map) applyPaint(map, phaseRef.current, gridOpacity / 100)
  }, [gridOpacity])

  useEffect(() => {
    const src = mapRef.current?.getSource('offpeak') as maplibregl.GeoJSONSource | undefined
    if (src) src.setData(cellsFeatureCollection(s.shimmer) as any)
  }, [s.shimmer])

  // 錯峰之光慢慢閃：每 2 秒在亮、暗之間切換，transition 讓它漸變；系統開「減少動態效果」時保持不動。
  // 沒有閃爍格子或不在地圖分頁時不動，免得地圖一直重畫
  useEffect(() => {
    if (reducedMotion()) return
    let bright = true
    const id = setInterval(() => {
      const map = mapRef.current
      if (!map?.getLayer('offpeak-glow') || !shimmerRef.current.length || tabRef.current !== 'map') return
      bright = !bright
      map.setPaintProperty('offpeak-glow', 'line-opacity', shimmerOpacity(gridOpacityRef.current / 100, bright))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // 換時段：地圖先淡出，換成該時段的底圖，style.load 時重新疊上格子再淡入
  useEffect(() => {
    const prev = phaseRef.current
    if (prev === s.phase) return
    phaseRef.current = s.phase
    const map = mapRef.current
    if (!map) return
    // 早晨和白天用同一張底圖，只換格子顏色
    if (!usingFallback.current && BASEMAP[prev] === BASEMAP[s.phase]) {
      applyPaint(map, s.phase, gridOpacityRef.current / 100)
      return
    }
    box.current?.classList.add('swap')
    swapPending.current = true
    // 只看新底圖的 style.load 有沒有來；不能用 isStyleLoaded()，搭車動畫每一格都在更新軌跡，那時它一直是 false
    let loaded = false
    const onLoad = () => {
      loaded = true
    }
    map.once('style.load', onLoad)
    // 每次換時段都重試線上底圖；先前改用離線底圖可能只是一時連不上
    const swap = setTimeout(() => {
      swapPending.current = false
      styleReady.current = false
      usingFallback.current = false
      map.setStyle(BASEMAP[s.phase], { diff: false })
    }, 250)
    // 底圖一直載不到時改用離線底圖，地圖不會一直停在淡出的狀態
    const guard = setTimeout(() => {
      if (!loaded) fallbackRef.current()
    }, 9000)
    return () => {
      clearTimeout(swap)
      clearTimeout(guard)
      swapPending.current = false
      map.off('style.load', onLoad)
    }
  }, [s.phase])

  // 小精靈跳出來的那句話，放在抽屜上緣
  useEffect(() => {
    const el = sheetRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setSheetH(el.getBoundingClientRect().height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showPop = useCallback((text: string, ms = 2800, sparkle = true) => {
    const id = ++popId.current
    setPop({ id, text, sparkle })
    setTimeout(() => setPop((p) => (p && p.id === id ? null : p)), ms)
  }, [])

  const glowAt = useCallback((at: LngLat) => {
    const map = mapRef.current
    if (!map) return
    const el = document.createElement('div')
    el.className = 'glow-ring'
    el.innerHTML = '<span></span>'
    const marker = new maplibregl.Marker({ element: el }).setLngLat(at).addTo(map)
    setTimeout(() => marker.remove(), 1700)
  }, [])

  // tasks
  // 換時段時先用當天的任務快取；按「重新生成」才強制再問一次 Gemini
  const regenerate = useCallback(async (force = false) => {
    setGenBusy(true)
    const r = await generateTasks(s.settings, { now: s.now, slot, weather: s.weather, lucky: s.lucky, litPct: s.litPct, lowWindows: LOW_WINDOWS }, { force })
    s.setTasks(r.tasks, r.greeting, r.source)
    setGenBusy(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.settings, s.now, slot, s.weather, s.lucky, s.litPct])

  const lastSlot = useRef<string>('')
  useEffect(() => {
    const key = `${slot}-${s.weather.eveningPop}`
    if (lastSlot.current === key) return
    lastSlot.current = key
    regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, s.weather.eveningPop])

  // 任務輪播：一次一張卡，左右滑
  const cards = useMemo(
    () =>
      s.tasks
        .map((t, i) => ({ t, i }))
        .sort((a, b) => KIND_ORDER[a.t.kind] - KIND_ORDER[b.t.kind] || a.i - b.i)
        .map((x) => x.t),
    [s.tasks],
  )
  const idsSig = cards.map((t) => t.id).join('|')
  const doneSig = cards.map((t) => (t.done ? '1' : '0')).join('')

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const n = Math.max(0, Math.min(cards.length - 1, i))
      setIdx(n)
      const el = rail.current
      if (el && el.clientWidth) el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
    },
    [cards.length],
  )

  // 抽屜展開或切回這個分頁時，回到原本那張卡
  useLayoutEffect(() => {
    const el = rail.current
    if (el && el.clientWidth) el.scrollLeft = idx * el.clientWidth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen, s.tab])

  const onRailScroll = () => {
    const el = rail.current
    if (!el || !el.clientWidth) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== idx) setIdx(i)
  }

  // 任務重新生成時回到第一張；只是多加一張卡就不動
  const prevIds = useRef(idsSig)
  useEffect(() => {
    const before = prevIds.current ? prevIds.current.split('|') : []
    prevIds.current = idsSig
    const now = idsSig ? idsSig.split('|') : []
    if (!before.every((id) => now.includes(id))) goTo(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsSig])

  // 完成一張卡：蓋章，0.8 秒後滑到下一張還沒完成的卡
  const prevDone = useRef(doneSig)
  useEffect(() => {
    const before = prevDone.current
    prevDone.current = doneSig
    if (before.length !== doneSig.length) return
    const just = cards.findIndex((t, i) => t.done && before[i] === '0')
    if (just < 0) return
    const after = cards.findIndex((t, i) => !t.done && i > just)
    const target = after >= 0 ? after : cards.findIndex((t) => !t.done)
    if (target < 0) return
    const timer = setTimeout(() => goTo(target), 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneSig])

  // 小精靈「晚點走」加的卡：切回地圖時直接滑到那張
  useEffect(() => {
    if (!s.focusTask || s.tab !== 'map') return
    const i = cards.findIndex((t) => t.id === s.focusTask)
    if (i < 0) return
    s.setFocusTask(null)
    setSheetOpen(true)
    setTimeout(() => goTo(i), 150)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.focusTask, s.tab, idsSig])

  // reserved = 預約（任務卡、準時預約）。預約一律算錯峰；現在出發要避開尖峰才算。錯峰的路線亮兩階並累積錯峰之光
  const ride = useCallback(
    async (route: Route, task?: Task, reserved = false) => {
      const map = mapRef.current
      if (!map || riding) return
      const offpeak = isOffpeak(nowRef.current, reserved)
      const boost = offpeak ? 2 : 1
      map.resize()
      map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 })
      const cells = routeCells(route.path)
      setSheetOpen(false)
      // 剛換時段時新底圖還在載入；等它載好再開始，搭到一半換底圖會把軌跡蓋掉（最多等 5 秒）。先標成搭車中，按鈕不會被按第二次
      setRiding({ name: route.name, minutes: route.minutes, pct: 0 })
      for (let i = 0; i < 50 && (swapPending.current || !styleReady.current); i++) await new Promise((r) => setTimeout(r, 100))
      const bounds = new maplibregl.LngLatBounds(route.path[0], route.path[0])
      route.path.forEach((p) => bounds.extend(p))
      map.fitBounds(bounds, { padding: { top: 160, bottom: 150, left: 50, right: 50 }, duration: 900, maxZoom: 13.9 })
      await new Promise((r) => setTimeout(r, 950))
      carRef.current?.setLngLat(route.path[0]).addTo(map)
      const samples = samplePath(route.path, 8)
      const D = Math.min(9000, 3500 + cells.length * 300)
      const lit = new Set<string>()
      let newCells = 0
      let renewedCells = 0
      setRiding({ name: route.name, minutes: route.minutes, pct: 0 })
      await new Promise<void>((resolve) => {
        const t0 = performance.now()
        let shown = -1
        let shownAt = 0
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / D)
          const pos = interpolateAlong(route.path, t)
          carRef.current?.setLngLat(pos)
          // 軌跡最多每 120 毫秒更新一次（最後一格一定更新）；每一格都 setData 會讓地圖的 worker 排隊，畫面跟不上
          const trail = samples.filter((x) => x.t <= t).map((x) => x.p)
          trailRef.current = trail
          if (trail.length !== shown && (t >= 1 || now - shownAt > 120)) {
            shown = trail.length
            shownAt = now
            ;(map.getSource('trail') as maplibregl.GeoJSONSource | undefined)?.setData(lineFeature(trail.length > 1 ? trail : []) as any)
          }
          const fresh = cells.filter((c) => c.t <= t && !lit.has(c.cell)).map((c) => c.cell)
          if (fresh.length) {
            fresh.forEach((c) => lit.add(c))
            const result = s.recordRideCells(fresh, boost)
            newCells += result.newCells
            renewedCells += result.renewedCells
          }
          setRiding({ name: route.name, minutes: route.minutes, pct: Math.round(t * 100) })
          if (t < 1) requestAnimationFrame(frame)
          else resolve()
        }
        requestAnimationFrame(frame)
      })
      const ring = [...new Set(cells.flatMap((c) => neighbours(c.cell)))].filter((c) => !lit.has(c))
      s.lightCells(ring, 1)
      setRiding(null)
      if (task) s.completeTask(task.id)
      if (route.id === 'evening-home') s.markHomeRide()
      glowAt(route.path[route.path.length - 1])
      const head = offpeak ? '錯峰點燈，路線亮兩階！' : '搭 yoxi 抵達！'
      showPop(
        newCells > 0 ? `${head}首次點亮 ${newCells} 格${renewedCells ? `，${renewedCells} 格熟悉的光更亮了` : ''}` : `${head}${renewedCells} 格熟悉的足跡重新亮起`,
        3600,
      )
      // 個人的 Points 只在換到的這一刻出現
      if (offpeak) {
        const r = s.recordOffpeak(cells.map((c) => c.cell))
        if (r.newPoints > 0)
          setTimeout(
            () => showPop(r.newPoints === 1 ? `錯峰之光滿 ${CELLS_PER_POINT} 格，換到 1 點和泰 Points！` : `錯峰之光累積 ${r.light} 格，換到 ${r.newPoints} 點和泰 Points！`, 5200),
            3700,
          )
      }
      setTimeout(() => carRef.current?.remove(), 2500)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [riding, s.lightCells, s.recordRideCells, s.recordOffpeak, glowAt, showPop],
  )

  // 小精靈「現在走」：先等車，小精靈陪你，再開始搭車
  const waitThenRide = useCallback(
    async (route: Route, minutes: number, reserved = false) => {
      if (riding || waiting !== null) return
      setSheetOpen(false)
      setWaiting(minutes)
      mapRef.current?.resize()
      mapRef.current?.flyTo({ center: route.path[0], zoom: 14.2, duration: 800 })
      showPop('等車時看看今天點亮了哪裡～', 3400, false)
      await new Promise((r) => setTimeout(r, 3600))
      setWaiting(null)
      ride(route, undefined, reserved)
    },
    [riding, waiting, ride, showPop],
  )

  // rides requested from elsewhere (小精靈的三個選擇)
  useEffect(() => {
    const r = s.pendingRide
    if (!r) return
    s.requestRide(null)
    const t = r.taskId ? s.tasks.find((x) => x.id === r.taskId) : undefined
    const route = t ? taskRoute(t) : routeById(r.routeId || 'evening-home') || routeById('evening-home')
    if (r.waitMin) waitThenRide(route, r.waitMin, !!r.reserved)
    else ride(route, t, r.reserved ?? !!t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.pendingRide])

  const doWalk = (t: Task) => {
    const p = poiById(t.poiId)
    if (!p) return
    const c = cellAt(p.lng, p.lat)
    const n = s.lightCells([c], 3) + s.lightCells(neighbours(c).slice(0, Math.max(0, t.rewardCells - 1)), 2)
    s.completeTask(t.id)
    // 用 offset 讓開抽屜；flyTo 的 padding 會留在地圖上，之後搭車的 fitBounds 會被多扣一次
    mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 13.8, duration: 900, offset: [0, (60 - sheetPad()) / 2] })
    setTimeout(() => glowAt([p.lng, p.lat]), 700)
    showPop(n > 0 ? `點亮${p.name}了！` : `${p.name}本來就亮著，任務完成！`)
  }

  const doneN = cards.filter((t) => t.done).length
  const nextTask = cards.find((t) => !t.done)
  const summary = !cards.length
    ? '今日任務準備中…'
    : nextTask
      ? `今日任務 ${doneN}/${cards.length}・下一個：${nextTask.title}`
      : `今日任務 ${doneN}/${cards.length}・全部完成！`
  const busy = !!riding || waiting !== null

  return (
    <div className="map-view">
      <div ref={box} className="map" aria-label="點燈地圖" />
      <div className="map-hud">
        <div className="chip chip-lamp">點亮 {s.litPct}%</div>
        <div className="chip">{`傍晚降雨 ${s.weather.eveningPop}%`}{s.weather.source === 'scenario' ? '・情境' : '・氣象署'}</div>
        <div className="chip">幸運數字 {s.lucky}</div>
        <label className="grid-opacity" htmlFor="grid-opacity">
          <span>六角格深淺</span>
          <input id="grid-opacity" type="range" min="0" max="100" step="5" value={gridOpacity} onChange={(event) => setGridOpacity(Number(event.target.value))} />
          <output htmlFor="grid-opacity">{gridOpacity}%</output>
        </label>
        <div className="lit-legend" aria-label="亮度說明">
          <span>
            <i className="hex l1" />
            初訪
          </span>
          <span>
            <i className="hex l2" />
            熟悉
          </span>
          <span>
            <i className="hex l3" />
            常去
          </span>
          <em>7 天沒經過淡一階，不會消失</em>
        </div>
        {mapNote && <div className="map-note">{mapNote}</div>}
      </div>
      {waiting !== null && (
        <div className="ride-banner" role="status">
          <span className="dot" /> 等車中・司機約 {waiting} 分鐘到
        </div>
      )}
      {riding && (
        <div className="ride-banner" role="status">
          <span className="dot" /> {riding.name}・約 {riding.minutes} 分鐘・點亮中 {riding.pct}%
        </div>
      )}
      {pop && (
        <div key={pop.id} className="sprite-pop" style={{ bottom: sheetH + 8 }} role="status">
          <span className="who-pop">
            <SpriteAvatar size={52} mood="wow" phase={s.phase} />
            {pop.sparkle && (
              <span className="sparks" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
            )}
          </span>
          <span className="pop-bubble">{pop.text}</span>
        </div>
      )}
      <section ref={sheetRef} className={`sheet ${sheetOpen ? 'open' : ''}`} aria-label="今日 AI 任務">
        <button className="sheet-handle" onClick={() => setSheetOpen((o) => !o)} aria-expanded={sheetOpen} aria-label={sheetOpen ? '收起任務' : '展開任務'}>
          <span />
        </button>
        {!sheetOpen ? (
          <button className="sheet-summary" onClick={() => setSheetOpen(true)}>
            <span>{summary}</span>
            <span className="caret" aria-hidden="true">
              ⌃
            </span>
          </button>
        ) : (
          <>
            <div className="sheet-head">
              <SpriteAvatar size={44} phase={s.phase} />
              <div className="sheet-title">
                <strong>今日 AI 任務・{SLOT_LABEL[slot]}</strong>
                <span className="muted">{genBusy ? '小精靈正在依天氣、常用地點與空車低谷排任務…' : s.greeting || '　'}</span>
              </div>
              <button className="btn-ghost" onClick={() => regenerate(true)} disabled={genBusy} aria-label="重新生成任務">
                {genBusy ? '生成中' : '重新生成'}
              </button>
            </div>
            <div className="sheet-tags">
              {s.tasksSource === 'demo' && <span className="demo-tag">示範資料（Gemini 未連線）</span>}
              {s.tasksSource === 'live' && <span className="live-tag">Gemini 即時生成</span>}
              <span className="muted tiny">足跡只保存在這支裝置</span>
            </div>
            {genBusy && !cards.length ? (
              <div className="task skeleton" />
            ) : (
              <>
                <div className="rail-wrap">
                  <ul ref={rail} className="task-rail" onScroll={onRailScroll} aria-label="今日任務卡">
                    {cards.map((t, i) => (
                      <li key={t.id} className="slide" aria-label={`第 ${i + 1} 張，共 ${cards.length} 張`}>
                        <div className={`task ${t.done ? 'done' : ''}`}>
                          <div className="task-top">
                            <span className={`kind kind-${t.kind}`}>
                              <KindIcon kind={t.kind} />
                              {KIND_LABEL[t.kind]}
                            </span>
                            <span className="window">{t.window}</span>
                          </div>
                          <strong className="task-title">{t.title}</strong>
                          <p className="task-detail">{t.detail}</p>
                          {t.reason && <p className="task-why">為什麼：{t.reason}</p>}
                          <div className="task-foot">
                            <span className="reward">
                              點亮 {t.rewardCells} 格{t.kind === 'ride' ? '・搭了亮兩階' : ''}
                              {t.rewardCredit > 0 ? `・乘車金 ${t.rewardCredit} 元` : ''}
                            </span>
                            {t.done ? (
                              <span className="done-label">✓ 已完成</span>
                            ) : t.kind === 'ride' ? (
                              <button className="btn-lamp" disabled={busy} onClick={() => ride(taskRoute(t), t, true)}>
                                預約 yoxi
                              </button>
                            ) : t.kind === 'scan' ? (
                              <button className="btn-lamp" onClick={() => s.setTab('scan')}>
                                去拍車
                              </button>
                            ) : (
                              <button className="btn-lamp" onClick={() => doWalk(t)}>
                                我到了
                              </button>
                            )}
                          </div>
                          {t.done && (
                            <span className="stamp" aria-hidden="true">
                              已完成
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {cards.length > 1 && (
                  <div className="dots">
                    <button className="rail-arrow" onClick={() => goTo(idx - 1)} disabled={idx <= 0} aria-label="上一個任務">
                      ‹
                    </button>
                    {cards.map((t, i) => (
                      <button key={t.id} className={`dot ${i === idx ? 'on' : ''} ${t.done ? 'done' : ''}`} onClick={() => goTo(i)} aria-label={`第 ${i + 1} 個任務：${t.title}`} aria-current={i === idx ? 'true' : undefined} />
                    ))}
                    <button className="rail-arrow" onClick={() => goTo(idx + 1)} disabled={idx >= cards.length - 1} aria-label="下一個任務">
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}
