"""配音：男聲旁白與小精靈兩種聲音（edge-tts，旁白文字會送到微軟的語音服務），逐詞時間對字幕。
輸出 out/tts/<id>.mp3 與 lines.json。用法：python scripts/video/tts.py"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

from paths import OUT as _OUT
from script import ENTRIES, VOICES

OUT = _OUT / 'tts'
OUT.mkdir(parents=True, exist_ok=True)


def duration(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]).decode().strip())


async def build(eid, who, chunks):
    v = VOICES[who]
    text = ''.join(t for _, t in chunks)
    mp3 = OUT / f'{eid}.mp3'
    words = []
    for attempt in range(3):
        try:
            words = []
            with open(mp3, 'wb') as f:
                async for c in edge_tts.Communicate(text, v['voice'], rate=v['rate'], pitch=v['pitch'], boundary='WordBoundary').stream():
                    if c['type'] == 'audio':
                        f.write(c['data'])
                    elif c['type'] == 'WordBoundary':
                        words.append((c['offset'] / 1e7, (c['offset'] + c['duration']) / 1e7, c['text']))
            break
        except Exception as e:
            print('retry', eid, e, file=sys.stderr)
            await asyncio.sleep(2)
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
    return {'file': mp3.name, 'who': who, 'dur': round(dur, 3), 'chunks': res}


async def main():
    out = {}
    for eid, who, chunks in ENTRIES:
        out[eid] = await build(eid, who, chunks)
        print(f'{eid:4s} {who:6s} {out[eid]["dur"]:5.2f}s', flush=True)
    (OUT / 'lines.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print('total', round(sum(v['dur'] for v in out.values()), 1))


asyncio.run(main())
