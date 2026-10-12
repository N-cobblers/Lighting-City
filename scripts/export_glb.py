"""把 src/lib/sprite3d.ts 的車燈小精靈匯出成 GLB（public/sprites/sprite-0..4.glb），給 AR 使用。
改了小精靈造型或配色後要重新匯出。

先啟動開發伺服器：npm run dev -- --port 5173
再執行：python scripts/export_glb.py [--url http://localhost:5173/]
"""
import argparse
import base64
import os

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument('--url', default='http://localhost:5173/')
a = ap.parse_args()

with sync_playwright() as p:
    b = p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    pg = b.new_page()
    pg.goto(a.url)
    pg.wait_for_timeout(3000)
    res = pg.evaluate(
        """async () => {
      const m = await import('/src/lib/sprite3d.ts'); const l = await import('/src/lib/lucky.ts');
      const out = [];
      for (const pal of l.SPRITE_PALETTES) {
        const buf = new Uint8Array(await (await m.exportSpriteGlb(pal)).arrayBuffer());
        let s = ''; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
        out.push(btoa(s));
      }
      return out;
    }"""
    )
    os.makedirs(os.path.join(ROOT, 'public', 'sprites'), exist_ok=True)
    for i, b64 in enumerate(res):
        path = os.path.join(ROOT, 'public', 'sprites', f'sprite-{i}.glb')
        with open(path, 'wb') as f:
            f.write(base64.b64decode(b64))
        print('寫入', path)
    b.close()
