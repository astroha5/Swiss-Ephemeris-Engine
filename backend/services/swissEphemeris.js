const moment = require('moment-timezone');
const logger = require('../utils/logger');

// Try to load Swiss Ephemeris, fallback to Astronomy Engine if not available
let swisseph;
let astronomyEngine;
let useSwissEph = true;

try {
  // Add timeout for Swiss Ephemeris loading
  const loadTimeout = setTimeout(() => {
    logger.warn('Swiss Ephemeris loading taking too long, will use fallback');
    useSwissEph = false;
  }, 3000);
  
  swisseph = require('swisseph');
  clearTimeout(loadTimeout);
  logger.info('Swiss Ephemeris loaded successfully');
} catch (error) {
  logger.warn('Swiss Ephemeris not available, using Astronomy Engine fallback:', error.message);
  useSwissEph = false;
  try {
    astronomyEngine = require('./astronomyEngine');
  } catch (fallbackError) {
    logger.error('Astronomy Engine fallback also failed:', fallbackError.message);
  }
}

class SwissEphemerisService {
  constructor() {
    this.useSwissEph = useSwissEph;
    
    if (this.useSwissEph) {
      try {
        // Set Swiss Ephemeris path with fallback
        const ephemerisPath = __dirname + '/../ephemeris';
        
        // Add timeout protection for ephemeris path setting
        const pathTimeout = setTimeout(() => {
          logger.warn('Swiss Ephemeris path setting taking too long, continuing with built-in data');
        }, 5000);
        
        try {
          swisseph.swe_set_ephe_path(ephemerisPath);
          clearTimeout(pathTimeout);
          logger.info(`Swiss Ephemeris path set to: ${ephemerisPath}`);
        } catch (error) {
          clearTimeout(pathTimeout);
          logger.warn('Swiss Ephemeris path not set, using built-in data:', error.message);
        }
        
        // Lahiri Ayanamsa (most commonly used in Vedic astrology)
        swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
        
        // Log initialization
        logger.info('Swiss Ephemeris service initialized with Lahiri Ayanamsa');
      } catch (error) {
        logger.error('Error initializing Swiss Ephemeris, falling back to simple calculations:', error);
        this.useSwissEph = false;
      }
    } else {
      logger.info('Using Astronomy Engine fallback for calculations');
    }
    
    if (this.useSwissEph) {
      this.planets = {
        SUN: swisseph.SE_SUN,
        MOON: swisseph.SE_MOON,
        MARS: swisseph.SE_MARS,
        MERCURY: swisseph.SE_MERCURY,
        JUPITER: swisseph.SE_JUPITER,
        VENUS: swisseph.SE_VENUS,
        SATURN: swisseph.SE_SATURN,
        RAHU: swisseph.SE_MEAN_NODE,
        KETU: swisseph.SE_MEAN_NODE + 180  // Ketu is 180° opposite to Rahu
      };

      this.planetNames = {
        [swisseph.SE_SUN]: 'Sun',
        [swisseph.SE_MOON]: 'Moon',
        [swisseph.SE_MARS]: 'Mars',
        [swisseph.SE_MERCURY]: 'Mercury',
        [swisseph.SE_JUPITER]: 'Jupiter',
        [swisseph.SE_VENUS]: 'Venus',
        [swisseph.SE_SATURN]: 'Saturn',
        [swisseph.SE_MEAN_NODE]: 'Rahu'
      };
    }

    this.zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    this.nakshatras = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ];
  }

  /**
   * Convert date, time, and timezone to Julian Day Number
   */
  getJulianDay(date, time, timezone = 'Asia/Kolkata') {
    if (!this.useSwissEph) {
      // Fallback: simple Julian Day calculation
      return this.simpleJulianDay(date, time, timezone);
    }
    
    try {
      const dateTimeString = `${date} ${time}`;
      const momentObj = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', timezone);
      
      if (!momentObj.isValid()) {
        throw new Error('Invalid date/time format');
      }

      const utcMoment = momentObj.utc();
      const year = utcMoment.year();
      const month = utcMoment.month() + 1; // moment months are 0-indexed
      const day = utcMoment.date();
      const hour = utcMoment.hour() + (utcMoment.minute() / 60.0) + (utcMoment.second() / 3600.0);

      const julianDay = swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);
      
      logger.info(`Julian Day calculated: ${julianDay} for ${dateTimeString} ${timezone}`);
      return julianDay;
    } catch (error) {
      logger.error('Error calculating Julian Day:', error);
      throw new Error(`Failed to calculate Julian Day: ${error.message}`);
    }
  }

  /**
   * Simple Julian Day calculation fallback
   */
  simpleJulianDay(date, time, timezone) {
    const momentObj = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
    const utcMoment = momentObj.utc();
    const jsDate = utcMoment.toDate();
    
    // Simple Julian Day calculation
    const a = Math.floor((14 - (jsDate.getMonth() + 1)) / 12);
    const y = jsDate.getFullYear() + 4800 - a;
    const m = (jsDate.getMonth() + 1) + 12 * a - 3;
    
    const jdn = jsDate.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y +
                Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    const hours = jsDate.getHours() + jsDate.getMinutes() / 60.0 + jsDate.getSeconds() / 3600.0;
    return jdn + (hours / 24.0) - 0.5;
  }

  /**
   * Calculate planetary positions for given Julian Day
   */
  getPlanetaryPositions(julianDay) {
    if (!this.useSwissEph) {
      logger.error('Swiss Ephemeris not available, cannot calculate planetary positions');
      throw new Error('Swiss Ephemeris not available for planetary calculations');
    }

    if (!this.planets) {
      logger.error('Planet definitions not initialized');
      throw new Error('Planet definitions not initialized');
    }

    const positions = {};
    // Ensure consistent sidereal flags for all planetary calculations
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;

    // Debug: Verify and enforce Lahiri Ayanamsa before calculations
    try {
      // Always re-set sidereal mode to ensure consistency
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      
      const currentAyanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
      logger.info(`🌟 PLANETARY CALC - Lahiri Ayanamsa for JD ${julianDay}: ${currentAyanamsa.toFixed(8)}°`);
      logger.info(`🔧 PLANETARY CALC - Sidereal flags enforced: ${flags}`);
    } catch (ayanamsaError) {
      logger.error('❌ Error getting/setting Ayanamsa for planetary calculations:', ayanamsaError);
      throw new Error(`Ayanamsa setup failed: ${ayanamsaError.message}`);
    }

    try {
      for (const [planetName, planetId] of Object.entries(this.planets)) {
        let position;
        
        if (planetName === 'KETU') {
          // Calculate Ketu position (180° opposite to Rahu)
          const rahuPos = swisseph.swe_calc_ut(julianDay, swisseph.SE_MEAN_NODE, flags);
          if (rahuPos.rflag < 0) {
            throw new Error(`Failed to calculate Rahu position: ${rahuPos.serr}`);
          }
          
          let ketuLongitude = rahuPos.longitude + 180;
          if (ketuLongitude >= 360) ketuLongitude -= 360;
          
          position = {
            longitude: ketuLongitude,
            latitude: -rahuPos.latitude,
            distance: rahuPos.distance,
            speed: -rahuPos.longitudeSpeed
          };
        } else {
          const result = swisseph.swe_calc_ut(julianDay, planetId, flags);
          logger.info(`${planetName} - planetId: ${planetId}, result keys: ${Object.keys(result)}, longitude: ${result.longitude}`);
          if (result.error) {
            logger.error(`${planetName} calculation error: ${result.error}`);
            throw new Error(`Failed to calculate ${planetName} position: ${result.error}`);
          }
          if (result.rflag < 0) {
            throw new Error(`Failed to calculate ${planetName} position: ${result.serr}`);
          }
          
          position = {
            longitude: result.longitude,
            latitude: result.latitude,
            distance: result.distance,
            speed: result.longitudeSpeed
          };
          logger.info(`${planetName} - extracted position longitude: ${position.longitude}`);
        }

        // Calculate additional properties
        const signNum = Math.floor(position.longitude / 30);
        const degreeInSign = position.longitude % 30;
        const nakshatra = this.calculateNakshatra(position.longitude);
        
        positions[planetName.toLowerCase()] = {
          name: planetName === 'KETU' ? 'Ketu' : this.planetNames[planetId],
          longitude: position.longitude,
          latitude: position.latitude,
          sign: this.zodiacSigns[signNum],
          signNumber: signNum + 1,
          degree: degreeInSign,
          degreeFormatted: this.formatDegree(degreeInSign),
          nakshatra: nakshatra.name,
          nakshatraPada: nakshatra.pada,
          isRetrograde: position.speed < 0,
          speed: position.speed
        };
      }

      logger.info(`Successfully calculated positions for ${Object.keys(positions).length} planets`);
      return { planets: positions };
    } catch (error) {
      logger.error('Error calculating planetary positions:', error);
      throw new Error(`Failed to calculate planetary positions: ${error.message}`);
    }
  }

  /**
   * Calculate Nakshatra and Pada for given longitude
   */
  calculateNakshatra(longitude) {
    const nakshatraIndex = Math.floor(longitude * 27 / 360);
    const nakshatraSpan = 360 / 27; // 13.333... degrees per nakshatra
    const degreesInNakshatra = (longitude * 27 / 360) % 1 * nakshatraSpan;
    const pada = Math.floor(degreesInNakshatra / (nakshatraSpan / 4)) + 1;

    return {
      name: this.nakshatras[nakshatraIndex],
      index: nakshatraIndex,
      pada: pada,
      degrees: degreesInNakshatra
    };
  }

  /**
   * Format degree in traditional format
   */
  formatDegree(decimal) {
    const degrees = Math.floor(decimal);
    const minutes = Math.floor((decimal - degrees) * 60);
    const seconds = Math.floor(((decimal - degrees) * 60 - minutes) * 60);
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"`;
  }

  /**
   * Calculate Ascendant (Lagna)
   */
  calculateAscendant(julianDay, latitude, longitude) {
    if (!this.useSwissEph) {
      logger.error('Swiss Ephemeris not available, cannot calculate ascendant');
      throw new Error('Swiss Ephemeris not available for ascendant calculations');
    }

    try {
      // Re-ensure Lahiri Ayanamsa is set (defensive programming)
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      logger.info('🔧 Lahiri Ayanamsa mode confirmed before house calculations');
      
      // Debug: Get current ayanamsa value
      const currentAyanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
      logger.info(`🌟 Current Lahiri Ayanamsa for house calc JD ${julianDay}: ${currentAyanamsa.toFixed(8)}°`);
      
      // Use swe_houses_ex with sidereal flags for accurate sidereal calculations
      const flags = swisseph.SEFLG_SIDEREAL;
      const houses = swisseph.swe_houses_ex(
        julianDay,
        flags,
        latitude,
        longitude,
        'P' // Placidus house system
      );

      if (houses.flag < 0) {
        throw new Error(`Failed to calculate houses: ${houses.serr}`);
      }

      const ascendantLongitude = houses.ascendant;
      
      // Debug logging for ascendant calculation
      logger.info(`🏠 Raw ascendant longitude from swe_houses_ex: ${ascendantLongitude.toFixed(8)}°`);
      
      const signNum = Math.floor(ascendantLongitude / 30);
      const degreeInSign = ascendantLongitude % 30;
      const nakshatra = this.calculateNakshatra(ascendantLongitude);
      
      logger.info(`🏠 Ascendant: ${ascendantLongitude.toFixed(6)}° = ${this.zodiacSigns[signNum]} ${degreeInSign.toFixed(6)}°`);

      return {
        longitude: ascendantLongitude,
        sign: this.zodiacSigns[signNum],
        signNumber: signNum + 1,
        degree: degreeInSign,
        degreeFormatted: this.formatDegree(degreeInSign),
        nakshatra: nakshatra.name,
        nakshatraPada: nakshatra.pada,
        houses: houses.house // All 12 house cusps
      };
    } catch (error) {
      logger.error('Error calculating ascendant:', error);
      throw new Error(`Failed to calculate ascendant: ${error.message}`);
    }
  }

  /**
   * Calculate house positions for planets
   */
  calculateHousePositions(planetPositions, ascendant) {
    const housePositions = Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      sign: this.zodiacSigns[(ascendant.signNumber - 1 + i) % 12],
      planets: [],
      degrees: []
    }));

    for (const [planetKey, planet] of Object.entries(planetPositions)) {
      if (planetKey === 'ascendant') continue;
      
      // Calculate which house the planet is in
      let houseNumber = planet.signNumber - ascendant.signNumber + 1;
      if (houseNumber <= 0) houseNumber += 12;
      if (houseNumber > 12) houseNumber -= 12;

      const houseIndex = houseNumber - 1;
      housePositions[houseIndex].planets.push(planet.name);
      housePositions[houseIndex].degrees.push(planet.degreeFormatted);
    }

    return housePositions;
  }

  /**
   * Calculate Navamsa chart (D9)
   */
  calculateNavamsa(planetPositions) {
    const navamsaPositions = {};

    for (const [planetKey, planet] of Object.entries(planetPositions)) {
      if (planetKey === 'ascendant') continue;

      // Navamsa calculation: Each sign is divided into 9 parts
      const signNum = planet.signNumber - 1; // 0-indexed
      const degreeInSign = planet.degree;
      const navamsaPart = Math.floor(degreeInSign / (30/9)); // Which navamsa part (0-8)
      
      // Calculate navamsa sign
      let navamsaSign;
      if ([0, 3, 6, 9].includes(signNum)) { // Movable signs
        navamsaSign = (signNum + navamsaPart) % 12;
      } else if ([1, 4, 7, 10].includes(signNum)) { // Fixed signs  
        navamsaSign = (signNum + 8 + navamsaPart) % 12;
      } else { // Dual signs
        navamsaSign = (signNum + 4 + navamsaPart) % 12;
      }

      navamsaPositions[planetKey] = {
        ...planet,
        navamsaSign: this.zodiacSigns[navamsaSign],
        navamsaSignNumber: navamsaSign + 1
      };
    }

    return navamsaPositions;
  }

  /**
   * Calculate planetary strength (Shadbala)
   */
  calculatePlanetaryStrength(planet, julianDay, latitude, longitude) {
    // Simplified strength calculation
    // In a full implementation, this would include Shadbala calculations
    
    const strengthFactors = {
      exaltation: this.getExaltationStatus(planet),
      dignity: this.getDignityStatus(planet),
      aspectStrength: this.calculateAspectStrength(planet),
      positionalStrength: this.calculatePositionalStrength(planet)
    };

    let totalStrength = 0;
    Object.values(strengthFactors).forEach(factor => totalStrength += factor);
    
    // Classify strength
    let strengthLevel;
    if (totalStrength >= 75) strengthLevel = 'Exalted';
    else if (totalStrength >= 60) strengthLevel = 'Strong';
    else if (totalStrength >= 40) strengthLevel = 'Moderate';
    else if (totalStrength >= 25) strengthLevel = 'Weak';
    else strengthLevel = 'Debilitated';

    return {
      level: strengthLevel,
      score: totalStrength,
      factors: strengthFactors
    };
  }

  /**
   * Helper methods for strength calculations
   */
  getExaltationStatus(planet) {
    const exaltationDegrees = {
      'Sun': { sign: 0, degree: 10 },      // Aries 10°
      'Moon': { sign: 1, degree: 3 },      // Taurus 3°
      'Mars': { sign: 9, degree: 28 },     // Capricorn 28°
      'Mercury': { sign: 5, degree: 15 },  // Virgo 15°
      'Jupiter': { sign: 3, degree: 5 },   // Cancer 5°
      'Venus': { sign: 11, degree: 27 },   // Pisces 27°
      'Saturn': { sign: 6, degree: 20 }    // Libra 20°
    };

    const exaltation = exaltationDegrees[planet.name];
    if (!exaltation) return 50; // Default for Rahu/Ketu

    const signMatch = (planet.signNumber - 1) === exaltation.sign;
    if (!signMatch) return 25; // Not in exaltation sign

    const degreeDiff = Math.abs(planet.degree - exaltation.degree);
    if (degreeDiff <= 2) return 100; // Very close to exact exaltation
    if (degreeDiff <= 5) return 85;  // Close to exaltation
    return 70; // In exaltation sign but not close to degree
  }

  getDignityStatus(planet) {
    // Simplified dignity calculation
    // Would need full rulership tables for complete implementation
    return 50; // Default moderate dignity
  }

  calculateAspectStrength(planet) {
    // Simplified aspect calculation
    return 50; // Default aspect strength
  }

  calculatePositionalStrength(planet) {
    // Consider house position, but we'd need house information
    return 50; // Default positional strength
  }

  /**
   * Cleanup Swiss Ephemeris resources
   */
  cleanup() {
    try {
      swisseph.swe_close();
      logger.info('Swiss Ephemeris resources cleaned up');
    } catch (error) {
      logger.error('Error cleaning up Swiss Ephemeris:', error);
    }
  }
}

module.exports = new SwissEphemerisService();
