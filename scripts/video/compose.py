"""合成 3 分鐘影片：python compose.py [render|clips|final|all]
render：右側重點、字幕、手機遮罩（PNG）；clips：每個場景一段 1080p；final：淡入淡出接起來、混旁白＋音樂＋音效。"""
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

from playwright.async_api import async_playwright

import timeline
from paths import CHROME, OUT, VIDEO
from shots import P, SCENES

BUILD = OUT / 'build'
BUILD.mkdir(parents=True, exist_ok=True)
FPS = 30
X = 0.35                      # 場景之間淡入淡出的秒數
SCREEN = (162, 60, 444, 960)  # 手機螢幕在畫面中的位置與大小
SUB_PHONE = (1280, 1040)      # 字幕：右欄中央、底部
SUB_WIDE = (960, 1036)        # 字幕：全螢幕場景
MUSIC = OUT / 'music' / 'city_sunshine.mp3'
# Kevin MacLeod〈City Sunshine〉，FreePD.com 公共領域（網站已關閉，Internet Archive 有完整備份）
MUSIC_URLS = ['https://archive.org/download/freepd/upbeat/City%20Sunshine.mp3', 'https://ia801509.us.archive.org/18/items/freepd/upbeat/City%20Sunshine.mp3']

LINES, START, TOTAL = timeline.load()


def marks(run):
    return json.loads((OUT / 'rec' / run / 'marks.json').read_text(encoding='utf-8'))


def bounds():
    """每個場景在整支影片的起訖秒數"""
    out = []
    for i, s in enumerate(SCENES):
        if s['id'] == 'opening':
            b = 0.0
        elif s['id'] == 'ending':
            b = START[20] - 0.8
        else:
            b = START[s['lines'][0]]
        out.append(b)
    out.append(TOTAL)
    return [(out[i], out[i + 1]) for i in range(len(SCENES))]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        print(r.stderr[-3000:])
        raise SystemExit(f'ffmpeg failed: {cmd[:6]}')


# ---------- render ----------
HILITE = re.compile(r'(NT\$[\d.]+|\d+(?:\.\d+)?\s?(?:%|分鐘|秒|點|格|趟)?|「[^」]+」)')


def sub_html(text):
    return HILITE.sub(lambda m: f'<b>{m.group(0)}</b>', text)


