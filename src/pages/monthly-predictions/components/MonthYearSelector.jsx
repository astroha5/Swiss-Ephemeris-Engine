import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MonthYearSelector = ({ selectedMonth, selectedYear, onMonthChange, onYearChange }) => {
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleMonthSelect = (monthIndex) => {
    onMonthChange(monthIndex);
    setShowMonthDropdown(false);
  };

  const handleYearSelect = (year) => {
    onYearChange(year);
    setShowYearDropdown(false);
  };

  const navigateMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === 'prev') {
      newMonth = selectedMonth - 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = selectedYear - 1;
      }
    } else {
      newMonth = selectedMonth + 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear = selectedYear + 1;
      }
    }

    onMonthChange(newMonth);
    onYearChange(newYear);
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Previous Month Button */}
      <Button
        variant="ghost"
        onClick={() => navigateMonth('prev')}
        className="p-2"
        aria-label="Previous month"
      >
        <Icon name="ChevronLeft" size={20} />
      </Button>

      {/* Month Selector */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => {
            setShowMonthDropdown(!showMonthDropdown);
            setShowYearDropdown(false);
          }}
          className="min-w-[120px] justify-between"
        >
          <span>{months[selectedMonth]}</span>
          <Icon name="ChevronDown" size={16} />
        </Button>

        {showMonthDropdown && (
          <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-medium z-50 max-h-60 overflow-y-auto">
            {months.map((month, index) => (
              <button
                key={index}
                onClick={() => handleMonthSelect(index)}
                className={`w-full px-4 py-2 text-left hover:bg-primary/5 transition-colors ${
                  index === selectedMonth ? 'bg-primary/10 text-primary' : 'text-text-primary'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Year Selector */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => {
            setShowYearDropdown(!showYearDropdown);
            setShowMonthDropdown(false);
          }}
          className="min-w-[80px] justify-between"
        >
          <span>{selectedYear}</span>
          <Icon name="ChevronDown" size={16} />
        </Button>

        {showYearDropdown && (
          <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-medium z-50 max-h-60 overflow-y-auto">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className={`w-full px-4 py-2 text-left hover:bg-primary/5 transition-colors ${
                  year === selectedYear ? 'bg-primary/10 text-primary' : 'text-text-primary'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Next Month Button */}
      <Button
        variant="ghost"
        onClick={() => navigateMonth('next')}
        className="p-2"
        aria-label="Next month"
      >
        <Icon name="ChevronRight" size={20} />
      </Button>

      {/* Quick Select Buttons */}
      <div className="hidden sm:flex items-center space-x-2 ml-4">
        <Button
          variant="ghost"
          onClick={() => {
            const now = new Date();
            onMonthChange(now.getMonth());
            onYearChange(now.getFullYear());
          }}
          className="text-xs px-3 py-1"
        >
          Current
        </Button>
      </div>

      {/* Overlay to close dropdowns */}
      {(showMonthDropdown || showYearDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowMonthDropdown(false);
            setShowYearDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default MonthYearSelector;
