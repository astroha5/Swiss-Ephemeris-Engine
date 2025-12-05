const Astronomy = require('astronomy-engine');
const moment = require('moment-timezone');
const logger = require('../utils/logger');

class AstronomyEngineService {
  constructor() {
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

    // Lahiri Ayanamsa for 2000.0
    this.lahiriAyanamsa2000 = 23.85;
    
    logger.info('Astronomy Engine service initialized as fallback');
  }

  /**
   * Convert date/time to Astronomy Engine Date object
   */
  getAstronomyDate(date, time, timezone = 'Asia/Kolkata') {
    try {
      const dateTimeString = `${date} ${time}`;
      const momentObj = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', timezone);

      if (!momentObj.isValid()) {
        throw new Error('Invalid date/time format');
      }

      const utcMoment = momentObj.utc();
      return new Date(utcMoment.toISOString());
    } catch (error) {
      logger.error('Error creating astronomy date:', error);
      throw new Error(`Failed to create astronomy date: ${error.message}`);
    }
  }

  /**
   * Calculate Lahiri Ayanamsa for given date
   */
  calculateLahiriAyanamsa(astronomyDate) {
    // Simplified Lahiri Ayanamsa calculation
    // Full implementation would use more complex algorithms
    const jsDate = astronomyDate.date || astronomyDate;
    const year = jsDate.getFullYear();
    const yearDiff = year - 2000;
    const precessionRate = 50.2564; // arcseconds per year

    const ayanamsaDegrees = this.lahiriAyanamsa2000 + (yearDiff * precessionRate / 3600);
    return ayanamsaDegrees;
  }

  /**
   * Convert tropical longitude to sidereal
   */
  tropicalToSidereal(tropicalLongitude, ayanamsa) {
    let siderealLongitude = tropicalLongitude - ayanamsa;
    if (siderealLongitude < 0) siderealLongitude += 360;
    return siderealLongitude;
  }

  /**
   * Get planetary positions using Astronomy Engine
   */
  getPlanetaryPositions(date, time, timezone = 'Asia/Kolkata') {
    try {
      const astronomyDate = this.getAstronomyDate(date, time, timezone);
      const ayanamsa = this.calculateLahiriAyanamsa(astronomyDate);

      const positions = {};
      
      // Calculate positions for all planets
      const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
      
      // Map planet names to Swiss Ephemeris body IDs for compatibility
      const planetIds = {
        'Sun': 0,
        'Moon': 1,
        'Mercury': 2,
        'Venus': 3,
        'Mars': 4,
        'Jupiter': 5,
        'Saturn': 6
      };

      for (const planetName of planets) {
        try {
          let equatorial;

          let ecliptic;
          if (planetName === 'Sun') {
            equatorial = Astronomy.SunPosition(astronomyDate);
            ecliptic = {
              elon: Astronomy.EclipticLongitude(equatorial.ra, equatorial.dec),
              elat: Astronomy.EclipticLatitude(equatorial.ra, equatorial.dec)
            };
          } else if (planetName === 'Moon') {
            ecliptic = Astronomy.GeoMoon(astronomyDate);
          } else {
            // Use HelioVector for planets to calculate geocentric position
            const helioVec = Astronomy.HelioVector(planetName, astronomyDate);
            const earthHelioVec = Astronomy.HelioVector('Earth', astronomyDate);
            const geoVec = {
              x: helioVec.x - earthHelioVec.x,
              y: helioVec.y - earthHelioVec.y,
              z: helioVec.z - earthHelioVec.z
            };
            ecliptic = {
              elon: Astronomy.EclipticLongitude(geoVec.x, geoVec.y, geoVec.z),
              elat: Astronomy.EclipticLatitude(geoVec.x, geoVec.y, geoVec.z)
            };
          }
          
          // Convert to sidereal longitude
          const siderealLongitude = this.tropicalToSidereal(ecliptic.elon, ayanamsa);
          
          // Calculate additional properties
          const signNum = Math.floor(siderealLongitude / 30);
          const degreeInSign = siderealLongitude % 30;
          const nakshatra = this.calculateNakshatra(siderealLongitude);
          
          positions[planetName.toLowerCase()] = {
            name: planetName,
            longitude: siderealLongitude,
            latitude: ecliptic.elat || 0,
            sign: this.zodiacSigns[signNum],
            signNumber: signNum + 1,
            degree: degreeInSign,
            degreeFormatted: this.formatDegree(degreeInSign),
            nakshatra: nakshatra.name,
            nakshatraPada: nakshatra.pada,
            isRetrograde: false, // Simplified - would need velocity calculation
            speed: 0 // Simplified
          };
        } catch (planetError) {
          logger.error(`Error calculating ${planetName} position:`, planetError);
          // Continue with other planets
        }
      }

      // Calculate Rahu (North Node) and Ketu
      try {
        const moonNode = this.calculateMoonNodes(astronomyDate);
        
        // Rahu
        const rahuLongitude = this.tropicalToSidereal(moonNode.rahuLongitude, ayanamsa);
        const rahuSignNum = Math.floor(rahuLongitude / 30);
        const rahuDegreeInSign = rahuLongitude % 30;
        const rahuNakshatra = this.calculateNakshatra(rahuLongitude);
        
        positions.rahu = {
          name: 'Rahu',
          longitude: rahuLongitude,
          latitude: 0,
          sign: this.zodiacSigns[rahuSignNum],
          signNumber: rahuSignNum + 1,
          degree: rahuDegreeInSign,
          degreeFormatted: this.formatDegree(rahuDegreeInSign),
          nakshatra: rahuNakshatra.name,
          nakshatraPada: rahuNakshatra.pada,
          isRetrograde: true, // Rahu is always retrograde
          speed: -0.05 // Approximate retrograde motion
        };

        // Ketu (180° opposite to Rahu)
        let ketuLongitude = rahuLongitude + 180;
        if (ketuLongitude >= 360) ketuLongitude -= 360;
        
        const ketuSignNum = Math.floor(ketuLongitude / 30);
        const ketuDegreeInSign = ketuLongitude % 30;
        const ketuNakshatra = this.calculateNakshatra(ketuLongitude);
        
        positions.ketu = {
          name: 'Ketu',
          longitude: ketuLongitude,
          latitude: 0,
          sign: this.zodiacSigns[ketuSignNum],
          signNumber: ketuSignNum + 1,
          degree: ketuDegreeInSign,
          degreeFormatted: this.formatDegree(ketuDegreeInSign),
          nakshatra: ketuNakshatra.name,
          nakshatraPada: ketuNakshatra.pada,
          isRetrograde: true, // Ketu is always retrograde
          speed: -0.05 // Approximate retrograde motion
        };
      } catch (nodeError) {
        logger.error('Error calculating Moon nodes:', nodeError);
      }

      return positions;
    } catch (error) {
      logger.error('Error calculating planetary positions with Astronomy Engine:', error);
      throw new Error(`Failed to calculate planetary positions: ${error.message}`);
    }
  }

