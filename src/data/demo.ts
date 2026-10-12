import type { Task } from '../lib/types'

/** 示範玩家（虛構人物）。行為型態參考 yoxi 資料中常客的共同特徵：上下車集中在 2 個地點、行程集中在同一個 3 小時區段。 */
export const PERSONA = {
  name: '小涵',
  age: 27,
  role: '信義區上班族',
  home: { poiId: 'home', label: '家（松山區民生社區）' },
  work: { poiId: 'work', label: '公司（信義區市府附近）' },
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

/** Gemini 無法連線時使用的示範任務（畫面會標「示範資料」）。 */
export const FALLBACK_TASKS: Record<Slot, { greeting: string; tasks: Task[] }> = {
  morning: {
    greeting: '早安小涵！今天傍晚會下雨，我先幫你排好三個任務。',
    tasks: [
      { id: 'f-m1', title: '午休走去國父紀念館', detail: '走到國父紀念館打卡，點亮一格新的街區。', kind: 'walk', poiId: 'sunyatsen', window: '12:00–13:30', rewardCells: 1, rewardCredit: 0, reason: '常客午休多在公司附近活動，步行任務不需搭車也能打開 App。' },
      { id: 'f-m2', title: '下午搭 yoxi 去松菸', detail: '14–16 點搭 yoxi 去松菸，沿途點亮街區，乘車金折 30 元。', kind: 'ride', poiId: 'spot-songyan', window: '14:00–16:00', rewardCells: 6, rewardCredit: 30, reason: '信義區平日 14–15 點是需求低谷，等車時間短，空車相對多。' },
      { id: 'f-m3', title: '下雨前預約回家', detail: '18 點前預約 yoxi 回民生社區，一路點亮回家的路。', kind: 'ride', poiId: 'home', window: '17:30–18:30', rewardCells: 12, rewardCredit: 0, reason: '傍晚降雨機率高，平日 18 點是叫車尖峰，提早預約避開等不到車。' },
    ],
  },
  lunch: {
    greeting: '午休時間！走一小段路就能點亮新的一格。',
    tasks: [
      { id: 'f-l1', title: '散步到四四南村', detail: '午休走到四四南村，點亮 101 旁的老眷村。', kind: 'walk', poiId: 'sisinan', window: '12:00–13:30', rewardCells: 1, rewardCredit: 0, reason: '步行任務讓不搭車的日子也有打開的理由。' },
      { id: 'f-l2', title: '下午搭 yoxi 去松菸', detail: '14–16 點搭 yoxi 去松菸，乘車金折 30 元。', kind: 'ride', poiId: 'spot-songyan', window: '14:00–16:00', rewardCells: 6, rewardCredit: 30, reason: '信義區平日 14–15 點需求低、等車短，導流到空車時段。' },
      { id: 'f-l3', title: '找到一台 yoxi 車', detail: '在人行道上遇見停妥的 yoxi 車，拍一下收集小精靈。', kind: 'walk', poiId: 'spot-cityhall', window: '全天', rewardCells: 1, rewardCredit: 0, reason: '市府路上車點是信義區最熱門的 yoxi 上車點之一。' },
    ],
  },
  afternoon: {
    greeting: '下午好！現在附近空車多，是出門的好時機。',
    tasks: [
      { id: 'f-a1', title: '現在搭 yoxi 去松菸', detail: '16 點前出發，乘車金折 30 元，沿途點亮 6 格。', kind: 'ride', poiId: 'spot-songyan', window: '14:00–16:00', rewardCells: 6, rewardCredit: 30, reason: '信義區平日 14–15 點是需求低谷，空車相對多。' },
      { id: 'f-a2', title: '拍一台 yoxi 車', detail: '車牌加總最接近今日幸運數字的人獲勝。', kind: 'walk', poiId: 'spot-cityhall', window: '全天', rewardCells: 1, rewardCredit: 0, reason: '遇見 yoxi 車是不用搭車也能玩的彩蛋。' },
      { id: 'f-a3', title: '下雨前預約回家', detail: '18 點前預約 yoxi，一路點亮回家的路。', kind: 'ride', poiId: 'home', window: '17:30–18:30', rewardCells: 12, rewardCredit: 0, reason: '傍晚降雨機率高，提早預約避開尖峰。' },
    ],
  },
  evening: {
    greeting: '六點開始下雨了，先幫你預約回家吧！',
    tasks: [
      { id: 'f-e1', title: '預約 yoxi 回家', detail: '18:10 從市府路上車點出發，沿途點亮 12 格。', kind: 'ride', poiId: 'home', window: '18:00–18:30', rewardCells: 12, rewardCredit: 0, reason: '下雨加上下班尖峰，提早預約能縮短等車時間。' },
      { id: 'f-e2', title: '揪同事一起回民生社區', detail: '同方向的同事一起搭，車資平分，好友地圖一起點亮。', kind: 'group', poiId: 'home', window: '18:00–19:00', rewardCells: 4, rewardCredit: 0, reason: '揪團把兩趟需求併成一趟，尖峰時段更有效率。' },
      { id: 'f-e3', title: '週末去饒河街夜市', detail: '週六 20 點後搭 yoxi 去饒河街，點亮松山東側。', kind: 'ride', poiId: 'raohe', window: '週六 20:00–21:00', rewardCells: 8, rewardCredit: 20, reason: '松山區平日與週末 20 點需求回落，等車短。' },
    ],
  },
}

export const FALLBACK_CHAT: { match: RegExp; reply: string }[] = [
  { match: /雨|天氣|傘/, reply: '今晚 6 點降雨機率 80%！要我幫你在 18:10 預約 yoxi 嗎？沿途能點亮 12 格喔。' },
  { match: /預約|叫車|回家/, reply: '好的，幫你預約 18:10 從市府路上車點出發回民生社區，司機到了我會提醒你！' },
  { match: /幸運|數字|車牌/, reply: '今天的幸運數字已經放在好友頁了，路上遇到 yoxi 車記得拍一下，看誰最接近！' },
  { match: /午|吃|散步|走/, reply: '午休可以走去國父紀念館，來回 15 分鐘，順便點亮一格新的街區。' },
  { match: /你是誰|名字|小精靈/, reply: '我是住在 yoxi 車燈裡的小精靈！你搭的每一趟、完成的每個任務，都會讓城市亮起來。' },
]

export const FALLBACK_CHAT_DEFAULT = '我在！今天有三個任務等你，完成一個就能點亮一格。想先做哪一個？'

export const FALLBACK_SPRITE_LINES = [
  (sum: number, lucky: number) => (sum === lucky ? `剛好 ${sum}！今天的幸運之光就是你！` : `車牌加總 ${sum}，離 ${lucky} 只差 ${Math.abs(sum - lucky)}，好險！`),
]

export const FALLBACK_OPS = {
  title: '下午搭 yoxi 去松菸，乘車金限 14–16 點',
  detail: '對近 30 天常在信義區活動的玩家推播，乘車金只能在低谷時段折抵。',
  reason: '信義區平日 14–15 點需求指數不到尖峰 7 成，叫車到上車也比全天中位數短，代表附近空車多；把任務排在這個時段，乘客拿到優惠，司機也接到原本沒有的單。',
  expectedRides: 40,
}
