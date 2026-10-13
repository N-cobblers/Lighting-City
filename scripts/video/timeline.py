"""第二版時間軸：依配音的實際秒數，排出每個鏡頭（手機位置、推近、文字、小精靈、標籤）、字幕與音效。
輸出 out/tl.json（給 stage.html）與 out/sfx.json（給混音）。用法：python scripts/video/timeline.py
來源素材在 SRC 設定：App 錄影（story、chat）、地圖場景、小精靈序列圖。"""
import json
import re
import sys
from pathlib import Path

from paths import OUT

# ---- 素材位置（重錄後改這裡）----
SRC = {
    'story': OUT / 'rec' / 'story',
    'chat': OUT / 'rec' / 'chat',
    'cover': OUT / 'rec' / 'cover',
    'hook': OUT / 'rec' / 'hook',
    'turn': OUT / 'rec' / 'turn',
    'ending': OUT / 'rec' / 'ending',
}
SPRITE_DIR = OUT / 'sprite'  # python scripts/video/sprite/render_sprite.py actions 產生
FPS = 30
TRANS = 0.35

# ---- 配音時間 ----
LINES = json.loads((OUT / 'tts' / 'lines.json').read_text(encoding='utf-8'))
GAP = {'S1': 1.05, 'N1': 2.6, 'N2': 0.35, 'N3': 0.35, 'N4': 0.6, 'N5': 0.75, 'S2': 0.3, 'N6': 0.35, 'N7': 0.65, 'N8': 0.65,
       'N9': 0.65, 'N10': 0.3, 'N11': 0.65, 'S3': 0.25, 'N12': 0.75, 'N13': 0.9, 'N14': 0.5, 'S4': 0.1, 'N15': 0.5, 'N16': 0.45,
       'N17': 0.75, 'N18': 0.35, 'N19': 0.45, 'N20': 4.6, 'S5': 0.45}
TAIL = 2.6
E, t = {}, 0.0
for eid in LINES:
    t += GAP.get(eid, 0.4)
    E[eid] = {'t0': round(t, 3), 't1': round(t + LINES[eid]['dur'], 3)}
    t += LINES[eid]['dur']
TOTAL = round(t + TAIL, 3)


def ch(eid, k):
    """某句第 k 段字幕開始的絕對秒數"""
    return E[eid]['t0'] + LINES[eid]['chunks'][k]['start']


def src_index(d):
    frames = json.loads((d / 'frames.json').read_text(encoding='utf-8'))
    m = json.loads((d / 'markers.json').read_text(encoding='utf-8'))
    meta = d / 'scene_meta.json'
    sp = json.loads(meta.read_text(encoding='utf-8'))['speed'] if meta.exists() else 1.0
    t0 = frames[0][1]
    if sp != 1.0:  # 慢速錄的場景：把錄影時間換算成動畫時間
        frames = [[f[0], t0 + (f[1] - t0) * sp] for f in frames]
        m['markers'] = [[n, t0 + (tt - t0) * sp] for n, tt in m['markers']]
    marks = {name: round(tt - t0, 3) for name, tt in m['markers']}
    return {'dir': (d / 'frames').as_uri() + '/', 'ts': [round(f[1] - t0, 3) for f in frames], 'files': [f[0] for f in frames]}, marks


SOURCES, M = {}, {}
for k, d in SRC.items():
    SOURCES[k], M[k] = src_index(d)
SPRITE = {}
for a in ['pop', 'hello', 'fly', 'fly_loop', 'point', 'cheer', 'bye', 'idle']:
    d = SPRITE_DIR / a
    n = len(list(d.glob('*.png'))) if d.exists() else 0
    if n:
        SPRITE[a] = {'dir': d.as_uri() + '/', 'n': n}

sfx = []  # (秒, 音效名)


def S(name, t):
    sfx.append([round(t, 3), name])


def clip(*pairs):
    """[(本地秒, 來源秒)]"""
    return [[round(a, 3), round(b, 3)] for a, b in pairs]


shots = []


