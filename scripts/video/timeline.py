"""第三版時間軸：一次只有一個主角（小精靈／App 特寫／全畫面大字／地圖場景），背景統一深藍。
小精靈講話用 talk_<表情>_<嘴型> 序列，依配音音量逐格換嘴型。輸出 out/tl.json、out/sfx.json。用法：python scripts/video/timeline.py"""
import json
import re
import sys
from pathlib import Path

from paths import OUT

SRC = {k: OUT / 'rec' / k for k in ('story', 'chat', 'cover', 'hook', 'turn', 'ending')}
SP2 = OUT / 'sprite'   # render_sprite.py actions
SP3 = OUT / 'sprite3'  # render_sprite.py actions3（講話對嘴、卡通動作）
FPS, TRANS = 30, 0.35

LINES = json.loads((OUT / 'tts' / 'lines.json').read_text(encoding='utf-8'))
GAP = {'S1': 1.0, 'N1': 2.7, 'N2': 0.4, 'N3': 0.4, 'N4': 0.6, 'S2': 0.8, 'S3': 0.35, 'S4': 0.35, 'S5': 0.35, 'S6': 0.6, 'S7': 0.6,
       'S8': 0.6, 'S9': 0.3, 'S10': 0.6, 'S11': 0.25, 'N12': 0.7, 'N13': 0.9, 'N14': 0.5, 'S12': 0.3, 'N15': 0.5, 'N16': 0.45,
       'N17': 0.7, 'N18': 0.4, 'N19': 0.45, 'N20': 4.4, 'S13': 0.5}
TAIL = 2.3
E, t = {}, 0.0
for eid in LINES:
    t += GAP.get(eid, 0.4)
    E[eid] = {'t0': round(t, 3), 't1': round(t + LINES[eid]['dur'], 3)}
    t += LINES[eid]['dur']
TOTAL = round(t + TAIL, 3)
ch = lambda eid, k: E[eid]['t0'] + LINES[eid]['chunks'][k]['start']
che = lambda eid, k: E[eid]['t0'] + LINES[eid]['chunks'][k]['end']


def src_index(d):
    frames = json.loads((d / 'frames.json').read_text(encoding='utf-8'))
    m = json.loads((d / 'markers.json').read_text(encoding='utf-8'))
    meta = d / 'scene_meta.json'
    sp = json.loads(meta.read_text(encoding='utf-8'))['speed'] if meta.exists() else 1.0
    t0 = frames[0][1]
    if sp != 1.0:
        frames = [[f[0], t0 + (f[1] - t0) * sp] for f in frames]
        m['markers'] = [[n, t0 + (tt - t0) * sp] for n, tt in m['markers']]
    marks = {name: round(tt - t0, 3) for name, tt in m['markers']}
    return {'dir': (d / 'frames').as_uri() + '/', 'ts': [round(f[1] - t0, 3) for f in frames], 'files': [f[0] for f in frames]}, marks


SOURCES, M = {}, {}
for k, d in SRC.items():
    SOURCES[k], M[k] = src_index(d)
ms, mc = M['story'], M['chat']

# 小精靈序列：第三版的有就用，沒有就用第二版代替（排版測試用）
SPRITE = {}


def seq(name, fallback):
    for base, nm in ((SP3, name), (SP2, fallback)):
        d = base / nm
        n = len(list(d.glob('*.png'))) if d.exists() else 0
        if n:
            SPRITE[name] = {'dir': d.as_uri() + '/', 'n': n}
            return


for e_ in ['happy', 'excited', 'worried', 'surprised']:
    for m_ in range(3):
        seq(f'talk_{e_}_{m_}', 'hello')
for name, fb in [('enter', 'pop'), ('cheer', 'cheer'), ('wave', 'hello'), ('bye', 'bye'), ('fly_loop', 'fly_loop')]:
    seq(name, fb)

shots, subs, sfx = [], [], []
S = lambda name, tt: sfx.append([round(tt, 3), name])
clip = lambda *pairs: [[round(a, 3), round(b, 3)] for a, b in pairs]
HL = re.compile(r'(NT\$[\d.]+|\d+(?:\.\d+)?\s?(?:%|分鐘|秒|點|格|趟)?|「[^」]+」)')
hl = lambda s: HL.sub(lambda m: f'<b>{m.group(0)}</b>', s)


