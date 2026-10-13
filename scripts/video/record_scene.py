"""產生並錄製開場、結尾的城市地圖場景（1920×1080，用顯示卡即時繪圖），時間對準旁白。
用法：python scripts/video/record_scene.py opening|ending（需要網路：OpenFreeMap 圖磚、Google Fonts）"""
import asyncio
import json
import sys
import time
from pathlib import Path

from playwright.async_api import async_playwright

import timeline
from paths import CHROME, GPU_ARGS, OUT, ROOT, VIDEO
from record_story import Recorder

NM = (ROOT / 'node_modules').as_uri()


def export_routes():
    """把 App 的路線（src/lib/geo.ts）匯出成 JSON，場景用來點亮真實道路上的格子。"""
    import subprocess
    f = OUT / 'scenes' / 'routes.json'
    f.parent.mkdir(parents=True, exist_ok=True)
    bundle = OUT / 'scenes' / 'geo_bundle.cjs'
    esbuild = ROOT / 'node_modules' / '.bin' / ('esbuild.cmd' if sys.platform == 'win32' else 'esbuild')
    subprocess.run([str(esbuild), 'src/lib/geo.ts', '--bundle', '--platform=node', '--format=cjs', f'--outfile={bundle}', '--log-level=warning'], cwd=ROOT, check=True)
    js = "const g = require(process.argv[1]); require('fs').writeFileSync(process.argv[2], JSON.stringify({ routes: g.ROUTES.map(r => ({ id: r.id, name: r.name, minutes: r.minutes, path: r.path })) }))"
    subprocess.run(['node', '-e', js, str(bundle), str(f)], check=True)
    return f


def scene_data(mode):
    lines, start, total = timeline.load()
    routes = json.loads(export_routes().read_text(encoding='utf-8'))['routes']
    if mode == 'opening':
        s0 = 0.0
        l4b = start[4] + lines[4]['chunks'][1]['start']
        T = {'l1': start[1], 'l2': start[2], 'l3': start[3], 'l4': start[4], 'l4b': l4b}
        data = {'mode': mode, 'T': T, 'routes': routes, 'heroStart': start[4] + 0.15, 'othersStart': start[4] + 1.4, 'pastShare': 0.38,
                'cam0': {'center': [121.535, 25.058], 'zoom': 11.35}, 'cam1': {'center': [121.553, 25.047], 'zoom': 12.15, 'at': start[4] - 0.3, 'dur': 5.5},
                'drift': 0.006}
        dur = start[5] + 0.8
    else:
        s0 = start[20] - 0.8
        T = {'l20': start[20] - s0, 'fade': total - s0 - 1.5}
        data = {'mode': mode, 'T': T, 'routes': routes, 'heroStart': -20, 'othersStart': -20, 'pastShare': 0,
                'cam0': {'center': [121.545, 25.052], 'zoom': 12.0, 'bearing': -6}, 'cam1': {'center': [121.515, 25.075], 'zoom': 11.05, 'bearing': 4, 'at': 0, 'dur': total - s0},
                'drift': 0}
        dur = total - s0 + 0.3
    return data, s0, dur


async def main(mode):
    data, s0, dur = scene_data(mode)
    html = (VIDEO / 'scenes' / 'scene_template.html').read_text(encoding='utf-8')
    html = (html.replace('__MAPLIBRE_CSS__', f'{NM}/maplibre-gl/dist/maplibre-gl.css')
            .replace('__MAPLIBRE_JS__', f'{NM}/maplibre-gl/dist/maplibre-gl.js')
            .replace('__H3_JS__', f'{NM}/h3-js/dist/h3-js.umd.js')
            .replace('__DATA__', json.dumps(data)))
    page_file = OUT / 'scenes' / f'{mode}.html'
    page_file.write_text(html, encoding='utf-8')
    out = OUT / 'rec' / mode
    rec = Recorder(str(out))
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, executable_path=CHROME, args=GPU_ARGS + ['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
        page = await ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(page_file.as_uri())
        for _ in range(120):
            if await page.evaluate('window.ready === true'):
                break
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(1500)
        await rec.start(ctx, page)
        # 原本的 Recorder 會壓到 780 寬，場景要 1920
        await rec.cdp.send('Page.stopScreencast')
        await rec.cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 92, 'maxWidth': 1920, 'maxHeight': 1080, 'everyNthFrame': 1})
        await page.evaluate('window.start()')
        rec.mark('start')
        await page.wait_for_timeout(int(dur * 1000) + 300)
        rec.mark('end')
        await rec.stop()
        await b.close()
    meta = {'s0': s0, 'dur': dur, 'errors': errs, 'frames': len(rec.frames)}
    (out / 'scene.json').write_text(json.dumps(meta, ensure_ascii=False), encoding='utf-8')
    print(meta)


asyncio.run(main(sys.argv[1]))
