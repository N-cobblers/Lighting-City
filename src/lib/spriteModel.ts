import * as THREE from 'three'

/** 車燈小精靈的光色：body 身體、glow 發光、rim 邊緣與手。 */
export type Palette = { name: string; body: string; glow: string; rim: string }
export type Mouth = 'smile' | 'open' | 'o' | 'grin'

export const WARM: Palette = { name: '暖黃', body: '#FFD452', glow: '#FFC83D', rim: '#EFA52E' }

/** 動作的姿勢參數；沒給的就用預設值。 */
export type Pose = {
  x: number
  y: number
  rotX: number
  rotY: number
  rotZ: number
  scale: number
  /** 壓扁拉伸：>1 變扁變寬，<1 變高變瘦（體積不變） */
  squash: number
  /** 沿 x 方向拉長（飛行時） */
  stretchX: number
  /** 左右手的肩膀轉角（弧度）：0 垂下，右手正值往右上抬，左手負值往左上抬 */
  armL: number
  armR: number
  /** 眼皮：0 張開、1 閉上 */
  lid: number
  /** 開心的 ^ ^ 眼 */
  happy: number
  /** 眼睛睜大 */
  wide: number
  lookX: number
  lookY: number
  mouth: Mouth
  mouthOpen: number
  /** 頭頂光環 */
  ringX: number
  ringY: number
  ringSpin: number
  ringScale: number
  ringGlow: number
  /** 身體發光強度 */
  core: number
  blush: number
}

export const BASE_POSE: Pose = {
  x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1, squash: 1, stretchX: 0,
  armL: -0.38, armR: 0.38, lid: 0, happy: 0, wide: 0, lookX: 0, lookY: 0,
  mouth: 'smile', mouthOpen: 1, ringX: 0, ringY: 0, ringSpin: 0, ringScale: 1, ringGlow: 1, core: 1, blush: 1,
}

const canvasOk = () => typeof document !== 'undefined'

