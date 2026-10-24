import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Zap, ArrowRight, DollarSign, HelpCircle, Activity } from 'lucide-react';
import { fetchHedgingRecommendation } from '../api/client';

export default function HedgingCalculator({ defaultConfidence = 90 }) {
  const [confidence, setConfidence] = useState(defaultConfidence);
  const [horizonMode, setHorizonMode] = useState('day_ahead');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRec() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchHedgingRecommendation(confidence, '2026-01-01', '2026-01-31', horizonMode);
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRec();
  }, [confidence, horizonMode]);

  return (
    <div className="card" style={{ border: '1px solid var(--border-accent)', background: 'radial-gradient(circle at 10% 20%, rgba(20, 137, 55, 0.08), transparent 40%), var(--bg-card)' }}>
      <div className="card-header">
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-primary-light)' }}>
            Quantitative Risk Modeling • BSC Rules
          </div>
          <div className="card-title">
            <ShieldCheck size={18} />
            <span>Trader Downside Hedging & Buffer Recommendation</span>
          </div>
          <div className="card-subtitle">
            Statistically quantify thermal and balancing procurement buffer to hedge wind forecast shortfalls.
          </div>
        </div>

        <div className="toggle-group">
          <button 
            className={`toggle-btn ${horizonMode === 'day_ahead' ? 'active' : ''}`}
            onClick={() => setHorizonMode('day_ahead')}
          >
            Day-Ahead Auction (D-1)
          </button>
          <button 
            className={`toggle-btn ${horizonMode === 'latest' ? 'active' : ''}`}
            onClick={() => setHorizonMode('latest')}
          >
            Intraday Gate Closure
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 24, marginTop: 12 }}>
        {/* Left: Interactive Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Shortfall Protection Confidence:
              </label>
              <span className="badge badge-positive" style={{ fontSize: '0.88rem', padding: '4px 10px' }}>
                {confidence}% Confidence
              </span>
            </div>

            <input 
              type="range" 
              min="70" 
              max="99" 
              step="1"
              value={confidence} 
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="custom-range"
              style={{ width: '100%' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>70% (Aggressive)</span>
              <span>85% (Utility Std)</span>
              <span>90% (Recommended)</span>
              <span>99% (Strict Shield)</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-amber)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
              <AlertTriangle size={15} />
              <span>Why This Matters for GB Energy Trading:</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Under the UK BSC (Balancing and Settlement Code), if actual wind delivery falls short of your day-ahead position, your utility is exposed to the System Buy Price (SBP / cashout imbalance penalties). By adding this empirical buffer to your thermal/storage order book, you protect margins against weather volatility.
            </p>
          </div>
        </div>

        {/* Right: Calculated Recommendation */}
        <div style={{ 
          background: 'rgba(20, 137, 55, 0.05)', 
          border: '1px solid var(--border-accent)', 
          borderRadius: 'var(--radius-md)', 
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Computing empirical quantiles...</div>
          ) : result ? (
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                Recommended Thermal/Reserve Buffer
              </div>
              <div style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '2.5rem', 
                fontWeight: 800, 
                color: 'var(--accent-primary-light)',
                letterSpacing: '-0.03em',
                margin: '6px 0 10px 0',
                display: 'flex',
                alignItems: 'baseline',
                gap: 8
              }}>
                +{result.recommendedBufferMW.toLocaleString()} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>MW / hr</span>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                {result.explanation}
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 12, 
                paddingTop: 12, 
                borderTop: '1px solid var(--border-light)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <div>
                  Evaluated Hours: <strong style={{ color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>{result.sampleSize}</strong>
                </div>
                <div>
                  Auction Model: <strong style={{ color: 'var(--text-heading)' }}>{horizonMode === 'day_ahead' ? 'Day-Ahead D-1' : 'Intraday'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--accent-red)' }}>{error || 'Unable to load recommendation'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
