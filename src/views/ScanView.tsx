import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { cropForOcr, loadOcr, recognize } from '../lib/ocr'
import { DEMO_FLEET_HASHES, SPRITE_PALETTES, extractPlate, maskPlate, paletteFor, plateDigitSum, plateHash } from '../lib/lucky'
import { mountSpriteStage, type SpriteStage, exportSpriteGlb } from '../lib/sprite3d'
import { spriteLine } from '../lib/ai'
import { readJSON, writeJSON } from '../lib/settings'
import { ensureSubmit } from './FriendsView'
import type { Source } from '../lib/types'

type Phase = 'live' | 'reading' | 'notfleet' | 'noplate' | 'already' | 'found' | 'nocamera'
type Found = { plate: string; masked: string; sum: number; diff: number; palette: ReturnType<typeof paletteFor>; title: string; line: string; source: Source; ms: number }

const FRAME = { x: 0.1, y: 0.36, w: 0.8, h: 0.24 } // 取景框占畫面比例

const dayKey = () => new Date().toISOString().slice(0, 10)

export function ScanView() {
  const s = useStore()
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const still = useRef<HTMLCanvasElement>(null)
  const stageBox = useRef<HTMLDivElement>(null)
  const stage = useRef<SpriteStage | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>('live')
  const [ocrStage, setOcrStage] = useState('')
  const [found, setFound] = useState<Found | null>(null)
  const [manual, setManual] = useState('')
  const [lastText, setLastText] = useState('')
  const [speed, setSpeed] = useState<number | null>(null)
  const [arOpen, setArOpen] = useState(false)

  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }

  const startCamera = useCallback(async () => {
    setPhase('live')
    setFound(null)
    stage.current?.dispose()
    stage.current = null
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('nocamera')
      return
    }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      stream.current = st
      if (video.current) {
        video.current.srcObject = st
        await video.current.play().catch(() => {})
      }
    } catch {
      setPhase('nocamera')
    }
  }, [])

  useEffect(() => {
    startCamera()
    loadOcr(setOcrStage).catch((e) => setOcrStage(`辨識引擎載入失敗：${e?.message || e}`))
    let watch: number | null = null
    if (navigator.geolocation) {
      watch = navigator.geolocation.watchPosition(
        (p) => setSpeed(p.coords.speed ?? 0),
        () => setSpeed(null),
        { enableHighAccuracy: true, maximumAge: 5000 },
      )
    }
    return () => {
      stopCamera()
      stage.current?.dispose()
      if (watch !== null) navigator.geolocation.clearWatch(watch)
    }
  }, [startCamera])

  const tooFast = speed !== null && speed > 2.5 // 約時速 9 公里以上

  /** 取景框座標換算成影像比例（影片以 object-fit: cover 顯示）。 */
  const frameInSource = (sw: number, sh: number) => {
    const el = wrap.current!
    const cw = el.clientWidth
    const ch = el.clientHeight
    const scale = Math.max(cw / sw, ch / sh)
    const dw = sw * scale
    const dh = sh * scale
    const ox = (dw - cw) / 2
    const oy = (dh - ch) / 2
    return { x: (FRAME.x * cw + ox) / dw, y: (FRAME.y * ch + oy) / dh, w: (FRAME.w * cw) / dw, h: (FRAME.h * ch) / dh }
  }

  const freeze = (src: CanvasImageSource, sw: number, sh: number) => {
    const c = still.current
    const el = wrap.current
    if (!c || !el) return
    c.width = el.clientWidth * (window.devicePixelRatio || 1)
    c.height = el.clientHeight * (window.devicePixelRatio || 1)
    const g = c.getContext('2d')!
    const scale = Math.max(c.width / sw, c.height / sh)
    g.drawImage(src, (c.width - sw * scale) / 2, (c.height - sh * scale) / 2, sw * scale, sh * scale)
  }

  const handlePlate = async (plate: string | null, texts: string[], ms: number) => {
    setLastText(texts.join(' ').slice(0, 60))
    if (!plate) {
      setPhase('noplate')
      return
    }
    const hash = await plateHash(plate)
    if (!DEMO_FLEET_HASHES.has(hash)) {
      setFound({ plate, masked: maskPlate(plate), sum: plateDigitSum(plate), diff: 0, palette: paletteFor(0), title: '', line: '', source: 'demo', ms })
      setPhase('notfleet')
      return
    }
    const seen = readJSON<Record<string, string>>('yoxi-lighting-city:seen:v1', {})
    if (seen[hash] === dayKey() && !s.settings.allowRepeat) {
      setFound({ plate, masked: maskPlate(plate), sum: plateDigitSum(plate), diff: 0, palette: paletteFor(plateDigitSum(plate)), title: '', line: '', source: 'demo', ms })
      setPhase('already')
      return
    }
    seen[hash] = dayKey()
    writeJSON('yoxi-lighting-city:seen:v1', seen)
    const sum = plateDigitSum(plate)
    const diff = Math.abs(sum - s.lucky)
    const palette = paletteFor(sum)
    setFound({ plate, masked: maskPlate(plate), sum, diff, palette, title: '', line: '', source: 'demo', ms })
    setPhase('found')
    requestAnimationFrame(() => {
      if (stageBox.current) {
        stage.current?.dispose()
        stage.current = mountSpriteStage(stageBox.current, palette)
        setTimeout(() => stage.current?.pop(), 120)
      }
    })
    if (navigator.vibrate) navigator.vibrate([30, 40, 60])
    const l = await spriteLine(s.settings, { plateMasked: maskPlate(plate), sum, lucky: s.lucky, palette: palette.name })
    setFound((f) => (f ? { ...f, title: l.title, line: l.line, source: l.source } : f))
    s.addCollected({ plateMasked: maskPlate(plate), sum, palette: palette.name, at: Date.now(), line: l.line, title: l.title })
    ensureSubmit(s.settings, { name: s.settings.nickname || '我', sum, diff, plateMasked: maskPlate(plate), palette: palette.name })
  }

  const capture = async () => {
    const v = video.current
    if (!v || !v.videoWidth || tooFast) return
    setPhase('reading')
    freeze(v, v.videoWidth, v.videoHeight)
    const { canvas } = cropForOcr(v, frameInSource(v.videoWidth, v.videoHeight))
    stopCamera()
    try {
      const { texts, ms } = await recognize(canvas, setOcrStage)
      console.info('[ocr]', texts, `${ms}ms`)
      await handlePlate(extractPlate(texts), texts, ms)
    } catch (e: any) {
      console.error('[ocr] failed', e)
      setOcrStage(`辨識失敗：${e?.message || e}`)
      setPhase('noplate')
    }
  }

  const fromFile = async (file: File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    await img.decode()
    stopCamera()
    freeze(img, img.naturalWidth, img.naturalHeight)
    setPhase('reading')
    try {
      const { canvas } = cropForOcr(img, { x: 0, y: 0, w: 1, h: 1 })
      const { texts, ms } = await recognize(canvas, setOcrStage)
      await handlePlate(extractPlate(texts), texts, ms)
    } catch (e: any) {
      setOcrStage(`辨識失敗：${e?.message || e}`)
      setPhase('noplate')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const fromManual = async () => {
    const plate = extractPlate([manual])
    if (!plate) {
      s.toast('車牌格式像 TDX-3963')
      return
    }
    stopCamera()
    setPhase('reading')
    await handlePlate(plate, [manual], 0)
  }

  const live = phase === 'live'
  return (
    <div className="scan-view">
      <div ref={wrap} className="cam">
        <video ref={video} playsInline muted className={live ? '' : 'hidden'} />
        <canvas ref={still} className={live ? 'hidden' : 'still'} />
        <div ref={stageBox} className="stage" />
        {(live || phase === 'reading') && (
          <div className="frame" style={{ left: `${FRAME.x * 100}%`, top: `${FRAME.y * 100}%`, width: `${FRAME.w * 100}%`, height: `${FRAME.h * 100}%` }}>
            <i /><i /><i /><i />
            {phase === 'reading' && <div className="scanline" />}
          </div>
        )}
        <div className="cam-top">
          <span className="chip chip-lamp">AR 收集模式</span>
          <span className={`chip ${tooFast ? 'chip-warn' : ''}`}>{tooFast ? '移動中，停下再拍' : speed === null ? '只在人行道拍停妥的車' : '步行速度 ✓'}</span>
        </div>
        {live && <p className="cam-hint">把車牌放進框裡</p>}
      </div>

      <div className="scan-panel">
        {live && (
          <>
            <button className="shutter" onClick={capture} disabled={tooFast} aria-label="拍照辨識車牌">
              <span />
            </button>
            <p className="muted small">車牌在手機上辨識，照片不上傳。{ocrStage && ocrStage !== '就緒' ? `（${ocrStage}…）` : ''}</p>
          </>
        )}
        {phase === 'reading' && <p className="reading">辨識中…{ocrStage && ocrStage !== '就緒' ? `（${ocrStage}）` : ''}</p>}
        {phase === 'nocamera' && <p className="muted">無法開啟相機。可以上傳車的照片，或直接輸入車牌。</p>}
        {phase === 'noplate' && (
          <div className="result">
            <strong>沒有讀到車牌</strong>
            <p className="muted small">靠近一點、讓車牌橫放在框裡再拍一次。{lastText ? `讀到的文字：${lastText}` : ''}</p>
          </div>
        )}
        {phase === 'notfleet' && found && (
          <div className="result">
            <strong>{found.plate} 不在示範車隊名單裡</strong>
            <p className="muted small">只有自願加入「可被收集」的 yoxi 車才會出現小精靈。比對時只用車牌的雜湊值。</p>
          </div>
        )}
        {phase === 'already' && found && (
          <div className="result">
            <strong>今天已經收集過 {found.masked}</strong>
            <p className="muted small">每台車每人每天只能收集一次，明天再來找它吧。</p>
          </div>
        )}
        {phase === 'found' && found && (
          <div className="result found">
            <div className="found-head">
              <strong>{found.title || `${found.palette.name}的小精靈`}</strong>
              <span className={found.source === 'live' ? 'live-tag' : 'demo-tag'}>{found.source === 'live' ? 'Gemini' : '示範資料'}</span>
            </div>
            <p className="line">{found.line || '…'}</p>
            <div className="sumrow">
              <span>{found.masked}</span>
              <span>
                車牌加總 <b>{found.sum}</b>
              </span>
              <span>
                今日 <b>{s.lucky}</b>
              </span>
              <span className={found.diff === 0 ? 'win' : ''}>{found.diff === 0 ? '中了！' : `差 ${found.diff}`}</span>
            </div>
            <div className="row">
              <button className="btn-lamp" onClick={() => setArOpen(true)}>
                AR 召喚
              </button>
              <button className="btn-ghost" onClick={() => s.setTab('friends')}>
                看好友排行
              </button>
            </div>
          </div>
        )}
        {!live && (
          <button className="btn-ghost wide" onClick={startCamera}>
            再拍一台
          </button>
        )}
        <details className="alt">
          <summary>沒有相機？上傳照片或輸入車牌</summary>
          <div className="row">
            <label className="btn-ghost file">
              上傳照片
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && fromFile(e.target.files[0])} />
            </label>
            <input id="manual-plate" className="input" placeholder="TDX-3963" value={manual} onChange={(e) => setManual(e.target.value)} />
            <button className="btn-ghost" onClick={fromManual}>
              送出
            </button>
          </div>
        </details>
      </div>
      {arOpen && found && <ArModal palette={found.palette} onClose={() => setArOpen(false)} />}
    </div>
  )
}

