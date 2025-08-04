const Joi = require('joi');
const swissEphemerisService = require('../services/enhancedSwissEphemeris');
const yogaService = require('../services/yogaService');
const doshaService = require('../services/doshaService');
const dashaService = require('../services/dashaService');
const aspectsService = require('../services/aspectsService');
const logger = require('../utils/logger');

// Input validation schema
const kundliSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  timezone: Joi.string().default('Asia/Kolkata'),
  name: Joi.string().optional(),
  place: Joi.string().optional()
});

// Helper functions (outside class to avoid context issues)
function generateNavamsaHouses(navamsaChart, ascendant) {
  // Calculate Navamsa ascendant from the Lagna ascendant
  const navamsaAscendant = swissEphemerisService.calculateNavamsaPosition(ascendant.longitude);
  
  console.log('🔍 Navamsa Ascendant Calculation:', {
    lagnaAscendant: {
      longitude: ascendant.longitude,
      sign: ascendant.sign,
      signNumber: ascendant.signNumber
    },
    navamsaAscendant: {
      longitude: navamsaAscendant.longitude,
      sign: navamsaAscendant.sign,
      signNumber: navamsaAscendant.signNumber
    }
  });
  
  // Generate houses based on Navamsa ascendant (using same logic as Lagna chart)
  const houses = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    sign: swissEphemerisService.zodiacSigns[(navamsaAscendant.signNumber - 1 + i) % 12],
    signNumber: ((navamsaAscendant.signNumber - 1 + i) % 12) + 1,
    planets: [],
    degrees: [],
    signLord: ''
  }));

  // Set sign lords for each house (same as Lagna)
  houses.forEach(house => {
    house.signLord = getSignLord(house.sign);
  });

  // Place planets in houses based on their Navamsa positions
  for (const [planetKey, planet] of Object.entries(navamsaChart)) {
    if (!planet.navamsaSignNumber) continue;
    
    // Calculate which house this planet should be in (using same logic as Lagna)
    let houseNumber = planet.navamsaSignNumber - navamsaAscendant.signNumber + 1;
    
    // Adjust for wrap-around
    if (houseNumber <= 0) {
      houseNumber += 12;
    }
    if (houseNumber > 12) {
      houseNumber -= 12;
    }
    
    const houseIndex = houseNumber - 1;
    houses[houseIndex].planets.push(planet.name);
    houses[houseIndex].degrees.push(swissEphemerisService.formatDegree(planet.navamsaDegree));
    
    console.log(`🏠 Navamsa Planet Placement: ${planet.name} -> House ${houseNumber} (${houses[houseIndex].sign})`);
  }

  console.log('🎯 Final Navamsa Houses:', houses.map(h => ({ 
    number: h.number, 
    sign: h.sign, 
    planets: h.planets 
  })));

  return houses;
}

function transformPlanetaryData(planetaryPositions, julianDay, latitude, longitude, ascendant) {
  const planetaryData = [];
  
  const planetSymbols = {
    'Sun': '☉',
    'Moon': '☽', 
    'Mars': '♂',
    'Mercury': '☿',
    'Jupiter': '♃',
    'Venus': '♀',
    'Saturn': '♄',
    'Rahu': '☊',
    'Ketu': '☋'
  };

  for (const [planetKey, planet] of Object.entries(planetaryPositions)) {
    // Calculate strength
    const strength = swissEphemerisService.calculatePlanetaryStrength(planet, julianDay, latitude, longitude);
    
    // Determine nature (benefic/malefic)
    const nature = getPlanetNature(planet.name);
    
    planetaryData.push({
      planet: planet.name,
      symbol: planetSymbols[planet.name],
      sign: planet.sign,
      house: calculateHouseNumber(planet, ascendant),
      degree: planet.degreeFormatted,
      nakshatra: planet.nakshatra,
      pada: planet.nakshatraPada,
      retrograde: planet.isRetrograde,
      strength: strength.level,
      nature: nature
    });
  }

  return planetaryData;
}

