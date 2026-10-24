import React from 'react';

const ICON_COLORS = {
  positive: '#16a34a',
  warning: '#d97706',
  info:    '#0284c7',
  default: '#7c3aed',
};

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
  const iconColor = ICON_COLORS[badgeType] || ICON_COLORS.default;

  return (
    <div className={`stat-card ${highlight ? 'highlight-glow' : ''}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <Icon
            size={16}
            className="stat-icon"
            style={{ color: iconColor, opacity: 0.85 }}
          />
        )}
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
        {subtext && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{subtext}</span>}
      </div>
    </div>
  );
}
