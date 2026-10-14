"""YouTube 縮圖：亮起來的城市＋車燈小精靈＋片名與金句。輸出 1920×1080 JPG（YouTube 上限 2 MB）。"""
import asyncio
import json
import sys
from pathlib import Path

from playwright.async_api import async_playwright

from paths import CHROME, OUT

SPRITE = OUT / 'sprite'


def main_bg():
    d = OUT / 'rec' / 'ending'
    frames = json.loads((d / 'frames.json').read_text(encoding='utf-8'))
    return (d / 'frames' / frames[len(frames) // 6][0]).as_uri()


HTML = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&family=Noto+Sans+TC:wght@900&display=block" rel="stylesheet">
<style>html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#070d1c;font-family:'Noto Sans TC',sans-serif}
.bg{position:absolute;inset:0;background:url('__BG__') center/cover;filter:brightness(1.15) saturate(1.15)}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,13,28,.15) 0%,rgba(7,13,28,.55) 45%,rgba(7,13,28,.88) 100%)}
.glow{position:absolute;left:40px;top:120px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(255,201,74,.55) 0%,rgba(255,201,74,0) 65%)}
.sp{position:absolute;left:30px;top:90px;width:600px;height:600px}
.t{position:absolute;right:70px;top:170px;text-align:right}
.title{font-size:132px;font-weight:900;color:#fff;letter-spacing:.04em;line-height:1.05;text-shadow:0 0 36px rgba(255,201,74,.6),0 6px 24px rgba(0,0,0,.6)}
.title b{font-family:'Fredoka',sans-serif;color:#FFC94A;display:block;font-size:150px;letter-spacing:0}
.tag{margin-top:26px;display:inline-block;font-size:52px;font-weight:900;color:#2a1a00;background:#FFC94A;padding:10px 30px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
</style></head><body><div class="bg"></div><div class="shade"></div><div class="glow"></div><img class="sp" src="__SP__">
<div class="t"><div class="title"><b>yoxi</b>點燈城</div><div class="tag">平常點燈，出門不用賭</div></div></body></html>"""


async def main():
    sp = SPRITE / 'cheer'
    frames = sorted(sp.glob('*.png'))
    html = HTML.replace('__BG__', main_bg()).replace('__SP__', frames[len(frames) // 3].as_uri())
    f = OUT / 'thumb.html'
    f.write_text(html, encoding='utf-8')
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, executable_path=CHROME, args=['--allow-file-access-from-files'])
        page = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=1.5)
        await page.goto(f.as_uri())
        await page.evaluate('document.fonts.ready')
        await page.wait_for_timeout(800)
        out = OUT / 'yoxi點燈城_YouTube縮圖.jpg'
        await page.screenshot(path=str(out), type='jpeg', quality=92)
        await b.close()
    print(out, out.stat().st_size // 1024, 'KB')


asyncio.run(main())
