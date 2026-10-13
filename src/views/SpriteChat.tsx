import { useEffect, useRef, useState } from 'react'
import { useStore, LOW_WINDOWS } from '../lib/store'
import { chatWithTools, type ChatTurn } from '../lib/ai'
import type { Proposal } from '../lib/tools'
import { forecastText, nextRideForecast, LATER_HOUR } from '../lib/forecast'
import { CITY_DEMO } from '../lib/offpeak'
import { slotOf } from '../data/demo'
import { SpriteAvatar } from './SpriteAvatar'
import type { Source } from '../lib/types'

type Msg = ChatTurn & { source?: Source; tag?: string; tools?: string[] }
type Choice = '準時預約' | '晚點走' | '現在走'

const QUICK = ['明天 8 點從公司叫車好叫嗎？', '幫我避開尖峰', '我今天還有哪些任務？', '今晚會下雨嗎？', '今天的幸運數字是？']
const CHOICES: Choice[] = ['準時預約', '晚點走', '現在走']
const LATER_TASK_ID = 'later-home'
const RESERVED_TASK_ID = 'reserved-home'

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export function SpriteChat() {
  const s = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  // 哪一則小精靈訊息底下要顯示「準時預約／晚點走／現在走」
  const [choiceAt, setChoiceAt] = useState(-1)
  const [focusCard, setFocusCard] = useState<string | null>(null)
  // 小精靈用「排錯峰」工具提出的方案，玩家按確認才加任務卡
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const forecast = nextRideForecast(s.now, s.homeRideDay === new Date().toDateString(), s.weather.eveningPop)
  // 錯峰點燈只給城市層級的數字（示範），放在三個選擇旁邊
  const cityLine = forecast.isToday ? `今天已有 ${CITY_DEMO.today} 人選「晚點走」` : `已有 ${CITY_DEMO.tomorrow} 人先排好${forecast.when.replace(` 18 點`, '')}晚點走`

  useEffect(() => {
    if (msgs.length) return
    setMsgs([{ role: 'model', text: forecastText(forecast, s.weather.eveningPop), source: 'demo', tag: 'LightGBM 預測' }])
    setChoiceAt(0)
    s.markForecastSeen(forecast.key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs])

  // 三個選擇的回覆是示範流程（不會真的叫車），標「示範」
  const say = (user: string, reply: string) => setMsgs((m) => [...m, { role: 'user', text: user }, { role: 'model', text: reply, source: 'demo' }])
  const goRide = (r: Parameters<typeof s.requestRide>[0]) =>
    setTimeout(() => {
      s.requestRide(r)
      s.setTab('map')
    }, 900)

  const choose = (c: Choice) => {
    setChoiceAt(-1)
    setFocusCard(null)
    setProposal(null)
    const later = forecast.laterLead.toFixed(1)
    if (c === '現在走') {
      say(c, `好，現在幫你叫車！司機約 ${forecast.nowWait} 分鐘到，等車時我陪你。`)
      goRide({ routeId: 'evening-home', reserved: false, waitMin: forecast.nowWait })
      return
    }
    if (c === '準時預約') {
      if (forecast.isNow) {
        const pickup = new Date(s.now.getTime() + 5 * 60000)
        say(c, `好，幫你預約 ${hhmm(pickup)} 從市府路上車點出發。準時出發，路線亮兩階！`)
        goRide({ routeId: 'evening-home', reserved: true })
        return
      }
      if (forecast.isToday) {
        s.addTask({ id: RESERVED_TASK_ID, title: '已預約 18:10 回家', detail: '18:10 從市府路上車點出發，一路點亮回家的路。', kind: 'ride', poiId: 'home', window: '18:10', rewardCells: 12, rewardCredit: 0, reason: '預約讓司機提早安排，尖峰也準時', pinned: true })
        setFocusCard(RESERVED_TASK_ID)
        say(c, '好，幫你預約今天 18:10 從市府路上車點出發，已放進今日任務。準時出發，路線亮兩階！')
        return
      }
      say(c, `好，幫你預約${forecast.when.replace(' 18 點', '')} 18:10 從市府路上車點出發，前一小時提醒你。`)
      return
    }
    // 晚點走
    if (forecast.isToday) {
      s.addTask({ id: LATER_TASK_ID, title: `${LATER_HOUR}:00 從市府回家`, detail: `${LATER_HOUR} 點後出發，一路點亮回家的路。`, kind: 'ride', poiId: 'home', window: `${LATER_HOUR}:00–${LATER_HOUR}:30`, rewardCells: 12, rewardCredit: 0, reason: `${LATER_HOUR} 點後${forecast.place}叫車到上車約 ${later} 分`, pinned: true })
      setFocusCard(LATER_TASK_ID)
      say(c, `好，${LATER_HOUR}:00 後再走，那時叫車到上車約 ${later} 分，搭了亮兩階。已放進今日任務最後一張。`)
      return
    }
    say(c, `好，${forecast.when.replace(' 18 點', '')} ${LATER_HOUR}:00 後再走，到時候提醒你。`)
  }

  const send = async (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    setInput('')
    setBusy(true)
    setChoiceAt(-1)
    setFocusCard(null)
    setProposal(null)
    const history = msgs.slice(1).map(({ role, text }) => ({ role, text }))
    const at = msgs.length + 1
    setMsgs((m) => [...m, { role: 'user', text: t }, { role: 'model', text: '' }])
    const ctx = { now: s.now, slot: slotOf(s.now), weather: s.weather, lucky: s.lucky, litPct: s.litPct, lowWindows: LOW_WINDOWS, tasks: s.tasks }
    const toolCtx = { now: s.now, eveningPop: s.weather.eveningPop, tasks: s.tasks, litPct: s.litPct, offpeak: s.offpeakSummary }
    const r = await chatWithTools(s.settings, ctx, toolCtx, history, t)
    setMsgs((m) => {
      const next = m.slice()
      next[next.length - 1] = { role: 'model', text: r.text, source: r.source, tools: r.tools }
      return next
    })
    if (r.proposal) setProposal(r.proposal)
    else if (!r.tools.length && /預約|叫車|回家/.test(r.text)) setChoiceAt(at)
    setBusy(false)
  }

  const confirmProposal = (ok: boolean) => {
    if (!proposal) return
    if (ok) {
      s.addTask(proposal.task)
      setFocusCard(proposal.task.id)
      say('確認', `好，已排進今天的任務：${proposal.summary}。`)
    } else {
      say('先不用', '好，先不排，想錯峰的時候再叫我。')
    }
    setProposal(null)
  }

  return (
    <div className="chat-view">
      <header className="chat-head">
        <SpriteAvatar size={48} phase={s.phase} />
        <div>
          <strong>車燈小精靈</strong>
          <span className="muted small">知道你的常用地點、時段和今天的天氣</span>
        </div>
      </header>
      <div className="chat-log" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className="msg">
            <div className={`bubble ${m.role === 'user' ? 'me' : 'it'}`}>
              {m.text || (
                <span className="typing">
                  <i />
                  <i />
                  <i />
                </span>
              )}
              {m.role === 'model' && (m.tag || (m.source && i > 0)) && (
                <span className={m.source === 'live' && !m.tag ? 'src live' : 'src'}>
                  {m.tag || (m.source === 'live' ? 'Gemini' : '示範')}
                  {m.tools?.length ? `・用了工具：${m.tools.join('、')}` : ''}
                </span>
              )}
            </div>
            {i === choiceAt && !busy && (
              <div className="chat-choices" role="group" aria-label="怎麼出發">
                {i === 0 && (
                  <p className="city-line">
                    {cityLine}
                    <span className="demo-mini">示範</span>
                  </p>
                )}
                {CHOICES.map((c) => (
                  <button key={c} className={c === '準時預約' ? 'btn-lamp' : 'btn-ghost'} onClick={() => choose(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {proposal && !busy && (
          <div className="proposal" role="group" aria-label="小精靈的錯峰提案">
            <strong>錯峰提案</strong>
            <p>{proposal.summary}</p>
            <div className="chat-choices">
              <button className="btn-lamp" onClick={() => confirmProposal(true)}>
                確認排進任務
              </button>
              <button className="btn-ghost" onClick={() => confirmProposal(false)}>
                先不用
              </button>
            </div>
          </div>
        )}
        {focusCard && (
          <div className="chat-choices">
            <button
              className="btn-ghost"
              onClick={() => {
                s.setFocusTask(focusCard)
                s.setTab('map')
              }}
            >
              到地圖看這張卡
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
