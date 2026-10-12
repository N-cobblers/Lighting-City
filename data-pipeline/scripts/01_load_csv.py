"""讀入原始 CSV、檢查欄位與缺值，存成 data/raw_df.pkl。用法：python scripts/01_load_csv.py [根目錄]"""
import sys, pandas as pd, numpy as np
S = sys.argv[1] if len(sys.argv) > 1 else '.'
p = f'{S}/data/extracted/yoxi/yoxi_數據資料.csv'
df = pd.read_csv(p, dtype={'PickUpLocationType':'string','DropOffLocationType':'string','PaymentTotalRange':'string'})
print('rows', len(df), 'cols', df.shape[1])
print(df.dtypes.to_string())
print('\n== missing per column')
print(df.isna().sum().to_string())
print('\n== uniques')
for c in ['Id','RiderId','PickUpLocationType','DropOffLocationType','PaymentTotalRange']:
    print(c, df[c].nunique())
print('dup Id', df['Id'].duplicated().sum(), 'dup full rows', df.duplicated().sum())
for c in ['OrderStartDateTime_UTC8','OrderEndDateTime_UTC8','OrderFormCreatedTime_UTC8']:
    df[c] = pd.to_datetime(df[c], errors='coerce')
    print(c, 'min', df[c].min(), 'max', df[c].max(), 'NaT', df[c].isna().sum())
print('\n== numeric describe')
print(df[['PickUpLatitude','PickUpLongitude','DropOffLatitude','DropOffLongitude','TravelTime','TravelDistance']].describe(percentiles=[.001,.01,.05,.5,.95,.99,.999]).T.to_string())
print('\n== PaymentTotalRange')
print(df['PaymentTotalRange'].value_counts(dropna=False).to_string())
print('\n== top PickUpLocationType')
print(df['PickUpLocationType'].value_counts().head(40).to_string())
print('\n== top DropOffLocationType')
print(df['DropOffLocationType'].value_counts().head(40).to_string())
df.to_pickle(f'{S}/data/raw_df.pkl')
print('saved', f'{S}/data/raw_df.pkl')
