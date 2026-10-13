"""自動錄影：照 3 分鐘影片的分鏡，在手機尺寸的 Chromium（用顯示卡繪圖）跑一遍小涵的一天，
用 CDP screencast 存下每一格畫面與時間，並記下每個動作的時間點（markers），之後剪接用。

用法：python scripts/video/record_story.py [--url http://localhost:4173/] [--out scripts/video/out/rec/story]
      [--sections morning,personas,noon,scan,evening,ops]；小精靈用工具那段另錄：--sections chat --out scripts/video/out/rec/chat
"""
import argparse
import asyncio
import base64
import json
import os
import re
import time

from playwright.async_api import async_playwright

from paths import CHROME, GPU_ARGS, OUT, Y4M
SETTINGS_KEY = 'yoxi-lighting-city:settings:v1'
SETTINGS = {'weatherMode': 'clear', 'luckyOverride': '21', 'forceDemo': True, 'demoPersonaId': 'xiao-han', 'allowRepeat': False}

TAP_CSS = """
.rec-tap{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;
background:rgba(255,201,74,.45);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 12px rgba(255,201,74,.8);
pointer-events:none;z-index:2147483647;animation:rec-tap .6s ease-out forwards}
@keyframes rec-tap{0%{transform:scale(.35);opacity:1}100%{transform:scale(1.45);opacity:0}}
"""


