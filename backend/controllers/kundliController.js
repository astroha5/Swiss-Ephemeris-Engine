const Joi = require('joi');
const swissEphemerisService = require('../services/enhancedSwissEphemeris');
const yogaService = require('../services/yogaService');
const doshaService = require('../services/doshaService');
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
  const houses = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    sign: swissEphemerisService.zodiacSigns[(ascendant.signNumber - 1 + i) % 12],
    planets: [],
    degrees: []
  }));

  for (const [planetKey, planet] of Object.entries(navamsaChart)) {
    if (!planet.navamsaSignNumber) continue;
    
    const houseIndex = planet.navamsaSignNumber - 1;
    houses[houseIndex].planets.push(planet.name);
    houses[houseIndex].degrees.push(planet.degreeFormatted);
  }

  return houses;
}

function transformPlanetaryData(planetaryPositions, julianDay, latitude, longitude) {
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
      house: calculateHouseNumber(planet, planetaryPositions),
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

function calculateHouseNumber(planet, planetaryPositions) {
  // This is a simplified calculation
  // In a full implementation, you'd use the actual house cusps
  const ascendantSign = planetaryPositions.sun.signNumber; // Simplified - should use actual ascendant
  let houseNumber = planet.signNumber - ascendantSign + 1;
  if (houseNumber <= 0) houseNumber += 12;
  if (houseNumber > 12) houseNumber -= 12;
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
      
      logger.info(`Generating Kundli for ${date} ${time} at ${latitude}, ${longitude}`);

      // Calculate Julian Day
      const julianDay = swissEphemerisService.getJulianDay(date, time, timezone);

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
      const planetaryData = transformPlanetaryData(planetaryPositions, julianDay, latitude, longitude);

      // Calculate yogas and doshas
      const yogas = yogaService.calculateYogas(planetaryPositions, ascendant);
      const doshas = doshaService.calculateDoshas(planetaryPositions, ascendant);

      // Prepare birth details
      const birthDetails = {
        name: name || 'Unknown',
        dateOfBirth: date,
        timeOfBirth: time,
        placeOfBirth: place || `${latitude}°N, ${longitude}°E`,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
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
        doshas: doshas
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
