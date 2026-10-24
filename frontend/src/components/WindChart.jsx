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
  const variance = actual !== undefined && actual !== null && forecast !== undefined && forecast !== null
    ? round(forecast - actual, 1)
    : null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label} UTC (Settlement Window)</div>

      {forecast !== undefined && forecast !== null && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: '#16a34a' }}>● WINDFOR Forecast:</span>
          <span className="chart-tooltip-value">{forecast.toLocaleString()} MW</span>
        </div>
      )}

      {actual !== undefined && actual !== null && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: '#0284c7' }}>● FUELHH Actual:</span>
          <span className="chart-tooltip-value">{actual.toLocaleString()} MW</span>
        </div>
      )}

      {variance !== null && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label">Variance (F - A):</span>
          <span
            className="chart-tooltip-value"
            style={{ color: variance > 0 ? '#d97706' : '#0284c7' }}
          >
            {variance > 0 ? `+${variance.toLocaleString()}` : variance.toLocaleString()} MW
          </span>
        </div>
      )}

      {data?.confidenceHigh !== undefined && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-label">±1 RMSE Corridor:</span>
          <span className="chart-tooltip-value" style={{ fontSize: '0.73rem', opacity: 0.85 }}>
            {data.confidenceLow?.toLocaleString()} – {data.confidenceHigh?.toLocaleString()} MW
          </span>
        </div>
      )}

      {data?.publishTime && (
        <div className="chart-tooltip-row" style={{ marginTop: 6, borderTop: '1px solid #e5e7eb', paddingTop: 5 }}>
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

const LEGEND_STYLE = {
  fontSize: '0.76rem',
  paddingTop: 14,
  fontFamily: 'var(--font-sans)',
  color: '#6b7280'
};

export default function WindChart({
  data = [],
  showActuals = true,
  showConfidence = true,
  onSelectHour = null,
  selectedHour = null
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        No chart data available for the selected criteria.
      </div>
    );
  }

  const chartData = data.map((d) => {
    const timeLabel = d.startTime ? d.startTime.slice(11, 16) : '';
    const forecastVal = d.forecast !== undefined ? d.forecast : (d.generation !== undefined ? d.generation : null);
    const actualVal = d.actual;
    const rmse = d.rmseMargin || 2617;

    return {
      ...d,
      timeLabel,
      forecast: forecastVal,
      actual: actualVal,
      confidenceHigh: forecastVal !== null ? Math.round(forecastVal + rmse) : null,
      confidenceLow: forecastVal !== null ? Math.max(0, Math.round(forecastVal - rmse)) : null,
    };
  });

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 14, right: 24, left: 14, bottom: 0 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload[0] && onSelectHour) {
              const clickedStartTime = e.activePayload[0].payload.startTime;
              onSelectHour(clickedStartTime);
            }
          }}
        >
          <defs>
            {/* Confidence band — soft green wash */}
            <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.20} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.05} />
            </linearGradient>
            {/* Forecast area fill */}
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.04} />
            </linearGradient>
            {/* Actual area fill */}
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={0.04} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="0" stroke="#e8ecf0" vertical={false} />

          <XAxis
            dataKey="timeLabel"
            stroke="transparent"
            tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />

          <YAxis
            stroke="transparent"
            tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={LEGEND_STYLE}
            iconType="circle"
            iconSize={8}
          />

          {/* Confidence band */}
          {showConfidence && (
            <Area
              type="monotone"
              dataKey="confidenceHigh"
              name="Upper Bound (+1 RMSE)"
              stroke="rgba(22, 163, 74, 0.45)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              fill="url(#confGrad)"
              legendType="none"
            />
          )}
          {showConfidence && (
            <Area
              type="monotone"
              dataKey="confidenceLow"
              name="Lower Bound (-1 RMSE)"
              stroke="rgba(22, 163, 74, 0.45)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              fill="transparent"
              legendType="none"
            />
          )}

          {/* Actual generation — area under */}
          {showActuals && (
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual Generation (FUELHH)"
              stroke="#0284c7"
              strokeWidth={2.5}
              fill="url(#actualGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
            />
          )}

          {/* Forecast — area under, darker stroke */}
          <Area
            type="monotone"
            dataKey="forecast"
            name="Forecast Generation (WINDFOR)"
            stroke="#16a34a"
            strokeWidth={3}
            fill="url(#forecastGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
          />

          {selectedHour && (
            <ReferenceLine
              x={selectedHour.slice(11, 16)}
              stroke="#6b7280"
              strokeDasharray="3 2"
              strokeWidth={1.5}
              label={{ value: '⬤ Inspecting', fill: '#374151', fontSize: 10, fontWeight: 600, position: 'insideTopRight', dx: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
