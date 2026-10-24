import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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

export function HorizonChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No horizon data.</div>;
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          <XAxis 
            dataKey="bin" 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11 }} 
            interval={0}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            unit=" MW" 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f1626', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
            formatter={(value) => [`${value} MW`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 10 }} />
          <Bar dataKey="mae" name="Mean Absolute Error (MAE)" fill="#00e5a3" radius={[4, 4, 0, 0]} />
          <Bar dataKey="rmse" name="Root Mean Square Error (RMSE)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DiurnalChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No diurnal data.</div>;
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          <XAxis 
            dataKey="hourLabel" 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
            unit=" MW" 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f1626', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
            formatter={(value) => [`${value} MW`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 10 }} />
          <Line type="monotone" dataKey="mae" name="MAE (MW)" stroke="#00e5a3" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="rmse" name="RMSE (MW)" stroke="#00d2ff" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="bias" name="Bias (F - A)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No daily data.</div>;
  }

  const chartData = data.map((d) => ({
    ...d,
    dayLabel: d.date.slice(8, 10) + ' Jan'
  }));

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          <XAxis 
            dataKey="dayLabel" 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            interval={2} 
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
            unit=" MW" 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f1626', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
            formatter={(value) => [`${value} MW`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 10 }} />
          <Bar dataKey="mae" name="Daily MAE" fill="#00e5a3" radius={[3, 3, 0, 0]} />
          <Bar dataKey="maxError" name="Daily Max Error Spike" fill="#ef4444" opacity={0.7} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScatterAccuracyPlot({ data = [] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No scatter data.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
          <XAxis 
            type="number" 
            dataKey="actual" 
            name="Actual Generation" 
            unit=" MW"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
            label={{ value: 'Actual Generation (FUELHH, MW) →', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis 
            type="number" 
            dataKey="forecast" 
            name="Forecast Generation" 
            unit=" MW"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
            label={{ value: 'Forecasted (WINDFOR, MW) →', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#0f1626', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
            formatter={(value, name) => [`${value} MW`, name]}
          />
          <ReferenceLine 
            segment={[{ x: 0, y: 0 }, { x: 20000, y: 20000 }]} 
            stroke="#94a3b8" 
            strokeDasharray="4 4" 
            label={{ value: '1:1 Parity Line', fill: '#94a3b8', fontSize: 10, position: 'insideTopLeft' }}
          />
          <Scatter 
            name="Delivery Hours" 
            data={data} 
            fill="#00e5a3" 
            opacity={0.6}
            shape="circle" 
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
