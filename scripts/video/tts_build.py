"""產生 20 句旁白（edge-tts 台灣男聲），並用逐詞時間算出每段字幕的起訖秒數。
輸出 tts/lineNN.mp3 與 tts/lines.json：{line: {dur, chunks: [{text, start, end}]}}
用法：python scripts/video/tts_build.py [語速，例如 -5%]（旁白文字會送到微軟的語音服務）"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

from script_data import LINES

from paths import OUT as _OUT

OUT = _OUT / 'tts'
OUT.mkdir(exist_ok=True)
VOICE = 'zh-TW-YunJheNeural'
RATE = sys.argv[1] if len(sys.argv) > 1 else '+0%'


def duration(p: Path) -> float:
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]).decode().strip())


async def build(n: int, chunks):
    text = ''.join(t for _, t in chunks)
    mp3 = OUT / f'line{n:02d}.mp3'
    words = []
    with open(mp3, 'wb') as f:
        async for c in edge_tts.Communicate(text, VOICE, rate=RATE, boundary='WordBoundary').stream():
            if c['type'] == 'audio':
                f.write(c['data'])
            elif c['type'] == 'WordBoundary':
                words.append((c['offset'] / 1e7, (c['offset'] + c['duration']) / 1e7, c['text']))
    # 把每個詞對回原文的位置
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
        if inside:
            start, end = inside[0][2], inside[-1][3]
        else:  # 找不到詞（只有標點）就照字數比例
            start, end = dur * a / len(text), dur * b / len(text)
        res.append({'text': sub, 'start': round(start, 3), 'end': round(end, 3)})
    # 字幕銜接：每段延到下一段開始前，最後一段延到音檔結束
    for i in range(len(res) - 1):
        res[i]['end'] = max(res[i]['end'], res[i + 1]['start'] - 0.05)
    res[-1]['end'] = max(res[-1]['end'], dur)
    res[0]['start'] = min(res[0]['start'], 0.15)
    return n, {'file': mp3.name, 'dur': round(dur, 3), 'chunks': res, 'chars': sum(ch.isalnum() for ch in text)}


async def main():
    out = {}
    for n, chunks in LINES.items():
        k, v = await build(n, chunks)
        out[k] = v
        print(f'{k:2d} {v["dur"]:5.2f}s {v["chars"]:3d}字 ' + ' | '.join(f'{c["start"]:.2f}-{c["end"]:.2f}' for c in v['chunks']), flush=True)
    (OUT / 'lines.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    total = sum(v['dur'] for v in out.values())
    chars = sum(v['chars'] for v in out.values())
    print(f'total {total:.1f}s, {chars} chars, {chars / total:.2f} chars/s')


asyncio.run(main())
