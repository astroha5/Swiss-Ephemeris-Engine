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

  // Calculate house center points (centroids) for proper positioning
  // UPDATED with new mapping: H5→H12, H6→H11, H7→H5, H8→H6, H9→H7, H11→H9, H12→H8
  const getHouseCenterPoints = () => {
    const centers = {};
    
    // Apply the new house mapping
    centers[1] = { x: mid + 80, y: mid - 80 };    // H1 unchanged
    centers[2] = { x: mid, y: mid - 100 };        // H2 unchanged
    centers[3] = { x: mid + 100, y: mid };        // H3 unchanged
    centers[4] = { x: mid + 80, y: mid - 80 };    // H4 unchanged
    centers[5] = { x: mid + 100, y: mid };        // H5 at H12 position
    centers[6] = { x: mid + 80, y: mid + 80 };    // H6 at H11 position
    centers[7] = { x: mid, y: mid + 100 };        // H7 at H5 position
    centers[8] = { x: mid - 80, y: mid + 80 };    // H8 at H6 position
    centers[9] = { x: mid - 100, y: mid };        // H9 at H7 position
    centers[10] = { x: mid, y: mid + 100 };       // H10 unchanged
    centers[11] = { x: mid - 80, y: mid + 80 };   // H11 at H9 position
    centers[12] = { x: mid + 100, y: mid };       // H12 at H8 position
    
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
  
  // House number positions (H1-H12) - UPDATED with new mapping
  // New Mapping: H5→H12, H6→H11, H7→H5, H8→H6, H9→H7, H11→H9, H12→H8
  const housePositions = {
    1: { x: 300, y: 280 },    // H1 unchanged
    2: { x: 150, y: 130 },    // H2 unchanged
    3: { x: 130, y: 150 },    // H3 unchanged
    4: { x: 280, y: 300 },    // H4 unchanged
    5: { x: 130, y: 450 },    // H5 at H12 position
    6: { x: 150, y: 470 },    // H6 at H11 position
    7: { x: 300, y: 320 },    // H7 at H5 position
    8: { x: 450, y: 470 },    // H8 at H6 position
    9: { x: 470, y: 450 },    // H9 at H7 position
    10: { x: 330, y: 300 },   // H10 unchanged
    11: { x: 470, y: 150 },   // H11 at H9 position
    12: { x: 450, y: 130 }    // H12 at H8 position
  };

  const houseCenters = getHouseCenterPoints();

  const getHouseData = (houseNumber) => {
    return chartData?.houses?.find((h) => h.number === houseNumber);
  };

  const formatPlanetDisplay = (planet) => {
    const symbol = planetSymbols[planet.name];
    return symbol ? `${symbol} ${planet.name}` : planet.name;
  };

  return (
    <div className={`north-indian-chart text-center ${className}`}>
      <h2 className="font-heading text-xl font-semibold mb-6">{title}</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-[650px] mx-auto">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          height="auto"
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
          
          {/* House content - Properly spaced and layered */}
          {Array.from({ length: 12 }, (_, i) => {
            const houseNum = i + 1;
            const house = getHouseData(houseNum);
            const center = houseCenters[houseNum];
            
            if (!center) return null;
            
            const yHouseNumber = center.y - 25;  // House number above center
            const ySignNumber = center.y;        // Sign number at center (large, bold)
            const yPlanetsStart = center.y + 25; // Planets below center
            
            return (
              <g key={`house-${houseNum}`} onClick={() => onHouseClick?.(house)} className="cursor-pointer">
                
                {/* Planets - Medium, red, bottom, stacked with proper spacing */}
                {house?.planets?.map((planet, planetIdx) => (
                  <text
                    key={`${houseNum}-${planet.name}-${planetIdx}`}
                    x={center.x}
                    y={yPlanetsStart + (planetIdx * 20)} // 20px line spacing
                    fontSize="12"
                    textAnchor="middle"
                    fill="#dc2626"
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    {formatPlanetDisplay(planet)} {planet.degree}°
                  </text>
                ))}
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
