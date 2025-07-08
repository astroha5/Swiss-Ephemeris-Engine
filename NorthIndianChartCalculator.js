/**
 * 🧭 NORTH INDIAN CHART CALCULATOR
 * 
 * This module implements the exact North Indian chart logic:
 * 1. Houses are FIXED (never move)
 * 2. Signs rotate based on the Ascendant
 * 3. Planets follow signs
 */

// STEP 1: FIXED HOUSE COORDINATES (Never Change)
export const FIXED_HOUSE_COORDINATES = {
  1: { x: 350, y: 330 },   // H1 - Center-Right (Ascendant position)
  2: { x: 175, y: 150 },   // H2 - Top-Left
  3: { x: 150, y: 175 },   // H3 - Top-Center-Left
  4: { x: 330, y: 350 },   // H4 - Center-Left
  5: { x: 150, y: 525 },   // H5 - Bottom-Left
  6: { x: 175, y: 550 },   // H6 - Bottom-Left corner
  7: { x: 350, y: 370 },   // H7 - Bottom-Center
  8: { x: 525, y: 550 },   // H8 - Bottom-Right corner
  9: { x: 550, y: 525 },   // H9 - Bottom-Right
  10: { x: 370, y: 350 },  // H10 - Center-Right inner
  11: { x: 550, y: 175 },  // H11 - Top-Right
  12: { x: 525, y: 150 }   // H12 - Top-Right corner
};

