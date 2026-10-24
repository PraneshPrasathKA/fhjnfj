# 🌬️ Gridbricks Full Stack SWE Challenge — Implementation Plan

## TL;DR
Build a **UK Wind Generation Intelligence Portal** for an energy utility's day-ahead trading team. The app fetches live data from two Elexon BMRS APIs, shows the latest wind forecasts, and quantifies forecast accuracy — all in a polished React + Python + Docker stack, deployed to Heroku/Vercel.

---

## 1. Domain Understanding

### The Business Problem
The client (energy utility) must **buy electricity one day in advance** from the UK day-ahead wholesale market. Their procurement decision depends on how much wind power will *actually* be generated — since wind reduces how much they need to buy from thermal plants.

Wind generation is **weather-dependent and uncertain** → they need:
1. **The latest forecast** for tomorrow's wind generation (to decide how much to buy)
2. **Historical forecast accuracy** (to know *how much to trust* the forecast — i.e., what error margin to add as a buffer)

### Data Sources (Elexon BMRS APIs — no auth required)
| Dataset | Endpoint | Key Fields |
|---------|----------|------------|
| **FUELHH** (Actuals) | `data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream` | `startTime` (30-min slots), `generation` (MW), `fuelType=WIND` |
| **WINDFOR** (Forecasts) | `data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream` | `startTime`, `publishTime`, `generation` (MW) |

**Confirmed from live API calls:**
- FUELHH: returns `[{dataset, publishTime, startTime, settlementDate, settlementPeriod, fuelType, generation}, ...]` at 30-min resolution
- WINDFOR: returns `[{dataset, publishTime, startTime, generation}, ...]` at 60-min resolution, published every ~30 mins, each publish covers ~2-3 days forward

**Key insight on "latest forecast"**: For a given delivery `startTime`, multiple forecasts exist (published at different `publishTime`s). The *latest* relevant forecast before the day-ahead gate closure (typically ~11 AM D-1) is what matters operationally.

**Scope:** Data for January 2026 only.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│   React (Vite) + Recharts + TailwindCSS (if needed)    │
└────────────────────┬────────────────────────────────────┘
                     │ REST API calls
┌────────────────────▼────────────────────────────────────┐
│                   Python FastAPI                         │
│  /api/forecast   /api/actuals   /api/accuracy           │
│  + caching layer (in-memory or Redis)                   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP fetch
┌────────────────────▼────────────────────────────────────┐
│              Elexon BMRS Public API                     │
│   FUELHH (actuals)   +   WINDFOR (forecasts)            │
└─────────────────────────────────────────────────────────┘

Docker Compose: frontend (Node) + backend (Python) containers
Deploy: Backend → Heroku, Frontend → Vercel (or both on Heroku)
```

---

## 3. Project Structure

```
gridbricks-wind/                  ← repo root (random anon name e.g. "wkftr82")
├── backend/
│   ├── main.py                   ← FastAPI app
│   ├── routers/
│   │   ├── forecast.py           ← /api/forecast endpoints
│   │   ├── actuals.py            ← /api/actuals endpoints
│   │   └── accuracy.py           ← /api/accuracy endpoints
│   ├── services/
│   │   └── elexon.py             ← API client + caching
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     ← Main landing page
│   │   │   ├── ForecastView.jsx  ← Forecast detail
│   │   │   └── AccuracyView.jsx  ← Error metrics
│   │   ├── components/
│   │   │   ├── WindChart.jsx
│   │   │   ├── AccuracyPanel.jsx
│   │   │   └── StatsCard.jsx
│   │   └── api/client.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 4. Backend — FastAPI Endpoints

### 4.1 `/api/forecast` — Latest Forecasts
- **Query params:** `date` (ISO date, defaults to tomorrow)
- **Logic:**
  1. Fetch WINDFOR for the target date range
  2. Group by `startTime`, take the record with the **latest `publishTime`** for each slot
  3. Return: `{startTime, generation, publishTime, forecastHorizon_hours}`
