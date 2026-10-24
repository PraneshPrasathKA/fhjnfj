import React from 'react';
import { 
  Wind, 
  LayoutDashboard, 
  TrendingUp, 
  ShieldCheck, 
  Code2, 
  Database,
  Radio
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
        <div className="brand-icon">
          <Wind size={22} />
        </div>
        <div className="brand-text">
          <h1>AuraWind Intelligence</h1>
          <p>UK Wholesale Day-Ahead Procurement Desk</p>
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
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="nav-actions">
        <div className="status-badge" title="Connected to Elexon BMRS Datasets (FUELHH & WINDFOR)">
          <div className="status-dot"></div>
          <span>BMRS Live</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>Jan 2026</span>
        </div>

        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenTechReview}
          title="Review Software Design, Data Pipeline & Architecture"
        >
          <Code2 size={15} />
          <span>Tech Review</span>
        </button>
      </div>
    </header>
  );
}
