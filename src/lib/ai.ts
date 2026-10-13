import { getFirebase } from './firebase'
import { readJSON, writeJSON, type Settings } from './settings'
import { parseIntent } from './intent'
import { TOOL_LABEL, describeTool, runTool, type Proposal, type ToolCtx, type ToolName } from './tools'
import type { Source, Task, Weather } from './types'
import { POIS, poiById } from './geo'
import { FALLBACK_CHAT, FALLBACK_CHAT_DEFAULT, FALLBACK_OPS, FALLBACK_TASKS, PERSONA, SLOT_LABEL, type Slot } from '../data/demo'

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

// 成本與延遲：記錄最近 20 次 Gemini 回應時間、任務快取命中次數，給營運頁的「模型與系統」卡
const latencies: number[] = []
let cacheHits = 0
function recordLatency(t0: number) {
  latencies.push(performance.now() - t0)
  if (latencies.length > 20) latencies.shift()
}
export function aiStats() {
  const avgMs = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null
  return { calls: latencies.length, avgMs, cacheHits }
}

export type AiContext = {
  now: Date
  slot: Slot
  weather: Weather
  lucky: number
  litPct: number
  lowWindows: { district: string; hours: number[] }[]
  tasks?: Task[]
  friendsTop?: string
}

const TIMEOUT_MS = 20000

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
}

async function getModel(settings: Settings, opts: { json?: any; system?: string; temperature?: number; maxOutputTokens?: number }) {
  if (settings.forceDemo) throw new Error('demo mode')
  const fb = await getFirebase(settings)
  if (!fb) throw new Error('Firebase 尚未設定')
  const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai')
  const ai = getAI(fb.app, { backend: new GoogleAIBackend() })
  const generationConfig: any = { temperature: opts.temperature ?? 0.8 }
  if (opts.maxOutputTokens) generationConfig.maxOutputTokens = opts.maxOutputTokens
  if (opts.json) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseSchema = opts.json
  }
  return getGenerativeModel(ai, { model: settings.model, systemInstruction: opts.system, generationConfig })
}

function contextBlock(ctx: AiContext) {
  const hhmm = `${String(ctx.now.getHours()).padStart(2, '0')}:${String(ctx.now.getMinutes()).padStart(2, '0')}`
  const weekday = '日一二三四五六'[ctx.now.getDay()]
  return JSON.stringify(
    {
      現在: `${ctx.now.getMonth() + 1}/${ctx.now.getDate()}（週${weekday}）${hhmm}，${SLOT_LABEL[ctx.slot]}`,
      玩家: { 名字: PERSONA.name, 身分: PERSONA.role, 常用地點: [PERSONA.home.label, PERSONA.work.label], 習慣: PERSONA.habits },
      天氣: { 來源: ctx.weather.source === 'cwa' ? '中央氣象署' : '示範情境', 概況: ctx.weather.desc, 傍晚降雨機率: ctx.weather.eveningPop },
      需求低谷時段: ctx.lowWindows.map((w) => ({ 行政區: w.district, 平日小時: w.hours })),
      今日幸運數字: ctx.lucky,
      點亮進度: `${ctx.litPct}%`,
      可用地點: POIS.filter((p) => p.kind !== 'home' && p.kind !== 'work').map((p) => ({ poiId: p.id, 名稱: p.name })).concat([{ poiId: 'home', 名稱: PERSONA.home.label }]),
    },
    null,
    0,
  )
}

const TASK_SYSTEM = `你是 yoxi 點燈城的任務設計師，也是住在 yoxi 車燈裡的「車燈小精靈」。
城市一開始是夜色，玩家搭 yoxi 會點亮整條路線，完成任務會點亮街區（H3 六角格）。
請依情境為玩家設計今天的 3 個情境任務，規則：
1. 至少 1 個任務不用搭車：kind = walk 是在公司或住家附近步行就能完成；kind = scan 是在路上拍一台停妥的 yoxi 車（poiId 用 yoxi 上車點）。
2. 傍晚降雨機率 60% 以上時，一定要有「下雨前預約 yoxi 回家」的任務（kind = ride，poiId = home）。
3. 其他搭車任務排在「需求低谷時段」，rewardCredit 是只能在該時段折抵的乘車金（20–50 元），不在低谷的任務 rewardCredit = 0。
4. poiId 只能從「可用地點」選。window 用「HH:MM–HH:MM」。
5. 標題 14 字以內，detail 40 字以內，語氣溫暖、具體。reason 是寫給玩家看的一句話，說明為什麼現在適合做這個任務，20 字以內，要提到資料依據（空車低谷、天氣或常去地點）。
6. greeting 是小精靈對玩家說的一句話，30 字以內。
全部使用繁體中文。`