- **Use case:** Shows operators tomorrow's expected wind for each 30-min period

### 4.2 `/api/forecast/history`
- Returns all published forecasts for a given `startTime` slot → shows how forecast evolved as delivery approached

### 4.3 `/api/actuals`
- **Query params:** `from`, `to` dates (defaults to Jan 2026)
- Fetches FUELHH filtered to `fuelType=WIND`
- Returns: `[{startTime, generation}]`

### 4.4 `/api/accuracy` — Forecast Error Metrics
- **Query params:** `from`, `to`, `forecastHorizon_hours` (optional filter)
- **Logic:**
  1. Join WINDFOR forecasts with FUELHH actuals on `startTime`
  2. For each matched (forecast, actual) pair, calculate:
     - **MAE** = mean |forecast - actual|
     - **RMSE** = √mean(forecast - actual)²
     - **MAPE** = mean |(forecast - actual) / actual| × 100
     - **Bias** = mean (forecast - actual) — positive = over-forecast
  3. Aggregate by: overall, by day, by hour-of-day, by forecast horizon (how many hours before delivery was forecast published)
- **Return:** `{overall: {mae, rmse, mape, bias}, byDay: [...], byHour: [...], byHorizon: [...]}`

### 4.5 Caching
- Cache Elexon API responses in-memory (or `functools.lru_cache`) for 30 minutes — Jan 2026 data is historical and won't change, so aggressive caching is fine.
- Use `httpx` (async) for API calls.

---

## 5. Frontend — React Pages

### 5.1 Dashboard (Landing Page)
**Hero panel** for an operator checking in the morning before gate closure:
- Big "Today's Procurement Gap" card: `[tomorrow's peak demand estimate] − [forecast wind]`
- Quick stats: total forecasted wind for tomorrow, latest forecast publish time, confidence band (±1 RMSE from historical accuracy)
- Navigation to Forecast View and Accuracy View

### 5.2 Forecast View
**Purpose:** "What is the latest forecast for tomorrow?"
- **Main chart:** Line chart of forecasted wind generation for tomorrow (48 × 30-min periods)
  - Show confidence band (forecast ± historical RMSE)
  - Toggle to overlay actual generation (if the date is past)
- **Forecast evolution panel:** Small multiples or animated chart showing how the same period's forecast changed across different publish times (staleness view)
- **Table:** Tabular breakdown of forecast by hour

### 5.3 Accuracy View
**Purpose:** "How accurate are these forecasts? What error buffer should I add?"
- **KPI cards at top:** Overall MAE, RMSE, MAPE, Bias for Jan 2026
- **Chart 1:** Scatter/bar chart — Forecast vs Actual for Jan 2026 (one point per 30-min slot)
- **Chart 2:** Error by hour-of-day (bar chart) — when is the forecast least accurate?
- **Chart 3:** Error by forecast horizon (line chart) — does accuracy improve as delivery approaches?
- **Chart 4:** Error over time (daily MAE across Jan 2026) — shows storm/high-variability days
- **Insight callouts:** Auto-generated text like "Forecasts published 24h before delivery have RMSE of X MW; publishing 6h before improves to Y MW"

---

## 6. Key UX Design Decisions

- **Dark mode** by default (energy dashboards look premium in dark mode)
- **Color palette:** Deep navy `#0a0f1e` background, electric teal `#00d4aa` as primary accent, amber `#f59e0b` for alerts/high-error periods
- **Font:** Inter from Google Fonts
- **Chart library:** Recharts (composable, React-native)
- **Responsive:** Works on 1080p screens (target audience = desktop traders)
- **Loading states:** Skeleton loaders while API fetches
- **Error boundaries:** Graceful fallback if Elexon API is down

---

