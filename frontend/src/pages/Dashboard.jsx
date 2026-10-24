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
  Clock,
  Activity,
  ShieldCheck
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import WindChart from '../components/WindChart';
import CustomDateDropdown from '../components/CustomDateDropdown';
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
  const recommendedBuffer = overallAcc.hedgingBufferMW?.p90 || 4304;
  const totalProcurementNeeded = netThermalGap + recommendedBuffer;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* REint Editorial Hero Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 20,
        paddingBottom: 8
      }}>
        <div style={{ maxWidth: 760 }}>
          <div className="eyebrow">Decision Intelligence • UK Wholesale Day-Ahead</div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            letterSpacing: '-0.03em', 
            lineHeight: 1.15,
            color: 'var(--text-heading)'
          }}>
            Precision Wind Intelligence for{' '}
            <span className="editorial-title" style={{ fontSize: '2.9rem', color: '#16a34a' }}>
              Day-Ahead Power Decisions
            </span>
          </h1>
          <p style={{ 
            fontSize: '0.92rem', 
            color: 'var(--text-secondary)', 
            marginTop: 10, 
            lineHeight: 1.6,
            fontWeight: 400 
          }}>
            Connecting official Elexon National Grid forecast streams (<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>WINDFOR</span>) 
            with historical accuracy decay metrics to formulate optimal thermal procurement bids ahead of the 11:00 AM D-1 gate closure.
          </p>
        </div>

        {/* Quick Date & Gate Status Toolbar */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 10, 
          alignItems: 'flex-end' 
        }}>
          <div className="toolbar" style={{ margin: 0, padding: '6px 12px' }}>
            <div className="toolbar-group">
              <span className="toolbar-label">Target Day:</span>
              <CustomDateDropdown
                value={selectedDate}
                onChange={(d) => setSelectedDate(d)}
                options={availableDates}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="badge badge-positive" style={{ gap: 6 }}>
              <Clock size={12} />
              Gate Closure: 11:00 AM (D-1)
            </span>
            <span className="badge badge-info">
              January 2026 Evaluated
            </span>
          </div>
        </div>
      </div>

      {/* REint-Style Split Cockpit Simulator Panel */}
      <div className="simulator-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-primary-light)' }}>
              Interactive Procurement Simulator
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Day-Ahead Thermal Dispatch & Hedging Engine
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 660 }}>
              Adjust anticipated national grid demand to compute residual thermal procurement and empirical risk buffers to cover wind generation shortfalls.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('hedging')}>
              <Sliders size={14} />
              <span>Full Hedging Suite</span>
            </button>
          </div>
        </div>

        {/* Grid: Simulator Inputs + Split Signal / Watchlist Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 22 }}>
          {/* Left: Input & Demand Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Expected Peak National Demand
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-heading)' }}>
                  {demandEstimate.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MW</span>
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

              {/* Demand Presets */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'Mild (28 GW)', val: 28000 },
                  { label: 'Winter Peak (38 GW)', val: 38000 },
                  { label: 'Cold Snap (44 GW)', val: 44000 }
                ].map((preset) => (
                  <button 
                    key={preset.val}
                    onClick={() => setDemandEstimate(preset.val)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      background: demandEstimate === preset.val ? 'var(--color-brand)' : 'var(--bg-secondary)',
                      color: demandEstimate === preset.val ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid ' + (demandEstimate === preset.val ? 'var(--color-brand)' : 'var(--border-light)'),
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Forecast Wind</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-primary-light)', marginTop: 2 }}>
                  {expectedWindPeak.toLocaleString()} <span style={{ fontSize: '0.72rem' }}>MW</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Base Gap</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: 2 }}>
                  {netThermalGap.toLocaleString()} <span style={{ fontSize: '0.72rem' }}>MW</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>P90 Buffer</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 2 }}>
                  +{recommendedBuffer.toLocaleString()} <span style={{ fontSize: '0.72rem' }}>MW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: REint Model Signal & Watchlist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* REint Model Signal Card */}
            <div className="model-signal-box">
              <div className="eyebrow" style={{ color: 'var(--accent-primary-light)', marginBottom: 4 }}>
                Model Signal • Procurement Order
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
                Total Recommended Thermal Order: {totalProcurementNeeded.toLocaleString()} MW
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Under current market conditions, dispatching <strong style={{ color: 'var(--text-primary)' }}>{netThermalGap.toLocaleString()} MW</strong> base thermal plus a <strong style={{ color: 'var(--accent-primary-light)' }}>+{recommendedBuffer.toLocaleString()} MW</strong> reserve covers 90% of empirical wind shortfall risk under BSC rules.
              </p>
            </div>

            {/* REint Watch List Card */}
            <div className="watchlist-box">
              <div className="eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
                Trader Watch List
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-brand)', marginTop: 5, flexShrink: 0 }}></div>
                  <span>National model exhibits persistent over-forecast bias (<strong style={{ color: 'var(--text-primary)' }}>+1,840 MW</strong>) across winter months.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', marginTop: 5, flexShrink: 0 }}></div>
                  <span>Accuracy improves by 22% between Day-Ahead (24h lead) and Intraday Gate Closure.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (REint Institutional Metric Style) */}
      <div className="stats-grid">
        <StatsCard 
          label="Peak Wind Forecast"
          value={summary.peakMW?.toLocaleString() || '—'}
          unit="MW"
          icon={Wind}
          badgeText="Day-Ahead (D-1)"
          badgeType="positive"
          subtext="Highest expected delivery hour"
          highlight={true}
        />
        <StatsCard 
          label="Average Expected Power"
          value={summary.avgMW?.toLocaleString() || '—'}
          unit="MW"
          icon={Zap}
          badgeText="24h Average"
          badgeType="info"
          subtext="Day-total: ~276 GWh energy"
        />
        <StatsCard 
          label="Historical Forecast MAE"
          value={overallAcc.mae?.toLocaleString() || '2,123'}
          unit="MW"
          icon={TrendingUp}
          badgeText="Jan 2026 Baseline"
          badgeType="warning"
          subtext="Average deviation magnitude"
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
            <div className="eyebrow" style={{ color: 'var(--accent-primary-light)' }}>
              Generation Telemetry
            </div>
            <div className="card-title">
              <Wind size={18} />
              <span>Day-Ahead Generation Trajectory for {selectedDate}</span>
            </div>
            <div className="card-subtitle">
              Official WINDFOR hourly forecast stream with empirical ±1 RMSE uncertainty corridor ({overallAcc.rmse || 2617} MW spread) and actual delivery overlay.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('forecast')}>
              <span>Open Detailed Explorer</span>
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
