import { getFirebase } from './firebase'
import type { Settings } from './settings'
import type { Source, Task, Weather } from './types'
import { POIS, poiById } from './geo'
import { FALLBACK_CHAT, FALLBACK_CHAT_DEFAULT, FALLBACK_OPS, PERSONA, SLOT_LABEL, getDemoPersona, getFallbackTasks, type Slot } from '../data/demo'

export type AiStatus = { state: 'idle' | 'live' | 'demo' | 'error'; detail?: string }
type Listener = (s: AiStatus) => void
let status: AiStatus = { state: 'idle' }
const listeners = new Set<Listener>()
export const onAiStatus = (fn: Listener) => {
  listeners.add(fn)
  fn(status)
  return () => listeners.delete(fn)
}
function setStatus(s: AiStatus) {
  status = s
  listeners.forEach((l) => l(s))
}

export type AiContext = {
  now: Date
  slot: Slot
  weather: Weather
  lucky: number
  litPct: number
  lowWindows: { district: string; hours: number[] }[]
  demoPersonaId?: string
  tasks?: Task[]
  friendsTop?: string
}

const TIMEOUT_MS = 20000

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
}

async function getModel(settings: Settings, opts: { json?: any; system?: string; temperature?: number }) {
  if (settings.forceDemo) throw new Error('demo mode')
  const fb = await getFirebase(settings)
  if (!fb) throw new Error('Firebase 尚未設定')
  const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai')
  const ai = getAI(fb.app, { backend: new GoogleAIBackend() })
  const generationConfig: any = { temperature: opts.temperature ?? 0.8 }
  if (opts.json) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseSchema = opts.json
  }
  return getGenerativeModel(ai, { model: settings.model, systemInstruction: opts.system, generationConfig })
}

function contextBlock(ctx: AiContext) {
  const hhmm = `${String(ctx.now.getHours()).padStart(2, '0')}:${String(ctx.now.getMinutes()).padStart(2, '0')}`
  const weekday = '日一二三四五六'[ctx.now.getDay()]
  const persona = getDemoPersona(ctx.demoPersonaId || PERSONA.id)
  return JSON.stringify(
    {
      現在: `${ctx.now.getMonth() + 1}/${ctx.now.getDate()}（週${weekday}）${hhmm}，${SLOT_LABEL[ctx.slot]}`,
      玩家: { 名字: persona.name, 身分: persona.role, 常用地點: [persona.home.label, persona.work.label], 習慣: persona.habits },
      天氣: { 來源: ctx.weather.source === 'cwa' ? '中央氣象署' : '示範情境', 概況: ctx.weather.desc, 傍晚降雨機率: ctx.weather.eveningPop },
      需求低谷時段: ctx.lowWindows.map((w) => ({ 行政區: w.district, 平日小時: w.hours })),
      今日幸運數字: ctx.lucky,
      點亮進度: `${ctx.litPct}%`,
      可用地點: POIS.filter((p) => p.kind !== 'home' && p.kind !== 'work').map((p) => ({ poiId: p.id, 名稱: p.name })).concat([{ poiId: persona.home.poiId, 名稱: persona.home.label }]),
    },
    null,
    0,
  )
}

const TASK_SYSTEM = `你是 yoxi 點燈城的任務設計師，也是住在 yoxi 車燈裡的「車燈小精靈」。
城市一開始是夜色，玩家搭 yoxi 會點亮整條路線，完成任務會點亮街區（H3 六角格）。
請依情境為玩家設計今天的 3 個情境任務，規則：
1. 至少 1 個任務不用搭車（kind = walk），在公司或住家附近步行就能完成。
2. 傍晚降雨機率 60% 以上時，一定要有回玩家住家的任務（kind = ride，poiId 必須使用玩家常用地點中的住家 poiId，任務文案要寫出住家地名）。
3. 其他搭車任務排在「需求低谷時段」，rewardCredit 是只能在該時段折抵的乘車金（20–50 元），不在低谷的任務 rewardCredit = 0。
4. poiId 只能從「可用地點」選。window 用「HH:MM–HH:MM」。
5. 標題 14 字以內，detail 40 字以內，語氣溫暖、具體。reason 寫給營運人員看，說明為什麼這樣派，40 字以內，要提到資料依據（低谷時段、天氣或習慣）。
6. greeting 是小精靈對玩家說的一句話，30 字以內。
全部使用繁體中文。`

