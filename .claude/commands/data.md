---
description: 用 yoxi 資料重跑資料管線並更新 App 用的彙總指數
---
在 `data-pipeline/` 底下：
1. 確認原始 7z 在 `data/raw/`（或 CSV 已在 `data/extracted/yoxi/`）。安裝 `pip install -r requirements.txt`。
2. 依序執行 `scripts/00_extract_7z.py`（需要時）、`01_load_csv.py`、`02_preprocess.py`、`03_analysis.py`、`04_forecast.py`、`05_export.py`。
3. 把 `data/processed/demo/demand_xinyi_songshan.json` 複製到 `../src/data/demand.json`。
4. 比對 `data/processed/metrics.json` 和 `CLAUDE.md`「資料分析重點」，數字有變就更新 CLAUDE.md。
5. 絕對不要把逐筆資料（raw_df.pkl、*.parquet、原始 CSV）放進 src、public 或 commit。
$ARGUMENTS
