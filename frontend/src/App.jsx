import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TechReviewModal from './components/TechReviewModal';
import Dashboard from './pages/Dashboard';
import ForecastView from './pages/ForecastView';
import AccuracyView from './pages/AccuracyView';
import HedgingCalculator from './components/HedgingCalculator';
import { fetchAvailableDates, fetchSystemStatus } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [availableDates, setAvailableDates] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isTechReviewOpen, setIsTechReviewOpen] = useState(false);

  useEffect(() => {
    async function initApp() {
      try {
        const datesRes = await fetchAvailableDates();
        if (datesRes && datesRes.dates && datesRes.dates.length > 0) {
          setAvailableDates(datesRes.dates);
          // Set to Jan 15 or first available
          if (datesRes.dates.includes('2026-01-15')) {
            setSelectedDate('2026-01-15');
          } else {
            setSelectedDate(datesRes.dates[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load dates from API, using fallback range:', err);
        const fallback = Array.from({ length: 31 }, (_, i) => {
          const day = String(i + 1).padStart(2, '0');
          return `2026-01-${day}`;
        });
        setAvailableDates(fallback);
      }

      try {
        const statusRes = await fetchSystemStatus();
        setSystemStatus(statusRes);
      } catch (e) {
        console.warn('System status not reached:', e);
      }
    }

    initApp();
  }, []);

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenTechReview={() => setIsTechReviewOpen(true)}
        systemStatus={systemStatus}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            availableDates={availableDates}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastView 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            availableDates={availableDates}
          />
        )}

        {activeTab === 'accuracy' && (
          <AccuracyView 
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'hedging' && (
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <HedgingCalculator defaultConfidence={90} />
          </div>
        )}
      </main>

      <footer style={{ 
        borderTop: '1px solid var(--border-hairline)', 
        padding: '14px 28px', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'var(--bg-secondary)'
      }}>
        <div>
          <span>AuraWind Intelligence v1.0 • UK Day-Ahead Procurement Desk</span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>Data: Elexon BMRS (FUELHH & WINDFOR)</span>
        </div>

        <div>
          <span>Built by <strong>Pranesh Prasath K A</strong></span>
        </div>
      </footer>

      <TechReviewModal 
        isOpen={isTechReviewOpen} 
        onClose={() => setIsTechReviewOpen(false)} 
      />
    </div>
  );
}
