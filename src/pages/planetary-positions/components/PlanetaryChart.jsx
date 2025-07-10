import React, { useState, useEffect } from 'react';
import NorthIndianChart from '../../../components/charts/NorthIndianChart';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PlanetaryChart = ({ chartData, selectedDate, location }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [previousData, setPreviousData] = useState(null);

  // Trigger animation when data changes
  useEffect(() => {
    if (previousData && chartData) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
    setPreviousData(chartData);
  }, [chartData]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date, time) => {
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    
    return dateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isFuture = selectedDate > new Date();

  return (
    <div className="bg-surface border border-border rounded-xl shadow-strong overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="Globe" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                Planetary Chart
              </h2>
              <p className="text-sm text-text-secondary">
                North Indian style birth chart visualization
              </p>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            {isToday && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                <Icon name="Radio" size={12} className="mr-1 animate-pulse" />
                Live
              </span>
            )}
            {isFuture && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                <Icon name="Clock" size={12} className="mr-1" />
                Future
              </span>
            )}
            {showAnimation && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Icon name="RotateCw" size={12} className="mr-1 animate-spin" />
                Updating
              </span>
            )}
          </div>
        </div>

        {/* Date & Location Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-text-muted" />
            <div>
              <div className="font-medium text-text-primary">
                {formatDate(selectedDate)}
              </div>
              <div className="text-text-muted">
                {formatTime(selectedDate, '12:00')} {location?.timezone?.split('/')[1]?.replace('_', ' ')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Icon name="MapPin" size={16} className="text-text-muted" />
            <div>
              <div className="font-medium text-text-primary">
                {location?.city || 'Unknown Location'}
              </div>
              <div className="text-text-muted">
                {location?.country} • {location?.latitude?.toFixed(2)}°, {location?.longitude?.toFixed(2)}°
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className={`transition-all duration-500 ${showAnimation ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        {chartData && chartData.charts && chartData.charts.lagna ? (
          <div className="p-6">
            <NorthIndianChart
              chartData={chartData.charts.lagna}
              title={`Planetary Positions - ${formatDate(selectedDate)}`}
              className="max-w-none"
            />
          </div>
        ) : (
          <div className="p-12 text-center">
            <Icon name="Loader2" size={48} className="text-text-muted mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Loading Chart Data
            </h3>
            <p className="text-text-secondary">
              Calculating planetary positions for the selected date and location...
            </p>
          </div>
        )}
      </div>

      {/* Chart Controls */}
      <div className="border-t border-border bg-surface-secondary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-text-muted">
            <div className="flex items-center space-x-1">
              <Icon name="Info" size={14} />
              <span>Chart shows exact planetary positions</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              iconName="Download"
              iconPosition="left"
              className="text-xs"
            >
              Export Chart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="Share2"
              iconPosition="left"
              className="text-xs"
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanetaryChart;
