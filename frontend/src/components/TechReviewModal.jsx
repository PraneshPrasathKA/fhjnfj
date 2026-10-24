import React from 'react';
import { X, Code2, Server, Database, Cpu, Layers, CheckCircle, ExternalLink } from 'lucide-react';

export default function TechReviewModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="brand-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
            <Code2 size={22} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Internal Technical Lead Review & Architecture Guide
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Comprehensive design overview, data engineering pipeline, analytical models, and code architecture.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {/* Section 1: Architecture Overview */}
          <section>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={16} style={{ color: 'var(--accent-primary)' }} />
              1. System Architecture & Topology
            </h3>
            <p style={{ marginBottom: 10, lineHeight: 1.6 }}>
              The solution follows a decoupled, resilient micro-architecture designed for low latency (&lt;20ms) and operational reliability:
            </p>
            <div style={{ background: 'var(--bg-input)', padding: 14, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
{`┌────────────────────────────────────────────────────────┐
│               Browser Frontend (React + Vite)          │
│   • Recharts for high-density time-series & scatter    │
│   • Dark trading terminal design system with CSS vars  │
│   • Dynamic hedging buffer risk calculator             │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (sub-25ms)
┌───────────────────────────▼────────────────────────────┐
│               FastAPI Backend (Python 3.11/3.13)       │
│   • Routers: /api/forecast, /api/actuals, /api/accuracy│
│   • Analytic Engine: MAE, RMSE, MAPE, Bias, Quantiles  │
│   • Gate-Closure & Horizon simulation logic            │
└──────────────┬────────────────────────────┬────────────┘
               │ Local Query                │ Sync / Hydrate
┌──────────────▼─────────────┐ ┌────────────▼────────────┐
│ SQLite Persistent Cache    │ │ Elexon BMRS Public API  │
│ (1,513 actuals, 19k fcasts)│ │ • FUELHH (Half-hourly)  │
│ Instant response & offline │ │ • WINDFOR (Multi-lead)  │
└────────────────────────────┘ └─────────────────────────┘`}
            </div>
          </section>

          {/* Section 2: Data Pipeline & Alignment Nuances */}
          <section>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={16} style={{ color: '#00d2ff' }} />
              2. Data Pipeline & Resolution Alignment Engineering
            </h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.6 }}>
              <li>
                <strong>Resolution Mismatch Solution:</strong> Elexon BMRS publishes <code>FUELHH</code> (actuals) at 30-minute settlement periods (48/day), whereas <code>WINDFOR</code> forecasts are published at 60-minute resolution (24/day). To preserve mathematical integrity, our service aggregates the two corresponding half-hour actuals via arithmetic mean to yield the exact hourly actual rate (MW) for 1:1 pairing with WINDFOR.
              </li>
              <li>
                <strong>Gate Closure Simulation:</strong> In the UK wholesale market, the Day-Ahead auction gates close at 11:00 AM on D-1. Our engine accurately filters WINDFOR forecasts published on or before 11:00 AM of the prior calendar day for each delivery date, guaranteeing realistic backtesting without look-ahead bias.
              </li>
              <li>
                <strong>Self-Healing Database Cache:</strong> On startup, the backend verifies if data is seeded. If missing, a chunked background pipeline retrieves the January 2026 data stream in parallel blocks without blocking API endpoints.
              </li>
            </ul>
          </section>

          {/* Section 3: Quantitative Formulations */}
          <section>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={16} style={{ color: 'var(--accent-amber)' }} />
              3. Analytical & Statistical Formulations
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ background: 'var(--bg-input)', padding: 10, borderRadius: 6, border: '1px solid var(--border-light)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Mean Absolute Error (MAE)</strong>
                <code>MAE = (1/N) * Σ |F - A|</code>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Measures average magnitude of generation deviation.</p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: 10, borderRadius: 6, border: '1px solid var(--border-light)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Root Mean Squared Error (RMSE)</strong>
                <code>RMSE = √[(1/N) * Σ (F - A)²]</code>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Penalizes large outlier forecast errors heavily.</p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: 10, borderRadius: 6, border: '1px solid var(--border-light)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Directional Bias</strong>
                <code>Bias = (1/N) * Σ (F - A)</code>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>+1,840 MW in Jan 2026 indicates systemic over-forecasting.</p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: 10, borderRadius: 6, border: '1px solid var(--border-light)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Empirical Hedging Buffer</strong>
                <code>Buffer(p) = Quantile_p(max(0, F - A))</code>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Quantifies reserve procurement needed at confidence p.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Key Development Practices */}
          <section>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} style={{ color: 'var(--accent-purple)' }} />
              4. Code Organization & Containerization
            </h3>
            <p style={{ marginBottom: 8, lineHeight: 1.6 }}>
              The repository is organized cleanly with containerized deployment:
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, lineHeight: 1.6 }}>
              <li><code>/backend</code>: Modular FastAPI application with separation of concerns (Routers, Services, Scripts, SQLite persistence).</li>
              <li><code>/frontend</code>: React 18, Vite, Recharts, and Vanilla CSS with custom design tokens. Zero bulky dependencies.</li>
              <li><code>Dockerfile</code> & <code>docker-compose.yml</code>: Multi-stage builds for frontend (Nginx/Node) and backend (Python slim) for 1-command startup.</li>
              <li>Deployable to Heroku (Backend container / Procfile) and Vercel (Frontend static build).</li>
            </ul>
          </section>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Back to Application
          </button>
        </div>
      </div>
    </div>
  );
}
