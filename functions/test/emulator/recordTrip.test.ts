import { beforeAll, describe, expect, it } from 'vitest'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

// 在 firebase emulators:exec 底下執行（見 package.json 的 test:emulator）；Admin SDK 會讀 FIRESTORE_EMULATOR_HOST 連到模擬器。
const PROJECT = 'demo-lighting-city'
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`
const FN = `http://127.0.0.1:5001/${PROJECT}/asia-east1/recordTrip`

const cell = (i: number) => `89${i.toString(16).padStart(13, '0')}`
const cells = (from: number, n: number) => Array.from({ length: n }, (_, i) => cell(from + i))

type Result = { offpeak: boolean; counted: number; newPoints: number; monthLight: number; monthPoints: number; duplicate?: boolean }
type CallError = Error & { status?: string }

let db: Firestore

async function signIn() {
  const r = await fetch(AUTH, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) })
  const j = (await r.json()) as { idToken: string; localId: string }
  return { token: j.idToken, uid: j.localId }
}

async function recordTrip(token: string | null, data: unknown): Promise<Result> {
  const r = await fetch(FN, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ data }),
  })
  const j = (await r.json()) as { result?: Result; error?: { message: string; status: string } }
  if (j.error) throw Object.assign(new Error(j.error.message), { status: j.error.status }) as CallError
  return j.result!
}

const trip = (tripId: string, requestedAt: string, cellList: string[], extra: Record<string, unknown> = {}) => ({ tripId, district: '信義區', requestedAt, reserved: false, cells: cellList, ...extra })

beforeAll(() => {
  if (!getApps().length) initializeApp({ projectId: PROJECT })
  db = getFirestore()
})

describe('recordTrip', () => {
  it('沒登入會被拒絕', async () => {
    await expect(recordTrip(null, trip('t-anon', '2026-10-13T19:05:00+08:00', cells(0, 3)))).rejects.toMatchObject({ status: 'UNAUTHENTICATED' })
  })

  it('格式不對會被拒絕', async () => {
    const { token } = await signIn()
    await expect(recordTrip(token, trip('t-bad', '2026-10-13T19:05:00+08:00', cells(0, 3), { district: '板橋區' }))).rejects.toMatchObject({ status: 'INVALID_ARGUMENT' })
  })

  it('平日 18 點現在叫車不算錯峰', async () => {
    const { token } = await signIn()
    const r = await recordTrip(token, trip('t-peak', '2026-10-13T18:05:00+08:00', cells(0, 12)))
    expect(r).toMatchObject({ offpeak: false, counted: 0, newPoints: 0, monthLight: 0 })
  })

  it('同一個行程編號重送只算一次', async () => {
    const { token, uid } = await signIn()
    const first = await recordTrip(token, trip('t-dup', '2026-10-13T19:05:00+08:00', cells(0, 12)))
    expect(first).toMatchObject({ offpeak: true, counted: 12, monthLight: 12 })
    const again = await recordTrip(token, trip('t-dup', '2026-10-13T19:05:00+08:00', cells(0, 12)))
    expect(again).toMatchObject({ duplicate: true, counted: 12, monthLight: 12 })
    const month = await db.doc(`users/${uid}/months/2026-10`).get()
    expect(month.get('light')).toBe(12)
  })

  it('同一格一天只算一次，隔天可以再算', async () => {
    const { token } = await signIn()
    expect((await recordTrip(token, trip('t-a', '2026-10-13T19:05:00+08:00', cells(0, 10)))).counted).toBe(10)
    expect((await recordTrip(token, trip('t-b', '2026-10-13T19:40:00+08:00', cells(5, 10)))).counted).toBe(5)
    const nextDay = await recordTrip(token, trip('t-c', '2026-10-14T19:05:00+08:00', cells(0, 10)))
    expect(nextDay).toMatchObject({ counted: 10, monthLight: 25, monthPoints: 1 })
  })

  it('每 20 格換 1 點，每月最多 20 點', async () => {
    const { token, uid } = await signIn()
    let last: Result | null = null
    for (let d = 1; d <= 6; d++) {
      last = await recordTrip(token, trip(`t-cap-${d}`, `2026-10-0${d}T09:00:00+08:00`, cells(0, 80), { reserved: true }))
    }
    expect(last).toMatchObject({ monthLight: 480, monthPoints: 20, newPoints: 0 })
    const month = await db.doc(`users/${uid}/months/2026-10`).get()
    expect(month.get('points')).toBe(20)
  })

  it('城市人數不到 20 不公開，23 人顯示 20；同一人同一小時只算一人', async () => {
    const hourTrip = (id: string) => ({ tripId: id, district: '大安區', requestedAt: '2026-10-14T19:10:00+08:00', reserved: false, cells: cells(0, 3) })
    const users = await Promise.all(Array.from({ length: 23 }, () => signIn()))
    for (let i = 0; i < 19; i++) await recordTrip(users[i].token, hourTrip(`t-city-${i}`))
    await recordTrip(users[0].token, hourTrip('t-city-0b'))
    const at19 = await db.doc('cityPublic/大安區_2026101419').get()
    expect(at19.get('display')).toBeNull()
    expect((await db.doc('cityCounts/大安區_2026101419').get()).get('riders')).toBe(19)
    for (let i = 19; i < 23; i++) await recordTrip(users[i].token, hourTrip(`t-city-${i}`))
    expect((await db.doc('cityPublic/大安區_2026101419').get()).get('display')).toBe(20)
    expect((await db.doc('cityCounts/大安區_2026101419').get()).get('riders')).toBe(23)
  })
})
