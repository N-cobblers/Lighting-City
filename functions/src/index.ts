import { initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { applyTrip, cityDisplay, dayKey, hourKey, isOffpeak, monthKey, parseTripInput, taipeiTime, type TripInput } from './offpeak.js'

initializeApp()
const db = getFirestore()

export type RecordTripResult = {
  offpeak: boolean
  /** 這趟新算進錯峰之光的格子數（同一格一天只算一次，一趟最多 40 格） */
  counted: number
  /** 這趟超過每趟上限、沒有算進錯峰之光的格子數（照樣發光，不留到下一趟） */
  capped: number
  /** 這趟新換到的和泰 Points */
  newPoints: number
  monthLight: number
  monthPoints: number
  /** 同一個行程編號重送時為 true，結果和第一次相同、不重複計點 */
  duplicate?: boolean
}

/**
 * 記一趟行程：判斷是否錯峰、累積錯峰之光、換和泰 Points，並更新去識別化的城市錯峰人數。
 *
 * 正式版不會讓乘客自己報行程：行程完成時由 yoxi 自己的行程系統寫入（觸發器），時間、上車行政區都以行程紀錄為準。
 * 這個 callable 是原型的替身，讓 App 用模擬行程示範整個流程；帳本只有這裡能寫，App 只能讀自己的（見 firestore.rules）。
 *
 * Firestore 結構：
 * - users/{uid}/offpeakTrips/{tripId}：每趟一筆，行程編號重送只算一次
 * - users/{uid}/days/{yyyy-mm-dd}：當天算過的格子（同一格一天一次）與算過的城市時段（同一人同一時段只算一人）
 * - users/{uid}/months/{yyyy-mm}：本月錯峰之光與 Points（每趟最多 2 點、每月上限 20 點）
 * - cityCounts/{行政區}_{yyyymmddHH}：錯峰人數原始值，只有伺服器能讀寫
 * - cityPublic/{行政區}_{yyyymmddHH}：公開值，不到 20 人為 null，否則四捨五入到 10
 */
export const recordTrip = onCall({ region: 'asia-east1' }, async (req): Promise<RecordTripResult> => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', '要先登入（匿名登入也可以）')
  let input: TripInput
  try {
    input = parseTripInput(req.data)
  } catch (e) {
    throw new HttpsError('invalid-argument', (e as Error).message)
  }
  const requestedMs = Date.parse(input.requestedAt)
  const t = taipeiTime(requestedMs)
  const offpeak = isOffpeak(t, input.reserved)
  const cityId = `${input.district}_${hourKey(t)}`
  const user = db.collection('users').doc(uid)
  const tripRef = user.collection('offpeakTrips').doc(input.tripId)
  const dayRef = user.collection('days').doc(dayKey(t))
  const monthRef = user.collection('months').doc(monthKey(t))
  const cityRef = db.collection('cityCounts').doc(cityId)
  const publicRef = db.collection('cityPublic').doc(cityId)
  const trip = { district: input.district, requestedAt: Timestamp.fromMillis(requestedMs), reserved: input.reserved, offpeak }

  return db.runTransaction(async (tx) => {
    // 交易裡要先讀完再寫
    const tripSnap = await tx.get(tripRef)
    if (tripSnap.exists) return { ...(tripSnap.get('result') as RecordTripResult), duplicate: true }
    const monthSnap = await tx.get(monthRef)
    const month = { light: Number(monthSnap.get('light') ?? 0), points: Number(monthSnap.get('points') ?? 0) }

    if (!offpeak) {
      const result: RecordTripResult = { offpeak: false, counted: 0, capped: 0, newPoints: 0, monthLight: month.light, monthPoints: month.points }
      tx.create(tripRef, { ...trip, cells: [], result, createdAt: FieldValue.serverTimestamp() })
      return result
    }

    const daySnap = await tx.get(dayRef)
    const citySnap = await tx.get(cityRef)
    const dayCells: string[] = daySnap.get('cells') ?? []
    const cityHours: string[] = daySnap.get('cityHours') ?? []
    const next = applyTrip(month, dayCells, input.cells)
    const result: RecordTripResult = { offpeak: true, counted: next.counted, capped: next.capped, newPoints: next.newPoints, monthLight: next.light, monthPoints: next.points }
    const firstInHour = !cityHours.includes(cityId)

    tx.set(dayRef, { cells: [...dayCells, ...next.fresh], cityHours: firstInHour ? [...cityHours, cityId] : cityHours, updatedAt: FieldValue.serverTimestamp() })
    tx.set(monthRef, { light: next.light, points: next.points, updatedAt: FieldValue.serverTimestamp() })
    tx.create(tripRef, { ...trip, cells: next.fresh, result, createdAt: FieldValue.serverTimestamp() })
    if (firstInHour) {
      // 錯峰「人數」：同一個人同一個行政區同一小時只算一次
      const riders = Number(citySnap.get('riders') ?? 0) + 1
      tx.set(cityRef, { district: input.district, hour: hourKey(t), riders, updatedAt: FieldValue.serverTimestamp() })
      tx.set(publicRef, { district: input.district, hour: hourKey(t), display: cityDisplay(riders), updatedAt: FieldValue.serverTimestamp() })
    }
    return result
  })
})