async def render():
    tpl = (VIDEO / 'panel_template.html').as_uri()
    subs = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, executable_path=CHROME)
        page = await b.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto(tpl)
        await page.evaluate('document.fonts.ready')
        await page.wait_for_timeout(800)
        # 右側重點（每句一張，含手機外框）
        for s in SCENES:
            if s['kind'] != 'phone':
                continue
            for n in s['lines']:
                spec = dict(P[n], phase=s['phase'])
                await page.evaluate("""(spec) => {
                  document.body.className = ''; document.body.dataset.phase = spec.phase;
                  const h = ['<div class="hexes"></div><div class="phone"><div class="screen"></div></div><div class="col">'];
                  if (spec.tag) h.push(`<div class="tag"><span>題目對應</span>${spec.tag}</div>`);
                  if (spec.time) h.push(`<div class="time">${spec.time}</div>`);
                  if (spec.title) h.push(`<div class="title">${spec.title}</div>`);
                  h.push('<div class="stack">');
                  if (spec.stats) h.push('<div class="stats">' + spec.stats.map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('') + '</div>');
                  if (spec.list) h.push('<div class="list">' + spec.list.map((x) => `<div>${x}</div>`).join('') + '</div>');
                  if (spec.chips) h.push('<div class="chips">' + spec.chips.map((x) => `<div>${x}</div>`).join('') + '</div>');
                  if (spec.body) h.push(`<div class="body">${spec.body}</div>`);
                  h.push('</div>');
                  if (spec.note) h.push(`<div class="note">${spec.note}</div>`);
                  h.push('</div>');
                  document.body.innerHTML = h.join('');
                }""", spec)
                await page.wait_for_timeout(120)
                await page.screenshot(path=str(BUILD / f'panel_{n:02d}.png'))
        # 手機螢幕圓角遮罩
        await page.evaluate("""() => { document.body.className = ''; document.body.dataset.phase = '';
          document.body.style.background = '#000'; document.body.innerHTML = '<div style="position:absolute;left:0;top:0;width:444px;height:960px;border-radius:48px;background:#fff"></div>'; }""")
        await page.set_viewport_size({'width': 444, 'height': 960})
        await page.screenshot(path=str(BUILD / 'mask.png'))
        await page.set_viewport_size({'width': 1920, 'height': 1080})
        await page.evaluate("() => { document.body.style.background = ''; }")
        # 字幕（透明底）
        for s in SCENES:
            wide = s['kind'] == 'scene'
            for n in s['lines']:
                if n == 20:
                    continue  # 結尾的金句已經是大字，不再上字幕
                for k, c in enumerate(LINES[n]['chunks']):
                    await page.evaluate("""([html, wide]) => { document.body.className = 'clear'; document.body.dataset.phase = '';
                      document.body.innerHTML = `<div style="position:absolute;left:0;top:0;width:1920px;text-align:left"><div class="sub${wide ? ' wide' : ''}" id="s">${html}</div></div>`; }""",
                                        [sub_html(c['text']), wide])
                    el = page.locator('#s')
                    box = await el.bounding_box()
                    f = BUILD / f'sub_{n:02d}_{k}.png'
                    await el.screenshot(path=str(f), omit_background=True)
                    cx, bottom = SUB_WIDE if wide else SUB_PHONE
                    w, h = round(box['width']), round(box['height'])
                    subs[f'{n}_{k}'] = {'file': f.name, 'x': int(cx - w / 2), 'y': int(bottom - h), 'start': c['start'], 'end': c['end'], 'line': n}
        await b.close()
    (BUILD / 'subs.json').write_text(json.dumps(subs, ensure_ascii=False, indent=1), encoding='utf-8')
    print('render ok:', len(subs), 'subs')


# ---------- clips ----------
def plan_clips(scene, dur):
    """回傳每段錄影的 (來源檔, 起點, 長度, 速度)，以及總輸出長度"""
    out = []
    specs = scene['clips']
    for (src, m0, o0, m1, o1, speed) in specs:
        mk = marks(src)
        a, b = mk[m0] + o0, mk[m1] + o1
        out.append([src, a, b - a, speed])
    auto = [c for c in out if c[3] is None]
    fixed = sum(c[2] / c[3] for c in out if c[3] is not None)
    for c in auto:
        c[3] = min(2.0, max(0.75, c[2] / max(0.5, (dur - fixed) / len(auto))))
    return out


def sfx_events():
    ev = []
    for s, (b0, b1) in zip(SCENES, bounds()):
        if s['kind'] != 'phone':
            continue
        clips = plan_clips(s, b1 - b0 + X)
        for (name, src, m, off) in s.get('sfx', []):
            t_src = marks(src)[m] + off
            acc = 0.0
            for (csrc, a, length, sp) in clips:
                if csrc == src and a <= t_src <= a + length:
                    ev.append((name, round(b0 + acc + (t_src - a) / sp, 3)))
                    break
                acc += length / sp
    return ev


