import React from 'react';
import { X, Code2, Server, Database, Cpu, Layers, CheckCircle, ExternalLink } from 'lucide-react';

export default function TechReviewModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}
        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >

        <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingRight: 4,
          scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="brand-icon" style={{ background: 'rgba(20, 137, 55, 0.15)', borderColor: 'rgba(20, 137, 55, 0.4)' }}>
            <Code2 size={22} style={{ color: 'var(--accent-primary-light)' }} />
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
            <div className="arch-diagram-container">
              {/* Layer 1: Frontend */}
              <div className="arch-box arch-box-frontend">
                <div className="arch-box-header">
                  <strong className="arch-title">Browser Frontend (React 18 + Vite)</strong>
                  <span className="arch-badge">Client Layer</span>
                </div>
                <ul className="arch-list">
                  <li>Recharts for high-density time-series, distribution & scatter telemetry</li>
                  <li>Responsive trading terminal design system with CSS custom tokens</li>
                  <li>Dynamic hedging buffer & downside shortfall risk calculator</li>
                </ul>
              </div>

              {/* Connector: REST */}
              <div className="arch-connector">
                <span className="arch-connector-label">REST / JSON (sub-25ms)</span>
                <div className="arch-arrow-down">▼</div>
              </div>

              {/* Layer 2: Backend */}
              <div className="arch-box arch-box-backend">
                <div className="arch-box-header">
                  <strong className="arch-title">FastAPI Backend (Python 3.11 / 3.13)</strong>
                  <span className="arch-badge arch-badge-backend">Service Layer</span>
                </div>
                <ul className="arch-list">
                  <li>Routers: <code>/api/forecast</code>, <code>/api/actuals</code>, <code>/api/accuracy</code>, <code>/api/hedging</code></li>
                  <li>Analytic Engine: MAE, RMSE, MAPE, Directional Bias, Empirical Quantiles</li>
                  <li>Gate-Closure (11:00 D-1) & Horizon multi-publish backtesting logic</li>
                </ul>
              </div>

              {/* Connector: Split Down */}
              <div className="arch-split-connectors">
                <div className="arch-connector-half">
                  <span className="arch-connector-label">Local Query</span>
                  <div className="arch-arrow-down">▼</div>
                </div>
                <div className="arch-connector-half">
                  <span className="arch-connector-label">Sync / Hydrate</span>
                  <div className="arch-arrow-down">▼</div>
                </div>
              </div>

              {/* Layer 3: Persistence & Upstream API */}
              <div className="arch-bottom-row">
                <div className="arch-box arch-box-db">
                  <div className="arch-box-header">
                    <strong className="arch-title">SQLite Persistent Cache</strong>
                    <span className="arch-badge arch-badge-db">Storage</span>
                  </div>
                  <ul className="arch-list">
                    <li>1,513 actuals, 19k forecast revisions</li>
                    <li>Instant sub-millisecond local response & offline mode</li>
                  </ul>
                </div>

                <div className="arch-box arch-box-api">
                  <div className="arch-box-header">
                    <strong className="arch-title">Elexon BMRS Public API</strong>
                    <span className="arch-badge arch-badge-api">Upstream</span>
                  </div>
                  <ul className="arch-list">
                    <li><code>FUELHH</code> (30-min settlement actuals)</li>
                    <li><code>WINDFOR</code> (Multi-publish national wind forecasts)</li>
                  </ul>
                </div>
              </div>
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

        </div>{/* end scrollable */}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-primary" onClick={onClose}>
            Back to Application
          </button>
        </div>
      </div>
    </div>
  );
}
