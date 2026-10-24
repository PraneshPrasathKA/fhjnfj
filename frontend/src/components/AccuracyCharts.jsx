import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';

const AXIS_STYLE = { fill: '#9ca3af', fontSize: 11, fontFamily: 'var(--font-mono)' };
const GRID_STROKE = '#f0f0f0';

const lightTooltipStyle = {
  backgroundColor: '#ffffff',
  borderColor: 'rgba(0,0,0,0.08)',
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '0.78rem',
  color: '#111827'
};

export function HorizonChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No horizon data.</div>;
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 20 }} barGap={3}>
          <CartesianGrid strokeDasharray="0" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="bin"
            stroke="transparent"
            tick={{ ...AXIS_STYLE }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            stroke="transparent"
            tick={{ ...AXIS_STYLE }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toLocaleString()}`}
            width={60}
          />
          <Tooltip
            contentStyle={lightTooltipStyle}
            formatter={(value) => [`${value?.toLocaleString()} MW`, '']}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: 10, color: '#6b7280' }} iconSize={8} />
          <Bar dataKey="mae" name="Mean Absolute Error (MAE)" fill="#16a34a" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
          <Bar dataKey="rmse" name="Root Mean Square Error (RMSE)" fill="#0284c7" fillOpacity={0.80} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DiurnalChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No diurnal data.</div>;
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="maeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="rmseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="hourLabel" stroke="transparent" tick={{ ...AXIS_STYLE }} axisLine={false} tickLine={false} />
          <YAxis stroke="transparent" tick={{ ...AXIS_STYLE }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toLocaleString()}`} width={58} />
          <Tooltip contentStyle={lightTooltipStyle} formatter={(value) => [`${value?.toLocaleString()} MW`, '']} />
          <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: 10, color: '#6b7280' }} iconSize={8} />
          <Area type="monotone" dataKey="mae" name="MAE (MW)" stroke="#16a34a" strokeWidth={2} fill="url(#maeGrad)" dot={false} />
          <Area type="monotone" dataKey="rmse" name="RMSE (MW)" stroke="#0284c7" strokeWidth={1.8} fill="url(#rmseGrad)" dot={false} />
          <Line type="monotone" dataKey="bias" name="Bias (F - A)" stroke="#d97706" strokeWidth={1.8} strokeDasharray="4 3" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No daily data.</div>;
  }

  const chartData = data.map((d) => ({
    ...d,
    dayLabel: d.date.slice(8, 10) + ' Jan'
  }));

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="dayLabel" stroke="transparent" tick={{ ...AXIS_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
          <YAxis stroke="transparent" tick={{ ...AXIS_STYLE }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toLocaleString()}`} width={58} />
          <Tooltip contentStyle={lightTooltipStyle} formatter={(value) => [`${value?.toLocaleString()} MW`, '']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: 10, color: '#6b7280' }} iconSize={8} />
          <Area type="monotone" dataKey="mae" name="Daily MAE (MW)" stroke="#16a34a" strokeWidth={2} fill="url(#dailyGrad)" dot={{ r: 3, fill: '#16a34a', stroke: '#fff', strokeWidth: 1.5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScatterAccuracyPlot({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No scatter plot data.</div>;
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 24, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="0" stroke={GRID_STROKE} />
          <XAxis
            type="number"
            dataKey="forecast"
            name="Forecast Generation"
            stroke="transparent"
            tick={{ ...AXIS_STYLE }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            label={{ value: 'Forecasted Output (MW)', position: 'insideBottom', offset: -12, fill: '#9ca3af', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="actual"
            name="Actual Generation"
            stroke="transparent"
            tick={{ ...AXIS_STYLE }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={48}
            label={{ value: 'Actual (MW)', angle: -90, position: 'insideLeft', offset: 16, fill: '#9ca3af', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={lightTooltipStyle}
            cursor={{ strokeDasharray: '3 3', stroke: '#d1d5db' }}
            formatter={(value) => [`${value?.toLocaleString()} MW`]}
          />
          <ReferenceLine x={0} y={0} stroke="#e5e7eb" />
          <Scatter name="Matched Delivery Hours" data={data} fillOpacity={0.70}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.forecast > entry.actual ? '#16a34a' : '#0284c7'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
