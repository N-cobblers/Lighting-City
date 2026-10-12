import { ensureUser, getFirebase } from './firebase'
import type { Settings } from './settings'
import type { Player } from './types'

export const BOTS = (lucky: number): Player[] => [
  { uid: 'bot-an', name: '小安', sum: lucky + 2, diff: 2, plateMasked: 'TDX-51**', palette: '天藍', updatedAt: Date.now() - 3600_000, bot: true },
  { uid: 'bot-zhe', name: '阿哲', sum: lucky - 3, diff: 3, plateMasked: 'TDX-30**', palette: '薄荷', updatedAt: Date.now() - 7200_000, bot: true },
  { uid: 'bot-mia', name: 'Mia', sum: lucky + 5, diff: 5, plateMasked: 'TDX-88**', palette: '橘光', updatedAt: Date.now() - 9000_000, bot: true },
]

export type RoomHandle = { live: boolean; uid: string | null; stop: () => void; submit: (p: Omit<Player, 'uid' | 'updatedAt'>) => Promise<boolean> }

const dayKey = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

/** 好友排行：Firestore rooms/{room}-{日期}/players/{uid}，即時同步；連不上時回傳 live=false，畫面改用示範好友。 */
export async function joinRoom(settings: Settings, onPlayers: (players: Player[]) => void): Promise<RoomHandle> {
  const offline: RoomHandle = { live: false, uid: null, stop: () => {}, submit: async () => false }
  if (settings.forceDemo) return offline
  const fb = await getFirebase(settings)
  if (!fb) return offline
  const user = await ensureUser(settings)
  if (!user) return offline
  try {
    const { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } = await import('firebase/firestore')
    const db = getFirestore(fb.app)
    const roomId = `${(settings.room || 'demo').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30) || 'demo'}-${dayKey(new Date())}`
    const col = collection(db, 'rooms', roomId, 'players')
    const stop = onSnapshot(
      col,
      (snap) => {
        const players: Player[] = snap.docs.map((d) => {
          const x = d.data() as any
          return { uid: d.id, name: String(x.name || '玩家'), sum: typeof x.sum === 'number' ? x.sum : null, diff: typeof x.diff === 'number' ? x.diff : null, plateMasked: x.plateMasked, palette: x.palette, updatedAt: x.updatedAt?.toMillis?.() ?? Date.now() }
        })
        onPlayers(players)
      },
      (err) => console.warn('[firestore] snapshot error', err),
    )
    return {
      live: true,
      uid: user.uid,
      stop,
      submit: async (p) => {
        try {
          await setDoc(doc(col, user.uid), { ...p, updatedAt: serverTimestamp() }, { merge: true })
          return true
        } catch (e) {
          console.warn('[firestore] write failed', e)
          return false
        }
      },
    }
  } catch (e) {
    console.warn('[firestore] join failed', e)
    return offline
  }
}
