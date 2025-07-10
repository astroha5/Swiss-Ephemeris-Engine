import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const TimeZoneWidget = ({ location }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date, timezone) => {
    try {
      return date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
  };

  const formatDate = (date, timezone) => {
    try {
      return date.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getTimezoneAbbreviation = (timezone) => {
    const parts = timezone.split('/');
    if (parts.length > 1) {
      return parts[1].replace('_', ' ');
    }
    return timezone;
  };

  if (!location) return null;

  return (
    <div className="hidden md:fixed md:top-20 md:right-4 md:z-40 md:block bg-surface/95 backdrop-blur-sm border border-border rounded-lg shadow-strong p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon name="Globe" size={14} className="text-primary" />
          <span className="text-xs font-medium text-text-primary">Live Time</span>
        </div>
        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
      </div>
      
      <div className="space-y-1">
        {/* Current Time */}
        <div className="text-lg font-mono font-bold text-text-primary">
          {formatTime(currentTime, location.timezone)}
        </div>
        
        {/* Date */}
        <div className="text-xs text-text-secondary">
          {formatDate(currentTime, location.timezone)}
        </div>
        
        {/* Location */}
        <div className="flex items-center space-x-1 text-xs text-text-muted">
          <Icon name="MapPin" size={10} />
          <span className="truncate">{location.city}</span>
        </div>
        
        {/* Timezone */}
        <div className="text-xs text-text-muted font-mono">
          {getTimezoneAbbreviation(location.timezone)}
        </div>
      </div>
    </div>
  );
};

export default TimeZoneWidget;