function calculateHouseNumber(planet, ascendant) {
  // Fixed to use sign-based calculation for accurate house placement
  // This ensures consistency with the Vedic astrology house system
  const planetSignNumber = Math.floor(planet.longitude / 30) + 1;
  const ascendantSignNumber = Math.floor(ascendant.longitude / 30) + 1;
  
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

function getSignLord(sign) {
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

function getPlanetNature(planetName) {
  const benefics = ['Sun', 'Moon', 'Mercury', 'Jupiter', 'Venus'];
  const malefics = ['Mars', 'Saturn', 'Rahu', 'Ketu'];
  
  if (benefics.includes(planetName)) return 'Benefic';
  if (malefics.includes(planetName)) return 'Malefic';
  return 'Neutral';
}

class KundliController {
  /**
   * Generate complete Kundli data matching frontend expectations
   */
  async generateKundli(req, res) {
    try {
      const { error, value } = kundliSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { date, time, latitude, longitude, timezone, name, place } = value;
      
      // Enhanced debugging for coordinate extraction
      logger.info(`🔍 VALIDATION RESULT: ${JSON.stringify(value)}`);
      logger.info(`🔍 EXTRACTED VALUES: date=${date}, time=${time}, lat=${latitude}, lng=${longitude}, tz=${timezone}`);
      logger.info(`🔍 TYPE CHECK: lat=${typeof latitude}, lng=${typeof longitude}`);
      logger.info(`Generating Kundli for ${date} ${time} at ${latitude}, ${longitude}`);

      // Calculate Julian Day with enhanced historical timezone support
      if (latitude === undefined || longitude === undefined) {
        throw new Error(`Missing coordinates: latitude=${latitude}, longitude=${longitude}`);
      }
      const coordinates = { lat: latitude, lng: longitude };
      logger.info(`🌍 COORDINATES OBJECT: ${JSON.stringify(coordinates)}`);
      const julianDay = swissEphemerisService.getJulianDay(date, time, timezone, place, coordinates);

      // Get planetary positions
      const planetaryPositionsResult = swissEphemerisService.getPlanetaryPositions(julianDay);
      const planetaryPositions = planetaryPositionsResult.planets;

      // Calculate Ascendant and houses
      const ascendant = swissEphemerisService.calculateAscendant(julianDay, latitude, longitude);

      // Calculate house positions for planets
      const housePositions = swissEphemerisService.calculateHousePositions(planetaryPositions, ascendant);

      // Calculate Navamsa
      const navamsaChart = swissEphemerisService.calculateNavamsa(planetaryPositions);
      const navamsaHouses = generateNavamsaHouses(navamsaChart, ascendant);

      // Transform planetary data for frontend
      const planetaryData = transformPlanetaryData(planetaryPositions, julianDay, latitude, longitude, ascendant);

      // Calculate yogas and doshas
      const yogas = yogaService.calculateYogas(planetaryPositions, ascendant);
      const doshas = doshaService.calculateDoshas(planetaryPositions, ascendant);

      // Calculate Vedic planetary aspects (Drishti)
      // This includes both planet-to-planet aspects and planet-to-house aspects
      const planetaryAspects = aspectsService.calculateAspects(planetaryPositions, ascendant.longitude);
      const houseAspects = aspectsService.calculatePlanetaryAspectsToHouses(planetaryPositions, ascendant.longitude);
      
      logger.info(`🎯 Calculated ${planetaryAspects.length} planetary aspects and ${Object.keys(houseAspects).length} house aspect sets`);

      // Calculate Vimshottari Dasha
      let dashaTimeline = null;
      try {
        const moon = planetaryPositions.moon;
        if (moon && moon.nakshatra) {
          // Calculate moon's progress in nakshatra for dasha calculation
          const nakshatraLength = 360 / 27; // 13.333... degrees per nakshatra
          const nakshatraStart = Math.floor(moon.longitude / nakshatraLength) * nakshatraLength;
          const moonProgressInNakshatra = ((moon.longitude - nakshatraStart) / nakshatraLength) * 100;
          
          dashaTimeline = dashaService.calculateDashaTimeline(
            date, 
            time, 
            moon.nakshatra, 
            moonProgressInNakshatra, 
            timezone
          );
        }
      } catch (error) {
        logger.warn('Error calculating Dasha timeline:', error.message);
      }

      // Prepare birth details
      const birthDetails = {
        name: name || 'Unknown',
        dateOfBirth: date,
        timeOfBirth: time,
        placeOfBirth: place || `${latitude}°N, ${longitude}°E`,
        latitude: latitude ? latitude.toString() : 'Unknown',
        longitude: longitude ? longitude.toString() : 'Unknown',
        timezone: timezone
      };

      // Prepare chart summary
      const chartSummary = {
        ascendant: {
          sign: ascendant.sign,
          degree: ascendant.degreeFormatted,
          lord: getSignLord(ascendant.sign),
          nakshatra: ascendant.nakshatra
        },
        moonSign: {
          sign: planetaryPositions.moon.sign,
          degree: planetaryPositions.moon.degreeFormatted,
          lord: getSignLord(planetaryPositions.moon.sign),
          nakshatra: planetaryPositions.moon.nakshatra
        },
        sunSign: {
          sign: planetaryPositions.sun.sign,
          degree: planetaryPositions.sun.degreeFormatted,
          lord: getSignLord(planetaryPositions.sun.sign),
          nakshatra: planetaryPositions.sun.nakshatra
        },
        yogas: yogas,
        doshas: doshas,
        currentDasha: dashaTimeline?.currentMahadasha || null,
        currentAntardasha: dashaTimeline?.currentAntardasha || null,
        vimshottariDasha: dashaTimeline || null
      };

      // Prepare response data
      const response = {
        success: true,
        data: {
          birthDetails,
          chartSummary,
          planetaryData,
          charts: {
            lagna: {
              houses: housePositions
            },
            navamsa: {
              houses: navamsaHouses
            }
          },
          aspects: {
            planetaryAspects: planetaryAspects,
            houseAspects: houseAspects,
            strongestAspects: aspectsService.getStrongestAspects(planetaryAspects, 5),
            summary: {
              totalPlanetaryAspects: planetaryAspects.length,
              planetsWithHouseAspects: Object.keys(houseAspects).length,
              rahuKetuSpecialAspectsEnabled: process.env.ENABLE_RAHU_KETU_ASPECTS === 'true'
            }
          }
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error generating Kundli:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate Kundli chart',
        message: error.message
      });
    }
  }

}

module.exports = new KundliController();
