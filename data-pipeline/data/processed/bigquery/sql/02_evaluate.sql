-- 2. 用 4/17–4/30 的實際值評估（可和本地基準 WAPE 比較：信義區 16.4%、松山區 15.5%）
SELECT
  f.series_id,
  ROUND(SUM(ABS(a.pickups - f.forecast_value)) / SUM(a.pickups) * 100, 2) AS wape_pct
FROM ML.FORECAST(MODEL `yoxi.demand_town_holdout`, STRUCT(336 AS horizon, 0.8 AS confidence_level)) AS f
JOIN `yoxi.hourly_pickups_town` AS a
  ON a.series_id = f.series_id AND TIMESTAMP(a.hour_ts) = f.forecast_timestamp
GROUP BY f.series_id
ORDER BY wape_pct;
