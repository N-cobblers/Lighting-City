"""把網頁舞台逐格畫出來，直接送進 ffmpeg 編碼。
用法：python scripts/video/render.py <tl.json> <out.mp4> [--scale 1.3333] [--from 0] [--to 999] [--stills 12.5,30,...]
--scale 1.3333 = 2560×1440 輸出；--stills 只輸出指定秒數的截圖（檢查用）。"""
import argparse
import asyncio
import base64
import json
import subprocess
import sys
import time
from pathlib import Path

from playwright.async_api import async_playwright

from paths import CHROME, VIDEO as HERE


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('tl')
    ap.add_argument('out')
    ap.add_argument('--scale', type=float, default=4 / 3)
    ap.add_argument('--from', dest='t_from', type=float, default=0)
    ap.add_argument('--to', dest='t_to', type=float, default=1e9)
    ap.add_argument('--stills', default='')
    ap.add_argument('--crf', default='16')
    a = ap.parse_args()
    tl = json.loads(Path(a.tl).read_text(encoding='utf-8'))
    fps = tl['fps']
    n0 = int(round(a.t_from * fps))
    n1 = int(round(min(a.t_to, tl['dur']) * fps))
    W, H = int(round(1920 * a.scale)), int(round(1080 * a.scale))
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, executable_path=CHROME,
                                    args=['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': 1920, 'height': 1080}, device_scale_factor=a.scale)
        await ctx.add_init_script(f'window.__TL__ = {json.dumps(tl)};')
        page = await ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await page.goto((HERE / 'stage.html').as_uri())
        await page.evaluate('window.stageReady')
        await page.wait_for_timeout(1500)
        cdp = await ctx.new_cdp_session(page)

        async def grab(fmt='jpeg'):
            r = await cdp.send('Page.captureScreenshot', {'format': fmt, 'quality': 95} if fmt == 'jpeg' else {'format': fmt})
            return base64.b64decode(r['data'])

        if a.stills:
            out = Path(a.out)
            out.mkdir(parents=True, exist_ok=True)
            for s in a.stills.split(','):
                t = float(s)
                await page.evaluate('t => renderAt(t)', t)
                (out / f'still_{t:07.2f}.jpg').write_bytes(await grab())
            print('stills ->', out, 'errors:', errs[:5])
            await b.close()
            return
        ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', str(fps), '-i', '-',
                               '-vf', f'scale={W}:{H}:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', a.crf,
                               '-profile:v', 'high', '-movflags', '+faststart', a.out], stdin=subprocess.PIPE)
        t0 = time.time()
        for i in range(n0, n1):
            await page.evaluate('t => renderAt(t)', i / fps)
            ff.stdin.write(await grab())
            if (i - n0) % 300 == 0:
                el = time.time() - t0
                print(f'  frame {i}/{n1} ({i / fps:.1f}s) {el:.0f}s elapsed', flush=True)
        ff.stdin.close()
        ff.wait()
        await b.close()
    print('done', a.out, f'{time.time() - t0:.0f}s', 'errors:', errs[:5])


asyncio.run(main())
