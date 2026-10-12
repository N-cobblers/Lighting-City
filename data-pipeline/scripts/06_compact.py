"""輸出精簡版清理後行程（zstd parquet），只在團隊內部使用。用法：python scripts/06_compact.py [根目錄]"""
import sys, pandas as pd
S = sys.argv[1] if len(sys.argv) > 1 else '.'
P = f'{S}/data/processed'
df = pd.read_parquet(f'{P}/trips_clean.parquet')
keep = ['trip_id','rider_id','created','start','end','pu_lat','pu_lng','do_lat','do_lng','travel_min','travel_m','pu_poi','do_poi','fare_range','fare_mid','lead_min','hour','dow','date','is_holiday','is_offday','is_reserve','valid','flag_short','flag_long','flag_speed','pu_h9','do_h9','pu_county','pu_town','do_county','do_town','pu_cat','do_cat']
df = df[keep]
for c in ['pu_county','pu_town','do_county','do_town','pu_cat','do_cat','fare_range']: df[c] = df[c].astype('category')
df.to_parquet(f'{P}/yoxi_trips_clean.parquet', index=False, compression='zstd', compression_level=9)
import os; print(os.path.getsize(f'{P}/yoxi_trips_clean.parquet')/1e6, 'MB', len(df), 'rows', len(keep), 'cols')