// Zodiac signs in order (1-indexed)
export const ZODIAC_SIGNS = [
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

/**
 * STEP 2: Calculate Sign-to-House Mapping
 * Based on the Ascendant sign, determine which sign goes in which house
 * 
 * @param {number} ascendantSignNumber - The sign number of the Ascendant (1-12)
 * @returns {Object} - Mapping of house number to sign information
 */
export function calculateSignToHouseMapping(ascendantSignNumber) {
  const signToHouseMapping = {};
  
  for (let houseNumber = 1; houseNumber <= 12; houseNumber++) {
    // Calculate the sign for this house
    // Formula: (ascendantSignNumber - 1 + houseNumber - 1) % 12 + 1
    const signNumber = ((ascendantSignNumber - 1 + houseNumber - 1) % 12) + 1;
    const signName = ZODIAC_SIGNS[signNumber];
    
    signToHouseMapping[houseNumber] = {
      houseNumber,
      signNumber,
      signName,
      coordinates: FIXED_HOUSE_COORDINATES[houseNumber]
    };
  }
  
  return signToHouseMapping;
}

/**
 * STEP 3: Place Planets in Houses
 * Based on each planet's sign, place it in the appropriate house
 * 
 * @param {Array} planetaryData - Array of planet objects with sign information
 * @param {Object} signToHouseMapping - Mapping from calculateSignToHouseMapping
 * @returns {Object} - Chart data with planets positioned in houses
 */
export function placePlanetsInHouses(planetaryData, signToHouseMapping) {
  // Initialize empty houses
  const houses = {};
  for (let i = 1; i <= 12; i++) {
    const houseInfo = signToHouseMapping[i];
    houses[i] = {
      number: i,
      sign: houseInfo.signName,
      signNumber: houseInfo.signNumber,
      planets: [],
      degrees: [],
      coordinates: houseInfo.coordinates
    };
  }
  
  // Place each planet in the appropriate house
  planetaryData.forEach(planet => {
    // Find which house contains this planet's sign
    const houseNumber = Object.keys(signToHouseMapping).find(houseNum => 
      signToHouseMapping[houseNum].signName === planet.sign
    );
    
    if (houseNumber) {
      houses[houseNumber].planets.push(planet.name);
      houses[houseNumber].degrees.push(planet.degree || '0°00\'');
    }
  });
  
  // Convert to array format expected by the chart component
  return Object.values(houses);
}

/**
 * Main Chart Calculator Function
 * Combines all steps to generate complete North Indian chart data
 * 
 * @param {number} ascendantSignNumber - The Ascendant sign number (1-12)
 * @param {Array} planetaryData - Array of planet objects
 * @returns {Object} - Complete chart data ready for rendering
 */
export function calculateNorthIndianChart(ascendantSignNumber, planetaryData) {
  console.log('🧭 Calculating North Indian Chart...');
  console.log('📍 Ascendant Sign Number:', ascendantSignNumber);
  console.log('🪐 Planetary Data:', planetaryData);
  
  // Step 1: Houses are already fixed (FIXED_HOUSE_COORDINATES)
  console.log('✅ Step 1: Using fixed house coordinates');
  
  // Step 2: Calculate sign-to-house mapping
  const signToHouseMapping = calculateSignToHouseMapping(ascendantSignNumber);
  console.log('✅ Step 2: Sign-to-house mapping calculated:', signToHouseMapping);
  
  // Step 3: Place planets in houses
  const houses = placePlanetsInHouses(planetaryData, signToHouseMapping);
  console.log('✅ Step 3: Planets placed in houses:', houses);
  
  return {
    houses,
    ascendant: {
      signNumber: ascendantSignNumber,
      signName: ZODIAC_SIGNS[ascendantSignNumber],
      house: 1
    },
    metadata: {
      calculationMethod: 'North Indian',
      steps: [
        'Fixed house coordinates',
        'Sign rotation based on Ascendant',
        'Planet placement by sign'
      ]
    }
  };
}

/**
 * Helper function to validate chart data
 */
export function validateChartData(chartData) {
  const issues = [];
  
  if (!chartData.houses || !Array.isArray(chartData.houses)) {
    issues.push('Missing or invalid houses array');
  }
  
  if (chartData.houses && chartData.houses.length !== 12) {
    issues.push(`Expected 12 houses, got ${chartData.houses.length}`);
  }
  
  // Check if all houses have required properties
  chartData.houses?.forEach((house, index) => {
    const required = ['number', 'sign', 'signNumber', 'planets', 'degrees'];
    required.forEach(prop => {
      if (!house.hasOwnProperty(prop)) {
        issues.push(`House ${index + 1} missing property: ${prop}`);
      }
    });
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Test function using the provided birth details
 */
export function testWithRahulJanaData() {
  // Corrected planetary data for Rahul Jana (30 Sep 2000, 12:00 PM, Kolkata)
  // Based on your corrections:
  // - Jupiter and Saturn are both in Taurus (will be in H6)
  // - Moon, Venus, and Mercury are all in Libra (will be in H11)
  const samplePlanetaryData = [
    { name: 'Sun', sign: 'Virgo', degree: '13°32\'' },
    { name: 'Moon', sign: 'Libra', degree: '14°28\'' },
    { name: 'Mars', sign: 'Leo', degree: '14°28\'' },
    { name: 'Mercury', sign: 'Libra', degree: '8°13\'' },  // Corrected: Mercury in Libra
    { name: 'Jupiter', sign: 'Taurus', degree: '17°22\'' },
    { name: 'Venus', sign: 'Libra', degree: '13°00\'' },
    { name: 'Saturn', sign: 'Taurus', degree: '6°49\'' },   // Corrected: Saturn in Taurus
    { name: 'Rahu', sign: 'Gemini', degree: '27°25\'' },
    { name: 'Ketu', sign: 'Sagittarius', degree: '27°25\'' }
  ];
  
  // Assuming Sagittarius (9) as Ascendant for this birth time and location
  const ascendantSignNumber = 9; // Sagittarius
  
  const chartData = calculateNorthIndianChart(ascendantSignNumber, samplePlanetaryData);
  
  console.log('🎯 Test Results for Rahul Jana:');
  console.log('Chart Data:', chartData);
  
  // Validate the result
  const validation = validateChartData(chartData);
  console.log('Validation:', validation);
  
  return chartData;
}

// Export for use in React components
export default {
  FIXED_HOUSE_COORDINATES,
  ZODIAC_SIGNS,
  calculateSignToHouseMapping,
  placePlanetsInHouses,
  calculateNorthIndianChart,
  validateChartData,
  testWithRahulJanaData
};
