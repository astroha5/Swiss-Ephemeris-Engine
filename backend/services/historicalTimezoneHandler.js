/**
 * Historical Timezone Handler for Accurate Astrology Calculations
 * Handles timezone variations before standardization (pre-1955)
 */

const moment = require('moment-timezone');
const logger = require('../utils/logger');

class HistoricalTimezoneHandler {
  constructor() {
    // Historical timezone data for India
    this.indiaTimezoneHistory = [
      {
        startYear: 1800,
        endYear: 1863,
        description: "Local Mean Time (LMT) - Pre-standardization",
        offsetFunction: this.calculateLocalMeanTime.bind(this)
      },
      {
        startYear: 1863,
        endYear: 1905,
        description: "Local Mean Time (LMT)",
        offsetFunction: this.calculateLocalMeanTime.bind(this)
      },
      {
        startYear: 1905,
        endYear: 1942,
        description: "Bombay Time",
        offset: 4.85, // UTC+4:51 (4 hours 51 minutes)
        fixedOffset: true
      },
      {
        startYear: 1942,
        endYear: 1945,
        description: "Indian Standard Time (Wartime)",
        offset: 6.5, // UTC+6:30 during WWII
        fixedOffset: true
      },
      {
        startYear: 1945,
        endYear: 1947,
        description: "Bombay Time (Post-war)",
        offset: 4.85, // UTC+4:51
        fixedOffset: true
      },
      {
        startYear: 1947,
        endYear: 9999,
        description: "Indian Standard Time",
        offset: 5.5, // UTC+5:30
        fixedOffset: true
      }
    ];

    // Historical timezone data for major international locations
    this.internationalTimezoneHistory = {
      // United States (Eastern Time Zone)
      'US_Eastern': [
        {
          startYear: 1800,
          endYear: 1883,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1883,
          endYear: 1918,
          description: "Eastern Standard Time",
          offset: -5, // UTC-5
          fixedOffset: true
        },
        {
          startYear: 1918,
          endYear: 1919,
          description: "Eastern War Time",
          offset: -4, // UTC-4 (DST during WWI)
          fixedOffset: true
        },
        {
          startYear: 1919,
          endYear: 1942,
          description: "Eastern Standard Time",
          offset: -5, // UTC-5
          fixedOffset: true
        },
        {
          startYear: 1942,
          endYear: 1945,
          description: "Eastern War Time",
          offset: -4, // UTC-4 (DST during WWII)
          fixedOffset: true
        },
        {
          startYear: 1945,
          endYear: 9999,
          description: "Eastern Standard Time",
          offset: -5, // UTC-5 (standard)
          fixedOffset: true
        }
      ],
      // United States (Central Time Zone)
      'US_Central': [
        {
          startYear: 1800,
          endYear: 1883,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1883,
          endYear: 1918,
          description: "Central Standard Time",
          offset: -6, // UTC-6
          fixedOffset: true
        },
        {
          startYear: 1918,
          endYear: 1919,
          description: "Central War Time",
          offset: -5, // UTC-5 (DST during WWI)
          fixedOffset: true
        },
        {
          startYear: 1919,
          endYear: 1942,
          description: "Central Standard Time",
          offset: -6, // UTC-6
          fixedOffset: true
        },
        {
          startYear: 1942,
          endYear: 1945,
          description: "Central War Time",
          offset: -5, // UTC-5 (DST during WWII)
          fixedOffset: true
        },
        {
          startYear: 1945,
          endYear: 9999,
          description: "Central Standard Time",
          offset: -6, // UTC-6 (standard)
          fixedOffset: true
        }
      ],
      // United States (Mountain Time Zone)
      'US_Mountain': [
        {
          startYear: 1800,
          endYear: 1883,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1883,
          endYear: 1918,
          description: "Mountain Standard Time",
          offset: -7, // UTC-7
          fixedOffset: true
        },
        {
          startYear: 1918,
          endYear: 1919,
          description: "Mountain War Time",
          offset: -6, // UTC-6 (DST during WWI)
          fixedOffset: true
        },
        {
          startYear: 1919,
          endYear: 1942,
          description: "Mountain Standard Time",
          offset: -7, // UTC-7
          fixedOffset: true
        },
        {
          startYear: 1942,
          endYear: 1945,
          description: "Mountain War Time",
          offset: -6, // UTC-6 (DST during WWII)
          fixedOffset: true
        },
        {
          startYear: 1945,
          endYear: 9999,
          description: "Mountain Standard Time",
          offset: -7, // UTC-7 (standard)
          fixedOffset: true
        }
      ],
      // United States (Pacific Time Zone)
      'US_Pacific': [
        {
          startYear: 1800,
          endYear: 1883,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1883,
          endYear: 1918,
          description: "Pacific Standard Time",
          offset: -8, // UTC-8
          fixedOffset: true
        },
        {
          startYear: 1918,
          endYear: 1919,
          description: "Pacific War Time",
          offset: -7, // UTC-7 (DST during WWI)
          fixedOffset: true
        },
        {
          startYear: 1919,
          endYear: 1942,
          description: "Pacific Standard Time",
          offset: -8, // UTC-8
          fixedOffset: true
        },
        {
          startYear: 1942,
          endYear: 1945,
          description: "Pacific War Time",
          offset: -7, // UTC-7 (DST during WWII)
          fixedOffset: true
        },
        {
          startYear: 1945,
          endYear: 9999,
          description: "Pacific Standard Time",
          offset: -8, // UTC-8 (standard)
          fixedOffset: true
        }
      ],
      // United Kingdom
      'UK': [
        {
          startYear: 1800,
          endYear: 1880,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1880,
          endYear: 1916,
          description: "Greenwich Mean Time",
          offset: 0, // UTC+0
          fixedOffset: true
        },
        {
          startYear: 1916,
          endYear: 1940,
          description: "British Summer Time (seasonal)",
          offset: 0, // UTC+0 (approximating as GMT for historical accuracy)
          fixedOffset: true
        },
        {
          startYear: 1940,
          endYear: 1945,
          description: "British Double Summer Time",
          offset: 1, // UTC+1 (war time)
          fixedOffset: true
        },
        {
          startYear: 1945,
          endYear: 9999,
          description: "Greenwich Mean Time",
          offset: 0, // UTC+0
          fixedOffset: true
        }
      ],
      // Austria/Germany (Central European Time)
      'Austria': [
        {
          startYear: 1800,
          endYear: 1893,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1893,
          endYear: 1940,
          description: "Central European Time",
          offset: 1, // UTC+1
          fixedOffset: true
        },
        {
          startYear: 1940,
          endYear: 1945,
          description: "Central European Time (War Time)",
          offset: 2, // UTC+2 during WWII
          fixedOffset: true
        },
        {
          startYear: 1945,
          endYear: 9999,
          description: "Central European Time",
          offset: 1, // UTC+1
          fixedOffset: true
        }
      ],
      // Tibet/China
      'Tibet': [
        {
          startYear: 1800,
          endYear: 1927,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1927,
          endYear: 9999,
          description: "China Standard Time",
          offset: 8, // UTC+8
          fixedOffset: true
        }
      ],
      // Hong Kong
      'Hong_Kong': [
        {
          startYear: 1800,
          endYear: 1904,
          description: "Local Mean Time",
          offsetFunction: this.calculateLocalMeanTime.bind(this)
        },
        {
          startYear: 1904,
          endYear: 1941,
          description: "Hong Kong Time",
          offset: 8, // UTC+8
          fixedOffset: true
        },
        {
          startYear: 1941,
          endYear: 1945,
          description: "Japan Standard Time (Occupation)",
          offset: 9, // UTC+9 during Japanese occupation
          fixedOffset: true
        },
        {
          startYear: 1945,
          endYear: 9999,
          description: "Hong Kong Time",
          offset: 8, // UTC+8
          fixedOffset: true
        }
      ]
    };

    // Historical coordinates for major Indian cities
    this.historicalCoordinates = {
      "Allahabad": { lat: 25.4358, lng: 81.8463, lmt: 5.457 }, // 5h 27m 25s
      "Mumbai": { lat: 19.076, lng: 72.8777, lmt: 4.858 }, // 4h 51m 29s  
      "Kolkata": { lat: 22.5726, lng: 88.3639, lmt: 5.891 }, // 5h 53m 28s
      "Porbandar": { lat: 21.6417, lng: 69.6293, lmt: 4.621 }, // 4h 37m 16s
      "Vadnagar": { lat: 23.7864, lng: 72.6411, lmt: 4.843 }, // 4h 50m 35s
      "Rameswaram": { lat: 9.2876, lng: 79.3129, lmt: 5.287 }, // 5h 17m 13s
      "Mhow": { lat: 22.5522, lng: 75.7566, lmt: 5.051 } // 5h 3m 4s
    };
  }

