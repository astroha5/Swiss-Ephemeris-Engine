const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const enhancedSwissEphemeris = require('../services/enhancedSwissEphemeris');
const logger = require('../utils/logger');

/**
 * Calculate planetary transits for a given year
 * POST /api/transits
 */
router.post('/', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), timezone = 'UTC' } = req.body;
    
    logger.info(`Calculating planetary transits for year ${year}`);
    
    // Calculate transits for the entire year
    const transits = await calculateYearlyTransits(year, timezone);
    
    res.json({
      success: true,
      data: {
        year: year,
        transits: transits.transits,
        majorHighlights: transits.majorHighlights,
        mercuryRetrogrades: transits.mercuryRetrogrades,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error calculating transits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Calculate transit data for specific month
 * POST /api/transits/month
 */
router.post('/month', async (req, res) => {
  try {
    const { month, year = new Date().getFullYear(), timezone = 'UTC' } = req.body;
    
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Valid month (1-12) is required'
      });
    }
    
    logger.info(`Calculating planetary transits for ${month}/${year}`);
    
    // Calculate transits for the specific month
    const transits = await calculateMonthlyTransits(month, year, timezone);
    
    res.json({
      success: true,
      data: {
        month: month,
        year: year,
        transits: transits.transits,
        highlights: transits.highlights,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error calculating monthly transits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Calculate yearly transits for all major planets
 */
async function calculateYearlyTransits(year, timezone) {
  const transits = [];
  const majorHighlights = [];
  const mercuryRetrogrades = [];
  
  // Define planets to track
  const planets = [
    { name: 'Moon', id: 'moon', fastMoving: true },
    { name: 'Mercury', id: 'mercury', fastMoving: true },
    { name: 'Venus', id: 'venus', fastMoving: true },
    { name: 'Sun', id: 'sun', fastMoving: true },
    { name: 'Mars', id: 'mars', fastMoving: false },
    { name: 'Jupiter', id: 'jupiter', fastMoving: false },
    { name: 'Saturn', id: 'saturn', fastMoving: false },
    { name: 'Rahu', id: 'rahu', fastMoving: false },
    { name: 'Ketu', id: 'ketu', fastMoving: false }
  ];
  
  // Calculate transits for each planet
  for (const planet of planets) {
    try {
      const planetTransits = await calculatePlanetTransits(planet, year, timezone);
      transits.push(...planetTransits.transits);
      
      // Add major transits to highlights
      if (!planet.fastMoving) {
        majorHighlights.push(...planetTransits.transits.map(t => ({
          ...t,
          isMajor: true,
          description: generateTransitDescription(t)
        })));
      }
      
      // Track Mercury retrogrades
      if (planet.name === 'Mercury') {
        mercuryRetrogrades.push(...planetTransits.retrogrades);
      }
      
    } catch (error) {
      logger.error(`Error calculating transits for ${planet.name}:`, error);
    }
  }
  
  // Sort transits by date
  transits.sort((a, b) => new Date(a.ingressDate) - new Date(b.ingressDate));
  majorHighlights.sort((a, b) => new Date(a.ingressDate) - new Date(b.ingressDate));
  
  return {
    transits,
    majorHighlights,
    mercuryRetrogrades
  };
}

/**
 * Calculate monthly transits
 */
async function calculateMonthlyTransits(month, year, timezone) {
  const transits = [];
  const highlights = [];
  
  // Calculate start and end dates for the month
  const startDate = moment.tz(`${year}-${month.toString().padStart(2, '0')}-01`, timezone);
  const endDate = startDate.clone().add(1, 'month');
  
  // Define planets to track for monthly view
  const planets = [
    { name: 'Moon', id: 'moon', checkInterval: 1 }, // Daily for Moon
    { name: 'Mercury', id: 'mercury', checkInterval: 3 },
    { name: 'Venus', id: 'venus', checkInterval: 5 },
    { name: 'Sun', id: 'sun', checkInterval: 7 },
    { name: 'Mars', id: 'mars', checkInterval: 10 },
    { name: 'Jupiter', id: 'jupiter', checkInterval: 15 },
    { name: 'Saturn', id: 'saturn', checkInterval: 15 },
    { name: 'Rahu', id: 'rahu', checkInterval: 15 },
    { name: 'Ketu', id: 'ketu', checkInterval: 15 }
  ];
  
  for (const planet of planets) {
    try {
      const planetTransits = await calculatePlanetTransitsForPeriod(
        planet, 
        startDate, 
        endDate, 
        timezone
      );
      transits.push(...planetTransits);
      
      // Add significant transits to highlights
      if (['Jupiter', 'Saturn', 'Rahu', 'Ketu'].includes(planet.name)) {
        highlights.push(...planetTransits.map(t => ({
          ...t,
          description: generateTransitDescription(t)
        })));
      }
      
    } catch (error) {
      logger.error(`Error calculating monthly transits for ${planet.name}:`, error);
    }
  }
  
  transits.sort((a, b) => new Date(a.ingressDate) - new Date(b.ingressDate));
  highlights.sort((a, b) => new Date(a.ingressDate) - new Date(b.ingressDate));
  
  return { transits, highlights };
}

/**
 * Calculate transits for a specific planet over a year
 */
async function calculatePlanetTransits(planet, year, timezone) {
  const transits = [];
  const retrogrades = [];
  
  // Start from beginning of year
  const startDate = moment.tz(`${year}-01-01`, timezone);
  const endDate = moment.tz(`${year}-12-31`, timezone);
  
  let currentDate = startDate.clone();
  let lastSign = null;
  let lastRetrograde = null;
  
  // Check positions throughout the year
  const checkInterval = planet.fastMoving ? 1 : 7; // Days
  
  while (currentDate.isBefore(endDate)) {
    try {
      const julianDay = enhancedSwissEphemeris.getJulianDay(
        currentDate.format('YYYY-MM-DD'),
        '12:00',
        timezone
      );
      
      const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
      const planetData = positions.planets[planet.id];
      
      if (planetData) {
        // Check for sign change (transit)
        if (lastSign && lastSign !== planetData.sign) {
          const transitData = {
            planet: planet.name,
            ingressDate: currentDate.format('YYYY-MM-DD'),
            fromSign: lastSign,
            toSign: planetData.sign,
            nakshatra: planetData.nakshatra,
            nakshatraPada: planetData.nakshatraPada,
            degreeInSign: planetData.degreeInSign,
            isRetrograde: planetData.isRetrograde,
            duration: calculateTransitDuration(planet.name, planetData.sign),
            significance: getTransitSignificance(planet.name, planetData.sign)
          };
          
          transits.push(transitData);
        }
        
        // Check for retrograde status change
        if (lastRetrograde !== null && lastRetrograde !== planetData.isRetrograde) {
          const retrogradeData = {
            planet: planet.name,
            date: currentDate.format('YYYY-MM-DD'),
            type: planetData.isRetrograde ? 'retrograde_start' : 'retrograde_end',
            sign: planetData.sign,
            degree: planetData.degreeInSign
          };
          
          retrogrades.push(retrogradeData);
        }
        
        lastSign = planetData.sign;
        lastRetrograde = planetData.isRetrograde;
      }
      
    } catch (error) {
      logger.error(`Error calculating position for ${planet.name} on ${currentDate.format('YYYY-MM-DD')}:`, error);
    }
    
    currentDate.add(checkInterval, 'days');
  }
  
  return { transits, retrogrades };
}

/**
 * Calculate transits for a specific planet over a time period
 */
async function calculatePlanetTransitsForPeriod(planet, startDate, endDate, timezone) {
  const transits = [];
  
  let currentDate = startDate.clone();
  let lastSign = null;
  
  while (currentDate.isBefore(endDate)) {
    try {
      const julianDay = enhancedSwissEphemeris.getJulianDay(
        currentDate.format('YYYY-MM-DD'),
        '12:00',
        timezone
      );
      
      const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
      const planetData = positions.planets[planet.id];
      
      if (planetData) {
        // Check for sign change (transit)
        if (lastSign && lastSign !== planetData.sign) {
          const transitData = {
            planet: planet.name,
            ingressDate: currentDate.format('YYYY-MM-DD'),
            fromSign: lastSign,
            toSign: planetData.sign,
            nakshatra: planetData.nakshatra,
            nakshatraPada: planetData.nakshatraPada,
            degreeInSign: planetData.degreeInSign,
            isRetrograde: planetData.isRetrograde,
            duration: calculateTransitDuration(planet.name, planetData.sign),
            significance: getTransitSignificance(planet.name, planetData.sign)
          };
          
          transits.push(transitData);
        }
        
        lastSign = planetData.sign;
      }
      
    } catch (error) {
      logger.error(`Error calculating position for ${planet.name} on ${currentDate.format('YYYY-MM-DD')}:`, error);
    }
    
    currentDate.add(planet.checkInterval, 'days');
  }
  
  return transits;
}

/**
 * Calculate approximate transit duration
 */
function calculateTransitDuration(planet, sign) {
  // Approximate durations based on planetary speeds
  const durations = {
    'Moon': '2-3 days',
    'Mercury': '2-3 weeks',
    'Venus': '3-4 weeks',
    'Sun': '1 month',
    'Mars': '2-7 months',
    'Jupiter': '1 year',
    'Saturn': '2.5 years',
    'Rahu': '1.5 years',
    'Ketu': '1.5 years'
  };
  
  return durations[planet] || 'Variable';
}

/**
 * Get transit significance
 */
function getTransitSignificance(planet, sign) {
  const significances = {
    'Jupiter': 'high',
    'Saturn': 'high',
    'Rahu': 'high',
    'Ketu': 'high',
    'Mars': 'medium',
    'Mercury': 'medium',
    'Venus': 'medium',
    'Sun': 'medium',
    'Moon': 'low'
  };
  
  return significances[planet] || 'medium';
}

/**
 * Generate transit description
 */
function generateTransitDescription(transit) {
  const descriptions = {
    'Jupiter': {
      'Aries': 'Jupiter in Aries brings expansion through leadership and new beginnings.',
      'Taurus': 'Jupiter in Taurus focuses on material growth and stability.',
      'Gemini': 'Jupiter in Gemini enhances communication and learning opportunities.',
      'Cancer': 'Jupiter in Cancer brings emotional growth and family blessings.',
      'Leo': 'Jupiter in Leo expands creativity and self-expression.',
      'Virgo': 'Jupiter in Virgo emphasizes practical wisdom and service.',
      'Libra': 'Jupiter in Libra brings harmony in relationships and partnerships.',
      'Scorpio': 'Jupiter in Scorpio deepens transformation and spiritual growth.',
      'Sagittarius': 'Jupiter in Sagittarius expands philosophy and higher learning.',
      'Capricorn': 'Jupiter in Capricorn brings structured growth and authority.',
      'Aquarius': 'Jupiter in Aquarius expands humanitarian and innovative thinking.',
      'Pisces': 'Jupiter in Pisces enhances spirituality and compassion.'
    },
    'Saturn': {
      'Aries': 'Saturn in Aries teaches discipline in leadership and independence.',
      'Taurus': 'Saturn in Taurus brings lessons in material responsibility.',
      'Gemini': 'Saturn in Gemini disciplines communication and learning.',
      'Cancer': 'Saturn in Cancer teaches emotional maturity and family duties.',
      'Leo': 'Saturn in Leo brings discipline to creativity and ego.',
      'Virgo': 'Saturn in Virgo emphasizes perfectionism and service.',
      'Libra': 'Saturn in Libra teaches balance in relationships and justice.',
      'Scorpio': 'Saturn in Scorpio brings deep transformation and resilience.',
      'Sagittarius': 'Saturn in Sagittarius disciplines beliefs and philosophy.',
      'Capricorn': 'Saturn in Capricorn brings mastery and authority.',
      'Aquarius': 'Saturn in Aquarius teaches innovation with discipline.',
      'Pisces': 'Saturn in Pisces brings spiritual discipline and service.'
    }
  };
  
  return descriptions[transit.planet]?.[transit.toSign] || 
         `${transit.planet} enters ${transit.toSign}, bringing new influences and opportunities.`;
}

module.exports = router;
