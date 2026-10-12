import { cellToBoundary, cellToChildren, gridDisk, getResolution, latLngToCell, polygonToCells, cellToLatLng } from 'h3-js'

// The personal lighting map uses finer cells than the R9 cells in the analysis pipeline.
export const RES = 10
export type LngLat = [number, number]

/** 信義區＋松山區 play area (lat/lng box). */
export const AREA = { south: 25.024, north: 25.066, west: 121.543, east: 121.588 }
export const CENTER: LngLat = [121.5625, 25.0445]

export const AREA_CELLS: string[] = polygonToCells(
  [
    [AREA.south, AREA.west],
    [AREA.south, AREA.east],
    [AREA.north, AREA.east],
    [AREA.north, AREA.west],
  ],
  RES,
)
export const AREA_SET = new Set(AREA_CELLS)

export type Poi = { id: string; name: string; lng: number; lat: number; kind: 'yoxi' | 'place' | 'home' | 'work' }

/** yoxi 指定上車點座標取自競賽資料（該上車點所有上車座標的中位數）。其餘為公開地標的概略座標。 */
export const POIS: Poi[] = [
  { id: 'home', name: '家（民生社區）', lng: 121.5626, lat: 25.0586, kind: 'home' },
  { id: 'work', name: '公司（市府附近）', lng: 121.5652, lat: 25.0381, kind: 'work' },
  { id: 'spot-cityhall', name: '台北市府路 yoxi 上車點', lng: 121.563634, lat: 25.037566, kind: 'yoxi' },
  { id: 'spot-101', name: '台北101 yoxi 上車點（松智路）', lng: 121.565305, lat: 25.033383, kind: 'yoxi' },
  { id: 'spot-songyan', name: '松山文創園區誠品行旅 yoxi 上車點', lng: 121.561707, lat: 25.044983, kind: 'yoxi' },
  { id: 'spot-dome', name: '大巨蛋 yoxi 上車點（光復南路側）', lng: 121.557935, lat: 25.044363, kind: 'yoxi' },
  { id: 'spot-airport', name: '松山機場 yoxi 上車點', lng: 121.550726, lat: 25.062422, kind: 'yoxi' },
  { id: 'sunyatsen', name: '國父紀念館', lng: 121.5602, lat: 25.0400, kind: 'place' },
  { id: 'songyan', name: '松山文創園區', lng: 121.5606, lat: 25.0438, kind: 'place' },
  { id: 'sisinan', name: '四四南村', lng: 121.5620, lat: 25.0314, kind: 'place' },
  { id: 'xiangshan', name: '象山步道入口', lng: 121.5707, lat: 25.0277, kind: 'place' },
  { id: 'raohe', name: '饒河街夜市', lng: 121.5776, lat: 25.0507, kind: 'place' },
  { id: 'fujin', name: '富錦街', lng: 121.5630, lat: 25.0610, kind: 'place' },
  { id: 'mrt-cityhall', name: '捷運市政府站', lng: 121.5658, lat: 25.0411, kind: 'place' },
]
export const poiById = (id: string) => POIS.find((p) => p.id === id)

export type Route = { id: string; name: string; from: string; to: string; path: LngLat[]; minutes: number }

