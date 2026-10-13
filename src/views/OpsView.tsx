import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type Map as MlMap, type StyleSpecification } from 'maplibre-gl'
import { useStore, LOW_WINDOWS } from '../lib/store'
import { aiStats, opsPlan, type OpsPlan } from '../lib/ai'
import { CENTER, cellCenter, cellsFeatureCollection } from '../lib/geo'
import demand from '../data/demand.json'
import modelCard from '../data/wait_model_card.json'
import districts from '../data/districts.json'

const D = demand as any
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: { districts: { type: 'geojson', data: districts as any } },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0A1326' } },
    { id: 'd-fill', type: 'fill', source: 'districts', paint: { 'fill-color': '#0F1C38' } },
    { id: 'd-line', type: 'line', source: 'districts', paint: { 'line-color': '#2B3E6B', 'line-width': 1.2 } },
  ],
}

function inRing(pt: [number, number], ring: number[][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function districtOf(pt: [number, number]): string | null {
  for (const f of (districts as any).features) {
    const g = f.geometry
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    if (polys.some((poly: number[][][]) => inRing(pt, poly[0]))) return f.properties.name
  }
  return null
}

const PROFILE: Record<string, { demand_idx: number[][]; lead_p50: number[][] }> = { 信義區: D.profiles['台北市信義區'], 松山區: D.profiles['台北市松山區'] }
const CELLS: { h3: string; idx: number; district: string }[] = D.cells
  .map((c: any) => ({ ...c, district: districtOf(cellCenter(c.h3)) }))
  .filter((c: any) => c.district === '信義區' || c.district === '松山區')

export function OpsView() {
  const s = useStore()
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const [hour, setHour] = useState(14)
  const [district, setDistrict] = useState<'信義區' | '松山區'>('信義區')
  const [plan, setPlan] = useState<OpsPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const dow = Math.min(4, Math.max(0, (s.now.getDay() + 6) % 7)) // 平日型態，週末時顯示週五

  const heat = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of CELLS) {
      const prof = PROFILE[c.district].demand_idx[dow][hour] / 100
      m[c.h3] = Math.round(c.idx * prof)
    }
    return m
  }, [hour, dow])

  useEffect(() => {
    if (!box.current) return
    let fell = false
    const map = new maplibregl.Map({ container: box.current, style: DARK_STYLE, center: [CENTER[0], CENTER[1] - 0.004], zoom: 12.6, attributionControl: { compact: true }, dragRotate: false })
    mapRef.current = map
    const add = () => {
      if (map.getSource('heat')) return
      map.addSource('heat', { type: 'geojson', data: cellsFeatureCollection(Object.keys(heat), (c) => ({ v: heat[c] })) as any })
      map.addLayer({
        id: 'heat-fill',
        type: 'fill',
        source: 'heat',
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'v'], 0, '#16264A', 30, '#2E6FA8', 55, '#F2A93B', 80, '#FF6B4A'],
          'fill-opacity': 0.72,
        },
      })
      map.addLayer({ id: 'heat-line', type: 'line', source: 'heat', paint: { 'line-color': '#0E1830', 'line-width': 0.6 } })
    }
    const fallback = () => {
      if (fell) return
      fell = true
      map.setStyle(FALLBACK_STYLE)
      map.once('styledata', add)
    }
    const t = setTimeout(() => !map.isStyleLoaded() && fallback(), 7000)
    map.on('load', () => {
      clearTimeout(t)
      add()
    })
    map.once('idle', () => {
      const pts = CELLS.map((c) => cellCenter(c.h3))
      const b = new maplibregl.LngLatBounds(pts[0], pts[0])
      pts.forEach((p) => b.extend(p))
      map.fitBounds(b, { padding: 16, duration: 0 })
    })
    map.on('error', () => !map.isStyleLoaded() && fallback())
    return () => {
      clearTimeout(t)
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const src = mapRef.current?.getSource('heat') as maplibregl.GeoJSONSource | undefined
    src?.setData(cellsFeatureCollection(Object.keys(heat), (c) => ({ v: heat[c] })) as any)
  }, [heat])

  const low = LOW_WINDOWS.find((w) => w.district === district)!.hours
  const prof = PROFILE[district]
  const lead = prof.lead_p50[dow][hour]
  const leads = prof.lead_p50[dow].slice(8, 23).slice().sort((a, b) => a - b)
  const medianLead = leads[Math.floor(leads.length / 2)]
  const isLow = low.includes(hour)

  const dispatch = async () => {
    setBusy(true)
    const h = isLow ? hour : low.reduce((best, x) => (Math.abs(x - hour) < Math.abs(best - hour) ? x : best), low[0])
    if (h !== hour) setHour(h)
    const p = await opsPlan(s.settings, { district, hour: h, demandIdx: prof.demand_idx[dow][h], leadMin: prof.lead_p50[dow][h], medianLead, playersNearby: 520 })
    setPlan(p)
    setBusy(false)
  }

  const push = () => {
    if (!plan) return
    const task = { id: `ops-${Date.now()}`, title: plan.title.slice(0, 18), detail: plan.detail.slice(0, 50), kind: 'ride' as const, poiId: 'spot-songyan', window: `${hour}:00–${hour + 2}:00`, rewardCells: 6, rewardCredit: 0, reason: plan.reason }
    s.setTasks([task, ...s.tasks.filter((t) => !t.id.startsWith('ops-'))].slice(0, 4), s.greeting, s.tasksSource || 'demo')
    s.toast('任務已推播給附近玩家', 'lamp')
  }

  // 7 天預測曲線
  const fc = D.forecast[district === '信義區' ? '台北市信義區' : '台北市松山區']
  const W = 320
  const H = 70
  const pts = (fc.value_idx as number[]).map((v: number, i: number) => `${((i / 167) * W).toFixed(1)},${(H - (v / 100) * (H - 6) - 3).toFixed(1)}`).join(' ')
  const metrics = D.forecast_metrics[district === '信義區' ? '台北市信義區' : '台北市松山區']

  return (
    <div className="ops-view scroll">
      <header className="ops-head">
        <strong>需求預測導流</strong>
        <span className="muted small">資料：yoxi 競賽資料 2026/2–4 彙總指數（不含個別行程）</span>
      </header>
      <div className="seg">
        {(['信義區', '松山區'] as const).map((d) => (
          <button key={d} aria-pressed={district === d} onClick={() => setDistrict(d)}>
            {d}
          </button>
        ))}
      </div>
      <div className="ops-map-wrap">
        <div ref={box} className="ops-map" aria-label="需求熱度地圖" />
        <div className="legend-bar">
          <span>需求低</span>
          <i />
          <span>需求高</span>
        </div>
      </div>
      <label className="field" htmlFor="hour">
        <span>
          平日 <b>{hour}:00</b>　需求指數 {prof.demand_idx[dow][hour]}・叫車到上車 {lead.toFixed(1)} 分（全天中位數 {medianLead.toFixed(1)}）{isLow && <em className="low-pill">推估低谷</em>}
        </span>
        <input id="hour" type="range" min={6} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
        <div className="hours">
          {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
            <span key={h} className={low.includes(h) ? 'on' : ''} />
          ))}
        </div>
      </label>

      <section className="card offpeak-card" aria-label="錯峰點燈">
        <div className="card-head">
          <strong>錯峰點燈</strong>
          <span className="demo-tag">示範＋試算</span>
        </div>
        <p className="small offpeak-line">不發優惠券，用光讓人錯峰。</p>
        <div className="kpis kpis-2">
          <div>
            <b>312 人</b>
            <span className="tiny muted">今天錯峰（示範）</span>
          </div>
          <div>
            <b>-6%</b>
            <span className="tiny muted">18 點叫車（示範）</span>
          </div>
          <div>
            <b>NT$0.6</b>
            <span className="tiny muted">每趟 Points 成本（試算）</span>
          </div>
          <div>
            <b>NT$26.6</b>
            <span className="tiny muted">每趟派遣費（試算）</span>
          </div>
        </div>
        <p className="reason small">信義區平日等超過 10 分鐘：18 點 25%、19 點 11%（2026/2–4 競賽資料彙總）。避開尖峰一小時，等車就少很多。</p>
        <ul className="offpeak-rules small">
          <li>獎勵：錯峰的路線亮兩階；每 20 格錯峰之光換 1 點和泰 Points，每趟最多 2 點、每人每月上限 20 點，由和泰集團 Points 行銷預算支應</li>
          <li>防洗：只算完成的行程，同一格一天只算一次</li>
          <li>驗證：三組對照（只有光／光＋Points／都沒有）</li>
        </ul>
        <p className="muted tiny">試算：一趟錯峰約 12 格 ÷ 20 格／點 × NT$1 ≈ NT$0.6，長途每趟最多 2 點（NT$2）；派遣費 NT$266 × 10% ≈ NT$26.6。正式版用 yoxi 自己的行程紀錄判斷是否錯峰，點燈足跡仍只存在手機；原型用模擬行程。</p>
      </section>

      <ModelCard />

      <section className="card">
        <div className="card-head">
          <strong>下一週需求預測（{district}）</strong>
          <span className="muted small">
            隔日預測誤差 {metrics.wape_level_profile_dayahead}%，基準 {metrics.wape_seasonal_naive}%
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="未來 7 天每小時需求指數">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <line key={d} x1={(d * 24 * W) / 167} x2={(d * 24 * W) / 167} y1={0} y2={H} stroke="#24365F" strokeWidth={1} />
          ))}
          <polyline points={pts} fill="none" stroke="#FFC94A" strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
        <p className="muted tiny">以 4/30 前的資料預測 5/1–5/7 每小時需求（尖峰 = 100）；方法為近 4 週同時段型態加上近期水位，正式版改用 BigQuery ML ARIMA_PLUS。</p>
      </section>

      <section className="card">
        <div className="card-head">
          <strong>AI 派任務</strong>
          {plan && <span className={plan.source === 'live' ? 'live-tag' : 'demo-tag'}>{plan.source === 'live' ? 'Gemini' : '示範資料'}</span>}
        </div>
        {!plan && <p className="muted small">選一個低谷時段，讓 Gemini 設計空車時段任務並說明理由。</p>}
        {plan && (
          <div className="plan">
            <strong>{plan.title}</strong>
            <p className="small">{plan.detail}</p>
            <p className="reason small">{plan.reason}</p>
            <div className="kpis">
              <div>
                <b>{plan.expectedRides}</b>
                <span className="tiny muted">預估新增叫車</span>
              </div>
              <div>
                <b>{low.length}</b>
                <span className="tiny muted">今日低谷時段</span>
              </div>
              <div>
                <b>+{Math.max(1, Math.round(plan.expectedRides / 12))}</b>
                <span className="tiny muted">每位參與司機多接（單）</span>
              </div>
            </div>
          </div>
        )}
        <div className="row">
          <button className="btn-lamp" onClick={dispatch} disabled={busy}>
            {busy ? '設計中…' : plan ? '重新設計' : '設計空車時段任務'}
          </button>
          {plan && (
            <button className="btn-ghost" onClick={push}>
              推播給附近玩家
            </button>
          )}
        </div>
        <p className="muted tiny">預估值為試算：附近玩家 520 人 × 8% 參與；司機端以 12 位自願加入的司機平均分配。</p>
      </section>
    </div>
  )
}