def shot(id_, t0, t1, **kw):
    d = dict(id=id_, t0=round(t0, 3), t1=round(t1, 3), **kw)
    shots.append(d)
    return d


def T(t, x, y, html, cls='t-line', **kw):
    return dict(t=round(t, 3), x=x, y=y, html=html, cls=cls, **kw)


ms, mc, mh, mcv, mt = M['story'], M['chat'], M['hook'], M['cover'], M['turn']

# 1 封面：全黑 → 車燈閃光 → 小精靈彈出打招呼 → 片名重拍登場
title_t = E['S1']['t1'] + 0.15
c_end = E['N1']['t0'] - 0.25
shot('cover', 0, c_end, bg='ink', enter='cut', dark=True,
     scene={'src': 'cover', 'clip': clip((0, mcv['start']), (c_end, mcv['start'] + c_end)), 'scrim': [[0, 0], [title_t - 0.3, 0], [title_t + 0.5, 0.32]], 'zoom': [[0, 1.0], [c_end, 1.04]]},
     sprites=[dict(action='pop', t=0.62, path=[[0.62, 960, 560, 1.5], [title_t - 0.1, 960, 560, 1.5], [title_t + 0.5, 520, 470, 1.15]]),
              dict(action='hello', t=0.62 + 1.6, loop=True, path=[[0, 960, 560, 1.5], [title_t - 0.1, 960, 560, 1.5], [title_t + 0.5, 520, 470, 1.15]])],
     texts=[T(title_t - 0.2, 1130, 190, '', 't-shade', anchor='center'),
            T(title_t, 1130, 330, '<b>yoxi</b>點燈城', 't-hero', anchor='center', pop=True),
            T(title_t + 0.45, 1130, 530, '平常點燈，出門不用賭', 't-tagline', anchor='center')])
S('flash', 0.55)
S('pop', 0.68)
S('impact', title_t)
flash = [[0, 0], [0.5, 0], [0.62, 1], [1.25, 0]]

# 2 痛點：暗下來的城市＋全螢幕大數字
h0, h1 = E['N1']['t0'] - 0.25, E['N4']['t0'] - 0.3
n89 = ch('N1', 1)
shot('hook', h0, h1, bg='ink', dark=True,
     scene={'src': 'hook', 'clip': clip((0, mh['start'] + 0.3), (h1 - h0, mh['start'] + 0.3 + (h1 - h0))),
            'scrim': [[0, 0.15], [E['N3']['t0'] - h0, 0.15], [E['N3']['t1'] - h0, 0.72]]},
     texts=[T(E['N1']['t0'] - h0, 960, 250, '當月有搭 yoxi 的人', 't-kicker', anchor='center', out=E['N2']['t0'] - h0 - 0.25),
            T(n89 - h0 - 0.2, 960, 300, '0%', 't-huge', anchor='center', count=[0, 89, 0, '%'], countDur=1.1, out=E['N2']['t0'] - h0 - 0.25),
            T(n89 - h0 + 0.6, 960, 640, '的日子，沒有搭車', 't-title', anchor='center', out=E['N2']['t0'] - h0 - 0.25),
            T(E['N2']['t0'] - h0, 960, 250, '有搭過 yoxi 的人', 't-kicker', anchor='center', out=E['N3']['t0'] - h0),
            T(E['N2']['t0'] - h0 + 0.1, 960, 300, '0%', 't-huge', anchor='center', count=[0, 33, 0, '%'], countDur=0.9, out=E['N3']['t0'] - h0),
            T(E['N2']['t0'] - h0 + 0.7, 960, 640, '三個月只搭過 1 次', 't-title', anchor='center', out=E['N3']['t0'] - h0),
            T(E['N3']['t0'] - h0 + 0.2, 960, 420, '叫車 App，只在要出門時被打開', 't-title', anchor='center', out=E['N3']['t1'] - h0 + 0.2),
            T(0.3, 60, 40, '資料：yoxi 競賽資料 2026/2/1–4/30（彙總分析）', 't-label', out=E['N3']['t0'] - h0)])
S('tick', n89 - 0.2)
S('tick', E['N2']['t0'] + 0.1)