def shot(id_, t0, t1, **kw):
    shots.append(dict(id=id_, t0=round(t0, 3), t1=round(t1, 3), bg='navy', dark=True, **kw))


def T(t, x, y, html, cls, **kw):
    return dict(t=round(t, 3), x=x, y=y, html=html, cls=cls, anchor=kw.pop('anchor', 'center'), **kw)


def add_subs(eid, k_from=0, k_to=None):
    for c in LINES[eid]['chunks'][k_from:k_to]:
        subs.append({'t0': round(E[eid]['t0'] + c['start'], 3), 't1': round(E[eid]['t0'] + c['end'] + 0.06, 3), 'who': LINES[eid]['who'], 'html': hl(c['text'])})


def talk(eid, t_from, t_to, x=620, y=560, scale=1.72, enter=False):
    """小精靈講話：依配音音量逐格換嘴型（嘴型在 stage.html 依 env 挑）"""
    env = LINES[eid].get('env', [])
    sp = dict(action='talk', expr=LINES[eid]['expr'] or 'happy', t=round(t_from, 3), loop=True, env=env, envT0=round(E[eid]['t0'], 3),
              path=[[t_from, x, y, scale]])
    if enter:
        sp['path'] = [[t_from, x, y + 260, scale * 0.6], [t_from + 0.5, x, y, scale]]
        sp['bounce'] = True
    return sp


def sprite_shot(id_, eid, t0, t1, text, k=None, enter=True):
    """小精靈當主角：左邊大大的小精靈，右邊一句大字"""
    sps = [dict(talk(eid, 0.767 if enter else 0, t1 - t0), envT0=round(E[eid]['t0'] - t0, 3))]
    if enter:
        sps.insert(0, dict(action='enter', t=0.0, skip=7, until=0.767, path=[[0, 620, 560, 1.72]]))
    shot(id_, t0, t1, sprites=sps,
         texts=[T(0.15, 1360, 540, text, 't-head', w=820, vcenter=True)])
    S('boing', t0 + 0.05)


def phone(src, clp, pose, focus=None):
    return dict(src=src, clip=clp, pose=pose, focus=focus or [[0, 0, .5, .5, 960, 500]])


P0 = (960, 500, 0.82)  # App 特寫：手機置中、固定姿勢


def still(d):
    return [[0, *P0, 0], [d, *P0, 0]]


def push(d, a, b, fx, fy, sc=1.45):
    """在 a～b 秒推近到螢幕上的 (fx, fy)，之後拉回"""
    pose = [[0, *P0, 0], [a, *P0, 0], [a + 0.6, P0[0], P0[1], sc, 0], [b, P0[0], P0[1], sc, 0], [b + 0.6, *P0, 0], [max(d, b + 0.7), *P0, 0]]
    focus = [[0, 0, fx, fy, 960, 500], [a, 0, fx, fy, 960, 500], [a + 0.6, 1, fx, fy, 960, 500], [b, 1, fx, fy, 960, 500], [b + 0.6, 0, fx, fy, 960, 500]]
    return pose, focus


# ===== 1 封面：黑 → 閃光 → 小精靈彈出打招呼 → 片名 =====
mcv, mh, mt, me = M['cover'], M['hook'], M['turn'], M['ending']
title_t = E['S1']['t1'] + 0.25
c_end = E['N1']['t0'] - 0.3
shot('cover', 0, c_end, scene={'src': 'cover', 'clip': clip((0, mcv['start']), (c_end, mcv['start'] + c_end)), 'scrim': [[0, 0], [title_t - 0.3, 0], [title_t + 0.5, 0.4]], 'zoom': [[0, 1.0], [c_end, 1.04]]},
     sprites=[dict(action='enter', t=0.62, skip=7, until=0.62 + 0.767, path=[[0, 620, 560, 1.72]]),
              dict(talk('S1', 0.62 + 0.767, title_t), envT0=E['S1']['t0'], out=title_t - 0.1)],
     texts=[T(E['S1']['t0'] - 0.3, 1360, 280, '', 't-shade', out=title_t - 0.15),
            T(E['S1']['t0'] - 0.1, 1360, 540, '嗨～我是住在<br>yoxi 車燈裡的小精靈！', 't-head', w=820, vcenter=True, out=title_t - 0.15),
            T(title_t - 0.2, 960, 250, '', 't-shade'),
            T(title_t, 960, 400, '<b>yoxi</b>點燈城', 't-hero', pop=True),
            T(title_t + 0.45, 960, 590, '平常點燈，出門不用賭', 't-tagline')])
