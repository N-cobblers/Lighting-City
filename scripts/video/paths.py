"""影片製作用到的路徑：輸出都放在 scripts/video/out/（不進 git）。"""
import glob
import os
import sys
from pathlib import Path

VIDEO = Path(__file__).resolve().parent
ROOT = VIDEO.parent.parent
OUT = VIDEO / 'out'
OUT.mkdir(exist_ok=True)
Y4M = str(ROOT / 'scripts' / 'fixtures' / 'camera.y4m')  # python scripts/make_fixtures.py 產生的假相機影片


def _chrome():
    """完整版 Chromium（不是 headless shell）：無頭模式也能用顯示卡畫地圖，錄出來才順。"""
    base = os.path.expandvars('%LOCALAPPDATA%/ms-playwright') if sys.platform == 'win32' else os.path.expanduser('~/.cache/ms-playwright')
    hits = sorted(glob.glob(f'{base}/chromium-*/chrome-win64/chrome.exe') + glob.glob(f'{base}/chromium-*/chrome-linux/chrome'))
    return hits[-1] if hits else None


CHROME = _chrome()
GPU_ARGS = ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] if sys.platform == 'win32' else ['--ignore-gpu-blocklist']