/** 沿主要道路的概略路線（示範用），會換算成沿途的 H3 六角格。 */
export const ROUTES: Route[] = [
  {
    id: 'evening-home',
    name: '下班回家',
    from: 'spot-cityhall',
    to: 'home',
    minutes: 13,
    path: [
      [121.563634, 25.037566],
      [121.5631, 25.0386],
      [121.5631, 25.0412],
      [121.5600, 25.0413],
      [121.5578, 25.0414],
      [121.5578, 25.0447],
      [121.5578, 25.0478],
      [121.5578, 25.0517],
      [121.5579, 25.0549],
      [121.5580, 25.0582],
      [121.5603, 25.0584],
      [121.5626, 25.0586],
    ],
  },
  {
    id: 'afternoon-songyan',
    name: '下午去松菸',
    from: 'spot-cityhall',
    to: 'spot-songyan',
    minutes: 6,
    path: [
      [121.563634, 25.037566],
      [121.5631, 25.0386],
      [121.5631, 25.0412],
      [121.5600, 25.0413],
      [121.5578, 25.0414],
      [121.5578, 25.0436],
      [121.5590, 25.0447],
      [121.561707, 25.044983],
    ],
  },
  {
    id: 'morning-work',
    name: '早上上班',
    from: 'home',
    to: 'spot-cityhall',
    minutes: 14,
    path: [
      [121.5626, 25.0586],
      [121.5603, 25.0584],
      [121.5580, 25.0582],
      [121.5579, 25.0549],
      [121.5578, 25.0517],
      [121.5578, 25.0478],
      [121.5578, 25.0447],
      [121.5578, 25.0414],
      [121.5600, 25.0413],
      [121.5631, 25.0412],
      [121.5631, 25.0386],
      [121.563634, 25.037566],
    ],
  },
]
ROUTES.push(
  {
    id: 'commute-dunhua',
    name: '平常的通勤路線（敦化北路）',
    from: 'home',
    to: 'spot-cityhall',
    minutes: 16,
    path: [
      [121.5626, 25.0586],
      [121.5580, 25.0582],
      [121.5495, 25.0581],
      [121.5493, 25.0517],
      [121.5491, 25.0478],
      [121.5490, 25.0413],
      [121.5578, 25.0414],
      [121.5631, 25.0412],
      [121.5631, 25.0386],
      [121.563634, 25.037566],
    ],
  },
  {
    id: 'weekend-raohe',
    name: '週末去饒河街',
    from: 'home',
    to: 'raohe',
    minutes: 10,
    path: [
      [121.5626, 25.0586],
      [121.5655, 25.0587],
      [121.5704, 25.0585],
      [121.5712, 25.0555],
      [121.5716, 25.0517],
      [121.5745, 25.0511],
      [121.5776, 25.0507],
    ],
  },
  {
    id: 'weekend-xiangshan',
    name: '週末爬象山',
    from: 'home',
    to: 'xiangshan',
    minutes: 15,
    path: [
      [121.5626, 25.0586],
      [121.5655, 25.0587],
      [121.5704, 25.0585],
      [121.5704, 25.0500],
      [121.5704, 25.0420],
      [121.5705, 25.0350],
      [121.5706, 25.0300],
      [121.5707, 25.0277],
    ],
  },
  {
    id: 'airport',
    name: '去松山機場',
    from: 'home',
    to: 'spot-airport',
    minutes: 8,
    path: [
      [121.5626, 25.0586],
      [121.5603, 25.0584],
      [121.5580, 25.0582],
      [121.5520, 25.0581],
      [121.5520, 25.0610],
      [121.550726, 25.062422],
    ],
  },
)
export const routeById = (id: string) => ROUTES.find((r) => r.id === id)!

function haversine(a: LngLat, b: LngLat) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Points every `step` metres along a path, with the cumulative fraction travelled. */
export function samplePath(path: LngLat[], step = 20): { p: LngLat; t: number }[] {
  const segs: number[] = []
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const d = haversine(path[i - 1], path[i])
    segs.push(d)
    total += d
  }
  const out: { p: LngLat; t: number }[] = []
  let acc = 0
  for (let i = 1; i < path.length; i++) {
    const d = segs[i - 1]
    const n = Math.max(1, Math.ceil(d / step))
    for (let k = 0; k < n; k++) {
      const f = k / n
      const p: LngLat = [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f]
      out.push({ p, t: (acc + d * f) / total })
    }
    acc += d
  }
  out.push({ p: path[path.length - 1], t: 1 })
  return out
}

export function pathLengthKm(path: LngLat[]) {
  let total = 0
  for (let i = 1; i < path.length; i++) total += haversine(path[i - 1], path[i])
  return total / 1000
}

/** Ordered cells a route passes through, with the fraction of the trip at which each is reached. */
export function routeCells(path: LngLat[]): { cell: string; t: number }[] {
  const seen = new Map<string, number>()
  for (const { p, t } of samplePath(path, 15)) {
    const c = latLngToCell(p[1], p[0], RES)
    if (!seen.has(c)) seen.set(c, t)
  }
  return [...seen.entries()].map(([cell, t]) => ({ cell, t }))
}

export function cellAt(lng: number, lat: number) {
  return latLngToCell(lat, lng, RES)
}

export function neighbours(cell: string) {
  return gridDisk(cell, 1).filter((c) => c !== cell)
}

export function cellPolygon(cell: string): LngLat[] {
  const ring = cellToBoundary(cell, true) as LngLat[]
  return ring
}

export function cellCenter(cell: string): LngLat {
  const [lat, lng] = cellToLatLng(cell)
  return [lng, lat]
}

export function cellsFeatureCollection(cells: Iterable<string>, props: (c: string) => Record<string, unknown> = () => ({})) {
  const features = [] as any[]
  for (const c of cells) {
    features.push({ type: 'Feature', properties: { h3: c, ...props(c) }, geometry: { type: 'Polygon', coordinates: [cellPolygon(c)] } })
  }
  return { type: 'FeatureCollection', features }
}

export function lineFeature(path: LngLat[]) {
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: path } }] }
}

export function interpolateAlong(path: LngLat[], t: number): LngLat {
  const pts = samplePath(path, 10)
  let best = pts[0]
  for (const s of pts) {
    if (s.t <= t) best = s
    else break
  }
  return best.p
}
