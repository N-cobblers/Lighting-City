"""畫路段流量圖（docs/data-analysis/09–11_*.png）與互動地圖（docs/route-flow.html）。只讀 09_routes.py 的彙總結果。
用法：python scripts/10_route_charts.py [根目錄]
"""
import sys, os, json, numpy as np, pandas as pd, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.collections import LineCollection
from shapely.geometry import shape
S = sys.argv[1] if len(sys.argv) > 1 else '.'
R = f'{S}/data/processed/routes'
OUT = f'{S}/../docs/data-analysis'; os.makedirs(OUT, exist_ok=True)
seg = json.load(open(f'{R}/segments.json', encoding='utf-8')); sm = json.load(open(f'{R}/summary.json', encoding='utf-8'))
PERIODS = ['平日尖峰', '平日低谷', '週末與連假']
A = np.array(seg['rows'], dtype=float); XY, C = A[:, :4], A[:, 4:]

# 各時段的天數 × 小時數，把趟數換成「平均每小時經過趟數」，三個時段才能放在同一個色階比較
days = pd.date_range('2026-02-01', '2026-04-30')
hol = set(pd.to_datetime([x for a, b in [('2026-02-14', '2026-02-22'), ('2026-02-27', '2026-03-01'), ('2026-04-03', '2026-04-06')] for x in pd.date_range(a, b)]))
off = np.array([d in hol or d.dayofweek >= 5 for d in days]); n_wd, n_off = int((~off).sum()), int(off.sum())
HOURS = {'平日尖峰': n_wd * 6, '平日低谷': n_wd * 7, '週末與連假': n_off * 24}
PH = {p: C[:, 1 + i] / HOURS[p] for i, p in enumerate(PERIODS)}

for f in ['Microsoft JhengHei', 'Noto Sans TC', 'Noto Sans CJK TC', 'PingFang TC']:
    if any(f == x.name for x in font_manager.fontManager.ttflist):
        plt.rcParams['font.family'] = f; break
SURF, INK, INK2, MUTED, GRID, AXIS = '#fcfcfb', '#0b0b0b', '#52514e', '#898781', '#e1e0d9', '#c3c2b7'
BLUE, ORANGE = '#2a78d6', '#eb6834'
plt.rcParams.update({'figure.facecolor': SURF, 'axes.facecolor': SURF, 'savefig.facecolor': SURF, 'text.color': INK, 'font.size': 10,
    'axes.titlesize': 12, 'axes.titleweight': 'bold', 'axes.titlelocation': 'left', 'axes.edgecolor': AXIS, 'axes.labelcolor': INK2,
    'xtick.color': MUTED, 'ytick.color': MUTED, 'axes.spines.top': False, 'axes.spines.right': False, 'lines.linewidth': 2})
RAMP = matplotlib.colors.LinearSegmentedColormap.from_list('blue', ['#b7d3f6', '#6da7ec', '#2a78d6', '#1c5cab', '#0d366b'])
NOTE = '資料：yoxi 競賽資料 2026/2/1–4/30；路線為起訖格子中心之間以 OSRM 推估的最快路線（非實際軌跡），每段至少 10 趟才畫｜底圖：內政部鄉鎮市區界、© OpenStreetMap contributors'
EXT = (121.36, 121.70, 24.94, 25.19)
gj = json.load(open(f'{S}/geo/towns.geojson', encoding='utf-8'))
towns = [shape(f['geometry']) for f in gj['features'] if f['properties']['COUNTYNAME'] in ('台北市', '新北市')]
PLACES = {'台北車站': (121.5170, 25.0478), '台北 101': (121.5645, 25.0340), '松山機場': (121.5520, 25.0630), '板橋車站': (121.4635, 25.0143),
          '南港車站': (121.6070, 25.0520), '內湖科技園區': (121.5750, 25.0800), '新莊': (121.4500, 25.0360), '淡水': (121.4450, 25.1690)}

def base(ax):
    for g in towns:
        for p in getattr(g, 'geoms', [g]):
            x, y = p.exterior.xy; ax.fill(x, y, color='#f3f2ee', lw=0); ax.plot(x, y, color='#d9d8d2', lw=0.5)
    ax.set_xlim(EXT[0], EXT[1]); ax.set_ylim(EXT[2], EXT[3]); ax.set_aspect(1 / np.cos(np.radians(25.06)))
    ax.set_xticks([]); ax.set_yticks([]); [s.set_visible(False) for s in ax.spines.values()]

def flow(ax, w, vmax, wmax=3.2):
    m = w > 0; o = np.argsort(w[m]); xy, ww = XY[m][o], w[m][o]
    t = np.sqrt(np.clip(ww / vmax, 0, 1))
    lc = LineCollection(xy.reshape(-1, 2, 2), linewidths=0.25 + wmax * t, colors=RAMP(t), capstyle='round')
    ax.add_collection(lc)

