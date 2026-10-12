-- yoxi 點燈城：BigQuery ML 需求預測（ARIMA_PLUS）
-- 前置：在 BigQuery 主控台建立資料集 yoxi（位置選 asia-east1），
--       把 hourly_pickups_town_metro.csv 上傳成資料表 yoxi.hourly_pickups_town（結構自動偵測）。
-- 注意：hour_ts 是台灣時間，上傳後以 TIMESTAMP 存放（視為 UTC），所有小時、星期都照原值計算，不需轉時區。
-- BigQuery 免費沙盒不需綁卡即可執行（資料表 60 天後過期）。

-- 1. 驗證用模型：用 2/23–4/16 訓練（避開春節連假），保留 4/17–4/30 做驗證
CREATE OR REPLACE MODEL `yoxi.demand_town_holdout`
OPTIONS(
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'hour_ts',
  time_series_data_col = 'pickups',
  time_series_id_col = 'series_id',
  data_frequency = 'HOURLY',
  holiday_region = 'TW',
  auto_arima = TRUE,
  clean_spikes_and_dips = TRUE,
  adjust_step_changes = TRUE
) AS
SELECT TIMESTAMP(hour_ts) AS hour_ts, series_id, pickups
FROM `yoxi.hourly_pickups_town`
WHERE TIMESTAMP(hour_ts) >= TIMESTAMP('2026-02-23 00:00:00')
  AND TIMESTAMP(hour_ts) <  TIMESTAMP('2026-04-17 00:00:00');
