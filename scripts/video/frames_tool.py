"""錄影畫面工具：
  python frames_tool.py video <run_dir>             把 screencast 畫面依時間做成 30fps 的 run.mp4，並輸出各 marker 的秒數
  python frames_tool.py sheet <run_dir> m1 m2 ...    每個 marker 之後 0/1.5/3 秒各取一格，拼成 sheet.jpg 檢查用
"""
import json
import os
import subprocess
import sys


def load(run):
    frames = json.load(open(os.path.join(run, 'frames.json'), encoding='utf-8'))
    m = json.load(open(os.path.join(run, 'markers.json'), encoding='utf-8'))
    t0 = frames[0][1]
    marks = {name: round(t - t0, 3) for name, t in m['markers']}
    return frames, t0, marks, m.get('notes', {})


def video(run):
    frames, t0, marks, _ = load(run)
    lst = os.path.join(run, 'concat.txt')
    # 畫面沒變就不會有新的一格：最後一格要撐到「end」標記
    end_ts = t0 + max(marks.values()) + 0.5
    with open(lst, 'w', encoding='utf-8') as f:
        for i, (name, ts) in enumerate(frames):
            nxt = frames[i + 1][1] if i + 1 < len(frames) else max(end_ts, ts + 0.5)
            f.write(f"file 'frames/{name}'\nduration {max(nxt - ts, 0.001):.4f}\n")
        f.write(f"file 'frames/{frames[-1][0]}'\n")
    out = os.path.join(run, 'run.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst,
                    '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', out], check=True)
    with open(os.path.join(run, 'marks.json'), 'w', encoding='utf-8') as f:
        json.dump(marks, f, ensure_ascii=False, indent=1)
    print(json.dumps(marks, ensure_ascii=False))
    print(out)


def sheet(run, names):
    _, _, marks, _ = load(run)
    src = os.path.join(run, 'run.mp4')
    tiles = []
    for n in names:
        for off in (0, 1.5, 3):
            t = marks[n] + off
            p = os.path.join(run, f'_t_{len(tiles):02d}.jpg')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', src, '-frames:v', '1', '-vf', 'scale=260:-1', p], check=True)
            tiles.append(p)
    cols = 6
    rows = (len(tiles) + cols - 1) // cols
    inputs = []
    for p in tiles:
        inputs += ['-i', p]
    layout = '|'.join(f'{(i % cols) * 260}_{(i // cols) * 563}' for i in range(len(tiles)))
    out = os.path.join(run, 'sheet.jpg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', f"xstack=inputs={len(tiles)}:layout={layout}:fill=black", '-frames:v', '1', out], check=True)
    for p in tiles:
        os.remove(p)
    print(out)


if __name__ == '__main__':
    cmd, run = sys.argv[1], sys.argv[2]
    if cmd == 'video':
        video(run)
    else:
        sheet(run, sys.argv[3:])