  /**
   * Calculate Moon's nodes (simplified)
   */
  calculateMoonNodes(astronomyDate) {
    // Simplified calculation - in a full implementation, this would use
    // proper lunar node calculations
    const jsDate = astronomyDate.date || astronomyDate;
    const year = jsDate.getFullYear();
    const month = jsDate.getMonth() + 1;
    const day = jsDate.getDate();
    
    // Approximate Rahu longitude based on date
    // This is a simplified calculation for demonstration
    const daysSinceEpoch = (astronomyDate - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    const rahuLongitude = (360 - (daysSinceEpoch * 0.05291)) % 360;
    
    return {
      rahuLongitude: rahuLongitude < 0 ? rahuLongitude + 360 : rahuLongitude
    };
  }

  /**
   * Calculate Ascendant using Astronomy Engine
   */
  calculateAscendant(date, time, latitude, longitude, timezone = 'Asia/Kolkata') {
    try {
      const astronomyDate = this.getAstronomyDate(date, time, timezone);
      const ayanamsa = this.calculateLahiriAyanamsa(astronomyDate);

      // Create observer location
      const observer = new Astronomy.Observer(latitude, longitude, 0);

      // Calculate local sidereal time
      const lst = Astronomy.SiderealTime(astronomyDate);
      
      // Simplified ascendant calculation
      // In a full implementation, this would use proper house calculation
      const localSiderealTime = lst + (longitude / 15);
      const ascendantLongitude = this.tropicalToSidereal((localSiderealTime * 15) % 360, ayanamsa);
      
      const signNum = Math.floor(ascendantLongitude / 30);
      const degreeInSign = ascendantLongitude % 30;
      const nakshatra = this.calculateNakshatra(ascendantLongitude);

      return {
        longitude: ascendantLongitude,
        sign: this.zodiacSigns[signNum],
        signNumber: signNum + 1,
        degree: degreeInSign,
        degreeFormatted: this.formatDegree(degreeInSign),
        nakshatra: nakshatra.name,
        nakshatraPada: nakshatra.pada
      };
    } catch (error) {
      logger.error('Error calculating ascendant with Astronomy Engine:', error);
      throw new Error(`Failed to calculate ascendant: ${error.message}`);
    }
  }

  /**
   * Calculate Nakshatra from longitude
   */
  calculateNakshatra(longitude) {
    const nakshatraIndex = Math.floor(longitude * 27 / 360);
    const nakshatraSpan = 360 / 27;
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
   * Format degrees in traditional format
   */
  formatDegree(decimal) {
    const degrees = Math.floor(decimal);
    const minutes = Math.floor((decimal - degrees) * 60);
    const seconds = Math.floor(((decimal - degrees) * 60 - minutes) * 60);
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"`;
  }

  /**
   * Calculate sunrise and sunset
   */
  calculateSunTimes(date, latitude, longitude, timezone = 'Asia/Kolkata') {
    try {
      const astronomyDate = this.getAstronomyDate(date, '12:00', timezone);
      const observer = new Astronomy.Observer(latitude, longitude, 0);
      
      // Calculate sunrise
      const sunrise = Astronomy.SearchRiseSet('Sun', observer, 1, astronomyDate, -1);
      const sunset = Astronomy.SearchRiseSet('Sun', observer, -1, astronomyDate, 1);
      
      return {
        sunrise: sunrise ? this.formatTime(sunrise) : 'N/A',
        sunset: sunset ? this.formatTime(sunset) : 'N/A',
        solarNoon: 'N/A', // Would need additional calculation
        dayLength: 'N/A'
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
   * Format time from Date object
   */
  formatTime(date) {
    return date.toTimeString().split(' ')[0].substring(0, 5);
  }
}

module.exports = new AstronomyEngineService();
