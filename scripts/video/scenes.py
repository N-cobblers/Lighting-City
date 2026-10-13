"""第二版地圖場景（不含文字，字由舞台疊上），2560×1440 即時錄製。
模式：cover（黑→車燈光軌點亮城市）、hook（暗暗的城市零星閃光）、turn（光軌劃過、點亮）、ending（全城亮著、鏡頭拉遠）。
用法：python scripts/video/scenes.py cover|hook|turn|ending（需要網路：OpenFreeMap 圖磚）"""
import asyncio
import json
import sys
from pathlib import Path

from playwright.async_api import async_playwright

from paths import CHROME, OUT, ROOT
from record_story import Recorder

NM = (ROOT / 'node_modules').as_uri()


def export_routes():
    """把 App 的路線（src/lib/geo.ts）匯出成 JSON，場景用來點亮真實道路上的格子。"""
    import subprocess
    f = OUT / 'scenes' / 'routes.json'
    f.parent.mkdir(parents=True, exist_ok=True)
    bundle = OUT / 'scenes' / 'geo_bundle.cjs'
    esbuild = ROOT / 'node_modules' / '.bin' / ('esbuild.cmd' if sys.platform == 'win32' else 'esbuild')
    subprocess.run([str(esbuild), 'src/lib/geo.ts', '--bundle', '--platform=node', '--format=cjs', f'--outfile={bundle}', '--log-level=warning'], cwd=ROOT, check=True)
    js = "const g = require(process.argv[1]); require('fs').writeFileSync(process.argv[2], JSON.stringify({ routes: g.ROUTES.map(r => ({ id: r.id, name: r.name, minutes: r.minutes, path: r.path })) }))"
    subprocess.run(['node', '-e', js, str(bundle), str(f)], check=True)
    return f

MODES = {
    # dur 秒；hero/others = 主角路線、其他路線開始點亮的秒數與每格間隔；past = 零星暗光比例；cam = [起, 終]
    'cover': dict(dur=9.5, hero=(0.7, 0.010), others=(1.3, 0.004), past=0.0, cam0=dict(center=[121.548, 25.052], zoom=11.55, bearing=-8), cam1=dict(center=[121.552, 25.048], zoom=12.05, bearing=0)),
    'hook': dict(dur=14.5, hero=None, others=None, past=0.42, cam0=dict(center=[121.535, 25.058], zoom=11.4, bearing=4), cam1=dict(center=[121.538, 25.056], zoom=11.75, bearing=-2)),
    'turn': dict(dur=7.0, hero=(0.2, 0.016), others=(1.4, 0.006), past=0.0, cam0=dict(center=[121.53, 25.06], zoom=11.3, bearing=0), cam1=dict(center=[121.556, 25.046], zoom=12.25, bearing=6)),
    'ending': dict(dur=10.5, hero=(-30, 0.01), others=(-30, 0.01), past=0.0, cam0=dict(center=[121.548, 25.05], zoom=12.1, bearing=-6), cam1=dict(center=[121.515, 25.075], zoom=11.0, bearing=5)),
}

