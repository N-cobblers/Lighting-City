"""等車時間預測（LightGBM）與 4 週滾動回測。

預測台北市信義、松山、大安、中山四區與 6 個熱門上車格，每小時「叫車到上車」的中位數、
第 10–90 百分位（八成的人落在這個範圍）與等超過 10 分鐘的機率。
- 特徵：地點、小時、星期、週末連假、降雨與氣溫（Open-Meteo 歷史天氣）、近 4 週同時段的等車與叫車量、上週同時段。
- 驗證：4 週滾動回測（每週只用之前的資料訓練、預測下一週），對照現行作法「近 4 週同星期同時段的等車中位數」。
- 隱私：上車格近 4 週同時段少於 5 趟時，不提供該格的歷史特徵（改看所在行政區）；輸出只有彙總後的預測與指標。

輸出：data/processed/wait_model/wait_forecast.json（App 用，複製到 ../src/data/）、model_card.json（回測、特徵重要性）
用法：python scripts/14_wait_model.py [根目錄]
"""
import json, os, sys, urllib.request, warnings
import numpy as np, pandas as pd, lightgbm as lgb, h3

warnings.filterwarnings('ignore')
S = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = f'{S}/data/processed/wait_model'
os.makedirs(OUT, exist_ok=True)

DISTRICTS = ['信義區', '松山區', '大安區', '中山區']
# 熱門上車格（App 地圖上的地點）：鍵、名稱、H3 第 9 級格子（或座標）、所在行政區
CELLS = {
    'spot-cityhall': ('市府路 yoxi 上車點', (25.037566, 121.563634), '信義區'),
    'spot-101': ('台北 101 上車點（松智路）', (25.033383, 121.565305), '信義區'),
    'mrt-cityhall': ('捷運市政府站', (25.0411, 121.5658), '信義區'),
    'xinyi-a11': ('信義新天地 A11', '894ba0a48cbffff', '信義區'),
    'spot-songyan': ('松菸 yoxi 上車點', (25.044983, 121.561707), '信義區'),
    'spot-airport': ('松山機場上車點', (25.062422, 121.550726), '松山區'),
}
CELL_ID = {k: (c if isinstance(c, str) else h3.latlng_to_cell(c[0], c[1], 9)) for k, (_, c, _) in CELLS.items()}
AREAS = DISTRICTS + list(CELLS)
PARENT = {**{d: d for d in DISTRICTS}, **{k: CELLS[k][2] for k in CELLS}}
HOLIDAYS = set(pd.to_datetime(list(pd.date_range('2026-02-14', '2026-02-22')) + list(pd.date_range('2026-02-27', '2026-03-01')) + list(pd.date_range('2026-04-03', '2026-04-06'))))
END = pd.Timestamp('2026-04-30 23:00')
IDX = pd.date_range('2026-02-01', '2026-05-07 23:00', freq='h')  # 含預測的下一週，讓落後特徵延伸過去
TRAIN_FROM = pd.Timestamp('2026-03-01')
FOLDS = [pd.Timestamp(d) for d in ['2026-04-03', '2026-04-10', '2026-04-17', '2026-04-24']]
MIN_CELL_TRIPS = 5

# 天氣：Open-Meteo 歷史資料（ERA5，台北市中心一點），沒有就下載
WX = f'{S}/data/external/weather_taipei_2026.json'
if not os.path.exists(WX):
    os.makedirs(os.path.dirname(WX), exist_ok=True)
    urllib.request.urlretrieve('https://archive-api.open-meteo.com/v1/archive?latitude=25.04&longitude=121.56&start_date=2026-01-20&end_date=2026-05-07'
                               '&hourly=precipitation,temperature_2m&timezone=Asia%2FTaipei', WX)
w = json.load(open(WX, encoding='utf-8'))['hourly']
wx = pd.DataFrame({'precip': w['precipitation'], 'temp': w['temperature_2m']}, index=pd.to_datetime(w['time'])).reindex(IDX)