# 3 轉折：光軌劃過城市
u0, u1 = E['N4']['t0'] - 0.3, E['N5']['t0'] - 0.3
shot('turn', u0, u1, bg='ink', dark=True, enter='zoom',
     scene={'src': 'turn', 'clip': clip((0, mt['start']), (u1 - u0, mt['start'] + (u1 - u0))), 'zoom': [[0, 1.0], [u1 - u0, 1.04]]},
     sprites=[dict(action='fly_loop', t=0.05, loop=True, out=2.2, path=[[0.05, -220, 820, 0.9], [2.2, 2140, 560, 0.9]])],
     texts=[T(0.1, 960, 210, '', 't-shade', anchor='center'),
            T(0.25, 960, 300, 'yoxi 點燈城', 't-kicker', anchor='center'),
            T(ch('N4', 1) - u0, 960, 360, '讓不搭車的日子，<br>也有每天打開的理由', 't-title', anchor='center', align='center')])
S('whoosh', u0)

# 4 早上：手機置中 → 推近到預報 → 小精靈指著 → 左移、右邊出字
m0, m1 = E['N5']['t0'] - 0.3, E['N7']['t0'] - 0.35
L = lambda x: x - m0
sh_tap = ms['chat_open']
clipm = clip((0, ms['morning_map'] - 1.0), (L(E['S2']['t0']) - 0.55, sh_tap - 0.35), (L(E['S2']['t0']) + 0.2, sh_tap + 0.6),
             (L(E['N6']['t0']) - 0.35, ms['later_tapped'] - 0.4), (m1 - m0, ms['later_card'] + 3.4))
push_a, push_b = L(E['S2']['t0']) + 0.1, L(E['N6']['t0']) - 0.3
shot('morning', m0, m1, bg='dawn', dots=True, enter='slide', tag={'t': 0.4, 'text': '個人化'},
     phones=[dict(src='story', clip=clipm,
                  pose=[[0, 1250, 560, 0.84, -8], [push_a, 1250, 560, 0.84, -8], [push_a + 0.7, 1250, 560, 1.7, 0], [push_b, 1250, 560, 1.7, 0], [push_b + 0.7, 1300, 560, 0.84, -6], [m1 - m0, 1300, 560, 0.84, -6]],
                  focus=[[0, 0, .5, .5, 0, 0], [push_a, 0, .5, .2, 1250, 520], [push_a + 0.7, 1, .5, .2, 1250, 520], [push_b, 1, .5, .2, 1250, 520], [push_b + 0.7, 0, .5, .2, 1250, 520]])],
     sprites=[dict(action='point', t=push_a + 0.5, loop=True, flip=True, out=push_b, path=[[push_a + 0.5, 1820, 640, 0.0], [push_a + 0.9, 1640, 640, 0.95]])],
     texts=[T(0.35, 150, 330, '早上 08:30', 't-kicker', out=push_a), T(0.6, 150, 390, '小涵的城市', 't-title', out=push_a),
            T(ch('N5', 1) - m0, 150, 520, '這個月走過的路，<span class="hl">都亮著</span>', 't-line', out=push_a),
            T(push_b + 0.5, 150, 330, '選「晚點走」', 't-kicker'), T(push_b + 0.75, 150, 390, '19:00 回家', 't-title'),
            T(ch('N6', 1) - m0, 150, 520, '<span class="hl">排進今天的任務</span>', 't-line')])
S('whoosh', m0)
S('zoom', m0 + push_a)
S('tap', ms['later_tapped'])  # 佔位：下面依 clip 換算

