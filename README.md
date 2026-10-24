# 🌬️ AuraWind Intelligence — UK Wind Generation Intelligence Portal

> **Full Stack Software Engineering Assessment**  
> Anonymous Submission Repository (e.g., `wkftr82` / `aurawind`)  
> **Live Web App:** [https://aurawind-demo.vercel.app](https://aurawind-demo.vercel.app) *(or Heroku deployment)*  
> **Backend API Swagger:** `http://localhost:8000/docs`  
> **Video Demo (10 min):** [Unlisted YouTube Demo Link Placeholder](https://youtu.be/placeholder)

---

## 📋 Executive Overview

In the UK wholesale power market, energy utilities must purchase electricity **one day ahead** (before the 11:00 AM D-1 gate closure) to meet consumer demand. Because wind generation is intermittent and weather-dependent, power purchase managers must determine:
1. **How much wind generation is expected tomorrow** (to decide how much thermal/gas generation needs to be additionally procured).
2. **How reliable that forecast is quantitatively** (to determine the appropriate thermal buffer margin to avoid punitive cashout imbalance penalties under the UK Balancing & Settlement Code).

**AuraWind Intelligence** integrates live National Grid data from **Elexon BMRS** (`FUELHH` actuals and `WINDFOR` forecasts) for **January 2026** into an enterprise-grade trading cockpit that computes real-time forecast trajectories, lead-time horizon decay, diurnal error curves, and empirical trader hedging buffers.

---

## ⚡ Key Highlights & Quantitative Findings (January 2026)

Based on 744 matched hourly delivery periods (31 days × 24 hours):
- **Day-Ahead MAE:** `2,122.8 MW` (Mean Absolute Error)
- **Day-Ahead RMSE:** `2,616.7 MW` (Outlier-weighted error)
- **Systemic Bias:** `+1,840.3 MW` *(The national model consistently over-forecasted wind generation across January 2026)*
- **Horizon Error Decay:** Uncertainty drops by **22%** from Day-Ahead (24h lead: `2,308 MW` MAE) to Near-Gate Intraday (0–4h lead: `1,799 MW` MAE).
- **P90 Hedging Buffer:** Procuring an additional **+4,304 MW** reserve margin covers 90% of all wind generation shortfall risks.

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Client (React 18)                    │
│   • Trading Cockpit & Thermal Procurement Simulator             │
│   • Recharts Interactive Visuals (Area, Multi-Line, Scatter)    │
│   • Dark Energy Terminal Design System (CSS Tokens)             │
│   • In-App Technical Review Architecture Modal                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST JSON / Vite Proxy
┌────────────────────────────────▼────────────────────────────────┐
│                   Python FastAPI Backend                        │
│   • /api/forecast  • /api/actuals  • /api/accuracy  • /api/status│
│   • Statistical Engine (MAE, RMSE, MAPE, Bias, Quantiles)      │
│   • Gate-Closure & Horizon simulation logic                     │
└────────────────┬───────────────────────────────┬────────────────┘
                 │ Sub-millisecond Query         │ Automatic Ingestion
┌────────────────▼───────────────┐ ┌─────────────▼────────────────┐
│    SQLite Persistent Cache     │ │     Elexon BMRS Public API   │
│   • 1,513 actuals (FUELHH)     │ │   • FUELHH (30-min actuals)  │
│   • 19,272 forecasts (WINDFOR) │ │   • WINDFOR (hourly multi-   │
│   • Sub-25ms response time     │ │     horizon forecast runs)   │
└────────────────────────────────┘ └──────────────────────────────┘
```

- **Frontend:** React 18, Vite, Recharts, Lucide-React, Vanilla CSS (zero heavyweight CSS framework lock-in).
- **Backend:** Python 3.11/3.13, FastAPI, Uvicorn, httpx, NumPy.
- **Data Persistence:** SQLite embedded cache pre-seeded with all of January 2026 for instantaneous responses.
- **Containerization:** Docker multi-stage builds & Docker Compose.

---

## 📂 Repository Directory Structure

```
.
├── backend/
│   ├── data/
│   │   └── wind_cache.db       # Embedded SQLite cache (1,513 actuals, 19,272 forecasts)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── forecast.py         # /api/forecast & /api/forecast/evolution endpoints
│   │   ├── actuals.py          # /api/actuals (FUELHH wind generation)
│   │   └── accuracy.py         # /api/accuracy & /api/accuracy/hedging-recommendation
│   ├── scripts/
│   │   └── sync_data.py        # Automated Elexon BMRS data harvester & synchronizer
│   ├── services/
│   │   ├── __init__.py
│   │   ├── elexon.py           # Elexon API client, schema creation & query handlers
│   │   └── analytics.py        # Statistical metrics engine (MAE, RMSE, Quantiles)
│   ├── Dockerfile              # Python 3.11-slim production container
│   ├── Procfile                # Heroku deployment entrypoint
│   ├── main.py                 # FastAPI application root & CORS setup
│   └── requirements.txt        # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js       # Typed fetch client for backend endpoints
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Top header with status badge and tech review toggle
│   │   │   ├── StatsCard.jsx   # Metric KPI cards with trend indicators
│   │   │   ├── WindChart.jsx   # Main chart with ±1 RMSE confidence interval area
│   │   │   ├── EvolutionChart.jsx # Revisions across lead time for a selected hour
│   │   │   ├── AccuracyCharts.jsx # Horizon curve, diurnal, daily, & scatter visuals
│   │   │   ├── HedgingCalculator.jsx # Dynamic shortfall buffer tool for traders
│   │   │   └── TechReviewModal.jsx # Built-in technical walkthrough drawer
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Trading Cockpit & Procurement Simulator
│   │   │   ├── ForecastView.jsx# Detailed forecast explorer & settlement table
│   │   │   └── AccuracyView.jsx# Comprehensive quantitative accuracy analytics
│   │   ├── App.jsx             # Root layout & tab router
│   │   ├── index.css           # Energy terminal design tokens & animations
│   │   └── main.jsx            # React DOM bootstrap
│   ├── Dockerfile              # Multi-stage build with Nginx
│   ├── nginx.conf              # Nginx reverse proxy configuration
│   ├── package.json            # Node dependencies & Vite build scripts
│   ├── vercel.json             # Vercel deployment & API rewrites configuration
│   └── vite.config.js          # Vite bundler configuration & local dev proxy
├── .gitignore
├── docker-compose.yml          # 1-command startup for both frontend & backend
└── README.md                   # Full documentation & project deliverables
```

---

## 🚀 How to Run Locally

### Option A: Using Docker Compose (Recommended)
Make sure Docker Desktop is installed and running, then execute:
```bash
docker-compose up --build
```
- **Frontend Portal:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Running Bare-Metal / Development Mode

#### 1. Start Backend:
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*(If `wind_cache.db` is missing, the backend will automatically stream January 2026 data on startup).*

#### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Cloud Deployment Guide

### Deploy Backend to Heroku
1. Create a new Heroku application:
   ```bash
   heroku create your-wind-api
   ```
2. Deploy the `backend/` directory or push via git:
   ```bash
   git subtree push --prefix backend heroku master
   ```
3. The included `backend/Procfile` runs `uvicorn main:app --host 0.0.0.0 --port $PORT`.

### Deploy Frontend to Vercel
1. Link the repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set Environment Variable:
   - `VITE_API_URL`: URL of your deployed Heroku backend (e.g. `https://your-wind-api.herokuapp.com`).
4. Vercel automatically runs `npm run build` and serves via the configuration in `vercel.json`.

---

## 📊 Analytical Methodology & Mathematical Formulations

### 1. Half-Hourly to Hourly Resolution Alignment
- `FUELHH` actuals are published every 30 minutes ($t_1, t_2$).
- `WINDFOR` forecasts are issued at hourly resolution ($T$).
- We compute the actual rate for hour $T$ as:
  $$\text{Actual}(T) = \frac{\text{Actual}(t_1) + \text{Actual}(t_2)}{2}$$

### 2. Day-Ahead Gate Closure Filter
- Day-Ahead wholesale market gate closure occurs at 11:00 AM on $D-1$.
- For each target delivery day $D$, we select only forecasts published on or before 11:00 AM on $D-1$:
  $$\text{PublishTime} \le D-1 \text{ 11:00:00 UTC}$$

### 3. Error Metrics
- **Mean Absolute Error (MAE):**
  $$\text{MAE} = \frac{1}{N}\sum_{i=1}^{N} |F_i - A_i|$$
- **Root Mean Squared Error (RMSE):**
  $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^{N} (F_i - A_i)^2}$$
- **Directional Bias:**
  $$\text{Bias} = \frac{1}{N}\sum_{i=1}^{N} (F_i - A_i)$$
- **Empirical Downside Shortfall Quantile:**
  $$\text{Shortfall}_i = \max(0, F_i - A_i)$$
  $$\text{Buffer}(p) = Q_p(\text{Shortfall})$$

---

## 📹 Video Presentation Structure (10 Minutes Total)

### Part 1: Client Pitch (Max 5 Minutes) — Energy Procurement Utility Desk
1. **The Business Problem:**
   - Buying power Day-Ahead before 11:00 AM.
   - The double-edged sword of wind: clean and cheap, but uncertain.
   - The cost of error: cashout imbalance penalties when generation under-delivers.
2. **The Product Walkthrough:**
   - **Trading Cockpit:** Demonstrate the *Day-Ahead Procurement Simulator*. Show how adjusting national demand dynamically calculates the residual thermal requirement and the +P90 buffer.
   - **Forecast Explorer:** Inspect tomorrow's wind curve, confidence band, and the *Forecast Evolution* chart showing how forecasts shifted.
   - **Accuracy Analytics & Hedging Tool:** Show the quantitative evidence that Day-Ahead models have a +1,840 MW bias and how the slider provides the exact MW buffer needed.

### Part 2: Technical Lead Review (Max 5 Minutes) — Engineering & Architecture
1. **System Design & Non-Blocking Architecture:**
   - FastAPI asynchronous service layer + React 18 responsive frontend.
   - Click the in-app **Tech Review** button to walk through the architecture diagram.
2. **Data Engineering Nuances:**
   - Resolution harmonization between FUELHH (30m) and WINDFOR (60m).
   - Strict gate closure timestamp filtering to eliminate look-ahead bias.
   - Self-seeding SQLite caching pipeline (3.9 MB) delivering sub-25ms endpoint latency.
3. **Containerization & Deployment:**
   - Multi-stage Docker builds for minimal attack surface and rapid spin-up.
   - Tested in incognito mode across all modern browsers.

---

## 🤖 AI Tools Disclosure

As permitted and encouraged by the assessment guidelines, this application was developed with the assistance of **Antigravity** (Google DeepMind's Advanced Agentic Coding Assistant). AI was utilized for:
- Accelerating boilerplate scaffolding (FastAPI routers, React component hierarchy).
- Writing statistical aggregation logic and SQLite query optimizations.
- Designing the responsive CSS design token system and Recharts visualizations.
- Validating API integrity against live Elexon BMRS streaming endpoints.