# 行程：有效、非預約、台北市四區；以叫車時間對齊小時
df = pd.read_parquet(f'{S}/data/processed/trips_clean.parquet', columns=['created', 'lead_min', 'pu_county', 'pu_town', 'pu_h9', 'valid', 'is_reserve'])
v = df[df.valid & ~df.is_reserve & (df.pu_county == '台北市') & df.pu_town.isin(DISTRICTS)].copy()
v['t'] = v.created.dt.floor('h')
v['wait'] = v.lead_min.clip(0, 60)
v['gt10'] = (v.lead_min > 10).astype(np.int8)
cell_key = {c: k for k, c in CELL_ID.items()}
in_cell = v.pu_h9.isin(cell_key)
trips = pd.concat([v[['t', 'wait', 'gt10']].assign(area=v.pu_town.values),
                   v.loc[in_cell, ['t', 'wait', 'gt10']].assign(area=v.loc[in_cell, 'pu_h9'].map(cell_key).values)], ignore_index=True)
print('trips', len(v), 'rows with cells', len(trips), {k: int((trips.area == k).sum()) for k in CELLS})

# 每個地點×小時的彙總，再做落後特徵（只看過去，不偷看）
g = trips.groupby(['area', 't']).agg(n=('wait', 'size'), med=('wait', 'median'), share=('gt10', 'mean'))
N = g.n.unstack(0).reindex(index=IDX, columns=AREAS)
N.loc[:END] = N.loc[:END].fillna(0)
M = g.med.unstack(0).reindex(index=IDX, columns=AREAS)
P = g.share.unstack(0).reindex(index=IDX, columns=AREAS)
hol = np.asarray(IDX.normalize().isin(HOLIDAYS))
Mh, Ph, Nh = (X.where(np.broadcast_to(~hol[:, None], X.shape)) for X in (M, P, N))
lag = lambda X, k: X.shift(168 * k).values
with warnings.catch_warnings():
    warnings.simplefilter('ignore')
    n4 = np.stack([lag(Nh, k) for k in range(1, 5)])
    cnt4 = np.nansum(n4, axis=0)
    weeks = np.sum(~np.isnan(n4), axis=0)
    base_med4 = np.nanmean(np.stack([lag(Mh, k) for k in range(1, 5)]), axis=0)
    s4 = np.stack([lag(Ph, k) for k in range(1, 5)])
    base_share4 = np.nansum(np.nan_to_num(s4) * np.nan_to_num(n4), axis=0) / np.where(cnt4 > 0, cnt4, np.nan)
    vol4 = cnt4 / np.where(weeks > 0, weeks, np.nan)
sparse = cnt4 < MIN_CELL_TRIPS
for arr in (base_med4, base_share4):
    arr[sparse] = np.nan
lw_med = lag(M, 1)
lw_n = lag(N, 1)
lw_med[lag(N, 1) < np.where(np.isin(AREAS, DISTRICTS), 1, 3)[None, :]] = np.nan  # 上週同時段太少趟就不用


def long(arr, name):
    return pd.DataFrame(arr, index=IDX, columns=AREAS).stack(dropna=False).rename(name)


F = pd.concat([long(base_med4, 'base_med4'), long(base_share4, 'base_share4'), long(vol4, 'vol4'), long(lw_med, 'lastweek_med'), long(lw_n, 'lastweek_n')], axis=1)
F.index.names = ['t', 'area']
F = F.reset_index()
parent = F[F.area.isin(DISTRICTS)].set_index(['t', 'area']).base_med4
F['parent_base4'] = parent.reindex(list(zip(F.t, F.area.map(PARENT)))).values
F['level'] = (~F.area.isin(DISTRICTS)).astype(np.int8)
F['hour'] = F.t.dt.hour
F['dow'] = F.t.dt.dayofweek
F['is_holiday'] = F.t.dt.normalize().isin(HOLIDAYS).astype(np.int8)
F['is_offday'] = ((F.dow >= 5) | (F.is_holiday == 1)).astype(np.int8)
F = F.join(wx, on='t')
F['area'] = pd.Categorical(F.area, categories=AREAS)