def labels(ax, fs=8):
    for k, (x, y) in PLACES.items():
        ax.plot(x, y, 'o', ms=3, color=INK, zorder=5); ax.text(x + 0.004, y + 0.003, k, fontsize=fs, color=INK, zorder=5,
                                                             bbox=dict(boxstyle='round,pad=0.15', fc=SURF, ec='none', alpha=0.8))

def save(fig, name, note=NOTE):
    fig.text(0.01, -0.01, note, fontsize=7.5, color=MUTED, ha='left', va='top', wrap=True)
    fig.savefig(f'{OUT}/{name}.png', dpi=170, bbox_inches='tight'); plt.close(fig); print('saved', name)

def legend_bar(fig, ax, vmax, label):
    sm_ = matplotlib.cm.ScalarMappable(cmap=RAMP, norm=matplotlib.colors.PowerNorm(0.5, 0, vmax))
    cb = fig.colorbar(sm_, ax=ax, fraction=0.03, pad=0.01, shrink=0.6); cb.outline.set_visible(False); cb.set_label(label, color=INK2)
    cb.ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, _: f'{x:,.0f}'))

# 9) 總流量
tot = C[:, 0]; vmax = np.quantile(tot[tot > 0], 0.999)
fig, ax = plt.subplots(figsize=(10, 7.4), layout='constrained'); base(ax); flow(ax, tot, vmax, 3.6); labels(ax, 9)
legend_bar(fig, ax, vmax, '三個月經過趟數')
ax.set_title(f'雙北 yoxi 熱門路段（{sm["trips"]:,} 趟行程推估路線疊加）')
save(fig, '09_route_flow_metro')

# 10) 三個時段：平均每小時經過趟數，共用色階
vmax = max(np.quantile(PH[p][PH[p] > 0], 0.999) for p in PERIODS)
fig, axs = plt.subplots(1, 3, figsize=(15, 4.9), layout='constrained')
for ax, p in zip(axs, PERIODS):
    base(ax); flow(ax, PH[p], vmax, 2.6); labels(ax, 7); ax.set_title(f'{p}（{sm["periods_def"][p]}）', fontsize=11)
legend_bar(fig, axs, vmax, '平均每小時經過趟數')
fig.suptitle('三個時段的熱門路段（同一色階）', x=0.01, ha='left', fontsize=13, fontweight='bold')
save(fig, '10_route_flow_periods')

# 11) 壅塞係數（實際行駛時間 ÷ 不塞車時間）逐時
cw, co = sm['congestion_weekday_by_hour'], sm['congestion_offday_by_hour']
hrs = np.arange(24); yw = [cw.get(str(h), np.nan) for h in hrs]; yo = [co.get(str(h), np.nan) for h in hrs]
fig, ax = plt.subplots(figsize=(9, 3.6)); ax.grid(True, color=GRID, lw=0.6); ax.set_axisbelow(True)
ax.plot(hrs, yw, color=BLUE, marker='o', ms=3, label='平日'); ax.plot(hrs, yo, color=ORANGE, marker='o', ms=3, label='週末與連假')
i = int(np.nanargmax(yw)); ax.annotate(f'平日 {i} 點 {yw[i]:.2f} 倍', (i, yw[i]), (i - 6, yw[i] - 0.08), fontsize=9, arrowprops=dict(arrowstyle='-', color=MUTED, lw=0.8))
ax.axhline(1, color=MUTED, lw=1, ls=(0, (4, 3))); ax.text(23.4, 1.005, '不塞車', fontsize=8, color=INK2, ha='right', va='bottom')
ax.legend(frameon=False, loc='upper left'); ax.set_xticks(hrs); ax.set_xlabel('上車時刻（點）'); ax.set_ylabel('實際 ÷ 不塞車行駛時間')
ax.set_title('雙北壅塞係數：實際行駛時間是不塞車時的幾倍（中位數）')
save(fig, '11_congestion_by_hour', '資料：yoxi 競賽資料 2026/2/1–4/30；不塞車時間為 OSRM 依速限推估的最快路線時間；只含最快路線 1 公里以上的行程')

# 互動地圖：只放彙總後的路段流量（每時段 ≥ 10 趟），座標四捨五入到 5 位小數
data = {'periods': PERIODS, 'hours': HOURS, 'defs': sm['periods_def'], 'rows': seg['rows']}
html = open(f'{S}/scripts/route_flow_template.html', encoding='utf-8').read().replace('/*DATA*/null', json.dumps(data, ensure_ascii=False, separators=(',', ':')))
open(f'{S}/../docs/route-flow.html', 'w', encoding='utf-8').write(html)
print('saved docs/route-flow.html', round(len(html) / 1e6, 1), 'MB')
