import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export default function CustomTimeDropdown({
  value = '',
  onChange,
  options = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const hourString = value ? value.slice(11, 13) : '12';
  const timeDisplay = `${hourString}:00 UTC`;

  const handleSelectHour = (hrStr) => {
    // Keep date prefix from value or fallback to 2026-01-15
    const datePrefix = value && value.includes('T') ? value.split('T')[0] : '2026-01-15';
    const newTarget = `${datePrefix}T${hrStr}:00:00Z`;
    onChange(newTarget);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Clock size={15} className="custom-dropdown-icon" />
        <span className="digital-time-trigger-val">{timeDisplay}</span>
        <ChevronDown size={14} className={`custom-dropdown-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {/* Simple Digital Time Popover */}
      {isOpen && (
        <div className="simple-clock-popover" role="dialog">
          {/* Digital Time Header */}
          <div className="simple-clock-header">
            <span className="simple-clock-title">Select Delivery Slot</span>
            <span className="simple-clock-current">{timeDisplay}</span>
          </div>

          {/* Clean 4-Column Grid of 24 Hours */}
          <div className="simple-clock-grid">
            {HOURS.map((hr) => {
              const isSelected = hr === hourString;
              return (
                <button
                  type="button"
                  key={hr}
                  className={`simple-clock-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectHour(hr)}
                >
                  {hr}:00
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
