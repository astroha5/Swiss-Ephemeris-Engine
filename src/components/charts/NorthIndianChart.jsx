import React, { useState, useRef } from 'react';

/**
 * Enhanced Traditional North Indian Diamond Style Chart Component
 * Features Astrova theme colors, hover effects, animations, and detailed interactivity
 */
const NorthIndianChart = ({ chartData, title = "Birth Chart", className = "" }) => {
  const houses = chartData?.houses || [];
  const [hoveredHouse, setHoveredHouse] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);

  // Correct North Indian Diamond chart house positions
  // Based on the reference image provided
  const housePositions = {
    1: { 
      position: 'center',
      coords: { top: '37.5%', left: '37.5%', width: '25%', height: '25%' },
      label: 'Ascendant',
      isAscendant: true
    },
    2: { 
      position: 'top-left-outer',
      coords: { top: '0%', left: '0%', width: '25%', height: '25%' },
      number: '2'
    },
    3: { 
      position: 'top-left-inner', 
      coords: { top: '12.5%', left: '12.5%', width: '25%', height: '25%' },
      number: '3'
    },
    4: { 
      position: 'left-side',
      coords: { top: '37.5%', left: '0%', width: '25%', height: '25%' },
      number: '4'
    },
    5: { 
      position: 'bottom-left-inner',
      coords: { top: '62.5%', left: '12.5%', width: '25%', height: '25%' },
      number: '5'
    },
    6: { 
      position: 'bottom-left-outer',
      coords: { top: '75%', left: '0%', width: '25%', height: '25%' },
      number: '6'
    },
    7: { 
      position: 'bottom-center',
      coords: { top: '75%', left: '37.5%', width: '25%', height: '25%' },
      number: '7'
    },
    8: { 
      position: 'bottom-right-outer',
      coords: { top: '75%', left: '75%', width: '25%', height: '25%' },
      number: '8'
    },
    9: { 
      position: 'bottom-right-inner',
      coords: { top: '62.5%', left: '62.5%', width: '25%', height: '25%' },
      number: '9'
    },
    10: { 
      position: 'right-side',
      coords: { top: '37.5%', left: '75%', width: '25%', height: '25%' },
      number: '10'
    },
    11: { 
      position: 'top-right-inner',
      coords: { top: '12.5%', left: '62.5%', width: '25%', height: '25%' },
      number: '11'
    },
    12: { 
      position: 'top-right-outer',
      coords: { top: '0%', left: '75%', width: '25%', height: '25%' },
      number: '12'
    }
  };

  // Zodiac sign abbreviations
  const zodiacSigns = {
    'Aries': 'Ar', 'Taurus': 'Ta', 'Gemini': 'Ge', 'Cancer': 'Ca',
    'Leo': 'Le', 'Virgo': 'Vi', 'Libra': 'Li', 'Scorpio': 'Sc',
    'Sagittarius': 'Sa', 'Capricorn': 'Cp', 'Aquarius': 'Aq', 'Pisces': 'Pi'
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
      <h3 className="text-xl font-semibold text-center mb-6 text-gray-800">{title}</h3>
      
      {/* Chart Container */}
      <div className="relative w-96 h-96 mx-auto bg-white border-2 border-gray-800">
        {/* Draw the diamond grid structure */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
          {/* Outer border */}
          <rect x="0" y="0" width="400" height="400" fill="none" stroke="#1f2937" strokeWidth="3"/>
          
          {/* Main grid lines creating the diamond pattern */}
          {/* Vertical lines */}
          <line x1="100" y1="0" x2="100" y2="400" stroke="#1f2937" strokeWidth="2"/>
          <line x1="200" y1="0" x2="200" y2="400" stroke="#1f2937" strokeWidth="2"/>
          <line x1="300" y1="0" x2="300" y2="400" stroke="#1f2937" strokeWidth="2"/>
          
          {/* Horizontal lines */}
          <line x1="0" y1="100" x2="400" y2="100" stroke="#1f2937" strokeWidth="2"/>
          <line x1="0" y1="200" x2="400" y2="200" stroke="#1f2937" strokeWidth="2"/>
          <line x1="0" y1="300" x2="400" y2="300" stroke="#1f2937" strokeWidth="2"/>
          
          {/* Diagonal lines creating the diamond effect */}
          <line x1="50" y1="50" x2="150" y2="150" stroke="#1f2937" strokeWidth="2"/>
          <line x1="150" y1="50" x2="50" y2="150" stroke="#1f2937" strokeWidth="2"/>
          <line x1="250" y1="50" x2="350" y2="150" stroke="#1f2937" strokeWidth="2"/>
          <line x1="350" y1="50" x2="250" y2="150" stroke="#1f2937" strokeWidth="2"/>
          <line x1="50" y1="250" x2="150" y2="350" stroke="#1f2937" strokeWidth="2"/>
          <line x1="150" y1="250" x2="50" y2="350" stroke="#1f2937" strokeWidth="2"/>
          <line x1="250" y1="250" x2="350" y2="350" stroke="#1f2937" strokeWidth="2"/>
          <line x1="350" y1="250" x2="250" y2="350" stroke="#1f2937" strokeWidth="2"/>
        </svg>

        {/* Houses with planets */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((houseNum) => {
          const houseData = getHouseData(houseNum);
          const position = housePositions[houseNum];
          
          return (
            <div
              key={houseNum}
              className="absolute flex flex-col items-center justify-center text-center p-1"
              style={{
                top: position.coords.top,
                left: position.coords.left,
                width: position.coords.width,
                height: position.coords.height
              }}
            >
              {/* House number in corner */}
              <div className="absolute top-1 left-1 text-xs font-bold text-gray-600 bg-white px-1 rounded">
                {houseNum === 1 ? (position.label || houseNum) : houseNum}
              </div>
              
              {/* Planets in this house */}
              <div className="flex flex-col items-center justify-center h-full w-full">
                {houseData.planets?.map((planet, idx) => (
                  <div key={idx} className="mb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-blue-800">
                        {planetSymbols[planet] || planet.slice(0, 2)}
                      </span>
                      <span className="text-xs font-medium">{planet}</span>
                    </div>
                    {houseData.degrees?.[idx] && (
                      <div className="text-xs text-gray-600">{houseData.degrees[idx]}</div>
                    )}
                  </div>
                ))}
                
                {/* House sign */}
                {houseData.sign && (
                  <div className="text-xs text-gray-500 mt-1 font-medium">
                    {houseData.sign}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* House labels in traditional positions */}
        <div className="absolute top-2 right-2 text-xs text-gray-500">H12</div>
        <div className="absolute top-12 right-12 text-xs text-gray-500">H11</div>
        <div className="absolute top-2 left-2 text-xs text-gray-500">H2</div>
        <div className="absolute top-12 left-12 text-xs text-gray-500">H3</div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-500">H6</div>
        <div className="absolute bottom-12 left-12 text-xs text-gray-500">H5</div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">H8</div>
        <div className="absolute bottom-12 right-12 text-xs text-gray-500">H9</div>
        <div className="absolute top-1/2 left-2 text-xs text-gray-500 transform -translate-y-1/2">H4</div>
        <div className="absolute top-1/2 right-2 text-xs text-gray-500 transform -translate-y-1/2">H10</div>
        <div className="absolute bottom-2 left-1/2 text-xs text-gray-500 transform -translate-x-1/2">H7</div>
        <div className="absolute top-1/2 left-1/2 text-xs text-gray-500 transform -translate-x-1/2 -translate-y-1/2">H1</div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 text-sm text-gray-600">
        <div className="text-center mb-2">
          <strong>Planet Symbols:</strong>
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs">
          {Object.entries(planetSymbols).map(([name, symbol]) => (
            <div key={name} className="flex items-center gap-1 justify-center">
              <span className="text-base font-bold text-blue-800">{symbol}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NorthIndianChart;