# 5 三人並排
r0, r1 = E['N7']['t0'] - 0.35, E['N8']['t0'] - 0.35
d3 = r1 - r0
shot('trio', r0, r1, bg='dawn', dots=True, enter='slide', tag={'t': 0.4, 'text': '個人化'},
     phones=[dict(src='story', label='小涵・<b>信義區</b>', labelAt=0.5, clip=clip((0, ms['morning_map'] + 0.5), (d3, ms['morning_map'] + 4.5)), pose=[[0, 500, 500, 0.57, 14], [d3, 500, 500, 0.585, 12]]),
             dict(src='story', label='阿哲・<b>板橋</b>', labelAt=0.8, clip=clip((0, ms['persona_阿哲'] + 1.8), (d3, ms['persona_阿哲'] + 5.0)), pose=[[0, 960, 492, 0.6, 0], [d3, 960, 492, 0.615, 0]]),
             dict(src='story', label='小雅・<b>淡水</b>', labelAt=1.1, clip=clip((0, ms['persona_小雅'] + 1.8), (d3, ms['persona_小雅'] + 4.6)), pose=[[0, 1420, 500, 0.57, -14], [d3, 1420, 500, 0.585, -12]])],
     texts=[T(ch('N7', 1) - r0, 960, 36, 'AI 依每個人的生活，點亮不一樣的城市', 't-line', anchor='center')])
S('whoosh', r0)

# 6 午休：手機在右，推近格子亮起
n0, n1 = E['N8']['t0'] - 0.35, E['N9']['t0'] - 0.35
wd = ms['walk_done']
clipn = clip((0, ms['noon'] - 0.8), (ch('N8', 1) - n0 - 0.2, wd - 0.2), (n1 - n0, wd + 4.6))
zp = ch('N8', 1) - n0 + 0.2
shot('noon', n0, n1, bg='day', dots=True, enter='slide', tag={'t': 0.4, 'text': '不搭車也打開'},
     phones=[dict(src='story', clip=clipn,
                  pose=[[0, 1330, 560, 0.84, -8], [zp, 1330, 560, 0.84, -8], [zp + 0.6, 1330, 560, 1.55, 0], [n1 - n0, 1330, 560, 1.6, 0]],
                  focus=[[0, 0, .5, .3, 1330, 520], [zp, 0, .5, .3, 1330, 520], [zp + 0.6, 1, .45, .3, 1330, 520], [n1 - n0, 1, .45, .3, 1330, 520]])],
     texts=[T(0.35, 150, 330, '午休 12:30', 't-kicker'), T(0.6, 150, 390, '不搭車，<br>也能點亮', 't-title'),
            T(ch('N8', 2) - n0, 150, 600, '四四南村 <span class="hl">+1 格</span>', 't-line')])
S('whoosh', n0)
S('ding', n0 + zp + 0.5)

# 7 拍車：手機置中推近車牌、小精靈跳出；好友排行
s0, s1 = E['N9']['t0'] - 0.35, E['N11']['t0'] - 0.35
clips_ = clip((0, ms['afternoon'] + 0.5), (ch('N9', 1) - s0 - 0.3, ms['scan_shot'] - 0.25), (E['N10']['t0'] - s0 + 0.6, ms['scan_shot'] + 4.2),
              (ch('N10', 1) - s0, ms['friends'] - 0.2), (s1 - s0, ms['friends'] + 4.2))
zq = ch('N9', 1) - s0 - 0.5
zr = ch('N10', 1) - s0 - 0.4
shot('scan', s0, s1, bg='dusk', dots=True, dark=True, enter='slide', tag={'t': 0.4, 'text': '趣味・yoxi 特色'},
     phones=[dict(src='story', clip=clips_,
                  pose=[[0, 960, 560, 0.84, 0], [zq, 960, 560, 0.84, 0], [zq + 0.6, 960, 560, 1.55, 0], [zr, 960, 560, 1.55, 0], [zr + 0.6, 1330, 560, 0.84, -8], [s1 - s0, 1330, 560, 0.84, -8]],
                  focus=[[0, 0, .5, .35, 960, 520], [zq, 0, .5, .35, 960, 520], [zq + 0.6, 1, .5, .33, 960, 500], [zr, 1, .5, .33, 960, 500], [zr + 0.6, 0, .5, .33, 960, 500]])],
     texts=[T(0.35, 150, 330, '路上 15:00', 't-kicker', out=zq), T(0.6, 150, 390, '拍 yoxi 車', 't-title', out=zq),
            T(E['N10']['t0'] - s0, 150, 330, '車牌在手機上辨識', 't-kicker'), T(E['N10']['t0'] - s0 + 0.2, 150, 390, '照片不上傳', 't-title'),
            T(ch('N10', 2) - s0, 150, 520, '好友排行 <span class="hl">第 1 名</span>', 't-line')])
