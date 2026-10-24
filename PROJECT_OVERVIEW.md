# 🌬️ AuraWind Intelligence — Project Summary & Guide

An easy-to-understand overview of what was built, why it was built, and how each component helps energy traders make smarter decisions.

---

## 🎯 1. The Core Problem (Why this was built)

In the United Kingdom, electricity cannot be easily stored in large quantities at grid scale. Energy utilities must buy power **one day in advance** (in the UK Day-Ahead wholesale market, before 11:00 AM) to match the expected electricity demand of homes and businesses for the following day.

* **Wind is cheap and clean**, but it depends entirely on the weather.
* **The risk:** If an energy company expects 10,000 MW of wind power tomorrow, but the wind suddenly dies down, they face an unexpected shortfall. They must scramble to buy emergency gas/thermal power or pay heavy financial penalties (imbalance cashout prices) set by the grid operator.
* **The solution:** Traders cannot rely on a single forecast blindly. They need:
  1. **The latest wind forecast** for the upcoming delivery day.
  2. **Quantitative accuracy metrics** (historical errors) so they know how big of a "safety buffer" to add to their power purchases.

**AuraWind Intelligence** was built to solve this exact business problem for the Day-Ahead procurement team.

---

## 🖥️ 2. What the Website Does (Page by Page)

The application is structured into three main views, along with an interactive thermal hedging tool and an in-app technical review panel.

### 📊 View 1: Trading Dashboard (`/`)
* **Key Performance Indicators (KPI Cards):**
  * **Day-Ahead MAE (Mean Absolute Error):** ~2,123 MW — The average difference between forecast and actual generation.
  * **Day-Ahead RMSE (Root Mean Square Error):** ~2,617 MW — Penalizes large unexpected forecast swings.
  * **Model Bias:** +1,840 MW — Reveals that the national forecast systematically over-predicts wind generation.
* **Interactive Thermal Procurement Simulator:**
  * Allows a trader to enter expected consumer electricity demand (e.g., 25,000 MW).
  * Automatically subtracts forecasted wind power to reveal the net thermal power (gas/coal) that must be purchased.
  * Calculates a **P90 Hedging Buffer** (e.g., +4,304 MW) that tells the trader how much extra reserve power to secure so they are protected against 90% of wind shortfall scenarios.

---

### 🌬️ View 2: Forecast View (`/forecast`)
* **24-Hour Wind Forecast Curve:** Shows the hour-by-hour anticipated wind output across the entire selected day.
* **Confidence Band (±1 RMSE):** Instead of a single uncertain line, it displays a shaded confidence boundary showing the statistically probable high and low range.
* **Forecast vs. Actual Toggle:** Allows traders to superimpose actual generation over the forecast to visually see where the weather model was accurate or where it missed.
* **Forecast Evolution Tracker:** Traders can click on any individual hour to see how the forecast shifted over time (from 48 hours out, to 24 hours out, down to 1 hour before gate closure).

---

### 📈 View 3: Accuracy View (`/accuracy`)
* **Statistical Breakdown:** Provides detailed error metrics (MAE, RMSE, MAPE, Bias) across all evaluated periods.
* **Horizon Decay Curve:** Proves quantitatively that forecasts become significantly more reliable as time gets closer to gate closure (uncertainty drops by ~22% from Day-Ahead to near-real-time).
* **Diurnal Error Curve (Hour of Day):** Highlights which hours of the day suffer from higher forecast volatility (e.g., morning and evening peak demand transitions).
* **Trader Hedging Calculator:** An interactive tool where traders can select their risk tolerance level (P50, P75, or P90) to receive an exact megawatt (MW) buffer recommendation for their bids.

---

### 🛠️ In-App Technical Review Modal
* Located in the top navigation bar (`Tech Review` button).
* Opens a slide-out drawer presenting the software architecture, data ingestion pipelines, mathematical formulas, and design decisions directly to technical leads and reviewers.

---

## ⚙️ 3. How It Was Built (Architecture & Tech Stack)

```
Elexon BMRS Public APIs (FUELHH & WINDFOR)
                  │
                  ▼
Python FastAPI Backend + SQLite Pre-Cache
(Holds 1,513 actuals & 19,272 forecasts for Jan 2026 for sub-25ms responses)
                  │
                  ▼ (REST JSON)
React Frontend (Vite + Recharts)
(Modern dark-mode energy terminal with real-time charts and simulators)
```

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, Recharts, Lucide Icons, Vanilla CSS | Fast, interactive trading cockpit with zero heavyweight CSS framework overhead. |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, NumPy | Computes statistical metrics (MAE, RMSE, quantiles) and serves REST API endpoints. |
| **Data Source** | Elexon BMRS (`FUELHH` & `WINDFOR`) | Official UK National Grid actuals (30-min) and forecast streams (hourly multi-horizon). |
| **Data Cache** | SQLite (`wind_cache.db`) | Pre-seeds all of January 2026 data for resilient offline operation and instantaneous response times. |
| **DevOps** | Docker, Docker Compose | Single-command containerized execution (`docker-compose up`). |

---

## 🚀 4. How to Run the Application

### Option A: Standard Local Setup
1. **Start the Backend:**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

### Option B: Docker Compose
```bash
docker-compose up --build
```
* **Frontend:** `http://localhost:3000`
* **Backend API Docs (Swagger):** `http://localhost:8000/docs`
