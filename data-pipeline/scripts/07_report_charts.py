"""畫資料分析報告的圖（docs/data-analysis/*.png）。只讀彙總結果（metrics.json、forecast_results.json、demo 指數），不碰逐筆資料。
用法：python scripts/07_report_charts.py [根目錄]（需要 matplotlib；字型用微軟正黑體或 Noto Sans TC）
"""
import sys, os, json, numpy as np, pandas as pd, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
S = sys.argv[1] if len(sys.argv) > 1 else '.'
P = f'{S}/data/processed'
OUT = f'{S}/../docs/data-analysis'
os.makedirs(OUT, exist_ok=True)
load = lambda p: json.load(open(p, encoding='utf-8'))
m = load(f'{P}/metrics.json'); fr = load(f'{P}/forecast_results.json'); demo = load(f'{P}/demo/demand_xinyi_songshan.json')

# 字型與配色（dataviz 預設色盤：藍、橘；淺色底，GitHub 深色模式下也看得清楚）
for f in ['Microsoft JhengHei', 'Noto Sans TC', 'Noto Sans CJK TC', 'PingFang TC']:
    if any(f == x.name for x in font_manager.fontManager.ttflist):
        plt.rcParams['font.family'] = f; break
SURF, INK, INK2, MUTED, GRID, AXIS = '#fcfcfb', '#0b0b0b', '#52514e', '#898781', '#e1e0d9', '#c3c2b7'
BLUE, ORANGE, SHADE = '#2a78d6', '#eb6834', '#f0efec'
plt.rcParams.update({'figure.facecolor': SURF, 'axes.facecolor': SURF, 'savefig.facecolor': SURF, 'axes.edgecolor': AXIS,
    'axes.labelcolor': INK2, 'xtick.color': MUTED, 'ytick.color': MUTED, 'text.color': INK, 'axes.grid': True, 'grid.color': GRID,
    'grid.linewidth': 0.6, 'axes.axisbelow': True, 'axes.spines.top': False, 'axes.spines.right': False, 'font.size': 10,
    'axes.titlesize': 12, 'axes.titleweight': 'bold', 'axes.titlelocation': 'left', 'lines.linewidth': 2})

def save(fig, name, note='資料：yoxi 競賽資料 2026/2/1–4/30，彙總後繪製'):
    fig.text(0.01, -0.04, note, fontsize=8, color=MUTED, ha='left', va='top')
    fig.savefig(f'{OUT}/{name}.png', dpi=160, bbox_inches='tight'); plt.close(fig); print('saved', name)

HOL = [('2026-02-14', '2026-02-22', '春節'), ('2026-02-27', '2026-03-01', '228'), ('2026-04-03', '2026-04-06', '清明')]
hours = np.arange(24)

# 1) 每日行程數（不含只有 40 筆的 5/1）
d = pd.Series(m['daily']); d.index = pd.to_datetime(d.index); d = d[d.index < '2026-05-01']
fig, ax = plt.subplots(figsize=(9, 3.4))
for a, b, lab in HOL:
    ax.axvspan(pd.Timestamp(a), pd.Timestamp(b) + pd.Timedelta(days=1), color=SHADE, lw=0)
    ax.text(pd.Timestamp(a), 14900, lab, fontsize=8, color=INK2, va='top')
ax.plot(d.index, d.values, color=BLUE)
ax.axhline(d.mean(), color=MUTED, lw=1, ls=(0, (4, 3)))
ax.text(d.index[-1] + pd.Timedelta(days=2), d.mean(), f'平均\n{d.mean():,.0f}', fontsize=8, color=INK2, va='center')
ax.set_xlim(d.index[0] - pd.Timedelta(days=2), d.index[-1] + pd.Timedelta(days=9))
ax.set_ylim(6000, 15000); ax.set_title('全台每日行程數'); ax.set_ylabel('趟／天')
ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, _: f'{x:,.0f}'))
save(fig, '01_daily_trips')

# 2) 雙北平日 vs 休息日逐時需求
fig, ax = plt.subplots(figsize=(9, 3.6))
wk, off = np.array(m['metro_weekday_hourly']), np.array(m['metro_offday_hourly'])
ax.plot(hours, wk, color=BLUE, marker='o', ms=3); ax.plot(hours, off, color=ORANGE, marker='o', ms=3)
ax.text(9.4, wk[9] - 8, f'平日 9 點尖峰 {wk[9]:.0f}', color=INK, fontsize=9, va='center')
ax.text(11.3, off[11] + 15, f'週末與連假 11 點 {off[11]:.0f}', color=INK, fontsize=9)
ax.plot([], [], color=BLUE, label='平日'); ax.plot([], [], color=ORANGE, label='週末與連假')
ax.legend(frameon=False, loc='upper left', handles=ax.lines[-2:])
ax.set_xticks(hours); ax.set_xlabel('上車時刻（點）'); ax.set_ylabel('平均每小時上車數')
ax.set_title('雙北逐時需求：平日 vs 週末與連假')
save(fig, '02_hourly_demand_metro')

