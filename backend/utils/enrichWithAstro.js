const enhancedSwissEphemeris = require('../services/enhancedSwissEphemeris');
const logger = require('./logger');

/**
 * Enriches an event with astrological data
 * @param {Date} timestamp - Event timestamp
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {string} city - City name (optional)
 * @param {string} timezone - Timezone (default: 'UTC')
 * @returns {Object} Enriched astrological data
 */
async function enrichWithAstroData(timestamp, lat, lon, city = '', timezone = 'UTC') {
  try {
    logger.info(`🌟 Starting astrological enrichment for event: ${timestamp.toISOString()}`);
    logger.info(`📍 Location: ${city} (${lat}, ${lon})`);
    
    // Convert timestamp to required format
    const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = timestamp.toISOString().split('T')[1].substring(0, 5); // HH:MM
    
    logger.info(`📅 Formatted date/time: ${date} ${time}`);
    
    // Get Julian Day using enhanced Swiss Ephemeris
    const julianDay = enhancedSwissEphemeris.getJulianDay(
      date, 
      time, 
      timezone,
      city,
      { lat, lng: lon }
    );
    
    logger.info(`🔢 Julian Day: ${julianDay}`);
    
    // Calculate planetary positions
    const planetaryData = enhancedSwissEphemeris.getPlanetaryPositions(julianDay, false); // Use sidereal
    
    if (!planetaryData.success) {
      throw new Error('Failed to calculate planetary positions');
    }
    
    const planets = planetaryData.planets;
    
    // Calculate ascendant
    const ascendant = enhancedSwissEphemeris.calculateAscendant(julianDay, lat, lon, false);
    
    logger.info(`🌅 Ascendant: ${ascendant.sign} ${ascendant.degreeFormatted}`);
    
    // Create astrological snapshot
    const astroSnapshot = {
      sun: {
        sign: planets.sun.sign,
        degree: planets.sun.degreeInSign,
        nakshatra: planets.sun.nakshatra,
        longitude: planets.sun.longitude
      },
      moon: {
        sign: planets.moon.sign,
        degree: planets.moon.degreeInSign,
        nakshatra: planets.moon.nakshatra,
        longitude: planets.moon.longitude
      },
      mars: {
        sign: planets.mars.sign,
        degree: planets.mars.degreeInSign,
        nakshatra: planets.mars.nakshatra,
        longitude: planets.mars.longitude
      },
      mercury: {
        sign: planets.mercury.sign,
        degree: planets.mercury.degreeInSign,
        nakshatra: planets.mercury.nakshatra,
        longitude: planets.mercury.longitude
      },
      jupiter: {
        sign: planets.jupiter.sign,
        degree: planets.jupiter.degreeInSign,
        nakshatra: planets.jupiter.nakshatra,
        longitude: planets.jupiter.longitude
      },
      venus: {
        sign: planets.venus.sign,
        degree: planets.venus.degreeInSign,
        nakshatra: planets.venus.nakshatra,
        longitude: planets.venus.longitude
      },
      saturn: {
        sign: planets.saturn.sign,
        degree: planets.saturn.degreeInSign,
        nakshatra: planets.saturn.nakshatra,
        longitude: planets.saturn.longitude
      },
      rahu: {
        sign: planets.rahu.sign,
        degree: planets.rahu.degreeInSign,
        nakshatra: planets.rahu.nakshatra,
        longitude: planets.rahu.longitude
      },
      ketu: {
        sign: planets.ketu.sign,
        degree: planets.ketu.degreeInSign,
        nakshatra: planets.ketu.nakshatra,
        longitude: planets.ketu.longitude
      },
      ascendant: {
        sign: ascendant.sign,
        degree: ascendant.degreeInSign,
        nakshatra: ascendant.nakshatra,
        longitude: ascendant.longitude
      }
    };
    
    // Calculate Vedic aspects (Drishti)
    const aspects = calculateVedicDrishti(astroSnapshot);
    
    logger.info(`✨ Astrological enrichment completed successfully`);
    logger.info(`🔗 Found ${aspects.length} aspects`);
    
    return {
      astroSnapshot,
      aspects,
      julianDay,
      success: true
    };
    
  } catch (error) {
    logger.error(`❌ Error in astrological enrichment: ${error.message}`);
    throw error;
  }
}

