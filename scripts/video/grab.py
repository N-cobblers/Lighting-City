"""從影片取幾個時間點的畫面拼成一張檢查圖。用法：python grab.py <video> <out.jpg> <cols> <width> t1 t2 ..."""
import os
import subprocess
import sys
import tempfile

video, out, cols, width = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
times = [float(x) for x in sys.argv[5:]]
tmp = tempfile.mkdtemp()
tiles = []
for i, t in enumerate(times):
    p = os.path.join(tmp, f'{i:02d}.jpg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', video, '-frames:v', '1', '-vf', f'scale={width}:-2', p], check=True)
    tiles.append(p)
h = int(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=height', '-of', 'csv=p=0', tiles[0]]).decode().strip())
layout = '|'.join(f'{(i % cols) * width}_{(i // cols) * h}' for i in range(len(tiles)))
args = ['ffmpeg', '-v', 'error', '-y']
for p in tiles:
    args += ['-i', p]
if len(tiles) == 1:
    args += ['-frames:v', '1', out]
else:
    args += ['-filter_complex', f'xstack=inputs={len(tiles)}:layout={layout}:fill=black', '-frames:v', '1', out]
subprocess.run(args, check=True)
for p in tiles:
    os.remove(p)
os.rmdir(tmp)
print(out)