S('whoosh', s0)
S('shutter', s0 + ch('N9', 1) - s0 - 0.3 + 0.25)
S('sparkle', s0 + ch('N9', 1) - s0 + 0.6)

# 8 傍晚：錯峰回家、換到 Points，小精靈歡呼
v0, v1 = E['N11']['t0'] - 0.35, E['N12']['t0'] - 0.35
pt = E['S3']['t0'] - v0 - 0.15
clipv = clip((0, ms['ride_start'] - 1.6), (pt, ms['points'] + 0.05), (v1 - v0, ms['points'] + 0.05 + (v1 - v0 - pt) * 0.9))
shot('evening', v0, v1, bg='night', dots=True, dark=True, enter='slide', tag={'t': 0.4, 'text': '長期動機'},
     phones=[dict(src='story', clip=clipv,
                  pose=[[0, 640, 560, 0.84, 8], [pt - 0.3, 640, 560, 0.84, 8], [pt + 0.4, 640, 560, 1.45, 0], [v1 - v0, 640, 560, 1.5, 0]],
                  focus=[[0, 0, .4, .8, 640, 640], [pt - 0.3, 0, .4, .8, 640, 640], [pt + 0.4, 1, .38, .78, 640, 600], [v1 - v0, 1, .38, .78, 640, 600]])],
     sprites=[dict(action='cheer', t=pt + 0.1, loop=True, path=[[pt + 0.1, 1690, 900, 0.0], [pt + 0.45, 1690, 700, 1.1]])],
     texts=[T(0.35, 1150, 300, '傍晚 18:05', 't-kicker', out=pt), T(0.6, 1150, 360, '錯峰回家', 't-title', out=pt),
            T(ch('N11', 1) - v0, 1150, 490, '路線<span class="hl">亮兩階</span>', 't-line', out=pt),
            T(pt + 0.2, 1150, 250, '+1', 't-big', pop=True), T(pt + 0.45, 1150, 480, '和泰 Points', 't-title')])
S('whoosh', v0)
S('chime', v0 + pt)
S('cheer', v0 + pt + 0.15)

# 9 對比：左右分割
c0, c1 = E['N12']['t0'] - 0.35, E['N13']['t0'] - 0.4
shot('split', c0, c1, bg='night', enter='slide', dark=True, tag={'t': 0.4, 'text': '資料應用'},
     split=[dict(when='18:00 現在叫車', bg='linear-gradient(160deg,#5b2c3f,#2b1830)', secs=640, run=ch('N12', 1) - c0 + 1.6, t=0.3, arrives=False, stat='25%', color='#FF9A8A', label='等超過 10 分鐘'),
            dict(when='19:00 預約', bg='linear-gradient(160deg,#173a5e,#0e1830)', secs=372, run=ch('N12', 2) - c0 - 0.2, t=0.3, arrives=True, stat='11%', color='#FFC94A', label='等超過 10 分鐘')],
     sprites=[dict(action='idle', t=0.3, loop=True, path=[[0.3, 150, 470, 0.6]]), dict(action='cheer', t=ch('N12', 2) - c0, loop=True, path=[[ch('N12', 2) - c0, 1770, 470, 0.6]])],
     texts=[T(0.4, 960, 22, '信義區平日・yoxi 競賽資料 2026/2–4 彙總', 't-label', anchor='center')])
S('whoosh', c0)
S('tick', c0 + 0.4)