function ArModal({ palette, onClose }: { palette: ReturnType<typeof paletteFor>; onClose: () => void }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let url = ''
    let cancelled = false
    import('@google/model-viewer').catch(() => {})
    const idx = SPRITE_PALETTES.findIndex((p) => p.name === palette.name)
    const staticUrl = new URL(`sprites/sprite-${Math.max(0, idx)}.glb`, document.baseURI).href
    fetch(staticUrl, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') || ''
        if (r.ok && !type.includes('text/html')) {
          if (!cancelled) setSrc(staticUrl)
        } else throw new Error('no static model')
      })
      .catch(async () => {
        const blob = await exportSpriteGlb(palette)
        url = URL.createObjectURL(blob)
        if (!cancelled) setSrc(url)
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [palette])
  return (
    <div className="modal" role="dialog" aria-label="AR 召喚">
      <div className="modal-card">
        <div className="modal-head">
          <strong>AR 召喚：把小精靈放到地上</strong>
          <button className="btn-ghost" onClick={onClose}>
            關閉
          </button>
        </div>
        {src ? (
          <model-viewer src={src} ar="" ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" camera-controls="" auto-rotate="" shadow-intensity="1" exposure="1.1" alt="車燈小精靈 3D 模型" style={{ width: '100%', height: '320px', background: 'radial-gradient(circle at 50% 40%, #1C2D55, #0E1830)' }}>
            <button slot="ar-button" className="btn-lamp ar-btn">
              在真實場景中放置
            </button>
          </model-viewer>
        ) : (
          <div className="ar-loading">準備 3D 模型…</div>
        )}
        <p className="muted small">iPhone 會開啟 Quick Look，Android 會開啟 Scene Viewer 或網頁 AR。電腦上可以旋轉查看 3D 模型。</p>
      </div>
    </div>
  )
}
