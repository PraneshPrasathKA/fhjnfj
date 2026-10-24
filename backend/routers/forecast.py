"""
Forecast router - handles /api/forecast endpoints
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import datetime
from services.elexon import ElexonService, get_db_connection

router = APIRouter(prefix="/api/forecast", tags=["Forecasts"])

@router.get("")
def get_forecasts(
    date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)"),
    mode: str = Query("day_ahead", description="Forecast mode: 'day_ahead', 'latest', or 'all'"),
    gate_closure_cutoff: Optional[str] = Query(None, description="Custom gate closure cutoff timestamp ISO")
):
    """
    Returns wind generation forecasts for a target day in January 2026.
    Includes day-ahead gate closure forecasts (11:00 AM D-1) and latest intraday forecasts.
    """
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    records = ElexonService.get_forecasts(
        target_date=date,
        mode=mode,
        gate_closure_cutoff=gate_closure_cutoff
    )

    if not records:
        return {
            "targetDate": date,
            "mode": mode,
            "records": [],
            "summary": None,
            "message": f"No forecasts found for {date} in cache. Try running data sync or verify date."
        }

    gens = [r["generation"] for r in records]
    summary = {
        "count": len(records),
        "peakMW": round(max(gens), 1),
        "troughMW": round(min(gens), 1),
        "avgMW": round(sum(gens) / len(gens), 1),
        "totalMWh": round(sum(gens), 1)  # Hourly points, 1h each -> sum is MWh
    }

    return {
        "targetDate": date,
        "mode": mode,
        "summary": summary,
        "records": records
    }

@router.get("/evolution")
def get_forecast_evolution(
    startTime: str = Query(..., description="Target delivery hour (e.g., 2026-01-15T12:00:00Z)")
):
    """
    Returns all forecasts published for a specific target delivery hour over time.
    Shows the staleness and evolution curve from D-3 until final delivery.
    """
    records = ElexonService.get_forecast_evolution(startTime)
    if not records:
        raise HTTPException(status_code=404, detail=f"No forecast revisions found for startTime {startTime}")

    return {
        "startTime": startTime,
        "revisionsCount": len(records),
        "records": records
    }

@router.get("/dates")
def get_available_dates():
    """
    Returns unique delivery dates present in the WINDFOR database.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT substr(startTime, 1, 10) as dt FROM windfor WHERE startTime >= '2026-01-01' AND startTime <= '2026-01-31' ORDER BY dt ASC")
        rows = cursor.fetchall()
        dates = [r["dt"] for r in rows]
        return {"dates": dates, "defaultDate": dates[0] if dates else "2026-01-15"}
