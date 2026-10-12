import { useState } from 'react'
import { useStore } from '../lib/store'
import { DEFAULT_MODEL, type Settings } from '../lib/settings'

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [d, setD] = useState<Settings>(s.settings)
  const set = (patch: Partial<Settings>) => setD((x) => ({ ...x, ...patch }))
  const save = () => {
    const needsReload = d.firebaseConfig !== s.settings.firebaseConfig || d.appCheckMode !== s.settings.appCheckMode || d.appCheckDebugToken !== s.settings.appCheckDebugToken || d.recaptchaSiteKey !== s.settings.recaptchaSiteKey || d.room !== s.settings.room
    s.updateSettings(d)
    if (needsReload) location.reload()
    else onClose()
  }
  return (
    <div className="modal" role="dialog" aria-label="設定">
      <div className="modal-card settings">
        <div className="modal-head">
          <strong>設定</strong>
          <button className="btn-ghost" onClick={onClose}>
            關閉
          </button>
        </div>

        <h4>Firebase（Gemini、好友排行）</h4>
        <label className="field" htmlFor="fb">
          <span>Firebase 設定（部署在 Firebase Hosting 時可留空，會自動讀取）</span>
          <textarea id="fb" className="input" rows={4} placeholder='{"apiKey":"…","authDomain":"…","projectId":"…","appId":"…"}' value={d.firebaseConfig} onChange={(e) => set({ firebaseConfig: e.target.value })} />
        </label>
        <label className="field" htmlFor="acm">
          <span>App Check 驗證方式</span>
          <select id="acm" className="input" value={d.appCheckMode} onChange={(e) => set({ appCheckMode: e.target.value as Settings['appCheckMode'] })}>
            <option value="debug">偵錯權杖（demo 用，最快）</option>
            <option value="recaptcha">reCAPTCHA v3（正式）</option>
            <option value="none">不使用</option>
          </select>
        </label>
        {d.appCheckMode === 'debug' && (
          <label className="field" htmlFor="dbg">
            <span>偵錯權杖（在 Firebase 主控台 App Check 產生後貼上）</span>
            <input id="dbg" className="input" value={d.appCheckDebugToken} onChange={(e) => set({ appCheckDebugToken: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </label>
        )}
        {d.appCheckMode === 'recaptcha' && (
          <label className="field" htmlFor="rc">
            <span>reCAPTCHA v3 網站金鑰</span>
            <input id="rc" className="input" value={d.recaptchaSiteKey} onChange={(e) => set({ recaptchaSiteKey: e.target.value })} />
          </label>
        )}
        <label className="field" htmlFor="model">
          <span>Gemini 模型</span>
          <input id="model" className="input" value={d.model} onChange={(e) => set({ model: e.target.value || DEFAULT_MODEL })} />
        </label>
        <label className="field" htmlFor="room">
          <span>好友房間代碼（同一個代碼的人會在同一個排行）</span>
          <input id="room" className="input" value={d.room} onChange={(e) => set({ room: e.target.value })} />
        </label>

        <h4>天氣</h4>
        <label className="field" htmlFor="wm">
          <span>天氣來源</span>
          <select id="wm" className="input" value={d.weatherMode} onChange={(e) => set({ weatherMode: e.target.value as Settings['weatherMode'] })}>
            <option value="rain">示範情境：傍晚下雨</option>
            <option value="live">氣象署即時資料</option>
          </select>
        </label>
        {d.weatherMode === 'live' && (
          <label className="field" htmlFor="cwa">
            <span>氣象署開放資料授權碼</span>
            <input id="cwa" className="input" value={d.cwaKey} onChange={(e) => set({ cwaKey: e.target.value })} placeholder="CWA-XXXXXXXX-…" />
          </label>
        )}

        <h4>錄影與彩排</h4>
        <label className="field" htmlFor="lucky">
          <span>今日幸運數字（留空 = 依日期自動算出）</span>
          <input id="lucky" className="input" inputMode="numeric" value={d.luckyOverride} onChange={(e) => set({ luckyOverride: e.target.value.replace(/\D/g, '').slice(0, 2) })} placeholder="21" />
        </label>
        <label className="check" htmlFor="rep">
          <input id="rep" type="checkbox" checked={d.allowRepeat} onChange={(e) => set({ allowRepeat: e.target.checked })} />
          <span>同一台車可以重複收集（彩排用）</span>
        </label>
        <label className="check" htmlFor="demo">
          <input id="demo" type="checkbox" checked={d.forceDemo} onChange={(e) => set({ forceDemo: e.target.checked })} />
          <span>全部使用示範資料（不連 Gemini 與 Firestore）</span>
        </label>
        <div className="row">
          <button
            className="btn-ghost"
            onClick={() => {
              s.resetLit()
              s.toast('點燈進度已重設')
            }}
          >
            重設點燈進度與圖鑑
          </button>
        </div>
        <div className="row end">
          <button className="btn-lamp" onClick={save}>
            儲存
          </button>
        </div>
        <p className="muted tiny">設定只存在這支手機的瀏覽器裡。黑客松概念原型，車牌與人物皆為虛構。</p>
      </div>
    </div>
  )
}
