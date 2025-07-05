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
   * Get historical timezone offset for given date and location
   */
  getHistoricalOffset(year, place, longitude) {
    // For Indian locations
    if (place && (place.includes('India') || this.historicalCoordinates[place.split(',')[0]])) {
      const rule = this.indiaTimezoneHistory.find(rule => 
        year >= rule.startYear && year <= rule.endYear
      );

      if (rule) {
        if (rule.fixedOffset) {
          logger.info(`🕐 Historical TZ: ${year} - ${rule.description} (UTC+${rule.offset})`);
          return rule.offset;
        } else if (rule.offsetFunction) {
          const offset = rule.offsetFunction(longitude);
          logger.info(`🕐 Historical TZ: ${year} - ${rule.description} (UTC+${offset.toFixed(3)})`);
          return offset;
        }
      }
    }

    // Default to modern IST for fallback
    logger.warn(`⚠️ No historical timezone data for ${year}, using IST default`);
    return 5.5;
  }

  /**
   * Convert historical time to accurate UTC
   */
  convertToUTC(date, time, place, coordinates, timezone) {
    try {
      const momentObj = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone || 'Asia/Kolkata');
      const year = parseInt(date.split('-')[0]);
      
      logger.info(`🔍 Converting historical time: ${date} ${time} at ${place}`);
      
      // For historical dates (pre-1955), use historical offset
      if (year < 1955) {
        const longitude = coordinates ? coordinates.lng : (this.historicalCoordinates[place?.split(',')[0]]?.lng || 77.2090);
        const historicalOffset = this.getHistoricalOffset(year, place, longitude);
        
        // Parse time manually and apply historical offset
        const [hours, minutes] = time.split(':').map(Number);
        const localTimeDecimal = hours + (minutes / 60);
        const utcTimeDecimal = localTimeDecimal - historicalOffset;
        
        // Handle day rollover
        let utcDate = date;
        let finalUTCHour = utcTimeDecimal;
        
        if (utcTimeDecimal < 0) {
          // Previous day
          finalUTCHour += 24;
          const prevDay = moment(date).subtract(1, 'day');
          utcDate = prevDay.format('YYYY-MM-DD');
        } else if (utcTimeDecimal >= 24) {
          // Next day
          finalUTCHour -= 24;
          const nextDay = moment(date).add(1, 'day');
          utcDate = nextDay.format('YYYY-MM-DD');
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
          }
        }
        
        logger.info(`📅 Historical conversion: ${date} ${time} → ${utcDate} ${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')} UTC`);
        
        return {
          utcMoment: moment.utc(`${utcDate} ${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`, 'YYYY-MM-DD HH:mm'),
          historicalOffset: historicalOffset,
          isHistorical: true
        };
      } else {
        // Modern dates - use standard timezone conversion
        logger.info(`🕐 Modern time conversion using ${timezone}`);
        return {
          utcMoment: momentObj.utc(),
          historicalOffset: null,
          isHistorical: false
        };
      }
      
    } catch (error) {
      logger.error('Error in historical timezone conversion:', error);
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
        hour: hour.toFixed(4)
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
   * Get comprehensive timezone info for debugging
   */
  getTimezoneDebugInfo(date, place, coordinates) {
    const year = parseInt(date.split('-')[0]);
    const coords = this.validateCoordinates(place, coordinates);
    
    return {
      year,
      place,
      coordinates: coords,
      isHistorical: year < 1955,
      suggestedOffset: this.getHistoricalOffset(year, place, coords?.lng || 77.2090),
      modernOffset: 5.5
    };
  }
}

module.exports = new HistoricalTimezoneHandler();
