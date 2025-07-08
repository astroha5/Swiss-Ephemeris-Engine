import React from "react";

const NorthIndianChart = ({ chartData, title = "Lagna Chart (D1)", className = "", onHouseClick }) => {
  const size = 700; // Canvas size - Made bigger as requested
  const mid = size / 2; // 350

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
    
    // Updated coordinates based on larger North Indian chart layout
    centers[1] = { x: 525, y: 350 };   // H1 - Center-Right (Ascendant position)
    centers[2] = { x: 525, y: 175 };   // H2 - Top-Right
    centers[3] = { x: 350, y: 120 };   // H3 - Top-Center
    centers[4] = { x: 175, y: 175 };   // H4 - Top-Left
    centers[5] = { x: 175, y: 350 };   // H5 - Center-Left
    centers[6] = { x: 175, y: 525 };   // H6 - Bottom-Left
    centers[7] = { x: 350, y: 580 };   // H7 - Bottom-Center
    centers[8] = { x: 525, y: 525 };   // H8 - Bottom-Right
    centers[9] = { x: 445, y: 465 };   // H9 - Inner Bottom-Right
    centers[10] = { x: 445, y: 235 };  // H10 - Inner Top-Right
    centers[11] = { x: 255, y: 235 };  // H11 - Inner Top-Left
    centers[12] = { x: 255, y: 465 };  // H12 - Inner Bottom-Left
    
    return centers;
  };

  // House label positions with corrected coordinates for larger layout
  const housePositions = {
    1: { x: 350, y: 330 },   // H1 - Corrected position
    2: { x: 175, y: 150 },   // H2 - Corrected position
    3: { x: 150, y: 175 },   // H3 - Corrected position
    4: { x: 330, y: 350 },   // H4 - Corrected position
    5: { x: 150, y: 525 },   // H5 - Corrected position
    6: { x: 175, y: 550 },   // H6 - Corrected position
    7: { x: 350, y: 370 },   // H7 - Corrected position
    8: { x: 525, y: 550 },   // H8 - Missing from your list, keeping original
    9: { x: 550, y: 525 },   // H9 - Corrected position
    10: { x: 370, y: 350 },  // H10 - Corrected position
    11: { x: 550, y: 175 },  // H11 - Corrected position
    12: { x: 525, y: 150 }   // H12 - Corrected position
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
    const degree = typeof planet === 'object' ? planet.degree : houseData?.degrees?.[planetIdx];
    
    // Format degree to short version (e.g., Rahu 27°25')
    const formatShortDegree = (degreeString) => {
      if (!degreeString) return '';
      // Extract degree and minute, remove seconds
      const match = degreeString.match(/(\d+)°(\d+)['']/);
      if (match) {
        return `${match[1]}°${match[2]}'`;
      }
      return degreeString;
    };
    
    const shortDegree = degree ? formatShortDegree(degree) : '';
    
    // Compact format for crowded houses (3+ planets) - NO SYMBOLS
    if (planetCount >= 3) {
      return shortDegree ? `${planetName} ${shortDegree}` : planetName;
    }
    
    // Standard format for houses with 1-2 planets - NO SYMBOLS
    return shortDegree ? `${planetName} ${shortDegree}` : planetName;
  };

  return (
    <div className={`north-indian-chart text-center ${className}`}>
      <h2 className="font-heading text-xl font-semibold mb-6">{title}</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-[750px] mx-auto">
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
          
          {/* Sign numbers in corners/edges - Smaller as requested */}
          {Array.from({ length: 12 }, (_, i) => {
            const signNum = i + 1;
            // Calculate positions for sign numbers around the chart
            const positions = {
              1: { x: 175, y: 100 },   // Top-left
              2: { x: 350, y: 60 },    // Top-center
              3: { x: 525, y: 100 },   // Top-right
              4: { x: 580, y: 175 },   // Right-top
              5: { x: 580, y: 350 },   // Right-center
              6: { x: 580, y: 525 },   // Right-bottom
              7: { x: 525, y: 600 },   // Bottom-right
              8: { x: 350, y: 640 },   // Bottom-center
              9: { x: 175, y: 600 },   // Bottom-left
              10: { x: 120, y: 525 },  // Left-bottom
              11: { x: 120, y: 350 },  // Left-center
              12: { x: 120, y: 175 }   // Left-top
            };
            
            const pos = positions[signNum];
            if (!pos) return null;
            
            return (
              <text
                key={`sign-${signNum}`}
                x={pos.x}
                y={pos.y}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#666"
              >
                {signNum}
              </text>
            );
          })}
          
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
            
            // Calculate optimal spacing and positioning for larger layout
            const getOptimalSpacing = (count, houseNumber) => {
              const baseSpacing = 22; // Increased base spacing for larger layout
              const maxSpacing = 30;  // Increased maximum spacing
              const minSpacing = 16;  // Increased minimum spacing
              
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
                  const xOffset = planetCount > 3 ? (planetIdx % 2 === 0 ? -12 : 12) : 0;
                  const planetX = center.x + xOffset;
                  
                  return (
                    <text
                      key={`${houseNum}-${planetName}-${planetIdx}`}
                      x={planetX}
                      y={planetY}
                      fontSize={planetCount > 3 ? "11" : "13"} // Slightly larger font for bigger layout
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