S('flash', 0.55)
S('boing', 0.66)
S('impact', title_t)
flash = [[0, 0], [0.5, 0], [0.62, 1], [1.25, 0]]

# ===== 2 痛點：全畫面數字（不放字幕）=====
h0, h1 = E['N1']['t0'] - 0.3, E['N4']['t0'] - 0.3
shot('hook', h0, h1, scene={'src': 'hook', 'clip': clip((0, mh['start'] + 0.3), (h1 - h0, mh['start'] + 0.3 + (h1 - h0))),
                            'scrim': [[0, 0.35], [E['N3']['t0'] - h0, 0.35], [E['N3']['t1'] - h0, 0.75]]},
     texts=[T(ch('N1', 1) - h0 - 0.25, 960, 250, '0%', 't-num', count=[0, 89, 0, '%'], countDur=1.0, out=E['N2']['t0'] - h0 - 0.25),
            T(ch('N1', 1) - h0 + 0.5, 960, 560, '當月有搭 yoxi 的人，有 89% 的日子沒有搭車', 't-cap', out=E['N2']['t0'] - h0 - 0.25),
            T(ch('N1', 1) - h0 + 0.8, 960, 640, '資料：yoxi 競賽資料 2026/2/1–4/30（彙總分析）', 't-src', out=E['N2']['t0'] - h0 - 0.25),
            T(E['N2']['t0'] - h0, 960, 250, '0%', 't-num', count=[0, 33, 0, '%'], countDur=0.8, out=E['N3']['t0'] - h0 - 0.2),
            T(E['N2']['t0'] - h0 + 0.5, 960, 560, '三個月只搭過 1 次', 't-cap', out=E['N3']['t0'] - h0 - 0.2),
            T(E['N3']['t0'] - h0, 960, 480, '叫車 App，只在要出門時被打開', 't-head', out=E['N3']['t1'] - h0 + 0.3)])
S('tick', ch('N1', 1) - 0.25)
S('tick', E['N2']['t0'])

# ===== 3 轉折：光軌劃過城市 =====
u0, u1 = E['N4']['t0'] - 0.3, E['S2']['t0'] - 0.45
shot('turn', u0, u1, scene={'src': 'turn', 'clip': clip((0, mt['start']), (u1 - u0, mt['start'] + (u1 - u0))), 'zoom': [[0, 1.0], [u1 - u0, 1.04]]},
     texts=[T(0.1, 960, 300, '', 't-shade'), T(ch('N4', 1) - u0, 960, 430, '讓不搭車的日子，<br>也有每天打開的理由', 't-head')])
S('whoosh', u0)

# ===== 4 早上：小精靈打招呼 → App（地圖 → 預報推近 → 晚點走）=====
sprite_shot('hello', 'S2', E['S2']['t0'] - 0.45, E['S3']['t0'] - 0.3, '早安！<br>一起過小涵的一天吧！')
a0, a1 = E['S3']['t0'] - 0.3, E['S6']['t0'] - 0.35
A = lambda x: x - a0
clipm = clip((0, ms['morning_map'] - 0.6), (A(E['S4']['t0']) - 0.55, ms['chat_open'] - 0.35), (A(E['S4']['t0']) + 0.2, ms['chat_open'] + 0.7),
             (A(E['S5']['t0']) - 0.3, ms['later_tapped'] - 0.4), (a1 - a0, ms['later_card'] + 3.0))
pz = push(a1 - a0, A(E['S4']['t0']) + 0.15, A(E['S5']['t0']) - 0.4, .5, .2)
shot('morning', a0, a1, phones=[phone('story', clipm, *pz)])
for e in ('S3', 'S4', 'S5'):
    add_subs(e)
S('zoom', a0 + A(E['S4']['t0']) + 0.15)

