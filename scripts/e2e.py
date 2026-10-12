"""端對端測試：用 Playwright 開手機尺寸的 Chromium，跑過地圖、搭車點亮、小精靈、拍車辨識、AR、好友、營運、劇本、設定。

先建置並啟動預覽：
  npm run build && npm run preview -- --port 4173
再執行（專案根目錄）：
  pip install -r scripts/requirements.txt && python -m playwright install chromium
  python scripts/e2e.py [--url http://localhost:4173/] [--headed]

截圖輸出到 scripts/output/。沒有 Firebase 設定時，Gemini 與排行會走示範資料，這是預期行為。
"""
import argparse
import os
import subprocess
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'scripts', 'output')
Y4M = os.path.join(ROOT, 'scripts', 'fixtures', 'camera.y4m')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='http://localhost:4173/')
    ap.add_argument('--headed', action='store_true')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if not os.path.exists(Y4M):
        subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'make_fixtures.py')], check=False)
    has_cam = os.path.exists(Y4M)
    args = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--enable-unsafe-swiftshader']
    if has_cam:
        args.append(f'--use-file-for-fake-video-capture={Y4M}')
    logs, failures = [], []

    def shot(page, name):
        page.screenshot(path=os.path.join(OUT, f'{name}.png'))

    with sync_playwright() as p:
        b = p.chromium.launch(headless=not a.headed, args=args)
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, permissions=['camera', 'geolocation'], geolocation={'latitude': 25.0376, 'longitude': 121.5636})
        page = ctx.new_page()
        page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'[:300]))
        page.on('pageerror', lambda e: failures.append(f'pageerror: {e}'[:500]))
        tab = lambda name: page.get_by_role('button', name=name, exact=True).click()

        page.goto(a.url)
        page.wait_for_timeout(9000)
        shot(page, '01_map')
        start = page.locator('.chip-lamp').first.inner_text()

        page.get_by_role('button', name='預約 yoxi').first.click()
        page.wait_for_timeout(11000)
        shot(page, '02_ride')
        after = page.locator('.chip-lamp').first.inner_text()
        if start == after:
            failures.append(f'搭車後點亮比例沒有增加（{start} → {after}）')

        tab('小精靈')
        page.get_by_role('button', name='今晚會下雨嗎？').click()
        page.wait_for_timeout(3500)
        shot(page, '03_chat')

        tab('拍車')
        page.wait_for_timeout(3000)
        if has_cam:
            for _ in range(60):
                if '載入' not in page.locator('.scan-panel').inner_text():
                    break
                page.wait_for_timeout(1000)
            page.get_by_role('button', name='拍照辨識車牌').click()
            for _ in range(60):
                if '辨識中' not in page.locator('.scan-panel').inner_text():
                    break
                page.wait_for_timeout(1000)
            page.wait_for_timeout(2500)
            shot(page, '04_scan')
            panel = page.locator('.scan-panel').inner_text()
            if 'TDX-39' not in panel:
                failures.append('拍車沒有辨識出 TDX-3963：' + panel.replace('\n', ' ')[:200])
            ar = page.get_by_role('button', name='AR 召喚')
            if ar.count():
                ar.click()
                page.wait_for_timeout(4000)
                shot(page, '05_ar')
                page.get_by_role('button', name='關閉').click()

        tab('好友')
        page.wait_for_timeout(2500)
        shot(page, '06_friends')

        tab('營運')
        page.wait_for_timeout(9000)
        page.get_by_role('button', name='設計空車時段任務').click()
        page.wait_for_timeout(3000)
        shot(page, '07_ops')

        page.get_by_role('button', name='一天劇本').click()
        page.wait_for_timeout(400)
        page.get_by_role('menuitem').nth(3).click()
        page.wait_for_timeout(1500)
        shot(page, '08_evening')

        page.get_by_role('button', name='設定').click()
        page.wait_for_timeout(500)
        shot(page, '09_settings')
        b.close()

    errors = [l for l in logs if l.startswith('[error]') and 'Failed to load resource' not in l]
    print('\n'.join(errors[-20:]))
    if failures:
        print('\n失敗：\n' + '\n'.join(failures))
        sys.exit(1)
    print(f'全部通過，截圖在 {OUT}')


if __name__ == '__main__':
    main()
