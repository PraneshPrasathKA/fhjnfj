"""
Analytics Service for UK Wind Generation Intelligence
Computes quantitative forecast accuracy metrics, horizon curves,
diurnal patterns, daily trends, and trader hedging buffers.
"""

import math
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
from services.elexon import get_db_connection, ElexonService

class AnalyticsService:

    @classmethod
    def calculate_accuracy(
        cls,
        from_date: str = "2026-01-01",
        to_date: str = "2026-01-31",
        horizon_mode: str = "day_ahead", # 'day_ahead', 'latest', or 'all'
        max_horizon_hours: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculate quantitative error metrics across the specified date range.
        Matches WINDFOR forecasts with FUELHH actuals at hourly resolution.
        """
        start_ts = f"{from_date}T00:00:00Z"
        # Include full last day up to 23:59:59
        end_ts = f"{to_date}T23:59:59Z"

        hourly_actuals = ElexonService.get_hourly_actuals(start_ts, end_ts)
        if not hourly_actuals:
            return {
                "error": "No actuals data available in the selected window.",
                "overall": None
            }

        with get_db_connection() as conn:
            cursor = conn.cursor()
            if horizon_mode == "day_ahead":
                # Day-ahead forecast: published by 11:00 AM on (delivery_date - 1)
                # We can filter each target delivery hour by selecting the latest forecast
                # published at or before 11:00 AM of the previous calendar day.
                cursor.execute("""
                    SELECT w.startTime, w.publishTime, w.generation as forecastGen
                    FROM windfor w
                    WHERE w.startTime >= ? AND w.startTime <= ?
                      AND datetime(w.publishTime) <= datetime(date(w.startTime, '-1 day') || ' 11:00:00')
                    GROUP BY w.startTime
                    HAVING w.publishTime = MAX(w.publishTime)
                    ORDER BY w.startTime ASC
                """, (start_ts, end_ts))
            elif horizon_mode == "latest":
                # Latest available forecast published prior to delivery hour
                cursor.execute("""
                    SELECT w.startTime, w.publishTime, w.generation as forecastGen
                    FROM windfor w
                    WHERE w.startTime >= ? AND w.startTime <= ?
                      AND w.publishTime <= w.startTime
                    GROUP BY w.startTime
                    HAVING w.publishTime = MAX(w.publishTime)
                    ORDER BY w.startTime ASC
                """, (start_ts, end_ts))
            else: # all published forecasts (evaluates all forecast horizons)
                cursor.execute("""
                    SELECT w.startTime, w.publishTime, w.generation as forecastGen
                    FROM windfor w
                    WHERE w.startTime >= ? AND w.startTime <= ?
                      AND w.publishTime <= w.startTime
                    ORDER BY w.startTime ASC, w.publishTime ASC
                """, (start_ts, end_ts))

            rows = cursor.fetchall()

        pairs = []
        for r in rows:
            st = r["startTime"]
            # match with hourly actual
            if st in hourly_actuals:
                actual_val = hourly_actuals[st]
                forecast_val = float(r["forecastGen"])
                pt = r["publishTime"]
                
                dt_st = datetime.fromisoformat(st.replace("Z", "+00:00"))
                dt_pt = datetime.fromisoformat(pt.replace("Z", "+00:00"))
                horizon = max(0.0, round((dt_st - dt_pt).total_seconds() / 3600.0, 1))

                if max_horizon_hours is not None and horizon > max_horizon_hours:
                    continue

                error = forecast_val - actual_val
                abs_error = abs(error)
                sq_error = error ** 2
                ape = (abs_error / actual_val * 100) if actual_val > 100 else None # filter very low actuals (<100MW) to prevent extreme MAPE distortion

                pairs.append({
                    "startTime": st,
                    "publishTime": pt,
                    "horizonHours": horizon,
                    "actual": round(actual_val, 1),
                    "forecast": round(forecast_val, 1),
                    "error": round(error, 1),
                    "absError": round(abs_error, 1),
                    "sqError": round(sq_error, 1),
                    "ape": round(ape, 2) if ape is not None else None,
                    "day": st[:10],
                    "hour": dt_st.hour
                })

        if not pairs:
            return {
                "message": "No matching forecast and actual pairs found.",
                "overall": None
            }

        errors = np.array([p["error"] for p in pairs])
        abs_errors = np.array([p["absError"] for p in pairs])
        actuals_arr = np.array([p["actual"] for p in pairs])
        forecasts_arr = np.array([p["forecast"] for p in pairs])
        valid_apes = [p["ape"] for p in pairs if p["ape"] is not None]

        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        bias = float(np.mean(errors))
        mape = float(np.mean(valid_apes)) if valid_apes else 0.0
        mean_actual = float(np.mean(actuals_arr))
        nrmse = (rmse / mean_actual * 100) if mean_actual > 0 else 0.0

        # Pearson correlation R
        if len(actuals_arr) > 1 and np.std(actuals_arr) > 0 and np.std(forecasts_arr) > 0:
            corr = float(np.corrcoef(actuals_arr, forecasts_arr)[0, 1])
        else:
            corr = 0.0

        # Horizon Breakdown (Error vs Lead Time)
        # Bins: 0-4h, 4-12h, 12-24h, 24-36h, 36-48h, 48h+
        horizon_bins = [
            ("0-4h (Near-Gate)", 0, 4),
            ("4-12h (Intraday)", 4, 12),
            ("12-24h (D-1 Eve)", 12, 24),
            ("24-36h (Day-Ahead Gate)", 24, 36),
            ("36-48h (D-2 Outlook)", 36, 48),
            ("48h+ (Extended)", 48, 200)
        ]
        by_horizon = []
        for label, h_min, h_max in horizon_bins:
            sub = [p for p in pairs if h_min <= p["horizonHours"] < h_max]
            if sub:
                sub_err = np.array([p["error"] for p in sub])
                sub_abs = np.array([p["absError"] for p in sub])
                by_horizon.append({
                    "bin": label,
                    "count": len(sub),
                    "mae": round(float(np.mean(sub_abs)), 1),
                    "rmse": round(float(np.sqrt(np.mean(sub_err ** 2))), 1),
                    "bias": round(float(np.mean(sub_err)), 1)
                })

        # By Hour of Day (0 to 23)
        by_hour = []
        for hr in range(24):
            sub = [p for p in pairs if p["hour"] == hr]
            if sub:
                sub_err = np.array([p["error"] for p in sub])
                sub_abs = np.array([p["absError"] for p in sub])
                by_hour.append({
                    "hour": hr,
                    "hourLabel": f"{hr:02d}:00",
                    "count": len(sub),
                    "mae": round(float(np.mean(sub_abs)), 1),
                    "rmse": round(float(np.sqrt(np.mean(sub_err ** 2))), 1),
                    "bias": round(float(np.mean(sub_err)), 1),
                    "avgActual": round(float(np.mean([p["actual"] for p in sub])), 1),
                    "avgForecast": round(float(np.mean([p["forecast"] for p in sub])), 1)
                })

        # By Day (Jan 1 to Jan 31)
        by_day = []
        days = sorted(list(set(p["day"] for p in pairs)))
        for d in days:
            sub = [p for p in pairs if p["day"] == d]
            if sub:
                sub_err = np.array([p["error"] for p in sub])
                sub_abs = np.array([p["absError"] for p in sub])
                by_day.append({
                    "date": d,
                    "count": len(sub),
                    "mae": round(float(np.mean(sub_abs)), 1),
                    "rmse": round(float(np.sqrt(np.mean(sub_err ** 2))), 1),
                    "bias": round(float(np.mean(sub_err)), 1),
                    "maxError": round(float(np.max(sub_abs)), 1),
                    "totalActualMWh": round(float(np.sum([p["actual"] for p in sub])), 1)
                })

        # Empirical Hedging Buffers for Traders (Quantiles of Shortfall: actual < forecast)
        # When actual is lower than forecast, utility faces imbalance shortfall.
        # Shortfall = max(0, forecast - actual)
        shortfalls = [max(0.0, p["forecast"] - p["actual"]) for p in pairs]
        buffer_80 = float(np.percentile(shortfalls, 80)) if shortfalls else 0.0
        buffer_90 = float(np.percentile(shortfalls, 90)) if shortfalls else 0.0
        buffer_95 = float(np.percentile(shortfalls, 95)) if shortfalls else 0.0

        # Sample scatter points (subsample up to 400 points for smooth charting)
        scatter_points = pairs if len(pairs) <= 400 else pairs[::math.ceil(len(pairs) / 400)]

        return {
            "period": {"from": from_date, "to": to_date},
            "horizonMode": horizon_mode,
            "overall": {
                "pairCount": len(pairs),
                "mae": round(mae, 1),
                "rmse": round(rmse, 1),
                "nrmsePercent": round(nrmse, 2),
                "bias": round(bias, 1),
                "mape": round(mape, 2),
                "correlation": round(corr, 3),
                "meanActualMW": round(mean_actual, 1),
                "maxActualMW": round(float(np.max(actuals_arr)), 1),
                "minActualMW": round(float(np.min(actuals_arr)), 1),
                "hedgingBufferMW": {
                    "p80": round(buffer_80, 1),
                    "p90": round(buffer_90, 1),
                    "p95": round(buffer_95, 1)
                }
            },
            "byHorizon": by_horizon,
            "byHour": by_hour,
            "byDay": by_day,
            "scatter": scatter_points
        }