FEATS = ['area', 'level', 'hour', 'dow', 'is_offday', 'is_holiday', 'precip', 'temp', 'base_med4', 'base_share4', 'vol4', 'lastweek_med', 'lastweek_n', 'parent_base4']
LABEL = {'area': '地點', 'level': '行政區或上車格', 'hour': '時段', 'dow': '星期', 'is_offday': '週末連假', 'is_holiday': '連假', 'precip': '降雨',
         'temp': '氣溫', 'base_med4': '近 4 週同時段等車', 'base_share4': '近 4 週等超過 10 分鐘的比例', 'vol4': '近 4 週同時段叫車量',
         'lastweek_med': '上週同時段等車', 'lastweek_n': '上週同時段叫車量', 'parent_base4': '所在行政區的等車水準'}
T = trips.assign(area=pd.Categorical(trips.area, categories=AREAS)).merge(F, on=['t', 'area'], how='left')
PARAMS = dict(learning_rate=0.05, n_estimators=350, num_leaves=31, min_child_samples=100, subsample=0.8, subsample_freq=1,
              colsample_bytree=0.8, reg_lambda=1.0, random_state=7, verbose=-1)
QS = (0.1, 0.5, 0.9)


def fit(tr):
    X = tr[FEATS]
    m = {q: lgb.LGBMRegressor(objective='quantile', alpha=q, **PARAMS).fit(X, tr.wait) for q in QS}
    m['gt10'] = lgb.LGBMClassifier(objective='binary', **PARAMS).fit(X, tr.gt10)
    return m


def predict(m, X):
    q = np.sort(np.column_stack([m[a].predict(X[FEATS]) for a in QS]), axis=1)
    return q, m['gt10'].predict_proba(X[FEATS])[:, 1]


# 4 週滾動回測
folds = []
for st in FOLDS:
    tr = T[(T.t >= TRAIN_FROM) & (T.t < st)]
    te = T[(T.t >= st) & (T.t < st + pd.Timedelta(days=7))].copy()
    m = fit(tr)
    q, p = predict(m, te)
    te['p10'], te['p50'], te['p90'], te['pg'] = q[:, 0], q[:, 1], q[:, 2], p
    # 現行作法：近 4 週同星期同時段的中位數；沒有就用訓練期間該地點的中位數
    fb_med = tr.groupby('area', observed=True).wait.median()
    fb_share = tr.groupby('area', observed=True).gt10.mean()
    te['base'] = te.base_med4.fillna(te.area.map(fb_med).astype(float))
    te['base_p'] = te.base_share4.fillna(te.area.map(fb_share).astype(float))
    grp = te.groupby(['area', 't'], observed=True).agg(n=('wait', 'size'), actual=('wait', 'median'), p50=('p50', 'first'), base=('base', 'first')).reset_index()
    grp['district'] = grp.area.isin(DISTRICTS)
    grp = grp[grp.n >= np.where(grp.district, 5, 3)]
    peak = grp.district & (grp.t.dt.dayofweek < 5) & grp.t.dt.hour.between(17, 19)
    mae = lambda d, c: round(float((d[c] - d.actual).abs().mean()), 3)
    r = {'start': str(st.date()), 'district_mae_model': mae(grp[grp.district], 'p50'), 'district_mae_base': mae(grp[grp.district], 'base'),
         'peak_mae_model': mae(grp[peak], 'p50'), 'peak_mae_base': mae(grp[peak], 'base'),
         'cell_mae_model': mae(grp[~grp.district], 'p50'), 'cell_mae_base': mae(grp[~grp.district], 'base'),
         'brier_model': round(float(((te.pg - te.gt10) ** 2).mean()), 4), 'brier_base': round(float(((te.base_p - te.gt10) ** 2).mean()), 4),
         'coverage_80': round(float(((te.wait >= te.p10) & (te.wait <= te.p90)).mean()), 3), 'groups': int(len(grp))}
    folds.append(r)
    print(r)

