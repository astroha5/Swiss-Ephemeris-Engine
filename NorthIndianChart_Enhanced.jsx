import React from "react";

const NorthIndianChart = ({ chartData, title = "Lagna Chart (D1)", className = "", onHouseClick }) => {
  const size = 600; // Canvas size
  const mid = size / 2; // 300

  // Debug: Log received data
  console.log('🔍 NorthIndianChart received chartData:', chartData);
  console.log('🏠 Houses data:', chartData?.houses);

  // Planet symbols for authentic display
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

  // ✅ FIXED: House center positions for North Indian chart
  // These are the FIXED coordinates for each house (H1 to H12)
  const getHouseCenterPoints = () => {
    const centers = {};
    
    // Updated coordinates based on North Indian chart layout
    centers[1] = { x: 450, y: 300 };   // H1 - Center-Right (Ascendant position)
    centers[2] = { x: 450, y: 150 };   // H2 - Top-Right
    centers[3] = { x: 300, y: 100 };   // H3 - Top-Center
    centers[4] = { x: 150, y: 150 };   // H4 - Top-Left
    centers[5] = { x: 150, y: 300 };   // H5 - Center-Left
    centers[6] = { x: 150, y: 450 };   // H6 - Bottom-Left
    centers[7] = { x: 300, y: 500 };   // H7 - Bottom-Center
    centers[8] = { x: 450, y: 450 };   // H8 - Bottom-Right
    centers[9] = { x: 380, y: 400 };   // H9 - Inner Bottom-Right
    centers[10] = { x: 380, y: 200 };  // H10 - Inner Top-Right
    centers[11] = { x: 220, y: 200 };  // H11 - Inner Top-Left
    centers[12] = { x: 220, y: 400 };  // H12 - Inner Bottom-Left
    
    return centers;
  };

  // House label positions matching the layout
  const housePositions = {
    1: { x: 450, y: 280 },   // H1
    2: { x: 450, y: 130 },   // H2
    3: { x: 300, y: 80 },    // H3
    4: { x: 150, y: 130 },   // H4
    5: { x: 150, y: 280 },   // H5
    6: { x: 150, y: 470 },   // H6
    7: { x: 300, y: 520 },   // H7
    8: { x: 450, y: 470 },   // H8
    9: { x: 380, y: 420 },   // H9
    10: { x: 380, y: 180 },  // H10
    11: { x: 220, y: 180 },  // H11
    12: { x: 220, y: 420 }   // H12
  };

  const houseCenters = getHouseCenterPoints();

  // ✅ IMPLEMENTING YOUR EXACT LOGIC:
  // 1. Ascendant Sign = House 1 (H1)
  // 2. Signs Follow the Houses (from H1 to H12)
  // 3. Planets Follow the Signs
  
  const getHouseData = (houseNumber) => {
    const houseData = chartData?.houses?.find((h) => h.number === houseNumber);
    
    // Debug logging for house data
    if (houseData && houseData.planets?.length > 0) {
      console.log(`🏠 House ${houseNumber} (${houseData.sign}): ${houseData.planets.join(', ')}`);
    }
    
    return houseData || { 
      number: houseNumber,
      planets: [], 
      sign: '', 
      degrees: [] 
    };
  };

  const formatPlanetDisplay = (planet, houseData, planetIdx, planetCount = 1) => {
    // Handle both string and object formats
    const planetName = typeof planet === 'string' ? planet : planet.name;
    const symbol = planetSymbols[planetName];
    const degree = typeof planet === 'object' ? planet.degree : houseData?.degrees?.[planetIdx];
    
    // Compact format for crowded houses (3+ planets)
    if (planetCount >= 3) {
      const shortDegree = degree ? degree.split('°')[0] + '°' : '';
      return symbol ? `${symbol} ${shortDegree}` : `${planetName} ${shortDegree}`;
    }
    
    // Standard format for houses with 1-2 planets
    const displayName = symbol ? `${symbol} ${planetName}` : planetName;
    return degree ? `${displayName} ${degree}` : displayName;
  };

  return (
    <div className={`north-indian-chart text-center ${className}`}>
      <h2 className="font-heading text-xl font-semibold mb-6">{title}</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-[650px] mx-auto">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          className="w-full h-auto"
        >
          {/* Background */}
          <rect x="0" y="0" width={size} height={size} fill="#fefefe" />
          
          {/* Outer square border */}
          <rect x="0" y="0" width={size} height={size} fill="none" stroke="#1f2937" strokeWidth="2" />
          
          {/* Main diagonals (X) */}
          <line x1="0" y1="0" x2={size} y2={size} stroke="#1f2937" strokeWidth="1.5" />
          <line x1={size} y1="0" x2="0" y2={size} stroke="#1f2937" strokeWidth="1.5" />
          
          {/* Central diamond */}
          <polygon 
            points={`${mid},0 ${size},${mid} ${mid},${size} 0,${mid}`}
            fill="none" 
            stroke="#1f2937" 
            strokeWidth="1.5" 
          />
          
          {/* House numbers (H1-H12) with custom positions */}
          {Array.from({ length: 12 }, (_, i) => {
            const houseNum = i + 1;
            const pos = housePositions[houseNum];
            if (!pos) return null;
            
            return (
              <text
                key={`house-label-${houseNum}`}
                x={pos.x}
                y={pos.y}
                fontSize="10"
                textAnchor="middle"
                fill="#6b7280"
                fontWeight="bold"
                dominantBaseline="middle"
              >
                H{houseNum}
              </text>
            );
          })}
          
          {/* ✅ IMPLEMENTING YOUR LOGIC: House content with planets positioned correctly */}
          {Array.from({ length: 12 }, (_, i) => {
            const houseNum = i + 1;
            const house = getHouseData(houseNum);
            const center = houseCenters[houseNum];
            
            if (!center) return null;
            
            // Dynamic spacing based on number of planets in house
            const planetCount = house?.planets?.length || 0;
            if (planetCount === 0) return null;
            
            // Calculate optimal spacing and positioning
            const getOptimalSpacing = (count, houseNumber) => {
              const baseSpacing = 18; // Base vertical spacing between planets
              const maxSpacing = 25;  // Maximum spacing for houses with few planets
              const minSpacing = 12;  // Minimum spacing for crowded houses
              
              // Adjust spacing based on planet count
              let spacing = baseSpacing;
              if (count <= 2) spacing = maxSpacing;
              else if (count >= 4) spacing = minSpacing;
              
              // Calculate starting Y position to center the group
              const totalHeight = (count - 1) * spacing;
              const startY = center.y - (totalHeight / 2);
              
              return { spacing, startY };
            };
            
            const { spacing, startY } = getOptimalSpacing(planetCount, houseNum);
            
            return (
              <g key={`house-${houseNum}`} onClick={() => onHouseClick?.(house)} className="cursor-pointer">
                {/* Planets with dynamic spacing */}
                {house?.planets?.map((planet, planetIdx) => {
                  const planetName = typeof planet === 'string' ? planet : planet.name;
                  
                  // Calculate position for this planet
                  const planetY = startY + (planetIdx * spacing);
                  
                  // Slight horizontal offset for crowded houses to improve readability
                  const xOffset = planetCount > 3 ? (planetIdx % 2 === 0 ? -10 : 10) : 0;
                  const planetX = center.x + xOffset;
                  
                  return (
                    <text
                      key={`${houseNum}-${planetName}-${planetIdx}`}
                      x={planetX}
                      y={planetY}
                      fontSize={planetCount > 3 ? "10" : "12"} // Smaller font for crowded houses
                      textAnchor="middle"
                      fill="#dc2626"
                      fontWeight="600"
                      dominantBaseline="middle"
                    >
                      {formatPlanetDisplay(planet, house, planetIdx, planetCount)}
                    </text>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Planet symbols legend */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="text-center mb-2">
          <strong>Planet Symbols:</strong>
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs">
          {Object.entries(planetSymbols).map(([name, symbol]) => (
            <div key={name} className="flex items-center gap-1 justify-center">
              <span className="text-base font-bold text-red-600">{symbol}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NorthIndianChart;
