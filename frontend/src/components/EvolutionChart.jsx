import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart,
  Legend
} from 'recharts';

function EvolutionTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">Publish: {data?.publishTime?.replace('T', ' ').replace('Z', '')}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Predicted Output:</span>
        <span className="chart-tooltip-value" style={{ color: '#16a34a' }}>
          {data?.generation?.toLocaleString()} MW
        </span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Lead Time:</span>
        <span className="chart-tooltip-value">
          {data?.horizonHours} hours ahead
        </span>
      </div>
    </div>
  );
}

const LEGEND_STYLE = {
  fontSize: '0.76rem',
  paddingTop: 14,
  fontFamily: 'var(--font-sans)',
  color: '#6b7280'
};

export default function EvolutionChart({
  records = [],
  targetHour = '',
  actualValue = null
}) {
  if (!records || records.length === 0) {
    return (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Select an hour in the timeline above to view how the forecast evolved across publish times.
      </div>
    );
  }

  const chartData = records.map((r, i) => ({
    ...r,
    index: i + 1,
    timeLabel: r.publishTime.slice(5, 16).replace('T', ' '),
    horizonLabel: `${r.horizonHours}h`
  }));

  const allY = records
    .map((r) => r.generation)
    .filter((v) => v !== null && v !== undefined);
  if (actualValue !== null && actualValue !== undefined) {
    allY.push(actualValue);
  }
  const minY = allY.length > 0 ? Math.max(0, Math.floor(Math.min(...allY) * 0.92)) : 'auto';
  const maxY = allY.length > 0 ? Math.ceil(Math.max(...allY) * 1.06) : 'auto';

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="0" stroke="#f0f0f0" vertical={false} />

          <XAxis
            dataKey="horizonLabel"
            stroke="transparent"
            tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            label={{ value: '← Lead Time to Delivery (hours ahead)', position: 'insideBottom', offset: -12, fill: '#9ca3af', fontSize: 10 }}
            reversed
          />

          <YAxis
            stroke="transparent"
            tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            axisLine={false}
            tickLine={false}
            domain={[minY, maxY]}
          />

          <Tooltip content={<EvolutionTooltip />} />

          <Legend
            content={() => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 20,
                  paddingTop: 14,
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-sans)',
                  color: '#6b7280'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16a34a' }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                      display: 'inline-block'
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>Forecast Revision (WINDFOR)</span>
                </div>

                {actualValue !== null && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0284c7' }}>
                    <svg width="18" height="8" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                      <line
                        x1="0"
                        y1="4"
                        x2="18"
                        y2="4"
                        stroke="#0284c7"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                      />
                    </svg>
                    <span>
                      Actual Generation (FUELHH): <strong style={{ fontWeight: 700 }}>{actualValue?.toLocaleString()} MW</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          />

          {actualValue !== null && (
            <ReferenceLine
              y={actualValue}
              stroke="#0284c7"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}

          <Area
            type="monotone"
            dataKey="generation"
            name="Forecast Revision"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#evoGrad)"
            dot={{ r: 3.5, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