## 7. Docker Setup

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - CORS_ORIGINS=http://localhost:3000

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on: [backend]
```

- Backend: Python 3.11 slim image, `uvicorn main:app`
- Frontend: Node 18 Alpine, `npm run build` + serve with `nginx` or `vite preview`

---

## 8. Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Backend (FastAPI) | **Heroku** | `Procfile: web: uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Frontend (React) | **Vercel** | Point to `/frontend`, set `VITE_API_URL` env var to Heroku backend URL |

Alternative: Both on Heroku using `heroku.yml` for Docker deployment.

---

## 9. Accuracy Metrics — The "Smarts" of the App

This is the core analytical differentiator. The logic:

```
For each 30-min delivery slot t in Jan 2026:
  - Get actual generation: actual[t] from FUELHH
  - Get all forecasts: forecasts[t] = WINDFOR entries where startTime == t
  - For each forecast f in forecasts[t]:
      error[f] = f.generation - actual[t]
      horizon[f] = (t - f.publishTime).hours

Aggregate:
  MAE = mean(|error|)  for all (t, f) pairs
  RMSE = sqrt(mean(error²))
  MAPE = mean(|error| / actual[t]) * 100
  Bias = mean(error)  -- positive means forecasts are systematically too high
```

**Key insight to surface:** Day-ahead forecasts (horizon ~24h) are typically less accurate than intraday. The accuracy view should make this crystal clear for the trader.

---

## 10. Time Budget (16 hours total)

| Phase | Tasks | Hours |
|-------|-------|-------|
| **Phase 1: Setup** | Scaffold Vite+React frontend, FastAPI backend, Docker Compose, verify API calls | 1.5h |
| **Phase 2: Backend** | Elexon API client, all 4 endpoints, caching, CORS | 2.5h |
| **Phase 3: Frontend Foundation** | Design system (CSS vars, dark theme), routing, layout shell, API client | 1.5h |
| **Phase 4: Forecast View** | WindChart, forecast overlay, evolution panel | 2h |
| **Phase 5: Accuracy View** | All 4 charts, KPI cards, insight text | 2.5h |
| **Phase 6: Dashboard** | Hero stats, procurement gap card, polish | 1.5h |
| **Phase 7: Docker + Deploy** | Optimize Dockerfiles, deploy to Heroku + Vercel | 2h |
| **Phase 8: README + Polish** | README, final UX polish, test in incognito | 1h |
| **Buffer** | Debugging, unexpected API quirks | 1h |
| **Total** | | **~16h** |

---

## 11. README Structure

```markdown
# wkftr82 — UK Wind Generation Intelligence Portal

## Live App
- Frontend: https://wkftr82.vercel.app
- Backend API: https://wkftr82-api.herokuapp.com

## About
Built for an energy utility's day-ahead procurement team...

## Tech Stack
- Frontend: React (Vite), Recharts, Vanilla CSS
- Backend: Python FastAPI, httpx
- Infrastructure: Docker, Docker Compose

## Directory Structure
[tree of files]

## Running Locally
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000/docs

## AI Tools Used
This application was built with the assistance of Antigravity (Google DeepMind AI coding assistant).
```

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Elexon API rate limits or downtime | Cache aggressively; add mock data fallback |
| Jan 2026 WINDFOR data coverage gaps | Pre-check date range; handle missing slots gracefully |
| WINDFOR hourly vs FUELHH 30-min resolution mismatch | Interpolate or aggregate FUELHH to 60-min for accuracy matching |
| Heroku free tier cold starts | Add loading spinner; note in README |

---

## 13. Build Order (Recommended)

1. ✅ **Verify APIs** — confirm Jan 2026 data exists for both endpoints  
2. 🔨 **Backend first** — get all endpoints working + `/docs` Swagger UI  
3. 🎨 **Frontend shell** — dark theme, routing, API client wired up  
4. 📊 **Forecast View** — most core feature  
5. 📈 **Accuracy View** — differentiator  
6. 🏠 **Dashboard** — synthesizes the above  
7. 🐳 **Docker + Deploy** — end-to-end working  
8. 📹 **Record video** — last step after everything is polished  
