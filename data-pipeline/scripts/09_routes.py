"""雙北起訖最快路線：起終點歸到 H3 第 9 級格子中心，用本機 OSRM 算路線，疊加成路段流量，並計算繞路比與壅塞係數。
輸出 data/processed/routes/（只含彙總）：
  segments.json   路段流量（每個時段至少 10 趟才保留，少於 10 趟記為 0）
  summary.json    繞路比、壅塞係數、處理筆數
用法：先啟動本機 OSRM（見 data-pipeline/README.md），再 python scripts/09_routes.py [根目錄] [OSRM 網址]
起終點座標只送到本機 OSRM（127.0.0.1），不可改成外部路線服務。
"""
import sys, os, json, time, urllib.request, numpy as np, pandas as pd, h3
from concurrent.futures import ThreadPoolExecutor
S = sys.argv[1] if len(sys.argv) > 1 else '.'
OSRM = sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:5000'
assert OSRM.startswith(('http://127.0.0.1', 'http://localhost')), '只能用本機 OSRM'
OUT = f'{S}/data/processed/routes'; os.makedirs(OUT, exist_ok=True)
MIN_TRIPS = 10
PERIODS = ['平日尖峰', '平日低谷', '週末與連假']  # 尖峰 7–9、17–19 點；低谷 10–16 點；其餘平日時段只算進總量

cols = ['valid', 'pu_county', 'do_county', 'pu_town', 'pu_h9', 'do_h9', 'hour', 'is_offday', 'travel_m', 'travel_min']
v = pd.read_parquet(f'{S}/data/processed/trips_clean.parquet', columns=cols)
metro = ['台北市', '新北市']
v = v[v.valid & v.pu_county.isin(metro) & v.do_county.isin(metro) & (v.pu_h9 != v.do_h9)].copy()
peak = v.hour.isin([7, 8, 9, 17, 18, 19]); low = v.hour.between(10, 16)
v['period'] = np.select([v.is_offday, peak, low], ['週末與連假', '平日尖峰', '平日低谷'], '平日其他')
chk = v.groupby('period').agg(off=('is_offday', 'mean'), hmin=('hour', 'min'), hmax=('hour', 'max'))
assert chk.loc['週末與連假', 'off'] == 1 and chk.loc[['平日尖峰', '平日低谷'], 'off'].max() == 0, chk
assert set(v[v.period == '平日尖峰'].hour.unique()) <= {7, 8, 9, 17, 18, 19} and v[v.period == '平日低谷'].hour.between(10, 16).all(), chk
print('trips', len(v)); print(v.period.value_counts().to_string())

# 每組起訖格子在各時段的趟數
pc = v.groupby(['pu_h9', 'do_h9', 'period']).size().unstack(fill_value=0)
for p in PERIODS + ['平日其他']:
    if p not in pc: pc[p] = 0
pc['total'] = pc[PERIODS + ['平日其他']].sum(axis=1)
pairs = list(pc.index); W = pc[['total'] + PERIODS].to_numpy()
print('od pairs', len(pairs))

def route(pair):
    (a, b) = pair; la, lo = h3.cell_to_latlng(a); lb, lob = h3.cell_to_latlng(b)
    url = f'{OSRM}/route/v1/driving/{lo:.6f},{la:.6f};{lob:.6f},{lb:.6f}?overview=full&geometries=geojson&annotations=nodes'
    for _ in range(3):
        try:
            r = json.loads(urllib.request.urlopen(url, timeout=30).read())
            if r.get('code') != 'Ok': return None
            x = r['routes'][0]
            return x['distance'], x['duration'], x['legs'][0]['annotation']['nodes'], x['geometry']['coordinates']
        except Exception:
            time.sleep(0.5)
    return None

seg_idx, seg_xy, seg_w = {}, [], []
dist = np.full(len(pairs), np.nan); dur = np.full(len(pairs), np.nan)
t0 = time.time()
with ThreadPoolExecutor(16) as ex:
    for i, res in enumerate(ex.map(route, pairs, chunksize=64)):
        if res is None: continue
        dist[i], dur[i], nodes, xy = res
        w = W[i]
        for k in range(len(nodes) - 1):
            a, b = nodes[k], nodes[k + 1]
            key = (a, b) if a < b else (b, a)  # 不分方向
            j = seg_idx.get(key)
            if j is None:
                j = seg_idx[key] = len(seg_xy); seg_xy.append((*xy[k], *xy[k + 1])); seg_w.append(np.zeros(4, dtype=np.int64))
            seg_w[j] += w
        if i % 20000 == 0: print(i, 'routes', round(time.time() - t0), 's', 'segments', len(seg_xy))
