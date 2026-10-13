/**
 * 小精靈動畫的錄製舞台（720×720、透明背景）。模型、動作、特效、打光都和 App 的拍車畫面共用（src/lib/sprite3d.ts）。
 * render_sprite.py 用 window.SPR.action(name, t) 一格一格畫，再截圖成 PNG 序列。
 */
import * as THREE from 'three'
import { createSpriteScene, prepareSpriteRenderer } from '../../../src/lib/sprite3d'
import { ACTIONS, EXPRESSIONS, type Frame } from '../../../src/lib/spriteActions'
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
      setPalette: (p: Palette) => void
      action: (name: string, t: number) => void
      pose: (p: Partial<Pose>) => void
      expression: (name: string, extra?: Partial<Pose>) => void
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
  setPalette,
  action: (name, t) => draw(ACTIONS[name].frame(t), t),
  pose: (p) => draw({ ...EMPTY, pose: p }, 0),
  expression: (name, extra = {}) => draw({ ...EMPTY, pose: { ...EXPRESSIONS[name], ...extra } }, 0),
}
