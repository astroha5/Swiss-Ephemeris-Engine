const express = require('express');
const router = express.Router();
const Joi = require('joi');
const dashaService = require('../services/dashaService');
const swissEphemerisService = require('../services/swissEphemeris');
const logger = require('../utils/logger');

// Input validation schema
const dashaSchema = Joi.object({
  birthDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  birthTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  timezone: Joi.string().default('Asia/Kolkata'),
  name: Joi.string().optional(),
  place: Joi.string().optional()
});

/**
 * POST /api/dasha
 * Calculate Vimshottari Dasha timeline for given birth details
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = dashaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { birthDate, birthTime, latitude, longitude, timezone, name, place } = value;
    
    logger.info(`Calculating Dasha for birth: ${birthDate} ${birthTime} at ${latitude}, ${longitude}`);

    // First, calculate birth chart to get Moon's nakshatra
    const julianDay = swissEphemerisService.getJulianDay(birthDate, birthTime, timezone);
    const planetaryPositions = swissEphemerisService.getPlanetaryPositions(julianDay);
    
    if (!planetaryPositions.moon) {
      throw new Error('Unable to calculate Moon position for Dasha calculation');
    }

    const moonNakshatra = planetaryPositions.moon.nakshatra;
    
    // Calculate nakshatra progress (simplified - would need more precise calculation)
    const moonNakshatraProgress = ((planetaryPositions.moon.longitude % (360/27)) / (360/27)) * 100;

    // Calculate Dasha timeline
    const dashaData = dashaService.calculateDashaTimeline(
      birthDate, 
      birthTime, 
      moonNakshatra, 
      moonNakshatraProgress, 
      timezone
    );

    // Format response to match frontend expectations
    const response = {
      success: true,
      data: {
        birthDetails: {
          name: name || 'Unknown',
          date: birthDate,
          time: birthTime,
          place: place || `${latitude}°N, ${longitude}°E`,
          moonNakshatra: moonNakshatra,
          birthDashaLord: dashaData.birthDetails.birthDashaLord
        },
        currentMahadasha: dashaData.currentMahadasha,
        currentAntardasha: dashaData.currentAntardasha,
        dashaSequence: dashaData.dashaSequence,
        timeline: dashaData.timeline,
        coordinates: {
          latitude: latitude,
          longitude: longitude,
          timezone: timezone
        },
        calculatedAt: dashaData.calculatedAt
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error calculating Dasha:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate Dasha timeline',
      message: error.message
    });
  }
});

/**
 * POST /api/dasha/detailed
 * Get detailed Dasha with sub-periods (Antardasha, Pratyantardasha)
 */
router.post('/detailed', async (req, res) => {
  try {
    const detailedSchema = Joi.object({
      ...dashaSchema.describe().keys,
      includeSubPeriods: Joi.boolean().default(true),
      includePratyantardasha: Joi.boolean().default(false)
    });

    const { error, value } = detailedSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { 
      birthDate, birthTime, latitude, longitude, timezone, 
      name, place, includeSubPeriods, includePratyantardasha 
    } = value;

    // Calculate birth chart for Moon position
    const julianDay = swissEphemerisService.getJulianDay(birthDate, birthTime, timezone);
    const planetaryPositions = swissEphemerisService.getPlanetaryPositions(julianDay);
    
    const moonNakshatra = planetaryPositions.moon.nakshatra;
    const moonNakshatraProgress = ((planetaryPositions.moon.longitude % (360/27)) / (360/27)) * 100;

    // Calculate detailed Dasha timeline
    const dashaData = dashaService.calculateDashaTimeline(
      birthDate, birthTime, moonNakshatra, moonNakshatraProgress, timezone
    );

    // Add detailed sub-periods if requested
    if (includeSubPeriods) {
      dashaData.dashaSequence = dashaData.dashaSequence.map(dasha => ({
        ...dasha,
        subPeriods: dasha.subPeriods || []
      }));
    }

    const response = {
      success: true,
      data: {
        ...dashaData,
        settings: {
          includeSubPeriods,
          includePratyantardasha
        },
        birthChart: {
          moonPosition: {
            sign: planetaryPositions.moon.sign,
            nakshatra: planetaryPositions.moon.nakshatra,
            pada: planetaryPositions.moon.nakshatraPada,
            degree: planetaryPositions.moon.degreeFormatted
          }
        }
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error calculating detailed Dasha:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate detailed Dasha',
      message: error.message
    });
  }
});

/**
 * POST /api/dasha/current
 * Get only current Mahadasha and Antardasha
 */
router.post('/current', async (req, res) => {
  try {
    const { error, value } = dashaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { birthDate, birthTime, latitude, longitude, timezone } = value;

    // Calculate Moon position
    const julianDay = swissEphemerisService.getJulianDay(birthDate, birthTime, timezone);
    const planetaryPositions = swissEphemerisService.getPlanetaryPositions(julianDay);
    
    const moonNakshatra = planetaryPositions.moon.nakshatra;
    const moonNakshatraProgress = ((planetaryPositions.moon.longitude % (360/27)) / (360/27)) * 100;

    // Calculate Dasha
    const dashaData = dashaService.calculateDashaTimeline(
      birthDate, birthTime, moonNakshatra, moonNakshatraProgress, timezone
    );

    // Return only current periods
    const response = {
      success: true,
      data: {
        currentMahadasha: dashaData.currentMahadasha,
        currentAntardasha: dashaData.currentAntardasha,
        birthDashaLord: dashaData.birthDetails.birthDashaLord,
        moonNakshatra: moonNakshatra,
        calculatedAt: dashaData.calculatedAt
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error getting current Dasha:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current Dasha',
      message: error.message
    });
  }
});

/**
 * GET /api/dasha/periods
 * Get standard Vimshottari Dasha periods reference
 */
router.get('/periods', (req, res) => {
  try {
    const periods = {
      Ketu: 7,
      Venus: 20,
      Sun: 6,
      Moon: 10,
      Mars: 7,
      Rahu: 18,
      Jupiter: 16,
      Saturn: 19,
      Mercury: 17
    };

    const sequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

    const response = {
      success: true,
      data: {
        periods: periods,
        sequence: sequence,
        totalCycle: 120, // years
        description: 'Vimshottari Dasha system - 120-year planetary cycle',
        note: 'Each planet rules for the specified number of years in the given sequence'
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error getting Dasha periods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Dasha periods',
      message: error.message
    });
  }
});

module.exports = router;
