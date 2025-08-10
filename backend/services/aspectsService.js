const logger = require('../utils/logger');
const enhancedSwissEphemeris = require('./enhancedSwissEphemeris');

class AspectsService {
  constructor() {
    // Configuration for Vedic aspects features
    this.config = {
      enableRahuKetuSpecialAspects: process.env.ENABLE_RAHU_KETU_ASPECTS === 'true' || false,
      includeDegreeBasedStrength: true,
      enableAspectToHouses: true
    };

    // Vedic aspects
    this.vedic_aspects = {
      '1': { name: 'Conjunction', orb: 5, strength: 'Strong' },
    };

    // Vedic aspect rules for house-based calculations
    // In Vedic astrology, planets aspect houses from their position
    // House counting is inclusive - planet's own house is counted as 1
    this.vedic_aspect_rules = {
      'mars': [4, 7, 8],     // Mars aspects 4th, 7th, and 8th houses from its position
      'jupiter': [5, 7, 9],  // Jupiter aspects 5th, 7th, and 9th houses from its position
      'saturn': [3, 7, 10],  // Saturn aspects 3rd, 7th, and 10th houses from its position
      'sun': [7],            // Sun aspects only 7th house from its position
      'moon': [7],           // Moon aspects only 7th house from its position
      'mercury': [7],        // Mercury aspects only 7th house from its position
      'venus': [7],          // Venus aspects only 7th house from its position
      'rahu': [7],           // Rahu aspects only 7th house (can be configured for 5th and 9th)
      'ketu': [7]            // Ketu aspects only 7th house (can be configured for 5th and 9th)
    };

    // Extended aspect rules for modern interpretation (toggleable)
    this.extended_aspect_rules = {
      'rahu': [5, 7, 9],     // Optional: Rahu with special aspects
      'ketu': [5, 7, 9]      // Optional: Ketu with special aspects
    };

    // Special aspect identifiers for UI highlighting
    this.special_aspects = {
      'mars': [4, 8],        // Mars's special aspects (excluding common 7th)
      'jupiter': [5, 9],     // Jupiter's special aspects (excluding common 7th)
      'saturn': [3, 10],     // Saturn's special aspects (excluding common 7th)
      'rahu': [5, 9],        // Rahu's optional special aspects
      'ketu': [5, 9]         // Ketu's optional special aspects
    };

    // Planet natures for aspect interpretation
    this.planet_natures = {
      'sun': 'benefic',
      'moon': 'benefic',
      'mercury': 'neutral',
      'venus': 'benefic',
      'mars': 'malefic',
      'jupiter': 'benefic',
      'saturn': 'malefic',
      'rahu': 'malefic',
      'ketu': 'malefic'
    };

    logger.info('🕉️ Vedic Aspects Service initialized with house-based drishti calculations');
    logger.info(`📐 Rahu/Ketu special aspects: ${this.config.enableRahuKetuSpecialAspects ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Calculate all aspects between planets using Vedic rules
   */
  calculateAspects(planetaryPositions, ascendant = 0) {
    try {
      const aspects = [];
      const planets = Object.keys(planetaryPositions);

      // First, calculate house positions for all planets
      const planetHouses = {};
      for (const planet of planets) {
        const position = planetaryPositions[planet];
        if (position && typeof position.longitude === 'number') {
          planetHouses[planet] = this.calculateHousePosition(position.longitude, ascendant);
        }
      }

      // Now check aspects between planets
      for (const planet1 of planets) {
        if (!planetHouses[planet1]) continue;

        const aspectHouses = this.vedic_aspect_rules[planet1.toLowerCase()];
        if (!aspectHouses) continue;

        for (const planet2 of planets) {
          if (planet1 === planet2 || !planetHouses[planet2]) continue;

          const house1 = planetHouses[planet1];
          const house2 = planetHouses[planet2];

          // Calculate inclusive house distance from planet1 to planet2
          // Counting starts from planet1's house as 1 (conjunction)
          let houseDistance = ((house2 - house1 + 12) % 12) + 1;

          // Check if this distance matches any of planet1's aspect houses
          if (aspectHouses.includes(houseDistance)) {
            const aspect = this.createVedicAspect(
              planet1,
              planet2,
              planetaryPositions[planet1],
              planetaryPositions[planet2],
              houseDistance,
              house1,
              house2
            );
            if (aspect) {
              aspects.push(aspect);
            }
          }
        }
      }

      logger.info(`Calculated ${aspects.length} Vedic planetary aspects`);
      return aspects;

    } catch (error) {
      logger.error('Error calculating Vedic aspects:', error);
      return [];
    }
  }

  /**
   * Calculate house position for a given longitude
   * Fixed to use the same logic as enhancedSwissEphemeris.calculateHouseNumber
   */
  calculateHousePosition(longitude, ascendant) {
    // Use the same sign-based calculation as the main planetary data
    const planetSignNumber = Math.floor(longitude / 30) + 1;
    const ascendantSignNumber = Math.floor(ascendant / 30) + 1;
    
    // Calculate house number based on sign difference
    let houseNumber = planetSignNumber - ascendantSignNumber + 1;
    
    // Adjust for wrap-around
    if (houseNumber <= 0) {
      houseNumber += 12;
    }
    if (houseNumber > 12) {
      houseNumber -= 12;
    }
    
    return houseNumber;
  }

  /**
   * Create a Vedic aspect object
   */
  createVedicAspect(planet1, planet2, position1, position2, houseDistance, fromHouse, toHouse) {
    // Define aspect types based on house distance
    const aspectTypes = {
      3: 'Third House Drishti',
      4: 'Fourth House Drishti', 
      5: 'Fifth House Drishti',
      7: 'Seventh House Drishti',
      8: 'Eighth House Drishti',
      9: 'Ninth House Drishti',
      10: 'Tenth House Drishti'
    };

    const aspectName = aspectTypes[houseDistance] || `${houseDistance}th House Aspect`;
    
    // Calculate orb based on exact degrees
    const longitude1 = position1.longitude;
    const longitude2 = position2.longitude;
    let separation = Math.abs(longitude1 - longitude2);
    if (separation > 180) separation = 360 - separation;
    
    // Map house distance to the nearest angular separation within 0–180°.
    // Example: 8th house distance => 210° raw, nearest separation is 150° (360-210)
    const rawAngle = (houseDistance - 1) * 30;
    const exactAspectDegrees = rawAngle > 180 ? 360 - rawAngle : rawAngle;
    const orb = Math.abs(separation - exactAspectDegrees);
    
    const strength = this.calculateVedicAspectStrength(planet1, planet2, houseDistance, orb);
    const nature = this.determineVedicAspectNature(planet1, planet2, houseDistance);

    return {
      planet1: position1.name || planet1,
      planet2: position2.name || planet2,
      aspect: aspectName,
      houseDistance: houseDistance,
      fromHouse: typeof fromHouse === 'number' ? fromHouse : undefined,
      toHouse: typeof toHouse === 'number' ? toHouse : undefined,
      orb: orb.toFixed(2),
      strength: strength,
      nature: nature,
      separation: separation.toFixed(2),
      applying: this.isAspectApplying(position1, position2)
    };
  }

  /**
   * Calculate Vedic aspect strength
   */
  calculateVedicAspectStrength(planet1, planet2, houseDistance, orb) {
    // Base strength depends on the aspecting planet
    let baseStrength = 'Moderate';
    
    // Special aspects of Mars, Jupiter, and Saturn are stronger
    if (planet1.toLowerCase() === 'mars' && [4, 8].includes(houseDistance)) {
      baseStrength = 'Strong';
    } else if (planet1.toLowerCase() === 'jupiter' && [5, 9].includes(houseDistance)) {
      baseStrength = 'Strong';
    } else if (planet1.toLowerCase() === 'saturn' && [3, 10].includes(houseDistance)) {
      baseStrength = 'Strong';
    } else if (houseDistance === 7) {
      baseStrength = 'Strong'; // 7th house aspect is always strong
    }
    
    // Adjust for orb - tighter orb = stronger aspect
    if (orb <= 3) {
      return baseStrength === 'Strong' ? 'Very Strong' : 'Strong';
    } else if (orb <= 5) {
      return baseStrength;
    } else {
      return baseStrength === 'Strong' ? 'Moderate' : 'Weak';
    }
  }

  /**
   * Calculate aspect strength based on orb and planet nature (legacy method)
   */
  calculateAspectStrength(planet1, planet2, aspectInfo, orb) {
    let baseStrength = aspectInfo.strength;
    
    // Reduce strength based on orb
    const orbFactor = 1 - (orb / aspectInfo.orb);
    
    // Increase strength for luminaries (Sun/Moon) and benefics
    if (['sun', 'moon', 'jupiter'].includes(planet1) || ['sun', 'moon', 'jupiter'].includes(planet2)) {
      if (orbFactor > 0.7) return 'Very Strong';
      if (orbFactor > 0.5) return 'Strong';
    }

    if (orbFactor > 0.8) return 'Strong';
    if (orbFactor > 0.5) return 'Moderate';
    return 'Weak';
  }

  /**
   * Determine Vedic aspect nature
   */
  determineVedicAspectNature(planet1, planet2, houseDistance) {
    const nature1 = this.planet_natures[planet1.toLowerCase()] || 'neutral';
    const nature2 = this.planet_natures[planet2.toLowerCase()] || 'neutral';

    // Benefic planets casting aspects are generally favorable
    if (nature1 === 'benefic') {
      if ([5, 9].includes(houseDistance)) return 'Benefic'; // Trine houses
      if (houseDistance === 7) return nature2 === 'malefic' ? 'Mixed' : 'Benefic';
      return 'Benefic';
    }

    // Malefic planets casting aspects
    if (nature1 === 'malefic') {
      if ([3, 6, 8, 11, 12].includes(houseDistance)) return 'Challenging'; // Difficult houses
      if (houseDistance === 7) return 'Challenging'; // Opposition from malefic
      return 'Mixed';
    }

    // Neutral planets
    return 'Neutral';
  }

  /**
   * Determine if aspect is benefic, malefic, or mixed (legacy method)
   */
  determineAspectNature(planet1, planet2, aspectInfo) {
    const nature1 = this.planet_natures[planet1] || 'neutral';
    const nature2 = this.planet_natures[planet2] || 'neutral';

    // Conjunction aspects depend on planet natures
    if (aspectInfo.name === 'Conjunction') {
      if (nature1 === 'benefic' && nature2 === 'benefic') return 'Benefic';
      if (nature1 === 'malefic' && nature2 === 'malefic') return 'Malefic';
      return 'Mixed';
    }

    // Trine aspects are generally harmonious
    if (aspectInfo.name === 'Trine') {
      return 'Benefic';
    }

    // Square and Opposition aspects depend on planets involved
    if (['Square', 'Opposition'].includes(aspectInfo.name)) {
      if (nature1 === 'benefic' || nature2 === 'benefic') return 'Mixed';
      return 'Challenging';
    }

    // Sextile aspects are mildly harmonious
    if (aspectInfo.name === 'Sextile') {
      return 'Harmonious';
    }

    return 'Neutral';
  }

  /**
   * Check if aspect is applying (getting closer) or separating
   */
  isAspectApplying(position1, position2) {
    // Simplified check based on planetary speeds
    // In a full implementation, this would use actual planetary speeds
    const speed1 = position1.speed || 0;
    const speed2 = position2.speed || 0;
    
    return speed1 > speed2;
  }

  /**
   * Calculate planetary aspects to houses (Drishti)
   * This is the core Vedic astrology aspect system where planets aspect houses
   * @param {Object} planetaryPositions - Object containing planetary positions
   * @param {number} ascendant - Ascendant longitude
   * @returns {Object} Object containing aspects for each planet to houses
   */
  calculatePlanetaryAspectsToHouses(planetaryPositions, ascendant = 0) {
    try {
      const planetAspects = {};
      const planets = Object.keys(planetaryPositions);

      logger.info('🎯 Calculating Vedic planetary aspects to houses (Drishti)...');

      // Calculate house positions for all planets first
      const planetHouses = {};
      for (const planet of planets) {
        const position = planetaryPositions[planet];
        if (position && typeof position.longitude === 'number') {
          planetHouses[planet] = this.calculateHousePosition(position.longitude, ascendant);
        }
      }

      // For each planet, calculate which houses it aspects
      for (const planet of planets) {
        if (!planetHouses[planet]) continue;

        const planetKey = planet.toLowerCase();
        const planetHouse = planetHouses[planet];
        
        // Get aspect rules for this planet (check if extended aspects are enabled)
        let aspectRules = this.vedic_aspect_rules[planetKey];
        
        // Apply extended rules for Rahu/Ketu if enabled
        if (this.config.enableRahuKetuSpecialAspects && this.extended_aspect_rules[planetKey]) {
          aspectRules = this.extended_aspect_rules[planetKey];
        }

        if (!aspectRules) continue;

        // Calculate aspected houses based on planet's current house
        const aspectedHouses = [];
        
        for (const aspectDistance of aspectRules) {
          // Calculate the house number that this planet aspects
          // In Vedic astrology, counting is inclusive from planet's house
          let aspectedHouse = planetHouse + aspectDistance - 1;
          if (aspectedHouse > 12) aspectedHouse -= 12;
          if (aspectedHouse <= 0) aspectedHouse += 12;

          // Check if this is a special aspect for UI highlighting
          const isSpecialAspect = this.special_aspects[planetKey] && 
                                 this.special_aspects[planetKey].includes(aspectDistance);

          aspectedHouses.push({
            houseNumber: aspectedHouse,
            aspectDistance: aspectDistance,
            aspectType: this.getAspectTypeName(aspectDistance),
            isSpecialAspect: isSpecialAspect,
            strength: this.calculateHouseAspectStrength(planetKey, aspectDistance),
            nature: this.determineHouseAspectNature(planetKey, aspectedHouse, aspectDistance)
          });
        }

        planetAspects[planet] = {
          planetName: planetaryPositions[planet].name || planet,
          currentHouse: planetHouse,
          aspectsToHouses: aspectedHouses,
          totalAspects: aspectedHouses.length
        };

        logger.info(`🌟 ${planetaryPositions[planet].name || planet} in house ${planetHouse} aspects houses: ${aspectedHouses.map(a => a.houseNumber).join(', ')}`);
      }

      logger.info(`✅ Calculated house aspects for ${Object.keys(planetAspects).length} planets`);
      return planetAspects;

    } catch (error) {
      logger.error('Error calculating planetary aspects to houses:', error);
      return {};
    }
  }

  /**
   * Get aspect type name based on house distance
   * @param {number} distance - House distance from planet
   * @returns {string} Aspect type name
   */
  getAspectTypeName(distance) {
    const aspectNames = {
      3: 'Third House Drishti',
      4: 'Fourth House Drishti',
      5: 'Fifth House Drishti',
      7: 'Seventh House Drishti',
      8: 'Eighth House Drishti',
      9: 'Ninth House Drishti',
      10: 'Tenth House Drishti'
    };
    return aspectNames[distance] || `${distance}th House Drishti`;
  }

  /**
   * Calculate strength of house aspect
   * @param {string} planet - Planet name
   * @param {number} aspectDistance - Distance of aspect
   * @returns {string} Aspect strength
   */
  calculateHouseAspectStrength(planet, aspectDistance) {
    // Base strength for all 7th house aspects
    if (aspectDistance === 7) {
      return 'Strong';
    }

    // Special aspects are stronger
    if (planet === 'mars' && [4, 8].includes(aspectDistance)) {
      return 'Very Strong';
    }
    if (planet === 'jupiter' && [5, 9].includes(aspectDistance)) {
      return 'Very Strong';
    }
    if (planet === 'saturn' && [3, 10].includes(aspectDistance)) {
      return 'Very Strong';
    }

    // Rahu/Ketu special aspects (if enabled)
    if (this.config.enableRahuKetuSpecialAspects) {
      if (['rahu', 'ketu'].includes(planet) && [5, 9].includes(aspectDistance)) {
        return 'Strong';
      }
    }

    return 'Moderate';
  }

  /**
   * Determine nature of house aspect
   * @param {string} planet - Planet name
   * @param {number} aspectedHouse - House being aspected
   * @param {number} aspectDistance - Distance of aspect
   * @returns {string} Aspect nature
   */
  determineHouseAspectNature(planet, aspectedHouse, aspectDistance) {
    const planetNature = this.planet_natures[planet] || 'neutral';

    // Benefic planets generally cast beneficial aspects
    if (planetNature === 'benefic') {
      // Trine aspects (5th and 9th) are always beneficial
      if ([5, 9].includes(aspectDistance)) return 'Highly Beneficial';
      // 7th house aspects depend on house significance
      if (aspectDistance === 7) return 'Beneficial';
      return 'Beneficial';
    }

    // Malefic planets
    if (planetNature === 'malefic') {
      // Even malefics can be beneficial to certain houses
      if ([1, 4, 7, 10].includes(aspectedHouse)) return 'Mixed'; // Kendra houses
      if ([5, 9].includes(aspectedHouse)) return 'Challenging'; // Trikona houses
      if ([6, 8, 12].includes(aspectedHouse)) return 'Beneficial'; // Malefics good for dusthana
      return 'Challenging';
    }

    // Neutral planets
    return 'Neutral';
  }

  /**
   * Get planetary aspects in a format suitable for testing
   * Test Case 1: Jupiter in 1st house should aspect 5th, 7th, 9th houses
   * Test Case 2: Mars in 3rd house should aspect 6th, 9th, 10th houses
   * @param {Object} planetaryPositions - Planetary positions
   * @param {number} ascendant - Ascendant longitude
   * @returns {Object} Test-friendly aspect data
   */
  getAspectsForTesting(planetaryPositions, ascendant = 0) {
    const houseAspects = this.calculatePlanetaryAspectsToHouses(planetaryPositions, ascendant);
    const testResults = {};

    Object.entries(houseAspects).forEach(([planet, aspectData]) => {
      testResults[planet] = {
        currentHouse: aspectData.currentHouse,
        aspectedHouses: aspectData.aspectsToHouses.map(aspect => aspect.houseNumber).sort((a, b) => a - b)
      };
    });

    return testResults;
  }

  /**
   * Get the strongest aspects for display
   */
  getStrongestAspects(aspects, limit = 10) {
    return aspects
      .filter(aspect => ['Very Strong', 'Strong', 'Moderate'].includes(aspect.strength))
      .sort((a, b) => {
        const strengthOrder = { 'Very Strong': 3, 'Strong': 2, 'Moderate': 1, 'Weak': 0 };
        const strengthDiff = strengthOrder[b.strength] - strengthOrder[a.strength];
        if (strengthDiff !== 0) return strengthDiff;
        
        // Secondary sort by orb (smaller orb = stronger)
        return parseFloat(a.orb) - parseFloat(b.orb);
      })
      .slice(0, limit);
  }
}

module.exports = new AspectsService();