avg = lambda k: round(float(np.mean([f[k] for f in folds])), 3)
summary = {k: avg(k) for k in folds[0] if k not in ('start', 'groups')}
summary['district_improve_pct'] = round((1 - summary['district_mae_model'] / summary['district_mae_base']) * 100, 1)
summary['peak_improve_pct'] = round((1 - summary['peak_mae_model'] / summary['peak_mae_base']) * 100, 1)
summary['cell_improve_pct'] = round((1 - summary['cell_mae_model'] / summary['cell_mae_base']) * 100, 1)
summary['brier_improve_pct'] = round((1 - summary['brier_model'] / summary['brier_base']) * 100, 1)
print('summary', summary)

# 最終模型：用 3/1–4/30 全部資料
final = fit(T[T.t >= TRAIN_FROM])
gain = pd.Series(final[0.5].booster_.feature_importance('gain'), index=FEATS)
imp = (gain / gain.sum() * 100).sort_values(ascending=False)
importance = [{'feature': LABEL[k], 'pct': round(float(x), 1)} for k, x in imp.items()]
print(imp.round(1).to_string())

# 下一週（5/1–5/7）逐時預測，依平常日處理；兩種天氣情境：不下雨、每小時 3 毫米的雨
fidx = pd.date_range('2026-05-01', '2026-05-07 23:00', freq='h')
Ff = F[F.t.isin(fidx)].copy()
Ff['is_holiday'] = 0
Ff['is_offday'] = (Ff.dow >= 5).astype(np.int8)
clim = wx.loc['2026-04-17':'2026-04-30 23:00'].groupby(wx.loc['2026-04-17':'2026-04-30 23:00'].index.hour).temp.mean()
Ff['temp'] = Ff.hour.map(clim)
out = {'source': 'yoxi 競賽資料 2026/2/1–4/30 彙總＋Open-Meteo 歷史天氣；LightGBM 預測，不含個別行程',
       'trained_on': '2026-03-01–2026-04-30', 'horizon': '2026-05-01–05-07（依平常日處理）',
       'format': 'scenario → area → dow（0 = 週一）→ hour → [P10, P50, P90 分鐘, 等超過 10 分鐘的機率]',
       'areas': {**{d: {'name': d, 'level': 'district'} for d in DISTRICTS},
                 **{k: {'name': CELLS[k][0], 'level': 'cell', 'district': CELLS[k][2], 'h3': CELL_ID[k]} for k in CELLS}}}
for scen, mm in (('dry', 0.0), ('rain', 3.0)):
    X = Ff.assign(precip=mm)
    q, p = predict(final, X)
    X = X.assign(p10=q[:, 0], p50=q[:, 1], p90=q[:, 2], pg=p)
    out[scen] = {}
    for a in AREAS:
        sub = X[X.area == a].sort_values('t')
        grid = [[None] * 24 for _ in range(7)]
        for r in sub.itertuples():
            grid[r.dow][r.hour] = [round(r.p10, 1), round(r.p50, 1), round(r.p90, 1), round(float(r.pg), 2)]
        out[scen][a] = grid
json.dump(out, open(f'{OUT}/wait_forecast.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

card = {'model': 'LightGBM 4（分位數迴歸 P10／P50／P90，加上等超過 10 分鐘的二元分類）', 'trained_on': out['trained_on'],
        'areas': len(AREAS), 'features': [LABEL[f] for f in FEATS], 'importance': importance,
        'baseline': '近 4 週同星期同時段的等車中位數（現行作法）', 'backtest': {'folds': folds, 'summary': summary},
        'notes': '回測：每週只用之前的資料訓練、預測下一週，共 4 週（4/3–4/30）。誤差是逐時中位數的平均絕對誤差（分鐘），行政區每小時至少 5 趟、上車格至少 3 趟才計入。'}
json.dump(card, open(f'{OUT}/model_card.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('saved', OUT)
