"""
UK Wind Generation Intelligence API
FastAPI backend for Day-Ahead Power Trading & Forecast Accuracy Evaluation
"""

import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import forecast, actuals, accuracy
from services.elexon import ElexonService, init_db

app = FastAPI(
    title="UK Wind Generation Intelligence API",
    description="Operational portal backend providing Day-Ahead wind generation forecasts and quantitative forecast accuracy evaluation using Elexon BMRS data for January 2026.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in allowed_origins else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(forecast.router)
app.include_router(actuals.router)
app.include_router(accuracy.router)

@app.on_event("startup")
async def startup_event():
    init_db()
    # Check if data exists in DB, if not start background sync
    stats = ElexonService.get_db_stats()
    if stats["fuelhh"]["count"] == 0 or stats["windfor"]["count"] == 0:
        print("[Startup] Database is unseeded. Running initial January 2026 data sync in background...")
        from scripts.sync_data import main as sync_main
        asyncio.create_task(sync_main())
    else:
        print(f"[Startup] Cache ready. {stats['fuelhh']['count']} actuals, {stats['windfor']['count']} forecasts.")

@app.get("/api/health", tags=["System"])
def health_check():
    """Healthcheck endpoint for monitoring and uptime probes."""
    return {"status": "ok", "service": "wind-intelligence-api", "version": "1.0.0"}

@app.get("/api/status", tags=["System"])
def system_status():
    """Returns database cache statistics and January 2026 data coverage."""
    stats = ElexonService.get_db_stats()
    return {
        "status": "healthy",
        "cache": stats
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
