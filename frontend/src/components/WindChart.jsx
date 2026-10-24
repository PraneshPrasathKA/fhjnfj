import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  const forecast = data?.forecast;
  const actual = data?.actual;
  const variance = actual !== undefined && forecast !== undefined ? round(forecast - actual, 1) : null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label} UTC</div>
      
      {forecast !== undefined && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: '#00e5a3' }}>● Forecast:</span>
          <span className="chart-tooltip-value">{forecast.toLocaleString()} MW</span>
        </div>
      )}

      {actual !== undefined && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: '#00d2ff' }}>● Actual Generation:</span>
          <span className="chart-tooltip-value">{actual.toLocaleString()} MW</span>
        </div>
      )}

      {variance !== null && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label">Variance (F - A):</span>
          <span 
            className="chart-tooltip-value" 
            style={{ color: variance > 0 ? '#f59e0b' : '#38bdf8' }}
          >
            {variance > 0 ? `+${variance}` : variance} MW
          </span>
        </div>
      )}

      {data?.confidenceHigh !== undefined && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label">±1 RMSE Range:</span>
          <span className="chart-tooltip-value" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {data.confidenceLow?.toLocaleString()} – {data.confidenceHigh?.toLocaleString()} MW
          </span>
        </div>
      )}

      {data?.publishTime && (
        <div className="chart-tooltip-row" style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
          <span className="chart-tooltip-label">Published At:</span>
          <span className="chart-tooltip-value" style={{ fontSize: '0.72rem' }}>
            {data.publishTime.replace('T', ' ').replace(':00Z', '')}
          </span>
        </div>
      )}
    </div>
  );
}

function round(val, dec = 1) {
  if (val === null || val === undefined) return val;
  return Number(val.toFixed(dec));
}

export default function WindChart({ 
  data = [], 
  showActuals = true, 
  showConfidence = true, 
  onSelectHour = null,
  selectedHour = null 
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No chart data available for the selected criteria.
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map((d) => {
    const timeLabel = d.startTime ? d.startTime.slice(11, 16) : '';
    const forecastVal = d.forecast !== undefined ? d.forecast : (d.generation !== undefined ? d.generation : null);
    const actualVal = d.actual;
    const rmse = d.rmseMargin || 2400; // default historical Jan 2026 RMSE

    return {
      ...d,
      timeLabel,
      forecast: forecastVal,
      actual: actualVal,
      confidenceHigh: forecastVal !== null ? Math.round(forecastVal + rmse) : null,
      confidenceLow: forecastVal !== null ? Math.max(0, Math.round(forecastVal - rmse)) : null,
      // For stacked area or range
      confidenceBand: forecastVal !== null ? [Math.max(0, Math.round(forecastVal - rmse)), Math.round(forecastVal + rmse)] : null
    };
  });

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload[0] && onSelectHour) {
              onSelectHour(e.activePayload[0].payload.startTime);
            }
          }}
        >
          <defs>
            <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e5a3" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00e5a3" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e5a3" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#00e5a3" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          
          <XAxis 
            dataKey="timeLabel" 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickLine={{ stroke: '#334155' }}
            tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
            unit=" MW"
            domain={['auto', 'auto']}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '0.8rem', paddingBottom: 10 }}
          />

          {/* Confidence interval band */}
          {showConfidence && (
            <Area
              type="monotone"
              dataKey="confidenceHigh"
              name="Confidence Range (±1 RMSE)"
              stroke="none"
              fill="url(#confidenceGrad)"
              isAnimationActive={false}
            />
          )}

          {/* Primary Forecast Area / Line */}
          <Area
            type="monotone"
            dataKey="forecast"
            name="Wind Forecast (WINDFOR)"
            stroke="#00e5a3"
            strokeWidth={2.5}
            fill="url(#forecastAreaGrad)"
            activeDot={{ r: 6, fill: '#00e5a3', stroke: '#090d16', strokeWidth: 2 }}
          />

          {/* Actuals Line */}
          {showActuals && (
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Generation (FUELHH)"
              stroke="#00d2ff"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#00d2ff' }}
              activeDot={{ r: 6, fill: '#00d2ff', stroke: '#090d16', strokeWidth: 2 }}
            />
          )}

          {selectedHour && (
            <ReferenceLine 
              x={selectedHour.slice(11, 16)} 
              stroke="#f59e0b" 
              strokeDasharray="4 4"
              label={{ value: 'Selected', fill: '#f59e0b', fontSize: 10, position: 'top' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
