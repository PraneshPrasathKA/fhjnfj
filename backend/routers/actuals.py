"""
Actuals router - handles /api/actuals endpoints (FUELHH dataset for fuelType=WIND)
"""

from fastapi import APIRouter, Query
from typing import Optional
from services.elexon import ElexonService

router = APIRouter(prefix="/api/actuals", tags=["Actuals"])

@router.get("")
def get_actuals(
    from_time: str = Query("2026-01-15T00:00:00Z", description="Start timestamp ISO"),
    to_time: str = Query("2026-01-15T23:59:59Z", description="End timestamp ISO"),
    resolution: str = Query("hourly", description="Resolution: 'hourly' or 'half_hourly'")
):
    """
    Returns actual wind generation from FUELHH for the requested window.
    Supports 30-min resolution or hourly averaged values (to align with WINDFOR).
    """
    if resolution == "hourly":
        hourly_dict = ElexonService.get_hourly_actuals(from_time, to_time)
        sorted_keys = sorted(hourly_dict.keys())
        records = [{"startTime": k, "generation": round(hourly_dict[k], 1)} for k in sorted_keys]
    else:
        raw_records = ElexonService.get_actuals(from_time, to_time)
        records = [
            {
                "startTime": r["startTime"],
                "settlementPeriod": r["settlementPeriod"],
                "generation": round(r["generation"], 1),
                "publishTime": r["publishTime"]
            }
            for r in raw_records
        ]

    if not records:
        return {
            "from": from_time,
            "to": to_time,
            "resolution": resolution,
            "records": [],
            "summary": None
        }

    gens = [r["generation"] for r in records]
    summary = {
        "count": len(records),
        "peakMW": round(max(gens), 1),
        "troughMW": round(min(gens), 1),
        "avgMW": round(sum(gens) / len(gens), 1),
        # If hourly, 1h each -> sum is MWh; if 30-min, 0.5h each -> sum * 0.5 is MWh
        "totalMWh": round(sum(gens) * (1.0 if resolution == "hourly" else 0.5), 1)
    }

    return {
        "from": from_time,
        "to": to_time,
        "resolution": resolution,
        "summary": summary,
        "records": records
    }
