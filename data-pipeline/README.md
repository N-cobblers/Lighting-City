# 資料管線：yoxi 競賽資料前處理、分析與預測

來源：`yoxi_數據資料.csv`（964,991 筆行程，2026/2/1–4/30）與 `欄位說明.docx`。原始資料**不在**這個資料夾裡，請自行放入。

## 資料夾

```
data-pipeline/
  scripts/00–06_*.py        依序執行
  geo/towns.geojson         內政部鄉鎮市區界（判定行政區用）
  data/raw/                 放原始 7z（不進版控）
  data/extracted/yoxi/      解壓後的 CSV（不進版控）
  data/processed/
    metrics.json            分析指標（簡報引用）
    forecast_results.json   預測驗證結果與下一週預測
    how_profiles.json       信義、松山的星期×小時需求與等車型態
    yoxi_pickup_spots.csv   全台 yoxi 指定上車點與座標中位數
    demo/demand_xinyi_songshan.json   App 用的彙總指數（複製到 src/data/demand.json）
    bigquery/               BigQuery 用逐時表與 SQL
```

## 執行

需要 Python 3.11 以上。在 `data-pipeline/` 底下：

```bash
pip install -r requirements.txt
python scripts/00_extract_7z.py        # 解壓 data/raw/*.7z → data/extracted/yoxi/
python scripts/01_load_csv.py          # 檢查欄位 → data/raw_df.pkl
python scripts/02_preprocess.py        # 清理與新增欄位 → data/processed/trips_clean.parquet
python scripts/03_analysis.py          # 指標 → metrics.json
python scripts/04_forecast.py          # 預測與驗證 → forecast_results.json、how_profiles.json
python scripts/05_export.py            # BigQuery 表、demo 指數、上車點
python scripts/06_compact.py           # （選用）精簡版逐筆資料 yoxi_trips_clean.parquet
cp data/processed/demo/demand_xinyi_songshan.json ../src/data/demand.json
```

整套約 1 分鐘。

## 清理規則（只標記、不刪除）

| 標記 | 條件 | 筆數 |
|---|---|---|
| `flag_short` | 行駛距離 < 100 公尺 | 1,122 |
| `flag_long` | 行駛距離 > 200 公里或行駛時間 > 240 分鐘 | 241 |
| `flag_speed` | 平均時速 > 130 公里 | 128 |
| `valid` | 以上皆否（座標全部在台灣範圍內、沒有負等待時間） | 963,525 |
| `is_reserve` | 叫車到上車 > 60 分鐘，視為預約單 | 1,031 |

分析用 `valid == True`；跟等車時間有關的分析再排除 `is_reserve`。

## 新增欄位

- `lead_min`：叫車到上車的分鐘數（等越久代表附近空車越少，作為空車的替代指標）
- `hour`、`dow`（0 = 週一）、`date`
- `is_holiday`：2026 國定連假（春節 2/14–2/22、228 連假 2/27–3/1、兒童節與清明 4/3–4/6）；`is_offday`：週末或連假
- `fare_mid`：車資區間中點（`[100,200]` 代表 101–200 元，記為 150.5 元）
- `pu_h9`、`do_h9`：H3 第 9 級六角格；`pu_county`、`pu_town` 等：行政區
- `pu_cat`、`do_cat`：POI 分類（home、work、yoxi_spot、airport、transit、hospital、shopping、hotel、school、leisure、other、none）

## 預測方法

逐時需求（每小時上車數）的隔日預測：取近 4 週非假日的同星期同小時平均，再用最近 7 天實際量與型態的比值調整水位（限制在 0.8–1.25）。用 2/23–4/16 建模、逐日預測 4/17–4/30，WAPE 比「上週同時段」基準低 12–21%。正式版在 BigQuery ML 用 ARIMA_PLUS（`bigquery/sql/`）。

## BigQuery（免費沙盒，不用綁卡）

1. BigQuery 主控台建立資料集 `yoxi`（位置 `asia-east1`）。
2. 上傳 `bigquery/hourly_pickups_town_metro.csv`，資料表名稱 `hourly_pickups_town`，結構自動偵測。
3. 依序執行 `bigquery/sql/01`–`04`。`02` 算出各區 WAPE，可和本地結果比較。

## 隱私

- `RiderId` 搭配精確座標與「住家」標記仍可能推回個人。逐筆資料只在團隊內部使用，不可放進 App、不可 commit。
- App 只放 0–100 的彙總指數。使用前請確認競賽的資料使用規範。