  /**
   * Calculate Local Mean Time offset based on longitude
   * LMT = UTC + (longitude_degrees / 15)
   */
  calculateLocalMeanTime(longitude) {
    return longitude / 15; // 15 degrees = 1 hour
  }

  /**
   * Identify international timezone region based on location and timezone string
   */
  identifyInternationalTimezone(place, timezone, coordinates) {
    const placeStr = (place || '').toLowerCase();
    const timezoneStr = (timezone || '').toLowerCase();
    
    // Direct timezone string mapping
    if (timezoneStr.includes('america/new_york') || 
        timezoneStr.includes('us/eastern') || 
        timezoneStr.includes('america/detroit')) {
      return 'US_Eastern';
    }
    
    if (timezoneStr.includes('america/chicago') || 
        timezoneStr.includes('us/central') || 
        timezoneStr.includes('america/dallas')) {
      return 'US_Central';
    }
    
    if (timezoneStr.includes('america/denver') || 
        timezoneStr.includes('us/mountain') || 
        timezoneStr.includes('america/phoenix')) {
      return 'US_Mountain';
    }
    
    if (timezoneStr.includes('america/los_angeles') || 
        timezoneStr.includes('us/pacific') || 
        timezoneStr.includes('america/san_francisco')) {
      return 'US_Pacific';
    }
    
    if (timezoneStr.includes('europe/london') || 
        timezoneStr.includes('gb') || 
        timezoneStr.includes('gmt')) {
      return 'UK';
    }
    
    if (timezoneStr.includes('europe/vienna') || 
        timezoneStr.includes('europe/berlin') || 
        timezoneStr.includes('cet')) {
      return 'Austria';
    }
    
    if (timezoneStr.includes('asia/shanghai') || 
        timezoneStr.includes('asia/chongqing') || 
        timezoneStr.includes('prc')) {
      return 'Tibet';
    }
    
    if (timezoneStr.includes('asia/hong_kong') || 
        timezoneStr.includes('hkt')) {
      return 'Hong_Kong';
    }
    
    // Location-based mapping (specific cities/states)
    if (placeStr.includes('new york') || 
        placeStr.includes('brooklyn') || 
        placeStr.includes('manhattan') || 
        placeStr.includes('queens') || 
        placeStr.includes('boston') || 
        placeStr.includes('miami') || 
        placeStr.includes('florida') || 
        placeStr.includes('georgia') || 
        placeStr.includes('virginia')) {
      return 'US_Eastern';
    }
    
    if (placeStr.includes('chicago') || 
        placeStr.includes('dallas') || 
        placeStr.includes('houston') || 
        placeStr.includes('mississippi') || 
        placeStr.includes('alabama') || 
        placeStr.includes('louisiana') || 
        placeStr.includes('tennessee') || 
        placeStr.includes('missouri') || 
        placeStr.includes('illinois') || 
        placeStr.includes('wisconsin') || 
        placeStr.includes('minnesota')) {
      return 'US_Central';
    }
    
    if (placeStr.includes('denver') || 
        placeStr.includes('phoenix') || 
        placeStr.includes('salt lake') || 
        placeStr.includes('colorado') || 
        placeStr.includes('utah') || 
        placeStr.includes('arizona') || 
        placeStr.includes('montana') || 
        placeStr.includes('wyoming') || 
        placeStr.includes('new mexico')) {
      return 'US_Mountain';
    }
    
    if (placeStr.includes('los angeles') || 
        placeStr.includes('san francisco') || 
        placeStr.includes('seattle') || 
        placeStr.includes('portland') || 
        placeStr.includes('california') || 
        placeStr.includes('oregon') || 
        placeStr.includes('washington') || 
        placeStr.includes('nevada')) {
      return 'US_Pacific';
    }
    
    if (placeStr.includes('london') || 
        placeStr.includes('england') || 
        placeStr.includes('uk') || 
        placeStr.includes('united kingdom') || 
        placeStr.includes('britain') || 
        placeStr.includes('great britain')) {
      return 'UK';
    }
    
    if (placeStr.includes('austria') || 
        placeStr.includes('vienna') || 
        placeStr.includes('linz') || 
        placeStr.includes('germany') || 
        placeStr.includes('berlin') || 
        placeStr.includes('munich')) {
      return 'Austria';
    }
    
    if (placeStr.includes('tibet') || 
        placeStr.includes('lhasa') || 
        placeStr.includes('china') || 
        placeStr.includes('shanghai')) {
      return 'Tibet';
    }
    
    if (placeStr.includes('hong kong') || 
        placeStr.includes('hongkong')) {
      return 'Hong_Kong';
    }
    
    // Coordinate-based approximation (if available)
    if (coordinates) {
      const { lat, lng } = coordinates;
      
      // US Eastern (roughly 25-47°N, 67-82°W)
      if (lat >= 25 && lat <= 47 && lng >= -82 && lng <= -67) {
        return 'US_Eastern';
      }
      
      // US Central (roughly 25-49°N, 87-106°W)
      if (lat >= 25 && lat <= 49 && lng >= -106 && lng <= -87) {
        return 'US_Central';
      }
      
      // US Mountain (roughly 25-49°N, 109-115°W)
      if (lat >= 25 && lat <= 49 && lng >= -115 && lng <= -109) {
        return 'US_Mountain';
      }
      
      // US Pacific (roughly 25-49°N, 117-125°W)
      if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -117) {
        return 'US_Pacific';
      }
      
      // UK (roughly 50-60°N, 8°W-2°E)
      if (lat >= 50 && lat <= 60 && lng >= -8 && lng <= 2) {
        return 'UK';
      }
      
      // Austria/Germany (roughly 47-55°N, 6-17°E)
      if (lat >= 47 && lat <= 55 && lng >= 6 && lng <= 17) {
        return 'Austria';
      }
      
      // Tibet/China (roughly 25-40°N, 75-105°E)
      if (lat >= 25 && lat <= 40 && lng >= 75 && lng <= 105) {
        return 'Tibet';
      }
      
      // Hong Kong (roughly 22°N, 114°E)
      if (lat >= 21 && lat <= 23 && lng >= 113 && lng <= 115) {
        return 'Hong_Kong';
      }
    }
    