def make_clip(i, s, b0, b1):
    last = i == len(SCENES) - 1
    dur = b1 - b0 + (0 if last else X)
    out = BUILD / f'clip_{i:02d}_{s["id"]}.mp4'
    subs = json.loads((BUILD / 'subs.json').read_text(encoding='utf-8'))
    my_subs = [v for v in subs.values() if v['line'] in s['lines']]
    args = ['ffmpeg', '-v', 'error', '-y']
    fc = []
    if s['kind'] == 'scene':
        mk = marks(s['id'])
        args += ['-ss', f'{mk["start"]:.3f}', '-t', f'{dur:.3f}', '-i', str(OUT / 'rec' / s['id'] / 'run.mp4')]
        fc.append(f'[0:v]setpts=PTS-STARTPTS,fps={FPS},scale=1920:1080,tpad=stop_mode=clone:stop_duration={dur:.3f},trim=duration={dur:.3f}[base]')
        nin = 1
    else:
        # 右側重點：第一句的圖當底，後面的句子淡入換上
        panels = [n for n in s['lines']]
        for n in panels:
            args += ['-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.3f}', '-i', str(BUILD / f'panel_{n:02d}.png')]
        fc.append('[0:v]format=yuv420p[p0]')
        cur = 'p0'
        for j, n in enumerate(panels[1:], 1):
            t = START[n] - b0 - 0.25
            fc.append(f'[{j}:v]format=yuva420p,fade=t=in:st={t:.3f}:d=0.35:alpha=1[pf{j}]')
            fc.append(f'[{cur}][pf{j}]overlay=0:0:format=auto[p{j}]')
            cur = f'p{j}'
        nin = len(panels)
        # App 錄影
        clips = plan_clips(s, dur)
        labels = []
        for k, (src, a, length, sp) in enumerate(clips):
            args += ['-ss', f'{a:.3f}', '-t', f'{length:.3f}', '-i', str(OUT / 'rec' / src / 'run.mp4')]
            fc.append(f'[{nin}:v]setpts=(PTS-STARTPTS)/{sp:.4f},fps={FPS},scale={SCREEN[2]}:{SCREEN[3]}:flags=lanczos,setsar=1[c{k}]')
            labels.append(f'[c{k}]')
            nin += 1
        fc.append(f'{"".join(labels)}concat=n={len(labels)}:v=1:a=0,tpad=stop_mode=clone:stop_duration={dur:.3f},trim=duration={dur:.3f},setpts=PTS-STARTPTS,format=yuva420p[app]')
        args += ['-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.3f}', '-i', str(BUILD / 'mask.png')]
        fc.append(f'[{nin}:v]format=gray,scale={SCREEN[2]}:{SCREEN[3]}[mask]')
        nin += 1
        fc.append('[app][mask]alphamerge[appm]')
        fc.append(f'[{cur}][appm]overlay={SCREEN[0]}:{SCREEN[1]}:format=auto[base]')
    # 字幕
    cur = 'base'
    for j, v in enumerate(sorted(my_subs, key=lambda v: (v['line'], v['start']))):
        t0 = START[v['line']] - b0 + v['start']
        t1 = START[v['line']] - b0 + v['end'] + 0.08
        args += ['-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.3f}', '-i', str(BUILD / v['file'])]
        fc.append(f'[{cur}][{nin}:v]overlay={v["x"]}:{v["y"]}:enable=\'between(t,{t0:.3f},{t1:.3f})\'[s{j}]')
        cur = f's{j}'
        nin += 1
    fc.append(f'[{cur}]format=yuv420p,setsar=1[out]')
    args += ['-filter_complex', ';'.join(fc), '-map', '[out]', '-t', f'{dur:.3f}', '-r', str(FPS),
             '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', str(out)]
    run(args)
    print(f'clip {i:02d} {s["id"]:9s} {b0:7.2f}–{b1:7.2f} ({dur:.2f}s)')


def clips():
    for i, (s, (b0, b1)) in enumerate(zip(SCENES, bounds())):
        make_clip(i, s, b0, b1)


# ---------- final ----------
SFX = {
    'ding': "0.32*sin(2*PI*1318.5*t)*exp(-5*t)+0.18*sin(2*PI*1975.5*t)*exp(-6*t)",
    'shutter': "(random(0)*2-1)*0.55*(exp(-70*t)+0.8*exp(-70*abs(t-0.07))*gte(t,0.07))",
    'sparkle': "0.16*(sin(2*PI*1567.98*t)*exp(-7*t)+gte(t,0.07)*sin(2*PI*2093*(t-0.07))*exp(-7*(t-0.07))+gte(t,0.14)*sin(2*PI*2637*(t-0.14))*exp(-6*(t-0.14)))",
    'chime': "0.2*(sin(2*PI*1046.5*t)*exp(-3.5*t)+gte(t,0.12)*sin(2*PI*1318.5*(t-0.12))*exp(-3.5*(t-0.12))+gte(t,0.24)*sin(2*PI*1568*(t-0.24))*exp(-3*(t-0.24)))",
}