export async function generateTasks(settings: Settings, ctx: AiContext): Promise<{ greeting: string; tasks: Task[]; source: Source }> {
  const fallback = () => {
    const f = getFallbackTasks(ctx.slot, ctx.demoPersonaId)
    return { greeting: f.greeting, tasks: f.tasks.map((t) => ({ ...t })), source: 'demo' as Source }
  }
  try {
    const { Schema } = await import('firebase/ai')
    const schema = Schema.object({
      properties: {
        greeting: Schema.string(),
        tasks: Schema.array({
          items: Schema.object({
            properties: {
              title: Schema.string(),
              detail: Schema.string(),
              kind: Schema.enumString({ enum: ['walk', 'ride', 'group'] }),
              poiId: Schema.enumString({ enum: POIS.map((p) => p.id) }),
              window: Schema.string(),
              rewardCells: Schema.integer(),
              rewardCredit: Schema.integer(),
              reason: Schema.string(),
            },
          }),
        }),
      },
    })
    const model = await getModel(settings, { json: schema, system: TASK_SYSTEM, temperature: 0.9 })
    const res = await withTimeout(model.generateContent(`情境資料：${contextBlock(ctx)}\n請產生今天的 3 個任務。`))
    const parsed = JSON.parse(res.response.text())
    const tasks: Task[] = (parsed.tasks || []).slice(0, 3).map((t: any, i: number) => ({
      id: `g-${Date.now()}-${i}`,
      title: String(t.title || '').slice(0, 20),
      detail: String(t.detail || '').slice(0, 60),
      kind: ['walk', 'ride', 'group'].includes(t.kind) ? t.kind : 'walk',
      poiId: poiById(t.poiId) ? t.poiId : 'sunyatsen',
      window: String(t.window || ''),
      rewardCells: Math.max(1, Math.min(20, Number(t.rewardCells) || 1)),
      rewardCredit: Math.max(0, Math.min(80, Number(t.rewardCredit) || 0)),
      reason: String(t.reason || ''),
    }))
    if (!tasks.length) throw new Error('empty')
    setStatus({ state: 'live', detail: settings.model })
    return { greeting: String(parsed.greeting || ''), tasks, source: 'live' }
  } catch (e: any) {
    setStatus({ state: settings.forceDemo ? 'demo' : 'error', detail: String(e?.message || e) })
    return fallback()
  }
}

const CHAT_SYSTEM = `你是「車燈小精靈」，住在每一台 yoxi 車的車燈裡，是玩家的城市嚮導。個性溫暖、貼心、有一點俏皮。
你知道玩家的常用地點、時段、今天的天氣、任務、幸運數字與點亮進度（見情境資料）。
回覆規則：繁體中文，60 字以內，像朋友聊天；適時建議任務或預約 yoxi，但不要捏造優惠或價格；
提醒安全：只在人行道上拍停妥的車，騎車或開車時不要拍。`

export type ChatTurn = { role: 'user' | 'model'; text: string }

export async function chatReply(settings: Settings, ctx: AiContext, history: ChatTurn[], message: string, onText: (t: string) => void): Promise<Source> {
  try {
    const model = await getModel(settings, { system: `${CHAT_SYSTEM}\n情境資料：${contextBlock(ctx)}`, temperature: 0.9 })
    const chat = model.startChat({ history: history.map((h) => ({ role: h.role, parts: [{ type: 'text' as const, text: h.text }] })) })
    const result = await withTimeout(chat.sendMessageStream(message))
    let text = ''
    for await (const chunk of result.stream) {
      text += chunk.text()
      onText(text)
    }
    if (!text) throw new Error('empty')
    setStatus({ state: 'live', detail: settings.model })
    return 'live'
  } catch (e: any) {
    setStatus({ state: settings.forceDemo ? 'demo' : 'error', detail: String(e?.message || e) })
    const hit = FALLBACK_CHAT.find((f) => f.match.test(message))
    onText(hit ? hit.reply : FALLBACK_CHAT_DEFAULT)
    return 'demo'
  }
}