    return null;
  }

  /**
   * Get historical timezone offset for given date and location
   * Enhanced with strict validation and error handling
   */
  getHistoricalOffset(year, place, longitude, timezone, coordinates) {
    logger.debug(`🔍 getHistoricalOffset called: year=${year}, place=${place}, longitude=${longitude}, timezone=${timezone}`);
    
    // For Indian locations
    if (place && (place.includes('India') || this.historicalCoordinates[place.split(',')[0]])) {
      const rule = this.indiaTimezoneHistory.find(rule => 
        year >= rule.startYear && year <= rule.endYear
      );

      if (rule) {
        if (rule.fixedOffset) {
          logger.info(`🕐 Historical TZ (India): ${year} - ${rule.description} (UTC+${rule.offset})`);
          return rule.offset;
        } else if (rule.offsetFunction) {
          const offset = rule.offsetFunction(longitude);
          logger.info(`🕐 Historical TZ (India LMT): ${year} - ${rule.description} (UTC+${offset.toFixed(3)})`);
          return offset;
        }
      }
      
      // If we reach here for an Indian location, that's an error
      logger.error(`❌ No Indian timezone rule found for year ${year}`);
      throw new Error(`No Indian timezone rule found for year ${year}`);
    }

    // For international locations, try to identify timezone region
    const internationalRegion = this.identifyInternationalTimezone(place, timezone, coordinates);
    logger.debug(`🌍 Identified international region: ${internationalRegion}`);
    
    if (internationalRegion && this.internationalTimezoneHistory[internationalRegion]) {
      const rules = this.internationalTimezoneHistory[internationalRegion];
      const rule = rules.find(rule => year >= rule.startYear && year <= rule.endYear);
      
      if (rule) {
        if (rule.fixedOffset) {
          logger.info(`🌍 International Historical TZ: ${year} - ${internationalRegion} - ${rule.description} (UTC${rule.offset >= 0 ? '+' : ''}${rule.offset})`);
          return rule.offset;
        } else if (rule.offsetFunction) {
          const offset = rule.offsetFunction(longitude);
          logger.info(`🌍 International Historical TZ (LMT): ${year} - ${internationalRegion} - ${rule.description} (UTC${offset >= 0 ? '+' : ''}${offset.toFixed(3)})`);
          return offset;
        }
      }
      
      // If we have the region but no rule, that's an error
      logger.error(`❌ No timezone rule found for ${internationalRegion} in year ${year}`);
      throw new Error(`No timezone rule found for ${internationalRegion} in year ${year}`);
    }

    // Validate timezone string format and use modern offset as fallback
    if (timezone) {
      if (!this.isValidIANATimezone(timezone)) {
        logger.error(`❌ Invalid timezone format: ${timezone}. Expected IANA format (e.g., 'America/New_York')`);
        throw new Error(`Invalid timezone format: ${timezone}. Expected IANA format (e.g., 'America/New_York')`);
      }
      
      // For non-Indian locations with valid timezone, use modern timezone offset as fallback
      try {
        const modernOffset = moment.tz.zone(timezone).utcOffset(moment().valueOf()) / -60; // Convert minutes to hours, invert sign
        logger.warn(`⚠️ No historical timezone data for ${place} (${year}), using modern ${timezone} offset: UTC${modernOffset >= 0 ? '+' : ''}${modernOffset}`);
        return modernOffset;
      } catch (error) {
        logger.error(`❌ Error getting modern timezone offset for ${timezone}:`, error);
        throw new Error(`Failed to resolve timezone ${timezone}: ${error.message}`);
      }
    }

    // If no timezone provided, try to determine based on coordinates (LMT fallback)
    if (coordinates && coordinates.lng) {
      const lmtOffset = this.calculateLocalMeanTime(coordinates.lng);
      logger.warn(`⚠️ No timezone data for ${place} (${year}), using Local Mean Time based on coordinates: UTC${lmtOffset >= 0 ? '+' : ''}${lmtOffset.toFixed(3)}`);
      return lmtOffset;
    }

    // Last resort: error if no timezone or coordinates available
    logger.error(`❌ No timezone data available for non-Indian location: place=${place}, year=${year}, timezone=${timezone}`);
    throw new Error(`No timezone data available for location '${place}' in year ${year}. Provide a valid IANA timezone (e.g., 'America/New_York') or coordinates.`);
  }

  /**
   * Convert historical time to accurate UTC with enhanced logging
   */
  convertToUTC(date, time, place, coordinates, timezone) {
    try {
      // SAFETY: Ensure coordinates have both lat/lng and latitude/longitude properties
      if (coordinates) {
        coordinates.lng = coordinates.lng ?? coordinates.longitude;
        coordinates.lat = coordinates.lat ?? coordinates.latitude;
        coordinates.longitude = coordinates.longitude ?? coordinates.lng;
        coordinates.latitude = coordinates.latitude ?? coordinates.lat;
      }
      
      const year = parseInt(date.split('-')[0]);
      
      logger.info(`🔍 TIMEZONE CONVERSION START:`);
      logger.info(`   📅 Original: ${date} ${time}`);
      logger.info(`   📍 Place: ${place}`);
      logger.info(`   🌐 Timezone: ${timezone}`);
      logger.info(`   📊 Coordinates: ${coordinates ? `${coordinates.lat}°N, ${coordinates.lng}°E` : 'Not provided'}`);
      logger.info(`   🗓️ Year: ${year} (Historical: ${year < 1955 ? 'YES' : 'NO'})`);
      
      // For historical dates (pre-1955), use historical offset
      if (year < 1955) {
        // Get coordinates without defaulting to Indian longitude for non-Indian places
        let longitude = null;
        if (coordinates && coordinates.lng) {
          longitude = coordinates.lng;
        } else if (place) {
          const cityName = place.split(',')[0].trim();
          const historicalCoords = this.historicalCoordinates[cityName];
          if (historicalCoords) {
            longitude = historicalCoords.lng;
          }
        }
        
        // If we still don't have coordinates, we need to be more careful
        if (!longitude && !timezone) {
          logger.error(`❌ Missing coordinates and timezone for historical date: ${place} (${year})`);
          throw new Error(`Historical date ${year} requires either coordinates or a valid IANA timezone for '${place}'. Please provide coordinates or timezone (e.g., 'America/New_York').`);
        }
        
        logger.debug(`   🧭 Using longitude: ${longitude ? longitude + '°E' : 'Not available (will use timezone)'}`);
        
        const historicalOffset = this.getHistoricalOffset(year, place, longitude, timezone, coordinates);
        
        logger.info(`   ⏰ Historical offset: UTC${historicalOffset >= 0 ? '+' : ''}${historicalOffset}`);
        
        // Parse time manually and apply historical offset
        const [hours, minutes] = time.split(':').map(Number);
        const localTimeDecimal = hours + (minutes / 60);
        const utcTimeDecimal = localTimeDecimal - historicalOffset;
        
        logger.debug(`   🕐 Local time decimal: ${localTimeDecimal.toFixed(3)}`);
        logger.debug(`   🌍 UTC time decimal: ${utcTimeDecimal.toFixed(3)}`);
        
        // Handle day rollover
        let utcDate = date;
        let finalUTCHour = utcTimeDecimal;
        let dayShift = 0;
        
        if (utcTimeDecimal < 0) {
          // Previous day
          finalUTCHour += 24;
          const prevDay = moment(date).subtract(1, 'day');
          utcDate = prevDay.format('YYYY-MM-DD');
          dayShift = -1;
          logger.debug(`   📅 Day rollover: Previous day (${dayShift})`);
        } else if (utcTimeDecimal >= 24) {
          // Next day
          finalUTCHour -= 24;
          const nextDay = moment(date).add(1, 'day');
          utcDate = nextDay.format('YYYY-MM-DD');
          dayShift = +1;
          logger.debug(`   📅 Day rollover: Next day (${dayShift})`);
        }
        
        let utcHours = Math.floor(finalUTCHour);
        let utcMinutes = Math.round((finalUTCHour % 1) * 60);
        
        // Handle edge case where rounding minutes to 60
        if (utcMinutes >= 60) {
          utcMinutes = 0;
          utcHours += 1;
          
          // Handle hour rollover to next day
          if (utcHours >= 24) {
            utcHours = 0;
            const nextDay = moment(utcDate).add(1, 'day');
            utcDate = nextDay.format('YYYY-MM-DD');
            dayShift += 1;
            logger.debug(`   📅 Additional day rollover due to minute rounding`);
          }
        }
        
        const finalUTCTime = `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
        
        logger.info(`   ✅ RESULT: ${utcDate} ${finalUTCTime} UTC`);
        logger.info(`   📊 Day shift: ${dayShift}`);
        logger.info(`   🔢 Offset source: Historical (${year < 1955 ? 'pre-1955' : 'modern'})`);
        
        return {
          utcMoment: moment.utc(`${utcDate} ${finalUTCTime}`, 'YYYY-MM-DD HH:mm'),
          historicalOffset: historicalOffset,
          isHistorical: true,
          conversionDetails: {
            originalLocal: `${date} ${time}`,
            finalUTC: `${utcDate} ${finalUTCTime}`,
            offsetUsed: historicalOffset,
            dayShift: dayShift,
            source: 'historical'
          }
        };
      } else {
        // Modern dates - use standard timezone conversion
        const momentObj = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone || 'Asia/Kolkata');
        const utcMoment = momentObj.utc();
        
        logger.info(`   🕐 Modern timezone conversion using ${timezone || 'Asia/Kolkata'}`);
        logger.info(`   ✅ RESULT: ${utcMoment.format('YYYY-MM-DD HH:mm')} UTC`);
        logger.info(`   🔢 Offset source: Modern timezone data`);
        
        return {
          utcMoment: utcMoment,
          historicalOffset: null,
          isHistorical: false,
          conversionDetails: {
            originalLocal: `${date} ${time}`,
            finalUTC: utcMoment.format('YYYY-MM-DD HH:mm'),
            offsetUsed: null,
            dayShift: 0,
            source: 'modern'
          }
        };
      }
      
    } catch (error) {
      logger.error(`❌ TIMEZONE CONVERSION FAILED:`);
      logger.error(`   📅 Input: ${date} ${time}`);
      logger.error(`   📍 Place: ${place}`);
      logger.error(`   🌐 Timezone: ${timezone}`);
      logger.error(`   💥 Error: ${error.message}`);
      logger.error(`   📚 Stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Get enhanced Julian Day with historical timezone correction
   */
  getEnhancedJulianDay(swisseph, date, time, place, coordinates, timezone) {
    const conversion = this.convertToUTC(date, time, place, coordinates, timezone);
    const utcMoment = conversion.utcMoment;
    
    const year = utcMoment.year();
    const month = utcMoment.month() + 1; // moment months are 0-indexed
    const day = utcMoment.date();
    const hour = utcMoment.hour() + (utcMoment.minute() / 60.0) + (utcMoment.second() / 3600.0);

    const julianDay = swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);
    
    logger.info(`📊 Enhanced JD: ${julianDay.toFixed(8)} (Historical: ${conversion.isHistorical})`);
    
    return {
      julianDay,
      isHistorical: conversion.isHistorical,
      historicalOffset: conversion.historicalOffset,
      utcDetails: {
        year,
        month, 
        day,
        hour: hour.toFixed(4),
        utcTimestamp: utcMoment.format('YYYY-MM-DDTHH:mm:ss[Z]'),
        exactDecimalHour: hour
      }
    };
  }

  /**
   * Validate coordinates against historical records
   */
  validateCoordinates(place, providedCoordinates) {
    if (!place) return providedCoordinates;
    
    const cityName = place.split(',')[0].trim();
    const historical = this.historicalCoordinates[cityName];
    
    if (historical && providedCoordinates) {
      const latDiff = Math.abs(providedCoordinates.lat - historical.lat);
      const lngDiff = Math.abs(providedCoordinates.lng - historical.lng);
      
      if (latDiff > 0.1 || lngDiff > 0.1) {
        logger.warn(`⚠️ Coordinate mismatch for ${cityName}:`);
        logger.warn(`   Provided: ${providedCoordinates.lat}°N, ${providedCoordinates.lng}°E`);
        logger.warn(`   Historical: ${historical.lat}°N, ${historical.lng}°E`);
        logger.warn(`   Using historical coordinates for accuracy`);
        return historical;
      }
    }
    
    return providedCoordinates || historical;
  }

  /**
   * Validate IANA timezone format
   */
  isValidIANATimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') return false;
    
    // Check if it's a valid IANA timezone using moment-timezone
    try {
      const zone = moment.tz.zone(timezone);
      return zone !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get comprehensive timezone info for debugging
   */
  getTimezoneDebugInfo(date, place, coordinates, timezone) {
    const year = parseInt(date.split('-')[0]);
    const coords = this.validateCoordinates(place, coordinates);
    
    try {
      // For historical dates, determine longitude without defaulting to Indian longitude
      let longitude = null;
      if (year < 1955) {
        if (coordinates && coordinates.lng) {
          longitude = coordinates.lng;
        } else if (place) {
          const cityName = place.split(',')[0].trim();
          const historicalCoords = this.historicalCoordinates[cityName];
          if (historicalCoords) {
            longitude = historicalCoords.lng;
          }
        }
      } else {
        longitude = coords?.lng || 77.2090; // Modern dates can use default
      }
      
      const historicalOffset = this.getHistoricalOffset(year, place, longitude, timezone, coords);
      
      return {
        year,
        place,
        coordinates: coords,
        timezone,
        isHistorical: year < 1955,
        suggestedOffset: historicalOffset,
        modernOffset: timezone ? (moment.tz.zone(timezone)?.utcOffset(moment().valueOf()) / -60) : 5.5,
        validTimezone: this.isValidIANATimezone(timezone),
        internationalRegion: this.identifyInternationalTimezone(place, timezone, coords)
      };
    } catch (error) {
      return {
        year,
        place,
        coordinates: coords,
        timezone,
        isHistorical: year < 1955,
        error: error.message,
        validTimezone: this.isValidIANATimezone(timezone),
        internationalRegion: this.identifyInternationalTimezone(place, timezone, coords)
      };
    }
  }
}

module.exports = new HistoricalTimezoneHandler();