/** 模型與系統：等車預測的回測結果、特徵重要性、Gemini 回應時間與成本控制、後端與測試。 */
function ModelCard() {
  const c = modelCard as any
  const sm = c.backtest.summary
  const ai = aiStats()
  const row = (label: string, model: number, base: number, pct: number) => (
    <tr>
      <th scope="row">{label}</th>
      <td>{model.toFixed(2)} 分</td>
      <td>{base.toFixed(2)} 分</td>
      <td className="better">{pct}%</td>
    </tr>
  )
  return (
    <section className="card model-card" aria-label="模型與系統">
      <div className="card-head">
        <strong>模型與系統</strong>
        <span className="live-tag">實算＋試算</span>
      </div>
      <p className="small model-line">等車預測：LightGBM 分位數迴歸（中位數、八成區間）＋等超過 10 分鐘的機率，4 個行政區＋6 個熱門上車格。</p>
      <table className="bt">
        <caption className="tiny muted">4 週滾動回測（4/3–4/30，每週只用之前的資料）：逐時等車中位數的平均誤差</caption>
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">新模型</th>
            <th scope="col">現行作法</th>
            <th scope="col">誤差減少</th>
          </tr>
        </thead>
        <tbody>
          {row('行政區', sm.district_mae_model, sm.district_mae_base, sm.district_improve_pct)}
          {row('平日尖峰 17–19 點', sm.peak_mae_model, sm.peak_mae_base, sm.peak_improve_pct)}
          {row('熱門上車格', sm.cell_mae_model, sm.cell_mae_base, sm.cell_improve_pct)}
        </tbody>
      </table>
      <p className="tiny muted">八成區間實際涵蓋 {Math.round(sm.coverage_80 * 100)}% 的行程；現行作法＝近 4 週同星期同時段的中位數。</p>
      <p className="small">
        影響最大的特徵：
        {c.importance.slice(0, 3).map((x: any, i: number) => (
          <span key={x.feature} className="imp">
            {i ? '、' : ''}
            {x.feature} {x.pct}%
          </span>
        ))}
      </p>
      <ul className="offpeak-rules small">
        <li>小精靈會用工具（Gemini function calling）：查預報、查進度、排錯峰；排錯峰只提案，按確認才加任務。沒網路時用關鍵字判斷，照樣用同一組工具。</li>
        <li>
          Gemini：{ai.avgMs == null ? '目前用示範資料（未連線）' : `最近 ${ai.calls} 次平均 ${(ai.avgMs / 1000).toFixed(1)} 秒`}；任務快取命中 {ai.cacheHits} 次，同一時段同樣天氣只生成一次；每位月活每月雲端約 NT$0.71（試算）。
        </li>
        <li>錯峰點燈後端：Cloud Functions＋Firestore 規則，Points 帳本用行程編號防重複；城市數字每區每小時至少 20 人才顯示、取整到 10。</li>
        <li>測試：單元測試、Firebase 模擬器測試、e2e，GitHub Actions 每個 PR 自動跑。</li>
      </ul>
    </section>
  )
}
