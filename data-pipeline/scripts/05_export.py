"""輸出 BigQuery 用逐時表、demo 用彙總指數（data/processed/demo/）。用法：python scripts/05_export.py [根目錄]"""
import sys, json, numpy as np, pandas as pd, h3
S = sys.argv[1] if len(sys.argv) > 1 else '.'
P = f'{S}/data/processed'
df = pd.read_parquet(f'{P}/trips_clean.parquet')
v = df[df.valid & ~df.is_reserve].copy(); v['hts'] = v['start'].dt.floor('h')
metro = v[v.pu_county.isin(['台北市','新北市'])].copy()
metro['series_id'] = metro.pu_county + metro.pu_town
idx = pd.date_range('2026-02-01 00:00','2026-04-30 23:00',freq='h')
# 1) BigQuery: hourly pickups per town (zero-filled) + median lead
g = metro.groupby(['series_id','hts']).agg(pickups=('trip_id','size'), lead_p50=('lead_min','median')).reset_index()
full = pd.MultiIndex.from_product([sorted(metro.series_id.unique()), idx], names=['series_id','hts']).to_frame(index=False)
bq = full.merge(g, on=['series_id','hts'], how='left'); bq['pickups']=bq.pickups.fillna(0).astype(int)
bq = bq.rename(columns={'hts':'hour_ts'}); bq['hour_ts']=bq.hour_ts.dt.strftime('%Y-%m-%d %H:%M:%S')
bq.to_csv(f'{P}/bigquery/hourly_pickups_town_metro.csv', index=False)
print('bq town rows', len(bq), 'series', bq.series_id.nunique())
# 2) BigQuery: H3 res8 hourly for 信義/松山
xs = v[(v.pu_county=='台北市') & v.pu_town.isin(['信義區','松山區'])]
g8 = xs.groupby(['pu_h8','hts']).size().rename('pickups').reset_index()
keep = g8.groupby('pu_h8').pickups.sum(); keep = keep[keep>=500].index
full8 = pd.MultiIndex.from_product([sorted(keep), idx], names=['pu_h8','hts']).to_frame(index=False)
b8 = full8.merge(g8, on=['pu_h8','hts'], how='left').fillna({'pickups':0}); b8['pickups']=b8.pickups.astype(int)
b8 = b8.rename(columns={'pu_h8':'h3_r8','hts':'hour_ts'}); b8['hour_ts']=b8.hour_ts.dt.strftime('%Y-%m-%d %H:%M:%S')
b8.to_csv(f'{P}/bigquery/hourly_pickups_h3r8_xinyi_songshan.csv', index=False)
print('bq h3r8 rows', len(b8), 'cells', len(keep))
# 3) demo: res9 cells in Xinyi/Songshan with demand index (pickups + dropoffs), normalized 0-100, no raw counts
cells = pd.concat([xs.pu_h9, v[(v.do_county=='台北市') & v.do_town.isin(['信義區','松山區'])].do_h9]).value_counts()
cells = cells[cells>=30]
cidx = (np.log1p(cells)/np.log1p(cells.max())*100).round(0).astype(int)
demo_cells = [{'h3': c, 'idx': int(i)} for c, i in cidx.items()]
# hour-of-week demand index & lead per district (weekday/offday), normalized
hp = json.load(open(f'{P}/how_profiles.json', encoding='utf-8'))
prof = {}
for name, d in hp.items():
    dem = np.array(d['demand']); lead = np.array(d['lead_p50'], dtype=float)
    peak = dem.max()
    prof[name] = {'demand_idx': (dem/peak*100).round(0).astype(int).tolist(), 'lead_p50': np.nan_to_num(lead, nan=float(np.nanmedian(lead))).round(1).tolist()}
# low windows (weekday Mon-Fri): demand <= 70% of weekday peak and lead <= weekday median lead, 08-22h
lows = {}
for name, d in prof.items():
    dem = np.array(d['demand_idx'][:5]).mean(axis=0); lead = np.array(d['lead_p50'][:5]).mean(axis=0)
    wk_peak = dem.max(); med_lead = np.median(lead[8:23])
    win = [h for h in range(8,23) if dem[h] <= 0.7*wk_peak and lead[h] <= med_lead]
    lows[name] = {'hours': win, 'weekday_demand_idx': dem.round(0).tolist(), 'weekday_lead': lead.round(2).tolist()}
    print(name, 'low windows', win)
fr = json.load(open(f'{P}/forecast_results.json', encoding='utf-8'))
spots = v[v.pu_cat=='yoxi_spot'].groupby('pu_poi').agg(n=('trip_id','size'), lat=('pu_lat','median'), lng=('pu_lng','median'))
spots = spots[spots.n>=100].sort_values('n', ascending=False)
spots['name'] = spots.index.str.replace(r'\s+',' ',regex=True).str.strip()
spots[['name','n','lat','lng']].to_csv(f'{P}/yoxi_pickup_spots.csv', index=False)
xs_spots = spots[(spots.lat.between(25.025,25.065)) & (spots.lng.between(121.545,121.585))]
demo = {'source':'yoxi 競賽資料 2026/02/01–04/30（已彙總為指數，不含個別行程）', 'cells': demo_cells, 'profiles': prof, 'low_windows': lows,
        'forecast': {k: {'index': fr['series'][k]['forecast_index'], 'value_idx': (np.array(fr['series'][k]['forecast'])/max(fr['series'][k]['forecast'])*100).round(0).astype(int).tolist()} for k in ['台北市信義區','台北市松山區']},
        'forecast_metrics': fr['metrics'], 'spots': [{'name': r['name'], 'lat': round(r.lat,6), 'lng': round(r.lng,6)} for _, r in xs_spots.iterrows()]}
json.dump(demo, open(f'{P}/demo/demand_xinyi_songshan.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('demo cells', len(demo_cells), 'spots in area', len(xs_spots)); print(xs_spots[['n']].head(12).to_string())