/**
 * Calculate Vedic Drishti (aspects) based on house positions
 * @param {Object} astroSnapshot - Astrological snapshot with planetary positions
 * @returns {Array} Array of Vedic aspects
 */
function calculateVedicDrishti(astroSnapshot) {
  const aspects = [];
  
  // First, calculate house positions from ascendant
  const housePositions = calculateHousePositions(astroSnapshot);
  
  // Define Vedic Drishti rules for each planet
  const drishtiRules = {
    sun: [7],           // 7th house only
    moon: [7],          // 7th house only
    mercury: [7],       // 7th house only
    venus: [7],         // 7th house only
    jupiter: [5, 7, 9], // 5th, 7th, 9th houses
    mars: [4, 7, 8],    // 4th, 7th, 8th houses
    saturn: [3, 7, 10], // 3rd, 7th, 10th houses
    rahu: [5, 7, 9],    // Optional: 5th, 7th, 9th (some traditions)
    ketu: [5, 7, 9]     // Optional: 5th, 7th, 9th (some traditions)
  };
  
  // Calculate aspects for each planet
  Object.entries(housePositions).forEach(([planet, house]) => {
    if (planet === 'ascendant') return; // Skip ascendant
    
    const aspectHouses = drishtiRules[planet] || [7]; // Default to 7th house
    
    aspectHouses.forEach(aspectHouse => {
      // Calculate which house this planet aspects
      const targetHouse = ((house - 1 + aspectHouse - 1) % 12) + 1;
      
      // Find planets in the target house
      const planetsInTargetHouse = Object.entries(housePositions)
        .filter(([p, h]) => h === targetHouse && p !== planet && p !== 'ascendant')
        .map(([p]) => p);
      
      // Create aspect entries
      planetsInTargetHouse.forEach(targetPlanet => {
        aspects.push({
          fromPlanet: planet,
          toPlanet: targetPlanet,
          fromHouse: house,
          toHouse: targetHouse,
          aspectType: 'drishti',
          description: `${planet.charAt(0).toUpperCase() + planet.slice(1)} (${house}th house) aspects ${targetPlanet.charAt(0).toUpperCase() + targetPlanet.slice(1)} (${targetHouse}th house)`
        });
      });
      
      // Also note if aspecting an empty house (for reference)
      if (planetsInTargetHouse.length === 0) {
        aspects.push({
          fromPlanet: planet,
          toPlanet: null,
          fromHouse: house,
          toHouse: targetHouse,
          aspectType: 'drishti_empty',
          description: `${planet.charAt(0).toUpperCase() + planet.slice(1)} (${house}th house) aspects ${targetHouse}th house`
        });
      }
    });
  });
  
  // Add conjunctions (planets in same house)
  const conjunctions = findConjunctions(housePositions);
  aspects.push(...conjunctions);
  
  logger.info(`🔮 Calculated ${aspects.filter(a => a.aspectType === 'drishti').length} Vedic Drishti aspects`);
  logger.info(`🤝 Found ${conjunctions.length} conjunctions`);
  
  return aspects;
}

/**
 * Calculate house positions of planets from ascendant
 * @param {Object} astroSnapshot - Astrological snapshot
 * @returns {Object} Planet to house position mapping
 */
function calculateHousePositions(astroSnapshot) {
  const housePositions = {};
  
  // Sign to number mapping (Aries = 1, Taurus = 2, etc.)
  const signNumbers = {
    'Aries': 1, 'Taurus': 2, 'Gemini': 3, 'Cancer': 4,
    'Leo': 5, 'Virgo': 6, 'Libra': 7, 'Scorpio': 8,
    'Sagittarius': 9, 'Capricorn': 10, 'Aquarius': 11, 'Pisces': 12
  };
  
  // Get ascendant sign number
  const ascendantSignNumber = signNumbers[astroSnapshot.ascendant.sign];
  
  // Calculate house position for each planet
  Object.entries(astroSnapshot).forEach(([planet, data]) => {
    if (data.sign) {
      const planetSignNumber = signNumbers[data.sign];
      
      // Calculate house position from ascendant
      let house = planetSignNumber - ascendantSignNumber + 1;
      if (house <= 0) house += 12;
      if (house > 12) house -= 12;
      
      housePositions[planet] = house;
    }
  });
  
  return housePositions;
}

