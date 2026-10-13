import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// 在 firebase emulators:exec 底下執行（見 package.json 的 test:emulator）
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-lighting-city',
    firestore: { rules: readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
  })
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users/rules-alice/months/2026-10'), { light: 24, points: 1 })
    await setDoc(doc(db, 'users/rules-alice/offpeakTrips/t1'), { offpeak: true })
    await setDoc(doc(db, 'cityPublic/松山區_2026101319'), { display: 20 })
    await setDoc(doc(db, 'cityCounts/松山區_2026101319'), { riders: 23 })
  })
})

afterAll(async () => {
  await env?.cleanup()
})

describe('錯峰點燈帳本', () => {
  it('可以讀自己的帳本', async () => {
    const db = env.authenticatedContext('rules-alice').firestore()
    await assertSucceeds(getDoc(doc(db, 'users/rules-alice/months/2026-10')))
    await assertSucceeds(getDoc(doc(db, 'users/rules-alice/offpeakTrips/t1')))
  })
  it('不能讀別人的帳本', async () => {
    const db = env.authenticatedContext('rules-bob').firestore()
    await assertFails(getDoc(doc(db, 'users/rules-alice/months/2026-10')))
  })
  it('沒登入不能讀', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'users/rules-alice/months/2026-10')))
  })
  it('連自己的帳本也不能自己寫（只有 Cloud Functions 能寫）', async () => {
    const db = env.authenticatedContext('rules-alice').firestore()
    await assertFails(setDoc(doc(db, 'users/rules-alice/months/2026-10'), { light: 9999, points: 20 }))
    await assertFails(setDoc(doc(db, 'users/rules-alice/offpeakTrips/fake'), { offpeak: true }))
    await assertFails(setDoc(doc(db, 'users/rules-alice/days/2026-10-13'), { cells: [] }))
  })
})

describe('城市錯峰人數', () => {
  it('登入後可以讀公開值，但不能寫', async () => {
    const db = env.authenticatedContext('rules-alice').firestore()
    await assertSucceeds(getDoc(doc(db, 'cityPublic/松山區_2026101319')))
    await assertFails(setDoc(doc(db, 'cityPublic/松山區_2026101319'), { display: 999 }))
  })
  it('沒登入不能讀公開值', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'cityPublic/松山區_2026101319')))
  })
  it('原始人數（cityCounts）誰都不能讀寫', async () => {
    const db = env.authenticatedContext('rules-alice').firestore()
    await assertFails(getDoc(doc(db, 'cityCounts/松山區_2026101319')))
    await assertFails(setDoc(doc(db, 'cityCounts/松山區_2026101319'), { riders: 1 }))
  })
})

describe('好友排行規則照舊', () => {
  it('可以寫自己那一筆、不能寫別人的', async () => {
    const db = env.authenticatedContext('rules-alice').firestore()
    const me = { name: '小涵', sum: 21, diff: 5, plateMasked: 'TDX-39**', palette: '薄荷', updatedAt: 1 }
    await assertSucceeds(setDoc(doc(db, 'rooms/demo-2026-10-13/players/rules-alice'), me))
    await assertFails(setDoc(doc(db, 'rooms/demo-2026-10-13/players/rules-bob'), me))
  })
})
