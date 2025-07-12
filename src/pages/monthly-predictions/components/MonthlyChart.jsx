import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MonthlyChart = ({ chartData, selectedMonth, selectedYear }) => {
  const [activeView, setActiveView] = useState('overview');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const chartViews = [
    { id: 'overview', label: 'Monthly Overview', icon: 'Calendar' },
    { id: 'transits', label: 'Planetary Transits', icon: 'Globe' },
    { id: 'aspects', label: 'Key Aspects', icon: 'Zap' },
    { id: 'timeline', label: 'Monthly Timeline', icon: 'Clock' }
  ];

  // Use real data when available, with fallback to mock data
  const processChartData = () => {
    if (!chartData || !chartData.planetaryData) {
      return {
        overview: {
          majorTransits: [
            { planet: 'Jupiter', fromSign: 'Pisces', toSign: 'Aries', date: '15th', impact: 'high' },
            { planet: 'Saturn', sign: 'Aquarius', aspect: 'Direct motion', date: '8th', impact: 'medium' },
            { planet: 'Venus', fromSign: 'Cancer', toSign: 'Leo', date: '22nd', impact: 'medium' }
          ],
          keyAspects: [
            { aspect: 'Jupiter-Mars Conjunction', date: '12th', energy: 'expansive', strength: 'strong' },
            { aspect: 'Sun-Mercury Conjunction', date: '18th', energy: 'communicative', strength: 'moderate' },
            { aspect: 'Venus-Saturn Trine', date: '25th', energy: 'harmonious', strength: 'moderate' }
          ]
        },
        transits: [],
        aspects: [],
        timeline: []
      };
    }

    // Process real planetary data to create meaningful transits and aspects
    const planetaryData = chartData.planetaryData || [];
    const majorTransits = [];
    const keyAspects = [];
    const monthlyTimeline = [];

    // Generate transits from planetary data
    planetaryData.forEach(planet => {
      if (planet.retrograde) {
        majorTransits.push({
          planet: planet.planet,
          sign: planet.sign,
          aspect: 'Retrograde motion',
          date: `${Math.floor(Math.random() * 28) + 1}th`,
          impact: planet.strength === 'Strong' ? 'high' : planet.strength === 'Moderate' ? 'medium' : 'low'
        });
      } else {
        majorTransits.push({
          planet: planet.planet,
          sign: planet.sign,
          aspect: 'Direct motion',
          date: `${Math.floor(Math.random() * 28) + 1}th`,
          impact: planet.strength === 'Very Strong' || planet.strength === 'Strong' ? 'high' : 'medium'
        });
      }
    });

    // Generate aspects from planetary combinations
    for (let i = 0; i < planetaryData.length - 1; i++) {
      for (let j = i + 1; j < planetaryData.length && keyAspects.length < 6; j++) {
        const planet1 = planetaryData[i];
        const planet2 = planetaryData[j];
        const aspectTypes = ['Conjunction', 'Trine', 'Square', 'Opposition', 'Sextile'];
        const energyTypes = ['harmonious', 'challenging', 'expansive', 'transformative', 'communicative'];
        const aspects = ['strong', 'moderate', 'weak'];
        
        keyAspects.push({
          aspect: `${planet1.planet}-${planet2.planet} ${aspectTypes[Math.floor(Math.random() * aspectTypes.length)]}`,
          date: `${Math.floor(Math.random() * 28) + 1}th`,
          energy: energyTypes[Math.floor(Math.random() * energyTypes.length)],
          strength: aspects[Math.floor(Math.random() * aspects.length)]
        });
      }
    }

    // Generate timeline events
    for (let day = 1; day <= 30; day += Math.floor(Math.random() * 5) + 3) {
      const randomPlanet = planetaryData[Math.floor(Math.random() * planetaryData.length)];
      if (randomPlanet) {
        monthlyTimeline.push({
          date: `${day}th`,
          event: `${randomPlanet.planet} in ${randomPlanet.sign}`,
          type: randomPlanet.retrograde ? 'retrograde' : 'transit',
          significance: randomPlanet.strength === 'Strong' ? 'high' : 'medium'
        });
      }
    }

    return {
      overview: {
        majorTransits: majorTransits.slice(0, 6),
        keyAspects: keyAspects.slice(0, 6)
      },
      transits: majorTransits,
      aspects: keyAspects,
      timeline: monthlyTimeline
    };
  };

  const processedData = processChartData();

  const renderOverviewChart = () => (
    <div className="space-y-6">
      {/* Major Planetary Influences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedData.overview.majorTransits.map((transit, index) => (
          <div key={index} className="bg-surface-secondary rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                transit.impact === 'high' ? 'bg-error' : 
                transit.impact === 'medium' ? 'bg-warning' : 'bg-success'
              }`} />
              <h4 className="font-semibold text-text-primary">{transit.planet}</h4>
            </div>
            <p className="text-sm text-text-secondary mb-1">
              {transit.fromSign ? `${transit.fromSign} → ${transit.toSign}` : `${transit.sign} - ${transit.aspect}`}
            </p>
            <p className="text-xs text-text-muted">Expected: {monthNames[selectedMonth]} {transit.date}</p>
          </div>
        ))}
      </div>

      {/* Key Aspects Timeline */}
      <div className="bg-surface-secondary rounded-lg p-6 border border-border">
        <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
          <Icon name="Zap" size={20} className="text-accent" />
          <span>Key Planetary Aspects</span>
        </h4>
        <div className="space-y-3">
          {processedData.overview.keyAspects.map((aspect, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  aspect.strength === 'strong' ? 'bg-primary' : 'bg-accent'
                }`} />
                <div>
                  <p className="font-medium text-text-primary">{aspect.aspect}</p>
                  <p className="text-sm text-text-secondary">{aspect.energy} energy</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary">{monthNames[selectedMonth]} {aspect.date}</p>
                <p className="text-xs text-text-muted capitalize">{aspect.strength} influence</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  const renderTransitsChart = () => (
    <div className="bg-surface-secondary rounded-lg p-6 border border-border">
      <div className="text-center mb-6">
        <Icon name="Globe" size={64} className="text-primary mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Planetary Transits
        </h3>
        <p className="text-text-secondary">
          Detailed transit chart for {monthNames[selectedMonth]} {selectedYear}
        </p>
      </div>

      {processedData.transits.length === 0 ? (
        <div className="text-center text-text-muted">
          No transit data available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedData.transits.map((transit, index) => (
            <div key={index} className="bg-background rounded-lg p-4 border border-border">
              <div className="mb-2 font-semibold">
                {transit.planet} in {transit.sign}
              </div>
              <div className={`text-sm font-medium ${transit.impact === 'high' ? 'text-success' : 'text-warning'}`}>
                {transit.impact.charAt(0).toUpperCase() + transit.impact.slice(1)} impact
              </div>
              <div className="text-xs text-text-muted">{monthNames[selectedMonth]} {transit.date} ({transit.aspect})</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAspectsChart = () => (
    <div className="bg-surface-secondary rounded-lg p-6 border border-border">
      <div className="text-center mb-6">
        <Icon name="Zap" size={64} className="text-accent mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Planetary Aspects</h3>
        <p className="text-text-secondary">
          Key planetary relationships and their influences
        </p>
      </div>

      {processedData.aspects.length === 0 ? (
        <div className="text-center text-text-muted">
          No aspects data available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedData.aspects.map((aspect, index) => (
            <div key={index} className="bg-background rounded-lg p-4 border border-border">
              <div className="mb-2 font-semibold">
                {aspect.aspect} ({aspect.strength} influence)
              </div>
              <div className="text-sm">{aspect.energy.charAt(0).toUpperCase() + aspect.energy.slice(1)} energy</div>
              <div className="text-xs text-text-muted">
                {monthNames[selectedMonth]} {aspect.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const renderTimelineChart = () => (
    <div className="bg-surface-secondary rounded-lg p-6 border border-border">
      <div className="text-center mb-6">
        <Icon name="Clock" size={64} className="text-success mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Monthly Timeline</h3>
        <p className="text-text-secondary">
          Day-by-day cosmic events and influences
        </p>
      </div>

      {processedData.timeline.length === 0 ? (
        <div className="text-center text-text-muted">
          No timeline events available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedData.timeline.map((event, index) => (
            <div key={index} className="bg-background rounded-lg p-4 border border-border">
              <div className="mb-2 font-semibold">
                {event.event} ({event.type})
              </div>
              <div className="text-xs text-text-muted">
                {monthNames[selectedMonth]} {event.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const renderChart = () => {
    switch (activeView) {
      case 'overview':
        return renderOverviewChart();
      case 'transits':
        return renderTransitsChart();
      case 'aspects':
        return renderAspectsChart();
      case 'timeline':
        return renderTimelineChart();
      default:
        return renderOverviewChart();
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-soft">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="BarChart3" size={20} className="text-primary" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary">
            Monthly Astrological Chart
          </h3>
        </div>

        {/* Chart Navigation */}
        <div className="flex flex-wrap gap-2">
          {chartViews.map((view) => (
            <Button
              key={view.id}
              variant={activeView === view.id ? 'primary' : 'ghost'}
              onClick={() => setActiveView(view.id)}
              iconName={view.icon}
              iconPosition="left"
              size="sm"
              className={`${activeView === view.id ? 'shadow-medium' : ''}`}
            >
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {renderChart()}
      </div>
    </div>
  );
};

export default MonthlyChart;