const TASK_CACHE_KEY = 'yoxi-lighting-city:task-cache:v1'
type TaskCache = Record<string, { greeting: string; tasks: Task[] }>

export async function generateTasks(settings: Settings, ctx: AiContext, opts: { force?: boolean } = {}): Promise<{ greeting: string; tasks: Task[]; source: Source; cached?: boolean }> {
  const fallback = () => {
    const f = FALLBACK_TASKS[ctx.slot]
    return { greeting: f.greeting, tasks: f.tasks.map((t) => ({ ...t })), source: 'demo' as Source }
  }
  const cacheKey = `${ctx.now.toDateString()}|${ctx.slot}|${ctx.weather.eveningPop >= 60 ? 'rain' : 'dry'}`
  const cache = readJSON<TaskCache>(TASK_CACHE_KEY, {})
  if (!opts.force && !settings.forceDemo && cache[cacheKey]) {
    cacheHits++
    return { ...cache[cacheKey], tasks: cache[cacheKey].tasks.map((t) => ({ ...t })), source: 'live', cached: true }
  }
  const t0 = performance.now()
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
              kind: Schema.enumString({ enum: ['walk', 'scan', 'ride'] }),
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
      kind: ['walk', 'scan', 'ride'].includes(t.kind) ? t.kind : 'walk',
      poiId: poiById(t.poiId) ? t.poiId : 'sunyatsen',
      window: String(t.window || ''),
      rewardCells: Math.max(1, Math.min(20, Number(t.rewardCells) || 1)),
      rewardCredit: Math.max(0, Math.min(80, Number(t.rewardCredit) || 0)),
      reason: String(t.reason || '').slice(0, 30),
    }))
    if (!tasks.length) throw new Error('empty')
    recordLatency(t0)
    setStatus({ state: 'live', detail: settings.model })
    const greeting = String(parsed.greeting || '')
    const today = ctx.now.toDateString()
    writeJSON(TASK_CACHE_KEY, { ...Object.fromEntries(Object.entries(cache).filter(([k]) => k.startsWith(today))), [cacheKey]: { greeting, tasks } })
    return { greeting, tasks, source: 'live' }
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

const TOOL_RULES = `你有三個工具：get_forecast 查某地點某時段好不好叫（LightGBM 預測）、get_progress 查任務與點燈進度、propose_offpeak 提出錯峰方案。
問到好不好叫、等多久，一定先用 get_forecast，回答要講中位數、八成區間，並提比較好叫的時段；想避開尖峰就用 propose_offpeak，
它只會產生提案，回覆時請玩家按下方的確認卡，不要說已經預約好。數字只能用工具回傳的，不要自己編。`

/** 最多保留最近 8 句對話，控制每次呼叫的 token */
const trimHistory = (h: ChatTurn[]) => h.slice(-8)

export type ChatResult = { text: string; source: Source; tools: string[]; proposal?: Proposal }

