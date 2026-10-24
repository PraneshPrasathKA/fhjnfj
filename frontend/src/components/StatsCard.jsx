import React from 'react';

export default function StatsCard({ 
  label, 
  value, 
  unit = '', 
  icon: Icon, 
  badgeText = null, 
  badgeType = 'positive', 
  subtext = null,
  highlight = false 
}) {
  return (
    <div className={`stat-card ${highlight ? 'highlight-glow' : ''}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={18} className="stat-icon" />}
      </div>
      
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>

      <div className="stat-footer">
        {badgeText && (
          <span className={`badge badge-${badgeType}`}>
            {badgeText}
          </span>
        )}
        {subtext && <span>{subtext}</span>}
      </div>
    </div>
  );
}
