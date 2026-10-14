import { easeIn, easeOut, inBack, key, outBack, type Action, type Burst, type Frame } from './spriteActions'
import type { Pose } from './spriteModel'

/**
 * 影片第三版用的小精靈動作：卡通式誇張（預備動作、過衝、落地壓扁、光圈跟隨延遲、手臂次要擺動），
 * 以及可以對嘴的講話循環：talk_<表情>_<嘴型>，同一個表情的三種嘴型身體動作逐格相同，影片依音量每格換嘴型。
 * App 不使用這些動作。
 */

const TAU = Math.PI * 2
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}
const seg = (t: number, a: number, b: number) => smooth((t - a) / (b - a))
const blink = (t: number, at: number, d = 0.2) => {
  const x = (t - at) / d
  if (x < 0 || x > 1) return 0
  return x < 0.4 ? x / 0.4 : 1 - (x - 0.4) / 0.6
}
const still = (): Pick<Frame, 'flash' | 'trail' | 'bursts'> => ({ flash: 0, trail: [], bursts: [] })
/** 身體拉長時頭頂往上（壓扁支點在 -0.7、頭頂在 1.0）：光圈先跟著頭頂走，延遲再疊上去，起跳時才不會陷進頭裡 */
const overHead = (squash: number) => (squash < 1 ? 1.7 / squash - 1.7 : 0)

export type Expr = 'happy' | 'excited' | 'worried' | 'surprised'
export const EXPRS: Expr[] = ['happy', 'excited', 'worried', 'surprised']

/** 講話時的身體節奏：2 秒一循環（所有頻率都整除 2 秒），只跟時間與表情有關，跟嘴型無關 */
type Body = { y: number; x: number; squash: number; rotZ: number; rotY: number; armL: number; armR: number; ringX: number; ringY: number; ringSpin: number; lookX: number }
const ENERGY: Record<Expr, { bounce: number; sq: number; sway: number; arms: number; shiver: number }> = {
  happy: { bounce: 0.12, sq: 0.09, sway: 0.08, arms: 0.6, shiver: 0 },
  excited: { bounce: 0.2, sq: 0.13, sway: 0.11, arms: 1.0, shiver: 0 },
  worried: { bounce: 0.035, sq: 0.03, sway: 0.04, arms: 0.18, shiver: 0.018 },
  surprised: { bounce: 0.08, sq: 0.07, sway: 0.05, arms: 0.35, shiver: 0.012 },
}

function talkBody(e: Expr, t: number): Body {
  const k = ENERGY[e]
  const yAt = (u: number) => {
    const ph = TAU * 2 * u // 每秒彈兩下，跟講話的節奏一樣
    // 一大一小交替的彈跳，比較像真的在講話
    return k.bounce * (1 - Math.cos(ph)) * 0.5 * (1 + 0.35 * Math.sin(TAU * 1 * u))
  }
  const ph = TAU * 2 * t
  const y = yAt(t)
  // 光圈跟隨延遲：看 0.08 秒前的身體位置
  const lag = yAt(t - 0.08) - y
  const sway = Math.sin(TAU * 0.5 * t)
  const rotZ = k.sway * sway + k.shiver * Math.sin(TAU * 6 * t)
  // 手勢：右手每秒比一次、左手錯開半拍，另外跟著身體彈跳有一點延遲擺動
  const gestR = 0.5 + 0.5 * Math.sin(TAU * 1 * t - 0.6)
  const gestL = 0.5 + 0.5 * Math.sin(TAU * 1 * t + 2.4)
  const follow = 0.16 * Math.sin(ph - 1.1)
  let armR = 0.38 + k.arms * 1.6 * gestR * gestR + follow
  let armL = -0.38 - k.arms * 1.1 * gestL * gestL - follow
  if (e === 'worried') {
    // 擔心：兩手往內縮在身體前面，小小地搓
    armR = -0.1 + 0.06 * Math.sin(TAU * 3 * t)
    armL = 0.1 - 0.06 * Math.sin(TAU * 3 * t + 1)
  }
  if (e === 'surprised') {
    // 驚訝：兩手張開舉高，微微發抖
    armR = 1.25 + 0.12 * Math.sin(TAU * 6 * t) + follow * 0.5
    armL = -1.25 - 0.12 * Math.sin(TAU * 6 * t + 1) - follow * 0.5
  }
  return {
    y,
    x: 0.06 * sway * (e === 'worried' ? 0.5 : 1),
    squash: 1 + k.sq * Math.cos(ph),
    rotZ,
    rotY: 0.16 * Math.sin(TAU * 0.5 * t + 1) * (e === 'worried' ? 0.5 : 1),
    armL,
    armR,
    ringX: -1.6 * rotZ * 0.6,
    ringY: 2.4 * lag + 0.03,
    ringSpin: (TAU / 8) * t,
    lookX: 0.12 * Math.sin(TAU * 0.5 * t + 2),
  }
}

