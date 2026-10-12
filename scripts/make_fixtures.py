"""產生示範車牌（PNG、可列印 PDF）與 e2e 測試用的假相機影片。

用法（在專案根目錄）：python scripts/make_fixtures.py
輸出：
  docs/plates/plate_*.png、docs/plates/yoxi點燈城_示範車牌.pdf
  scripts/fixtures/camera.y4m（直式 720x1280，車牌在取景框位置；需要 ffmpeg）
"""
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLATES = os.path.join(ROOT, 'docs', 'plates')
FIX = os.path.join(ROOT, 'scripts', 'fixtures')

BOLD_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
]
CJK_CANDIDATES = [
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    '/System/Library/Fonts/PingFang.ttc',
    'C:/Windows/Fonts/msjhbd.ttc',
    'C:/Windows/Fonts/msjh.ttc',
]

# 虛構示範車牌（對應 src/lib/lucky.ts 的 DEMO_FLEET_HASHES；ABC-1234 不在名單內）
PLATES_LIST = [
    ('TDX-3963', '加總 21（幸運數字設 21 時中獎）'),
    ('TDX-5528', '加總 20（差 1）'),
    ('TDX-1832', '加總 14'),
    ('TDX-7708', '加總 22（差 1）'),
    ('ABC-1234', '非示範車隊（會被拒絕）'),
]


def font(cands, size):
    for p in cands:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    print('找不到合適字型，改用預設字型（辨識效果可能較差）', file=sys.stderr)
    return ImageFont.load_default()


def plate(text, f, red=False):
    w, h = 1040, 330
    im = Image.new('RGB', (w, h), 'white')
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([6, 6, w - 7, h - 7], radius=28, outline=(20, 20, 20), width=10)
    color = (200, 30, 40) if red else (15, 15, 15)
    box = d.textbbox((0, 0), text, font=f)
    tw, th = box[2] - box[0], box[3] - box[1]
    d.text(((w - tw) / 2 - box[0], (h - th) / 2 - box[1]), text, font=f, fill=color)
    for x in (60, w - 60):
        d.ellipse([x - 14, 36, x + 14, 64], outline=(120, 120, 120), width=4)
    return im


def main():
    os.makedirs(PLATES, exist_ok=True)
    os.makedirs(FIX, exist_ok=True)
    big = font(BOLD_CANDIDATES, 190)
    small = font(CJK_CANDIDATES, 34)
    imgs = []
    for t, note in PLATES_LIST:
        im = plate(t, big, red=t.startswith('TDX'))
        im.save(os.path.join(PLATES, f'plate_{t}.png'))
        imgs.append((im, t, note))
    pages = []
    for i in range(0, len(imgs), 2):
        pg = Image.new('RGB', (2480, 3508), 'white')
        d = ImageDraw.Draw(pg)
        d.text((150, 120), 'yoxi 點燈城｜示範用虛構車牌（僅供黑客松 demo 錄影，非真實車輛）', font=small, fill=(60, 60, 60))
        for k, (im, t, note) in enumerate(imgs[i:i + 2]):
            y = 400 + k * 1500
            pg.paste(im.resize((2080, 660)), (200, y))
            d.text((200, y + 700), f'{t}　{note}', font=small, fill=(60, 60, 60))
        pages.append(pg)
    pages[0].save(os.path.join(PLATES, 'yoxi點燈城_示範車牌.pdf'), save_all=True, append_images=pages[1:], resolution=300)

    # 直式假相機畫面：車牌位於 App 取景框（畫面 36%–60% 高度）內
    bg = Image.new('RGB', (720, 1280), (38, 46, 62))
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle([40, 380, 680, 900], radius=60, fill=(226, 231, 239))
    d.rectangle([40, 860, 680, 1280], fill=(25, 30, 42))
    bg.paste(imgs[0][0].resize((500, 159)), (110, 545))
    frame = os.path.join(FIX, 'camera_frame.png')
    bg.save(frame)
    if shutil.which('ffmpeg'):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', frame, '-t', '3', '-r', '10', '-pix_fmt', 'yuv420p', os.path.join(FIX, 'camera.y4m')], check=True)
        print('已產生 scripts/fixtures/camera.y4m')
    else:
        print('沒有 ffmpeg：無法產生假相機影片（e2e 的拍車步驟會略過）', file=sys.stderr)
    print('已產生示範車牌：docs/plates/')


if __name__ == '__main__':
    main()
