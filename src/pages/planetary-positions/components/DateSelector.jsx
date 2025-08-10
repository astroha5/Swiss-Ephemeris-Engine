import React, { useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DateSelector = ({
  selectedDate,
  onDateChange,
  onQuickSelect,
  selectedTime,
  onTimeChange,
  timezoneLabel
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

  const systemTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (_) {
      return 'Local';
    }
  }, []);

  const tzDisplay = timezoneLabel || systemTimezone;

  const getOffsetMinutesForTimeZone = (date, timeZone) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).formatToParts(date);
      const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
      const asUTC = Date.UTC(
        parseInt(map.year, 10),
        parseInt(map.month, 10) - 1,
        parseInt(map.day, 10),
        parseInt(map.hour, 10),
        parseInt(map.minute, 10),
        parseInt(map.second, 10)
      );
      return Math.round((asUTC - date.getTime()) / 60000);
    } catch (e) {
      // Fallback to local offset
      return -date.getTimezoneOffset();
    }
  };

  const utcOffsetString = useMemo(() => {
    const mins = getOffsetMinutesForTimeZone(selectedDate, tzDisplay);
    const sign = mins >= 0 ? '+' : '-';
    const abs = Math.abs(mins);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `UTC${sign}${hh}:${mm}`;
  }, [selectedDate, tzDisplay]);

  const isoWeekNumber = useMemo(() => {
    const d = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));
    // Thursday in current week decides the year.
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }, [selectedDate]);

  const stepDateByDays = (days) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    onDateChange(next);
  };

  const setToNow = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    onDateChange(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    onTimeChange(`${hours}:${minutes}`);
  };

  const adjustTimeByMinutes = (deltaMinutes) => {
    if (!selectedTime) return;
    const [hh, mm] = selectedTime.split(':').map((n) => parseInt(n, 10));
    const total = hh * 60 + mm + deltaMinutes;
    // compute day overflow and wrap minutes into [0, 1439]
    let wrapped = ((total % 1440) + 1440) % 1440;
    const dayDelta = Math.floor((total - wrapped) / 1440);
    const newHours = String(Math.floor(wrapped / 60)).padStart(2, '0');
    const newMinutes = String(wrapped % 60).padStart(2, '0');
    if (dayDelta !== 0) {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + dayDelta);
      onDateChange(next);
    }
    onTimeChange(`${newHours}:${newMinutes}`);
  };

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
        <div className="flex items-center gap-2">
          {(isToday || isFuture) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {isToday ? 'Live' : 'Future'}
            </span>
          )}
          <span className="hidden sm:inline text-[11px] text-text-muted font-mono">
            {tzDisplay} · {utcOffsetString}
          </span>
        </div>
      </div>

      {/* Selected Date Display */}
      <div className="bg-background border border-border rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Previous day"
              onClick={() => stepDateByDays(-1)}
              iconName="ChevronLeft"
              className="h-8 w-8 p-0"
            />
            <div
              className="cursor-pointer hover:border-primary/30 transition-celestial px-2 py-1 rounded-md flex-1 min-w-0"
              onClick={() => setShowCalendar(!showCalendar)}
              aria-label="Open date picker"
            >
              <div className="text-sm font-medium text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{formatDate(selectedDate)}</div>
              <div className="text-[11px] text-text-muted whitespace-nowrap">Click to change date</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Next day"
              onClick={() => stepDateByDays(1)}
              iconName="ChevronRight"
              className="h-8 w-8 p-0"
            />
          </div>
          <Icon name={showCalendar ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-text-muted" />
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
      <div className="space-y-3">
        <label className="block text-xs font-medium text-text-secondary">Time</label>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <input
              type="time"
              step={60}
              aria-label="Select time"
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="flex-1 p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={setToNow}
              iconName="Clock"
              className="h-8 text-xs whitespace-nowrap"
              aria-label="Set to current date and time"
            >
              Now
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['00:00', '06:00', '12:00', '18:00'].map((t) => (
              <Button
                key={t}
                variant="ghost"
                size="sm"
                className="text-[11px] h-7"
                onClick={() => onTimeChange(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => adjustTimeByMinutes(-60)}>
              −1h
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => adjustTimeByMinutes(-15)}>
              −15m
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => adjustTimeByMinutes(15)}>
              +15m
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => adjustTimeByMinutes(60)}>
              +1h
            </Button>
          </div>
        </div>
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
            <span>ISO Week:</span>
            <span className="font-mono">{isoWeekNumber}</span>
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
