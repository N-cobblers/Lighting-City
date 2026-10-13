import { useEffect, useRef, useState } from 'react'
import { useStore, LOW_WINDOWS } from '../lib/store'
import { chatReply, type ChatTurn } from '../lib/ai'
import { slotOf } from '../data/demo'
import { SpriteAvatar } from './SpriteAvatar'
import type { Source } from '../lib/types'

type Msg = ChatTurn & { source?: Source }

const QUICK = ['今晚會下雨嗎？', '幫我預約回家', '午休去哪走走？', '今天的幸運數字是？']

export function SpriteChat() {
  const s = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgs.length) return
    const opening = s.weather.eveningPop >= 60 ? `今晚 6 點降雨機率 ${s.weather.eveningPop}%，下班前先預約 yoxi 吧！` : `${s.greeting || '今天也一起把城市點亮吧！'}`
    setMsgs([{ role: 'model', text: opening, source: 'demo' }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs])

  const send = async (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    setInput('')
    setBusy(true)
    const history = msgs.slice(1).map(({ role, text }) => ({ role, text }))
    setMsgs((m) => [...m, { role: 'user', text: t }, { role: 'model', text: '' }])
    const ctx = { now: s.now, slot: slotOf(s.now), weather: s.weather, lucky: s.lucky, litPct: s.litPct, lowWindows: LOW_WINDOWS, demoPersonaId: s.settings.demoPersonaId, tasks: s.tasks }
    const source = await chatReply(s.settings, ctx, history, t, (partial) =>
      setMsgs((m) => {
        const next = m.slice()
        next[next.length - 1] = { role: 'model', text: partial }
        return next
      }),
    )
    setMsgs((m) => {
      const next = m.slice()
      next[next.length - 1] = { ...next[next.length - 1], source }
      return next
    })
    setBusy(false)
  }

  const last = msgs[msgs.length - 1]
  const offerRide = last?.role === 'model' && /預約|叫車|回家/.test(last.text)

  return (
    <div className="chat-view">
      <header className="chat-head">
        <SpriteAvatar size={48} />
        <div>
          <strong>車燈小精靈</strong>
          <span className="muted small">知道你的常用地點、時段和今天的天氣</span>
        </div>
      </header>
      <div className="chat-log" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role === 'user' ? 'me' : 'it'}`}>
            {m.text || <span className="typing"><i /><i /><i /></span>}
            {m.role === 'model' && m.source && i > 0 && <span className={m.source === 'live' ? 'src live' : 'src'}>{m.source === 'live' ? 'Gemini' : '示範'}</span>}
          </div>
        ))}
        {offerRide && !busy && (
          <div className="bubble it action">
            <button
              className="btn-lamp"
              onClick={() => {
                s.requestRide('evening-home')
                s.setTab('map')
              }}
            >
              預約 18:10 回家
            </button>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="quick">
        {QUICK.map((q) => (
          <button key={q} className="chip-btn" onClick={() => send(q)} disabled={busy}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input id="chat-input" className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="跟小精靈說話…" autoComplete="off" />
        <button className="btn-lamp" disabled={busy || !input.trim()}>
          送出
        </button>
      </form>
    </div>
  )
}
