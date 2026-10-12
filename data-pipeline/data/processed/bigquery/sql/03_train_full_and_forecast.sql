-- 3. 正式模型：用全部資料訓練，預測未來 7 天（168 小時）
CREATE OR REPLACE MODEL `yoxi.demand_town`
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
WHERE TIMESTAMP(hour_ts) >= TIMESTAMP('2026-02-23 00:00:00');

CREATE OR REPLACE TABLE `yoxi.demand_forecast_7d` AS
SELECT series_id, forecast_timestamp, forecast_value,
       prediction_interval_lower_bound, prediction_interval_upper_bound
FROM ML.FORECAST(MODEL `yoxi.demand_town`, STRUCT(168 AS horizon, 0.8 AS confidence_level));
