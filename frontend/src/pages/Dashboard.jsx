import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Wind, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight, 
  Calendar, 
  Sliders, 
  Flame,
  CheckCircle2,
  Clock
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import WindChart from '../components/WindChart';
import { fetchForecasts, fetchActuals, fetchAccuracy } from '../api/client';

export default function Dashboard({ 
  selectedDate, 
  setSelectedDate, 
  availableDates = [], 
  onNavigate 
}) {
  const [demandEstimate, setDemandEstimate] = useState(38000); // 38,000 MW typical UK winter evening peak
  const [forecastData, setForecastData] = useState(null);
  const [accuracyData, setAccuracyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [fRes, aRes, accRes] = await Promise.all([
          fetchForecasts(selectedDate, 'day_ahead'),
          fetchActuals(`${selectedDate}T00:00:00Z`, `${selectedDate}T23:59:59Z`, 'hourly'),
          fetchAccuracy('2026-01-01', '2026-01-31', 'day_ahead')
        ]);

        // Merge actuals into forecast records for charting
        const actualMap = {};
        if (aRes && aRes.records) {
          aRes.records.forEach((r) => { actualMap[r.startTime] = r.generation; });
        }

        const mergedRecords = (fRes.records || []).map((r) => ({
          ...r,
          actual: actualMap[r.startTime] !== undefined ? actualMap[r.startTime] : null,
          rmseMargin: accRes?.overall?.rmse || 2600
        }));

        setForecastData({ ...fRes, mergedRecords });
        setAccuracyData(accRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [selectedDate]);

  const summary = forecastData?.summary || { peakMW: 14500, avgMW: 11500, totalMWh: 276000 };
  const overallAcc = accuracyData?.overall || { mae: 2122, rmse: 2616, bias: 1840, hedgingBufferMW: { p90: 4312 } };
  
  // Procurement Gap calculations
  const expectedWindPeak = summary.peakMW || 14000;
  const netThermalGap = Math.max(0, demandEstimate - expectedWindPeak);
  const recommendedBuffer = overallAcc.hedgingBufferMW?.p90 || 4300;
  const totalProcurementNeeded = netThermalGap + recommendedBuffer;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner Toolbar */}
      <div className="toolbar">
        <div className="toolbar-group">
          <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
          <span className="toolbar-label">Target Delivery Day:</span>
          <select 
            className="select-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d} (Day-Ahead Market)
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} />
            Gate Closure: 11:00 AM (D-1) Active
          </span>
          <span className="badge badge-positive">
            National Elexon Model
          </span>
        </div>
      </div>

      {/* Procurement Gap Cockpit Simulator */}
      <div className="simulator-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-primary)' }}>
              <Zap size={22} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Day-Ahead Thermal Procurement Simulator
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 640 }}>
              To serve utility consumers, adjust your forecasted peak national demand. The model calculates the residual thermal procurement required after wind generation, plus the empirical buffer to shield against forecast error.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('hedging')}>
              <Sliders size={14} />
              <span>Adjust Buffer Risk</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Expected Peak Grid Demand:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {demandEstimate.toLocaleString()} MW
            </span>
          </div>
          <input 
            type="range"
            min="25000"
            max="48000"
            step="500"
            value={demandEstimate}
            onChange={(e) => setDemandEstimate(Number(e.target.value))}
            className="custom-range"
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>25,000 MW (Low/Mild)</span>
            <span>38,000 MW (Typical Winter Evening)</span>
            <span>48,000 MW (Extreme Freeze)</span>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
          gap: 16, 
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border-light)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wind Generation Contribution</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: 2 }}>
              {expectedWindPeak.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>MW</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Based on Day-Ahead WINDFOR</span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Residual Base Gap (Demand - Wind)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>
              {netThermalGap.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>MW</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unbuffered procurement requirement</span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Buffer (+P90 Hedge)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: '#00d2ff', marginTop: 2 }}>
              +{recommendedBuffer.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>MW</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Protects 90% of wind shortfall risk</span>
          </div>

          <div style={{ background: 'rgba(0, 229, 163, 0.08)', padding: 10, borderRadius: 8, border: '1px solid var(--border-accent)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Thermal Order Recommendation</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
              {totalProcurementNeeded.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>MW</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Procure in wholesale Day-Ahead auction</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="stats-grid">
        <StatsCard 
          label="Peak Wind Forecast"
          value={summary.peakMW?.toLocaleString() || '—'}
          unit="MW"
          icon={Wind}
          badgeText="Day-Ahead"
          badgeType="positive"
          subtext="Highest delivery interval"
        />
        <StatsCard 
          label="Average Expected Power"
          value={summary.avgMW?.toLocaleString() || '—'}
          unit="MW"
          icon={Zap}
          badgeText="24h Average"
          badgeType="info"
          subtext="Total: ~276 GWh equivalent"
        />
        <StatsCard 
          label="Historical Forecast MAE"
          value={overallAcc.mae?.toLocaleString() || '2,122'}
          unit="MW"
          icon={TrendingUp}
          badgeText="Jan 2026 Baseline"
          badgeType="warning"
          subtext="Mean Absolute Error across month"
        />
        <StatsCard 
          label="Systemic Forecast Bias"
          value={overallAcc.bias > 0 ? `+${overallAcc.bias?.toLocaleString()}` : overallAcc.bias?.toLocaleString() || '+1,840'}
          unit="MW"
          icon={ShieldAlert}
          badgeText="Over-Forecasting"
          badgeType="warning"
          subtext="Consistently over-predicts in winter"
        />
      </div>

      {/* Main Chart Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Wind size={20} />
              <span>Day-Ahead Generation Profile for {selectedDate}</span>
            </div>
            <div className="card-subtitle">
              Forecasted Wind Generation curve (WINDFOR) with historical ±1 RMSE confidence band and actual delivery overlay.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('forecast')}>
              <span>Detailed Explorer</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <WindChart 
          data={forecastData?.mergedRecords || []}
          showActuals={true}
          showConfidence={true}
        />
      </div>
    </div>
  );
}
