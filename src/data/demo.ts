import type { Task } from '../lib/types'
import { laterHomeTask, type Home } from '../lib/homeTask'

type Box = { south: number; north: number; west: number; east: number }

export type DemoPersona = {
  id: string
  name: string
  age: number
  role: string
  home: { poiId: string; label: string }
  work: { poiId: string; label: string }
  /** 回家卡上的「回 X」與從市府回家的路線 */
  homeCard: Home
  /** 小精靈示範對話裡說的家的地名 */
  homePlace: string
  /** 從家去上班的路線（任務要去公司時用） */
  workRoute: string
  /** 這個人去某些地點時走的路線（例如從家出發的週末行程）；沒列的地點從市府出發 */
  routes: Record<string, string>
  /** 「點亮 X%」的分母：這個人的生活圈 */
  region: Box
  habits: string[]
  history30d: { day: number; route: string }[]
  walkedPois: string[]
}

/**
 * 示範玩家（虛構人物）。小涵是影片與 demo 的主角，行為型態參考 yoxi 資料中常客的共同特徵：
 * 上下車集中在 2 個地點、行程集中在同一個 3 小時區段。阿哲、小雅是虛構的對照，用來說明每個人亮起來的地方不一樣；
 * 不是從競賽資料挑出的真實乘客。三人都在市府附近上班。
 */
export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'xiao-han',
    name: '小涵',
    age: 27,
    role: '信義區上班族',
    home: { poiId: 'home-xiao-han', label: '家（松山區民生社區）' },
    work: { poiId: 'work', label: '公司（信義區市府附近）' },
    homeCard: { word: '家', route: 'evening-home' },
    homePlace: '民生社區',
    workRoute: 'morning-work',
    routes: {},
    region: { south: 25.024, north: 25.066, west: 121.543, east: 121.588 },
    habits: [
      '平日 18:00–20:00 下班常叫 yoxi 回家（近 30 天 9 次，平常走敦化北路）',
      '下雨的早上會叫車上班（近 30 天 4 次）',
      '週末下午常去松菸、大巨蛋一帶（近 30 天 2 次）',
      '週末偶爾去饒河街夜市、象山，出差從松山機場出發',
    ],
    history30d: [
      { day: 2, route: 'commute-dunhua' },
      { day: 3, route: 'commute-dunhua' },
      { day: 5, route: 'commute-dunhua' },
      { day: 8, route: 'weekend-raohe' },
      { day: 10, route: 'commute-dunhua' },
      { day: 11, route: 'commute-dunhua' },
      { day: 15, route: 'commute-dunhua' },
      { day: 16, route: 'commute-dunhua' },
      { day: 19, route: 'commute-dunhua' },
      { day: 22, route: 'airport' },
      { day: 23, route: 'commute-dunhua' },
      { day: 24, route: 'commute-dunhua' },
      { day: 26, route: 'commute-dunhua' },
      { day: 29, route: 'commute-dunhua' },
      { day: 30, route: 'commute-dunhua' },
      { day: 6, route: 'weekend-raohe' },
      { day: 13, route: 'weekend-xiangshan' },
      { day: 20, route: 'airport' },
    ],
    walkedPois: ['sunyatsen', 'fujin'],
  },
  {
    id: 'a-zhe',
    name: '阿哲',
    age: 34,
    role: '板橋通勤族',
    home: { poiId: 'home-a-zhe', label: '家（板橋新埔）' },
    work: { poiId: 'work', label: '公司（信義區市府附近）' },
    homeCard: { word: '板橋', route: 'banciao-home' },
    homePlace: '板橋新埔',
    workRoute: 'banciao-commute',
    routes: { 'spot-banciao': 'banciao-weekend' },
    region: { south: 25.003, north: 25.052, west: 121.448, east: 121.575 },
    habits: [
      '平日早上從板橋新埔搭 yoxi 到市府上班（近 30 天 10 次）',
      '下班常在 18 點尖峰叫車回板橋，等得比較久（近 30 天 6 次）',
      '週末在板橋府中一帶活動',
      '午休會在公司附近走走',
    ],
    history30d: [
      { day: 1, route: 'banciao-commute' },
      { day: 2, route: 'banciao-commute' },
      { day: 2, route: 'banciao-home' },
      { day: 6, route: 'banciao-weekend' },
      { day: 8, route: 'banciao-commute' },
      { day: 9, route: 'banciao-commute' },
      { day: 9, route: 'banciao-home' },
      { day: 15, route: 'banciao-commute' },
      { day: 16, route: 'banciao-home' },
      { day: 20, route: 'banciao-weekend' },
      { day: 22, route: 'banciao-commute' },
      { day: 23, route: 'banciao-commute' },
      { day: 23, route: 'banciao-home' },
      { day: 27, route: 'banciao-commute' },
      { day: 28, route: 'banciao-home' },
      { day: 29, route: 'banciao-commute' },
      { day: 30, route: 'banciao-home' },
    ],
    walkedPois: ['banciao', 'sunyatsen'],
  },
  {
    id: 'xiao-ya',
    name: '小雅',
    age: 29,
    role: '淡水週末旅遊者',
    home: { poiId: 'home-xiao-ya', label: '家（淡水老街）' },
    work: { poiId: 'spot-cityhall', label: '工作（市府附近）' },
    homeCard: { word: '淡水', route: 'tamsui-home' },
    homePlace: '淡水',
    workRoute: 'tamsui-commute',
    routes: { 'spot-tamsui': 'tamsui-weekend' },
    region: { south: 25.03, north: 25.19, west: 121.41, east: 121.575 },
    habits: [
      '平日從淡水通勤到市府附近上班，下雨天會搭 yoxi（近 30 天 5 次）',
      '下班常搭 yoxi 回淡水，路程長，最怕尖峰叫不到車',
      '週末喜歡沿河岸去漁人碼頭看夕陽',
      '午休喜歡走去松菸看展',
    ],
    history30d: [
      { day: 3, route: 'tamsui-commute' },
      { day: 4, route: 'tamsui-weekend' },
      { day: 8, route: 'tamsui-home' },
      { day: 11, route: 'tamsui-weekend' },
      { day: 15, route: 'afternoon-songyan' },
      { day: 17, route: 'tamsui-commute' },
      { day: 17, route: 'tamsui-home' },
      { day: 18, route: 'tamsui-weekend' },
      { day: 22, route: 'tamsui-home' },
      { day: 25, route: 'tamsui-weekend' },
      { day: 29, route: 'tamsui-commute' },
    ],
    walkedPois: ['tamsui', 'songyan'],
  },
]

