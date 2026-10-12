"""逐時需求預測（近 4 週同時段型態＋近期水位）與 14 天保留驗證，輸出 forecast_results.json、how_profiles.json。用法：python scripts/04_forecast.py [根目錄]"""
import sys, json, warnings, numpy as np, pandas as pd
warnings.filterwarnings('ignore')
S = sys.argv[1] if len(sys.argv) > 1 else '.'
df = pd.read_parquet(f'{S}/data/processed/trips_clean.parquet')
v = df[df.valid & ~df.is_reserve].copy(); v['hts'] = v['start'].dt.floor('h')
idx = pd.date_range('2026-02-01 00:00','2026-04-30 23:00',freq='h')
holdays = set(pd.to_datetime(list(pd.date_range('2026-02-14','2026-02-22'))+list(pd.date_range('2026-02-27','2026-03-01'))+list(pd.date_range('2026-04-03','2026-04-06'))))
targets = {'雙北': v.pu_county.isin(['台北市','新北市']), '台北市信義區': (v.pu_county=='台北市')&(v.pu_town=='信義區'), '台北市松山區': (v.pu_county=='台北市')&(v.pu_town=='松山區'), '台北市大安區': (v.pu_county=='台北市')&(v.pu_town=='大安區'), '台北市中山區': (v.pu_county=='台北市')&(v.pu_town=='中山區')}
how = lambda ix: ix.dayofweek*24 + ix.hour
def series(mask): return v[mask].groupby('hts').size().reindex(idx, fill_value=0).astype(float)
def model(ytr, fidx, weeks=4):
    ok = np.array([d.normalize() not in holdays for d in ytr.index])
    t = ytr[ok]; t = t[t.index >= ytr.index[-1]-pd.Timedelta(weeks=weeks)]
    prof = t.groupby(how(t.index)).mean()
    last7 = ytr[ytr.index > ytr.index[-1]-pd.Timedelta(days=7)]
    ok7 = np.array([d.normalize() not in holdays for d in last7.index])
    lvl = last7[ok7].sum() / max(prof.reindex(how(last7[ok7].index)).sum(), 1e-9)
    lvl = float(np.clip(lvl, 0.8, 1.25))
    base = prof.reindex(how(fidx)).values * lvl
    naive = np.array([ytr.get(d - pd.Timedelta(weeks=1), np.nan) for d in fidx])
    blend = np.where(np.isnan(naive), base, 0.5*base + 0.5*naive)
    return base, blend, lvl, prof
out = {'metrics':{}, 'series':{}}
split = pd.Timestamp('2026-04-17')
for name, mk in targets.items():
    y = series(mk); ytr = y[y.index < split]; yte = y[y.index >= split]
    w = lambda f: round(float(np.abs(yte.values-np.asarray(f)).sum()/yte.values.sum()*100),2)
    naive = y.shift(168)[yte.index].values
    # rolling-origin: 1-day-ahead forecasts each day using data up to that day (operational setting)
    preds_b, preds_x = [], []
    for d in pd.date_range(split, '2026-04-30', freq='D'):
        hist = y[y.index < d]; fidx = pd.date_range(d, periods=24, freq='h')
        b, x, _, _ = model(hist, fidx); preds_b += list(b); preds_x += list(x)
    out['metrics'][name] = {'mean_per_hour': round(float(y.mean()),1), 'wape_seasonal_naive': w(naive), 'wape_level_profile_dayahead': w(preds_b), 'wape_blend_dayahead': w(preds_x)}
    fidx = pd.date_range('2026-05-01', periods=168, freq='h')
    b, x, lvl, prof = model(y, fidx)
    out['series'][name] = {'test_index':[str(t) for t in yte.index], 'test_actual': yte.tolist(), 'test_pred':[round(float(t),1) for t in preds_b], 'forecast_index':[str(t) for t in fidx], 'forecast':[round(float(t),1) for t in b]}
    print(name, out['metrics'][name], 'level', round(lvl,3))
json.dump(out, open(f'{S}/data/processed/forecast_results.json', 'w', encoding='utf-8'), ensure_ascii=False)

# 信義、松山的星期×小時型態（需求平均與等車中位數），給 05_export.py 與 demo 使用
prof = {}
for name in ['台北市信義區', '台北市松山區']:
    sub = v[targets[name] & ~v.is_holiday]
    days = sub.groupby(['dow']).date.nunique()
    dem = sub.groupby(['dow', 'hour']).size().unstack(fill_value=0).div(days, axis=0)
    lead = sub.groupby(['dow', 'hour']).lead_min.median().unstack()
    prof[name] = {'demand': dem.round(2).values.tolist(), 'lead_p50': lead.round(2).values.tolist()}
json.dump(prof, open(f'{S}/data/processed/how_profiles.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('saved how_profiles.json')
