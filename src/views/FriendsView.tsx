import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { BOTS, joinRoom, type RoomHandle } from '../lib/social'
import type { Settings } from '../lib/settings'
import { readJSON, writeJSON } from '../lib/settings'
import type { Player } from '../lib/types'
import { SpriteAvatar } from './SpriteAvatar'
import { SPRITE_PALETTES } from '../lib/lucky'

let handle: RoomHandle | null = null
let joining: Promise<RoomHandle> | null = null
let latest: Player[] = []
const subs = new Set<(p: Player[]) => void>()

function connect(settings: Settings) {
  if (handle) return Promise.resolve(handle)
  if (!joining) {
    joining = joinRoom(settings, (players) => {
      latest = players
      subs.forEach((f) => f(players))
    }).then((h) => {
      handle = h
      return h
    })
  }
  return joining
}

const bestKey = () => `yoxi-lighting-city:best:${new Date().toISOString().slice(0, 10)}`

export async function ensureSubmit(settings: Settings, p: { name: string; sum: number; diff: number; plateMasked: string; palette: string }) {
  const prev = readJSON<{ diff: number } | null>(bestKey(), null)
  if (prev && prev.diff <= p.diff) return
  writeJSON(bestKey(), p)
  const h = await connect(settings)
  if (h.live) await h.submit(p)
}

export function FriendsView() {
  const s = useStore()
  const [players, setPlayers] = useState<Player[]>(latest)
  const [live, setLive] = useState<boolean | null>(handle ? handle.live : null)
  const [name, setName] = useState(s.settings.nickname)
  const mine = readJSON<{ sum: number; diff: number; plateMasked: string; palette: string } | null>(bestKey(), null)

  useEffect(() => {
    subs.add(setPlayers)
    connect(s.settings).then((h) => setLive(h.live))
    return () => {
      subs.delete(setPlayers)
    }
  }, [s.settings])

  const board = useMemo(() => {
    const myUid = handle?.uid
    const rows: (Player & { me?: boolean })[] = players.map((p) => ({ ...p, me: p.uid === myUid, diff: p.sum === null ? null : Math.abs(p.sum - s.lucky) }))
    if (!rows.some((r) => r.me) && mine) rows.push({ uid: 'me', name: s.settings.nickname || '我', sum: mine.sum, diff: Math.abs(mine.sum - s.lucky), plateMasked: mine.plateMasked, palette: mine.palette, updatedAt: Date.now(), me: true })
    if (rows.filter((r) => !r.me).length < 3) rows.push(...BOTS(s.lucky).slice(0, 3 - rows.filter((r) => !r.me).length))
    return rows.sort((a, b) => (a.diff ?? 99) - (b.diff ?? 99) || a.updatedAt - b.updatedAt)
  }, [players, mine, s.lucky, s.settings.nickname])

  const saveName = () => {
    s.updateSettings({ nickname: name.trim().slice(0, 12) })
    s.toast('暱稱已更新')
  }

  return (
    <div className="friends-view scroll">
      <section className="lucky-card">
        <span className="muted">今日幸運數字</span>
        <strong className="lucky-num">{s.lucky}</strong>
        <span className="muted small">路上遇見 yoxi 車，車牌四個數字加總最接近的人獲勝</span>
      </section>

      <section className="card">
        <div className="card-head">
          <strong>好友排行</strong>
          <span className={live ? 'live-tag' : 'demo-tag'}>{live === null ? '連線中' : live ? `即時連線・房間 ${s.settings.room}` : '示範好友（Firestore 未連線）'}</span>
        </div>
        <ol className="board">
          {board.map((p, i) => (
            <li key={p.uid} className={p.me ? 'me' : ''}>
              <span className="rank">{i + 1}</span>
              <SpriteAvatar size={30} palette={SPRITE_PALETTES.find((x) => x.name === p.palette) || SPRITE_PALETTES[0]} />
              <span className="who">
                {p.me ? `${p.name}（你）` : p.name}
                {p.bot && <em className="bot">示範</em>}
              </span>
              <span className="score">{p.sum === null ? '還沒拍' : `${p.sum}　差 ${p.diff}`}</span>
            </li>
          ))}
        </ol>
        {!mine && <p className="muted small">你今天還沒遇到 yoxi 車，去「拍車」頁試試看。</p>}
      </section>

      <section className="card">
        <strong>小精靈圖鑑</strong>
        {s.collected.length === 0 ? (
          <p className="muted small">還沒有收集到小精靈。每台 yoxi 車的小精靈光色不同。</p>
        ) : (
          <ul className="dex">
            {s.collected.map((c) => (
              <li key={c.at}>
                <SpriteAvatar size={52} palette={SPRITE_PALETTES.find((x) => x.name === c.palette) || SPRITE_PALETTES[0]} />
                <span className="small">{c.title || c.palette}</span>
                <span className="muted tiny">{c.plateMasked}・{c.sum}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <label className="field" htmlFor="nick">
          <span>你的暱稱</span>
          <div className="row">
            <input id="nick" className="input" value={name} placeholder="小涵" onChange={(e) => setName(e.target.value)} />
            <button className="btn-ghost" onClick={saveName}>
              儲存
            </button>
          </div>
        </label>
      </section>
    </div>
  )
}
