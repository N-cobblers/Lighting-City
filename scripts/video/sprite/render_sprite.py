"""錄製車燈小精靈的動畫：每個動作輸出 30fps、720×720 的透明 PNG 序列，另外拼一張設計預覽圖。

用法（專案根目錄）：
  python scripts/video/sprite/render_sprite.py preview [輸出路徑]   # 預覽圖（正面、45 度、表情、動作關鍵格、五種光色）
  python scripts/video/sprite/render_sprite.py actions [動作 ...]   # PNG 序列 → scripts/video/out/sprite/<動作>/0001.png…
  python scripts/video/sprite/render_sprite.py actions3 [動作 ...]  # 第三版影片：enter、talk_<表情>_<嘴型>、cheer、wave、bye → scripts/video/out/sprite3/
  python scripts/video/sprite/render_sprite.py preview3 [輸出路徑]  # 第三版動作的預覽圖（關鍵格、同一格三種嘴型並排）
"""
import asyncio
import io
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont
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


async def actions(names, v3=False):
    out = OUT / 'sprite3' if v3 else SOUT
    fn = 'action3' if v3 else 'action'
    async with async_playwright() as p:
        b, page = await open_page(p)
        durs = await page.evaluate('window.SPR.durations3' if v3 else 'window.SPR.durations')
        for name in names or list(durs):
            d = out / name
            if d.exists():
                shutil.rmtree(d)
            d.mkdir(parents=True)
            n = round(durs[name] * FPS)
            for i in range(n):
                await page.evaluate(f'window.SPR.{fn}({name!r}, {i / FPS})')
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


async def preview3(out: Path):
    """第三版：每列一個動作的關鍵格；講話的四種表情各一列，同一格的三種嘴型並排（檢查身體是否逐格一樣）。"""
    tile = 260
    rows = []
    async with async_playwright() as p:
        b, page = await open_page(p)

        async def at(name, t):
            await page.evaluate(f'window.SPR.action3({name!r}, {t})')
            return await shot(page)

        mouth = await page.evaluate('window.SPR.mouthScreen()')
        rows.append(('enter', [(f'enter {t:.2f}', await at('enter', t)) for t in (0.0, 0.14, 0.24, 0.4, 0.6, 0.74, 1.0)]))
        diffs = {}
        for e in ('happy', 'excited', 'worried', 'surprised'):
            tiles = []
            for t in (0.25, 0.75):
                ims = [await at(f'talk_{e}_{lv}', t) for lv in (0, 1, 2)]
                tiles += [(f'{e} {t:.2f} 嘴{lv}', im) for lv, im in zip((0, 1, 2), ims)]
                # 三種嘴型只有嘴巴附近不同：找出有差異的範圍
                box = ImageChops.difference(ims[0], ims[2]).convert('L').point(lambda v: 255 if v > 24 else 0).getbbox()
                diffs[f'{e}@{t}'] = box
            # 眨眼最閉的那一格（happy 本來就是笑眼，取 1.30）
            tb = {'happy': 1.3, 'excited': 1.38, 'worried': 1.23, 'surprised': 1.56}[e]
            tiles.append((f'{e} {tb:.2f} 眨眼', await at(f'talk_{e}_1', tb)))
            rows.append((e, tiles))
        rows.append(('cheer', [(f'cheer {t:.2f}', await at('cheer', t)) for t in (0.0, 0.18, 0.3, 0.48, 0.62, 0.92, 1.26)]))
        rows.append(('wave/bye', [(f'wave {t:.2f}', await at('wave', t)) for t in (0.0, 0.5, 1.0)] + [(f'bye {t:.2f}', await at('bye', t)) for t in (1.25, 1.45, 1.65, 1.8)]))
        await b.close()
    W, cols = tile * 7, 7
    H = len(rows) * (tile + 30) + 60
    img = Image.new('RGB', (W, H), '#1A2340')
    d = ImageDraw.Draw(img)
    d.text((16, 14), f'車燈小精靈・第三版動作預覽（嘴巴中心約在 {mouth}，720 畫布）', fill='#F6F1E3', font=font(22))
    y = 60
    for _, tiles in rows:
        for i, (label, im) in enumerate(tiles[:cols]):
            cell = Image.new('RGBA', (tile, tile), '#0E1830')
            cell.alpha_composite(im.resize((tile, tile), Image.LANCZOS))
            img.paste(cell.convert('RGB'), (i * tile, y))
            d.text((i * tile + 6, y + tile + 3), label, fill='#F6F1E3', font=font(17))
        y += tile + 30
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=92)
    print('preview3 →', out)
    print('mouth center (720 canvas):', mouth)
    for k, v in diffs.items():
        print('  mouth-variant diff bbox', k, v)


if __name__ == '__main__':
    bundle()
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'preview'
    if cmd == 'preview':
        asyncio.run(preview(Path(sys.argv[2]) if len(sys.argv) > 2 else SOUT / 'preview.jpg'))
    elif cmd == 'preview3':
        asyncio.run(preview3(Path(sys.argv[2]) if len(sys.argv) > 2 else OUT / 'sprite3' / 'preview.jpg'))
    elif cmd == 'actions3':
        asyncio.run(actions(sys.argv[2:], v3=True))
    else:
        asyncio.run(actions(sys.argv[2:]))