# 10 AI①：模型卡＋大數字
a0, a1 = E['N13']['t0'] - 0.4, E['N14']['t0'] - 0.35
shot('model', a0, a1, bg='night', dots=True, dark=True, enter='slide', tag={'t': 0.4, 'text': 'AI 整合'},
     phones=[dict(src='story', clip=clip((0, ms['model_card'] - 0.3), (a1 - a0, ms['model_card'] + 5.5)), pose=[[0, 1400, 560, 0.84, -10], [a1 - a0, 1400, 560, 0.86, -8]])],
     texts=[T(0.35, 150, 250, 'AI ①　等車預測', 't-kicker'), T(0.6, 150, 310, 'LightGBM', 't-title'),
            T(ch('N13', 2) - a0, 150, 470, '0%', 't-big', count=[0, -8, 0, '%'], countDur=0.8), T(ch('N13', 2) - a0 + 0.3, 160, 700, '逐時等車誤差', 't-label'),
            T(ch('N13', 3) - a0, 640, 470, '0%', 't-big', count=[0, -16, 0, '%'], countDur=0.8), T(ch('N13', 3) - a0 + 0.3, 650, 700, '熱門上車點', 't-label'),
            T(ch('N13', 3) - a0 + 0.6, 160, 790, '對照：近 4 週同時段中位數（4 週滾動回測）', 't-label')])
S('whoosh', a0)
S('tick', a0 + ch('N13', 2) - a0)
S('tick', a0 + ch('N13', 3) - a0)

# 11 AI②：小精靈用工具
k0, k1 = E['N14']['t0'] - 0.35, E['N15']['t0'] - 0.35
clipk = clip((0, mc['ask_forecast'] - 0.6), (E['S4']['t0'] - k0 - 0.4, mc['propose'] + 1.6), (k1 - k0, mc['confirm'] + 2.6))
zk = 0.9
shot('tools', k0, k1, bg='dawn', dots=True, enter='slide', tag={'t': 0.4, 'text': 'AI 整合'},
     phones=[dict(src='chat', clip=clipk,
                  pose=[[0, 1000, 560, 0.84, 0], [zk, 1000, 560, 1.45, 0], [k1 - k0, 1000, 560, 1.5, 0]],
                  focus=[[0, 0, .5, .55, 1000, 560], [zk, 1, .5, .55, 1000, 560], [k1 - k0, 1, .5, .62, 1000, 560]])],
     sprites=[dict(action='hello', t=E['S4']['t0'] - k0 - 0.3, loop=True, path=[[E['S4']['t0'] - k0 - 0.3, 1660, 900, 0.0], [E['S4']['t0'] - k0, 1660, 640, 1.1]])],
     texts=[T(0.35, 120, 250, 'AI ②', 't-kicker'), T(0.6, 120, 310, '小精靈<br>會用工具', 't-title'),
            T(ch('N14', 1) - k0, 120, 520, '查預報<br>排錯峰', 't-line')])
S('whoosh', k0)

# 12 AI③：車牌辨識 0.2 秒
o0, o1 = E['N15']['t0'] - 0.35, E['N16']['t0'] - 0.35
shot('ocr', o0, o1, bg='dusk', dots=True, dark=True, enter='slide', tag={'t': 0.4, 'text': 'AI 整合・隱私'},
     phones=[dict(src='story', clip=clip((0, ms['scan_shot'] - 1.2), (o1 - o0, ms['scan_shot'] - 1.2 + (o1 - o0))),
                  pose=[[0, 600, 560, 1.35, 6], [o1 - o0, 600, 560, 1.45, 4]], focus=[[0, 1, .5, .32, 640, 540], [o1 - o0, 1, .5, .32, 640, 540]])],
     texts=[T(0.35, 1150, 250, 'AI ③　車牌辨識', 't-kicker'), T(0.6, 1150, 330, '0.0 秒', 't-big', count=[0, 0.2, 1, ' 秒'], countDur=0.6),
            T(1.0, 1150, 600, '在手機上完成<br><span class="hl">照片不上傳</span>', 't-line')])
S('whoosh', o0)

