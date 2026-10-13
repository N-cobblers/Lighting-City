"""錄製車燈小精靈的動畫：每個動作輸出 30fps、720×720 的透明 PNG 序列，另外拼一張設計預覽圖。

用法（專案根目錄）：
  python scripts/video/sprite/render_sprite.py preview [輸出路徑]   # 預覽圖（正面、45 度、表情、動作關鍵格、五種光色）
  python scripts/video/sprite/render_sprite.py actions [動作 ...]   # PNG 序列 → scripts/video/out/sprite/<動作>/0001.png…
"""
import asyncio
import io
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from paths import CHROME, GPU_ARGS, OUT, ROOT  # noqa: E402

HERE = Path(__file__).resolve().parent
SOUT = OUT / 'sprite'
FPS = 30

# 光色：琥珀、暖黃、蜜桃、暖白、玫瑰金（和 src/lib/lucky.ts 一致）
PALETTES = [
    {'name': '琥珀', 'body': '#FFAE3D', 'glow': '#FF9B22', 'rim': '#D97812'},
    {'name': '暖黃', 'body': '#FFD452', 'glow': '#FFC83D', 'rim': '#EFA52E'},
    {'name': '蜜桃', 'body': '#FFD39E', 'glow': '#FFC07E', 'rim': '#EA9A56'},
    {'name': '暖白', 'body': '#FFF3D6', 'glow': '#FFE6B3', 'rim': '#DDBA80'},
    {'name': '玫瑰金', 'body': '#CC9468', 'glow': '#B9804F', 'rim': '#80502E'},
]


def bundle():
    SOUT.mkdir(parents=True, exist_ok=True)
    esbuild = ROOT / 'node_modules' / '.bin' / ('esbuild.cmd' if sys.platform == 'win32' else 'esbuild')
    subprocess.run([str(esbuild), str(HERE / 'stage.ts'), '--bundle', '--format=iife', f'--outfile={SOUT / "bundle.js"}', '--log-level=warning'], cwd=ROOT, check=True)
    (SOUT / 'index.html').write_text('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent;overflow:hidden}</style></head>'
                                     '<body><script src="bundle.js"></script></body></html>', encoding='utf-8')


async def open_page(p):
    b = await p.chromium.launch(headless=True, executable_path=CHROME, args=GPU_ARGS + ['--allow-file-access-from-files'])
    page = await b.new_page(viewport={'width': 720, 'height': 720}, device_scale_factor=1)
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await page.goto((SOUT / 'index.html').as_uri())
    for _ in range(100):
        if await page.evaluate('!!(window.SPR && window.SPR.ready)'):
            break
        await page.wait_for_timeout(100)
    if errs:
        print('page errors:', errs[:5])
    return b, page


async def shot(page) -> Image.Image:
    return Image.open(io.BytesIO(await page.screenshot(omit_background=True, type='png'))).convert('RGBA')


async def actions(names):
    async with async_playwright() as p:
        b, page = await open_page(p)
        durs = await page.evaluate('window.SPR.durations')
        for name in names or list(durs):
            d = SOUT / name
            if d.exists():
                shutil.rmtree(d)
            d.mkdir(parents=True)
            n = round(durs[name] * FPS)
            for i in range(n):
                await page.evaluate(f'window.SPR.action({name!r}, {i / FPS})')
                (await shot(page)).save(d / f'{i + 1:04d}.png', optimize=False, compress_level=3)
            print(f'{name}: {n} 格 → {d}')
        await b.close()


def font(size):
    for f in ['C:/Windows/Fonts/msjh.ttc', 'C:/Windows/Fonts/NotoSansTC-VF.ttf']:
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


async def preview(out: Path):
    tile = 300
    rows = []  # (背景色, [(標題, 圖)])
    async with async_playwright() as p:
        b, page = await open_page(p)

        async def pose(js):
            await page.evaluate(js)
            return await shot(page)

        heads = [
            ('正面', await pose('window.SPR.pose({})')),
            ('側面 45°', await pose('window.SPR.pose({rotY: 0.8})')),
            ('表情：微笑', await pose("window.SPR.expression('smile', {rotY: 0.15})")),
            ('表情：驚喜', await pose("window.SPR.expression('wow', {rotY: -0.12})")),
            ('表情：開心', await pose("window.SPR.expression('happy')")),
            ('眨眼', await pose('window.SPR.pose({lid: 1})')),
        ]
        keys = []
        for name, t in [('pop', 0.42), ('hello', 1.0), ('fly', 1.35), ('point', 1.0), ('cheer', 0.66), ('bye', 2.2)]:
            await page.evaluate(f'window.SPR.action({name!r}, {t})')
            keys.append((f'{name} {t:.2f}s', await shot(page)))
        pals = []
        for pal in PALETTES:
            await page.evaluate(f'window.SPR.setPalette({pal!r})')
            pals.append((pal['name'], await pose('window.SPR.pose({rotY: 0.2})')))
        await page.evaluate(f'window.SPR.setPalette({PALETTES[1]!r})')
        light = [heads[0], heads[3], heads[4], ('cheer（淺底）', keys[4][1]), ('point（淺底）', keys[3][1]), ('fly（淺底）', keys[2][1])]
        await b.close()
    rows = [('#0E1830', heads), ('#0E1830', keys), ('#F4F7FB', light), ('#0E1830', pals)]
    W = tile * 6
    H = len(rows) * (tile + 34) + 60
    img = Image.new('RGB', (W, H), '#1A2340')
    d = ImageDraw.Draw(img)
    d.text((16, 14), '車燈小精靈・新設計預覽（第 1 列正面／45 度／表情，第 2 列動作關鍵格，第 3 列淺色底，第 4 列五種光色）', fill='#F6F1E3', font=font(22))
    y = 60
    for bg, tiles in rows:
        for i, (label, im) in enumerate(tiles):
            cell = Image.new('RGBA', (tile, tile), bg)
            cell.alpha_composite(im.resize((tile, tile), Image.LANCZOS))
            img.paste(cell.convert('RGB'), (i * tile, y))
            d.text((i * tile + 8, y + tile + 4), label, fill='#F6F1E3', font=font(20))
        y += tile + 34
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=92)
    print('preview →', out)


if __name__ == '__main__':
    bundle()
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'preview'
    if cmd == 'preview':
        asyncio.run(preview(Path(sys.argv[2]) if len(sys.argv) > 2 else SOUT / 'preview.jpg'))
    else:
        asyncio.run(actions(sys.argv[2:]))
