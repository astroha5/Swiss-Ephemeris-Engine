import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ChartVisualization = ({ chartData, chartType = 'lagna' }) => {
  const [selectedHouse, setSelectedHouse] = useState(null);

  // Mock chart data structure
  const mockChartData = {
    lagna: {
      houses: [
        { number: 1, sign: 'Aries', planets: ['Sun', 'Mercury'], degrees: ['15°23\'', '28°45\''] },
        { number: 2, sign: 'Taurus', planets: ['Venus'], degrees: ['12°18\''] },
        { number: 3, sign: 'Gemini', planets: [], degrees: [] },
        { number: 4, sign: 'Cancer', planets: ['Moon'], degrees: ['05°32\''] },
        { number: 5, sign: 'Leo', planets: ['Jupiter'], degrees: ['22°15\''] },
        { number: 6, sign: 'Virgo', planets: [], degrees: [] },
        { number: 7, sign: 'Libra', planets: ['Mars'], degrees: ['18°42\''] },
        { number: 8, sign: 'Scorpio', planets: [], degrees: [] },
        { number: 9, sign: 'Sagittarius', planets: ['Saturn'], degrees: ['09°28\''] },
        { number: 10, sign: 'Capricorn', planets: [], degrees: [] },
        { number: 11, sign: 'Aquarius', planets: ['Rahu'], degrees: ['25°16\''] },
        { number: 12, sign: 'Pisces', planets: ['Ketu'], degrees: ['25°16\''] }
      ]
    },
    navamsa: {
      houses: [
        { number: 1, sign: 'Leo', planets: ['Sun'], degrees: ['15°23\''] },
        { number: 2, sign: 'Virgo', planets: ['Mercury', 'Venus'], degrees: ['28°45\'', '12°18\''] },
        { number: 3, sign: 'Libra', planets: [], degrees: [] },
        { number: 4, sign: 'Scorpio', planets: ['Moon', 'Mars'], degrees: ['05°32\'', '18°42\''] },
        { number: 5, sign: 'Sagittarius', planets: [], degrees: [] },
        { number: 6, sign: 'Capricorn', planets: ['Jupiter'], degrees: ['22°15\''] },
        { number: 7, sign: 'Aquarius', planets: [], degrees: [] },
        { number: 8, sign: 'Pisces', planets: ['Saturn'], degrees: ['09°28\''] },
        { number: 9, sign: 'Aries', planets: [], degrees: [] },
        { number: 10, sign: 'Taurus', planets: [], degrees: [] },
        { number: 11, sign: 'Gemini', planets: ['Rahu'], degrees: ['25°16\''] },
        { number: 12, sign: 'Cancer', planets: ['Ketu'], degrees: ['25°16\''] }
      ]
    }
  };

  const currentChart = chartData || mockChartData[chartType];
  const chartTitle = chartType === 'lagna' ? 'Lagna Chart (D1)' : 'Navamsa Chart (D9)';

  const getHousePosition = (houseNumber) => {
    // North Indian style chart positions
    const positions = {
      1: { top: '25%', left: '62.5%' },
      2: { top: '12.5%', left: '37.5%' },
      3: { top: '12.5%', left: '12.5%' },
      4: { top: '25%', left: '0%' },
      5: { top: '50%', left: '0%' },
      6: { top: '75%', left: '0%' },
      7: { top: '87.5%', left: '12.5%' },
      8: { top: '87.5%', left: '37.5%' },
      9: { top: '87.5%', left: '62.5%' },
      10: { top: '75%', left: '75%' },
      11: { top: '50%', left: '75%' },
      12: { top: '25%', left: '75%' }
    };
    return positions[houseNumber] || { top: '50%', left: '50%' };
  };

  const getPlanetSymbol = (planet) => {
    const symbols = {
      'Sun': '☉',
      'Moon': '☽',
      'Mars': '♂',
      'Mercury': '☿',
      'Jupiter': '♃',
      'Venus': '♀',
      'Saturn': '♄',
      'Rahu': '☊',
      'Ketu': '☋'
    };
    return symbols[planet] || planet.charAt(0);
  };

  const handleHouseClick = (house) => {
    setSelectedHouse(selectedHouse?.number === house.number ? null : house);
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-semibold text-text-primary">
          {chartTitle}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Icon name="Info" size={16} />
          <span className="font-caption">North Indian Style</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Main Chart Grid */}
        <div className="relative w-full aspect-square max-w-md mx-auto bg-background border-2 border-primary/20 rounded-lg">
          {/* Chart Grid Lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Outer border */}
            <rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--color-border)" strokeWidth="0.5"/>
            
            {/* Grid lines for North Indian chart */}
            <line x1="25" y1="0" x2="25" y2="100" stroke="var(--color-border)" strokeWidth="0.5"/>
            <line x1="50" y1="0" x2="50" y2="100" stroke="var(--color-border)" strokeWidth="0.5"/>
            <line x1="75" y1="0" x2="75" y2="100" stroke="var(--color-border)" strokeWidth="0.5"/>
            <line x1="0" y1="25" x2="100" y2="25" stroke="var(--color-border)" strokeWidth="0.5"/>
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--color-border)" strokeWidth="0.5"/>
            <line x1="0" y1="75" x2="100" y2="75" stroke="var(--color-border)" strokeWidth="0.5"/>
            
            {/* Diagonal lines for diamond shape */}
            <line x1="25" y1="25" x2="75" y2="75" stroke="var(--color-border)" strokeWidth="0.5"/>
            <line x1="75" y1="25" x2="25" y2="75" stroke="var(--color-border)" strokeWidth="0.5"/>
          </svg>

          {/* Houses */}
          {currentChart.houses.map((house) => {
            const position = getHousePosition(house.number);
            const isSelected = selectedHouse?.number === house.number;
            
            return (
              <div
                key={house.number}
                className={`absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-celestial ${
                  isSelected ? 'z-10' : ''
                }`}
                style={{ top: position.top, left: position.left }}
                onClick={() => handleHouseClick(house)}
              >
                {/* House Container */}
                <div className={`
                  w-full h-full rounded-lg border-2 transition-celestial flex flex-col items-center justify-center p-1
                  ${isSelected 
                    ? 'border-primary bg-primary/10 shadow-medium' 
                    : 'border-border-light bg-surface hover:border-primary/40 hover:bg-primary/5'
                  }
                `}>
                  {/* House Number */}
                  <div className="text-xs font-mono text-text-muted mb-1">
                    {house.number}
                  </div>
                  
                  {/* Planets */}
                  <div className="flex flex-wrap justify-center gap-1">
                    {house.planets.map((planet, index) => (
                      <div
                        key={planet}
                        className={`
                          text-lg font-bold transition-celestial
                          ${isSelected ? 'text-primary' : 'text-accent'}
                        `}
                        title={`${planet} ${house.degrees[index] || ''}`}
                      >
                        {getPlanetSymbol(planet)}
                      </div>
                    ))}
                  </div>
                  
                  {/* Sign */}
                  <div className="text-xs font-caption text-text-muted mt-1 text-center">
                    {house.sign.substring(0, 3)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected House Details */}
        {selectedHouse && (
          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-semibold text-primary">
                House {selectedHouse.number} - {selectedHouse.sign}
              </h4>
              <button
                onClick={() => setSelectedHouse(null)}
                className="text-text-muted hover:text-text-primary transition-celestial"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
            
            {selectedHouse.planets.length > 0 ? (
              <div className="space-y-2">
                {selectedHouse.planets.map((planet, index) => (
                  <div key={planet} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getPlanetSymbol(planet)}</span>
                      <span className="font-medium text-text-primary">{planet}</span>
                    </div>
                    <span className="font-mono text-sm text-text-secondary">
                      {selectedHouse.degrees[index] || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted font-caption">No planets in this house</p>
            )}
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="mt-6 pt-4 border-t border-border-light">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
          {Object.entries({
            'Sun': '☉', 'Moon': '☽', 'Mars': '♂', 'Mercury': '☿', 'Jupiter': '♃',
            'Venus': '♀', 'Saturn': '♄', 'Rahu': '☊', 'Ketu': '☋'
          }).map(([planet, symbol]) => (
            <div key={planet} className="flex items-center space-x-1 text-text-muted">
              <span className="text-accent font-bold">{symbol}</span>
              <span className="font-caption">{planet}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartVisualization;