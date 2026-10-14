"""檢查用：輸出一張 720 原尺寸的姿勢圖（深色與淺色背景左右並排）。
用法：python scripts/video/sprite/inspect_sprite.py <輸出.png> [JS 姿勢物件，例如 "{rotY: 0.3}"] [光色索引 0–4]"""
import asyncio
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_sprite import PALETTES, bundle, open_page, shot  # noqa: E402


async def main(out, pose, pal):
    async with async_playwright() as p:
        b, page = await open_page(p)
        await page.evaluate(f'window.SPR.setPalette({PALETTES[pal]!r})')
        await page.evaluate(f'window.SPR.pose({pose})')
        im = await shot(page)
        await b.close()
    w = Image.new('RGB', (1440, 720), '#0E1830')
    w.paste(Image.new('RGB', (720, 720), '#F4F7FB'), (720, 0))
    canvas = w.convert('RGBA')
    canvas.alpha_composite(im, (0, 0))
    canvas.alpha_composite(im, (720, 0))
    canvas.convert('RGB').save(out)
    print(out)


if __name__ == '__main__':
    bundle()
    asyncio.run(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else '{}', int(sys.argv[3]) if len(sys.argv) > 3 else 1))