print('routed', int(np.isfinite(dist).sum()), 'failed', int(np.isnan(dist).sum()), 'segments', len(seg_xy), round(time.time() - t0), 's')

# 路段流量：每個時段少於 MIN_TRIPS 記為 0，全部時段都為 0 的路段不輸出
sw = np.array(seg_w); sw[sw < MIN_TRIPS] = 0
keep = sw[:, 0] > 0
xy = np.round(np.array(seg_xy)[keep], 5); sw = sw[keep]
segs = {'fields': ['lon1', 'lat1', 'lon2', 'lat2', 'total'] + PERIODS, 'min_trips': MIN_TRIPS,
        'note': '雙北起訖歸到 H3 第 9 級格子中心後，以本機 OSRM（OpenStreetMap，最快路線）推估；為推估路線，非實際行駛軌跡',
        'rows': [list(map(float, p)) + list(map(int, c)) for p, c in zip(xy, sw)]}
json.dump(segs, open(f'{OUT}/segments.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('segments kept', int(keep.sum()))

# 繞路比（實際行駛距離 ÷ 最快路線距離）與壅塞係數（實際行駛時間 ÷ 不塞車時間），只看最快路線 ≥ 1 公里
rd = pd.DataFrame({'pu_h9': [p[0] for p in pairs], 'do_h9': [p[1] for p in pairs], 'r_m': dist, 'r_s': dur})
rd.to_parquet(f'{S}/data/osrm/pair_routes.parquet', index=False)  # 格子對的路線距離與時間（不進版控），之後調整統計不用重算路線
t = v.merge(rd, on=['pu_h9', 'do_h9'], how='inner'); t = t[t.r_m >= 1000]
t['detour'] = t.travel_m / t.r_m; t['cong'] = t.travel_min * 60 / t.r_s
q = lambda s: {'p25': round(float(s.quantile(.25)), 3), 'p50': round(float(s.median()), 3), 'p75': round(float(s.quantile(.75)), 3), 'n': int(len(s))}
summary = {
    'trips': int(len(v)), 'od_pairs': len(pairs), 'routed_pairs': int(np.isfinite(dist).sum()),
    'trips_routed_share': round(float(pc.total[np.isfinite(dist)].sum() / pc.total.sum() * 100), 2),
    'segments_kept': int(keep.sum()), 'min_trips': MIN_TRIPS, 'periods_def': {'平日尖峰': '非假日 7–9、17–19 點', '平日低谷': '非假日 10–16 點', '週末與連假': '週六日與國定連假全天'},
    'route_km_p50': round(float(np.nanmedian(dist)) / 1000, 2),
    'detour': {'all': q(t.detour), **{p: q(t[t.period == p].detour) for p in PERIODS},
               'share_gt_1_3': round(float((t.detour > 1.3).mean() * 100), 2), 'share_lt_0_9': round(float((t.detour < 0.9).mean() * 100), 2)},
    'detour_by_km': {k: q(g.detour) for k, g in t.groupby(pd.cut(t.r_m / 1000, [1, 3, 5, 10, 20, 200], labels=['1-3', '3-5', '5-10', '10-20', '20+']), observed=True)},
    'congestion': {'all': q(t.cong), **{p: q(t[t.period == p].cong) for p in PERIODS}},
    'congestion_weekday_by_hour': {int(h): round(float(g.cong.median()), 3) for h, g in t[~t.is_offday].groupby('hour')},
    'congestion_offday_by_hour': {int(h): round(float(g.cong.median()), 3) for h, g in t[t.is_offday].groupby('hour')},
    'detour_by_town': {f'{a}{b}': q(g.detour) for (a, b), g in t.groupby(['pu_county', 'pu_town']) if len(g) >= 5000},
}
json.dump(summary, open(f'{OUT}/summary.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps({k: summary[k] for k in ['trips', 'od_pairs', 'routed_pairs', 'trips_routed_share', 'segments_kept', 'route_km_p50', 'detour', 'congestion']}, ensure_ascii=False))