def get_music():
    if MUSIC.exists():
        return
    import urllib.request
    MUSIC.parent.mkdir(parents=True, exist_ok=True)
    for url in MUSIC_URLS:
        try:
            urllib.request.urlretrieve(url, MUSIC)
            subprocess.run(['ffprobe', '-v', 'error', str(MUSIC)], check=True)
            return
        except Exception as e:
            print('下載音樂失敗：', url, e)
    raise SystemExit('請手動下載 City Sunshine.mp3 放到 ' + str(MUSIC))


def final():
    get_music()
    bs = bounds()
    files = [BUILD / f'clip_{i:02d}_{s["id"]}.mp4' for i, s in enumerate(SCENES)]
    # 影像：xfade 串起來，轉場從每個場景的起點開始，影音才不會錯開
    vargs = ['ffmpeg', '-v', 'error', '-y']
    for f in files:
        vargs += ['-i', str(f)]
    fc, cur = [], '0:v'
    for i in range(1, len(files)):
        fc.append(f'[{cur}][{i}:v]xfade=transition=fade:duration={X}:offset={bs[i][0]:.3f}[x{i}]')
        cur = f'x{i}'
    video_only = BUILD / 'video_only.mp4'
    vargs += ['-filter_complex', ';'.join(fc), '-map', f'[{cur}]', '-t', f'{TOTAL:.3f}', '-r', str(FPS),
              '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p', str(video_only)]
    newest_clip = max(f.stat().st_mtime for f in files)
    if not video_only.exists() or video_only.stat().st_mtime < newest_clip:
        run(vargs)
    # 音效檔
    for name, expr in SFX.items():
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f"aevalsrc='{expr}':s=48000:d=1.2", '-ac', '2', str(BUILD / f'sfx_{name}.wav')])
    events = sfx_events()
    # 聲音：旁白照時間軸放、音樂墊底（旁白出現時自動壓低）、音效
    aargs = ['ffmpeg', '-v', 'error', '-y']
    afc, narr = [], []
    for k, n in enumerate(sorted(LINES)):
        aargs += ['-i', str(OUT / 'tts' / LINES[n]['file'])]
        ms = int(START[n] * 1000)
        afc.append(f'[{k}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[n{k}]')
        narr.append(f'[n{k}]')
    nin = len(LINES)
    afc.append(f'{"".join(narr)}amix=inputs={len(narr)}:normalize=0,volume=1.25,apad=whole_dur={TOTAL:.3f},asplit=2[narr][sc]')
    aargs += ['-i', str(MUSIC)]
    afc.append(f'[{nin}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{TOTAL:.3f},volume=0.33,'
               f'afade=t=in:st=0:d=1.5,afade=t=out:st={TOTAL - 3.5:.3f}:d=3.5[mus]')
    afc.append('[mus][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=450[mduck]')
    nin += 1
    fx = []
    for j, (name, t) in enumerate(events):
        aargs += ['-i', str(BUILD / f'sfx_{name}.wav')]
        ms = int(t * 1000)
        afc.append(f'[{nin}:a]adelay={ms}|{ms}[f{j}]')
        fx.append(f'[f{j}]')
        nin += 1
    mix = ['[narr]', '[mduck]'] + fx
    afc.append(f'{"".join(mix)}amix=inputs={len(mix)}:normalize=0,atrim=0:{TOTAL:.3f},loudnorm=I=-15:TP=-1.5:LRA=11[aout]')
    audio = BUILD / 'audio.m4a'
    aargs += ['-filter_complex', ';'.join(afc), '-map', '[aout]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', str(audio)]
    run(aargs)
    out = OUT / 'yoxi點燈城_方案說明影片.mp4'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(video_only), '-i', str(audio), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy',
         '-shortest', '-movflags', '+faststart', str(out)])
    print('final:', out, 'sfx:', events)


if __name__ == '__main__':
    step = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if step in ('render', 'all'):
        asyncio.run(render())
    if step in ('clips', 'all'):
        clips()
    if step in ('final', 'all'):
        final()