export const PERSONA = DEMO_PERSONAS[0]

export function getDemoPersona(id?: string | null) {
  return DEMO_PERSONAS.find((persona) => persona.id === id) || PERSONA
}

export type Slot = 'morning' | 'lunch' | 'afternoon' | 'evening'

export const SLOT_LABEL: Record<Slot, string> = { morning: '早上', lunch: '午休', afternoon: '下午', evening: '傍晚' }

export function slotOf(d: Date): Slot {
  const h = d.getHours()
  if (h < 11) return 'morning'
  if (h < 14) return 'lunch'
  if (h < 17) return 'afternoon'
  return 'evening'
}

type SlotTasks = Record<Slot, { greeting: string; tasks: Task[] }>

/** Gemini 無法連線時使用的示範任務（畫面會標「示範資料」）。不發乘車金，rewardCredit 一律 0；poiId 'home' 是目前玩家的家。 */
export const FALLBACK_TASKS: SlotTasks = {
  morning: {
    greeting: '早安小涵！今天傍晚會下雨，我先幫你排好三個任務。',
    tasks: [
      { id: 'f-m1', title: '午休走去國父紀念館', detail: '走到國父紀念館打卡，點亮一格新的街區。', kind: 'walk', poiId: 'sunyatsen', window: '12:00–13:30', rewardCells: 1, rewardCredit: 0, reason: '從公司走過去約 10 分鐘，午休剛好' },
      { id: 'f-m2', title: '下午搭 yoxi 去松菸', detail: '14–16 點預約 yoxi 去松菸，沿途點亮街區。', kind: 'ride', poiId: 'spot-songyan', window: '14:00–16:00', rewardCells: 6, rewardCredit: 0, reason: '信義區平日 14–15 點空車多，好叫車' },
      { id: 'f-m3', title: '下雨前預約回家', detail: '18 點前預約 yoxi 回民生社區，一路點亮回家的路。', kind: 'ride', poiId: 'home', window: '17:30–18:30', rewardCells: 12, rewardCredit: 0, reason: '傍晚可能下雨，18 點又是下班尖峰' },
    ],
  },
  lunch: {
    greeting: '午休時間！走一小段路就能點亮新的一格。',
    tasks: [
      { id: 'f-l1', title: '散步到四四南村', detail: '午休走到四四南村，點亮 101 旁的老眷村。', kind: 'walk', poiId: 'sisinan', window: '12:00–13:30', rewardCells: 1, rewardCredit: 0, reason: '從公司走過去約 15 分鐘，午休剛好' },
      { id: 'f-l2', title: '下午搭 yoxi 去松菸', detail: '14–16 點預約 yoxi 去松菸，沿途點亮街區。', kind: 'ride', poiId: 'spot-songyan', window: '14:00–16:00', rewardCells: 6, rewardCredit: 0, reason: '信義區平日 14–15 點空車多，好叫車' },
      { id: 'f-l3', title: '找到一台 yoxi 車', detail: '在人行道上遇見停妥的 yoxi 車，拍一下收集小精靈。', kind: 'scan', poiId: 'spot-cityhall', window: '全天', rewardCells: 1, rewardCredit: 0, reason: '市府路上車點是信義區熱門的 yoxi 上車點' },
    ],
  },
  afternoon: {
    greeting: '下午好！現在附近空車多，是出門的好時機。',
    tasks: [
      { id: 'f-a1', title: '現在搭 yoxi 去松菸', detail: '16 點前出發，沿途點亮 6 格。', kind: 'ride', poiId: 'spot-songyan', window: '14:00–16:00', rewardCells: 6, rewardCredit: 0, reason: '現在是信義區空車多的時段' },
      { id: 'f-a2', title: '拍一台 yoxi 車', detail: '車牌加總最接近今日幸運數字的人獲勝。', kind: 'scan', poiId: 'spot-cityhall', window: '全天', rewardCells: 1, rewardCredit: 0, reason: '市府路上車點是信義區熱門的 yoxi 上車點' },
      { id: 'f-a3', title: '下雨前預約回家', detail: '18 點前預約 yoxi，一路點亮回家的路。', kind: 'ride', poiId: 'home', window: '17:30–18:30', rewardCells: 12, rewardCredit: 0, reason: '傍晚可能下雨，提早預約不用在路邊等' },
    ],
  },
  evening: {
    greeting: '六點開始下雨了，先幫你預約回家吧！',
    tasks: [
      { id: 'f-e2', title: '晚點走前先吃晚餐', detail: '到捷運市政府站一帶吃晚餐，順便點亮一格。', kind: 'walk', poiId: 'mrt-cityhall', window: '18:00–19:00', rewardCells: 1, rewardCredit: 0, reason: '18 點是尖峰，先吃飯再走剛好' },
      { id: 'f-e1', title: '預約 yoxi 回家', detail: '18:10 從市府路上車點出發，沿途點亮 12 格。', kind: 'ride', poiId: 'home', window: '18:00–18:30', rewardCells: 12, rewardCredit: 0, reason: '下雨又遇上下班尖峰，預約比較穩' },
      { id: 'f-e3', title: '週末去饒河街夜市', detail: '週六 20 點後搭 yoxi 去饒河街，點亮松山東側。', kind: 'ride', poiId: 'raohe', window: '週六 20:00–21:00', rewardCells: 8, rewardCredit: 0, reason: '松山區晚上 8 點後需求回落，等車短' },
    ],
  },
}

