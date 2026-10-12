/**
 * 手機端車牌辨識：PaddleOCR PP-OCRv4 文字辨識模型，在瀏覽器裡用 ONNX Runtime Web 執行，照片不離開手機。
 * 取景框已經框出車牌，所以省略文字偵測，直接對框內影像做單行辨識（較快、不卡畫面）。
 */
type Engine = { ort: any; sess: any; dict: string[] }

let loading: Promise<Engine> | null = null

const base = () => new URL('./', document.baseURI).href

export function loadOcr(onStage?: (s: string) => void): Promise<Engine> {
  if (loading) return loading
  loading = (async () => {
    onStage?.('載入辨識引擎')
    const ort: any = await import('onnxruntime-web')
    ort.env.wasm.numThreads = 1
    onStage?.('載入車牌模型')
    const [sess, dictText] = await Promise.all([
      ort.InferenceSession.create(`${base()}models/ch_PP-OCRv4_rec_infer.onnx`, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }),
      fetch(`${base()}models/ppocr_keys_v1.txt`).then((r) => r.text()),
    ])
    onStage?.('就緒')
    return { ort, sess, dict: [...dictText.split('\n'), ' '] }
  })()
  loading.catch(() => {
    loading = null
  })
  return loading
}

/** 從影像擷取取景框區域。frame 以 0–1 的比例表示。 */
export function cropForOcr(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, frame: { x: number; y: number; w: number; h: number }) {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source instanceof HTMLImageElement ? source.naturalHeight : source.height
  const sx = Math.max(0, Math.round(frame.x * sw))
  const sy = Math.max(0, Math.round(frame.y * sh))
  const cw = Math.max(1, Math.min(sw - sx, Math.round(frame.w * sw)))
  const ch = Math.max(1, Math.min(sh - sy, Math.round(frame.h * sh)))
  const scale = Math.min(1, 1280 / cw)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cw * scale)
  canvas.height = Math.round(ch * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height)
  return { canvas }
}

async function recognizeLine(eng: Engine, src: HTMLCanvasElement, box: { x: number; y: number; w: number; h: number }) {
  const H = 48
  const bw = Math.max(1, Math.round(box.w * src.width))
  const bh = Math.max(1, Math.round(box.h * src.height))
  const W = Math.max(48, Math.min(960, Math.round((bw * H) / bh)))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.imageSmoothingQuality = 'high'
  g.drawImage(src, Math.round(box.x * src.width), Math.round(box.y * src.height), bw, bh, 0, 0, W, H)
  const px = g.getImageData(0, 0, W, H).data
  const n = H * W
  const f = new Float32Array(3 * n)
  for (let k = 0; k < n; k++) {
    f[k] = px[k * 4 + 2] / 255 // B
    f[n + k] = px[k * 4 + 1] / 255 // G
    f[2 * n + k] = px[k * 4] / 255 // R
  }
  const input = new eng.ort.Tensor('float32', f, [1, 3, H, W])
  const out = await eng.sess.run({ [eng.sess.inputNames[0]]: input })
  const t = out[eng.sess.outputNames[0]]
  const T = t.dims[1]
  const C = t.dims[2]
  const data = t.data as Float32Array
  let text = ''
  let prev = -1
  let sum = 0
  let cnt = 0
  for (let i = 0; i < T; i++) {
    let best = -Infinity
    let bi = 0
    for (let k = 0; k < C; k++) {
      const v = data[i * C + k]
      if (v > best) {
        best = v
        bi = k
      }
    }
    if (bi !== 0 && bi !== prev) {
      text += eng.dict[bi - 1] ?? ''
      sum += best
      cnt++
    }
    prev = bi
  }
  return { text, mean: cnt ? sum / cnt : 0 }
}

/** 對取景框影像做幾種裁切，取信心最高的結果。 */
export async function recognize(canvas: HTMLCanvasElement, onStage?: (s: string) => void): Promise<{ texts: string[]; ms: number }> {
  const eng = await loadOcr(onStage)
  const t0 = performance.now()
  const boxes = [
    { x: 0, y: 0, w: 1, h: 1 },
    { x: 0.08, y: 0.1, w: 0.84, h: 0.8 },
    { x: 0.18, y: 0.15, w: 0.64, h: 0.7 },
  ]
  const results = [] as { text: string; mean: number }[]
  for (const b of boxes) results.push(await recognizeLine(eng, canvas, b))
  results.sort((a, b) => b.mean - a.mean)
  return { texts: results.filter((r) => r.text).map((r) => r.text), ms: Math.round(performance.now() - t0) }
}
