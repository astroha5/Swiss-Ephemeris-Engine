import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DateSelector = ({ 
  selectedDate, 
  onDateChange, 
  onQuickSelect, 
  selectedTime, 
  onTimeChange 
}) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isFuture = selectedDate > new Date();

  const quickButtons = [
    { label: 'Today', type: 'today', icon: 'Calendar' },
    { label: 'Previous Day', type: 'previousDay', icon: 'ArrowLeft' },
    { label: 'Next Day', type: 'nextDay', icon: 'ArrowRight' },
    { label: 'Next Week', type: 'nextWeek', icon: 'FastForward' },
    { label: 'Previous Week', type: 'prevWeek', icon: 'Rewind' }
  ];

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Date & Time</h3>
        {(isToday || isFuture) && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {isToday ? 'Live' : 'Future'}
          </span>
        )}
      </div>

      {/* Selected Date Display */}
      <div 
        className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-celestial"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text-primary">
              {formatDate(selectedDate)}
            </div>
            <div className="text-xs text-text-muted">
              Click to change date
            </div>
          </div>
          <Icon 
            name={showCalendar ? 'ChevronUp' : 'ChevronDown'} 
            size={16} 
            className="text-text-muted" 
          />
        </div>
      </div>

      {/* Calendar Picker */}
      {showCalendar && (
        <div className="bg-background border border-border rounded-lg p-3">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => {
              onDateChange(new Date(e.target.value));
              setShowCalendar(false);
            }}
            className="w-full p-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      )}

      {/* Time Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">
          Time
        </label>
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-full p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
        />
      </div>

      {/* Quick Navigation */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">
          Quick Navigation
        </label>
        <div className="grid grid-cols-1 gap-2">
          {quickButtons.map((button) => (
            <Button
              key={button.type}
              variant="ghost"
              size="sm"
              onClick={() => onQuickSelect(button.type)}
              iconName={button.icon}
              iconPosition="left"
              className="justify-start text-xs h-8"
              fullWidth
            >
              {button.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date Info */}
      <div className="pt-2 border-t border-border">
        <div className="text-xs text-text-muted space-y-1">
          <div className="flex justify-between">
            <span>Day of Year:</span>
            <span className="font-mono">
              {Math.floor((selectedDate - new Date(selectedDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Week Day:</span>
            <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;
