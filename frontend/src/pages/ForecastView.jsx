import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Calendar, 
  Layers, 
  Eye, 
  Clock, 
  GitCommit, 
  Activity,
  ArrowUpDown,
  Download,
  ArrowUp
} from 'lucide-react';
import WindChart from '../components/WindChart';
import EvolutionChart from '../components/EvolutionChart';
import StatsCard from '../components/StatsCard';
import CustomDateDropdown from '../components/CustomDateDropdown';
import CustomTimeDropdown from '../components/CustomTimeDropdown';
import { fetchForecasts, fetchActuals, fetchForecastEvolution, fetchAccuracy } from '../api/client';

export default function ForecastView({ 
  selectedDate, 
  setSelectedDate, 
  availableDates = [] 
}) {
  const [mode, setMode] = useState('day_ahead'); // 'day_ahead' or 'latest'
  const [showActuals, setShowActuals] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [selectedHour, setSelectedHour] = useState(`${selectedDate}T12:00:00Z`);
  const [forecastData, setForecastData] = useState(null);
  const [evolutionData, setEvolutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rmseVal, setRmseVal] = useState(2617);

  // Load forecast and actuals for selected date
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fRes, aRes, accRes] = await Promise.all([
          fetchForecasts(selectedDate, mode),
          fetchActuals(`${selectedDate}T00:00:00Z`, `${selectedDate}T23:59:59Z`, 'hourly'),
          fetchAccuracy('2026-01-01', '2026-01-31', mode)
        ]);

        const actualMap = {};
        if (aRes && aRes.records) {
          aRes.records.forEach((r) => { actualMap[r.startTime] = r.generation; });
        }

        const currentRmse = accRes?.overall?.rmse || 2617;
        setRmseVal(currentRmse);

        const merged = (fRes.records || []).map((r, idx) => {
          const act = actualMap[r.startTime] !== undefined ? actualMap[r.startTime] : null;
          const variance = act !== null ? round(r.generation - act, 1) : null;
          const pctError = act !== null && act > 50 ? round(Math.abs(variance) / act * 100, 1) : null;
          
          return {
            ...r,
            forecast: r.generation,
            actual: act,
            variance,
            pctError,
            settlementPeriod: (idx + 1) * 2, // 2 periods per hour
            rmseMargin: currentRmse
          };
        });

        setForecastData({ ...fRes, mergedRecords: merged });

        // Update default selected hour if needed
        const defaultHr = `${selectedDate}T12:00:00Z`;
        setSelectedHour(defaultHr);
      } catch (err) {
        console.error('Error loading forecast view:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedDate, mode]);

  // Load evolution data when selectedHour changes
  useEffect(() => {
    async function loadEvolution() {
      if (!selectedHour) return;
      try {
        const evoRes = await fetchForecastEvolution(selectedHour);
        setEvolutionData(evoRes);
      } catch (err) {
        console.error('Error loading evolution:', err);
        setEvolutionData(null);
      }
    }

    loadEvolution();
  }, [selectedHour]);

  const summary = forecastData?.summary || {};
  const currentSelectedRecord = forecastData?.mergedRecords?.find((r) => r.startTime === selectedHour);

  const handleSelectHour = (startTime) => {
    setSelectedHour(startTime);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* Control Toolbar */}
      <div className="toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Target Day:</span>
          <CustomDateDropdown
            value={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            options={availableDates}
          />

          <span className="toolbar-label" style={{ marginLeft: 8 }}>Auction Horizon:</span>
          <div className="toggle-group">
            <button 
              className={`toggle-btn ${mode === 'day_ahead' ? 'active' : ''}`}
              onClick={() => setMode('day_ahead')}
            >
              Day-Ahead (11:00 D-1)
            </button>
            <button 
              className={`toggle-btn ${mode === 'latest' ? 'active' : ''}`}
              onClick={() => setMode('latest')}
            >
              Latest Intraday
            </button>
          </div>
        </div>

        <div className="toolbar-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showActuals} 
              onChange={(e) => setShowActuals(e.target.checked)} 
              style={{ accentColor: 'var(--accent-primary-light)' }}
            />
            Overlay Actuals (FUELHH)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showConfidence} 
              onChange={(e) => setShowConfidence(e.target.checked)} 
              style={{ accentColor: 'var(--accent-primary-light)' }}
            />
            ±1 RMSE Margin ({rmseVal.toLocaleString()} MW)
          </label>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <StatsCard 
          label="Peak Generation Expected"
          value={summary.peakMW?.toLocaleString() || '—'}
          unit="MW"
          icon={Wind}
          badgeText={mode === 'day_ahead' ? 'Day-Ahead Gate' : 'Intraday'}
          badgeType="positive"
          subtext="Maximum hourly output"
          highlight={true}
        />
        <StatsCard 
          label="Minimum Trough Output"
          value={summary.troughMW?.toLocaleString() || '—'}
          unit="MW"
          icon={Activity}
          badgeText="Low Wind Point"
          badgeType="warning"
          subtext="Requires thermal baseload support"
        />
        <StatsCard 
          label="Expected 24h Energy"
          value={(summary.totalMWh ? Math.round(summary.totalMWh / 1000) : '—')}
          unit="GWh"
          icon={Clock}
          badgeText="Cumulative Volume"
          badgeType="info"
          subtext={`${summary.totalMWh?.toLocaleString()} MWh delivered`}
        />
        <StatsCard 
          label="Forecast Uncertainty Band"
          value={`±${rmseVal.toLocaleString()}`}
          unit="MW"
          icon={Layers}
          badgeText="68% Confidence"
          badgeType="warning"
          subtext="Historical empirical RMSE"
        />
      </div>

      {/* Main Interactive Forecast Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-primary-light)' }}>
              Generation Telemetry Curve
            </div>
            <div className="card-title">
              <Wind size={18} />
              <span>Wind Generation Profile — {selectedDate}</span>
            </div>
            <div className="card-subtitle">
              Click any hour data point on the chart to inspect its multi-publish forecast revision history below.
            </div>
          </div>

          {selectedHour && (
            <span className="badge badge-positive">
              Inspecting: {selectedHour.slice(11, 16)} UTC
            </span>
          )}
        </div>

        <WindChart 
          data={forecastData?.mergedRecords || []}
          showActuals={showActuals}
          showConfidence={showConfidence}
          onSelectHour={(hr) => setSelectedHour(hr)}
          selectedHour={selectedHour}
        />
      </div>

      {/* Forecast Evolution Panel (Multi-publish tracking) */}
      <div className="card" style={{ border: '1px solid var(--border-accent)', background: 'var(--bg-card)' }}>
        <div className="card-header">
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-primary-light)' }}>
              Forecast Convergence
            </div>
            <div className="card-title">
              <GitCommit size={18} />
              <span>Forecast Evolution & Staleness Analysis ({selectedHour.slice(11, 16)} UTC)</span>
            </div>
            <div className="card-subtitle">
              Inspect how the National Grid / Elexon model for this delivery slot evolved as new weather runs arrived.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delivery Slot:</span>
            <CustomTimeDropdown
              value={selectedHour}
              onChange={(hr) => setSelectedHour(hr)}
              options={forecastData?.mergedRecords || []}
            />
          </div>
        </div>

        <EvolutionChart 
          records={evolutionData?.records || []}
          targetHour={selectedHour}
          actualValue={currentSelectedRecord?.actual}
        />
      </div>

      {/* Tabular Breakdown */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow" style={{ color: 'var(--text-muted)' }}>
              Period Ledger
            </div>
            <div className="card-title">
              <Layers size={18} />
              <span>Hourly Settlement Period Breakdown</span>
            </div>
            <div className="card-subtitle">
              48 Half-Hourly Settlement Periods Aligned to 24 Hourly Wholesale Auction Windows • Click any row to inspect & scroll to top
            </div>
          </div>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Scroll to top charts"
          >
            <ArrowUp size={14} />
            <span>Scroll to Top</span>
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery Time (UTC)</th>
                <th>Settlement Period</th>
                <th>Forecasted (MW)</th>
                <th>Actual Delivered (MW)</th>
                <th>Variance (F - A)</th>
                <th>Abs Error %</th>
                <th>Horizon Ahead</th>
                <th>Model Publish Time</th>
              </tr>
            </thead>
            <tbody>
              {(forecastData?.mergedRecords || []).map((row) => {
                const isSelected = row.startTime === selectedHour;
                return (
                  <tr 
                    key={row.startTime}
                    className={isSelected ? 'active' : ''}
                    onClick={() => handleSelectHour(row.startTime)}
                    title="Click to inspect this settlement hour and scroll to chart"
                  >
                    <td style={{ color: isSelected ? '#15803d' : 'var(--text-heading)', fontWeight: isSelected ? 700 : 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {isSelected ? (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block', flexShrink: 0 }}></span>
                        ) : (
                          <span style={{ width: 6, height: 6, display: 'inline-block', flexShrink: 0 }}></span>
                        )}
                        <span>{row.startTime.slice(11, 16)}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>SP {row.settlementPeriod - 1} - {row.settlementPeriod}</td>
                    <td style={{ color: 'var(--accent-primary-light)', fontWeight: 600 }}>{row.forecast?.toLocaleString()}</td>
                    <td style={{ color: 'var(--accent-cyan)' }}>{row.actual !== null ? row.actual.toLocaleString() : '—'}</td>
                    <td style={{ color: row.variance > 0 ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
                      {row.variance !== null ? (row.variance > 0 ? `+${row.variance.toLocaleString()}` : row.variance.toLocaleString()) : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.pctError !== null ? `${row.pctError}%` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{row.horizonHours} hrs</td>
                    <td style={{ color: 'var(--text-muted)' }}>{row.publishTime?.slice(5, 16).replace('T', ' ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function round(val, dec = 1) {
  if (val === null || val === undefined) return val;
  return Number(val.toFixed(dec));
}
