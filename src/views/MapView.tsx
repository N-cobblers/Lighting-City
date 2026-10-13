import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type Map as MlMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useStore, LOW_WINDOWS } from '../lib/store'
import { AREA_CELLS, CENTER, POIS, cellAt, cellsFeatureCollection, interpolateAlong, lineFeature, neighbours, pathLengthKm, poiById, routeById, routeCells, samplePath, type LngLat, type Route } from '../lib/geo'
import { generateTasks } from '../lib/ai'
import { slotOf, SLOT_LABEL } from '../data/demo'
import type { Task, TaskKind } from '../lib/types'
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
  const [pop, setPop] = useState<{ id: number; text: string } | null>(null)
  const [idx, setIdx] = useState(0)
  const rail = useRef<HTMLUListElement>(null)
  const popId = useRef(0)
  const litRef = useRef(s.lit)
  const gridOpacityRef = useRef(gridOpacity)
  litRef.current = s.lit
  gridOpacityRef.current = gridOpacity
  const sheetRef = useRef<HTMLElement>(null)
  const sheetPad = () => {
    const h = box.current?.clientHeight || 700
    const sh = sheetRef.current?.getBoundingClientRect().height || 300
    return Math.min(h * 0.6, sh)
  }
  const slot = slotOf(s.now)

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
      const b = new maplibregl.LngLatBounds([121.5495, 25.0275], [121.5785, 25.0630])
      map.fitBounds(b, { padding: { top: 70, bottom: sheetPad() + 10, left: 24, right: 24 }, duration: 0 })
    })
    map.on('error', (e: any) => {
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
    const opacity = gridOpacity / 100
    if (!map?.getLayer('area-line') || !map.getLayer('lit-fill') || !map.getLayer('lit-line')) return
    map.setPaintProperty('area-line', 'line-opacity', 0.55 * opacity)
    map.setPaintProperty('lit-fill', 'fill-opacity', ['interpolate', ['linear'], ['get', 'level'], 1, 0.16 * opacity, 2, 0.34 * opacity, 3, 0.58 * opacity])
    map.setPaintProperty('lit-line', 'line-opacity', ['interpolate', ['linear'], ['get', 'level'], 1, 0.25 * opacity, 3, 0.8 * opacity])
  }, [gridOpacity])

  // 小精靈跳出來的那句話，放在抽屜上緣
  useEffect(() => {
    const el = sheetRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setSheetH(el.getBoundingClientRect().height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showPop = useCallback((text: string, ms = 2800) => {
    const id = ++popId.current
    setPop({ id, text })
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
  const regenerate = useCallback(async () => {
    setGenBusy(true)
    const r = await generateTasks(s.settings, { now: s.now, slot, weather: s.weather, lucky: s.lucky, litPct: s.litPct, lowWindows: LOW_WINDOWS })
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

  const ride = useCallback(
    async (route: Route, task?: Task, boost = 1) => {
      const map = mapRef.current
      if (!map || riding) return
      map.resize()
      map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 })
      const cells = routeCells(route.path)
      setSheetOpen(false)
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
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / D)
          const pos = interpolateAlong(route.path, t)
          carRef.current?.setLngLat(pos)
          const trail = samples.filter((x) => x.t <= t).map((x) => x.p)
          ;(map.getSource('trail') as maplibregl.GeoJSONSource | undefined)?.setData(lineFeature(trail.length > 1 ? trail : []) as any)
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
      const head = boost > 1 ? '聰明出行，路線亮兩階！' : '搭 yoxi 抵達！'
      showPop(
        newCells > 0 ? `${head}首次點亮 ${newCells} 格${renewedCells ? `，${renewedCells} 格熟悉的光更亮了` : ''}` : `${head}${renewedCells} 格熟悉的足跡重新亮起`,
        3600,
      )
      setTimeout(() => carRef.current?.remove(), 2500)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [riding, s.lightCells, s.recordRideCells, glowAt, showPop],
  )

  // 小精靈「現在走」：先等車，小精靈陪你，再開始搭車
  const waitThenRide = useCallback(
    async (route: Route, minutes: number, boost = 1) => {
      if (riding || waiting !== null) return
      setSheetOpen(false)
      setWaiting(minutes)
      mapRef.current?.resize()
      mapRef.current?.flyTo({ center: route.path[0], zoom: 14.2, duration: 800 })
      showPop('等車時看看今天點亮了哪裡～', 3400)
      await new Promise((r) => setTimeout(r, 3600))
      setWaiting(null)
      ride(route, undefined, boost)
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
    if (r.waitMin) waitThenRide(route, r.waitMin, r.boost)
    else ride(route, t, r.boost ?? (t ? 2 : 1))
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
      </div>
      {mapNote && <div className="map-note">{mapNote}</div>}
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
          <SpriteAvatar size={52} mood="wow" />
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
              <SpriteAvatar size={44} />
              <div className="sheet-title">
                <strong>今日 AI 任務・{SLOT_LABEL[slot]}</strong>
                <span className="muted">{genBusy ? '小精靈正在依天氣、常用地點與空車低谷排任務…' : s.greeting || '　'}</span>
              </div>
              <button className="btn-ghost" onClick={regenerate} disabled={genBusy} aria-label="重新生成任務">
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
                            <span className={`kind kind-${t.kind}`}>{KIND_LABEL[t.kind]}</span>
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
                              <button className="btn-lamp" disabled={busy} onClick={() => ride(taskRoute(t), t, 2)}>
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