# 13 技術架構：標籤雲
q0, q1 = E['N16']['t0'] - 0.35, E['N17']['t0'] - 0.35
chips = ['React', 'MapLibre', 'H3', 'Firebase', 'Gemini', 'LightGBM', 'ONNX Runtime']
pos = [(160, 520), (430, 520), (760, 520), (930, 520), (160, 620), (420, 620), (720, 620)]
shot('stack', q0, q1, bg='night', dots=True, dark=True, enter='slide', tag={'t': 0.4, 'text': '技術架構'},
     phones=[dict(src='story', clip=clip((0, ms['points'] + 1.0), (q1 - q0, ms['ride_end'])), pose=[[0, 1480, 560, 0.84, -12], [q1 - q0, 1480, 560, 0.86, -10]])],
     texts=[T(0.3, 150, 250, '原型', 't-kicker'), T(0.5, 150, 310, '手機網頁，已經能用', 't-title')]
           + [T(0.8 + i * 0.12, x, y, c, 't-chip', pop=True) for i, (c, (x, y)) in enumerate(zip(chips, pos))]
           + [T(ch('N16', 1) - q0, 150, 760, '正式版：<span class="hl">Flutter</span>，做進 yoxi App', 't-line')])
S('whoosh', q0)

# 14 商業：全螢幕大數字
b0, b1 = E['N17']['t0'] - 0.35, E['N19']['t0'] - 0.35
shot('money', b0, b1, bg='night', dots=True, dark=True, enter='slide', tag={'t': 0.4, 'text': '商業轉換'},
     texts=[T(0.35, 960, 150, '不發優惠券，用光讓人錯峰', 't-title', anchor='center'),
            T(ch('N17', 1) - b0, 560, 360, 'NT$0.0', 't-big', anchor='center', count=[0, 0.6, 1, '', 'NT$'], countDur=0.8),
            T(ch('N17', 1) - b0 + 0.3, 560, 610, '一趟錯峰的 Points 成本', 't-label', anchor='center'),
            T(ch('N17', 2) - b0, 1360, 360, 'NT$0.0', 't-big', anchor='center', count=[0, 26.6, 1, '', 'NT$'], countDur=0.8),
            T(ch('N17', 2) - b0 + 0.3, 1360, 610, '一趟派遣費', 't-label', anchor='center'),
            T(ch('N17', 2) - b0 + 0.8, 960, 700, '不到 <span class="hl">3%</span>', 't-title', anchor='center'),
            T(E['N18']['t0'] - b0, 960, 840, '乘客少等・司機多跑・yoxi 不用花大錢', 't-line', anchor='center')])
S('whoosh', b0)
S('tick', b0 + ch('N17', 1) - b0)
S('tick', b0 + ch('N17', 2) - b0)

# 15 驗證：卡片
w0, w1 = E['N19']['t0'] - 0.35, E['N19']['t1'] + 0.4
shot('verify', w0, w1, bg='night', dots=True, dark=True, enter='slide', tag={'t': 0.4, 'text': '成效驗證'},
     texts=[T(0.35, 960, 150, '成效怎麼看', 't-title', anchor='center'),
            T(0.6, 150, 300, '<span class="ic">★</span>北極星<small>非搭車日開啟率：不搭車的日子，打開 yoxi 的比例</small>', 't-card', w=520, pop=True),
            T(ch('N19', 1) - w0, 760, 300, '錯峰點燈・三組對照', 't-kicker'),
            T(ch('N19', 2) - w0, 760, 370, '<span class="ic">①</span>只有光<small>路線亮兩階</small>', 't-card', w=320, pop=True),
            T(ch('N19', 2) - w0 + 0.35, 1110, 370, '<span class="ic">②</span>光＋Points<small>再加和泰 Points</small>', 't-card', w=320, pop=True),
            T(ch('N19', 2) - w0 + 0.7, 1460, 370, '<span class="ic">③</span>都沒有<small>對照組</small>', 't-card', w=320, pop=True)])
S('whoosh', w0)
for d in (0.6, ch('N19', 2) - w0, ch('N19', 2) - w0 + 0.35, ch('N19', 2) - w0 + 0.7):
    S('pop', w0 + d)

