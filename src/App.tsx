import { lazy, Suspense, useEffect, useState } from 'react'
import { useStore, type Tab } from './lib/store'
import { onAiStatus, type AiStatus } from './lib/ai'
import { MapView } from './views/MapView'
import { SpriteChat } from './views/SpriteChat'
import { FriendsView } from './views/FriendsView'
import { SettingsSheet } from './views/SettingsSheet'

const ScanView = lazy(() => import('./views/ScanView').then((m) => ({ default: m.ScanView })))
const OpsView = lazy(() => import('./views/OpsView').then((m) => ({ default: m.OpsView })))

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: 'map', label: '點燈地圖', icon: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2.5 20.2 7.2v9.6L12 21.5l-8.2-4.7V7.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg> },
  { id: 'sprite', label: '小精靈', icon: <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12.5" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="9.5" cy="12" r="1.2" fill="currentColor" /><circle cx="14.5" cy="12" r="1.2" fill="currentColor" /><path d="M12 2v2.2M5 4.5l1.4 1.6M19 4.5l-1.4 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
  { id: 'scan', label: '拍車', icon: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><rect x="7.5" y="10" width="9" height="4.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg> },
  { id: 'friends', label: '好友', icon: <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="9" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="16.5" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 19c.8-3.2 3-4.8 5.5-4.8s4.7 1.6 5.5 4.8M14.5 15.2c2.6-.6 5 .6 6 3.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
  { id: 'ops', label: '營運', icon: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 19.5h16M6.5 16V11M11 16V6.5M15.5 16v-6M20 16V8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> },
]

const SCRIPT = [
  { label: '早上 08:30', h: 8, m: 30, tab: 'map' as Tab, note: '小精靈送上今日任務與幸運數字' },
  { label: '午休 12:30', h: 12, m: 30, tab: 'map' as Tab, note: '完成步行任務，點亮一格新街區' },
  { label: '路上 15:00', h: 15, m: 0, tab: 'scan' as Tab, note: '遇見 yoxi 車，拍車牌召喚小精靈' },
  { label: '傍晚 18:05', h: 18, m: 5, tab: 'sprite' as Tab, note: '下雨提醒，預約 yoxi 一路點亮回家' },
]

export default function App() {
  const s = useStore()
  const [ai, setAi] = useState<AiStatus>({ state: 'idle' })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [scriptOpen, setScriptOpen] = useState(false)
  useEffect(() => {
    const off = onAiStatus(setAi)
    return () => {
      off()
    }
  }, [])
  const clock = `${String(s.now.getHours()).padStart(2, '0')}:${String(s.now.getMinutes()).padStart(2, '0')}`
  const aiLabel = ai.state === 'live' ? 'Gemini 連線中' : ai.state === 'error' ? 'Gemini 未連線，使用示範資料' : ai.state === 'demo' ? '示範模式' : 'AI 準備中'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo-dot" />
          <strong>yoxi 點燈城</strong>
          <span className="proto">黑客松原型</span>
        </div>
        <div className="top-right">
          <button className={`clock ${s.clockIsSim ? 'sim' : ''}`} onClick={() => setScriptOpen((o) => !o)} aria-expanded={scriptOpen} aria-label="一天劇本">
            {clock}
            {s.clockIsSim ? '・劇本' : ''}
          </button>
          <span className={`ai-dot ai-${ai.state}`} title={ai.detail || aiLabel} aria-label={aiLabel} />
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="設定">
            <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </header>

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
        {s.tab === 'ops' && (
          <div className="pane on">
            <Suspense fallback={<div className="loading">載入營運資料…</div>}>
              <OpsView />
            </Suspense>
          </div>
        )}
      </main>

      <nav className="tabbar" aria-label="主要功能">
        {TABS.map((t) => (
          <button key={t.id} className={s.tab === t.id ? 'on' : ''} onClick={() => s.setTab(t.id)} aria-current={s.tab === t.id ? 'page' : undefined}>
            {t.icon}
            <span>{t.label}</span>
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
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