/**
 * Find conjunctions (planets in same house)
 * @param {Object} housePositions - Planet to house mapping
 * @returns {Array} Array of conjunction aspects
 */
function findConjunctions(housePositions) {
  const conjunctions = [];
  const planets = Object.keys(housePositions).filter(p => p !== 'ascendant');
  
  // Group planets by house
  const planetsByHouse = {};
  planets.forEach(planet => {
    const house = housePositions[planet];
    if (!planetsByHouse[house]) planetsByHouse[house] = [];
    planetsByHouse[house].push(planet);
  });
  
  // Find conjunctions (2 or more planets in same house)
  Object.entries(planetsByHouse).forEach(([house, planetsInHouse]) => {
    if (planetsInHouse.length >= 2) {
      // Create conjunction aspects for all pairs
      for (let i = 0; i < planetsInHouse.length; i++) {
        for (let j = i + 1; j < planetsInHouse.length; j++) {
          conjunctions.push({
            fromPlanet: planetsInHouse[i],
            toPlanet: planetsInHouse[j],
            fromHouse: parseInt(house),
            toHouse: parseInt(house),
            aspectType: 'conjunction',
            description: `${planetsInHouse[i].charAt(0).toUpperCase() + planetsInHouse[i].slice(1)} conjunct ${planetsInHouse[j].charAt(0).toUpperCase() + planetsInHouse[j].slice(1)} in ${house}th house`
          });
        }
      }
    }
  });
  
  return conjunctions;
}

/**
 * Generate tags based on planetary positions and aspects
 * @param {Object} astroSnapshot - Astrological snapshot
 * @param {Array} aspects - Array of aspects
 * @returns {Array} Array of tags
 */
function generateAstroTags(astroSnapshot, aspects) {
  const tags = [];
  
  // Add planetary sign tags
  Object.entries(astroSnapshot).forEach(([planet, data]) => {
    if (data.sign) {
      tags.push(`${planet}-${data.sign.toLowerCase()}`);
      tags.push(`${planet}-${data.nakshatra.toLowerCase().replace(/\s+/g, '-')}`);
    }
  });
  
  // Add aspect tags
  aspects.forEach(aspect => {
    tags.push(`${aspect.planetA.toLowerCase()}-${aspect.planetB.toLowerCase()}-${aspect.type}`);
    if (aspect.exact) {
      tags.push(`exact-${aspect.type}`);
    }
  });
  
  // Add special combinations
  if (astroSnapshot.sun.sign === astroSnapshot.moon.sign) {
    tags.push('new-moon-energy');
  }
  
  if (aspects.some(a => a.type === 'conjunction' && a.exact)) {
    tags.push('exact-conjunction');
  }
  
  if (aspects.some(a => a.type === 'opposition' && a.exact)) {
    tags.push('exact-opposition');
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Get default location for a country/region
 * @param {string} country - Country code or name
 * @returns {Object} Location object with lat, lon, city
 */
function getDefaultLocation(country) {
  const defaultLocations = {
    'US': { lat: 39.8283, lon: -98.5795, city: 'United States' },
    'IN': { lat: 20.5937, lon: 78.9629, city: 'India' },
    'GB': { lat: 55.3781, lon: -3.4360, city: 'United Kingdom' },
    'CA': { lat: 56.1304, lon: -106.3468, city: 'Canada' },
    'AU': { lat: -25.2744, lon: 133.7751, city: 'Australia' },
    'DE': { lat: 51.1657, lon: 10.4515, city: 'Germany' },
    'FR': { lat: 46.2276, lon: 2.2137, city: 'France' },
    'JP': { lat: 36.2048, lon: 138.2529, city: 'Japan' },
    'CN': { lat: 35.8617, lon: 104.1954, city: 'China' },
    'RU': { lat: 61.5240, lon: 105.3188, city: 'Russia' },
    'BR': { lat: -14.2350, lon: -51.9253, city: 'Brazil' },
    'DEFAULT': { lat: 0, lon: 0, city: 'Unknown' }
  };
  
  return defaultLocations[country] || defaultLocations['DEFAULT'];
}

module.exports = {
  enrichWithAstroData,
  generateAstroTags,
  getDefaultLocation,
  calculateVedicDrishti,
  calculateHousePositions,
  findConjunctions
};