/** 表情與嘴型（level 0 閉、1 半開、2 全開） */
function talkFace(e: Expr, level: 0 | 1 | 2, t: number): Partial<Pose> {
  switch (e) {
    case 'happy':
      return { happy: 1, blush: 1.2, mouth: level === 0 ? 'smile' : 'open', mouthOpen: [1, 0.8, 1.5][level], mouthW: [1.15, 1.2, 1.3][level] }
    case 'excited':
      return {
        wide: 1.15, shine: 1.5, blush: 1.35, core: 1.12, ringGlow: 1.3,
        mouth: level === 0 ? 'smile' : 'grin', mouthOpen: [1, 0.95, 1.6][level], mouthW: [1.45, 1.3, 1.38][level],
        lid: blink(t, 1.3),
      }
    case 'worried':
      return {
        brow: 1, browTilt: 0.42, lid: Math.max(0.32, blink(t, 1.15)), lookY: -0.3, blush: 0.55,
        mouth: level === 0 ? 'frown' : 'open', mouthOpen: [1, 0.5, 0.95][level], mouthW: [0.9, 0.72, 0.85][level],
      }
    case 'surprised':
      return {
        wide: 1.4, brow: 1, browY: 0.75, browTilt: -0.06, blush: 0.9,
        mouth: 'o', mouthOpen: [0.6, 1.1, 1.75][level],
        lid: blink(t, 1.5, 0.16),
      }
  }
}

function talkAction(e: Expr, level: 0 | 1 | 2): Action {
  return {
    dur: 2,
    loop: true,
    frame: (t) => {
      const b = talkBody(e, t)
      return { ...still(), pose: { ...b, ...talkFace(e, level, t) } }
    },
  }
}

/** 揮手的身體（wave 與 bye 共用） */
function waveBody(t: number): Partial<Pose> {
  const ph = TAU * 2 * t
  const y = 0.08 * (1 - Math.cos(ph)) * 0.5
  const yLag = 0.08 * (1 - Math.cos(TAU * 2 * (t - 0.08))) * 0.5
  const rotZ = -0.09 + 0.05 * Math.sin(TAU * 0.5 * t)
  return {
    y,
    squash: 1 + 0.07 * Math.cos(ph),
    rotZ,
    rotY: 0.18 * Math.sin(TAU * 0.5 * t + 1),
    armR: 2.3 + 0.55 * Math.sin(TAU * 2.5 * t),
    armL: -0.45 - 0.14 * Math.sin(ph - 1.1),
    happy: 1,
    mouth: 'open',
    mouthOpen: 0.95 + 0.25 * Math.abs(Math.sin(TAU * 2 * t)),
    blush: 1.25,
    ringX: 0.6 * -rotZ,
    ringY: 2.4 * (yLag - y) + 0.03,
    ringSpin: (TAU / 8) * t,
  }
}