# 16 回顧快切（3 × 約 1.15 秒）
rc0 = w1
rc_len = (E['N20']['t0'] - 0.55 - rc0) / 3
for i, (mk, off, fx, fy, bg) in enumerate([('ride_start', 6.0, .45, .45, 'night'), ('scan_shot', 0.9, .5, .33, 'dusk'), ('points', 0.2, .38, .78, 'night')]):
    a, b = rc0 + i * rc_len, rc0 + (i + 1) * rc_len
    shot(f'recap{i}', a, b, bg=bg, dark=True, enter='cut',
         phones=[dict(src='story', clip=clip((0, ms[mk] + off), (b - a, ms[mk] + off + (b - a))), pose=[[0, 960, 540, 1.7, 0], [b - a, 960, 540, 1.85, 0]],
                      focus=[[0, 1, fx, fy, 960, 540], [b - a, 1, fx, fy, 960, 540]])])
    S('whoosh', a)

# 17 結尾：城市亮起、金句、小精靈揮手
e0 = rc0 + 3 * rc_len
mE = M['ending']
shot('ending', e0, TOTAL, bg='ink', dark=True, enter='zoom',
     scene={'src': 'ending', 'clip': clip((0, mE['start']), (TOTAL - e0, mE['start'] + (TOTAL - e0))), 'scrim': [[0, 0], [E['N20']['t0'] - e0 - 0.3, 0], [E['N20']['t0'] - e0 + 0.4, 0.3]]},
     sprites=[dict(action='hello', t=E['N20']['t0'] - e0 + 1.1, loop=True, out=TOTAL - e0 - 2.9, path=[[E['N20']['t0'] - e0 + 1.1, 1560, 760, 0.0], [E['N20']['t0'] - e0 + 1.5, 1560, 640, 1.05]]),
              dict(action='bye', t=TOTAL - e0 - 2.9, path=[[TOTAL - e0 - 2.9, 1560, 640, 1.05]])],
     texts=[T(E['N20']['t0'] - e0 - 0.2, 960, 250, '', 't-shade', anchor='center'),
            T(E['N20']['t0'] - e0, 960, 360, '平常點燈，出門不用賭', 't-tagline', anchor='center'),
            T(E['N20']['t0'] - e0 + 0.9, 960, 500, '<b>yoxi</b>點燈城', 't-hero', anchor='center', pop=True)])
S('impact', E['N20']['t0'])
fade = [[0, 0], [TOTAL - 1.3, 0], [TOTAL, 1]]

# ---- 字幕 ----
HL = re.compile(r'(NT\$[\d.]+|\d+(?:\.\d+)?\s?(?:%|分鐘|秒|點|格|趟)?|「[^」]+」)')
subs = []
for eid, v in LINES.items():
    if eid in ('N20',):
        continue  # 結尾金句已是大字
    for c in v['chunks']:
        subs.append({'t0': round(E[eid]['t0'] + c['start'], 3), 't1': round(E[eid]['t0'] + c['end'] + 0.06, 3), 'who': v['who'],
                     'html': HL.sub(lambda m: f'<b>{m.group(0)}</b>', c['text'])})

face = (SPRITE_DIR / 'idle' / '0001.png').as_uri() if (SPRITE_DIR / 'idle' / '0001.png').exists() else None
tl = {'fps': FPS, 'dur': TOTAL, 'trans': TRANS, 'sources': SOURCES, 'sprite': SPRITE, 'shots': shots, 'subs': subs, 'face': face, 'flash': flash, 'fade': fade}
(OUT / 'tl.json').write_text(json.dumps(tl, ensure_ascii=False), encoding='utf-8')
voice = [{'t': E[eid]['t0'], 'file': str(OUT / 'tts' / v['file']), 'who': v['who']} for eid, v in LINES.items()]
sfx = [x for x in sfx if x[1] != 'tap']
(OUT / 'sfx.json').write_text(json.dumps({'total': TOTAL, 'voice': voice, 'sfx': sorted(sfx)}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'total {TOTAL:.2f}s = {int(TOTAL // 60)}:{TOTAL % 60:05.2f}, shots {len(shots)}, subs {len(subs)}, sprites {list(SPRITE)}')
for s in shots:
    print(f"  {s['id']:8s} {s['t0']:7.2f}–{s['t1']:7.2f}")
