const moment = require('moment-timezone');
const logger = require('../utils/logger');
const historicalTimezoneHandler = require('./historicalTimezoneHandler');

// Try to load Swiss Ephemeris with better error handling
let swisseph;
let useSwissEph = true;

try {
  swisseph = require('swisseph');
  logger.info('Swiss Ephemeris loaded successfully');
} catch (error) {
  logger.warn('Swiss Ephemeris not available:', error.message);
  useSwissEph = false;
}

class EnhancedSwissEphemerisService {
  constructor() {
    this.useSwissEph = useSwissEph;
    this.isInitialized = false;
    
    if (this.useSwissEph) {
      this.initializeSwissEph();
    }
    
    // Zodiac signs in order
    this.zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    // Nakshatras (27 lunar mansions)
    this.nakshatras = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ];

    // Planet definitions
    this.planets = {
      SUN: 0,
      MOON: 1,
      MERCURY: 2,
      VENUS: 3,
      MARS: 4,
      JUPITER: 5,
      SATURN: 6,
      RAHU: 11, // Mean Node
      KETU: 11  // Will be calculated as opposite to Rahu
    };

    this.planetNames = {
      0: 'Sun',
      1: 'Moon', 
      2: 'Mercury',
      3: 'Venus',
      4: 'Mars',
      5: 'Jupiter',
      6: 'Saturn',
      11: 'Rahu'
    };
  }

  initializeSwissEph() {
    try {
      // Set ephemeris path
      const ephemerisPath = __dirname + '/../ephemeris';
      swisseph.swe_set_ephe_path(ephemerisPath);
      
      // Set Lahiri Ayanamsa (most accurate for Vedic astrology)
      logger.info(`🔧 DEBUG - Setting Lahiri Ayanamsa: SE_SIDM_LAHIRI = ${swisseph.SE_SIDM_LAHIRI}`);
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      logger.info(`🔧 DEBUG - Lahiri Ayanamsa set successfully`);
      
      this.isInitialized = true;
      logger.info('Enhanced Swiss Ephemeris initialized with Lahiri Ayanamsa');
    } catch (error) {
      logger.error('Failed to initialize Swiss Ephemeris:', error);
      this.useSwissEph = false;
    }
  }

  /**
   * Convert date, time, and timezone to accurate Julian Day Number with historical support
   */
  getJulianDay(date, time, timezone = 'Asia/Kolkata', place = null, coordinates = null) {
    try {
      logger.info(`🕐 Julian Day calculation for: ${date} ${time} at ${place || 'Unknown'}`);
      logger.info(`📍 Input Parameters: Date=${date}, Time=${time}, Timezone=${timezone}`);
      if (coordinates) {
        logger.info(`🌍 Coordinates: Lat=${coordinates.lat}, Lon=${coordinates.lng}`);
      }
      
      if (!this.useSwissEph) {
        // Fallback calculation for when Swiss Ephemeris is not available
        logger.info(`⚠️  Using fallback Julian Day calculation (Swiss Ephemeris not available)`);
        const momentObj = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
        if (!momentObj.isValid()) {
          throw new Error('Invalid date/time format');
        }
        const utcMoment = momentObj.utc();
        
        // Enhanced UTC logging for fallback
        logger.info(`🔄 Fallback Local Time: ${momentObj.format('YYYY-MM-DD HH:mm:ss')} (${timezone})`);
        logger.info(`🌐 Fallback UTC Time: ${utcMoment.format('YYYY-MM-DD HH:mm:ss')} UTC`);
        logger.info(`⏰ Fallback UTC Components: Year=${utcMoment.year()}, Month=${utcMoment.month() + 1}, Day=${utcMoment.date()}, Hour=${utcMoment.hour() + (utcMoment.minute() / 60.0)}`);
        
        const fallbackJD = this.calculateJulianDayFallback(
          utcMoment.year(),
          utcMoment.month() + 1,
          utcMoment.date(),
          utcMoment.hour() + (utcMoment.minute() / 60.0)
        );
        logger.info(`📊 Fallback Julian Day: ${fallbackJD.toFixed(8)}`);
        return fallbackJD;
      }

      // Use enhanced historical timezone handler
      logger.info(`🔧 Using enhanced historical timezone handler`);
      const enhancedJD = historicalTimezoneHandler.getEnhancedJulianDay(
        swisseph, date, time, place, coordinates, timezone
      );
      
      // Enhanced UTC conversion logging
      logger.info(`🔄 Enhanced UTC Conversion Details:`);
      logger.info(`   📅 Original Local: ${date} ${time} (${timezone})`);
      if (enhancedJD.localDetails) {
        logger.info(`   📅 Parsed Local: ${enhancedJD.localDetails.year}-${(enhancedJD.localDetails.month || 0).toString().padStart(2, '0')}-${(enhancedJD.localDetails.day || 0).toString().padStart(2, '0')} ${(enhancedJD.localDetails.hour || 0).toString().padStart(2, '0')}:${(enhancedJD.localDetails.minute || 0).toString().padStart(2, '0')}`);
      }
      if (enhancedJD.offsetMinutes !== undefined) {
        logger.info(`   ⏰ Timezone Offset: ${enhancedJD.offsetMinutes} minutes`);
      }
      if (enhancedJD.utcDetails) {
        const utcHour = typeof enhancedJD.utcDetails.hour === 'string' ? parseFloat(enhancedJD.utcDetails.hour) : enhancedJD.utcDetails.hour;
        const utcMinute = enhancedJD.utcDetails.minute || 0;
        const utcSecond = enhancedJD.utcDetails.second || 0;
        logger.info(`   🌐 Final UTC: ${enhancedJD.utcDetails.year}-${enhancedJD.utcDetails.month.toString().padStart(2, '0')}-${enhancedJD.utcDetails.day.toString().padStart(2, '0')} Hour=${utcHour}`);
        logger.info(`   🌐 UTC Decimal Hour: ${utcHour}`);
      }
      
      // Log detailed conversion info
      if (enhancedJD.isHistorical) {
        logger.info(`📜 Historical date detected - using corrected timezone offset`);
        logger.info(`⏰ Historical UTC Details: ${enhancedJD.utcDetails.year}-${enhancedJD.utcDetails.month.toString().padStart(2, '0')}-${enhancedJD.utcDetails.day.toString().padStart(2, '0')} ${enhancedJD.utcDetails.hour}h`);
      }
      
      logger.info(`📊 Final Julian Day: ${enhancedJD.julianDay.toFixed(8)}`);
      if (enhancedJD.utcDetails) {
        const verifyHour = typeof enhancedJD.utcDetails.hour === 'string' ? parseFloat(enhancedJD.utcDetails.hour) : enhancedJD.utcDetails.hour;
        logger.info(`🎯 Julian Day Verification: JD=${enhancedJD.julianDay.toFixed(8)} should correspond to UTC ${enhancedJD.utcDetails.year}-${enhancedJD.utcDetails.month.toString().padStart(2, '0')}-${enhancedJD.utcDetails.day.toString().padStart(2, '0')} Hour=${verifyHour}`);
      }
      
      return enhancedJD.julianDay;
      
    } catch (error) {
      logger.error('Error calculating enhanced Julian Day:', error);
      throw new Error(`Failed to calculate Julian Day: ${error.message}`);
    }
  }

  calculateJulianDayFallback(year, month, day, hour) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
                Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    return jdn + (hour / 24.0) - 0.5;
  }

  /**
   * Calculate accurate planetary positions
   */
  getPlanetaryPositions(julianDay) {
    if (!this.useSwissEph) {
      throw new Error('Swiss Ephemeris not available for accurate calculations');
    }

    const positions = {};
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;

    // DEBUG: Log calculation parameters
    logger.info(`🔍 DEBUG - Julian Day: ${julianDay}`);
    logger.info(`🔍 DEBUG - Flags: ${flags} (SEFLG_SIDEREAL: ${swisseph.SEFLG_SIDEREAL})`);
    logger.info(`🔍 DEBUG - Sidereal mode initialized: ${this.isInitialized}`);
    
    // CRITICAL: Re-verify and re-set Ayanamsa before calculations
    if (this.useSwissEph && this.isInitialized) {
      try {
        swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
        logger.info(`🔄 Re-confirmed Lahiri Ayanamsa setting before planetary calculations`);
      } catch (error) {
        logger.error('Failed to re-set Ayanamsa:', error);
      }
    }

    // CRITICAL: Log current Ayanamsa for this specific Julian Day
    try {
      const currentAyanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
      logger.info(`📐 Ayanamsa (Lahiri) for JD ${julianDay.toFixed(8)}: ${currentAyanamsa.toFixed(6)}°`);
      logger.info(`📐 Ayanamsa in DMS: ${this.formatDegree(currentAyanamsa)}`);
      
      for (const [planetName, planetId] of Object.entries(this.planets)) {
        if (planetName === 'KETU') continue; // Handle Ketu separately

        logger.info(`🔍 DEBUG - Calculating ${planetName} (ID: ${planetId})`);
        const result = swisseph.swe_calc_ut(julianDay, planetId, flags);
        
        if (result.rflag < 0) {
          throw new Error(`Failed to calculate ${planetName} position: ${result.serr}`);
        }

        const longitude = result.longitude;
        const latitude = result.latitude;
        const speed = result.longitudeSpeed;
        
        // ENHANCED: Detailed Moon calculation with boundary analysis
        if (planetName === 'MOON') {
          const moonSignNumber = Math.floor(longitude / 30);
          const moonDegreeInSign = longitude % 30;
          const moonSignName = this.zodiacSigns[moonSignNumber];
          
          logger.info(`🌙 ========== MOON DETAILED ANALYSIS ==========`);
          logger.info(`🌙 Raw longitude: ${longitude.toFixed(8)}°`);
          logger.info(`🌙 Sign boundary: ${moonSignNumber * 30}° to ${(moonSignNumber + 1) * 30}°`);
          logger.info(`🌙 Distance from sign start: ${moonDegreeInSign.toFixed(6)}°`);
          logger.info(`🌙 Distance from sign end: ${(30 - moonDegreeInSign).toFixed(6)}°`);
          logger.info(`🌙 Current sign: ${moonSignName} (#${moonSignNumber + 1})`);
          
          // Check if Moon is near sign boundaries (within 2 degrees)
          if (moonDegreeInSign < 2) {
            const prevSign = moonSignNumber > 0 ? this.zodiacSigns[moonSignNumber - 1] : this.zodiacSigns[11];
            logger.warn(`⚠️ MOON NEAR BOUNDARY: Only ${moonDegreeInSign.toFixed(4)}° from ${prevSign}/${moonSignName} boundary!`);
          } else if (moonDegreeInSign > 28) {
            const nextSign = moonSignNumber < 11 ? this.zodiacSigns[moonSignNumber + 1] : this.zodiacSigns[0];
            logger.warn(`⚠️ MOON NEAR BOUNDARY: Only ${(30 - moonDegreeInSign).toFixed(4)}° from ${moonSignName}/${nextSign} boundary!`);
          }
          
          logger.info(`🌙 Final determination: Moon in ${moonSignName}`);
          logger.info(`🌙 ==========================================`);
        }

        // Calculate sign and degrees
        const signNumber = Math.floor(longitude / 30);
        const degreeInSign = longitude % 30;
        
        // Calculate nakshatra
        const nakshatraInfo = this.calculateNakshatra(longitude);

        positions[planetName.toLowerCase()] = {
          name: this.planetNames[planetId],
          longitude: longitude,
          latitude: latitude,
          speed: speed,
          sign: this.zodiacSigns[signNumber],
          signNumber: signNumber + 1,
          degreeInSign: degreeInSign,
          degreeFormatted: this.formatDegree(degreeInSign),
          nakshatra: nakshatraInfo.name,
          nakshatraPada: nakshatraInfo.pada,
          isRetrograde: speed < 0,
          // Additional properties for chart calculations
          rawPosition: longitude,
          signLord: this.getSignLord(this.zodiacSigns[signNumber])
        };
      }

      // Calculate Ketu (180° opposite to Rahu)
      const rahuPos = positions.rahu;
      let ketuLongitude = rahuPos.longitude + 180;
      if (ketuLongitude >= 360) ketuLongitude -= 360;

      const ketuSignNumber = Math.floor(ketuLongitude / 30);
      const ketuDegreeInSign = ketuLongitude % 30;
      const ketuNakshatraInfo = this.calculateNakshatra(ketuLongitude);

      positions.ketu = {
        name: 'Ketu',
        longitude: ketuLongitude,
        latitude: -rahuPos.latitude,
        speed: -rahuPos.speed,
        sign: this.zodiacSigns[ketuSignNumber],
        signNumber: ketuSignNumber + 1,
        degreeInSign: ketuDegreeInSign,
        degreeFormatted: this.formatDegree(ketuDegreeInSign),
        nakshatra: ketuNakshatraInfo.name,
        nakshatraPada: ketuNakshatraInfo.pada,
        isRetrograde: false, // Ketu is always retrograde by nature
        rawPosition: ketuLongitude,
        signLord: this.getSignLord(this.zodiacSigns[ketuSignNumber])
      };

      return { planets: positions, success: true };

    } catch (error) {
      logger.error('Error calculating planetary positions:', error);
      throw new Error(`Failed to calculate planetary positions: ${error.message}`);
    }
  }

  /**
   * Calculate accurate Ascendant (Lagna)
   */
  calculateAscendant(julianDay, latitude, longitude) {
    if (!this.useSwissEph) {
      throw new Error('Swiss Ephemeris not available for ascendant calculation');
    }

    try {
      // CRITICAL: Re-confirm Ayanamsa setting before Ascendant calculation
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      logger.info(`🔄 Re-confirmed Lahiri Ayanamsa for Ascendant calculation`);
      
      const flags = swisseph.SEFLG_SIDEREAL;
      logger.info(`🌅 Calculating Ascendant with flags: ${flags}`);
      const houses = swisseph.swe_houses_ex(julianDay, flags, latitude, longitude, 'P');
      
      if (!houses || houses.rflag < 0) {
        throw new Error('Failed to calculate houses/ascendant');
      }

      const ascendantLongitude = houses.ascendant;
      const signNumber = Math.floor(ascendantLongitude / 30);
      const degreeInSign = ascendantLongitude % 30;
      const nakshatraInfo = this.calculateNakshatra(ascendantLongitude);

      return {
        longitude: ascendantLongitude,
        sign: this.zodiacSigns[signNumber],
        signNumber: signNumber + 1,
        degreeInSign: degreeInSign,
        degreeFormatted: this.formatDegree(degreeInSign),
        nakshatra: nakshatraInfo.name,
        nakshatraPada: nakshatraInfo.pada,
        signLord: this.getSignLord(this.zodiacSigns[signNumber])
      };

    } catch (error) {
      logger.error('Error calculating ascendant:', error);
      throw new Error(`Failed to calculate ascendant: ${error.message}`);
    }
  }

  /**
   * Calculate house positions for all planets
   */
  calculateHousePositions(planetaryPositions, ascendant) {
    const houses = Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      sign: this.zodiacSigns[(ascendant.signNumber - 1 + i) % 12],
      signNumber: ((ascendant.signNumber - 1 + i) % 12) + 1,
      planets: [],
      degrees: [],
      signLord: ''
    }));

    // Set sign lords for each house
    houses.forEach(house => {
      house.signLord = this.getSignLord(house.sign);
    });

    // Place planets in houses
    Object.values(planetaryPositions).forEach(planet => {
      const houseNumber = this.calculateHouseNumber(planet.longitude, ascendant.longitude);
      const house = houses[houseNumber - 1];
      
      house.planets.push(planet.name);
      house.degrees.push(planet.degreeFormatted);
    });

    return houses;
  }

  /**
   * Calculate which house a planet is in
   * Fixed to use sign-based calculation for accurate house placement
   */
  calculateHouseNumber(planetLongitude, ascendantLongitude) {
    // Get the sign numbers for planet and ascendant
    const planetSignNumber = Math.floor(planetLongitude / 30) + 1;
    const ascendantSignNumber = Math.floor(ascendantLongitude / 30) + 1;
    
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
   * Calculate Navamsa chart (D-9)
   */
  calculateNavamsa(planetaryPositions) {
    const navamsaChart = {};

    Object.entries(planetaryPositions).forEach(([planetKey, planet]) => {
      const navamsaPosition = this.calculateNavamsaPosition(planet.longitude);
      
      navamsaChart[planetKey] = {
        ...planet,
        navamsaLongitude: navamsaPosition.longitude,
        navamsaSign: navamsaPosition.sign,
        navamsaSignNumber: navamsaPosition.signNumber,
        navamsaDegree: navamsaPosition.degree,
        navamsaSignLord: this.getSignLord(navamsaPosition.sign)
      };
    });

    return navamsaChart;
  }

  /**
   * Calculate Navamsa position for a given longitude
   */
  calculateNavamsaPosition(longitude) {
    const signNumber = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    
    // Navamsa calculation
    const navamsaNumber = Math.floor(degreeInSign / (30/9));
    
    // Different calculation for odd and even signs
    let navamsaSignNumber;
    if ((signNumber + 1) % 2 === 1) { // Odd signs
      navamsaSignNumber = (signNumber + navamsaNumber) % 12;
    } else { // Even signs
      navamsaSignNumber = (signNumber + 8 + navamsaNumber) % 12;
    }

    const navamsaDegree = (degreeInSign % (30/9)) * 9;

    return {
      longitude: navamsaSignNumber * 30 + navamsaDegree,
      sign: this.zodiacSigns[navamsaSignNumber],
      signNumber: navamsaSignNumber + 1,
      degree: navamsaDegree
    };
  }

  /**
   * Calculate nakshatra and pada
   */
  calculateNakshatra(longitude) {
    const nakshatraLength = 360 / 27; // 13.333... degrees per nakshatra
    const nakshatraNumber = Math.floor(longitude / nakshatraLength);
    const degreeInNakshatra = longitude % nakshatraLength;
    const pada = Math.floor(degreeInNakshatra / (nakshatraLength / 4)) + 1;

    return {
      name: this.nakshatras[nakshatraNumber],
      number: nakshatraNumber + 1,
      pada: pada,
      degreeInNakshatra: degreeInNakshatra
    };
  }

  /**
   * Get sign lord (ruler)
   */
  getSignLord(sign) {
    const lords = {
      'Aries': 'Mars',
      'Taurus': 'Venus',
      'Gemini': 'Mercury',
      'Cancer': 'Moon',
      'Leo': 'Sun',
      'Virgo': 'Mercury',
      'Libra': 'Venus',
      'Scorpio': 'Mars',
      'Sagittarius': 'Jupiter',
      'Capricorn': 'Saturn',
      'Aquarius': 'Saturn',
      'Pisces': 'Jupiter'
    };
    return lords[sign] || 'Unknown';
  }

  /**
   * Format degree in traditional format
   */
  formatDegree(degree) {
    const deg = Math.floor(degree);
    const minFloat = (degree - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.floor((minFloat - min) * 60);
    
    return `${deg}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}"`;
  }

  /**
   * Calculate planetary strength
   */
  calculatePlanetaryStrength(planet, julianDay, latitude, longitude) {
    // Simplified strength calculation
    // In a full implementation, this would include:
    // - Shadbala (six-fold strength)
    // - Dig Bala (directional strength)
    // - Kala Bala (temporal strength)
    // - etc.

    let strength = 'Medium';
    
    // Basic exaltation/debilitation check
    const exaltationDegrees = {
      'Sun': { sign: 'Aries', degree: 10 },
      'Moon': { sign: 'Taurus', degree: 3 },
      'Mars': { sign: 'Capricorn', degree: 28 },
      'Mercury': { sign: 'Virgo', degree: 15 },
      'Jupiter': { sign: 'Cancer', degree: 5 },
      'Venus': { sign: 'Pisces', degree: 27 },
      'Saturn': { sign: 'Libra', degree: 20 }
    };

    const exaltation = exaltationDegrees[planet.name];
    if (exaltation && planet.sign === exaltation.sign) {
      if (Math.abs(planet.degreeInSign - exaltation.degree) < 5) {
        strength = 'Exalted';
      } else {
        strength = 'Strong';
      }
    }

    // Check if planet is in own sign
    const ownSigns = {
      'Sun': ['Leo'],
      'Moon': ['Cancer'],
      'Mars': ['Aries', 'Scorpio'],
      'Mercury': ['Gemini', 'Virgo'],
      'Jupiter': ['Sagittarius', 'Pisces'],
      'Venus': ['Taurus', 'Libra'],
      'Saturn': ['Capricorn', 'Aquarius']
    };

    if (ownSigns[planet.name]?.includes(planet.sign)) {
      strength = strength === 'Medium' ? 'Strong' : strength;
    }

    return {
      level: strength,
      score: this.getStrengthScore(strength)
    };
  }

  getStrengthScore(level) {
    const scores = {
      'Exalted': 100,
      'Strong': 75,
      'Medium': 50,
      'Weak': 25,
      'Debilitated': 0
    };
    return scores[level] || 50;
  }
}

module.exports = new EnhancedSwissEphemerisService();