function radialTexture(stops: [number, string][], size = 256): THREE.Texture | null {
  if (!canvasOk()) return null
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [o, col] of stops) grd.addColorStop(o, col)
  g.fillStyle = grd
  g.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** '#RRGGBB' → 畫布用的 rgba()（畫布是 sRGB，直接用色碼的值） */
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/** 身體：發光的核心（正面亮、邊緣暗一點），外面再包一層邊緣光。 */
function bodyMaterial(p: Palette, forExport: boolean) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: p.body, emissive: new THREE.Color(p.glow), emissiveIntensity: 0.66, roughness: 0.32, metalness: 0, specularIntensity: 0.7, envMapIntensity: 0.4,
  })
  if (!forExport) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uCore = { value: 1 }
      shader.uniforms.uRim = { value: new THREE.Color(p.glow).lerp(new THREE.Color('#FFF3D0'), 0.35) }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uCore;\nuniform vec3 uRim;')
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float nvCore = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          totalEmissiveRadiance = (totalEmissiveRadiance * mix(0.85, 1.4, pow(nvCore, 1.3)) + uRim * pow(1.0 - nvCore, 2.3) * 0.95) * uCore;`,
        )
      mat.userData.shader = shader
    }
  }
  return mat
}

/** 臉上的零件貼在球面上：給 x、y（球面座標），回傳該點與法線方向 */
function onSurface(x: number, y: number, r = 1) {
  const z = Math.sqrt(Math.max(0, 1 - x * x - y * y))
  return new THREE.Vector3(x, y, z).normalize().multiplyScalar(r)
}

function star4(): THREE.Shape {
  const s = new THREE.Shape()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 1 : 0.28
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}
export const STAR_SHAPE = star4

export type SpriteRig = {
  root: THREE.Group
  set: (p: Partial<Pose>) => void
  palette: Palette
}

/**
 * 車燈小精靈（原創角色）：圓滾滾的暖光球，正面有發光的核心與邊緣光，大眼睛（兩個反光點、可以眨眼的眼皮）、
 * 淡淡腮紅、可換表情的小嘴、短短的手，頭頂浮著一圈像車燈 LED 的光環。forExport = 給 GLB／AR 用（不放光暈與自訂 shader）。
 */
export function buildSpriteRig(p: Palette, opts: { forExport?: boolean } = {}): SpriteRig {
  const forExport = !!opts.forExport
  const root = new THREE.Group()
  root.name = 'headlight-sprite'
  // 壓扁拉伸的支點在身體下方，跳起落地時底部比較穩
  const squashPivot = new THREE.Group()
  squashPivot.position.y = -0.7
  root.add(squashPivot)
  const rig = new THREE.Group()
  rig.position.y = 0.7
  squashPivot.add(rig)

  const bodyMat = bodyMaterial(p, forExport)
  // GLB（AR 用）面數少一點，檔案才不會太大
  const body = new THREE.Mesh(forExport ? new THREE.SphereGeometry(1, 64, 40) : new THREE.SphereGeometry(1, 96, 64), bodyMat)
  body.name = 'body'
  rig.add(body)
  // 邊緣光直接做在身體材質裡（uRim）；外面不再包半透明殼，深色背景上才不會出現一圈灰邊

  // 臉（整組可以在球面上轉，做出看左看右）
  const face = new THREE.Group()
  face.name = 'face'
  rig.add(face)
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#1B1E36', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04 })
  const shineMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false })
  const lidMat = forExport ? bodyMat : bodyMaterial(p, false)
  const eyes: { group: THREE.Group; scale: THREE.Group; lid: THREE.Group; shine: THREE.Group; happy: THREE.Mesh; closed: THREE.Mesh }[] = []
  for (const sx of [-1, 1]) {
    const pos = onSurface(sx * 0.34, 0.05, 0.93)
    const g = new THREE.Group()
    g.position.copy(pos)
    g.lookAt(pos.clone().multiplyScalar(3))
    face.add(g)
    const sc = new THREE.Group()
    sc.scale.set(1, 1.36, 0.62)
    g.add(sc)
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.178, 40, 28), eyeMat)
    sc.add(eye)
    // 眼皮：上半球的殼，轉下來就蓋住眼睛
    const lidPivot = new THREE.Group()
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.178 * 1.12, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lidMat)
    lidPivot.add(lid)
    lidPivot.rotation.x = -Math.PI / 2
    sc.add(lidPivot)
    // 反光點：大的在右上、小的在左下
    const shine = new THREE.Group()
    const s1 = new THREE.Mesh(new THREE.CircleGeometry(0.052, 24), shineMat)
    s1.position.set(0.048, 0.092, 0.12)
    const s2 = new THREE.Mesh(new THREE.CircleGeometry(0.024, 16), shineMat)
    s2.position.set(-0.054, -0.075, 0.116)
    shine.add(s1, s2)
    g.add(shine)
    // 開心的 ^ ^ 眼
    const happy = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.03, 12, 32, Math.PI), eyeMat)
    happy.position.set(0, -0.02, 0.06)
    happy.visible = false
    g.add(happy)
    // 閉眼時的眼線（∪）
    const closed = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 10, 28, Math.PI), eyeMat)
    closed.rotation.z = Math.PI
    closed.position.set(0, 0, 0.125)
    closed.visible = false
    g.add(closed)
    eyes.push({ group: g, scale: sc, lid: lidPivot, shine, happy, closed })
  }
  // 腮紅
  const blushTex = radialTexture([[0, rgba('#FF7E5F', 0.7)], [0.55, rgba('#FF8A65', 0.3)], [1, rgba('#FF8A65', 0)]], 128)
  const blushMat = new THREE.MeshBasicMaterial({ map: blushTex, color: blushTex ? '#FFFFFF' : '#FF8A65', transparent: true, opacity: blushTex ? 1 : 0.45, depthWrite: false, toneMapped: false })
  for (const sx of [-1, 1]) {
    const pos = onSurface(sx * 0.58, -0.14, 1.006)
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), blushMat)
    b.position.copy(pos)
    b.lookAt(pos.clone().multiplyScalar(3))
    b.renderOrder = 3
    face.add(b)
  }
  // 嘴巴：笑、張嘴、o、露齒笑
  const mouthMat = new THREE.MeshStandardMaterial({ color: '#3B2034', roughness: 0.5 })
  const tongueMat = new THREE.MeshStandardMaterial({ color: '#FF8A7A', roughness: 0.6 })
  const mouthPos = onSurface(0, -0.25, 1.0)
  const mouthG = new THREE.Group()
  mouthG.position.copy(mouthPos)
  mouthG.lookAt(mouthPos.clone().multiplyScalar(3))
  face.add(mouthG)
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.026, 12, 32, Math.PI), mouthMat)
  smile.rotation.z = Math.PI
  smile.position.z = 0.012
  const openShape = new THREE.Shape()
  openShape.moveTo(-0.13, 0.02)
  openShape.quadraticCurveTo(0, 0.05, 0.13, 0.02)
  openShape.quadraticCurveTo(0.12, -0.17, 0, -0.17)
  openShape.quadraticCurveTo(-0.12, -0.17, -0.13, 0.02)
  const open = new THREE.Group()
  const openM = new THREE.Mesh(new THREE.ShapeGeometry(openShape, 24), mouthMat)
  openM.position.z = 0.014
  const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), tongueMat)
  tongue.scale.set(1.2, 0.6, 1)
  tongue.position.set(0, -0.12, 0.018)
  open.add(openM, tongue)
  const oMouth = new THREE.Mesh(new THREE.CircleGeometry(0.06, 28), mouthMat)
  oMouth.scale.set(0.85, 1.1, 1)
  oMouth.position.z = 0.014
  const grin = new THREE.Group()
  const grinShape = new THREE.Shape()
  grinShape.moveTo(-0.15, 0.03)
  grinShape.quadraticCurveTo(0, 0.0, 0.15, 0.03)
  grinShape.quadraticCurveTo(0.1, -0.13, 0, -0.13)
  grinShape.quadraticCurveTo(-0.1, -0.13, -0.15, 0.03)
  const grinM = new THREE.Mesh(new THREE.ShapeGeometry(grinShape, 24), mouthMat)
  grinM.position.z = 0.014
  const grinT = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), tongueMat)
  grinT.scale.set(1.3, 0.55, 1)
  grinT.position.set(0, -0.095, 0.018)
  grin.add(grinM, grinT)
  const mouths: Record<Mouth, THREE.Object3D> = { smile, open, o: oMouth, grin }
  for (const m of Object.values(mouths)) mouthG.add(m)

  // 短短的手：膠囊，支點在肩膀
  const armMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(p.body).lerp(new THREE.Color(p.rim), 0.6), emissive: new THREE.Color(p.glow), emissiveIntensity: 0.5, roughness: 0.36, specularIntensity: 0.55,
  })
  const arms: THREE.Group[] = []
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(sx * 0.86, -0.1, 0.1)
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.3, 8, 20), armMat)
    arm.position.y = -0.26
    pivot.add(arm)
    rig.add(pivot)
    arms.push(pivot)
  }

  // 頭頂的車燈光環：本身會發光的琥珀光圈，上面 8 顆白色 LED 小點
  const ring = new THREE.Group()
  ring.name = 'ring'
  root.add(ring)
  const ringTilt = new THREE.Group()
  ringTilt.rotation.x = Math.PI / 2 - 0.62
  ring.add(ringTilt)
  const ringColor = new THREE.Color('#FFCF6E')
  const ringMat = forExport
    ? new THREE.MeshStandardMaterial({ color: '#FFE2A0', emissive: ringColor, emissiveIntensity: 1.2, roughness: 0.3 })
    : new THREE.MeshBasicMaterial({ color: ringColor.clone(), toneMapped: false })
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 20, 120), ringMat)
  ringTilt.add(torus)
  const beadMat = new THREE.MeshBasicMaterial({ color: '#FFFDF5', toneMapped: false })
  const beads = new THREE.Group()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.034, 14, 10), beadMat)
    b.position.set(Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0.035)
    beads.add(b)
  }
  ringTilt.add(beads)
  let ringGlow: THREE.Mesh | null = null
  let halo: THREE.Sprite | null = null
  if (!forExport) {
    // 環狀光暈：中間透明、光環處最亮，跟著光環傾斜
    const rt = radialTexture([[0, rgba('#FFD87A', 0)], [0.5, rgba('#FFD87A', 0)], [0.66, rgba('#FFE7A8', 0.75)], [0.8, rgba('#FFD87A', 0.22)], [1, rgba('#FFD87A', 0)]])
    ringGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }))
    ringGlow.renderOrder = 6
    ringTilt.add(ringGlow)
    const ht = radialTexture([[0, rgba(p.glow, 0.34)], [0.3, rgba(p.glow, 0.22)], [0.55, rgba(p.glow, 0.07)], [1, rgba(p.glow, 0)]])
    halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ht, transparent: true, depthWrite: false, toneMapped: false }))
    halo.scale.set(4.4, 4.4, 1)
    halo.position.z = -0.6
    halo.renderOrder = -1
    root.add(halo)
  }

  const pose: Pose = { ...BASE_POSE }
  const apply = () => {
    root.position.set(pose.x, pose.y, 0)
    root.rotation.set(pose.rotX, pose.rotY, pose.rotZ)
    root.scale.setScalar(Math.max(0.0001, pose.scale))
    const sq = pose.squash
    const sx = Math.sqrt(sq) * (1 + pose.stretchX)
    squashPivot.scale.set(sx, 1 / sq / (1 + pose.stretchX * 0.6), Math.sqrt(sq))
    arms[0].rotation.z = pose.armL
    arms[1].rotation.z = pose.armR
    face.rotation.set(-pose.lookY * 0.22, pose.lookX * 0.3, 0)
    const eyeScale = 1 + 0.16 * pose.wide
    for (const e of eyes) {
      const hap = pose.happy > 0.5
      e.scale.visible = !hap
      e.shine.visible = !hap && pose.lid < 0.55
      e.happy.visible = hap
      e.scale.scale.set(eyeScale, 1.36 * eyeScale, 0.62)
      e.shine.scale.setScalar(eyeScale)
      e.lid.rotation.x = -Math.PI / 2 + THREE.MathUtils.clamp(pose.lid, 0, 1) * Math.PI * 0.98
      e.closed.visible = !hap && pose.lid > 0.82
    }
    for (const [k, m] of Object.entries(mouths)) m.visible = k === pose.mouth
    const mo = THREE.MathUtils.clamp(pose.mouthOpen, 0.2, 1.6)
    open.scale.set(1, mo, 1)
    grin.scale.set(1, mo, 1)
    blushMat.opacity = (blushTex ? 1 : 0.45) * THREE.MathUtils.clamp(pose.blush, 0, 1.2)
    ring.position.set(pose.ringX, 1.3 + pose.ringY, 0)
    ring.scale.setScalar(Math.max(0.0001, pose.ringScale))
    beads.rotation.z = pose.ringSpin
    if (ringMat instanceof THREE.MeshBasicMaterial) ringMat.color.copy(ringColor).multiplyScalar(0.85 + 0.25 * pose.ringGlow)
    else ringMat.emissiveIntensity = 1.2 * pose.ringGlow
    if (ringGlow) (ringGlow.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(pose.ringGlow, 0, 1.5)
    const shader = bodyMat.userData.shader as { uniforms: { uCore: { value: number } } } | undefined
    if (shader) shader.uniforms.uCore.value = pose.core
    const lidShader = lidMat.userData.shader as { uniforms: { uCore: { value: number } } } | undefined
    if (lidShader) lidShader.uniforms.uCore.value = pose.core
    if (halo) halo.material.opacity = THREE.MathUtils.clamp(0.75 + 0.35 * (pose.core - 1), 0, 1.4)
  }
  apply()
  return {
    root,
    palette: p,
    set: (patch) => {
      Object.assign(pose, BASE_POSE, patch)
      apply()
    },
  }
}

/** 與 App 舊版相同的介面：只要模型。 */
export function buildSprite(p: Palette, opts: { forExport?: boolean } = {}) {
  return buildSpriteRig(p, opts).root
}