const walk = (id: string, title: string, detail: string, poiId: string, window: string, reason: string): Task => ({ id, title, detail, kind: 'walk', poiId, window, rewardCells: 1, rewardCredit: 0, reason })
const scan = (id: string): Task => ({ id, title: '找到一台 yoxi 車', detail: '在市府路上車點附近，拍一台停妥的 yoxi 車。', kind: 'scan', poiId: 'spot-cityhall', window: '全天', rewardCells: 1, rewardCredit: 0, reason: '市府路上車點是信義區熱門的 yoxi 上車點' })
const dinner = (id: string) => walk(id, '晚點走前先吃晚餐', '到捷運市政府站一帶吃晚餐，順便點亮一格。', 'mrt-cityhall', '18:00–19:00', '18 點是尖峰，先吃飯再走剛好')

/** 阿哲、小雅的示範任務：不搭車的排前面，最後一張是早上就排好的「晚點走」回家卡。 */
const OTHER_TASKS: Record<string, SlotTasks> = {
  'a-zhe': {
    morning: { greeting: '早安阿哲！今晚市府 18 點難叫，回板橋的車我先排在 19:00。', tasks: [walk('z-m1', '午休走去國父紀念館', '從公司走到國父紀念館，點亮一格新的街區。', 'sunyatsen', '12:00–13:30', '從公司走過去約 10 分鐘，午休剛好'), scan('z-m2')] },
    lunch: { greeting: '午休時間！走一小段路就能點亮新的一格。', tasks: [walk('z-l1', '散步到四四南村', '午休走到四四南村，點亮 101 旁的老眷村。', 'sisinan', '12:00–13:30', '從公司走過去約 15 分鐘，午休剛好'), scan('z-l2')] },
    afternoon: {
      greeting: '下午好！回板橋的車排在 19:00，避開尖峰。',
      tasks: [scan('z-a1'), { id: 'z-a2', title: '週末去板橋府中逛逛', detail: '週六從家搭 yoxi 到府中，點亮板橋的街區。', kind: 'ride', poiId: 'spot-banciao', window: '週六 14:00–17:00', rewardCells: 6, rewardCredit: 0, reason: '週末下午板橋一帶不是尖峰，好叫車' }],
    },
    evening: { greeting: '現在正是尖峰，先吃個飯，19:00 再走會快很多。', tasks: [dinner('z-e1'), scan('z-e2')] },
  },
  'xiao-ya': {
    morning: { greeting: '早安小雅！今晚市府 18 點難叫，回淡水的車我先排在 19:00。', tasks: [walk('y-m1', '午休走去松菸看展', '從公司走到松山文創園區，點亮一格新的街區。', 'songyan', '12:00–13:30', '從公司走過去約 12 分鐘，午休剛好'), scan('y-m2')] },
    lunch: { greeting: '午休時間！走一小段路就能點亮新的一格。', tasks: [walk('y-l1', '散步到國父紀念館', '午休走到國父紀念館，點亮一格新的街區。', 'sunyatsen', '12:00–13:30', '從公司走過去約 10 分鐘，午休剛好'), scan('y-l2')] },
    afternoon: {
      greeting: '下午好！回淡水的車排在 19:00，避開尖峰。',
      tasks: [scan('y-a1'), { id: 'y-a2', title: '週六沿河岸去漁人碼頭', detail: '週六傍晚從老街搭 yoxi 去漁人碼頭看夕陽，點亮河岸。', kind: 'ride', poiId: 'spot-tamsui', window: '週六 16:00–18:00', rewardCells: 8, rewardCredit: 0, reason: '週末傍晚淡水不是叫車尖峰' }],
    },
    evening: { greeting: '現在正是尖峰，先吃個飯，19:00 再回淡水會快很多。', tasks: [dinner('y-e1'), scan('y-e2')] },
  },
}

