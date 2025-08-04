const enhancedSwissEphemeris = require('../services/enhancedSwissEphemeris');

const aspectsService = require('../services/aspectsService');

const planetaryPositionsController = {
  async getPlanetaryPositions(req, res) {
    try {
      console.log('🔍 DEBUG - Request body:', req.body);
      console.log('🔍 DEBUG - Request headers:', req.headers);
      
      const { date, time, latitude, longitude, timezone } = req.body;
      
      console.log('🔍 DEBUG - Extracted values:', { date, time, latitude, longitude, timezone });

      // Validate required fields
      if (!date || !time || latitude === undefined || longitude === undefined) {
        console.log('🔍 DEBUG - Validation failed:', {
          hasDate: !!date,
          hasTime: !!time,
          hasLatitude: latitude !== undefined,
          hasLongitude: longitude !== undefined
        });
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: date, time, latitude, longitude'
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(time)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time format. Use HH:MM'
        });
      }

      // Validate coordinates
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          error: 'Invalid latitude. Must be between -90 and 90'
        });
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid longitude. Must be between -180 and 180'
        });
      }

      // Use provided timezone or auto-detect
      const tz = timezone || 'Auto';

      console.log(`Getting planetary positions for ${date} ${time} at ${lat}, ${lng} (${tz})`);

      // Calculate Julian Day
      const julianDay = enhancedSwissEphemeris.getJulianDay(date, time, tz, null, { lat, lng });

      // Calculate planetary positions (using sidereal for Vedic astrology)
      const useTropical = req.body.zodiac === 'tropical'; // Default to sidereal unless explicitly requested as tropical
      const planetaryData = enhancedSwissEphemeris.getPlanetaryPositions(julianDay, useTropical);

      // Calculate ascendant
      const ascendant = enhancedSwissEphemeris.calculateAscendant(julianDay, lat, lng, useTropical);

      // Calculate house positions for chart
      const housePositions = enhancedSwissEphemeris.calculateHousePositions(planetaryData.planets, ascendant);

      // Calculate aspects using Vedic system
      const planetaryAspects = aspectsService.calculateAspects(planetaryData.planets, ascendant.longitude);
      const houseAspects = aspectsService.calculatePlanetaryAspectsToHouses(planetaryData.planets, ascendant.longitude);
      const strongestAspects = aspectsService.getStrongestAspects(planetaryAspects, 10);

      // Format response with the correct data structure
      const response = {
        success: true,
        data: {
          requestInfo: {
            date,
            time,
            latitude: lat,
            longitude: lng,
            timezone: tz,
            julianDay
          },
          ascendant: {
            degree: ascendant.degreeInSign,
            sign: ascendant.sign,
            nakshatra: ascendant.nakshatra,
            formatted: ascendant.degreeFormatted
          },
          planets: Object.values(planetaryData.planets).map(planet => {
            // Calculate house number for this planet
            const houseNumber = enhancedSwissEphemeris.calculateHouseNumber(planet.longitude, ascendant.longitude);
            
            return {
              name: planet.name,
              degree: planet.degreeInSign,
              sign: planet.sign,
              nakshatra: planet.nakshatra,
              isRetrograde: planet.isRetrograde,
              formatted: planet.degreeFormatted,
              longitude: planet.longitude,
              house: houseNumber
            };
          }),
          aspects: {
            planetaryAspects: planetaryAspects,
            houseAspects: houseAspects,
            strongestAspects: strongestAspects,
            summary: {
              totalPlanetaryAspects: planetaryAspects.length,
              planetsWithHouseAspects: Object.keys(houseAspects).length,
              rahuKetuSpecialAspectsEnabled: aspectsService.config.enableRahuKetuSpecialAspects
            }
          },
          charts: {
            lagna: {
              houses: housePositions,
              ascendant: ascendant,
              planets: planetaryData.planets
            }
          }
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Error calculating planetary positions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while calculating planetary positions'
      });
    }
  }
};

module.exports = planetaryPositionsController;
