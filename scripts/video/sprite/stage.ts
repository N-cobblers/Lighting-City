/**
 * 小精靈動畫的錄製舞台（720×720、透明背景）。模型、動作、特效、打光都和 App 的拍車畫面共用（src/lib/sprite3d.ts）。
 * render_sprite.py 用 window.SPR.action(name, t) 一格一格畫，再截圖成 PNG 序列；第三版影片的動作用 action3。
 */
import * as THREE from 'three'
import { createSpriteScene, prepareSpriteRenderer } from '../../../src/lib/sprite3d'
import { ACTIONS, EXPRESSIONS, type Frame } from '../../../src/lib/spriteActions'
import { ACTIONS_V3 } from '../../../src/lib/spriteActionsV3'
import { createSpriteFx } from '../../../src/lib/spriteFx'
import { buildSpriteRig, WARM, type Palette, type Pose, type SpriteRig } from '../../../src/lib/spriteModel'

const SIZE = 720
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true })
renderer.setPixelRatio(2)
renderer.setSize(SIZE, SIZE)
renderer.setClearColor(0x000000, 0)
prepareSpriteRenderer(renderer)
document.body.appendChild(renderer.domElement)

const { scene } = createSpriteScene(renderer)
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
camera.position.set(0, 0.32, 8.6)
camera.lookAt(0, 0.32, 0)

const fx = createSpriteFx()
scene.add(fx.group)
let rig: SpriteRig = buildSpriteRig(WARM)
scene.add(rig.root)

function setPalette(p: Palette) {
  scene.remove(rig.root)
  rig = buildSpriteRig(p)
  scene.add(rig.root)
}

const EMPTY: Frame = { pose: {}, flash: 0, trail: [], bursts: [] }

declare global {
  interface Window {
    SPR: {
      ready: boolean
      durations: Record<string, number>
      durations3: Record<string, number>
      setPalette: (p: Palette) => void
      action: (name: string, t: number) => void
      action3: (name: string, t: number) => void
      pose: (p: Partial<Pose>) => void
      expression: (name: string, extra?: Partial<Pose>) => void
      /** 站好不動時，嘴巴中心在 720×720 畫布上的位置（像素） */
      mouthScreen: () => [number, number]
    }
  }
}

const draw = (f: Frame, t: number) => {
  rig.set(f.pose)
  rig.root.visible = !f.hidden
  fx.apply(f, t)
  renderer.render(scene, camera)
}

window.SPR = {
  ready: true,
  durations: Object.fromEntries(Object.entries(ACTIONS).map(([k, v]) => [k, v.dur])),
  durations3: Object.fromEntries(Object.entries(ACTIONS_V3).map(([k, v]) => [k, v.dur])),
  setPalette,
  action: (name, t) => draw(ACTIONS[name].frame(t), t),
  action3: (name, t) => draw(ACTIONS_V3[name].frame(t), t),
  pose: (p) => draw({ ...EMPTY, pose: p }, 0),
  expression: (name, extra = {}) => draw({ ...EMPTY, pose: { ...EXPRESSIONS[name], ...extra } }, 0),
  mouthScreen: () => {
    // 嘴巴貼在球面 (0, -0.25) 的位置（見 spriteModel.ts 的 mouthPos）
    const v = new THREE.Vector3(0, -0.25, Math.sqrt(1 - 0.0625)).project(camera)
    return [Math.round(((v.x + 1) / 2) * SIZE), Math.round(((1 - v.y) / 2) * SIZE)]
  },
}
