import React from "react";

const NorthIndianChart = ({ chartData, title = "Lagna Chart (D1)", className = "", onHouseClick }) => {
  const size = 700; // Canvas size - Made bigger as requested
  const mid = size / 2; // 350

  // Debug: Log received data
  console.log('🔍 NorthIndianChart received chartData:', chartData);
  console.log('🏠 Houses data:', chartData?.houses);

  // 🧭 NORTH INDIAN CHART LOGIC - FIXED HOUSE COORDINATES
  // Step 1: Houses are FIXED (never move)
  
  // House label coordinates (for H1, H2, etc. text)
  const HOUSE_LABEL_COORDINATES = {
    1: { x: 350, y: 330 },   // H1 - always top center
    2: { x: 175, y: 150 },   // H2 
    3: { x: 150, y: 175 },   // H3
    4: { x: 330, y: 350 },   // H4
    5: { x: 150, y: 525 },   // H5
    6: { x: 175, y: 550 },   // H6
    7: { x: 350, y: 370 },   // H7 
    8: { x: 525, y: 550 },   // H8
    9: { x: 550, y: 525 },   // H9
    10: { x: 370, y: 350 },  // H10
    11: { x: 550, y: 175 },  // H11
    12: { x: 525, y: 150 }   // H12
  };
  
  // Planet coordinates (updated with new specifications)
  const PLANET_COORDINATES = {
    1: { x: 350, y: 175 },   // H1 - Ketu position
    2: { x: 175, y: 50 },    // H2 - Sun & Mercury position (updated)
    3: { x: 60, y: 175 },    // H3 - Jupiter position (updated)
    4: { x: 175, y: 350 },   // H4 - Venus position (updated)
    5: { x: 50, y: 545 },   // H5 - positioned above house label
    6: { x: 175, y: 620 },   // H6 - Jupiter & Saturn position (with spacing)
    7: { x: 350, y: 525 },   // H7 - Rahu position
    8: { x: 525, y: 625 },   // H8 - positioned below house label
    9: { x: 640, y: 525 },   // H9 - Mars position
    10: { x: 525, y: 350 },  // H10 - Sun position
    11: { x: 640, y: 175 },  // H11 - Moon, Mercury, Venus position (with spacing)
    12: { x: 525, y: 40 }    // H12 - Moon & Mars position (updated)
  };
  
  // Sign number coordinates (positioned near house labels for North Indian chart)
  const SIGN_COORDINATES = {
    1: { x: 350, y: 300 },   // H1 - top center (above house label)
    2: { x: 175, y: 120 },   // H2 - top left
    3: { x: 120, y: 175 },   // H3 - left
    4: { x: 300, y: 350 },   // H4 - center left (left of house label)
    5: { x: 120, y: 525 },   // H5 - bottom left
    6: { x: 175, y: 580 },   // H6 - bottom left
    7: { x: 350, y: 400 },   // H7 - bottom center (below house label)
    8: { x: 525, y: 580 },   // H8 - bottom right
    9: { x: 580, y: 525 },   // H9 - bottom right
    10: { x: 400, y: 350 },  // H10 - center right (right of house label)
    11: { x: 580, y: 175 },  // H11 - top right
    12: { x: 525, y: 120 }   // H12 - top right
  };

  // Zodiac signs in order (1-indexed)
  const ZODIAC_SIGNS = [
    '',           // 0 - placeholder
    'Aries',      // 1
    'Taurus',     // 2
    'Gemini',     // 3
    'Cancer',     // 4
    'Leo',        // 5
    'Virgo',      // 6
    'Libra',      // 7
    'Scorpio',    // 8
    'Sagittarius', // 9
    'Capricorn',  // 10
    'Aquarius',   // 11
    'Pisces'      // 12
  ];

  // Step 2: Calculate Sign-to-House mapping based on Ascendant
  const calculateSignToHouseMapping = (ascendantSignNumber) => {
    const signToHouseMapping = {};
    
    for (let houseNumber = 1; houseNumber <= 12; houseNumber++) {
      // Formula: (ascendantSignNumber - 1 + houseNumber - 1) % 12 + 1
      const signNumber = ((ascendantSignNumber - 1 + houseNumber - 1) % 12) + 1;
      const signName = ZODIAC_SIGNS[signNumber];
      
      signToHouseMapping[houseNumber] = {
        houseNumber,
        signNumber,
        signName,
        coordinates: PLANET_COORDINATES[houseNumber]
      };
    }
    
    return signToHouseMapping;
  };

  // Step 3: Use the chart data as-is (backend already applies North Indian logic)
  const processChartData = () => {
    console.log('🧭 Processing Chart Data...');
    
    if (!chartData?.houses || chartData.houses.length === 0) {
      console.warn('❌ No chart data available');
      return { houses: [], ascendantSignNumber: 9 }; // Default to Sagittarius
    }

    // Find the Ascendant (House 1) - backend has already positioned this correctly
    const ascendantHouse = chartData.houses.find(h => h.number === 1);
    if (!ascendantHouse) {
      console.warn('❌ No Ascendant house found');
      return { houses: chartData.houses, ascendantSignNumber: 9 };
    }

    const ascendantSignNumber = ascendantHouse.signNumber;
    console.log('📍 Ascendant Sign Number:', ascendantSignNumber);
    console.log('📍 Ascendant Sign Name:', ascendantHouse.sign);
    console.log('📍 Full Ascendant House:', ascendantHouse);
    console.log('📍 All houses:', chartData.houses);

    // Use the houses as provided by backend (already in correct North Indian format)
    const processedHouses = chartData.houses.map(house => ({
      ...house,
      coordinates: PLANET_COORDINATES[house.number]
    }));

    console.log('✅ Processed houses:', processedHouses);
    
    return {
      houses: processedHouses,
      ascendantSignNumber
    };
  };

  // Apply the logic
  const { houses: processedHouses, ascendantSignNumber } = processChartData();
  
  // Calculate sign-to-house mapping for use in rendering
  const signToHouseMapping = calculateSignToHouseMapping(ascendantSignNumber);
  
  const getHouseData = (houseNumber) => {
    const houseData = processedHouses.find((h) => h.number === houseNumber);
    
    // Debug logging for ALL house data
    console.log(`🏠 House ${houseNumber}: Sign ${houseData?.signNumber} (${houseData?.sign}) - Planets: ${houseData?.planets?.join(', ') || 'None'}`);
    
    return houseData || { 
      number: houseNumber,
      planets: [], 
      sign: '', 
      signNumber: null,
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
          
          {/* House numbers (H1-H12) with FIXED positions */}
          {Array.from({ length: 12 }, (_, i) => {
            const houseNum = i + 1;
            const pos = HOUSE_LABEL_COORDINATES[houseNum];
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
          {/* Sign numbers positioned using fixed SIGN_COORDINATES with dynamic rotation */}
          {Array.from({ length: 12 }, (_, i) => {
              const houseNumber = i + 1;
              // Fixed formula: House 1 gets ascendantSignNumber, House 2 gets next sign, etc.
              const signNumber = ((ascendantSignNumber - 1 + houseNumber - 1) % 12) + 1;
              const pos = SIGN_COORDINATES[houseNumber]; // Use houseNumber directly

              return (
                  <text
                  key={`sign-${signNumber}`}
                  x={pos.x}
                  y={pos.y}
                  fontSize="12"
                  textAnchor="middle"
                  fill="#059669"
                  fontWeight="500"
                  dominantBaseline="middle"
               >
                {signNumber}
               </text>
               );
           })}
          
          {/* 🧭 IMPLEMENTING YOUR LOGIC: House content with planets positioned correctly */}
          {Array.from({ length: 12 }, (_, i) => {
            const houseNum = i + 1;
            const house = getHouseData(houseNum);
            const center = PLANET_COORDINATES[houseNum];
            
            if (!center) return null;
            
            // Dynamic spacing based on number of planets in house
            const planetCount = house?.planets?.length || 0;
            if (planetCount === 0) return null;
            
            // Calculate optimal spacing and positioning based on your coordinates
            const getOptimalSpacing = (count, houseNumber) => {
              // Special handling for houses with specific coordinate requirements
              if (houseNumber === 2 && count >= 2) {
                // H2: Sun at y=50, Mercury at y=60 (10px spacing)
                return { spacing: 10, startY: 50 };
              }
              
              if (houseNumber === 6 && count >= 2) {
                // H6: Jupiter at y=620, Saturn at y=650 (30px spacing)
                return { spacing: 30, startY: 620 };
              }
              
              if (houseNumber === 11 && count >= 2) {
                // H11: Moon at y=153, Mercury at y=175, Venus at y=197 (22px spacing)
                return { spacing: 22, startY: 153 };
              }
              
              if (houseNumber === 12 && count >= 2) {
                // H12: Moon at y=40, Mars at y=60 (20px spacing)
                return { spacing: 20, startY: 40 };
              }
              
              // Default spacing for other houses
              const baseSpacing = 22;
              const maxSpacing = 30;
              const minSpacing = 16;
              
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
      
      {/* Logic Explanation */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="text-center mb-2">
          <strong>🧭 North Indian Chart Logic Applied:</strong>
        </div>
        <div className="text-xs space-y-1">
          <p>✅ Step 1: Houses are FIXED (never move)</p>
          <p>✅ Step 2: Signs rotate based on Ascendant ({ZODIAC_SIGNS[ascendantSignNumber]})</p>
          <p>✅ Step 3: Planets follow their signs</p>
        </div>
      </div>
    </div>
  );
};

export default NorthIndianChart;
