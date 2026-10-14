"""第三版配音：男聲旁白與小精靈。小精靈不在 TTS 裡拉音調，改用 rubberband 後製升半音（保留自然感）。
另外算出小精靈每一格（1/30 秒）的音量，給講話動畫對嘴用。輸出 out/tts/。用法：python scripts/video/tts.py（台詞會送到微軟的語音服務）"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts
import numpy as np

from paths import OUT as _OUT
from script import ENTRIES, VOICES

OUT = _OUT / 'tts'
OUT.mkdir(parents=True, exist_ok=True)


def duration(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]).decode().strip())


def envelope(p, fps=30):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', '24000', '-f', 's16le', '-'])
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    n = 24000 // fps
    frames = len(x) // n
    rms = np.sqrt((x[:frames * n].reshape(frames, n) ** 2).mean(axis=1)) if frames else np.zeros(0)
    peak = float(np.percentile(rms, 95)) if len(rms) else 1.0
    return [round(float(min(1.0, v / max(peak, 1e-4))), 3) for v in rms]


async def build(eid, who, chunks):
    v = VOICES[who]
    text = ''.join(t for _, t in chunks)
    raw = OUT / f'{eid}_raw.mp3'
    mp3 = OUT / f'{eid}.mp3'
    words = []
    for attempt in range(3):
        try:
            words = []
            with open(raw, 'wb') as f:
                async for c in edge_tts.Communicate(text, v['voice'], rate=v['rate'], pitch=v['pitch'], boundary='WordBoundary').stream():
                    if c['type'] == 'audio':
                        f.write(c['data'])
                    elif c['type'] == 'WordBoundary':
                        words.append((c['offset'] / 1e7, (c['offset'] + c['duration']) / 1e7, c['text']))
            break
        except Exception as e:
            print('retry', eid, e, file=sys.stderr)
            await asyncio.sleep(2)
    if v.get('semitones'):
        ratio = 2 ** (v['semitones'] / 12)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', f'rubberband=pitch={ratio:.5f}:formant=preserved', '-b:a', '160k', str(mp3)], check=True)
    else:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-c', 'copy', str(mp3)], check=True)
    spans, pos = [], 0
    for s, e, w in words:
        i = text.find(w, pos)
        if i < 0:
            continue
        spans.append((i, i + len(w), s, e))
        pos = i + len(w)
    dur = duration(mp3)
    res, cur = [], 0
    for sub, tts in chunks:
        a, b = cur, cur + len(tts)
        cur = b
        inside = [sp for sp in spans if sp[0] < b and sp[1] > a]
        start, end = (inside[0][2], inside[-1][3]) if inside else (dur * a / len(text), dur * b / len(text))
        res.append({'text': sub, 'start': round(start, 3), 'end': round(end, 3)})
    for i in range(len(res) - 1):
        res[i]['end'] = max(res[i]['end'], res[i + 1]['start'] - 0.05)
    res[-1]['end'] = max(res[-1]['end'], dur - 0.05)
    res[0]['start'] = min(res[0]['start'], 0.12)
    out = {'file': mp3.name, 'who': who, 'dur': round(dur, 3), 'chunks': res}
    if who == 'sprite':
        out['env'] = envelope(mp3)
    return out


async def main():
    out = {}
    for eid, who, expr, chunks in ENTRIES:
        out[eid] = await build(eid, who, chunks)
        out[eid]['expr'] = expr
        print(f'{eid:4s} {who:6s} {out[eid]["dur"]:5.2f}s', flush=True)
    (OUT / 'lines.json').write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')
    print('total speech', round(sum(v['dur'] for v in out.values()), 1))


asyncio.run(main())
