"""
Accuracy Router - handles quantitative forecast accuracy analytics & trader hedging buffer
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from services.analytics import AnalyticsService

router = APIRouter(prefix="/api/accuracy", tags=["Accuracy Analytics"])

@router.get("")
def get_accuracy_metrics(
    from_date: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    to_date: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    horizon_mode: str = Query("day_ahead", description="Forecast mode: 'day_ahead', 'latest', or 'all'"),
    max_horizon_hours: Optional[float] = Query(None, description="Filter max forecast horizon in hours")
):
    """
    Computes quantitative error metrics (MAE, RMSE, MAPE, Bias, nRMSE, correlation)
    across January 2026. Includes breakdowns by forecast lead time (horizon),
    by hour of the day, and daily trends.
    """
    results = AnalyticsService.calculate_accuracy(
        from_date=from_date,
        to_date=to_date,
        horizon_mode=horizon_mode,
        max_horizon_hours=max_horizon_hours
    )
    return results

@router.get("/hedging-recommendation")
def get_hedging_recommendation(
    confidence: float = Query(90.0, ge=50.0, le=99.9, description="Desired confidence level (e.g., 90%)"),
    from_date: str = Query("2026-01-01"),
    to_date: str = Query("2026-01-31"),
    horizon_mode: str = Query("day_ahead")
):
    """
    Interactive Trader Risk Tool:
    Calculates the exact MW buffer a trader needs to procure from thermal/balancing markets
    to cover wind forecast shortfall at the given confidence percentile.
    """
    data = AnalyticsService.calculate_accuracy(
        from_date=from_date,
        to_date=to_date,
        horizon_mode=horizon_mode
    )
    if not data or not data.get("scatter"):
        raise HTTPException(status_code=404, detail="Insufficient data to compute recommendation.")

    pairs = data["scatter"]
    shortfalls = [max(0.0, p["forecast"] - p["actual"]) for p in pairs]
    import numpy as np
    recommended_mw = float(np.percentile(shortfalls, confidence))

    return {
        "confidencePercent": confidence,
        "recommendedBufferMW": round(recommended_mw, 1),
        "horizonMode": horizon_mode,
        "sampleSize": len(shortfalls),
        "explanation": f"At {confidence}% confidence, actual wind generation fell short of day-ahead forecast by at most {round(recommended_mw, 1)} MW. Procuring a {round(recommended_mw, 1)} MW buffer eliminates imbalance penalty risks in {confidence}% of delivery intervals."
    }
