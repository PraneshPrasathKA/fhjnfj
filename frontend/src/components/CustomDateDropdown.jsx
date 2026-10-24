import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CustomDateDropdown({
  value = '2026-01-15',
  onChange,
  options = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse initial year & month from value (YYYY-MM-DD)
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(0); // 0 = Jan

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setViewYear(Number(parts[0]));
        setViewMonth(Number(parts[1]) - 1);
      }
    }
  }, [value]);

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

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate days in current month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const calendarDays = [];
  // Leading empty blanks for day-of-week alignment
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
    calendarDays.push({
      day,
      dateStr,
      hasData: options.length === 0 || options.includes(dateStr),
      isSelected: dateStr === value
    });
  }

  // Format trigger label
  const formatTriggerDate = (dStr) => {
    if (!dStr) return 'Select Date';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dStr;
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
        <CalendarIcon size={15} className="custom-dropdown-icon" />
        <span className="custom-dropdown-label">{formatTriggerDate(value)}</span>
        <span className="custom-dropdown-subtext">({value})</span>
        <ChevronDown size={14} className={`custom-dropdown-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {/* Interactive Calendar Popover */}
      {isOpen && (
        <div className="calendar-popover" role="dialog">
          {/* Calendar Header with Month Navigation */}
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="calendar-title">
              <span className="calendar-month">{MONTH_NAMES[viewMonth]}</span>
              <span className="calendar-year">{viewYear}</span>
            </div>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Column Headers */}
          <div className="calendar-weekdays">
            {DAYS_OF_WEEK.map((dw) => (
              <span key={dw} className="calendar-weekday">{dw}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-grid">
            {calendarDays.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="calendar-day-empty" />;
              }

              return (
                <button
                  type="button"
                  key={item.dateStr}
                  disabled={!item.hasData}
                  className={`calendar-day-btn ${item.isSelected ? 'selected' : ''} ${item.hasData ? 'available' : 'disabled'}`}
                  onClick={() => {
                    if (item.hasData) {
                      onChange(item.dateStr);
                      setIsOpen(false);
                    }
                  }}
                  title={item.hasData ? `Select ${item.dateStr}` : `No data for ${item.dateStr}`}
                >
                  <span className="calendar-day-number">{item.day}</span>
                  {item.hasData && !item.isSelected && (
                    <span className="calendar-day-dot" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer with Quick Jump */}
          <div className="calendar-footer">
            <span className="calendar-footer-info">
              Selected: <strong>{value}</strong>
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {options.includes('2026-01-15') && (
                <button
                  type="button"
                  className="calendar-quick-btn"
                  onClick={() => {
                    onChange('2026-01-15');
                    setViewYear(2026);
                    setViewMonth(0);
                    setIsOpen(false);
                  }}
                >
                  Jan 15 (Mid)
                </button>
              )}
              {options.length > 0 && (
                <button
                  type="button"
                  className="calendar-quick-btn active"
                  onClick={() => {
                    onChange(options[0]);
                    setIsOpen(false);
                  }}
                >
                  Latest
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
