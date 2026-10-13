import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl, { type Map as MlMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useStore, LOW_WINDOWS } from '../lib/store'
import { AREA_CELLS, CENTER, POIS, cellAt, cellsFeatureCollection, interpolateAlong, lineFeature, neighbours, pathLengthKm, poiById, routeById, routeCells, samplePath, type LngLat, type Route } from '../lib/geo'
import { generateTasks } from '../lib/ai'
import { DEMO_PERSONAS, getDemoPersona, slotOf, SLOT_LABEL } from '../data/demo'
import type { Task } from '../lib/types'
import districts from '../data/districts.json'
import { SpriteAvatar } from './SpriteAvatar'

const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: { districts: { type: 'geojson', data: districts as any } },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0A1326' } },
    { id: 'd-fill', type: 'fill', source: 'districts', paint: { 'fill-color': '#0F1C38', 'fill-opacity': 1 } },
    { id: 'd-line', type: 'line', source: 'districts', paint: { 'line-color': '#2B3E6B', 'line-width': 1.2 } },
  ],
}

function taskRoute(t: Task, personaId?: string): Route {
  const persona = getDemoPersona(personaId)
  if (t.poiId === 'home' || t.poiId === persona.home.poiId) {
    const home = poiById(persona.home.poiId)!
    if (persona.id === 'a-zhe') {
      const commute = routeById('banciao-commute')
      const path = [...commute.path].reverse()
      path[path.length - 1] = [home.lng, home.lat]
      return { ...commute, id: 'banciao-home', name: '下班回板橋新埔', from: commute.to, to: home.id, path }
    }
    if (persona.id === 'xiao-ya') {
      const start = poiById('spot-cityhall')!
      const path: LngLat[] = [[start.lng, start.lat], [121.52, 25.05], [121.49, 25.08], [121.46, 25.12], [home.lng, home.lat]]
      return { id: 'tamsui-home', name: '下班回淡水', from: start.id, to: home.id, path, minutes: Math.round(pathLengthKm(path) * 3 + 3) }
    }
    return routeById('evening-home')
  }
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
  const [genBusy, setGenBusy] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)
  const litRef = useRef(s.lit)
  const gridOpacityRef = useRef(gridOpacity)
  litRef.current = s.lit
  gridOpacityRef.current = gridOpacity
  const sheetRef = useRef<HTMLElement>(null)
  const sheetPad = () => {
    const h = box.current?.clientHeight || 700
    const sh = sheetRef.current?.getBoundingClientRect().height || 300
    return Math.min(h * 0.6, sheetOpen ? sh : 118)
  }
  const slot = slotOf(s.now)
  const persona = getDemoPersona(s.settings.demoPersonaId)
  const personaRef = useRef(persona)
  personaRef.current = persona

  const focusHome = useCallback((map: MlMap, selectedPersona: typeof persona) => {
    const target = poiById(selectedPersona.home.poiId) || poiById('home-xiao-han')
    if (!target) return
    box.current?.querySelectorAll<HTMLElement>('.poi[data-poi-id]').forEach((marker) => {
      const poi = poiById(marker.dataset.poiId || '')
      const homeOwner = DEMO_PERSONAS.find((candidate) => candidate.home.poiId === marker.dataset.poiId)
      const isSelectedHome = marker.dataset.poiId === selectedPersona.home.poiId
      marker.classList.toggle('poi-home', !!homeOwner)
      marker.classList.toggle('poi-home-selected', isSelectedHome)
      marker.classList.toggle('poi-place', poi?.kind === 'place' && !homeOwner)
      marker.textContent = poi?.kind === 'work' ? '公司' : homeOwner ? `${homeOwner.name}家` : ''
      if (homeOwner) marker.title = `${homeOwner.name}的家 · ${poi?.name || ''}`
    })
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: selectedPersona.id === 'xiao-ya' || selectedPersona.id === 'a-zhe' ? 12.2 : 12.8,
      duration: 1000,
      padding: { top: 70, bottom: Math.min((box.current?.clientHeight || 700) * 0.6, (sheetRef.current?.getBoundingClientRect().height || 118) + 16), left: 24, right: 24 },
    })
  }, [])

  const addLayers = useCallback((map: MlMap) => {
    if (map.getSource('area')) return
    const opacity = gridOpacityRef.current / 100
    map.addSource('area', { type: 'geojson', data: cellsFeatureCollection(AREA_CELLS) as any })
    map.addSource('lit', { type: 'geojson', data: cellsFeatureCollection(Object.keys(litRef.current), (c) => ({ level: litRef.current[c] })) as any })
    map.addSource('trail', { type: 'geojson', data: lineFeature([]) as any })
    map.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': '#2B3E6B', 'line-opacity': 0.55 * opacity, 'line-width': 0.8 } })
    map.addLayer({
      id: 'lit-fill',
      type: 'fill',
      source: 'lit',
      paint: { 'fill-color': '#FFC94A', 'fill-opacity': ['interpolate', ['linear'], ['get', 'level'], 1, 0.16 * opacity, 2, 0.34 * opacity, 3, 0.58 * opacity] },
    })
    map.addLayer({ id: 'lit-line', type: 'line', source: 'lit', paint: { 'line-color': '#FFD873', 'line-opacity': ['interpolate', ['linear'], ['get', 'level'], 1, 0.25 * opacity, 3, 0.8 * opacity], 'line-width': 1 } })
    map.addLayer({ id: 'trail-glow', type: 'line', source: 'trail', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFC94A', 'line-width': 12, 'line-blur': 8, 'line-opacity': 0.65 } })
    map.addLayer({ id: 'trail-core', type: 'line', source: 'trail', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFE9A8', 'line-width': 3 } })
  }, [])

  // map init
  useEffect(() => {
    if (!box.current) return
    let usedFallback = false
    const map = new maplibregl.Map({ container: box.current, style: DARK_STYLE, center: CENTER, zoom: 13.25, attributionControl: { compact: true }, pitchWithRotate: false, dragRotate: false })
    mapRef.current = map
    const fallback = () => {
      if (usedFallback) return
      usedFallback = true
      setMapNote('底圖載入失敗，改用離線夜色底圖')
      map.setStyle(FALLBACK_STYLE)
      map.once('styledata', () => addLayers(map))
    }
    const timer = setTimeout(() => {
      if (!map.isStyleLoaded()) fallback()
    }, 7000)
    map.on('load', () => {
      clearTimeout(timer)
      addLayers(map)
    })
    map.once('idle', () => {
      focusHome(map, personaRef.current)
    })
    map.on('error', (e: any) => {
      const msg = String(e?.error?.message || '')
      if (!map.isStyleLoaded() && /style|Failed to fetch|NetworkError|load/i.test(msg)) fallback()
    })
    // yoxi 上車點與地標
    for (const p of POIS) {
      const el = document.createElement('div')
      const homeOwner = DEMO_PERSONAS.find((candidate) => candidate.home.poiId === p.id)
      el.className = `poi poi-${p.kind}`
      el.dataset.poiId = p.id
      el.title = p.name
      if (p.kind === 'work') el.textContent = '公司'
      else if (homeOwner) el.textContent = `${homeOwner.name}家`
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
  }, [addLayers, focusHome])

  // Keep the lit layer in sync with the footprint.
  useEffect(() => {
    const map = mapRef.current
    const src = map?.getSource('lit') as maplibregl.GeoJSONSource | undefined
    if (src) src.setData(cellsFeatureCollection(Object.keys(s.lit), (c) => ({ level: s.lit[c] })) as any)
  }, [s.lit])

  useEffect(() => {
    const map = mapRef.current
    const opacity = gridOpacity / 100
    if (!map?.getLayer('area-line') || !map.getLayer('lit-fill') || !map.getLayer('lit-line')) return
    map.setPaintProperty('area-line', 'line-opacity', 0.55 * opacity)
    map.setPaintProperty('lit-fill', 'fill-opacity', ['interpolate', ['linear'], ['get', 'level'], 1, 0.16 * opacity, 2, 0.34 * opacity, 3, 0.58 * opacity])
    map.setPaintProperty('lit-line', 'line-opacity', ['interpolate', ['linear'], ['get', 'level'], 1, 0.25 * opacity, 3, 0.8 * opacity])
  }, [gridOpacity])

  // tasks
  const regenerate = useCallback(async () => {
    setGenBusy(true)
    const r = await generateTasks(s.settings, { now: s.now, slot, weather: s.weather, lucky: s.lucky, litPct: s.litPct, lowWindows: LOW_WINDOWS, demoPersonaId: s.settings.demoPersonaId })
    s.setTasks(r.tasks, r.greeting, r.source)
    setGenBusy(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.settings, s.now, slot, s.weather, s.lucky, s.litPct])

  const lastSlot = useRef<string>('')
  useEffect(() => {
    const key = `${slot}-${s.weather.eveningPop}-${s.settings.demoPersonaId}`
    if (lastSlot.current === key) return
    lastSlot.current = key
    regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, s.weather.eveningPop, s.settings.demoPersonaId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    focusHome(map, persona)
  }, [persona.home.poiId, persona.id, focusHome])

  const ride = useCallback(
    async (route: Route, task?: Task) => {
      const map = mapRef.current
      if (!map || riding) return
      map.resize()
      const cells = routeCells(route.path)
      setSheetOpen(false)
      const bounds = new maplibregl.LngLatBounds(route.path[0], route.path[0])
      route.path.forEach((p) => bounds.extend(p))
      map.fitBounds(bounds, { padding: { top: 110, bottom: 150, left: 50, right: 50 }, duration: 900, maxZoom: 13.9 })
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
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / D)
          const pos = interpolateAlong(route.path, t)
          carRef.current?.setLngLat(pos)
          const trail = samples.filter((x) => x.t <= t).map((x) => x.p)
          ;(map.getSource('trail') as maplibregl.GeoJSONSource | undefined)?.setData(lineFeature(trail.length > 1 ? trail : []) as any)
          const fresh = cells.filter((c) => c.t <= t && !lit.has(c.cell)).map((c) => c.cell)
          if (fresh.length) {
            fresh.forEach((c) => lit.add(c))
            const result = s.recordRideCells(fresh)
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
      const message = newCells > 0
        ? `搭 yoxi 抵達！首次點亮 ${newCells} 格${renewedCells ? `，${renewedCells} 格熟悉的光也更新了` : ''}`
        : `搭 yoxi 抵達！${renewedCells} 格熟悉的足跡重新亮起`
      s.toast(message, 'lamp')
      setTimeout(() => carRef.current?.remove(), 2500)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [riding, s.lightCells, s.recordRideCells],
  )

  // rides requested from elsewhere (demo bar, chat)
  useEffect(() => {
    if (!s.pendingRide) return
    const id = s.pendingRide
    s.requestRide(null)
    const t = s.tasks.find((x) => x.id === id)
    if (t) ride(taskRoute(t, s.settings.demoPersonaId), t)
    else ride(routeById(id) || routeById('evening-home'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.pendingRide])

  const doWalk = (t: Task) => {
    const p = poiById(t.poiId)
    if (!p) return
    const c = cellAt(p.lng, p.lat)
    const n = s.lightCells([c], 3) + s.lightCells(neighbours(c).slice(0, Math.max(0, t.rewardCells - 1)), 2)
    s.completeTask(t.id)
    mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 13.8, duration: 900, padding: { top: 60, bottom: sheetPad(), left: 0, right: 0 } })
    s.toast(n > 0 ? `完成「${t.title}」，點亮 ${n} 格！` : `完成「${t.title}」！這裡已經亮了`, 'lamp')
  }

  const doGroup = async (t: Task) => {
    const text = `一起搭 yoxi 回家？${t.detail}`
    try {
      if (navigator.share) await navigator.share({ title: 'yoxi 點燈城 揪團', text })
      else await navigator.clipboard.writeText(text)
      s.toast('已送出揪團邀請')
    } catch {
      s.toast('揪團邀請已準備好')
    }
    s.completeTask(t.id)
  }

  const kindLabel = { walk: '步行', ride: '搭 yoxi', group: '揪團' }

  return (
    <div className="map-view">
      <div ref={box} className="map" aria-label="點燈地圖" />
      <div className="map-hud">
        <div className="chip chip-lamp">點亮 {s.litPct}%</div>
        <div className="chip">{s.weather.eveningPop >= 60 ? `傍晚降雨 ${s.weather.eveningPop}%` : `傍晚降雨 ${s.weather.eveningPop}%`}{s.weather.source === 'scenario' ? '・情境' : '・氣象署'}</div>
        <div className="chip">幸運數字 {s.lucky}</div>
        <label className="grid-opacity" htmlFor="grid-opacity">
          <span>六角格深淺</span>
          <input id="grid-opacity" type="range" min="0" max="100" step="5" value={gridOpacity} onChange={(event) => setGridOpacity(Number(event.target.value))} />
          <output htmlFor="grid-opacity">{gridOpacity}%</output>
        </label>
      </div>
      {mapNote && <div className="map-note">{mapNote}</div>}
      {riding && (
        <div className="ride-banner" role="status">
          <span className="dot" /> {riding.name}・約 {riding.minutes} 分鐘・點亮中 {riding.pct}%
        </div>
      )}
      <section ref={sheetRef} className={`sheet ${sheetOpen ? 'open' : ''}`} aria-label="今日 AI 任務">
        <button className="sheet-handle" onClick={() => setSheetOpen((o) => !o)} aria-expanded={sheetOpen}>
          <span />
        </button>
        <div className="sheet-head">
          <SpriteAvatar size={44} />
          <div className="sheet-title">
            <strong>今日 AI 任務・{SLOT_LABEL[slot]}</strong>
            <span className="muted">{genBusy ? '小精靈正在依天氣、常用地點與空車低谷排任務…' : s.greeting || '　'}</span>
          </div>
          <button className="btn-ghost" onClick={regenerate} disabled={genBusy} aria-label="重新生成任務">
            {genBusy ? '生成中' : '重新生成'}
          </button>
        </div>
        {s.tasksSource === 'demo' && <div className="demo-tag">示範資料（Gemini 未連線）</div>}
        {s.tasksSource === 'live' && <div className="live-tag">Gemini 即時生成</div>}
        <p className="muted tiny">重訪讓光暈更暖；久未經過會柔和淡去，足跡只保存在這支裝置。</p>
        <ul className="tasks">
          {(genBusy && !s.tasks.length ? [0, 1, 2] : s.tasks).map((t: any, i: number) =>
            typeof t === 'number' ? (
              <li key={i} className="task skeleton" />
            ) : (
              <li key={t.id} className={`task ${t.done ? 'done' : ''}`}>
                <div className="task-top">
                  <span className={`kind kind-${t.kind}`}>{kindLabel[t.kind as keyof typeof kindLabel]}</span>
                  <span className="window">{t.window}</span>
                </div>
                <strong className="task-title">{t.title}</strong>
                <p className="task-detail">{t.detail}</p>
                <div className="task-foot">
                  <span className="reward">
                    點亮 {t.rewardCells} 格{t.rewardCredit > 0 ? `・乘車金 ${t.rewardCredit} 元` : ''}
                  </span>
                  {t.done ? (
                    <span className="done-label">已完成</span>
                  ) : t.kind === 'ride' ? (
                    <button className="btn-lamp" disabled={!!riding} onClick={() => ride(taskRoute(t), t)}>
                      預約 yoxi
                    </button>
                  ) : t.kind === 'group' ? (
                    <button className="btn-lamp" onClick={() => doGroup(t)}>
                      揪朋友
                    </button>
                  ) : (
                    <button className="btn-lamp" onClick={() => doWalk(t)}>
                      我到了
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  )
}