export async function chatWithTools(settings: Settings, ctx: AiContext, toolCtx: ToolCtx, history: ChatTurn[], message: string): Promise<ChatResult> {
  const t0 = performance.now()
  const used: string[] = []
  let proposal: Proposal | undefined
  try {
    const { Schema } = await import('firebase/ai')
    const model = await getModel(settings, { system: `${CHAT_SYSTEM}\n${TOOL_RULES}\n情境資料：${contextBlock(ctx)}`, temperature: 0.7, maxOutputTokens: 300 })
    const functionDeclarations = [
      {
        name: 'get_forecast',
        description: '查某個地點、今天或明天某個小時叫車好不好叫：回傳叫車到上車的中位數、八成區間、等超過 10 分鐘的機率，以及前後兩小時內比較好叫的時段。',
        parameters: Schema.object({
          properties: {
            place: Schema.enumString({ enum: ['公司', '家', '台北101', '松菸', '松山機場', '信義區', '松山區', '大安區', '中山區'] }),
            day: Schema.enumString({ enum: ['today', 'tomorrow'] }),
            hour: Schema.integer(),
          },
          optionalProperties: ['place', 'day', 'hour'],
        }),
      },
      { name: 'get_progress', description: '查玩家今天還沒完成的任務、地圖點亮比例、本月的錯峰之光與和泰 Points。' },
      {
        name: 'propose_offpeak',
        description: '提出錯峰方案（later = 晚點走、reserve = 提早預約），回傳提案讓玩家確認；不會直接預約。',
        parameters: Schema.object({ properties: { mode: Schema.enumString({ enum: ['later', 'reserve'] }), hour: Schema.integer() }, optionalProperties: ['mode', 'hour'] }),
      },
    ]
    const chat = model.startChat({ history: trimHistory(history).map((h) => ({ role: h.role, parts: [{ type: 'text' as const, text: h.text }] })), tools: [{ functionDeclarations }] })
    let res = await withTimeout(chat.sendMessage(message))
    for (let round = 0; round < 3; round++) {
      const calls = res.response.functionCalls()
      if (!calls?.length) break
      const parts = calls.map((c) => {
        const r = runTool(c.name, c.args, toolCtx)
        if (TOOL_LABEL[c.name as ToolName]) used.push(TOOL_LABEL[c.name as ToolName])
        if (r.proposal) proposal = r.proposal
        return { type: 'functionResponse' as const, functionResponse: { id: c.id, name: c.name, response: r.response } }
      })
      res = await withTimeout(chat.sendMessage(parts))
    }
    const text = res.response.text()
    if (!text) throw new Error('empty')
    recordLatency(t0)
    setStatus({ state: 'live', detail: settings.model })
    return { text, source: 'live', tools: used, proposal }
  } catch (e: any) {
    setStatus({ state: settings.forceDemo ? 'demo' : 'error', detail: String(e?.message || e) })
    // 離線備援：關鍵字判斷意圖，照樣用同一組工具
    const intent = parseIntent(message)
    if (intent) {
      const r = runTool(intent.name, intent.args, toolCtx)
      return { text: describeTool(intent.name, r), source: 'demo', tools: [TOOL_LABEL[intent.name]], proposal: r.proposal }
    }
    const hit = FALLBACK_CHAT.find((f) => f.match.test(message))
    return { text: hit ? hit.reply : FALLBACK_CHAT_DEFAULT, source: 'demo', tools: [] }
  }
}

export async function spriteLine(settings: Settings, input: { plateMasked: string; sum: number; lucky: number; palette: string }): Promise<{ title: string; line: string; source: Source }> {
  const diff = Math.abs(input.sum - input.lucky)
  const fallback = {
    title: `${input.palette}的小精靈`,
    line: diff === 0 ? `剛好 ${input.sum}！今天的幸運之光就是你！` : `車牌加總 ${input.sum}，離今天的 ${input.lucky} 只差 ${diff}！`,
    source: 'demo' as Source,
  }
  const t0 = performance.now()
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
    recordLatency(t0)
    setStatus({ state: 'live', detail: settings.model })
    return { title: String(p.title || fallback.title).slice(0, 12), line: String(p.line || fallback.line).slice(0, 50), source: 'live' }
  } catch (e: any) {
    setStatus({ state: settings.forceDemo ? 'demo' : 'error', detail: String(e?.message || e) })
    return fallback
  }
}

export type OpsPlan = { title: string; detail: string; reason: string; expectedRides: number; source: Source }

export async function opsPlan(settings: Settings, input: { district: string; hour: number; demandIdx: number; leadMin: number; medianLead: number; playersNearby: number }): Promise<OpsPlan> {
  const t0 = performance.now()
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
    recordLatency(t0)
    setStatus({ state: 'live', detail: settings.model })
    return { title: String(p.title || ''), detail: String(p.detail || ''), reason: String(p.reason || ''), expectedRides: Number(p.expectedRides) || Math.round(input.playersNearby * 0.08), source: 'live' }
  } catch (e: any) {
    setStatus({ state: settings.forceDemo ? 'demo' : 'error', detail: String(e?.message || e) })
    return { ...FALLBACK_OPS, expectedRides: Math.round(input.playersNearby * 0.08), source: 'demo' }
  }
}
