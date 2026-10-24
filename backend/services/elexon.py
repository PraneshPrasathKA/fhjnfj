"""
Elexon BMRS API Service
Handles fetching, caching, and querying FUELHH (actuals) and WINDFOR (forecasts).
Backed by SQLite for fast sub-millisecond retrieval and offline resilience.
"""

import os
import sqlite3
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "wind_cache.db")
ELEXON_BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables and indexes."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fuelhh_wind (
                startTime TEXT NOT NULL,
                publishTime TEXT NOT NULL,
                settlementDate TEXT,
                settlementPeriod INTEGER,
                generation REAL NOT NULL,
                PRIMARY KEY (startTime, publishTime)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_fuelhh_start ON fuelhh_wind(startTime)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_fuelhh_date ON fuelhh_wind(settlementDate)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS windfor (
                startTime TEXT NOT NULL,
                publishTime TEXT NOT NULL,
                generation REAL NOT NULL,
                PRIMARY KEY (startTime, publishTime)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_windfor_start ON windfor(startTime)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_windfor_publish ON windfor(publishTime)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_history (
                dataset TEXT NOT NULL,
                fromTime TEXT NOT NULL,
                toTime TEXT NOT NULL,
                syncedAt TEXT NOT NULL,
                recordCount INTEGER,
                PRIMARY KEY (dataset, fromTime, toTime)
            )
        """)
        conn.commit()

init_db()


class ElexonService:
    @staticmethod
    async def fetch_fuelhh_remote(from_dt: datetime, to_dt: datetime) -> List[Dict[str, Any]]:
        """Fetch actuals from FUELHH endpoint for WIND."""
        url = f"{ELEXON_BASE}/FUELHH/stream"
        params = {
            "publishDateTimeFrom": from_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": to_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        headers = {"User-Agent": "Gridbricks-Wind-Intelligence/1.0"}
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            wind_data = [d for d in data if d.get("fuelType") == "WIND"]
            return wind_data

    @staticmethod
    async def fetch_windfor_remote(from_dt: datetime, to_dt: datetime) -> List[Dict[str, Any]]:
        """Fetch forecasts from WINDFOR endpoint."""
        url = f"{ELEXON_BASE}/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": from_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": to_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        headers = {"User-Agent": "Gridbricks-Wind-Intelligence/1.0"}
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data

    @classmethod
    def save_fuelhh_records(cls, records: List[Dict[str, Any]]):
        if not records:
            return
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT OR REPLACE INTO fuelhh_wind (startTime, publishTime, settlementDate, settlementPeriod, generation)
                VALUES (:startTime, :publishTime, :settlementDate, :settlementPeriod, :generation)
            """, records)
            conn.commit()

    @classmethod
    def save_windfor_records(cls, records: List[Dict[str, Any]]):
        if not records:
            return
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT OR REPLACE INTO windfor (startTime, publishTime, generation)
                VALUES (:startTime, :publishTime, :generation)
            """, records)
            conn.commit()

    @classmethod
    def get_actuals(cls, from_time: str, to_time: str) -> List[Dict[str, Any]]:
        """
        Query actuals from DB between from_time and to_time.
        Returns list of half-hourly wind generation records.
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # If multiple publish versions exist for a startTime, take the latest publishTime
            cursor.execute("""
                SELECT startTime, settlementDate, settlementPeriod, generation, publishTime
                FROM fuelhh_wind
                WHERE startTime >= ? AND startTime < ?
                GROUP BY startTime
                HAVING publishTime = MAX(publishTime)
                ORDER BY startTime ASC
            """, (from_time, to_time))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @classmethod
    def get_hourly_actuals(cls, from_time: str, to_time: str) -> Dict[str, float]:
        """
        Returns a dict of { "YYYY-MM-DDTHH:00:00Z": average_actual_generation_MW }.
        Averages the two half-hour slots for the hour.
        """
        actuals = cls.get_actuals(from_time, to_time)
        buckets: Dict[str, List[float]] = {}
        for r in actuals:
            st = r["startTime"]
            # truncate to hour: YYYY-MM-DDTHH:00:00Z
            hour_key = st[:13] + ":00:00Z"
            if hour_key not in buckets:
                buckets[hour_key] = []
            buckets[hour_key].append(float(r["generation"]))
        
        return {hour: (sum(vals) / len(vals)) for hour, vals in buckets.items()}

    @classmethod
    def get_forecasts(
        cls, 
        target_date: str, 
        mode: str = "latest",
        gate_closure_cutoff: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get forecast records for target_date (YYYY-MM-DD).
        mode:
          - 'latest': latest available published forecast before delivery startTime
          - 'day_ahead': forecast published before gate closure cutoff (default 11:00 AM on D-1)
          - 'all': all forecast versions for analysis
        """
        start_of_day = f"{target_date}T00:00:00Z"
        end_of_day = f"{target_date}T23:59:59Z"

        with get_db_connection() as conn:
            cursor = conn.cursor()
            if mode == "day_ahead":
                # Compute default gate closure cutoff if not supplied: target_date - 1 day at 11:00:00Z
                if not gate_closure_cutoff:
                    dt = datetime.strptime(target_date, "%Y-%m-%d")
                    day_ahead_gate = (dt - timedelta(days=1)).strftime("%Y-%m-%d") + "T11:00:00Z"
                    cutoff = day_ahead_gate
                else:
                    cutoff = gate_closure_cutoff

                cursor.execute("""
                    SELECT startTime, publishTime, generation
                    FROM windfor
                    WHERE startTime >= ? AND startTime <= ?
                      AND publishTime <= ?
                    GROUP BY startTime
                    HAVING publishTime = MAX(publishTime)
                    ORDER BY startTime ASC
                """, (start_of_day, end_of_day, cutoff))
            elif mode == "latest":
                # Latest published forecast prior to or at delivery startTime
                cursor.execute("""
                    SELECT startTime, publishTime, generation
                    FROM windfor
                    WHERE startTime >= ? AND startTime <= ?
                      AND publishTime <= startTime
                    GROUP BY startTime
                    HAVING publishTime = MAX(publishTime)
                    ORDER BY startTime ASC
                """, (start_of_day, end_of_day))
            else: # all
                cursor.execute("""
                    SELECT startTime, publishTime, generation
                    FROM windfor
                    WHERE startTime >= ? AND startTime <= ?
                    ORDER BY startTime ASC, publishTime ASC
                """, (start_of_day, end_of_day))

            rows = cursor.fetchall()
            results = []
            for r in rows:
                row_dict = dict(r)
                # Compute forecast horizon in hours: (startTime - publishTime)
                st = datetime.fromisoformat(row_dict["startTime"].replace("Z", "+00:00"))
                pt = datetime.fromisoformat(row_dict["publishTime"].replace("Z", "+00:00"))
                row_dict["horizonHours"] = round((st - pt).total_seconds() / 3600.0, 1)
                results.append(row_dict)
            return results

    @classmethod
    def get_forecast_evolution(cls, start_time: str) -> List[Dict[str, Any]]:
        """
        Get all historical forecasts published for a specific target delivery hour.
        Reveals how predictions evolved as delivery approached.
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT startTime, publishTime, generation
                FROM windfor
                WHERE startTime = ?
                ORDER BY publishTime ASC
            """, (start_time,))
            rows = cursor.fetchall()
            res = []
            for r in rows:
                d = dict(r)
                st = datetime.fromisoformat(d["startTime"].replace("Z", "+00:00"))
                pt = datetime.fromisoformat(d["publishTime"].replace("Z", "+00:00"))
                d["horizonHours"] = round((st - pt).total_seconds() / 3600.0, 1)
                res.append(d)
            return res

    @classmethod
    def get_db_stats(cls) -> Dict[str, Any]:
        """Return counts and date coverage in SQLite cache."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*), MIN(startTime), MAX(startTime) FROM fuelhh_wind")
            f_count, f_min, f_max = cursor.fetchone()

            cursor.execute("SELECT COUNT(*), MIN(publishTime), MAX(publishTime), MIN(startTime), MAX(startTime) FROM windfor")
            w_count, w_pmin, w_pmax, w_smin, w_smax = cursor.fetchone()

            return {
                "fuelhh": {
                    "count": f_count,
                    "minStartTime": f_min,
                    "maxStartTime": f_max
                },
                "windfor": {
                    "count": w_count,
                    "minPublishTime": w_pmin,
                    "maxPublishTime": w_pmax,
                    "minStartTime": w_smin,
                    "maxStartTime": w_smax
                }
            }