class Recorder:
    def __init__(self, out, dpr=2.5):
        self.dpr = dpr
        self.out = out
        self.frames_dir = os.path.join(out, 'frames')
        os.makedirs(self.frames_dir, exist_ok=True)
        self.frames = []
        self.markers = []
        self.notes = {}
        self.cdp = None
        self.on = False

    async def start(self, ctx, page):
        self.cdp = await ctx.new_cdp_session(page)
        self.cdp.on('Page.screencastFrame', self._frame)
        await self.cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 92, 'maxWidth': int(390 * self.dpr), 'maxHeight': int(844 * self.dpr), 'everyNthFrame': 1})
        self.on = True

    def _frame(self, ev):
        if not self.on:
            return
        asyncio.ensure_future(self.cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']}))
        i = len(self.frames) + 1
        name = f'{i:06d}.jpg'
        with open(os.path.join(self.frames_dir, name), 'wb') as f:
            f.write(base64.b64decode(ev['data']))
        self.frames.append([name, ev['metadata']['timestamp']])

    def mark(self, name):
        self.markers.append([name, time.time()])
        print(f'  mark {name}', flush=True)

    async def stop(self):
        self.on = False
        try:
            await self.cdp.send('Page.stopScreencast')
        except Exception:
            pass
        with open(os.path.join(self.out, 'frames.json'), 'w', encoding='utf-8') as f:
            json.dump(self.frames, f)
        with open(os.path.join(self.out, 'markers.json'), 'w', encoding='utf-8') as f:
            json.dump({'markers': self.markers, 'notes': self.notes}, f, ensure_ascii=False, indent=1)


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='http://localhost:4173/')
    ap.add_argument('--out', default=str(OUT / 'rec' / 'story'))
    ap.add_argument('--sections', default='morning,personas,noon,scan,evening,ops')
    ap.add_argument('--dpr', type=float, default=2.5)
    a = ap.parse_args()
    sections = a.sections.split(',')
    rec = Recorder(a.out, a.dpr)
    problems = []

    args = GPU_ARGS + [f'--force-device-scale-factor={a.dpr}', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={Y4M}']
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, executable_path=CHROME, args=args)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=a.dpr, locale='zh-TW', timezone_id='Asia/Taipei',
                                  permissions=['camera', 'geolocation'], geolocation={'latitude': 25.0376, 'longitude': 121.5636})
        await ctx.add_init_script(f"""(() => {{ try {{
            const k = {json.dumps(SETTINGS_KEY)};
            if (!sessionStorage.getItem('rec-init')) {{
              const cur = JSON.parse(localStorage.getItem(k) || '{{}}');
              localStorage.setItem(k, JSON.stringify(Object.assign(cur, {json.dumps(SETTINGS)})));
              sessionStorage.setItem('rec-init', '1');
            }}
          }} catch (e) {{}} }})()""")
        page = await ctx.new_page()
        page.on('pageerror', lambda e: problems.append(f'pageerror: {e}'[:300]))

        async def tap(loc, hold=180):
            loc = loc.first
            await loc.scroll_into_view_if_needed()
            box = await loc.bounding_box()
            if box:
                await page.evaluate("""([x, y]) => { const d = document.createElement('div'); d.className = 'rec-tap';
                    d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 900) }""",
                                    [box['x'] + box['width'] / 2, box['y'] + box['height'] / 2])
                await page.wait_for_timeout(hold)
            await loc.click()

        def tab_btn(name):
            return page.get_by_role('button', name=re.compile('^' + re.escape(name) + r'\s*(（有新預報）)?$'))

        async def script_step(i):
            await tap(page.get_by_role('button', name='一天劇本'))
            await page.wait_for_timeout(700)
            await tap(page.get_by_role('menuitem').nth(i))

        async def open_sheet():
            if await page.locator('.sheet-summary').count():
                await tap(page.locator('.sheet-summary'))
                await page.wait_for_timeout(700)

        async def wait_text(loc, text, absent=False, tries=60, step=500):
            for _ in range(tries):
                t = await loc.inner_text() if await loc.count() else ''
                if (text not in t) if absent else (text in t):
                    return True
                await page.wait_for_timeout(step)
            return False

        async def step(name, coro):
            try:
                await coro
            except Exception as e:
                problems.append(f'{name}: {e}'[:300])
                print(f'  !! {name}: {e}'[:300], flush=True)

        await page.goto(a.url)
        await page.add_style_tag(content=TAP_CSS)
        await page.wait_for_timeout(9000)
        await rec.start(ctx, page)
        rec.mark('start')
        await page.wait_for_timeout(1500)

        # ② 早上 08:30：地圖、小精靈預報、選「晚點走」
        async def morning():
            await script_step(0)
            await page.wait_for_timeout(2500)
            rec.mark('morning_map')
            await page.wait_for_timeout(5000)
            await tap(tab_btn('小精靈'))
            rec.mark('chat_open')
            await page.wait_for_timeout(1500)
            rec.notes['forecast'] = (await page.locator('.chat-log').inner_text())[:600]
            await page.wait_for_timeout(5000)
            await tap(page.get_by_role('button', name='晚點走'))
            rec.mark('later_tapped')
            await page.wait_for_timeout(2500)
            await tap(page.get_by_role('button', name='到地圖看這張卡'))
            rec.mark('later_card')
            await page.wait_for_timeout(5000)
        if 'morning' in sections:
            await step('morning', morning())

        # ③ 客串：切到阿哲、小雅，再切回小涵
        async def personas():
            for who in ['阿哲', '小雅']:
                await tap(page.locator('.persona-chip'))
                await page.wait_for_timeout(700)
                await tap(page.get_by_role('menuitemradio', name=who))
                rec.mark(f'persona_{who}')
                await page.wait_for_timeout(2500)
                await open_sheet()
                await page.wait_for_timeout(4000)
            await tap(page.locator('.persona-chip'))
            await page.wait_for_timeout(700)
            await tap(page.get_by_role('menuitemradio', name='小涵'))
            rec.mark('persona_back')
            await page.wait_for_timeout(3000)
        if 'personas' in sections:
            await step('personas', personas())

        # ④ 午休 12:30：步行任務「我到了」
        async def noon():
            await script_step(1)
            await page.wait_for_timeout(2500)
            await open_sheet()
            rec.mark('noon')
            await page.wait_for_timeout(2500)
            await tap(page.get_by_role('button', name='我到了'))
            rec.mark('walk_done')
            await page.wait_for_timeout(5000)
        if 'noon' in sections:
            await step('noon', noon())

        # ⑤ 路上 15:00（劇本會直接打開拍車分頁）：拍車、小精靈跳出；好友排行
        async def scan():
            await script_step(2)
            rec.mark('afternoon')
            await wait_text(page.locator('.scan-panel'), '載入', absent=True, tries=90)
            await page.wait_for_timeout(2500)
            rec.mark('scan_ready')
            await tap(page.get_by_role('button', name='拍照辨識車牌'))
            rec.mark('scan_shot')
            await wait_text(page.locator('.scan-panel'), '辨識中', absent=True, tries=60)
            rec.mark('scan_result')
            await page.wait_for_timeout(6000)
            rec.notes['scan'] = (await page.locator('.scan-panel').inner_text())[:300]
            await tap(tab_btn('好友'))
            rec.mark('friends')
            await page.wait_for_timeout(4500)
        if 'scan' in sections:
            await step('scan', scan())

        # ⑥ 傍晚 18:05：按早上排好的 19:00 卡出發，錯峰之光換 Points
        async def evening():
            await script_step(3)
            await page.wait_for_timeout(2500)
            await open_sheet()
            rec.mark('evening')
            await page.wait_for_timeout(2000)
            card = page.locator('.task', has_text='19:00 從市府回家')
            await card.first.scroll_into_view_if_needed()
            await page.wait_for_timeout(1200)
            await tap(card.first.get_by_role('button', name='預約 yoxi'))
            rec.mark('ride_start')
            got = await wait_text(page.locator('.sprite-pop'), '和泰 Points', tries=90, step=300)
            rec.mark('points' if got else 'points_missing')
            if got:
                rec.notes['points'] = await page.locator('.sprite-pop').first.inner_text()
            await page.wait_for_timeout(6000)
            rec.mark('ride_end')
        if 'evening' in sections:
            await step('evening', evening())

        # ⑦ AI：小精靈用工具（另錄一輪，從早上開始）
        async def chat():
            await script_step(0)
            await page.wait_for_timeout(2500)
            await tap(tab_btn('小精靈'))
            await page.wait_for_timeout(1500)
            rec.mark('chat2')
            box = page.locator('#chat-input')
            await tap(box)
            await box.press_sequentially('明天 8 點從公司叫車好叫嗎？', delay=70)
            await page.wait_for_timeout(400)
            await box.press('Enter')
            rec.mark('ask_forecast')
            await page.wait_for_timeout(5000)
            rec.notes['tool_answer'] = (await page.locator('.chat-log').inner_text())[-400:]
            await tap(page.get_by_role('button', name='幫我避開尖峰'))
            rec.mark('propose')
            await page.wait_for_timeout(3500)
            await tap(page.get_by_role('button', name='確認排進任務'))
            rec.mark('confirm')
            await page.wait_for_timeout(4000)

        # ⑦⑧ 營運頁：模型與系統卡、錯峰點燈卡
        async def ops():
            await tap(page.get_by_role('button', name='營運', exact=True))
            rec.mark('ops')
            await page.wait_for_timeout(7000)
            for sel, name in [('.model-card', 'model_card'), ('.offpeak-card', 'offpeak_card')]:
                await page.evaluate("s => document.querySelector(s)?.scrollIntoView({behavior: 'smooth', block: 'start'})", sel)
                rec.mark(name)
                await page.wait_for_timeout(7000)
            await page.evaluate("() => document.querySelector('.offpeak-rules')?.scrollIntoView({behavior: 'smooth', block: 'center'})")
            rec.mark('offpeak_rules')
            await page.wait_for_timeout(5000)

        for name, fn in [('chat', chat), ('ops', ops)]:
            if name in sections:
                await step(name, fn())

        rec.mark('end')
        await rec.stop()
        await b.close()

    with open(os.path.join(a.out, 'problems.json'), 'w', encoding='utf-8') as f:
        json.dump(problems, f, ensure_ascii=False, indent=1)
    print(f'frames={len(rec.frames)} problems={len(problems)}')
    for x in problems:
        print('  ' + x)


if __name__ == "__main__":
    asyncio.run(main())