PAGE = r"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="__CSS__">
<style>html,body{margin:0;width:2560px;height:1440px;overflow:hidden;background:#070d1c}#map{position:absolute;inset:0}
#map canvas{filter:brightness(1.3) saturate(1.1)}.maplibregl-ctrl-attrib,.maplibregl-ctrl-logo{display:none!important}
#vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(7,13,28,0) 40%,rgba(7,13,28,.5) 78%,rgba(7,13,28,.85) 100%)}
#black{position:absolute;inset:0;background:#000;opacity:0}
#credit{position:absolute;right:36px;bottom:20px;font:500 20px 'Noto Sans TC',sans-serif;color:rgba(246,241,227,.55)}</style></head>
<body><div id="map"></div><div id="vig"></div><div id="black"></div><div id="credit">地圖 © OpenFreeMap © OpenStreetMap</div>
<script src="__JS__"></script><script src="__H3__"></script><script>
const D = __DATA__, RES = 10;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), ease=x=>{x=clamp(x);return x*x*(3-2*x)}, lerp=(a,b,x)=>a+(b-a)*x;
let seed=11; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function along(path){const out=[],seen=new Set();for(let i=0;i<path.length-1;i++){const[x1,y1]=path[i],[x2,y2]=path[i+1];const d=Math.hypot((x2-x1)*101000,(y2-y1)*111000),n=Math.max(1,Math.ceil(d/45));for(let k=0;k<=n;k++){const t=k/n,c=h3.latLngToCell(y1+(y2-y1)*t,x1+(x2-x1)*t,RES);if(!seen.has(c)){seen.add(c);out.push(c)}}}return out}
const R=Object.fromEntries(D.routes.map(r=>[r.id,r])), cells=new Map();
const get=h=>{if(!cells.has(h))cells.set(h,{id:cells.size+1,h,on:null,lv:0,past:null});return cells.get(h)};
const HERO=['morning-work','evening-home','afternoon-songyan','commute-dunhua'];
if(D.hero) HERO.forEach((id,i)=>along(R[id].path).forEach((h,k)=>{const c=get(h),t=D.hero[0]+i*0.25+k*D.hero[1];c.on=c.on==null?t:Math.min(c.on,t);c.lv=3}));
else HERO.forEach(id=>along(R[id].path).forEach(h=>get(h)));
D.routes.map(r=>r.id).filter(id=>!HERO.includes(id)).forEach(id=>along(R[id].path).forEach((h,k)=>{const c=get(h);if(D.others){const t=D.others[0]+rnd()*1.0+k*D.others[1];c.on=c.on==null?t:Math.min(c.on,t);c.lv=Math.max(c.lv,2)}}));
for(const c of cells.values()) if(rnd()<D.past) c.past=rnd()*3.0;
const feats=[],pts=[];for(const c of cells.values()){feats.push({type:'Feature',id:c.id,properties:{},geometry:{type:'Polygon',coordinates:[h3.cellToBoundary(c.h,true)]}});const[la,ln]=h3.cellToLatLng(c.h);pts.push({type:'Feature',id:c.id,properties:{},geometry:{type:'Point',coordinates:[ln,la]}})}
const map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/dark',center:D.cam0.center,zoom:D.cam0.zoom,bearing:D.cam0.bearing||0,interactive:false,attributionControl:false,fadeDuration:0,pixelRatio:window.devicePixelRatio});
window.ready=false;
map.on('load',()=>{map.addSource('cells',{type:'geojson',data:{type:'FeatureCollection',features:feats}});map.addSource('glow',{type:'geojson',data:{type:'FeatureCollection',features:pts}});
map.addLayer({id:'glow',type:'circle',source:'glow',paint:{'circle-radius':['interpolate',['linear'],['zoom'],10,6,13,18],'circle-blur':1,'circle-color':'#FFC94A','circle-opacity':['*',['coalesce',['feature-state','a'],0],['coalesce',['feature-state','g'],.5]]}});
map.addLayer({id:'cells',type:'fill',source:'cells',paint:{'fill-color':['match',['coalesce',['feature-state','lv'],1],1,'#B8812F',2,'#E9B23F','#FFE9A8'],'fill-opacity':['*',['coalesce',['feature-state','a'],0],.9]}});
map.addLayer({id:'edges',type:'line',source:'cells',paint:{'line-color':'#FFE7A8','line-width':.8,'line-opacity':['*',['coalesce',['feature-state','a'],0],.45]}});
map.once('idle',()=>document.fonts.ready.then(()=>{window.ready=true}))});
let t0=null; window.start=()=>{t0=performance.now();requestAnimationFrame(frame)};
function frame(){const t=(performance.now()-t0)/1000*D.speed,k=ease(t/D.dur);
 map.jumpTo({center:[lerp(D.cam0.center[0],D.cam1.center[0],k),lerp(D.cam0.center[1],D.cam1.center[1],k)],zoom:lerp(D.cam0.zoom,D.cam1.zoom,k),bearing:lerp(D.cam0.bearing||0,D.cam1.bearing||0,k)});
 for(const c of cells.values()){let a=0,lv=1,g=.35;
  if(c.past!=null){a=.42*ease((t-c.past)/.8)*(.75+.25*Math.sin(t*2.2+c.id))}
  if(c.on!=null&&t>=c.on){const x=ease((t-c.on)/.4)*(c.lv>=3?1:.72);if(x>a){a=x;lv=x>.6?c.lv:Math.min(c.lv,2);g=.55+.45*Math.max(0,1-(t-c.on)/1.2)}}
  if(c._a!==a||c._lv!==lv){map.setFeatureState({source:'cells',id:c.id},{a,lv});map.setFeatureState({source:'glow',id:c.id},{a,g});c._a=a;c._lv=lv}}
 document.getElementById('black').style.opacity=D.black?(1-ease((t-D.black[0])/D.black[1])).toFixed(3):0;
 requestAnimationFrame(frame)}
</script></body></html>"""


async def main(mode):
    cfg = dict(MODES[mode])
    cfg['cam0'] = dict(cfg['cam0'], zoom=cfg['cam0']['zoom'] + 0.415)
    cfg['cam1'] = dict(cfg['cam1'], zoom=cfg['cam1']['zoom'] + 0.415)
    routes = json.loads(export_routes().read_text(encoding='utf-8'))['routes']
    data = dict(cfg, routes=routes, black=[0.35, 0.9] if mode == 'cover' else None, speed=0.4)
    html = (PAGE.replace('__CSS__', f'{NM}/maplibre-gl/dist/maplibre-gl.css').replace('__JS__', f'{NM}/maplibre-gl/dist/maplibre-gl.js')
            .replace('__H3__', f'{NM}/h3-js/dist/h3-js.umd.js').replace('__DATA__', json.dumps(data)))
    page_file = OUT / 'scenes' / f'scene_{mode}.html'
    page_file.write_text(html, encoding='utf-8')
    out = OUT / 'rec' / mode
    rec = Recorder(str(out))
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, executable_path=CHROME, args=['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': 2560, 'height': 1440}, device_scale_factor=1)
        page = await ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(page_file.as_uri())
        ok = False
        for _ in range(300):
            if await page.evaluate('window.ready === true'):
                ok = True
                break
            await page.wait_for_timeout(500)
        if not ok:
            raise SystemExit(f'{mode}: map never became ready')
        await page.wait_for_timeout(1500)
        await rec.start(ctx, page)
        await rec.cdp.send('Page.stopScreencast')
        await rec.cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 93, 'maxWidth': 2560, 'maxHeight': 1440, 'everyNthFrame': 1})
        await page.evaluate('window.start()')
        rec.mark('start')
        await page.wait_for_timeout(int(cfg['dur'] / 0.4 * 1000) + 600)
        rec.mark('end')
        await rec.stop()
        await b.close()
    (out / 'scene_meta.json').write_text(json.dumps({'speed': 0.4}), encoding='utf-8')
    print(mode, 'frames', len(rec.frames), 'errors', errs[:3])


asyncio.run(main(sys.argv[1]))
