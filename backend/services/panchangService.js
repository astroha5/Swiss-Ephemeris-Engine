const swisseph = require('swisseph');
const moment = require('moment-timezone');
const logger = require('../utils/logger');

class PanchangService {
  constructor() {
    this.tithiNames = [
      'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
      'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
      'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya'
    ];

    this.nakshatraNames = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ];

    this.yogaNames = [
      'Vishkumbha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
      'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva',
      'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan',
      'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
      'Brahma', 'Indra', 'Vaidhriti'
    ];

    this.karanaNames = [
      'Kimstughna', 'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija',
      'Vishti', 'Shakuni', 'Chatushpada', 'Naga'
    ];

    this.weekdays = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
  }

  /**
   * Calculate complete Panchang for given date, time, and location
   */
  calculatePanchang(date, time, latitude, longitude, timezone = 'Asia/Kolkata') {
    try {
      logger.info(`Calculating Panchang for ${date} ${time} at ${latitude}, ${longitude}`);

      const julianDay = this.getJulianDay(date, time, timezone);
      const sunPosition = this.getSunPosition(julianDay);
      const moonPosition = this.getMoonPosition(julianDay);

      // Calculate Tithi
      const tithi = this.calculateTithi(sunPosition, moonPosition, julianDay);

      // Calculate Nakshatra
      const nakshatra = this.calculateNakshatra(moonPosition, julianDay);

      // Calculate Yoga
      const yoga = this.calculateYoga(sunPosition, moonPosition, julianDay);

      // Calculate Karana
      const karana = this.calculateKarana(sunPosition, moonPosition, julianDay);

      // Calculate sunrise and sunset
      const sunTimes = this.calculateSunTimes(julianDay, latitude, longitude);

      // Calculate lunar month and year
      const lunarMonth = this.calculateLunarMonth(julianDay);

      // Calculate Ritu (season)
      const ritu = this.calculateRitu(sunPosition);

      // Calculate Paksha (fortnight)
      const paksha = tithi.index < 15 ? 'Shukla' : 'Krishna';

      // Calculate additional details
      const additionalDetails = this.calculateAdditionalDetails(julianDay, latitude, longitude);

      return {
        date: {
          gregorian: date,
          weekday: this.weekdays[moment(date).day()],
          lunarMonth: lunarMonth.name,
          lunarYear: lunarMonth.year,
          paksha: paksha,
          ritu: ritu
        },
        tithi: {
          name: tithi.name,
          index: tithi.index,
          percentage: tithi.percentage,
          endTime: tithi.endTime,
          lord: this.getTithiLord(tithi.index)
        },
        nakshatra: {
          name: nakshatra.name,
          index: nakshatra.index,
          percentage: nakshatra.percentage,
          endTime: nakshatra.endTime,
          lord: this.getNakshatraLord(nakshatra.index),
          pada: nakshatra.pada
        },
        yoga: {
          name: yoga.name,
          index: yoga.index,
          percentage: yoga.percentage,
          endTime: yoga.endTime,
          effect: this.getYogaEffect(yoga.index)
        },
        karana: {
          name: karana.name,
          index: karana.index,
          percentage: karana.percentage,
          endTime: karana.endTime,
          nature: this.getKaranaNature(karana.index)
        },
        sunTimes: {
          sunrise: sunTimes.sunrise,
          sunset: sunTimes.sunset,
          solarNoon: sunTimes.solarNoon,
          dayLength: sunTimes.dayLength
        },
        additionalInfo: additionalDetails,
        coordinates: {
          latitude: latitude,
          longitude: longitude,
          timezone: timezone
        },
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error calculating Panchang:', error);
      throw new Error(`Panchang calculation failed: ${error.message}`);
    }
  }

  /**
   * Convert date/time to Julian Day
   */
  getJulianDay(date, time, timezone) {
    const dateTimeString = `${date} ${time}`;
    const momentObj = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', timezone);
    
    if (!momentObj.isValid()) {
      throw new Error('Invalid date/time format');
    }

    const utcMoment = momentObj.utc();
    const year = utcMoment.year();
    const month = utcMoment.month() + 1;
    const day = utcMoment.date();
    const hour = utcMoment.hour() + (utcMoment.minute() / 60.0);

    return swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);
  }

  /**
   * Get Sun position
   */
  getSunPosition(julianDay) {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;
    const result = swisseph.swe_calc_ut(julianDay, swisseph.SE_SUN, flags);
    
    if (result.flag < 0) {
      throw new Error(`Failed to calculate Sun position: ${result.serr}`);
    }

    return {
      longitude: result.longitude,
      latitude: result.latitude,
      speed: result.longitudeSpeed
    };
  }

  /**
   * Get Moon position
   */
  getMoonPosition(julianDay) {
    const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;
    const result = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, flags);
    
    if (result.flag < 0) {
      throw new Error(`Failed to calculate Moon position: ${result.serr}`);
    }

    return {
      longitude: result.longitude,
      latitude: result.latitude,
      speed: result.longitudeSpeed
    };
  }

  /**
   * Calculate Tithi (lunar day)
   */
  calculateTithi(sunPosition, moonPosition, julianDay) {
    // Tithi is based on the angular distance between Sun and Moon
    let angularDistance = moonPosition.longitude - sunPosition.longitude;
    if (angularDistance < 0) angularDistance += 360;

    const tithiIndex = Math.floor(angularDistance / 12); // Each tithi is 12 degrees
    const tithiProgress = (angularDistance % 12) / 12; // Progress within current tithi

    // Calculate end time of current tithi
    const remainingDegrees = 12 - (angularDistance % 12);
    const moonSpeed = moonPosition.speed - sunPosition.speed; // Relative speed
    const hoursToEnd = remainingDegrees / (moonSpeed / 24); // Convert to hours
    
    const endTime = moment(this.julianDayToDate(julianDay)).add(hoursToEnd, 'hours');

    return {
      name: this.tithiNames[tithiIndex],
      index: tithiIndex + 1,
      percentage: tithiProgress * 100,
      endTime: endTime.format('HH:mm')
    };
  }

  /**
   * Calculate Nakshatra (lunar mansion)
   */
  calculateNakshatra(moonPosition, julianDay) {
    const nakshatraSpan = 360 / 27; // 13.333... degrees per nakshatra
    const nakshatraIndex = Math.floor(moonPosition.longitude / nakshatraSpan);
    const nakshatraProgress = (moonPosition.longitude % nakshatraSpan) / nakshatraSpan;

    // Calculate pada (quarter)
    const pada = Math.floor((moonPosition.longitude % nakshatraSpan) / (nakshatraSpan / 4)) + 1;

    // Calculate end time
    const remainingDegrees = nakshatraSpan - (moonPosition.longitude % nakshatraSpan);
    const hoursToEnd = remainingDegrees / (moonPosition.speed / 24);
    const endTime = moment(this.julianDayToDate(julianDay)).add(hoursToEnd, 'hours');

    return {
      name: this.nakshatraNames[nakshatraIndex],
      index: nakshatraIndex + 1,
      percentage: nakshatraProgress * 100,
      endTime: endTime.format('HH:mm'),
      pada: pada
    };
  }

  /**
   * Calculate Yoga
   */
  calculateYoga(sunPosition, moonPosition, julianDay) {
    // Yoga is based on sum of Sun and Moon longitudes
    const yogaSum = (sunPosition.longitude + moonPosition.longitude) % 360;
    const yogaSpan = 360 / 27; // Same as nakshatra span
    const yogaIndex = Math.floor(yogaSum / yogaSpan);
    const yogaProgress = (yogaSum % yogaSpan) / yogaSpan;

    // Calculate end time
    const remainingDegrees = yogaSpan - (yogaSum % yogaSpan);
    const combinedSpeed = sunPosition.speed + moonPosition.speed;
    const hoursToEnd = remainingDegrees / (combinedSpeed / 24);
    const endTime = moment(this.julianDayToDate(julianDay)).add(hoursToEnd, 'hours');

    return {
      name: this.yogaNames[yogaIndex],
      index: yogaIndex + 1,
      percentage: yogaProgress * 100,
      endTime: endTime.format('HH:mm')
    };
  }

  /**
   * Calculate Karana
   */
  calculateKarana(sunPosition, moonPosition, julianDay) {
    // Karana is half of tithi
    let angularDistance = moonPosition.longitude - sunPosition.longitude;
    if (angularDistance < 0) angularDistance += 360;

    const karanaIndex = Math.floor(angularDistance / 6); // Each karana is 6 degrees
    const karanaProgress = (angularDistance % 6) / 6;

    // Handle special karanas (last 4 are fixed)
    let actualIndex = karanaIndex;
    if (karanaIndex >= 57) {
      actualIndex = 7 + ((karanaIndex - 57) % 4); // Shakuni, Chatushpada, Naga, Kimstughna
    } else {
      actualIndex = (karanaIndex % 7) + 1; // Movable karanas: Bava to Vishti
    }

    // Calculate end time
    const remainingDegrees = 6 - (angularDistance % 6);
    const moonSpeed = moonPosition.speed - sunPosition.speed;
    const hoursToEnd = remainingDegrees / (moonSpeed / 24);
    const endTime = moment(this.julianDayToDate(julianDay)).add(hoursToEnd, 'hours');

    return {
      name: this.karanaNames[actualIndex],
      index: actualIndex + 1,
      percentage: karanaProgress * 100,
      endTime: endTime.format('HH:mm')
    };
  }

  /**
   * Calculate sunrise and sunset times
   */
  calculateSunTimes(julianDay, latitude, longitude) {
    try {
      // Calculate sunrise
      const sunriseResult = swisseph.swe_rise_trans(
        julianDay, swisseph.SE_SUN, '', swisseph.SEFLG_SIDEREAL,
        swisseph.SE_CALC_RISE, longitude, latitude, 0
      );

      // Calculate sunset
      const sunsetResult = swisseph.swe_rise_trans(
        julianDay, swisseph.SE_SUN, '', swisseph.SEFLG_SIDEREAL,
        swisseph.SE_CALC_SET, longitude, latitude, 0
      );

      // Calculate solar noon (midday)
      const noonResult = swisseph.swe_rise_trans(
        julianDay, swisseph.SE_SUN, '', swisseph.SEFLG_SIDEREAL,
        swisseph.SE_CALC_MTRANSIT, longitude, latitude, 0
      );

      const sunrise = this.julianDayToTime(sunriseResult.tret);
      const sunset = this.julianDayToTime(sunsetResult.tret);
      const solarNoon = this.julianDayToTime(noonResult.tret);

      // Calculate day length
      const dayLengthHours = (sunsetResult.tret - sunriseResult.tret) * 24;
      const dayLength = `${Math.floor(dayLengthHours)}h ${Math.floor((dayLengthHours % 1) * 60)}m`;

      return {
        sunrise: sunrise,
        sunset: sunset,
        solarNoon: solarNoon,
        dayLength: dayLength
      };

    } catch (error) {
      logger.error('Error calculating sun times:', error);
      return {
        sunrise: 'N/A',
        sunset: 'N/A',
        solarNoon: 'N/A',
        dayLength: 'N/A'
      };
    }
  }

  /**
   * Calculate lunar month
   */
  calculateLunarMonth(julianDay) {
    const lunarMonths = [
      'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha',
      'Shravana', 'Bhadrapada', 'Ashwina', 'Kartika',
      'Margashirsha', 'Pausha', 'Magha', 'Phalguna'
    ];

    // Simplified calculation - in reality this requires new moon calculations
    const date = moment(this.julianDayToDate(julianDay));
    const monthIndex = Math.floor((date.month() + 1) / 1) % 12;
    
    return {
      name: lunarMonths[monthIndex],
      year: date.year() // Simplified - should be lunar year
    };
  }

  /**
   * Calculate Ritu (season)
   */
  calculateRitu(sunPosition) {
    const ritus = [
      { name: 'Vasant (Spring)', start: 0, end: 60 },
      { name: 'Grishma (Summer)', start: 60, end: 120 },
      { name: 'Varsha (Monsoon)', start: 120, end: 180 },
      { name: 'Sharad (Autumn)', start: 180, end: 240 },
      { name: 'Shishir (Pre-winter)', start: 240, end: 300 },
      { name: 'Shita (Winter)', start: 300, end: 360 }
    ];

    for (const ritu of ritus) {
      if (sunPosition.longitude >= ritu.start && sunPosition.longitude < ritu.end) {
        return ritu.name;
      }
    }

    return 'Shita (Winter)'; // Default
  }

  /**
   * Calculate additional Panchang details
   */
  calculateAdditionalDetails(julianDay, latitude, longitude) {
    return {
      ayanamsa: swisseph.swe_get_ayanamsa_ut(julianDay),
      localMeanTime: this.julianDayToTime(julianDay),
      siderealTime: this.calculateSiderealTime(julianDay, longitude),
      sunriseToSunset: '12:00', // Placeholder - would need proper calculation
      dynamicHour: '1:00' // Placeholder - would need proper calculation
    };
  }

  /**
   * Helper methods
   */
  julianDayToDate(julianDay) {
    const calendar = swisseph.swe_revjul(julianDay, swisseph.SE_GREG_CAL);
    return new Date(calendar.year, calendar.month - 1, calendar.day);
  }

  julianDayToTime(julianDay) {
    const calendar = swisseph.swe_revjul(julianDay, swisseph.SE_GREG_CAL);
    const hours = Math.floor(calendar.hour);
    const minutes = Math.floor((calendar.hour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  calculateSiderealTime(julianDay, longitude) {
    const siderealTime = swisseph.swe_sidtime(julianDay) + (longitude / 15);
    const hours = Math.floor(siderealTime);
    const minutes = Math.floor((siderealTime - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get lords and attributes
   */
  getTithiLord(tithiIndex) {
    const lords = [
      'Agni', 'Brahma', 'Gauri', 'Ganesha', 'Naga', 'Karttikeya', 'Surya',
      'Shiva', 'Durga', 'Yama', 'Vishvadevas', 'Vishnu', 'Kamadeva', 'Shiva', 'Chandra'
    ];
    return lords[(tithiIndex - 1) % 15];
  }

  getNakshatraLord(nakshatraIndex) {
    const lords = [
      'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter',
      'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
      'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus',
      'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
    ];
    return lords[(nakshatraIndex - 1) % 27];
  }

  getYogaEffect(yogaIndex) {
    const effects = [
      'Inauspicious', 'Auspicious', 'Auspicious', 'Very Auspicious', 'Auspicious',
      'Inauspicious', 'Auspicious', 'Auspicious', 'Inauspicious', 'Inauspicious',
      'Auspicious', 'Very Auspicious', 'Inauspicious', 'Auspicious', 'Inauspicious',
      'Very Auspicious', 'Very Inauspicious', 'Auspicious', 'Inauspicious', 'Very Auspicious',
      'Very Auspicious', 'Auspicious', 'Auspicious', 'Auspicious', 'Very Auspicious',
      'Very Auspicious', 'Very Inauspicious'
    ];
    return effects[(yogaIndex - 1) % 27];
  }

  getKaranaNature(karanaIndex) {
    const natures = [
      'Mixed', 'Movable', 'Movable', 'Movable', 'Movable', 'Movable', 'Movable',
      'Inauspicious', 'Fixed', 'Fixed', 'Fixed'
    ];
    return natures[(karanaIndex - 1) % 11];
  }
}

module.exports = new PanchangService();
