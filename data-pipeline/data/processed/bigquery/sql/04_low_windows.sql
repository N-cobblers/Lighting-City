-- 4. 推估空車低谷：預測需求低於當區當日尖峰 7 成，且歷史同時段等車時間短於當區中位數
-- 注意：hour_ts 是台灣時間，直接以 TIMESTAMP（UTC）存放，所有日期與小時都照原值計算，不再轉時區。
WITH lead_profile AS (
  SELECT series_id,
         EXTRACT(DAYOFWEEK FROM TIMESTAMP(hour_ts)) AS dow,
         EXTRACT(HOUR FROM TIMESTAMP(hour_ts)) AS hr,
         APPROX_QUANTILES(lead_p50, 2 IGNORE NULLS)[OFFSET(1)] AS lead_p50
  FROM `yoxi.hourly_pickups_town`
  GROUP BY series_id, dow, hr
),
area_median AS (
  SELECT series_id, APPROX_QUANTILES(lead_p50, 2)[OFFSET(1)] AS lead_med
  FROM lead_profile WHERE hr BETWEEN 8 AND 22 GROUP BY series_id
),
fc AS (
  SELECT series_id, forecast_timestamp, forecast_value,
         MAX(forecast_value) OVER (PARTITION BY series_id, DATE(forecast_timestamp)) AS day_peak
  FROM `yoxi.demand_forecast_7d`
)
SELECT fc.series_id, fc.forecast_timestamp, ROUND(fc.forecast_value, 1) AS forecast_pickups,
       ROUND(fc.forecast_value / fc.day_peak * 100) AS demand_idx, lp.lead_p50
FROM fc
JOIN lead_profile lp
  ON lp.series_id = fc.series_id
 AND lp.dow = EXTRACT(DAYOFWEEK FROM fc.forecast_timestamp)
 AND lp.hr = EXTRACT(HOUR FROM fc.forecast_timestamp)
JOIN area_median am ON am.series_id = fc.series_id
WHERE EXTRACT(HOUR FROM fc.forecast_timestamp) BETWEEN 8 AND 22
  AND fc.forecast_value <= 0.7 * fc.day_peak
  AND lp.lead_p50 <= am.lead_med
ORDER BY fc.series_id, fc.forecast_timestamp;
