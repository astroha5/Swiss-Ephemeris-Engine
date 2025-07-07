import React from "react";

const NorthIndianChart = ({ chartData, title = "Lagna Chart (D1)", className = "", onHouseClick }) => {
  const size = 600; // Increased canvas size for spacious layout
  const mid = size / 2; // 300
  const padding = 60; // Padding from edges

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

  // House center positions optimized for planet placement
  const getHouseCenterPoints = () => {
    const centers = {};
    
    // Updated coordinates based on specified positions
    centers[1] = { x: 300, y: 155 };   // H1 - Ketu position
    centers[2] = { x: 150, y: 130 };   // H2 (left-top)
    centers[3] = { x: 130, y: 150 };   // H3 (left-center-top)
    centers[4] = { x: 450, y: 300 };   // H4 - Sun position
    centers[5] = { x: 150, y: 540 };   // H5 - Jupiter position (y: 530) and Saturn (y: 550)
    centers[6] = { x: 150, y: 470 };   // H6 (left-bottom-edge)
    centers[7] = { x: 300, y: 450 };   // H7 - Rahu position
    centers[8] = { x: 550, y: 450 };   // H8 - Mars position
    centers[9] = { x: 470, y: 450 };   // H9 (right-bottom-center)
    centers[10] = { x: 330, y: 300 };  // H10 (center-right)
    centers[11] = { x: 550, y: 140 };  // H11 - Venus (y: 120), Moon (y: 150), Mercury (y: 180)
    centers[12] = { x: 450, y: 130 };  // H12 (right-top-edge)
    
    return centers;
  };

  // Sign number positions in corners and edges with proper visibility offsets
  const signPositions = {
    1: { x: 148, y: 100 },          // Top-left corner (shifted inward)
    2: { x: 300, y: 260 },                   // Top edge
    3: { x: 450, y: 100 },   // Top-right corner (shifted inward)
    4: { x: 500, y: 150 },            // Right edge
    5: { x: 350, y: 300 }, // Bottom-right corner (shifted inward)
    6: { x: 500, y: 450 },            // Bottom edge
    7: { x: 450, y: 500 },   // Bottom-left corner (shifted inward)
    8: { x: 300, y: 350 },                   // Left edge
    9: { x: 150, y: 500 },                  // Inner top-left (adjusted)
    10: { x: 100, y: 450 },                 // Inner top-right (adjusted)
    11: { x: 250, y: 300 },                 // Inner bottom-right (adjusted)
    12: { x: 100, y: 150 }                  // Inner bottom-left (adjusted)
  };
  
  // House label positions matching exact browser coordinates
  const housePositions = {
    1: { x: 300, y: 280 },   // H1
    2: { x: 150, y: 130 },   // H2
    3: { x: 130, y: 150 },   // H3
    4: { x: 280, y: 300 },   // H4
    5: { x: 130, y: 450 },   // H5
    6: { x: 150, y: 470 },   // H6
    7: { x: 300, y: 320 },   // H7
    8: { x: 450, y: 470 },   // H8
    9: { x: 470, y: 450 },   // H9
    10: { x: 320, y: 300 },  // H10
    11: { x: 470, y: 150 },  // H11
    12: { x: 450, y: 130 }   // H12
  };

  const houseCenters = getHouseCenterPoints();

  const getHouseData = (houseNumber) => {
    return chartData?.houses?.find((h) => h.number === houseNumber);
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
          
          {/* Sign numbers in corners/edges - Large, centered */}
          {Array.from({ length: 12 }, (_, i) => {
            const signNum = i + 1;
            const pos = signPositions[signNum];
            if (!pos) return null;
            
            return (
              <text
                key={`sign-${signNum}`}
                x={pos.x}
                y={pos.y}
                fontSize="18"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000"
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
          
          {/* House content - Dynamically spaced planets */}
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