# 3) 雙北平日叫車到上車時間（中位數與 P90）
fig, ax = plt.subplots(figsize=(9, 3.6))
p50, p90 = np.array(m['metro_weekday_lead_p50']), np.array(m['metro_weekday_lead_p90'])
ax.plot(hours, p90, color=ORANGE, marker='o', ms=3, label='P90（最慢 10%）')
ax.plot(hours, p50, color=BLUE, marker='o', ms=3, label='中位數')
ax.annotate(f'18 點中位數 {p50[18]:.1f} 分', (18, p50[18]), (19.2, 2.2), fontsize=9, arrowprops=dict(arrowstyle='-', color=MUTED, lw=0.8))
ax.annotate(f'清晨 5–6 點 P90 約 {p90[5]:.0f} 分（空車少）', (6, p90[6]), (7.2, p90[6] - 1), fontsize=9, arrowprops=dict(arrowstyle='-', color=MUTED, lw=0.8))
ax.legend(frameon=False, loc='upper right'); ax.set_xticks(hours); ax.set_ylim(0, 24)
ax.set_xlabel('上車時刻（點）'); ax.set_ylabel('分鐘'); ax.set_title('雙北平日：叫車到上車要等多久（不含預約單）')
save(fig, '03_lead_time_weekday')

# 4) 雙北 星期×小時 熱度圖
hd = np.array(m['metro_hour_dow'])
fig, ax = plt.subplots(figsize=(9, 3.4))
cmap = matplotlib.colors.LinearSegmentedColormap.from_list('blue', ['#f3f8fe', '#cde2fb', '#86b6ef', '#3987e5', '#256abf', '#104281'])
im = ax.imshow(hd, aspect='auto', cmap=cmap); ax.grid(False)
ax.set_yticks(range(7), ['一', '二', '三', '四', '五', '六', '日']); ax.set_xticks(hours)
for s in ax.spines.values(): s.set_visible(False)
ax.set_xticks(np.arange(-.5, 24, 1), minor=True); ax.set_yticks(np.arange(-.5, 7, 1), minor=True)
ax.grid(which='minor', color=SURF, linewidth=1.5); ax.tick_params(which='minor', length=0)
cb = fig.colorbar(im, ax=ax, fraction=0.025, pad=0.01); cb.outline.set_visible(False); cb.set_label('平均每小時上車數', color=INK2)
ax.set_xlabel('上車時刻（點）'); ax.set_title('雙北需求熱度：星期 × 小時（排除國定連假）')
save(fig, '04_heatmap_metro')

# 5) 乘客頻率：乘客占比 vs 行程占比
lab = list(m['rider_bucket_riders']); x = np.arange(len(lab)); w = 0.38
rr, rt = [m['rider_bucket_riders'][k] for k in lab], [m['rider_bucket_trips'][k] for k in lab]
fig, ax = plt.subplots(figsize=(8, 3.6))
b1 = ax.bar(x - w / 2 - 0.01, rr, w, color=BLUE, label='占乘客'); b2 = ax.bar(x + w / 2 + 0.01, rt, w, color=ORANGE, label='占行程')
for bars in (b1, b2):
    for r in bars: ax.text(r.get_x() + r.get_width() / 2, r.get_height() + 0.8, f'{r.get_height():.0f}%', ha='center', fontsize=8, color=INK2)
ax.set_xticks(x, [f'{k} 趟' for k in lab]); ax.set_ylabel('%'); ax.legend(frameon=False); ax.set_ylim(0, 45)
ax.set_xlabel('三個月內搭乘次數'); ax.set_title('少數常客撐起多數行程')
save(fig, '05_rider_frequency')

# 6) 車資與距離分布
fig, axs = plt.subplots(1, 2, figsize=(10, 3.4))
fs = pd.Series(m['fare_share']); fs = fs[sorted(fs.index, key=lambda s: int(s.strip('[]').split(',')[0]))]
axs[0].bar(range(len(fs)), fs.values, color=BLUE, width=0.7)
axs[0].set_xticks(range(len(fs)), [s.strip('[]').replace(',', '–') for s in fs.index], rotation=30, fontsize=8)
axs[0].set_title(f'車資區間（平均約 NT${m["fare_mean_mid"]:.0f}）'); axs[0].set_ylabel('% 行程')
db = pd.Series(m['dist_buckets'])
axs[1].bar(range(len(db)), db.values, color=BLUE, width=0.7)
axs[1].set_xticks(range(len(db)), [f'{k}' for k in db.index]); axs[1].set_xlabel('公里')
axs[1].set_title(f'行駛距離（中位數 {m["travel_m_p50"] / 1000:.1f} 公里）')
for a, s in ((axs[0], fs), (axs[1], db)):
    for i, v in enumerate(s.values): a.text(i, v + 0.6, f'{v:.0f}', ha='center', fontsize=8, color=INK2)
