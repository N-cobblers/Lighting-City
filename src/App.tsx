import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { useStore, type Tab } from './lib/store'
import { onAiStatus, type AiStatus } from './lib/ai'
import { nextRideForecast } from './lib/forecast'
import type { Phase } from './lib/phase'
import { DEMO_PERSONAS, getDemoPersona } from './data/demo'
import { MapView } from './views/MapView'
import { SpriteChat } from './views/SpriteChat'
import { FriendsView } from './views/FriendsView'
import { SettingsSheet } from './views/SettingsSheet'

const ScanView = lazy(() => import('./views/ScanView').then((m) => ({ default: m.ScanView })))
const OpsView = lazy(() => import('./views/OpsView').then((m) => ({ default: m.OpsView })))

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: 'map', label: '城市', icon: <svg viewBox="0 0 24 24" width="22" height="22"><path className="tf" d="M12 2.5 20.2 7.2v9.6L12 21.5l-8.2-4.7V7.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg> },
  { id: 'scan', label: '拍車', icon: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><rect className="tf" x="7.5" y="10" width="9" height="4.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg> },
  { id: 'friends', label: '好友', icon: <svg viewBox="0 0 24 24" width="22" height="22"><circle className="tf" cx="9" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle className="tf" cx="16.5" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 19c.8-3.2 3-4.8 5.5-4.8s4.7 1.6 5.5 4.8M14.5 15.2c2.6-.6 5 .6 6 3.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
  { id: 'sprite', label: '小精靈', icon: <svg viewBox="0 0 24 24" width="22" height="22"><circle className="tf" cx="12" cy="12.5" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="9.5" cy="12" r="1.2" fill="currentColor" /><circle cx="14.5" cy="12" r="1.2" fill="currentColor" /><path d="M12 2v2.2M5 4.5l1.4 1.6M19 4.5l-1.4 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
]

// 換時段時蓋上一層天空色再掀開，看起來像 1 秒的淡入淡出
const SKY: Record<Phase, string> = { dawn: '#DCEBFF', day: '#F4F7FB', dusk: '#6B4A7A', night: '#0E1830' }

/** 時鐘旁的天空圖示：早晨日出、白天太陽、黃昏夕陽、夜晚月亮。 */
function SkyIcon({ phase }: { phase: Phase }) {
  if (phase === 'night')
    return (
      <svg className="sky" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 13.6A8.6 8.6 0 1 1 10.4 3.5a6.8 6.8 0 0 0 10.1 10.1Z" fill="#FFE08A" />
        <path d="M18 3.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5Z" fill="#FFE08A" />
      </svg>
    )
  if (phase === 'day')
    return (
      <svg className="sky" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.6" fill="#F2A93B" />
        <path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M5.1 18.9l1.7-1.7M17.2 6.8l1.7-1.7" stroke="#F2A93B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  const dusk = phase === 'dusk'
  const sun = dusk ? '#FF9A3D' : '#F2A93B'
  return (
    <svg className="sky" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 17a5.5 5.5 0 0 1 11 0Z" fill={sun} />
      <path d="M2.5 17h19M5.5 20.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {dusk ? (
        <path d="M9.5 5.5 12 8l2.5-2.5" stroke={sun} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9.5 6 12 3.5 14.5 6M12 3.5v5" stroke={sun} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
      <path d="M4.6 11.6l1.3 1.1M19.4 11.6l-1.3 1.1" stroke={sun} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const SCRIPT = [
  { label: '早上 08:30', h: 8, m: 30, tab: 'map' as Tab, note: '小精靈預報今天 18 點難叫，選「晚點走」' },
  { label: '午休 12:30', h: 12, m: 30, tab: 'map' as Tab, note: '完成步行任務，點亮一格新街區' },
  { label: '路上 15:00', h: 15, m: 0, tab: 'scan' as Tab, note: '遇見 yoxi 車，拍車牌召喚小精靈' },
  { label: '傍晚 18:05', h: 18, m: 5, tab: 'map' as Tab, note: '按 19:00 的卡出發：錯峰點燈換 Points' },
]

export default function App() {
  const s = useStore()
  const [ai, setAi] = useState<AiStatus>({ state: 'idle' })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [scriptOpen, setScriptOpen] = useState(false)
  const [personaOpen, setPersonaOpen] = useState(false)
  const [opsOpen, setOpsOpen] = useState(false)
  const [shownPhase, setShownPhase] = useState<Phase>(s.phase)
  const [veil, setVeil] = useState({ on: false, color: SKY[s.phase] })
  useEffect(() => {
    const off = onAiStatus(setAi)
    return () => {
      off()
    }
  }, [])
  // 時段寫在 <html data-phase>，配色變數跟著換；在畫面畫出來前就設好，避免先閃一下夜色
  useLayoutEffect(() => {
    document.documentElement.dataset.phase = shownPhase
  }, [shownPhase])
  useEffect(() => {
    if (s.phase === shownPhase) {
      setVeil((v) => (v.on ? { ...v, on: false } : v))
      return
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShownPhase(s.phase)
      return
    }
    setVeil({ on: true, color: SKY[s.phase] })
    const swap = setTimeout(() => setShownPhase(s.phase), 450)
    const lift = setTimeout(() => setVeil((v) => ({ ...v, on: false })), 1000)
    return () => {
      clearTimeout(swap)
      clearTimeout(lift)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase])
  const clock = `${String(s.now.getHours()).padStart(2, '0')}:${String(s.now.getMinutes()).padStart(2, '0')}`
  const forecastUnread = nextRideForecast(s.now, s.homeRideDay === new Date().toDateString()).key !== s.forecastSeenKey && s.tab !== 'sprite'
  const aiLabel = ai.state === 'live' ? 'Gemini 連線中' : ai.state === 'error' ? 'Gemini 未連線，使用示範資料' : ai.state === 'demo' ? '示範模式' : 'AI 準備中'
  const persona = getDemoPersona(s.settings.demoPersonaId)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo-dot" />
          <div className="brand-text">
            <strong>yoxi 點燈城</strong>
            <span className="brand-sub">
              <span className="proto">黑客松原型</span>
              {/* 示範人物放在品牌第二行，頂欄右邊留給時鐘、營運與設定 */}
              <button
                className="persona-chip"
                onClick={() => {
                  setPersonaOpen((o) => !o)
                  setScriptOpen(false)
                }}
                aria-expanded={personaOpen}
                aria-label={`示範人物：${persona.name}（${persona.role}），點一下切換`}
              >
                {persona.name}
                <i aria-hidden="true">▾</i>
              </button>
            </span>
          </div>
        </div>
        <div className="top-right">
          <button
            className={`clock ${s.clockIsSim ? 'sim' : ''}`}
            onClick={() => {
              setScriptOpen((o) => !o)
              setPersonaOpen(false)
            }}
            aria-expanded={scriptOpen}
            aria-label="一天劇本"
          >
            <SkyIcon phase={shownPhase} />
            {clock}
            {/* 劇本時間用車燈色外框表示；頂欄放了示範人物後，字就不另外寫出來 */}
            {s.clockIsSim && <span className="sr-only">（劇本時間）</span>}
          </button>
          <span className={`ai-dot ai-${ai.state}`} title={ai.detail || aiLabel} aria-label={aiLabel} />
          <button className="ops-pill" onClick={() => setOpsOpen(true)} aria-label="營運">
            營運
          </button>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="設定">
            <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </header>

      {personaOpen && (
        <div className="script persona-menu" role="menu" aria-label="示範人物">
          <strong>示範人物（虛構）</strong>
          {DEMO_PERSONAS.map((p) => (
            <button
              key={p.id}
              role="menuitemradio"
              aria-checked={p.id === persona.id}
              className={`script-step ${p.id === persona.id ? 'on' : ''}`}
              onClick={() => {
                if (p.id !== persona.id) {
                  s.updateSettings({ demoPersonaId: p.id })
                  s.toast(`換成${p.name}・${p.role}`)
                }
                setPersonaOpen(false)
              }}
            >
              <span className="n">{p.name.slice(-1)}</span>
              <span>
                <b>
                  {p.name}・{p.role}
                </b>
                <em>
                  住{p.homePlace}，在市府附近上班
                </em>
              </span>
            </button>
          ))}
        </div>
      )}

      {scriptOpen && (
        <div className="script" role="menu" aria-label="一天劇本">
          <strong>一天劇本（錄影用）</strong>
          {SCRIPT.map((st, i) => (
            <button
              key={st.label}
              role="menuitem"
              className="script-step"
              onClick={() => {
                s.setClock(st.h, st.m)
                s.setTab(st.tab)
                setScriptOpen(false)
              }}
            >
              <span className="n">{i + 1}</span>
              <span>
                <b>{st.label}</b>
                <em>{st.note}</em>
              </span>
            </button>
          ))}
          <button
            className="btn-ghost"
            onClick={() => {
              s.resetClock()
              setScriptOpen(false)
            }}
          >
            回到現在時間
          </button>
        </div>
      )}

      <main className="main">
        <div className={`pane ${s.tab === 'map' ? 'on' : ''}`}>
          <MapView />
        </div>
        {s.tab === 'sprite' && (
          <div className="pane on">
            <SpriteChat />
          </div>
        )}
        {s.tab === 'scan' && (
          <div className="pane on">
            <Suspense fallback={<div className="loading">載入相機…</div>}>
              <ScanView />
            </Suspense>
          </div>
        )}
        {s.tab === 'friends' && (
          <div className="pane on">
            <FriendsView />
          </div>
        )}
      </main>

      <nav className="tabbar" aria-label="主要功能">
        {TABS.map((t) => (
          <button key={t.id} className={s.tab === t.id ? 'on' : ''} onClick={() => s.setTab(t.id)} aria-current={s.tab === t.id ? 'page' : undefined}>
            <span className="tab-icon">
              {t.icon}
              {t.id === 'sprite' && forecastUnread && <i className="tab-dot" aria-hidden="true" />}
            </span>
            <span>{t.label}</span>
            {t.id === 'sprite' && forecastUnread && <span className="sr-only">（有新預報）</span>}
          </button>
        ))}
      </nav>

      <div className="toasts" aria-live="polite">
        {s.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'lamp' ? 'lamp' : ''}`}>
            {t.text}
          </div>
        ))}
      </div>
      {opsOpen && (
        <div className="ops-overlay" role="dialog" aria-modal="true" aria-label="yoxi 營運視角">
          <header className="ops-bar">
            <button className="ops-back" onClick={() => setOpsOpen(false)}>
              ← 回乘客畫面
            </button>
            <strong>yoxi 營運視角</strong>
          </header>
          <div className="ops-body">
            <Suspense fallback={<div className="loading">載入營運資料…</div>}>
              <OpsView />
            </Suspense>
          </div>
        </div>
      )}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      <div className={`phase-veil ${veil.on ? 'on' : ''}`} style={{ background: veil.color }} aria-hidden="true" />
    </div>
  )
}