/** 依目前 demo 玩家給示範任務；阿哲、小雅另外帶一張「晚點走」回家卡（pinned），rain = 傍晚會下雨（等車預測用下雨情境）。 */
export function getFallbackTasks(slot: Slot, personaId?: string | null, now = new Date(), rain = false) {
  const persona = getDemoPersona(personaId)
  const other = OTHER_TASKS[persona.id]
  if (!other) {
    const f = FALLBACK_TASKS[slot]
    return { greeting: f.greeting, tasks: f.tasks.map((t) => ({ ...t })) }
  }
  const f = other[slot]
  return { greeting: f.greeting, tasks: [...f.tasks.map((t) => ({ ...t })), laterHomeTask(persona.homeCard, now, undefined, rain)] }
}

export const FALLBACK_CHAT: { match: RegExp; reply: string }[] = [
  { match: /雨|天氣|傘/, reply: '今晚 6 點降雨機率 80%！要我幫你在 18:10 預約 yoxi 嗎？沿途能點亮 12 格喔。' },
  { match: /預約|叫車|回家/, reply: '好的，幫你預約 18:10 從市府路上車點出發回{home}，司機到了我會提醒你！' },
  { match: /幸運|數字|車牌/, reply: '今天的幸運數字已經放在好友頁了，路上遇到 yoxi 車記得拍一下，看誰最接近！' },
  { match: /午|吃|散步|走/, reply: '午休可以走去國父紀念館，來回 15 分鐘，順便點亮一格新的街區。' },
  { match: /你是誰|名字|小精靈/, reply: '我是住在 yoxi 車燈裡的小精靈！你搭的每一趟、完成的每個任務，都會讓城市亮起來。' },
]

/** 示範對話：照關鍵字回一句，{home} 換成目前玩家的家 */
export function fallbackChatReply(message: string, personaId?: string | null) {
  const hit = FALLBACK_CHAT.find((f) => f.match.test(message))
  return (hit ? hit.reply : FALLBACK_CHAT_DEFAULT).replace('{home}', getDemoPersona(personaId).homePlace)
}

export const FALLBACK_CHAT_DEFAULT = '我在！今天有三個任務等你，完成一個就能點亮一格。想先做哪一個？'

export const FALLBACK_SPRITE_LINES = [
  (sum: number, lucky: number) => (sum === lucky ? `剛好 ${sum}！今天的幸運之光就是你！` : `車牌加總 ${sum}，離 ${lucky} 只差 ${Math.abs(sum - lucky)}，好險！`),
]

export const FALLBACK_OPS = {
  title: '下午搭 yoxi 去松菸，14–16 點錯峰點燈',
  detail: '對近 30 天常在信義區活動的玩家推播；預約就算錯峰，路線亮兩階、累積錯峰之光。',
  reason: '信義區平日 14–15 點需求指數不到尖峰 7 成，叫車到上車也比全天中位數短，代表附近空車多；把任務排在這個時段，乘客不用久等，司機也接到原本沒有的單，不必發乘車金。',
  expectedRides: 40,
}
