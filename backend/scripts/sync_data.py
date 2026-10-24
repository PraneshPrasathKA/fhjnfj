"""
Sync Script to fetch and cache January 2026 data from Elexon BMRS.
Can be run standalone or invoked automatically by the backend on startup.
"""

import sys
import os
import asyncio
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.elexon import ElexonService, get_db_connection

async def sync_fuelhh(start_dt: datetime, end_dt: datetime, chunk_days: int = 5):
    print(f"--- Starting FUELHH sync from {start_dt.date()} to {end_dt.date()} ---")
    current = start_dt
    total_records = 0
    while current < end_dt:
        chunk_end = min(current + timedelta(days=chunk_days), end_dt)
        print(f"Fetching FUELHH: {current.strftime('%Y-%m-%d')} -> {chunk_end.strftime('%Y-%m-%d')}...")
        try:
            records = await ElexonService.fetch_fuelhh_remote(current, chunk_end)
            ElexonService.save_fuelhh_records(records)
            total_records += len(records)
            print(f"  Saved {len(records)} wind actual records.")
        except Exception as e:
            print(f"  Error fetching FUELHH chunk: {e}")
        current = chunk_end
    print(f"FUELHH sync complete. Total wind actuals: {total_records}")

async def sync_windfor(start_dt: datetime, end_dt: datetime, chunk_days: int = 5):
    print(f"--- Starting WINDFOR sync from {start_dt.date()} to {end_dt.date()} ---")
    current = start_dt
    total_records = 0
    while current < end_dt:
        chunk_end = min(current + timedelta(days=chunk_days), end_dt)
        print(f"Fetching WINDFOR: {current.strftime('%Y-%m-%d')} -> {chunk_end.strftime('%Y-%m-%d')}...")
        try:
            records = await ElexonService.fetch_windfor_remote(current, chunk_end)
            ElexonService.save_windfor_records(records)
            total_records += len(records)
            print(f"  Saved {len(records)} forecast records.")
        except Exception as e:
            print(f"  Error fetching WINDFOR chunk: {e}")
        current = chunk_end
    print(f"WINDFOR sync complete. Total forecasts: {total_records}")

async def main():
    # January 2026 delivery window
    # Include forecasts published from Dec 30 2025 through Jan 31 2026
    wf_start = datetime(2025, 12, 30, 0, 0, 0)
    wf_end = datetime(2026, 2, 1, 0, 0, 0)

    # Actuals for January 2026
    f_start = datetime(2026, 1, 1, 0, 0, 0)
    f_end = datetime(2026, 2, 1, 12, 0, 0)

    await sync_fuelhh(f_start, f_end, chunk_days=7)
    await sync_windfor(wf_start, wf_end, chunk_days=5)

    stats = ElexonService.get_db_stats()
    print("Database sync status:")
    print(stats)

if __name__ == "__main__":
    asyncio.run(main())
