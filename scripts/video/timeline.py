"""整支影片的時間軸：每句旁白何時開始（秒），句與句之間的停頓。開場、結尾場景和合成都用這份。"""
import json
from pathlib import Path

from paths import OUT
LEAD = 0.5          # 片頭第一句前的空白
TAIL = 5.5          # 最後一句後，結尾畫面停留
PAUSE = {4: 1.8, 7: 0.7, 8: 0.6, 9: 0.6, 11: 0.7, 12: 1.2, 13: 0.9, 14: 0.5, 16: 0.5, 17: 0.9, 18: 0.6, 19: 1.2}
DEFAULT_PAUSE = 0.45


def load():
    lines = {int(k): v for k, v in json.loads((OUT / 'tts' / 'lines.json').read_text(encoding='utf-8')).items()}
    start, t = {}, LEAD
    for n in sorted(lines):
        start[n] = round(t, 3)
        t += lines[n]['dur'] + (PAUSE.get(n, DEFAULT_PAUSE) if n < max(lines) else 0)
    total = round(t + TAIL, 3)
    return lines, start, total


if __name__ == '__main__':
    lines, start, total = load()
    for n in sorted(lines):
        print(f'{n:2d} {start[n]:7.2f}  ({lines[n]["dur"]:.2f}s)')
    print(f'total {total:.2f}s = {int(total // 60)}:{total % 60:05.2f}')