# ===== 5 三人並排（乾淨版）=====
r0, r1 = E['S6']['t0'] - 0.35, E['S7']['t0'] - 0.35
d3 = r1 - r0
shot('trio', r0, r1, phones=[dict(src='story', label='小涵・<b>信義區</b>', labelAt=0.4, clip=clip((0, ms['morning_map'] + 0.5), (d3, ms['morning_map'] + 4.5)), pose=[[0, 500, 470, 0.6, 0], [d3, 500, 470, 0.6, 0]]),
                            dict(src='story', label='阿哲・<b>板橋</b>', labelAt=0.6, clip=clip((0, ms['persona_阿哲'] + 1.8), (d3, ms['persona_阿哲'] + 5.0)), pose=[[0, 960, 470, 0.6, 0], [d3, 960, 470, 0.6, 0]]),
                            dict(src='story', label='小雅・<b>淡水</b>', labelAt=0.8, clip=clip((0, ms['persona_小雅'] + 1.8), (d3, ms['persona_小雅'] + 4.6)), pose=[[0, 1420, 470, 0.6, 0], [d3, 1420, 470, 0.6, 0]])])
add_subs('S6')

# ===== 6 午休：小精靈一句 → App 格子亮起 =====
n_s = E['S7']['t0'] - 0.35
n_cut = che('S7', 0) + 0.1
sprite_shot('noon_s', 'S7', n_s, n_cut, '午休散步到<br>101 旁的四四南村')
n1 = E['S8']['t0'] - 0.35
wd = ms['walk_done']
clipn = clip((0, wd - 1.2), (n1 - n_cut, wd + (n1 - n_cut) - 1.2))
pzn = push(n1 - n_cut, 0.7, n1 - n_cut - 0.2, .45, .3, 1.4)
shot('noon', n_cut, n1, phones=[phone('story', clipn, *pzn)])
add_subs('S7', 1)
S('ding', n_cut + 1.6)

# ===== 7 拍車：小精靈驚訝 → App 拍車、跳出、好友排行 =====
s_s = E['S8']['t0'] - 0.35
s_cut = che('S8', 0) + 0.1
sprite_shot('scan_s', 'S8', s_s, s_cut, '哇！<br>路上有 yoxi 車！')
s1 = E['S10']['t0'] - 0.35
clips_ = clip((0, ms['scan_shot'] - 1.3), (E['S9']['t0'] - s_cut - 0.2, ms['scan_shot'] + 3.2), (ch('S9', 1) - s_cut - 0.2, ms['friends'] - 0.2), (s1 - s_cut, ms['friends'] + 4.0))
pzs = push(s1 - s_cut, 0.9, E['S9']['t0'] - s_cut - 0.4, .5, .33, 1.4)
shot('scan', s_cut, s1, phones=[phone('story', clips_, *pzs)])
add_subs('S8', 1)
add_subs('S9')
S('shutter', s_cut + 1.3)
S('sparkle', s_cut + 2.0)

# ===== 8 傍晚：小精靈一句 → App 錯峰回家、換到 Points → 小精靈歡呼 =====
v_s = E['S10']['t0'] - 0.35
v_cut = che('S10', 0) + 0.1
sprite_shot('eve_s', 'S10', v_s, v_cut, '傍晚，<br>照計畫晚點走')
v_ch = che('S11', 0) + 0.1
pt_local = (E['S11']['t0'] - 0.2) - v_cut  # 換到 Points 的瞬間，對上「耶～」
clipv = clip((0, ms['ride_start'] - 1.0), (pt_local, ms['points'] + 0.05), (v_ch - v_cut, ms['points'] + 0.05 + (v_ch - v_cut - pt_local)))
pzv = push(v_ch - v_cut, pt_local - 0.3, v_ch - v_cut, .38, .78, 1.4)
shot('evening', v_cut, v_ch, phones=[phone('story', clipv, *pzv)])
add_subs('S10', 1)
add_subs('S11', 0, 1)
S('chime', v_cut + pt_local)
c1 = E['N12']['t0'] - 0.35
shot('cheer', v_ch, c1, sprites=[dict(action='cheer', t=0.0, loop=True, path=[[0, 620, 560, 1.72]])],
     texts=[T(0.1, 1360, 420, '+1', 't-num'), T(0.35, 1360, 700, '和泰 Points', 't-head')])
S('cheer', v_ch + 0.05)

