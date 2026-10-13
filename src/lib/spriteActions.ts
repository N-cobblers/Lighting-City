import type { Pose } from './spriteModel'

/** 一陣光點：從 (x, y) 噴出 n 顆，有初速、向上的力、重力與壽命 */
export type Burst = { t0: number; n: number; x: number; y: number; speed: number; up: number; spread: number; dir?: number; life: number; size: number; seed: number; gravity?: number; drift?: number }
export type TrailPt = { x: number; y: number; a: number; s: number }
export type Frame = { pose: Partial<Pose>; flash: number; flashY?: number; trail: TrailPt[]; bursts: Burst[]; hidden?: boolean }
export type Action = { dur: number; loop?: boolean; frame: (t: number) => Frame }

const TAU = Math.PI * 2
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)
export const easeIn = (x: number) => Math.pow(clamp01(x), 3)
export const outBack = (x: number) => {
  x = clamp01(x)
  const s = 1.7
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2)
}
export const inBack = (x: number) => {
  x = clamp01(x)
  const s = 1.7
  return (s + 1) * x * x * x - s * x * x
}
type Key = [number, number, ((x: number) => number)?]
/** 關鍵格：各段之間預設用慢入慢出 */
export function key(t: number, keys: Key[]): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i]
    const [t0, v0] = keys[i - 1]
    if (t <= t1) return v0 + (v1 - v0) * (e ? e((t - t0) / (t1 - t0)) : smooth((t - t0) / (t1 - t0)))
  }
  return keys[keys.length - 1][1]
}
const seg = (t: number, a: number, b: number) => smooth((t - a) / (b - a))
/** 眨眼：很快閉上、慢一點張開 */
const blink = (t: number, at: number, d = 0.22) => {
  const x = (t - at) / d
  if (x < 0 || x > 1) return 0
  return x < 0.4 ? x / 0.4 : 1 - (x - 0.4) / 0.6
}
/** 說話時嘴巴開合 */
const talk = (t: number, a: number, b: number) => (t >= a && t <= b ? 0.55 + 0.45 * Math.abs(Math.sin(TAU * 2.6 * (t - a))) : 1)
const none = (): Pick<Frame, 'flash' | 'trail' | 'bursts'> => ({ flash: 0, trail: [], bursts: [] })

const idleBob = (t: number, amp = 0.07, period = 1.5) => amp * Math.sin((TAU * t) / period)

