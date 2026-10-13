"""端對端測試：用 Playwright 開手機尺寸的 Chromium，跑過任務輪播、搭車點亮、錯峰點燈（早上選晚點走、傍晚搭 19:00 卡換和泰 Points）、小精靈預報（現在走）、拍車辨識與拍車任務、AR、好友、營運、四個時段配色、設定。

先建置並啟動預覽：
  npm run build && npm run preview -- --port 4173
再執行（專案根目錄）：
  pip install -r scripts/requirements.txt && python -m playwright install chromium
  python scripts/e2e.py [--url http://localhost:4173/] [--headed]

截圖輸出到 scripts/output/。沒有 Firebase 設定時，Gemini 與排行會走示範資料，這是預期行為。
"""
import argparse
import os
import re
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
        # 小精靈分頁有新預報時，名稱後面會多「（有新預報）」給讀屏軟體
        tab = lambda name: page.get_by_role('button', name=re.compile('^' + re.escape(name) + r'\s*(（有新預報）)?$')).click()
        phase = lambda: page.evaluate('document.documentElement.dataset.phase')

        def script_step(i):
            page.get_by_role('button', name='一天劇本').click()
            page.wait_for_timeout(400)
            page.get_by_role('menuitem').nth(i).click()
            page.wait_for_timeout(1500)

        page.goto(a.url)
        page.wait_for_timeout(9000)
        if page.locator('.tab-dot').count() == 0:
            failures.append('小精靈分頁沒有亮出新預報的紅點')
        script_step(0)  # 早上 08:30：早晨配色、淺色底圖
        page.wait_for_timeout(3000)
        if phase() != 'dawn':
            failures.append(f'08:30 應該是早晨配色，實際是 {phase()}')
        shot(page, 'p1_dawn')

        # 錯峰點燈・早上決定：不搭車的時候先看預報，選「晚點走」
        tab('小精靈')
        page.wait_for_timeout(1200)
        log = page.locator('.chat-log').inner_text()
        if '叫車到上車' not in log:
            failures.append('小精靈第一句沒有叫車預報：' + log.replace('\n', ' ')[:120])
        if '312' not in log and '128' not in log:
            failures.append('預報旁沒有城市層級的錯峰人數：' + log.replace('\n', ' ')[:160])
        shot(page, 'm1_forecast')
        page.get_by_role('button', name='晚點走').click()
        page.wait_for_timeout(1200)
        log = page.locator('.chat-log').inner_text()
        if '19:00' not in log:
            failures.append('按「晚點走」後小精靈沒有回覆 19:00：' + log.replace('\n', ' ')[-120:])
        shot(page, '03_chat')
        later_card = '今日任務' in log  # 週末的預報是下一個平日，不會多一張今天的卡
        if later_card:
            page.get_by_role('button', name='到地圖看這張卡').click()
            page.wait_for_timeout(2500)  # 等輪播滑到那張卡
            shot(page, '03b_later_card')
            if page.get_by_text('19:00 從市府回家').count() == 0:
                failures.append('按「晚點走」後任務輪播沒有多一張 19:00 的卡')

        script_step(1)  # 午休 12:30：步行、拍車、搭車各一張卡，加上早上排好的 19:00 卡
        if phase() != 'day':
            failures.append(f'12:30 應該是白天配色，實際是 {phase()}')
        if later_card and page.get_by_text('19:00 從市府回家').count() == 0:
            failures.append('換到午休時段後，早上排好的 19:00 卡不見了')
        shot(page, '01_map')
        start = page.locator('.chip-lamp').first.inner_text()

        page.get_by_role('button', name='我到了').first.click()
        page.wait_for_timeout(600)
        if page.locator('.task.done').count() < 1:
            failures.append('按「我到了」之後卡片沒有蓋上已完成')
        page.wait_for_timeout(1200)
        shot(page, '01b_walk_done')

        page.get_by_role('button', name='預約 yoxi').first.click()  # 松菸：任務卡是預約，算錯峰
        page.wait_for_timeout(11000)
        shot(page, '02_ride')
        after = page.locator('.chip-lamp').first.inner_text()
        if start == after:
            failures.append(f'搭車後點亮比例沒有增加（{start} → {after}）')

        tab('城市')
        page.wait_for_timeout(600)
        if page.locator('.sheet-summary').count():  # 搭完車抽屜會收起來
            page.locator('.sheet-summary').click()
            page.wait_for_timeout(600)
        page.get_by_role('button', name='去拍車').first.click()
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
            scan_card = page.locator('.task', has_text='找到一台 yoxi 車')
            if scan_card.count() and 'done' not in (scan_card.first.get_attribute('class') or ''):
                failures.append('拍到 yoxi 車後，拍車任務卡沒有自動完成')
            ar = page.get_by_role('button', name='AR 召喚')
            if ar.count():
                ar.click()
                page.wait_for_timeout(4000)
                shot(page, '05_ar')
                page.get_by_role('button', name='關閉').click()

        tab('好友')
        page.wait_for_timeout(2500)
        shot(page, '06_friends')
        if '揪團' in page.locator('.friends-view').inner_text():
            failures.append('好友頁還有揪團卡')

        page.get_by_role('button', name='營運', exact=True).click()
        page.wait_for_timeout(9000)
        card = page.locator('.offpeak-card')
        if card.count() == 0 or '和泰' not in card.inner_text():
            failures.append('營運頁沒有「錯峰點燈」卡')
        else:
            card.scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            shot(page, '07b_ops_offpeak')
        page.get_by_role('button', name='設計空車時段任務').click()
        page.wait_for_timeout(3000)
        shot(page, '07_ops')
        page.get_by_role('button', name='← 回乘客畫面').click()
        page.wait_for_timeout(500)

        script_step(2)  # 路上 15:00：黃昏配色
        tab('城市')
        page.wait_for_timeout(3000)
        if phase() != 'dusk':
            failures.append(f'15:00 應該是黃昏配色，實際是 {phase()}')
        shot(page, 'p3_dusk')

        script_step(3)  # 傍晚 18:05：按早上排好的 19:00 卡出發，錯峰點燈換 Points
        if phase() != 'night':
            failures.append(f'18:05 應該是夜晚配色，實際是 {phase()}')
        if later_card:
            page.wait_for_timeout(1500)
            if page.locator('.sheet-summary').count():
                page.locator('.sheet-summary').click()
                page.wait_for_timeout(600)
            later = page.locator('.task', has_text='19:00 從市府回家')
            if later.count() == 0:
                failures.append('傍晚找不到早上排好的 19:00 卡')
            else:
                later.first.get_by_role('button', name='預約 yoxi').click()
                got = False
                for _ in range(44):
                    page.wait_for_timeout(500)
                    pop = page.locator('.sprite-pop')
                    if pop.count() and '和泰 Points' in pop.first.inner_text():
                        got = True
                        break
                if got:
                    page.wait_for_timeout(2500)  # 讓地圖把整條軌跡畫完
                    shot(page, 'e1_points')
                else:
                    failures.append('錯峰搭車後沒有跳出換到和泰 Points')
                page.wait_for_timeout(3000)

        tab('小精靈')
        page.wait_for_timeout(1200)
        shot(page, '08_evening')
        page.get_by_role('button', name='現在走').click()
        # 軟體繪圖下計時器會延遲，固定等幾秒可能剛好錯過等車畫面，改成輪詢
        waited = False
        for _ in range(30):
            page.wait_for_timeout(300)
            if '等車中' in page.locator('.map-view').inner_text():
                waited = True
                break
        page.wait_for_timeout(400)
        shot(page, '10_wait')
        if not waited:
            failures.append('按「現在走」後沒有出現等車畫面')
        page.wait_for_timeout(13000)
        shot(page, '11_home')

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
