import React from 'react';

/**
 * North Indian Diamond Style Chart Component
 * Renders traditional diamond-shaped Vedic astrology charts
 */
const NorthIndianChart = ({ chartData, title = "Birth Chart", className = "" }) => {
  // Default empty chart structure
  const emptyChart = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    sign: '',
    planets: [],
    degrees: []
  }));

  const houses = chartData?.houses || emptyChart;

  // House positions in diamond layout (North Indian style)
  const housePositions = {
    1: { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' },      // Left center
    2: { top: '25%', left: '25%', transform: 'translate(-50%, -50%)' },     // Top-left
    3: { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' },      // Top center
    4: { top: '25%', left: '75%', transform: 'translate(-50%, -50%)' },     // Top-right
    5: { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' },    // Right center
    6: { top: '75%', left: '75%', transform: 'translate(-50%, -50%)' },     // Bottom-right
    7: { top: '100%', left: '50%', transform: 'translate(-50%, -50%)' },    // Bottom center
    8: { top: '75%', left: '25%', transform: 'translate(-50%, -50%)' },     // Bottom-left
    9: { top: '50%', left: '25%', transform: 'translate(-50%, -50%)' },     // Left-inner
    10: { top: '25%', left: '50%', transform: 'translate(-50%, -50%)' },    // Top-inner
    11: { top: '50%', left: '75%', transform: 'translate(-50%, -50%)' },    // Right-inner
    12: { top: '75%', left: '50%', transform: 'translate(-50%, -50%)' }     // Bottom-inner
  };

  // Planet symbols
  const planetSymbols = {
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

  // Simplified planet names for display
  const planetShortNames = {
    'Sun': 'Su',
    'Moon': 'Mo',
    'Mars': 'Ma',
    'Mercury': 'Me',
    'Jupiter': 'Ju',
    'Venus': 'Ve',
    'Saturn': 'Sa',
    'Rahu': 'Ra',
    'Ketu': 'Ke'
  };

  // Get house data by number
  const getHouseData = (houseNumber) => {
    return houses.find(h => h.number === houseNumber) || { planets: [], sign: '' };
  };

  return (
    <div className={`north-indian-chart ${className}`}>
      <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">{title}</h3>
      
      {/* Chart Container */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Diamond Background */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 320 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Diamond */}
          <polygon
            points="160,20 280,160 160,300 40,160"
            fill="none"
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Inner Square */}
          <polygon
            points="160,80 240,160 160,240 80,160"
            fill="none"
            stroke="#6B7280"
            strokeWidth="1"
          />
          
          {/* Diagonal Lines */}
          <line x1="40" y1="160" x2="280" y2="160" stroke="#9CA3AF" strokeWidth="1" />
          <line x1="160" y1="20" x2="160" y2="300" stroke="#9CA3AF" strokeWidth="1" />
          
          {/* Additional division lines */}
          <line x1="100" y1="60" x2="220" y2="60" stroke="#D1D5DB" strokeWidth="0.5" />
          <line x1="100" y1="260" x2="220" y2="260" stroke="#D1D5DB" strokeWidth="0.5" />
          <line x1="60" y1="100" x2="60" y2="220" stroke="#D1D5DB" strokeWidth="0.5" />
          <line x1="260" y1="100" x2="260" y2="220" stroke="#D1D5DB" strokeWidth="0.5" />
        </svg>

        {/* House Numbers and Planets */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((houseNum) => {
          const houseData = getHouseData(houseNum);
          const position = housePositions[houseNum];
          
          return (
            <div
              key={houseNum}
              className="absolute"
              style={position}
            >
              <div className="relative">
                {/* House Number */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-800 border border-blue-300">
                  {houseNum}
                </div>
                
                {/* House Content */}
                <div className="w-16 h-16 bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col items-center justify-center p-1">
                  {/* Sign Name */}
                  {houseData.sign && (
                    <div className="text-xs font-medium text-gray-600 mb-1 truncate w-full text-center">
                      {houseData.sign.slice(0, 3)}
                    </div>
                  )}
                  
                  {/* Planets */}
                  <div className="flex flex-wrap gap-1 items-center justify-center">
                    {houseData.planets?.map((planet, idx) => (
                      <div
                        key={idx}
                        className="relative group"
                      >
                        <span className="text-lg cursor-help">
                          {planetSymbols[planet] || planetShortNames[planet] || planet?.slice(0, 2)}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {planet}
                          {houseData.degrees?.[idx] && (
                            <div className="text-xs">{houseData.degrees[idx]}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 text-sm text-gray-600">
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          <div className="text-center">
            <strong>Planet Symbols:</strong>
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-1 text-xs">
            {Object.entries(planetSymbols).map(([name, symbol]) => (
              <div key={name} className="flex items-center gap-1">
                <span className="text-base">{symbol}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NorthIndianChart;