export async function spriteLine(settings: Settings, input: { plateMasked: string; sum: number; lucky: number; palette: string }): Promise<{ title: string; line: string; source: Source }> {
  const diff = Math.abs(input.sum - input.lucky)
  const fallback = {
    title: `${input.palette}的小精靈`,
    line: diff === 0 ? `剛好 ${input.sum}！今天的幸運之光就是你！` : `車牌加總 ${input.sum}，離今天的 ${input.lucky} 只差 ${diff}！`,
    source: 'demo' as Source,
  }
  try {
    const { Schema } = await import('firebase/ai')
    const schema = Schema.object({ properties: { title: Schema.string(), line: Schema.string() } })
    const model = await getModel(settings, {
      json: schema,
      system: '你是車燈小精靈。玩家剛在路上遇見一台 yoxi 車，你從車燈裡跳出來。title 是你這隻小精靈的稱號（8 字以內，和光色或信義、松山一帶有關）；line 是你跳出來說的第一句話（30 字以內，要提到車牌加總和今日幸運數字的差距）。繁體中文。',
      temperature: 1,
    })
    const res = await withTimeout(model.generateContent(JSON.stringify({ 車牌: input.plateMasked, 車牌加總: input.sum, 今日幸運數字: input.lucky, 差距: diff, 光色: input.palette })), 12000)
    const p = JSON.parse(res.response.text())
    setStatus({ state: 'live', detail: settings.model })
    return { title: String(p.title || fallback.title).slice(0, 12), line: String(p.line || fallback.line).slice(0, 50), source: 'live' }
  } catch (e: any) {
    setStatus({ state: settings.forceDemo ? 'demo' : 'error', detail: String(e?.message || e) })
    return fallback
  }
}

export type OpsPlan = { title: string; detail: string; reason: string; expectedRides: number; source: Source }

export async function opsPlan(settings: Settings, input: { district: string; hour: number; demandIdx: number; leadMin: number; medianLead: number; playersNearby: number }): Promise<OpsPlan> {
  try {
    const { Schema } = await import('firebase/ai')
    const schema = Schema.object({ properties: { title: Schema.string(), detail: Schema.string(), reason: Schema.string(), expectedRides: Schema.integer() } })
    const model = await getModel(settings, {
      json: schema,
      system: `你是 yoxi 的營運 AI。依需求預測與等車時間，設計一個「空車時段任務」把乘客導到低谷時段，並向營運人員說明理由。
title 30 字以內（任務名稱＋乘車金時段）；detail 50 字以內（推播對象與條件）；reason 100 字以內，引用輸入的數字說明為什麼是低谷、對乘客與司機的好處；
expectedRides 是預估新增的叫車數，用 附近玩家數 × 8% 估算後取整數。繁體中文。`,
      temperature: 0.6,
    })
    const res = await withTimeout(model.generateContent(JSON.stringify({ 行政區: input.district, 時段: `平日 ${input.hour}:00–${input.hour + 1}:00`, 需求指數_尖峰為100: input.demandIdx, 該時段叫車到上車分鐘: input.leadMin, 全天中位數分鐘: input.medianLead, 附近玩家數: input.playersNearby })))
    const p = JSON.parse(res.response.text())
    setStatus({ state: 'live', detail: settings.model })
    return { title: String(p.title || ''), detail: String(p.detail || ''), reason: String(p.reason || ''), expectedRides: Number(p.expectedRides) || Math.round(input.playersNearby * 0.08), source: 'live' }
  } catch (e: any) {
    setStatus({ state: settings.forceDemo ? 'demo' : 'error', detail: String(e?.message || e) })
    return { ...FALLBACK_OPS, expectedRides: Math.round(input.playersNearby * 0.08), source: 'demo' }
  }
}