save(fig, '06_fare_distance')

# 7) 信義、松山平日需求指數與等車時間，標出低谷時段
lw = demo['low_windows']; names = ['台北市信義區', '台北市松山區']
fig, axs = plt.subplots(2, 2, figsize=(10, 5), sharex=True, gridspec_kw={'height_ratios': [3, 2]})
for j, n in enumerate(names):
    dem, lead, low = np.array(lw[n]['weekday_demand_idx']), np.array(lw[n]['weekday_lead']), lw[n]['hours']
    for a in axs[:, j]:
        for h in low: a.axvspan(h - .5, h + .5, color=SHADE, lw=0)
    axs[0, j].bar(hours, dem, color=BLUE, width=0.8); axs[0, j].set_ylim(0, 105)
    axs[0, j].set_title(f'{n[3:]}（灰底＝低谷 {", ".join(map(str, low))} 點）', fontsize=11)
    axs[1, j].plot(hours, lead, color=ORANGE, marker='o', ms=3); axs[1, j].set_ylim(3, 8)
    axs[1, j].set_xticks(range(0, 24, 2)); axs[1, j].set_xlabel('上車時刻（點）')
axs[0, 0].set_ylabel('需求指數（尖峰＝100）'); axs[1, 0].set_ylabel('等車中位數（分）')
fig.suptitle('平日低谷：需求不超過尖峰的 70%、等車時間不超過中位數的時段（8–22 點）', x=0.01, ha='left', fontsize=12, fontweight='bold')
fig.tight_layout()
save(fig, '07_low_windows_xinyi_songshan')

# 8) 預測驗證：雙北實際 vs 預測，與各區 WAPE
s = fr['series']['雙北']; ti = pd.to_datetime(s['test_index'])
fig, axs = plt.subplots(1, 2, figsize=(11, 3.6), gridspec_kw={'width_ratios': [2.2, 1]})
axs[0].plot(ti, s['test_actual'], color=BLUE, lw=1.4, label='實際')
axs[0].plot(ti, s['test_pred'], color=ORANGE, lw=1.4, label='隔日預測')
axs[0].legend(frameon=False, loc='upper left', ncol=2); axs[0].set_ylabel('每小時上車數')
axs[0].xaxis.set_major_formatter(matplotlib.dates.DateFormatter('%m/%d')); axs[0].set_title('雙北逐時需求：4/17–4/30 隔日預測')
mt = fr['metrics']; regs = list(mt); y = np.arange(len(regs)); h = 0.38
nv = [mt[r]['wape_seasonal_naive'] for r in regs]; md = [mt[r]['wape_level_profile_dayahead'] for r in regs]
axs[1].barh(y - h / 2 - 0.01, nv, h, color=MUTED, label='上週同時段（基準）')
axs[1].barh(y + h / 2 + 0.01, md, h, color=BLUE, label='本模型')
for i in range(len(regs)):
    axs[1].text(md[i] + 0.3, y[i] + h / 2, f'{md[i]:.1f}', va='center', fontsize=8, color=INK2)
    axs[1].text(nv[i] + 0.3, y[i] - h / 2, f'{nv[i]:.1f}', va='center', fontsize=8, color=MUTED)
axs[1].set_xlim(0, 23)
axs[1].set_yticks(y, [r.replace('台北市', '') for r in regs]); axs[1].invert_yaxis(); axs[1].grid(axis='y', visible=False)
axs[1].legend(frameon=False, fontsize=8, loc='upper left', bbox_to_anchor=(0, -0.1), ncol=2); axs[1].set_title('預測誤差 WAPE（%，越低越好）')
fig.tight_layout()
save(fig, '08_forecast')

# 報告用的衍生數字
print('daily_mean_excl_0501', round(d.mean(), 1))
normal = d[~d.index.isin(pd.to_datetime([x for a, b, _ in HOL for x in pd.date_range(a, b)])) & (d.index.dayofweek < 5)]
cny = d['2026-02-14':'2026-02-22']
print('weekday_nonholiday_mean', round(normal.mean(), 1), 'cny_mean', round(cny.mean(), 1), 'cny_drop_pct', round((1 - cny.mean() / normal.mean()) * 100, 1))
print('weekday_peak', int(wk.argmax()), wk.max(), 'trough 8-22', int(8 + wk[8:23].argmin()), wk[8:23].min(), 'offday_peak', int(off.argmax()), off.max())
for r in regs: print(r, 'wape_improve_pct', round((1 - mt[r]['wape_level_profile_dayahead'] / mt[r]['wape_seasonal_naive']) * 100, 1))
