import * as THREE from 'three'
import type { Burst, Frame } from './spriteActions'
import { STAR_SHAPE } from './spriteModel'

/** 小精靈的特效：跳出來時的車燈閃光、飛行的光尾、灑出來的光點。App 的拍車畫面與影片錄製共用。 */
export type SpriteFx = { group: THREE.Group; apply: (f: Frame, t: number) => void; dispose: () => void }

function radial(stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  for (const [o, col] of stops) grd.addColorStop(o, col)
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function streak() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 32
  const g = c.getContext('2d')!
  const h = g.createLinearGradient(0, 0, 512, 0)
  h.addColorStop(0, 'rgba(255,230,160,0)')
  h.addColorStop(0.5, 'rgba(255,250,230,1)')
  h.addColorStop(1, 'rgba(255,230,160,0)')
  g.fillStyle = h
  g.fillRect(0, 0, 512, 32)
  const v = g.createLinearGradient(0, 0, 0, 32)
  v.addColorStop(0, 'rgba(0,0,0,1)')
  v.addColorStop(0.5, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,1)')
  g.globalCompositeOperation = 'destination-out'
  g.fillStyle = v
  g.fillRect(0, 0, 512, 32)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** 固定種子的亂數：同一個時間點每次畫出來都一樣（影片可以逐格重錄） */
const rnd = (seed: number, i: number, k: number) => {
  const x = Math.sin(seed * 127.1 + i * 311.7 + k * 74.7) * 43758.5453
  return x - Math.floor(x)
}

export function createSpriteFx(opts: { particles?: number; trail?: number } = {}): SpriteFx {
  const group = new THREE.Group()
  const glowTex = radial([[0, 'rgba(255,248,220,1)'], [0.2, 'rgba(255,224,140,0.75)'], [0.5, 'rgba(255,201,74,0.25)'], [1, 'rgba(255,201,74,0)']])
  const streakTex = streak()
  const mats: THREE.Material[] = []
  const spriteMat = (map: THREE.Texture) => {
    const m = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, toneMapped: false })
    mats.push(m)
    return m
  }
  // 閃光：中心光球＋四道光芒
  const flash = new THREE.Group()
  const core = new THREE.Sprite(spriteMat(glowTex))
  flash.add(core)
  const streaks: THREE.Sprite[] = []
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Sprite(spriteMat(streakTex))
    s.material.rotation = (i * Math.PI) / 4
    streaks.push(s)
    flash.add(s)
  }
  flash.renderOrder = 10
  group.add(flash)
  // 光尾
  const trail: THREE.Sprite[] = []
  for (let i = 0; i < (opts.trail ?? 32); i++) {
    const s = new THREE.Sprite(spriteMat(glowTex))
    s.renderOrder = -2
    trail.push(s)
    group.add(s)
  }
  // 光點：四角星＋小光暈
  const starGeo = new THREE.ShapeGeometry(STAR_SHAPE())
  const particles: { star: THREE.Mesh; glow: THREE.Sprite; mat: THREE.MeshBasicMaterial }[] = []
  for (let i = 0; i < (opts.particles ?? 96); i++) {
    const mat = new THREE.MeshBasicMaterial({ color: '#FFF3C2', transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
    mats.push(mat)
    const star = new THREE.Mesh(starGeo, mat)
    const glow = new THREE.Sprite(spriteMat(glowTex))
    star.renderOrder = 5
    glow.renderOrder = 4
    group.add(star, glow)
    particles.push({ star, glow, mat })
  }

  const apply = (f: Frame, t: number) => {
    flash.visible = f.flash > 0.001
    flash.position.set(0, f.flashY ?? 0, 0.8)
    core.material.opacity = Math.min(1, f.flash)
    core.scale.setScalar(1.6 + 3.2 * f.flash)
    streaks.forEach((s, i) => {
      s.material.opacity = Math.min(1, f.flash * (i % 2 ? 0.7 : 1))
      s.scale.set((i % 2 ? 3.6 : 5.6) * f.flash + 0.5, 0.22 + 0.1 * f.flash, 1)
    })
    trail.forEach((s, i) => {
      const p = f.trail[i]
      s.visible = !!p
      if (!p) return
      s.position.set(p.x, p.y, -0.3)
      s.scale.setScalar(2.2 * p.s)
      s.material.opacity = p.a
    })
    let used = 0
    const place = (b: Burst) => {
      for (let i = 0; i < b.n && used < particles.length; i++) {
        const life = b.life * (0.7 + 0.3 * rnd(b.seed, i, 1))
        const age = t - b.t0
        if (age < 0 || age > life) continue
        const a = (b.dir ?? Math.PI / 2) - b.spread / 2 + b.spread * rnd(b.seed, i, 2)
        const sp = b.speed * (0.45 + 0.55 * rnd(b.seed, i, 3))
        const vx = Math.cos(a) * sp + (b.drift ?? 0)
        const vy = Math.sin(a) * sp + b.up
        const g = b.gravity ?? -1
        const x = b.x + vx * age
        const y = b.y + vy * age + 0.5 * g * age * age
        const k = age / life
        const alpha = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (0.85 + 0.15 * Math.sin(age * 40 + i))
        const size = b.size * (0.6 + 0.8 * rnd(b.seed, i, 4)) * (1 - 0.35 * k)
        const p = particles[used++]
        p.star.visible = p.glow.visible = true
        p.star.position.set(x, y, 0.9)
        p.star.scale.setScalar(size)
        p.star.rotation.z = age * (2 + 3 * rnd(b.seed, i, 5))
        p.mat.opacity = alpha
        p.glow.position.set(x, y, 0.85)
        p.glow.scale.setScalar(size * 5)
        p.glow.material.opacity = alpha * 0.55
      }
    }
    f.bursts.forEach(place)
    for (let i = used; i < particles.length; i++) particles[i].star.visible = particles[i].glow.visible = false
  }

  return {
    group,
    apply,
    dispose: () => {
      glowTex.dispose()
      streakTex.dispose()
      starGeo.dispose()
      mats.forEach((m) => m.dispose())
    },
  }
}