export const ACTIONS: Record<string, Action> = {
  idle: {
    dur: 3,
    loop: true,
    frame: (t) => {
      const w = (TAU * t) / 1.5
      return {
        ...none(),
        pose: {
          y: 0.07 * Math.sin(w),
          squash: 1 - 0.03 * Math.sin(w - 0.3),
          armL: -0.38 - 0.08 * Math.sin(w - 0.7),
          armR: 0.38 + 0.08 * Math.sin(w - 0.7),
          ringY: 0.05 * Math.sin(w - 1.0),
          ringSpin: (t * (TAU / 8)) / 1.5,
          rotZ: 0.035 * Math.sin((TAU * t) / 3),
          rotY: 0.08 * Math.sin((TAU * t) / 3 + 1),
          lid: blink(t, 1.55),
        },
      }
    },
  },

  hello: {
    dur: 3,
    frame: (t) => {
      const wave = t > 0.55 && t < 2.2 ? 0.42 * Math.sin(TAU * 2.4 * (t - 0.55)) * (1 - seg(t, 1.9, 2.2)) : 0
      return {
        ...none(),
        pose: {
          squash: key(t, [[0, 1], [0.22, 1.14], [0.42, 0.87, easeOut], [0.62, 1.05], [0.82, 1]]),
          y: key(t, [[0, 0], [0.22, -0.07], [0.46, 0.22, easeOut], [0.8, 0.06], [1.2, 0.05]]) + (t > 0.8 ? idleBob(t - 0.8, 0.05) : 0),
          armR: key(t, [[0, 0.38], [0.2, 0.2], [0.55, 2.5, outBack], [2.2, 2.45], [2.7, 0.38]]) + wave,
          armL: key(t, [[0, -0.38], [0.3, -0.55], [0.8, -0.45], [2.4, -0.45], [2.8, -0.38]]),
          rotZ: -0.09 * seg(t, 0.4, 0.7) * (1 - seg(t, 2.1, 2.6)) + 0.03 * Math.sin(TAU * 1.2 * t),
          rotY: 0.14 * Math.sin(TAU * 0.5 * t),
          mouth: t > 0.5 && t < 1.75 ? 'open' : 'smile',
          mouthOpen: talk(t, 0.5, 1.75),
          happy: t > 0.78 && t < 1.45 ? 1 : 0,
          lid: blink(t, 2.3),
          ringY: key(t, [[0, 0], [0.26, -0.12], [0.5, 0.13], [0.85, 0]]) + (t > 0.8 ? 0.04 * Math.sin(TAU * (t - 0.8) / 1.5 - 1) : 0),
          ringSpin: t * 0.9,
          blush: 1.15,
        },
      }
    },
  },

  fly: {
    dur: 3,
    frame: (t) => {
      const X = (u: number) => -3.5 + 7 * (0.65 * (u / 3) + 0.35 * smooth(u / 3))
      const Y = (u: number) => -0.05 + 0.22 * Math.sin(TAU * 0.5 * u)
      const trail: TrailPt[] = []
      const N = 28
      for (let k = 1; k <= N; k++) {
        const u = t - k * 0.028
        if (u < 0) break
        trail.push({ x: X(u), y: Y(u), a: 0.6 * Math.pow(1 - k / N, 1.5), s: 0.95 * (1 - (0.6 * k) / N) })
      }
      const bursts: Burst[] = []
      for (let i = 0; i < 26; i++) {
        const t0 = i * 0.11
        bursts.push({ t0, n: 2, x: X(t0) - 0.3, y: Y(t0), speed: 0.35, up: 0.05, spread: TAU, life: 0.75, size: 0.07, seed: 100 + i, gravity: -0.2 })
      }
      return {
        flash: 0,
        trail,
        bursts,
        pose: {
          x: X(t),
          y: Y(t),
          scale: 0.78,
          rotZ: -0.32 + 0.06 * Math.sin(TAU * t),
          stretchX: 0.1,
          squash: 0.97,
          armL: -1.3 + 0.18 * Math.sin(TAU * 4 * t),
          armR: -0.55 + 0.18 * Math.sin(TAU * 4 * t + 1),
          mouth: 'grin',
          lookX: 0.55,
          ringX: -0.2,
          ringY: -0.06,
          ringSpin: t * 2,
          core: 1.15,
        },
      }
    },
  },

  /** 原地飛行（可循環）：拖著光尾，用在需要沿任意路徑移動的地方 */
  fly_loop: {
    dur: 2,
    loop: true,
    frame: (t) => {
      const v = 2.6
      const Y = (u: number) => 0.18 * Math.sin(TAU * u)
      const trail: TrailPt[] = []
      const N = 28
      for (let k = 1; k <= N; k++) trail.push({ x: -v * k * 0.028, y: Y(t - k * 0.028), a: 0.6 * Math.pow(1 - k / N, 1.5), s: 0.95 * (1 - (0.6 * k) / N) })
      const bursts: Burst[] = []
      for (let i = -4; i < 8; i++) {
        const t0 = i * 0.25
        bursts.push({ t0, n: 2, x: -0.3, y: Y(t0), speed: 0.3, up: 0.05, spread: TAU, life: 0.8, size: 0.07, seed: 200 + ((i + 8) % 8), gravity: -0.2, drift: -v })
      }
      return {
        flash: 0,
        trail,
        bursts,
        pose: { y: Y(t), rotZ: -0.3 + 0.05 * Math.sin(TAU * t), stretchX: 0.1, squash: 0.97, armL: -1.3 + 0.18 * Math.sin(TAU * 4 * t), armR: -0.55 + 0.18 * Math.sin(TAU * 4 * t + 1), mouth: 'grin', lookX: 0.55, ringX: -0.2, ringY: -0.06, ringSpin: (t * TAU) / 8, core: 1.15 },
      }
    },
  },

  point: {
    dur: 2.5,
    frame: (t) => ({
      flash: 0,
      trail: [],
      bursts: [{ t0: 0.52, n: 9, x: 1.5, y: -0.02, speed: 1.0, up: 0.25, spread: TAU, life: 0.6, size: 0.09, seed: 7, gravity: -0.6 }],
      pose: {
        armR: key(t, [[0, 0.38], [0.28, 0.1], [0.5, 1.84, easeOut], [0.74, 1.55], [1.3, 1.55], [1.42, 1.7], [1.54, 1.5], [1.68, 1.64], [1.82, 1.55]]),
        armL: key(t, [[0, -0.38], [0.5, -0.6], [0.85, -0.45]]),
        rotZ: key(t, [[0, 0], [0.28, 0.1], [0.5, -0.13], [0.8, -0.08]]),
        rotY: key(t, [[0, 0], [0.5, 0.42], [0.8, 0.34]]),
        stretchX: key(t, [[0, 0], [0.42, 0.08], [0.62, 0]]),
        squash: key(t, [[0, 1], [0.28, 1.08], [0.5, 0.95], [0.72, 1]]),
        y: t > 0.75 ? idleBob(t - 0.75, 0.05) : 0,
        lookX: key(t, [[0, 0], [0.42, 0.8]]),
        lookY: 0.06,
        mouth: t > 0.45 && t < 1.3 ? 'open' : 'smile',
        mouthOpen: talk(t, 0.45, 1.3),
        lid: blink(t, 2.05),
        ringY: key(t, [[0, 0], [0.3, -0.05], [0.55, 0.08], [0.9, 0]]),
        ringSpin: t * 0.8,
      },
    }),
  },

  cheer: {
    dur: 3,
    frame: (t) => {
      const air = t > 0.55 && t < 2.2
      const shake = air ? 0.2 * Math.sin(TAU * 5 * t) : 0
      const hype = seg(t, 0.4, 0.7) * (1 - seg(t, 2.0, 2.7))
      return {
        flash: 0,
        trail: [],
        bursts: [
          { t0: 0.62, n: 36, x: 0, y: 0.75, speed: 2.3, up: 1.5, spread: TAU, life: 1.3, size: 0.12, seed: 11, gravity: -2.6 },
          { t0: 1.64, n: 18, x: 0, y: 0.45, speed: 1.6, up: 1.1, spread: TAU, life: 1.0, size: 0.1, seed: 12, gravity: -2.2 },
        ],
        pose: {
          y: key(t, [[0, 0], [0.3, -0.12], [0.68, 0.72, easeOut], [1.05, 0, easeIn], [1.13, -0.06], [1.32, 0], [1.4, 0], [1.63, 0.36, easeOut], [1.86, 0, easeIn], [2.2, 0]]) + (t > 2.2 ? idleBob(t - 2.2, 0.05) : 0),
          squash: key(t, [[0, 1], [0.3, 1.2], [0.45, 0.84], [0.7, 0.98], [1.0, 0.92], [1.1, 1.18], [1.3, 0.97], [1.42, 1.07], [1.6, 0.92], [1.86, 1.1], [2.05, 1]]),
          armL: key(t, [[0, -0.38], [0.3, -0.18], [0.6, -2.75, outBack], [2.2, -2.6], [2.65, -0.38]]) - shake,
          armR: key(t, [[0, 0.38], [0.3, 0.18], [0.6, 2.75, outBack], [2.2, 2.6], [2.65, 0.38]]) + shake,
          happy: t > 0.5 && t < 2.3 ? 1 : 0,
          mouth: t > 0.45 && t < 2.3 ? 'open' : 'smile',
          mouthOpen: t > 0.45 && t < 2.3 ? 1.25 : 1,
          core: 1 + 0.45 * hype,
          ringGlow: 1 + 0.9 * hype,
          ringSpin: t + 7 * seg(t, 0.4, 1.5),
          ringY: key(t, [[0, 0], [0.3, -0.13], [0.6, -0.1], [0.76, 0.16], [1.1, -0.16], [1.36, 0.05], [1.7, 0.06], [1.9, -0.07], [2.2, 0]]),
          rotZ: air ? 0.06 * Math.sin(TAU * 2 * t) : 0,
          blush: 1.2,
        },
      }
    },
  },

  bye: {
    dur: 3,
    frame: (t) => {
      const wave = t > 0.25 && t < 1.7 ? 0.42 * Math.sin(TAU * 2.4 * (t - 0.25)) * (1 - seg(t, 1.45, 1.7)) : 0
      return {
        flash: 0,
        trail: [],
        bursts: [{ t0: 2.28, n: 44, x: 0, y: 0.3, speed: 1.5, up: 0.6, spread: TAU, life: 0.95, size: 0.1, seed: 21, gravity: -0.5 }],
        hidden: t > 2.47,
        pose: {
          armR: key(t, [[0, 0.38], [0.25, 2.5, outBack], [1.7, 2.45], [1.9, 2.3]]) + wave,
          armL: key(t, [[0, -0.38], [1.7, -0.45], [1.95, -0.7]]),
          mouth: t > 0.3 && t < 1.3 ? 'open' : 'smile',
          mouthOpen: talk(t, 0.3, 1.3),
          happy: t > 0.4 && t < 1.05 ? 1 : 0,
          lid: blink(t, 1.6),
          squash: key(t, [[1.6, 1], [1.86, 1.13], [2.05, 0.88], [2.45, 0.9]]),
          y: key(t, [[0, 0], [1.86, -0.06], [2.45, 0.38]]) + (t < 1.6 ? idleBob(t, 0.05) : 0),
          rotY: key(t, [[1.9, 0], [2.46, Math.PI * 2, easeIn]]),
          rotZ: -0.08 * seg(t, 0.2, 0.5) * (1 - seg(t, 1.5, 1.8)),
          scale: key(t, [[1.95, 1], [2.46, 0, inBack]]),
          ringScale: key(t, [[2.0, 1], [2.38, 0]]),
          ringY: key(t, [[0, 0], [1.9, 0], [2.4, 0.3]]),
          ringSpin: t * 0.9,
          blush: 1.15,
        },
      }
    },
  },

  pop: {
    dur: 2.5,
    frame: (t) => ({
      flash: key(t, [[0, 0], [0.07, 1, easeOut], [0.26, 0.72], [0.72, 0]]),
      flashY: -0.25,
      trail: [],
      bursts: [{ t0: 0.16, n: 30, x: 0, y: -0.1, speed: 2.5, up: 0.4, spread: TAU, life: 0.9, size: 0.11, seed: 31, gravity: -0.9 }],
      hidden: t < 0.1,
      pose: {
        scale: key(t, [[0.1, 0.001], [0.38, 1.18, easeOut], [0.56, 0.92], [0.74, 1.03], [0.9, 1]]),
        squash: key(t, [[0.1, 0.7], [0.38, 0.84], [0.56, 1.14], [0.74, 0.97], [0.9, 1]]),
        y: key(t, [[0.1, -0.85], [0.4, 0.22, easeOut], [0.7, -0.03], [0.9, 0]]) + (t > 0.9 ? idleBob(t - 0.9, 0.06) : 0),
        armL: key(t, [[0.35, -0.05], [0.6, -0.65], [0.86, -0.38]]),
        armR: key(t, [[0.35, 0.05], [0.6, 0.65], [0.86, 0.38]]),
        ringScale: key(t, [[0.42, 0.001], [0.75, 1.12, outBack], [0.9, 1]]),
        ringSpin: 9 * (1 - Math.exp(-3 * Math.max(0, t - 0.42))),
        wide: key(t, [[0.15, 1], [0.95, 1], [1.2, 0]]),
        mouth: t < 1.0 ? 'o' : 'smile',
        lid: blink(t, 1.65),
        core: 1 + 0.6 * (1 - seg(t, 0.1, 0.9)),
        ringY: t > 0.9 ? 0.05 * Math.sin((TAU * (t - 0.9)) / 1.5 - 1) : 0,
      },
    }),
  },
}

/** 預覽用的三種表情 */
export const EXPRESSIONS: Record<string, Partial<Pose>> = {
  smile: {},
  wow: { mouth: 'o', wide: 1, armL: -0.7, armR: 0.7 },
  happy: { happy: 1, mouth: 'open', mouthOpen: 1.2, blush: 1.25, armL: -2.5, armR: 2.5 },
}