# ===== 9 對比：左右分割（乾淨版，不放字幕）=====
sp0, sp1 = c1, E['N13']['t0'] - 0.4
shot('split', sp0, sp1,
     split=[dict(when='18:00 現在叫車', bg='linear-gradient(160deg,#4a2238,#24142c)', secs=640, run=ch('N12', 1) - sp0 + 1.6, t=0.3, arrives=False, stat='25%', color='#FF9A8A', label='等超過 10 分鐘'),
            dict(when='19:00 預約', bg='linear-gradient(160deg,#173a5e,#0e1830)', secs=372, run=ch('N12', 2) - sp0 - 0.2, t=0.3, arrives=True, stat='11%', color='#FFC94A', label='等超過 10 分鐘')],
     texts=[T(0.6, 960, 1010, '信義區平日・yoxi 競賽資料 2026/2–4 彙總', 't-src')])
S('tick', sp0 + 0.4)

# ===== 10 AI：大字 → 數字 → App 對話 → 小精靈 → 數字 → 大字 =====
x0, x1 = E['N13']['t0'] - 0.4, ch('N13', 2) - 0.25
shot('ai1', x0, x1, texts=[T(0.3, 960, 420, '背後有三個 AI', 't-head'), T(ch('N13', 1) - x0, 960, 560, '① 等車預測：LightGBM', 't-cap')])
y1 = E['N14']['t0'] - 0.35
shot('ai1n', x1, y1, texts=[T(0.15, 610, 260, '0%', 't-num', count=[0, -8, 0, '%'], countDur=0.8), T(0.45, 610, 560, '逐時等車誤差', 't-cap'),
                             T(ch('N13', 3) - x1, 1310, 260, '0%', 't-num', count=[0, -16, 0, '%'], countDur=0.8), T(ch('N13', 3) - x1 + 0.3, 1310, 560, '熱門上車點', 't-cap'),
                             T(ch('N13', 3) - x1 + 0.6, 960, 680, '4 週滾動回測；對照：近 4 週同時段中位數', 't-src')])
S('tick', x1 + 0.15)
S('tick', ch('N13', 3))
k1 = E['S12']['t0'] - 0.3
clipk = clip((0, mc['ask_forecast'] - 0.6), (k1 - y1, mc['propose'] + 2.2))
pzk = push(k1 - y1, 0.5, k1 - y1, .5, .6, 1.35)
shot('tools', y1, k1, phones=[phone('chat', clipk, *pzk)])
add_subs('N14')
sprite_shot('ask_s', 'S12', k1, E['N15']['t0'] - 0.35, '排之前，<br>我一定先問你！')
o0, o1 = E['N15']['t0'] - 0.35, E['N16']['t0'] - 0.35
shot('ocr', o0, o1, texts=[T(0.2, 960, 260, '0.0 秒', 't-num', count=[0, 0.2, 1, ' 秒'], countDur=0.6), T(0.55, 960, 560, '車牌在手機上辨識・照片不上傳', 't-cap')])
q0, q1 = o1, E['N17']['t0'] - 0.35
shot('stack', q0, q1, texts=[T(0.2, 960, 400, '原型已經能用', 't-head'), T(ch('N16', 1) - q0, 960, 540, '正式版：Flutter，做進 yoxi App', 't-cap'),
                             T(ch('N16', 1) - q0 + 0.4, 960, 640, 'React・MapLibre・H3・Firebase・Gemini・LightGBM・ONNX Runtime', 't-src')])

# ===== 11 商業與驗證：全畫面大字 =====
b0, b1 = E['N17']['t0'] - 0.35, E['N18']['t0'] - 0.3
shot('money', b0, b1, texts=[T(0.2, 960, 170, '不發優惠券，用光讓人錯峰', 't-head'),
                             T(ch('N17', 1) - b0, 560, 360, 'NT$0.0', 't-num sm', count=[0, 0.6, 1, '', 'NT$'], countDur=0.8), T(ch('N17', 1) - b0 + 0.3, 560, 580, '一趟錯峰的 Points 成本', 't-cap'),
                             T(ch('N17', 2) - b0, 1360, 360, 'NT$0.0', 't-num sm', count=[0, 26.6, 1, '', 'NT$'], countDur=0.8), T(ch('N17', 2) - b0 + 0.3, 1360, 580, '一趟派遣費（試算）', 't-cap')])
