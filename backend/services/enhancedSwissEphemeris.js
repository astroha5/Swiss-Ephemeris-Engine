const moment = require('moment-timezone');
const logger = require('../utils/logger');
const historicalTimezoneHandler = require('./historicalTimezoneHandler');
const astronomyEngine = require('./astronomyEngine');

// Use Astronomy Engine as primary, Swiss Ephemeris as optional enhancement
let swisseph;
let useSwissEph = false;

try {
  swisseph = require('swisseph');
  // logger.info('Swiss Ephemeris loaded successfully - will use for enhanced accuracy');
  useSwissEph = true;
} catch (error) {
  // logger.warn('Swiss Ephemeris not available, using Astronomy Engine:', error.message);
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
      // logger.info(`🔧 DEBUG - Setting Lahiri Ayanamsa: SE_SIDM_LAHIRI = ${swisseph.SE_SIDM_LAHIRI}`);
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      // logger.info(`🔧 DEBUG - Lahiri Ayanamsa set successfully`);
      
      this.isInitialized = true;
      // logger.info('Enhanced Swiss Ephemeris initialized with Lahiri Ayanamsa');
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
        // logger.info(`⚠️  Using fallback Julian Day calculation (Swiss Ephemeris not available)`);
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
      // Note: localDetails and offsetMinutes properties don't exist in the enhanced JD object
      // Only utcDetails, julianDay, isHistorical, and historicalOffset are available
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
   * Convert Julian Day back to date/time for astronomy engine
   */
  julianDayToDateTime(julianDay) {
    // Simplified conversion - in production, use proper astronomical conversion
    const jd = julianDay + 0.5;
    const z = Math.floor(jd);
    const f = jd - z;

    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }

    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);

    const day = b - d - Math.floor(30.6001 * e) + f;
    const month = e < 14 ? e - 1 : e - 13;
    const year = c < 0 ? c - 4715 : (month > 2 ? c - 4716 : c - 4715);

    const hour = (day - Math.floor(day)) * 24;
    const date = `${year}-${month.toString().padStart(2, '0')}-${Math.floor(day).toString().padStart(2, '0')}`;
    const time = `${Math.floor(hour).toString().padStart(2, '0')}:${Math.floor((hour % 1) * 60).toString().padStart(2, '0')}`;

    return { date, time, timezone: 'UTC' };
  }

  /**
   * Calculate accurate planetary positions
   * @param {number} julianDay - Julian Day Number
   * @param {boolean} useTropical - Use tropical zodiac instead of sidereal (default: false)
   */
  getPlanetaryPositions(julianDay, useTropical = false) {
    try {
      // Convert Julian Day to date/time for astronomy engine
      const dateTime = this.julianDayToDateTime(julianDay);
      const positions = {};

      // Try Astronomy Engine first
      let astronomyPositions = {};
      let useAstronomyEngine = false;

      try {
        astronomyPositions = astronomyEngine.getPlanetaryPositions(
          dateTime.date, dateTime.time, dateTime.timezone
        ) || {};
        logger.info(`Astronomy Engine returned ${Object.keys(astronomyPositions).length} planets`);
        // Check if main planets are available (at least Sun, Moon, Mars, Jupiter, Saturn)
        const mainPlanets = ['sun', 'moon', 'mars', 'jupiter', 'saturn'];
        const hasMainPlanets = mainPlanets.some(planet => astronomyPositions[planet] && astronomyPositions[planet].sign);
        useAstronomyEngine = hasMainPlanets && Object.keys(astronomyPositions).length >= 7; // At least 7 planets
        logger.info(`useAstronomyEngine: ${useAstronomyEngine} (has main planets: ${hasMainPlanets})`);
      } catch (error) {
        // logger.warn('Astronomy Engine failed, falling back to Swiss Ephemeris:', error.message);
      }

      // If Astronomy Engine worked, use it as base
      if (useAstronomyEngine) {
        for (const [key, planet] of Object.entries(astronomyPositions)) {
          if (planet && planet.sign) {
            positions[key] = {
              name: planet.name,
              longitude: planet.longitude,
              latitude: planet.latitude,
              speed: planet.speed,
              sign: planet.sign,
              signNumber: planet.signNumber,
              degreeInSign: planet.degree,
              degreeFormatted: planet.degreeFormatted,
              nakshatra: planet.nakshatra,
              nakshatraPada: planet.nakshatraPada,
              isRetrograde: planet.isRetrograde,
              rawPosition: planet.longitude,
              signLord: this.getSignLord(planet.sign)
            };
          }
        }

        // Use Swiss Ephemeris for enhancement if available
        if (this.useSwissEph && !useTropical) {
          try {
            // logger.info('Using Swiss Ephemeris for enhanced accuracy...');
            const enhancedPositions = this.getSwissEphPositions(julianDay, useTropical);
            for (const [key, planet] of Object.entries(enhancedPositions)) {
              if (positions[key]) {
                positions[key].longitude = planet.longitude;
                positions[key].latitude = planet.latitude;
                positions[key].speed = planet.speed;
                positions[key].isRetrograde = planet.isRetrograde;
              }
            }
          } catch (swissError) {
            // logger.warn('Swiss Ephemeris enhancement failed:', swissError.message);
          }
        }
      } else {
        // Use Swiss Ephemeris as primary if Astronomy Engine failed
        if (this.useSwissEph && !useTropical) {
          try {
            // logger.info('Using Swiss Ephemeris as primary calculation engine...');
            const swissResult = this.getSwissEphPositions(julianDay, useTropical);
            const swissPositions = swissResult.planets;
            for (const [key, planet] of Object.entries(swissPositions)) {
              positions[key] = {
                name: planet.name,
                longitude: planet.longitude,
                latitude: planet.latitude,
                speed: planet.speed,
                sign: planet.sign,
                signNumber: planet.signNumber,
                degreeInSign: planet.degreeInSign,
                degreeFormatted: planet.degreeFormatted,
                nakshatra: planet.nakshatra,
                nakshatraPada: planet.nakshatraPada,
                isRetrograde: planet.isRetrograde,
                rawPosition: planet.longitude,
                signLord: this.getSignLord(planet.sign)
              };
            }
          } catch (swissError) {
            // logger.error('Both Astronomy Engine and Swiss Ephemeris failed:', swissError);
            throw new Error('All planetary calculation engines failed');
          }
        } else {
          throw new Error('No planetary calculation engine available');
        }
      }

      return { planets: positions, success: true };

    } catch (error) {
      logger.error('Error calculating planetary positions:', error);
      throw new Error(`Failed to calculate planetary positions: ${error.message}`);
    }
  }

  /**
   * Calculate positions using Swiss Ephemeris (for enhanced accuracy)
   */
  getSwissEphPositions(julianDay, useTropical = false) {
    const positions = {};
    const flags = useTropical ? swisseph.SEFLG_SPEED : (swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED);

    // DEBUG: Log calculation parameters
    // logger.info(`🔍 DEBUG - Julian Day: ${julianDay}`);
    // logger.info(`🔍 DEBUG - Calculation Type: ${useTropical ? 'TROPICAL' : 'SIDEREAL'}`);
    // logger.info(`🔍 DEBUG - Flags: ${flags} (SEFLG_SIDEREAL: ${swisseph.SEFLG_SIDEREAL})`);
    
    // CRITICAL: Re-verify and re-set Ayanamsa before calculations (only for sidereal)
    if (!useTropical && this.useSwissEph && this.isInitialized) {
      try {
        swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
        // logger.info(`🔄 Re-confirmed Lahiri Ayanamsa setting before planetary calculations`);
      } catch (error) {
        logger.error('Failed to re-set Ayanamsa:', error);
      }
    }

    // CRITICAL: Log current Ayanamsa for this specific Julian Day (only for sidereal)
    if (!useTropical) {
      try {
        const currentAyanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
        // logger.info(`📐 Ayanamsa (Lahiri) for JD ${julianDay.toFixed(8)}: ${currentAyanamsa.toFixed(6)}°`);
        // logger.info(`📐 Ayanamsa in DMS: ${this.formatDegree(currentAyanamsa)}`);
      } catch (error) {
        logger.error('Error getting Ayanamsa:', error);
      }
    } else {
      // logger.info(`🌍 Using Tropical zodiac - no Ayanamsa applied`);
    }
      
    try {
      for (const [planetName, planetId] of Object.entries(this.planets)) {
        if (planetName === 'KETU') continue; // Handle Ketu separately

        // logger.info(`🔍 DEBUG - Calculating ${planetName} (ID: ${planetId})`);
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

          // logger.info(`🌙 ========== MOON DETAILED ANALYSIS ==========`);
          // logger.info(`🌙 Raw longitude: ${longitude.toFixed(8)}°`);
          // logger.info(`🌙 Sign boundary: ${moonSignNumber * 30}° to ${(moonSignNumber + 1) * 30}°`);
          // logger.info(`🌙 Distance from sign start: ${moonDegreeInSign.toFixed(6)}°`);
          // logger.info(`🌙 Distance from sign end: ${(30 - moonDegreeInSign).toFixed(6)}°`);
          // logger.info(`🌙 Current sign: ${moonSignName} (#${moonSignNumber + 1})`);

          // Check if Moon is near sign boundaries (within 2 degrees)
          if (moonDegreeInSign < 2) {
            const prevSign = moonSignNumber > 0 ? this.zodiacSigns[moonSignNumber - 1] : this.zodiacSigns[11];
            // logger.warn(`⚠️ MOON NEAR BOUNDARY: Only ${moonDegreeInSign.toFixed(4)}° from ${prevSign}/${moonSignName} boundary!`);
          } else if (moonDegreeInSign > 28) {
            const nextSign = moonSignNumber < 11 ? this.zodiacSigns[moonSignNumber + 1] : this.zodiacSigns[0];
            // logger.warn(`⚠️ MOON NEAR BOUNDARY: Only ${(30 - moonDegreeInSign).toFixed(4)}° from ${moonSignName}/${nextSign} boundary!`);
          }

          // logger.info(`🌙 Final determination: Moon in ${moonSignName}`);
          // logger.info(`🌙 ==========================================`);
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
   * @param {number} julianDay - Julian Day Number
   * @param {number} latitude - Latitude in degrees
   * @param {number} longitude - Longitude in degrees
   * @param {boolean} useTropical - Use tropical zodiac instead of sidereal (default: false)
   */
  calculateAscendant(julianDay, latitude, longitude, useTropical = false) {
    try {
      // Convert Julian Day to date/time for astronomy engine
      const dateTime = this.julianDayToDateTime(julianDay);

      // Use Astronomy Engine as primary calculation method
      const ascendant = astronomyEngine.calculateAscendant(
        dateTime.date, dateTime.time, latitude, longitude, dateTime.timezone
      );

      // Add sign lord
      ascendant.signLord = this.getSignLord(ascendant.sign);

      // If Swiss Ephemeris is available, use it for enhanced accuracy
      if (this.useSwissEph && !useTropical) {
        try {
          // logger.info('Using Swiss Ephemeris for enhanced ascendant calculation...');
          const swissAscendant = this.calculateSwissEphAscendant(julianDay, latitude, longitude, useTropical);
          // Use Swiss Eph result if available
          return swissAscendant;
        } catch (swissError) {
          // logger.warn('Swiss Ephemeris ascendant calculation failed, using Astronomy Engine:', swissError.message);
        }
      }

      return ascendant;

    } catch (error) {
      logger.error('Error calculating ascendant:', error);
      throw new Error(`Failed to calculate ascendant: ${error.message}`);
    }
  }

  /**
   * Calculate ascendant using Swiss Ephemeris (for enhanced accuracy)
   */
  calculateSwissEphAscendant(julianDay, latitude, longitude, useTropical = false) {
    // CRITICAL: Re-confirm Ayanamsa setting before Ascendant calculation (only for sidereal)
    if (!useTropical) {
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      // logger.info(`🔄 Re-confirmed Lahiri Ayanamsa for Ascendant calculation`);
    }

    const flags = useTropical ? 0 : swisseph.SEFLG_SIDEREAL;
    // logger.info(`🌅 Calculating Ascendant with flags: ${flags}`);
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
   * Calculate Navamsa chart (D-9) - Fixed to match Lagna chart structure
   */
  calculateNavamsa(planetaryPositions) {
    const navamsaChart = {};

    console.log('🌟 Starting Navamsa calculations...');

    Object.entries(planetaryPositions).forEach(([planetKey, planet]) => {
      const navamsaPosition = this.calculateNavamsaPosition(planet.longitude);
      
      navamsaChart[planetKey] = {
        ...planet,
        // Keep original position data for reference
        originalLongitude: planet.longitude,
        originalSign: planet.sign,
        originalSignNumber: planet.signNumber,
        // Add Navamsa position data
        navamsaLongitude: navamsaPosition.longitude,
        navamsaSign: navamsaPosition.sign,
        navamsaSignNumber: navamsaPosition.signNumber,
        navamsaDegree: navamsaPosition.degree,
        navamsaSignLord: this.getSignLord(navamsaPosition.sign)
      };
      
      console.log(`🔄 ${planet.name}: ${planet.sign} ${planet.degreeFormatted} -> Navamsa: ${navamsaPosition.sign} ${this.formatDegree(navamsaPosition.degree)}`);
    });

    console.log('✅ Navamsa calculations completed');
    return navamsaChart;
  }

  /**
   * Calculate Navamsa position for a given longitude
   * Fixed to use proper Vedic astrology Navamsa calculation
   */
  calculateNavamsaPosition(longitude) {
    const signNumber = Math.floor(longitude / 30); // 0-indexed (0=Aries, 1=Taurus, etc.)
    const degreeInSign = longitude % 30;
    
    // Each sign is divided into 9 Navamsas of 3°20' each
    const navamsaNumber = Math.floor(degreeInSign / (30/9)); // 0-8
    
    // Calculate navamsa sign based on sign element (proper Vedic method):
    let navamsaSignNumber;
    
    if ([0, 4, 8].includes(signNumber)) { // Fire signs: Aries, Leo, Sagittarius
      navamsaSignNumber = (0 + navamsaNumber) % 12; // Start from Aries
    } else if ([1, 5, 9].includes(signNumber)) { // Earth signs: Taurus, Virgo, Capricorn
      navamsaSignNumber = (9 + navamsaNumber) % 12; // Start from Capricorn
    } else if ([2, 6, 10].includes(signNumber)) { // Air signs: Gemini, Libra, Aquarius
      navamsaSignNumber = (6 + navamsaNumber) % 12; // Start from Libra
    } else { // Water signs: Cancer, Scorpio, Pisces
      navamsaSignNumber = (3 + navamsaNumber) % 12; // Start from Cancer
    }

    // Calculate degree within navamsa sign
    const navamsaDegree = (degreeInSign % (30/9)) * 9;

    console.log(`🔄 Navamsa Position Calc: ${longitude}° -> ${this.zodiacSigns[signNumber]} ${degreeInSign.toFixed(2)}° -> Navamsa ${navamsaNumber + 1} -> ${this.zodiacSigns[navamsaSignNumber]} ${navamsaDegree.toFixed(2)}°`);

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