const sparkle = (t0: number, n: number, x: number, y: number, speed: number, up: number, life: number, seed: number, gravity = -1.6, size = 0.11): Burst => ({
  t0, n, x, y, speed, up, spread: TAU, life, size, seed, gravity,
})

export const ACTIONS_V3: Record<string, Action> = {
  /** 從下方探頭 → 蹲 → 彈起過衝 → 落地壓扁 → 回彈 → 停住 */
  enter: {
    dur: 1.0,
    frame: (t) => {
      // 最高點接近圓形（速度最慢），起跳與落下時拉長、落地壓扁
      const squash = key(t, [[0, 1.0], [0.14, 1.34], [0.22, 0.7], [0.4, 0.97], [0.54, 0.8], [0.6, 1.32], [0.7, 0.88], [0.8, 1.07], [0.9, 0.98], [1, 1]])
      return {
        flash: 0,
        trail: [],
        bursts: [{ ...sparkle(0.56, 16, 0, -0.95, 1.5, 0.5, 0.38, 41, -1.2, 0.09), spread: Math.PI }],
        pose: {
          y: key(t, [[0, -2.05], [0.14, -2.22], [0.4, 0.46, easeOut], [0.56, 0, easeIn], [0.62, -0.07], [0.74, 0.14, easeOut], [0.86, 0, easeIn], [1, 0]]),
          squash,
          armL: key(t, [[0, -0.38], [0.14, -0.95], [0.3, -2.5, outBack], [0.5, -1.7], [0.6, -0.15], [0.72, -0.85], [0.88, -0.38]]),
          armR: key(t, [[0, 0.38], [0.14, 0.95], [0.3, 2.5, outBack], [0.5, 1.7], [0.6, 0.15], [0.72, 0.85], [0.88, 0.38]]),
          ringY: key(t, [[0, 0], [0.14, 0.14], [0.28, -0.3], [0.42, 0.1], [0.56, 0.04], [0.64, -0.3], [0.76, 0.12], [0.88, -0.05], [1, 0.02]]) + overHead(squash),
          ringSpin: (TAU * (1 - Math.exp(-3.5 * t))) / (1 - Math.exp(-3.5)),
          rotZ: key(t, [[0, 0], [0.3, 0.1], [0.5, -0.07], [0.7, 0.03], [1, 0]]),
          wide: key(t, [[0, 0.6], [0.4, 1.2], [0.75, 0.6], [1, 0]]),
          shine: key(t, [[0.3, 1], [0.45, 1.4], [0.9, 1]]),
          mouth: t > 0.2 && t < 0.7 ? 'open' : 'smile',
          mouthOpen: key(t, [[0.2, 0.6], [0.4, 1.35], [0.62, 0.9]]),
          core: 1 + 0.4 * seg(t, 0.2, 0.42) * (1 - seg(t, 0.6, 0.95)),
          blush: 1.2,
        },
      }
    },
  },

  /** 誇張起跳、空中轉一圈、雙手舉高，落地壓扁、再小跳一下 */
  cheer: {
    dur: 2,
    frame: (t) => {
      const shake = t > 0.36 && t < 1.55 ? 0.22 * Math.sin(TAU * 6 * t) : 0
      const squash = key(t, [[0, 1], [0.18, 1.34], [0.26, 0.76], [0.48, 0.97], [0.62, 1.0], [0.84, 0.84], [0.92, 1.34], [1.0, 0.88], [1.06, 0.96], [1.18, 0.84], [1.26, 1.2], [1.36, 0.95], [1.5, 1.03], [1.65, 1]])
      return {
        flash: 0,
        trail: [],
        bursts: [sparkle(0.48, 40, 0, 1.0, 1.6, 0.4, 1.1, 51, -2.4, 0.12), { ...sparkle(0.92, 22, 0, -0.9, 1.8, 0.5, 0.7, 52, -1.4, 0.1), spread: Math.PI }, sparkle(1.26, 12, 0, 0.6, 1.2, 0.9, 0.8, 53, -2.0, 0.09)],
        pose: {
          y: key(t, [[0, 0], [0.18, -0.15], [0.48, 0.56, easeOut], [0.62, 0.6], [0.86, 0, easeIn], [0.92, -0.08], [1.06, 0.24, easeOut], [1.2, 0, easeIn], [1.26, -0.04], [1.4, 0], [2, 0]]) + (t > 1.4 ? 0.05 * Math.sin(TAU * 1.5 * (t - 1.4)) : 0),
          squash,
          rotY: key(t, [[0.32, 0], [0.74, TAU]]),
          armL: key(t, [[0, -0.38], [0.18, -0.08], [0.36, -2.95, outBack], [0.9, -2.75], [1.0, -2.1], [1.1, -2.85], [1.55, -2.6], [1.9, -0.45]]) - shake,
          armR: key(t, [[0, 0.38], [0.18, 0.08], [0.36, 2.95, outBack], [0.9, 2.75], [1.0, 2.1], [1.1, 2.85], [1.55, 2.6], [1.9, 0.45]]) + shake,
          ringY: key(t, [[0, 0], [0.18, 0.16], [0.3, -0.26], [0.5, 0.06], [0.66, 0.02], [0.86, 0.06], [0.95, -0.34], [1.1, 0.16], [1.25, -0.13], [1.45, 0.05], [1.6, 0]]) + overHead(squash),
          ringSpin: t + 8 * seg(t, 0.3, 1.4),
          ringGlow: 1 + 0.9 * seg(t, 0.3, 0.5) * (1 - seg(t, 1.5, 1.9)),
          core: 1 + 0.5 * seg(t, 0.3, 0.5) * (1 - seg(t, 1.5, 1.9)),
          happy: t > 0.22 && t < 1.8 ? 1 : 0,
          mouth: t > 0.2 && t < 1.8 ? 'grin' : 'smile',
          mouthOpen: 1.5,
          mouthW: 1.2,
          blush: 1.35,
          shine: 1.4,
        },
      }
    },
  },

  /** 開心揮手（2 秒循環） */
  wave: { dur: 2, loop: true, frame: (t) => ({ ...still(), pose: waveBody(t) }) },

  /** 揮手後蹲一下、轉圈縮小消失，留下光點 */
  bye: {
    dur: 2,
    frame: (t) => {
      const base = waveBody(Math.min(t, 1.2))
      const crouch = key(t, [[1.12, 1], [1.28, 1.3], [1.4, 0.8], [1.55, 1]])
      return {
        flash: 0,
        trail: [],
        bursts: [sparkle(1.7, 46, 0, 0.35, 1.6, 0.7, 0.85, 61, -0.5, 0.1)],
        hidden: t > 1.78,
        pose: {
          ...base,
          armR: t < 1.2 ? (base.armR as number) : key(t, [[1.2, 2.3], [1.4, 2.6], [1.7, 1.2]]),
          squash: t < 1.12 ? (base.squash as number) : crouch,
          y: t < 1.2 ? (base.y as number) : key(t, [[1.2, 0], [1.3, -0.08], [1.76, 0.32, easeOut]]),
          rotY: key(t, [[1.32, 0], [1.76, TAU * 1.5, easeIn]]),
          scale: key(t, [[1.38, 1], [1.77, 0, inBack]]),
          ringScale: key(t, [[1.4, 1], [1.72, 0]]),
          ringY: (t < 1.2 ? (base.ringY as number) : key(t, [[1.2, 0.03], [1.3, 0.12], [1.7, 0.2]])) + (t < 1.12 ? 0 : overHead(crouch)),
          happy: 1,
        },
      }
    },
  },
}

for (const e of EXPRS) for (const lv of [0, 1, 2] as const) ACTIONS_V3[`talk_${e}_${lv}`] = talkAction(e, lv)
