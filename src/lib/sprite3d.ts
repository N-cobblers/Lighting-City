import * as THREE from 'three'

export type Palette = { name: string; body: string; glow: string; rim: string }

function glowTexture(color: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(128, 128, 20, 128, 128, 128)
  const col = new THREE.Color(color)
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`
  grd.addColorStop(0, `rgba(${rgb},0.85)`)
  grd.addColorStop(0.35, `rgba(${rgb},0.35)`)
  grd.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function starShape() {
  const s = new THREE.Shape()
  const pts = 4
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? 1 : 0.32
    const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

/** 車燈小精靈：圓形車燈鏡片的身體、同心光圈、眼睛、腮紅、小手小腳。原創角色。 */
export function buildSprite(p: Palette, opts: { forExport?: boolean } = {}) {
  const root = new THREE.Group()
  root.name = 'headlight-sprite'
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    new THREE.MeshStandardMaterial({ color: p.body, emissive: new THREE.Color(p.glow), emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.0 }),
  )
  root.add(body)
  // lens rings on the face
  const ringMat = new THREE.MeshStandardMaterial({ color: '#FFF4CC', emissive: new THREE.Color('#FFF1BF'), emissiveIntensity: 0.6, transparent: true, opacity: 0.75 })
  for (const [r, z, t] of [
    [0.8, 0.6, 0.022],
    [0.58, 0.815, 0.018],
  ] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 96), ringMat)
    ring.position.z = z
    root.add(ring)
  }
  // highlight
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshBasicMaterial({ color: '#FFFDF2', transparent: true, opacity: 0.8 }))
  hl.scale.set(1.3, 0.55, 0.3)
  hl.position.set(-0.36, 0.55, 0.78)
  hl.rotation.z = 0.35
  root.add(hl)
  // eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#14213D', roughness: 0.3 })
  const sparkMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
  for (const x of [-0.3, 0.3]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), eyeMat)
    eye.scale.set(1, 1.35, 0.6)
    eye.position.set(x, 0.0, 0.97)
    root.add(eye)
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), sparkMat)
    sp.position.set(x + 0.03, 0.06, 1.04)
    root.add(sp)
  }
  // cheeks
  const cheekMat = new THREE.MeshBasicMaterial({ color: '#FF8A65', transparent: true, opacity: 0.55 })
  for (const x of [-0.52, 0.52]) {
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), cheekMat)
    ch.scale.set(1.4, 0.8, 1)
    const z = Math.sqrt(1 - x * x - 0.2 * 0.2) + 0.01
    ch.position.set(x, -0.2, z)
    ch.lookAt(x * 3, -0.6, z * 3)
    root.add(ch)
  }
  // smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 24, Math.PI), eyeMat)
  smile.rotation.z = Math.PI
  smile.position.set(0, -0.15, 0.985)
  root.add(smile)
  // arms
  const limbMat = new THREE.MeshStandardMaterial({ color: p.rim, emissive: new THREE.Color(p.rim), emissiveIntensity: 0.25, roughness: 0.5 })
  for (const s of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.92, -0.05, 0.1), new THREE.Vector3(s * 1.2, 0.05, 0.15), new THREE.Vector3(s * 1.32, 0.32, 0.1)])
    const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.07, 10, false), limbMat)
    root.add(arm)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), limbMat)
    hand.position.set(s * 1.32, 0.34, 0.1)
    root.add(hand)
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), limbMat)
    foot.scale.set(1.25, 0.6, 1.1)
    foot.position.set(s * 0.36, -1.0, 0.18)
    root.add(foot)
  }
  if (!opts.forExport) {
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(p.glow), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    halo.scale.set(4.6, 4.6, 1)
    halo.position.z = -0.4
    halo.name = 'halo'
    root.add(halo)
    const starMat = new THREE.MeshBasicMaterial({ color: '#FFE08A', side: THREE.DoubleSide })
    const geo = new THREE.ShapeGeometry(starShape())
    ;[
      [-0.9, 1.35, 0.17],
      [0, 1.62, 0.22],
      [0.9, 1.35, 0.17],
    ].forEach(([x, y, s], i) => {
      const st = new THREE.Mesh(geo, starMat)
      st.position.set(x, y, 0.2)
      st.scale.setScalar(s)
      st.name = `star${i}`
      root.add(st)
    })
  }
  return root
}

export type SpriteStage = { dispose: () => void; pop: () => void }

/** 疊在相機畫面上的透明 3D 舞台：小精靈從車上跳出來。 */
export function mountSpriteStage(container: HTMLElement, palette: Palette): SpriteStage {
  const w = container.clientWidth || 300
  const h = container.clientHeight || 300
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.setSize(w, h)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'
  container.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100)
  camera.position.set(0, 0.2, 9.5)
  scene.add(new THREE.AmbientLight('#ffffff', 1.1))
  const key = new THREE.DirectionalLight('#FFF4DD', 1.6)
  key.position.set(2, 3, 4)
  scene.add(key)
  const warm = new THREE.PointLight(palette.glow, 6, 10)
  warm.position.set(0, -1, 2)
  scene.add(warm)
  const sprite = buildSprite(palette)
  sprite.scale.setScalar(0.001)
  scene.add(sprite)
  let start = performance.now()
  let popped = false
  let raf = 0
  const ease = (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }
  const tick = (now: number) => {
    const t = (now - start) / 1000
    if (popped) {
      const k = Math.min(1, t / 0.9)
      const s = ease(k)
      sprite.scale.setScalar(Math.max(0.001, s))
      sprite.position.y = -1.4 + 2.6 * Math.min(1, k * 1.4) + Math.sin(t * 2.4) * 0.08 * Math.min(1, t)
      sprite.rotation.y = Math.sin(t * 1.3) * 0.35
      sprite.rotation.z = Math.sin(t * 1.9) * 0.05
      sprite.children.forEach((c) => {
        if (c.name.startsWith('star')) {
          const i = Number(c.name.slice(4))
          c.rotation.z = t * (1 + i * 0.3)
          ;(c as THREE.Mesh).visible = Math.sin(t * 4 + i) > -0.6
        }
      })
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
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

/** 匯出成 GLB，給 AR（iPhone Quick Look／Android Scene Viewer、WebXR）使用。 */
export async function exportSpriteGlb(palette: Palette): Promise<Blob> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const scene = new THREE.Scene()
  const s = buildSprite(palette, { forExport: true })
  s.scale.setScalar(0.12)
  s.position.y = 0.13
  scene.add(s)
  const exporter = new GLTFExporter()
  const result = await exporter.parseAsync(scene, { binary: true })
  return new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
}
