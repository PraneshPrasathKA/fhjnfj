import React from 'react';
import { 
  Wind, 
  LayoutDashboard, 
  TrendingUp, 
  ShieldCheck, 
  Code2, 
  Activity,
  Layers
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenTechReview, systemStatus }) {
  const tabs = [
    { id: 'dashboard', label: 'Trading Cockpit', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast Explorer', icon: Wind },
    { id: 'accuracy', label: 'Accuracy Analytics', icon: TrendingUp },
    { id: 'hedging', label: 'Hedging Calculator', icon: ShieldCheck },
  ];

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab('dashboard')}>
        <Wind size={28} style={{ color: 'var(--accent-primary-light)', flexShrink: 0 }} />
        <div className="brand-text">
          <h1>
            AuraWind <span className="brand-accent">Intelligence</span>
          </h1>
          <p>UK Wholesale Day-Ahead Decision Platform • GridBricks Powered</p>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Main Navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="nav-actions">
        <div className="status-badge" title="Live streaming from Elexon BMRS Datasets (FUELHH & WINDFOR)">
          <div className="status-dot"></div>
          <span style={{ fontWeight: 600 }}>BMRS STREAM</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>JAN 2026</span>
        </div>

        <button 
          className="btn btn-primary btn-sm"
          onClick={onOpenTechReview}
          title="Review Software Design, Data Pipeline & Architecture"
        >
          <Code2 size={14} />
          <span>Tech Review</span>
        </button>
      </div>
    </header>
  );
}
