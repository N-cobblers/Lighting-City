import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ACTIONS } from './spriteActions'
import { createSpriteFx } from './spriteFx'
import { buildSprite, buildSpriteRig, type Palette } from './spriteModel'

export type { Palette } from './spriteModel'
export { buildSprite } from './spriteModel'

/** 小精靈的渲染設定：拍車畫面與影片錄製共用，看起來才一致。曝光壓低一點，橘色系才不會被映射成粉色。 */
export function prepareSpriteRenderer(renderer: THREE.WebGLRenderer) {
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.72
  renderer.outputColorSpace = THREE.SRGBColorSpace
}

/** 柔和的三點打光：暖白主光、背後的暖色輪廓光、下方的暖色反射光，再加一點室內環境反射 */
export function createSpriteScene(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.environment = env
  scene.environmentIntensity = 0.4
  scene.add(new THREE.HemisphereLight('#FFF4E2', '#5A3B22', 0.6))
  const key = new THREE.DirectionalLight('#FFF1DC', 2.0)
  key.position.set(-2.6, 3.4, 4)
  scene.add(key)
  const rim = new THREE.DirectionalLight('#FFD39A', 2.2)
  rim.position.set(3, 2.4, -3)
  scene.add(rim)
  const fill = new THREE.PointLight('#FFC27A', 6, 0, 2)
  fill.position.set(0, -2.2, 3)
  scene.add(fill)
  return { scene, env }
}

export type SpriteStage = { dispose: () => void; pop: () => void }

/** 疊在相機畫面上的透明 3D 舞台：小精靈從車燈閃光裡彈出來，之後待機浮動、眨眼。 */
export function mountSpriteStage(container: HTMLElement, palette: Palette): SpriteStage {
  const w = container.clientWidth || 300
  const h = container.clientHeight || 300
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.setSize(w, h)
  renderer.setClearColor(0x000000, 0)
  prepareSpriteRenderer(renderer)
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'
  container.appendChild(renderer.domElement)
  const { scene, env } = createSpriteScene(renderer)
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100)
  camera.position.set(0, 0.3, 10.5)
  camera.lookAt(0, 0.3, 0)
  // 小精靈跳到取景框上半部（車牌上方）
  const holder = new THREE.Group()
  holder.position.y = 0.9
  scene.add(holder)
  const rig = buildSpriteRig(palette)
  rig.root.visible = false
  holder.add(rig.root)
  const fx = createSpriteFx({ particles: 48, trail: 0 })
  holder.add(fx.group)
  let start = 0
  let popped = false
  let raf = 0
  const pop = ACTIONS.pop
  const idle = ACTIONS.idle
  const tick = (now: number) => {
    if (popped) {
      const t = (now - start) / 1000
      const f = t < pop.dur ? pop.frame(t) : idle.frame((t - pop.dur) % idle.dur)
      rig.set(f.pose)
      rig.root.visible = !f.hidden
      fx.apply(t < pop.dur ? f : { ...f, bursts: [], flash: 0 }, t)
    }
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  const onResize = () => {
    const nw = container.clientWidth
    const nh = container.clientHeight
    if (!nw || !nh) return
    renderer.setSize(nw, nh)
    camera.aspect = nw / nh
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)
  return {
    pop: () => {
      popped = true
      start = performance.now()
    },
    dispose: () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      fx.dispose()
      env.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

/** 匯出成 GLB，給 AR（iPhone Quick Look／Android Scene Viewer、WebXR）使用。高約 29 公分，底部貼地。 */
export async function exportSpriteGlb(palette: Palette): Promise<Blob> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const scene = new THREE.Scene()
  const s = buildSprite(palette, { forExport: true })
  s.scale.setScalar(0.12)
  s.position.y = 0.12
  scene.add(s)
  const exporter = new GLTFExporter()
  const result = await exporter.parseAsync(scene, { binary: true })
  return new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
}
