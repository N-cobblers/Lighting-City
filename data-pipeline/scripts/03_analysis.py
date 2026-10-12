"""計算需求、乘客頻率、等待時間、車資等指標，輸出 data/processed/metrics.json。用法：python scripts/03_analysis.py [根目錄]"""
import sys, json, numpy as np, pandas as pd
S = sys.argv[1] if len(sys.argv) > 1 else '.'
df = pd.read_parquet(f'{S}/data/processed/trips_clean.parquet')
v = df[df.valid].copy()
out = {}
N = len(v); out['n_raw']=len(df); out['n_valid']=N; out['n_riders']=int(v.rider_id.nunique())
out['period']=[str(v.start.min()), str(v.start.max())]
ndays = v.date.nunique(); out['n_days']=int(ndays)
out['county_share'] = (v.pu_county.value_counts(normalize=True)*100).round(2).head(8).to_dict()
v['metro'] = v.pu_county.isin(['台北市','新北市'])
out['metro_share']=round(v.metro.mean()*100,2)
# daily
daily = v.groupby('date').size(); out['daily']={str(k.date()):int(x) for k,x in daily.items()}
out['daily_mean']=round(daily.mean(),1)
out['monthly']= {str(k):int(x) for k,x in v.groupby(v.start.dt.to_period('M')).size().items()}
# hour x dow (metro, excluding holidays), avg trips per day-slot
m = v[v.metro & ~v.is_holiday]
days_per_dow = m.groupby('dow').date.nunique()
hd = m.groupby(['dow','hour']).size().unstack(fill_value=0)
hd = hd.div(days_per_dow, axis=0).round(1)
out['metro_hour_dow'] = hd.values.tolist()
wk = v[v.metro & ~v.is_offday]; off = v[v.metro & v.is_offday]
out['metro_weekday_hourly'] = (wk.groupby('hour').size()/wk.date.nunique()).round(1).tolist()
out['metro_offday_hourly'] = (off.groupby('hour').size()/off.date.nunique()).round(1).tolist()
# lead time (on-demand only)
od = v[~v.is_reserve]
out['lead_overall'] = {k: round(float(od.lead_min.quantile(q)),2) for k,q in [('p25',.25),('p50',.5),('p75',.75),('p90',.9)]}
out['reserve_share'] = round(v.is_reserve.mean()*100,3)
lw = od[od.metro & ~od.is_offday].groupby('hour').lead_min
out['metro_weekday_lead_p50'] = lw.median().round(2).tolist(); out['metro_weekday_lead_p90']=lw.quantile(.9).round(2).tolist()
# trips
out['travel_m_p50']=float(v.travel_m.median()); out['travel_min_p50']=float(v.travel_min.median())
out['dist_buckets'] = (pd.cut(v.travel_m/1000,[0,2,4,6,10,20,1e9],labels=['<2','2-4','4-6','6-10','10-20','20+']).value_counts(normalize=True).sort_index()*100).round(2).astype(float).to_dict()
out['fare_share'] = (v.fare_range.value_counts(normalize=True).head(8)*100).round(2).to_dict()
out['fare_mean_mid'] = round(float(v.fare_mid.mean()),1); out['fare_median_bucket']= v.fare_range.mode()[0]
out['fare_mean_metro']=round(float(v[v.metro].fare_mid.mean()),1)
out['gmv_month_est'] = round(float(v.fare_mid.sum())/3/1e6,2)  # 百萬元/月（區間中點估計）
# riders
r = v.groupby('rider_id').agg(trips=('trip_id','size'), days=('date','nunique'), first=('start','min'), last=('start','max'))
bins=[0,1,3,9,29,10**9]; lab=['1','2-3','4-9','10-29','30+']
r['b']=pd.cut(r.trips,bins,labels=lab)
out['rider_bucket_riders']=(r.b.value_counts(normalize=True).sort_index()*100).round(2).astype(float).to_dict()
out['rider_bucket_trips']=(r.groupby('b',observed=True).trips.sum()/r.trips.sum()*100).round(2).astype(float).to_dict()
out['trips_per_rider_mean']=round(float(r.trips.mean()),2); out['trips_per_rider_median']=float(r.trips.median())
top10 = r.trips.sort_values(ascending=False); k=int(len(top10)*0.1)
out['top10pct_trip_share']=round(float(top10.iloc[:k].sum()/top10.sum()*100),2)
# monthly active riders and trips per MAU
v['ym']=v.start.dt.to_period('M')
mau = v.groupby('ym').rider_id.nunique(); tpm = v.groupby('ym').size()
out['mau']={str(k):int(x) for k,x in mau.items()}; out['trips_per_mau']={str(k):round(float(tpm[k]/mau[k]),2) for k in mau.index}
# ride-day ratio within each rider's own active month(s): share of days with a ride among days in month, for riders active that month
rm = v.groupby(['ym','rider_id']).date.nunique().reset_index(name='ride_days')
dim = {p: p.days_in_month for p in rm.ym.unique()}
rm['ratio']=rm.apply(lambda x: x.ride_days/dim[x.ym], axis=1)
out['ride_day_ratio_median']=round(float(rm.ratio.median()*100),2); out['ride_day_ratio_mean']=round(float(rm.ratio.mean()*100),2)
out['nonride_day_share_mean']=round(100-out['ride_day_ratio_mean'],2)
# retention Feb -> Mar / Apr
feb=set(v[v.ym=='2026-02'].rider_id); mar=set(v[v.ym=='2026-03'].rider_id); apr=set(v[v.ym=='2026-04'].rider_id)
out['ret_feb_mar']=round(len(feb&mar)/len(feb)*100,2); out['ret_feb_apr']=round(len(feb&apr)/len(feb)*100,2)
# gap between trips
vs = v.sort_values(['rider_id','start'])
gap = vs.groupby('rider_id').start.diff().dt.total_seconds()/86400
out['gap_days_p50']=round(float(gap.median()),2); out['gap_days_p75']=round(float(gap.quantile(.75)),2)
# personalization: riders with >=5 trips
heavy = r[r.trips>=5].index
h = v[v.rider_id.isin(heavy)]
places = pd.concat([h[['rider_id','pu_h9']].rename(columns={'pu_h9':'c'}), h[['rider_id','do_h9']].rename(columns={'do_h9':'c'})])
pc = places.groupby(['rider_id','c']).size().reset_index(name='n')
pc['rank']=pc.groupby('rider_id').n.rank(ascending=False, method='first')
tot = pc.groupby('rider_id').n.sum()
top2 = pc[pc['rank']<=2].groupby('rider_id').n.sum()/tot
out['heavy_riders']=int(len(heavy)); out['heavy_riders_share']=round(len(heavy)/len(r)*100,2)
out['heavy_trip_share']=round(float(r.loc[heavy].trips.sum()/r.trips.sum()*100),2)
out['top2_place_share_median']=round(float(top2.median()*100),2)
out['top2_place_share_ge50']=round(float((top2>=0.5).mean()*100),2)
# hour habit: share of trips in rider's most common 3-hour window (circular)
hh = h.groupby(['rider_id','hour']).size().unstack(fill_value=0)
arr = hh.reindex(columns=range(24), fill_value=0).values
win = arr + np.roll(arr,-1,axis=1) + np.roll(arr,-2,axis=1)
share3 = win.max(axis=1)/arr.sum(axis=1)
out['top3h_share_median']=round(float(np.median(share3)*100),2)
# saved labels
lab_r = v[v.pu_cat.isin(['home','work'])].rider_id.nunique()
out['riders_with_home_work_label_pct']=round(lab_r/len(r)*100,2)
out['pu_home_label_share']=round((v.pu_cat=='home').mean()*100,2); out['pu_work_label_share']=round((v.pu_cat=='work').mean()*100,2)
# categories
out['pu_cat']=v.pu_cat.value_counts().to_dict(); out['do_cat']=v.do_cat.value_counts().to_dict()
spots = v[v.pu_cat=='yoxi_spot'].pu_poi.value_counts().head(15)
out['top_yoxi_spots']=spots.to_dict()
# metro towns
mt = v[v.metro].groupby(['pu_county','pu_town']).size().sort_values(ascending=False).head(15)
out['metro_top_towns']=[[a,b,int(x)] for (a,b),x in mt.items()]
json.dump(out, open(f'{S}/data/processed/metrics.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
for k in ['n_valid','n_riders','period','n_days','metro_share','daily_mean','monthly','lead_overall','reserve_share','travel_m_p50','travel_min_p50','fare_mean_mid','fare_mean_metro','gmv_month_est','rider_bucket_riders','rider_bucket_trips','trips_per_rider_mean','trips_per_rider_median','top10pct_trip_share','mau','trips_per_mau','ride_day_ratio_median','ride_day_ratio_mean','nonride_day_share_mean','ret_feb_mar','ret_feb_apr','gap_days_p50','gap_days_p75','heavy_riders','heavy_riders_share','heavy_trip_share','top2_place_share_median','top2_place_share_ge50','top3h_share_median','riders_with_home_work_label_pct','pu_home_label_share','pu_work_label_share','metro_top_towns','top_yoxi_spots','dist_buckets','fare_share']:
    print(k, '=', out[k])
print('weekday hourly', out['metro_weekday_hourly'])
print('offday hourly', out['metro_offday_hourly'])
print('lead p50 by hour', out['metro_weekday_lead_p50'])