S('tick', ch('N17', 1))
S('tick', ch('N17', 2))
g1 = E['N19']['t0'] - 0.3
shot('peak', b1, g1, texts=[T(0.2, 960, 400, '尖峰變好叫', 't-head'), T(ch('N18', 0) - b1 + 0.8, 960, 540, '乘客少等・司機多跑・yoxi 不用花大錢', 't-cap')])
w1 = E['N19']['t1'] + 0.45
shot('verify', g1, w1, texts=[T(0.2, 960, 400, '北極星：非搭車日開啟率', 't-head'), T(ch('N19', 1) - g1, 960, 540, '錯峰點燈用三組對照驗證：只有光／光＋Points／都沒有', 't-cap')])

# ===== 12 回顧快切 =====
rc_len = (E['N20']['t0'] - 0.55 - w1) / 3
for i, (mk, off, fx, fy) in enumerate([('ride_start', 6.0, .45, .45), ('scan_shot', 0.9, .5, .33), ('points', 0.2, .38, .78)]):
    a, b = w1 + i * rc_len, w1 + (i + 1) * rc_len
    shots.append(dict(id=f'recap{i}', t0=round(a, 3), t1=round(b, 3), bg='navy', dark=True, enter='cut',
                      phones=[dict(src='story', clip=clip((0, ms[mk] + off), (b - a, ms[mk] + off + (b - a))), pose=[[0, 960, 520, 1.6, 0], [b - a, 960, 520, 1.72, 0]],
                                   focus=[[0, 1, fx, fy, 960, 520], [b - a, 1, fx, fy, 960, 520]])]))
    S('whoosh', a)

# ===== 13 結尾：金句 → 小精靈揮手告別 =====
e0 = w1 + 3 * rc_len
s13 = E['S13']['t0'] - 0.45
shot('ending', e0, s13, scene={'src': 'ending', 'clip': clip((0, me['start']), (s13 - e0, me['start'] + (s13 - e0))), 'scrim': [[0, 0], [E['N20']['t0'] - e0 - 0.3, 0], [E['N20']['t0'] - e0 + 0.4, 0.35]]},
     texts=[T(E['N20']['t0'] - e0 - 0.2, 960, 250, '', 't-shade'), T(E['N20']['t0'] - e0, 960, 380, '平常點燈，出門不用賭', 't-tagline'),
            T(E['N20']['t0'] - e0 + 0.9, 960, 520, '<b>yoxi</b>點燈城', 't-hero', pop=True)])
S('impact', E['N20']['t0'])
shot('bye', s13, TOTAL, sprites=[dict(talk('S13', 0, 1.6, enter=False), envT0=round(E['S13']['t0'] - s13, 3), out=1.6),
                                 dict(action='wave', t=1.6, loop=True, out=TOTAL - s13 - 1.4, path=[[1.6, 620, 560, 1.72]]),
                                 dict(action='bye', t=TOTAL - s13 - 1.4, path=[[TOTAL - s13 - 1.4, 620, 560, 1.72]])],
     texts=[T(0.15, 1360, 540, '明天見囉！', 't-head', vcenter=True)])
fade = [[0, 0], [TOTAL - 1.1, 0], [TOTAL, 1]]

face = (SP2 / 'idle' / '0001.png').as_uri()
tl = {'fps': FPS, 'dur': TOTAL, 'trans': TRANS, 'sources': SOURCES, 'sprite': SPRITE, 'shots': shots, 'subs': subs, 'face': face, 'flash': flash, 'fade': fade}
(OUT / 'tl.json').write_text(json.dumps(tl, ensure_ascii=False), encoding='utf-8')
voice = [{'t': E[eid]['t0'], 'file': str(OUT / 'tts' / v['file']), 'who': v['who']} for eid, v in LINES.items()]
(OUT / 'sfx.json').write_text(json.dumps({'total': TOTAL, 'voice': voice, 'sfx': sorted(sfx)}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'total {TOTAL:.2f}s, shots {len(shots)}, subs {len(subs)}, sprite3 {sum(1 for k, v in SPRITE.items() if "sprite3" in v["dir"])}/{len(SPRITE)}')
for s in shots:
    print(f"  {s['id']:8s} {s['t0']:7.2f}–{s['t1']:7.2f}")
