"""清理、加上等待時間、時段、連假、車資中點、H3、行政區、POI 分類，輸出 data/processed/trips_clean.parquet。用法：python scripts/02_preprocess.py [根目錄]"""
import sys, re, json, numpy as np, pandas as pd, h3, shapely
from shapely.geometry import shape, Point
from shapely.strtree import STRtree
S = sys.argv[1] if len(sys.argv) > 1 else '.'
df = pd.read_pickle(f'{S}/data/raw_df.pkl')
df = df.rename(columns={'OrderStartDateTime_UTC8':'start','OrderEndDateTime_UTC8':'end','OrderFormCreatedTime_UTC8':'created',
    'PickUpLatitude':'pu_lat','PickUpLongitude':'pu_lng','DropOffLatitude':'do_lat','DropOffLongitude':'do_lng',
    'TravelTime':'travel_min','TravelDistance':'travel_m','PickUpLocationType':'pu_poi','DropOffLocationType':'do_poi','PaymentTotalRange':'fare_range',
    'Id':'trip_id','RiderId':'rider_id'})
# fare
lo_hi = df['fare_range'].str.extract(r'\[(\d+),(\d+)\]').astype(float)
df['fare_lo'] = np.where(lo_hi[0]==0, 0, lo_hi[0]+1); df['fare_hi'] = lo_hi[1]
df['fare_mid'] = (df['fare_lo'] + df['fare_hi'])/2
# times
df['lead_min'] = (df['start'] - df['created']).dt.total_seconds()/60
df['dur_min_calc'] = (df['end'] - df['start']).dt.total_seconds()/60
df['hour'] = df['start'].dt.hour; df['dow'] = df['start'].dt.dayofweek; df['date'] = df['start'].dt.normalize()
df['req_hour'] = df['created'].dt.hour
# 2026 TW holidays (行政院人事行政總處 2026 辦公日曆): 春節 2/14-2/22, 228 2/27-3/1, 兒童節清明 4/3-4/6
hol = pd.to_datetime(list(pd.date_range('2026-02-14','2026-02-22')) + list(pd.date_range('2026-02-27','2026-03-01')) + list(pd.date_range('2026-04-03','2026-04-06')))
df['is_holiday'] = df['date'].isin(hol)
df['is_offday'] = df['is_holiday'] | (df['dow']>=5)
# speed / flags
df['speed_kmh'] = np.where(df['travel_min']>0, df['travel_m']/1000/(df['travel_min']/60), np.nan)
inside = df['pu_lat'].between(21.8,25.4) & df['pu_lng'].between(119.9,122.1) & df['do_lat'].between(21.8,25.4) & df['do_lng'].between(119.9,122.1)
df['flag_coord'] = ~inside
df['flag_short'] = df['travel_m'] < 100
df['flag_long'] = (df['travel_m'] > 200_000) | (df['travel_min'] > 240)
df['flag_speed'] = df['speed_kmh'] > 130
df['flag_lead_neg'] = df['lead_min'] < -1
df['is_reserve'] = df['lead_min'] > 60  # 預約單（叫車到上車超過 60 分鐘）
df['valid'] = ~(df['flag_coord'] | df['flag_short'] | df['flag_long'] | df['flag_speed'] | df['flag_lead_neg'])
# H3
for p in ['pu','do']:
    lat, lng = df[f'{p}_lat'].to_numpy(), df[f'{p}_lng'].to_numpy()
    df[f'{p}_h9'] = [h3.latlng_to_cell(a,b,9) for a,b in zip(lat,lng)]
    df[f'{p}_h8'] = [h3.cell_to_parent(c,8) for c in df[f'{p}_h9']]
# towns via unique res9 centroid
gj = json.load(open(f'{S}/geo/towns.geojson', encoding='utf-8'))
geoms = [shape(f['geometry']) for f in gj['features']]
names = [(f['properties']['COUNTYNAME'], f['properties']['TOWNNAME']) for f in gj['features']]
tree = STRtree(geoms)
cells = pd.unique(pd.concat([df['pu_h9'], df['do_h9']]))
lookup = {}
for c in cells:
    la, ln = h3.cell_to_latlng(c)
    pt = Point(ln, la)
    idx = tree.query(pt, predicate='within')
    if len(idx)==0:
        idx = [tree.nearest(pt)]
    lookup[c] = names[idx[0]]
for p in ['pu','do']:
    ct = df[f'{p}_h9'].map(lookup)
    df[f'{p}_county'] = ct.map(lambda x: x[0]); df[f'{p}_town'] = ct.map(lambda x: x[1])
# POI category
def cat(s):
    if s is None or s is pd.NA or (isinstance(s,float) and np.isnan(s)): return 'none'
    t = str(s).strip(); tl = t.lower()
    if re.fullmatch(r'(住家\d*|家|新家|老家|我家|台北家|home\d*|h|house|住處|租屋處|宿舍)', tl): return 'home'
    if re.fullmatch(r'(公司\d*|上班|辦公室|work\d*|office|w|工作)', tl): return 'work'
    if 'yoxi' in tl and '上車' in t: return 'yoxi_spot'
    if re.search(r'機場|航廈|airport', tl): return 'airport'
    if re.search(r'高鐵|火車站|車站|捷運|轉運站|客運|站前|mrt|station', tl): return 'transit'
    if re.search(r'醫院|醫療|診所|醫學中心|榮總|長庚|hospital', tl): return 'hospital'
    if re.search(r'百貨|sogo|新光三越|購物|商場|夢時代|巨蛋|遠百|微風|101|outlet|mall|家樂福|好市多|ikea', tl): return 'shopping'
    if re.search(r'飯店|酒店|hotel|旅館|行旅|會館|晶華|喜來登|萬豪', tl): return 'hotel'
    if re.search(r'大學|學院|國小|國中|高中|學校|補習', tl): return 'school'
    if re.search(r'ktv|錢櫃|好樂迪|餐廳|夜市|酒吧|bar|電影|影城|小巨蛋|展覽|體育館|公園', tl): return 'leisure'
    return 'other'
for p in ['pu','do']:
    u = df[f'{p}_poi'].dropna().unique()
    m = {x: cat(x) for x in u}
    df[f'{p}_cat'] = df[f'{p}_poi'].map(m).fillna('none')
df.to_parquet(f'{S}/data/processed/trips_clean.parquet', index=False)
print('saved', len(df), 'valid', int(df['valid'].sum()))
print(df[['flag_coord','flag_short','flag_long','flag_speed','flag_lead_neg','is_reserve']].sum().to_string())
print(df['lead_min'].describe(percentiles=[.01,.05,.25,.5,.75,.9,.95,.99]).to_string())
print('\npu county share'); print((df.loc[df.valid,'pu_county'].value_counts(normalize=True).head(12)*100).round(2).to_string())
print('\npu_cat'); print(df['pu_cat'].value_counts().to_string()); print('\ndo_cat'); print(df['do_cat'].value_counts().to_string())
