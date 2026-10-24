import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

function EvolutionTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">Publish Time: {data?.publishTime?.replace('T', ' ').replace('Z', '')}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Forecasted MW:</span>
        <span className="chart-tooltip-value" style={{ color: '#00e5a3' }}>
          {data?.generation?.toLocaleString()} MW
        </span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Lead Time (Horizon):</span>
        <span className="chart-tooltip-value">
          {data?.horizonHours} hours ahead
        </span>
      </div>
    </div>
  );
}

export default function EvolutionChart({ 
  records = [], 
  targetHour = '', 
  actualValue = null 
}) {
  if (!records || records.length === 0) {
    return (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Select an hour above to view how the forecast evolved across publish times.
      </div>
    );
  }

  // Format data
  const chartData = records.map((r, i) => ({
    ...r,
    index: i + 1,
    timeLabel: r.publishTime.slice(5, 16).replace('T', ' '),
    horizonLabel: `${r.horizonHours}h`
  }));

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          
          <XAxis 
            dataKey="horizonLabel" 
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            label={{ value: '← Lead Time to Delivery (hours ahead)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
            reversed
          />
          
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            unit=" MW"
            domain={['auto', 'auto']}
          />

          <Tooltip content={<EvolutionTooltip />} />

          {actualValue !== null && (
            <ReferenceLine 
              y={actualValue} 
              stroke="#00d2ff" 
              strokeDasharray="4 4" 
              label={{ value: `Actual: ${actualValue.toLocaleString()} MW`, fill: '#00d2ff', fontSize: 11, position: 'right' }} 
            />
          )}

          <Line
            type="monotone"
            dataKey="generation"
            name="Forecast Revision"
            stroke="#00e5a3"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#00e5a3' }}
            activeDot={{ r: 7, fill: '#00e5a3', stroke: '#090d16', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
