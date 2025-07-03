import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const VimshottariDashaTable = ({ dashaData }) => {
  const [expandedPeriod, setExpandedPeriod] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'table'

  // Mock Vimshottari Dasha data
  const mockDashaData = {
    currentMahadasha: {
      planet: 'Jupiter',
      symbol: '♃',
      startDate: '2020-03-15',
      endDate: '2036-03-15',
      totalYears: 16,
      remainingYears: 12.2,
      isActive: true
    },
    currentAntardasha: {
      planet: 'Saturn',
      symbol: '♄',
      startDate: '2023-07-20',
      endDate: '2026-01-08',
      totalMonths: 30,
      remainingMonths: 14.5,
      isActive: true
    },
    dashaSequence: [
      {
        planet: 'Mars',
        symbol: '♂',
        startDate: '2010-03-15',
        endDate: '2017-03-15',
        years: 7,
        status: 'completed',
        subPeriods: [
          { planet: 'Mars', duration: '4m 27d', startDate: '2010-03-15', endDate: '2010-08-11' },
          { planet: 'Rahu', duration: '11m 27d', startDate: '2010-08-11', endDate: '2011-08-08' },
          { planet: 'Jupiter', duration: '10m 21d', startDate: '2011-08-08', endDate: '2012-06-29' }
        ]
      },
      {
        planet: 'Rahu',
        symbol: '☊',
        startDate: '2017-03-15',
        endDate: '2035-03-15',
        years: 18,
        status: 'completed',
        subPeriods: [
          { planet: 'Rahu', duration: '2y 8m 12d', startDate: '2017-03-15', endDate: '2019-11-27' },
          { planet: 'Jupiter', duration: '2y 4m 24d', startDate: '2019-11-27', endDate: '2022-04-21' }
        ]
      },
      {
        planet: 'Jupiter',
        symbol: '♃',
        startDate: '2020-03-15',
        endDate: '2036-03-15',
        years: 16,
        status: 'current',
        subPeriods: [
          { planet: 'Jupiter', duration: '2y 1m 18d', startDate: '2020-03-15', endDate: '2022-05-03', status: 'completed' },
          { planet: 'Saturn', duration: '2y 5m 18d', startDate: '2022-05-03', endDate: '2024-10-21', status: 'current' },
          { planet: 'Mercury', duration: '2y 1m 6d', startDate: '2024-10-21', endDate: '2026-11-27', status: 'upcoming' },
          { planet: 'Ketu', duration: '11m 6d', startDate: '2026-11-27', endDate: '2027-11-03', status: 'upcoming' }
        ]
      },
      {
        planet: 'Saturn',
        symbol: '♄',
        startDate: '2036-03-15',
        endDate: '2055-03-15',
        years: 19,
        status: 'upcoming',
        subPeriods: []
      },
      {
        planet: 'Mercury',
        symbol: '☿',
        startDate: '2055-03-15',
        endDate: '2072-03-15',
        years: 17,
        status: 'upcoming',
        subPeriods: []
      }
    ]
  };

  const data = dashaData || mockDashaData;

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success/20 text-success';
      case 'upcoming': return 'bg-secondary/20 text-secondary';
      default: return 'bg-surface-secondary text-text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'current': return 'Play';
      case 'completed': return 'Check';
      case 'upcoming': return 'Clock';
      default: return 'Circle';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleExpanded = (index) => {
    setExpandedPeriod(expandedPeriod === index ? null : index);
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-semibold text-text-primary">
          Vimshottari Dasha
        </h3>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex bg-surface-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-celestial ${
                viewMode === 'timeline' ?'bg-primary text-primary-foreground' :'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon name="Timeline" size={16} className="inline mr-1" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-celestial ${
                viewMode === 'table' ?'bg-primary text-primary-foreground' :'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon name="Table" size={16} className="inline mr-1" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Current Period Highlight */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-heading font-semibold text-primary mb-2">Current Mahadasha</h4>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{data.currentMahadasha.symbol}</span>
              <div>
                <div className="font-medium text-text-primary">{data.currentMahadasha.planet}</div>
                <div className="text-sm text-text-secondary">
                  {formatDate(data.currentMahadasha.startDate)} - {formatDate(data.currentMahadasha.endDate)}
                </div>
                <div className="text-sm text-primary font-medium">
                  {data.currentMahadasha.remainingYears} years remaining
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-primary mb-2">Current Antardasha</h4>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{data.currentAntardasha.symbol}</span>
              <div>
                <div className="font-medium text-text-primary">{data.currentAntardasha.planet}</div>
                <div className="text-sm text-text-secondary">
                  {formatDate(data.currentAntardasha.startDate)} - {formatDate(data.currentAntardasha.endDate)}
                </div>
                <div className="text-sm text-primary font-medium">
                  {data.currentAntardasha.remainingMonths} months remaining
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {data.dashaSequence.map((period, index) => (
            <div key={period.planet} className="relative">
              {/* Timeline Line */}
              {index < data.dashaSequence.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-border-light"></div>
              )}
              
              <div className={`
                rounded-lg border transition-celestial cursor-pointer
                ${period.status === 'current' ?'border-primary bg-primary/5' :'border-border-light bg-surface-secondary hover:border-primary/40'
                }
              `}>
                <div 
                  className="p-4"
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="flex items-center space-x-4">
                    {/* Status Indicator */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${getStatusColor(period.status)}
                    `}>
                      <Icon name={getStatusIcon(period.status)} size={20} />
                    </div>
                    
                    {/* Period Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xl">{period.symbol}</span>
                        <h4 className="font-heading font-semibold text-text-primary">
                          {period.planet} Mahadasha
                        </h4>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${getStatusColor(period.status)}
                        `}>
                          {period.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-text-secondary">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)} ({period.years} years)
                      </div>
                    </div>
                    
                    {/* Expand Icon */}
                    {period.subPeriods.length > 0 && (
                      <Icon 
                        name={expandedPeriod === index ? 'ChevronUp' : 'ChevronDown'} 
                        size={20} 
                        className="text-text-muted"
                      />
                    )}
                  </div>
                </div>
                
                {/* Sub-periods */}
                {expandedPeriod === index && period.subPeriods.length > 0 && (
                  <div className="border-t border-border-light p-4 bg-surface">
                    <h5 className="font-heading font-medium text-text-primary mb-3">
                      Antardasha Periods
                    </h5>
                    <div className="space-y-2">
                      {period.subPeriods.map((subPeriod, subIndex) => (
                        <div 
                          key={subIndex}
                          className={`
                            flex items-center justify-between p-3 rounded-md
                            ${subPeriod.status === 'current' ?'bg-primary/10 border border-primary/20' :'bg-surface-secondary'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-text-primary">
                              {subPeriod.planet}
                            </span>
                            {subPeriod.status === 'current' && (
                              <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {subPeriod.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-3 px-2 font-heading font-semibold text-text-primary">Planet</th>
                <th className="text-left py-3 px-2 font-heading font-semibold text-text-primary">Start Date</th>
                <th className="text-left py-3 px-2 font-heading font-semibold text-text-primary">End Date</th>
                <th className="text-left py-3 px-2 font-heading font-semibold text-text-primary">Duration</th>
                <th className="text-left py-3 px-2 font-heading font-semibold text-text-primary">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.dashaSequence.map((period, index) => (
                <tr 
                  key={period.planet}
                  className={`
                    border-b border-border-light transition-celestial
                    ${period.status === 'current' ? 'bg-primary/5' : 'hover:bg-surface-secondary'}
                  `}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{period.symbol}</span>
                      <span className="font-medium text-text-primary">{period.planet}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-text-secondary font-mono text-sm">
                    {formatDate(period.startDate)}
                  </td>
                  <td className="py-3 px-2 text-text-secondary font-mono text-sm">
                    {formatDate(period.endDate)}
                  </td>
                  <td className="py-3 px-2 text-text-secondary">
                    {period.years} years
                  </td>
                  <td className="py-3 px-2">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${getStatusColor(period.status)}
                    `}>
                      {period.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VimshottariDashaTable;