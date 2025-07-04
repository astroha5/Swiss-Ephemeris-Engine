import React, { useState } from 'react';

/**
 * Traditional North Indian Diamond-style Vedic Chart Component
 * Matches Astrova theme with cream background, orange-golden accents
 * Responsive design with hover tooltips
 */
const TraditionalNorthIndianChart = ({ 
  chartData, 
  title = "Birth Chart (D1)", 
  showAscendant = true,
  className = "" 
}) => {
  const [hoveredHouse, setHoveredHouse] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  const houses = chartData?.houses || [];

  // Traditional North Indian house positioning in diamond layout
  const houseLayout = {
    12: { 
      position: { top: '0%', left: '66.67%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-r-0 border-t-0'
    },
    1: { 
      position: { top: '33.33%', left: '66.67%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-r-0',
      isAscendant: true
    },
    2: { 
      position: { top: '66.67%', left: '66.67%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-r-0 border-b-0'
    },
    11: { 
      position: { top: '0%', left: '33.33%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-t-0'
    },
    3: { 
      position: { top: '66.67%', left: '33.33%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-b-0'
    },
    10: { 
      position: { top: '0%', left: '0%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-l-0 border-t-0'
    },
    9: { 
      position: { top: '33.33%', left: '0%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-l-0'
    },
    4: { 
      position: { top: '66.67%', left: '0%', width: '33.33%', height: '33.33%' },
      textAlign: 'center',
      border: 'border-l-0 border-b-0'
    },
    // Inner diamond houses
    8: { 
      position: { top: '33.33%', left: '11.11%', width: '22.22%', height: '33.33%' },
      textAlign: 'center',
      border: '',
      isInner: true
    },
    7: { 
      position: { top: '44.44%', left: '33.33%', width: '33.33%', height: '22.22%' },
      textAlign: 'center',
      border: '',
      isInner: true
    },
    6: { 
      position: { top: '33.33%', left: '66.67%', width: '22.22%', height: '33.33%' },
      textAlign: 'center',
      border: '',
      isInner: true
    },
    5: { 
      position: { top: '11.11%', left: '33.33%', width: '33.33%', height: '22.22%' },
      textAlign: 'center',
      border: '',
      isInner: true
    }
  };

  // Enhanced planet symbols with Astrova styling
  const planetSymbols = {
    'Sun': { symbol: '☉', color: 'text-orange-600', name: 'Su' },
    'Moon': { symbol: '☽', color: 'text-blue-500', name: 'Mo' },
    'Mars': { symbol: '♂', color: 'text-red-600', name: 'Ma' },
    'Mercury': { symbol: '☿', color: 'text-green-600', name: 'Me' },
    'Jupiter': { symbol: '♃', color: 'text-yellow-600', name: 'Ju' },
    'Venus': { symbol: '♀', color: 'text-pink-500', name: 'Ve' },
    'Saturn': { symbol: '♄', color: 'text-purple-600', name: 'Sa' },
    'Rahu': { symbol: '☊', color: 'text-gray-700', name: 'Ra' },
    'Ketu': { symbol: '☋', color: 'text-gray-600', name: 'Ke' }
  };

  // Get house data by number
  const getHouseData = (houseNumber) => {
    return houses.find(h => h.number === houseNumber) || { 
      number: houseNumber,
      planets: [], 
      sign: '', 
      degrees: [] 
    };
  };

  // Format degree display
  const formatDegree = (degree) => {
    if (!degree) return '';
    return degree.replace(/['"]/g, '').substring(0, 6);
  };

  return (
    <div className={`traditional-north-indian-chart ${className}`}>
      {/* Chart Title */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 font-heading">
          {title}
        </h3>
        <p className="text-sm text-gray-600 font-body">
          Traditional North Indian Diamond Style
        </p>
      </div>

      {/* Main Chart Container */}
      <div className="relative w-full max-w-lg mx-auto aspect-square bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-xl border-2 border-orange-200">
        
        {/* Diamond Grid Structure */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Outer diamond border */}
          <rect 
            x="2" y="2" 
            width="396" height="396" 
            fill="none" 
            stroke="#D97706" 
            strokeWidth="3"
            rx="12"
          />
          
          {/* Main grid lines - soft brown/orange */}
          {/* Vertical divisions */}
          <line x1="133.33" y1="2" x2="133.33" y2="398" stroke="#F97316" strokeWidth="2" opacity="0.7"/>
          <line x1="266.67" y1="2" x2="266.67" y2="398" stroke="#F97316" strokeWidth="2" opacity="0.7"/>
          
          {/* Horizontal divisions */}
          <line x1="2" y1="133.33" x2="398" y2="133.33" stroke="#F97316" strokeWidth="2" opacity="0.7"/>
          <line x1="2" y1="266.67" x2="398" y2="266.67" stroke="#F97316" strokeWidth="2" opacity="0.7"/>
          
          {/* Diagonal inner diamond lines */}
          <line x1="66.67" y1="133.33" x2="133.33" y2="66.67" stroke="#FB923C" strokeWidth="1.5" opacity="0.6"/>
          <line x1="266.67" y1="66.67" x2="333.33" y2="133.33" stroke="#FB923C" strokeWidth="1.5" opacity="0.6"/>
          <line x1="333.33" y1="266.67" x2="266.67" y2="333.33" stroke="#FB923C" strokeWidth="1.5" opacity="0.6"/>
          <line x1="133.33" y1="333.33" x2="66.67" y2="266.67" stroke="#FB923C" strokeWidth="1.5" opacity="0.6"/>
          
          {/* Center diamond */}
          <polygon 
            points="200,100 300,200 200,300 100,200"
            fill="none"
            stroke="#FDBA74"
            strokeWidth="1"
            opacity="0.4"
          />
        </svg>

        {/* Houses with Planets */}
        {Object.entries(houseLayout).map(([houseNum, layout]) => {
          const houseNumber = parseInt(houseNum);
          const houseData = getHouseData(houseNumber);
          const isHovered = hoveredHouse === houseNumber;
          
          return (
            <div
              key={houseNumber}
              className={`
                absolute flex flex-col items-center justify-center p-1 transition-all duration-200
                ${isHovered ? 'bg-orange-100 bg-opacity-50 rounded-lg' : ''}
                ${layout.isInner ? 'bg-white bg-opacity-30 rounded-lg' : ''}
                cursor-pointer
              `}
              style={{
                top: layout.position.top,
                left: layout.position.left,
                width: layout.position.width,
                height: layout.position.height,
                textAlign: layout.textAlign
              }}
              onMouseEnter={() => setHoveredHouse(houseNumber)}
              onMouseLeave={() => setHoveredHouse(null)}
            >
              {/* House Number Badge */}
              <div className={`
                absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${layout.isAscendant && showAscendant 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transform scale-110' 
                  : 'bg-gradient-to-r from-orange-200 to-amber-200 text-orange-800'
                }
                border-2 border-white shadow-sm
              `}>
                {layout.isAscendant && showAscendant ? 'Asc' : houseNumber}
              </div>

              {/* Planets in House */}
              <div className="flex flex-col items-center justify-center space-y-1 mt-2">
                {houseData.planets?.map((planet, idx) => {
                  const planetInfo = planetSymbols[planet];
                  const isPlanetHovered = hoveredPlanet === `${houseNumber}-${planet}`;
                  
                  return (
                    <div
                      key={`${planet}-${idx}`}
                      className={`
                        relative transition-all duration-200 cursor-help
                        ${isPlanetHovered ? 'transform scale-110' : ''}
                      `}
                      onMouseEnter={() => setHoveredPlanet(`${houseNumber}-${planet}`)}
                      onMouseLeave={() => setHoveredPlanet(null)}
                    >
                      {/* Planet Symbol and Name */}
                      <div className="flex items-center space-x-1">
                        <span className={`
                          text-lg font-bold ${planetInfo?.color || 'text-gray-700'}
                          drop-shadow-sm
                        `}>
                          {planetInfo?.symbol || planet.charAt(0)}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {planetInfo?.name || planet.slice(0, 2)}
                        </span>
                      </div>
                      
                      {/* Planet Degree */}
                      {houseData.degrees?.[idx] && (
                        <div className="text-xs text-gray-600 font-mono leading-tight">
                          {formatDegree(houseData.degrees[idx])}
                        </div>
                      )}

                      {/* Hover Tooltip */}
                      {isPlanetHovered && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-fadeIn">
                          <div className="font-semibold">{planet}</div>
                          {houseData.degrees?.[idx] && (
                            <div className="font-mono">{houseData.degrees[idx]}</div>
                          )}
                          {houseData.sign && (
                            <div className="text-gray-300">in {houseData.sign}</div>
                          )}
                          {/* Tooltip Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* House Sign */}
              {houseData.sign && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-orange-700 font-medium bg-white bg-opacity-70 px-1 rounded">
                  {houseData.sign.slice(0, 3)}
                </div>
              )}

              {/* House Hover Info */}
              {isHovered && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-orange-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-40">
                  House {houseNumber}
                  {houseData.sign && ` - ${houseData.sign}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-orange-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center font-heading">
          Planet Symbols
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Object.entries(planetSymbols).map(([name, info]) => (
            <div 
              key={name} 
              className="flex flex-col items-center space-y-1 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <span className={`text-xl font-bold ${info.color} drop-shadow-sm`}>
                {info.symbol}
              </span>
              <span className="text-xs font-medium text-gray-700">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p className="font-body">
          Hover over planets and houses for detailed information
        </p>
      </div>
    </div>
  );
};

export default TraditionalNorthIndianChart;
