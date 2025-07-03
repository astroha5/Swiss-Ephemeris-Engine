const express = require('express');
const router = express.Router();
const Joi = require('joi');
const panchangService = require('../services/panchangService');
const logger = require('../utils/logger');

// Input validation schema
const panchangSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  timezone: Joi.string().default('Asia/Kolkata'),
  place: Joi.string().optional()
});

/**
 * POST /api/panchang
 * Calculate Panchang (Hindu calendar) details for given date, time, and location
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = panchangSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { date, time, latitude, longitude, timezone, place } = value;
    
    logger.info(`Calculating Panchang for ${date} ${time} at ${latitude}, ${longitude}`);

    // Calculate Panchang
    const panchangData = panchangService.calculatePanchang(
      date, time, latitude, longitude, timezone
    );

    // Add location information
    if (place) {
      panchangData.location = {
        name: place,
        coordinates: panchangData.coordinates
      };
    }

    // Format response
    const response = {
      success: true,
      data: {
        location: panchangData.location || {
          name: `${latitude}°N, ${longitude}°E`,
          coordinates: panchangData.coordinates
        },
        date: panchangData.date,
        panchang: {
          tithi: panchangData.tithi,
          nakshatra: panchangData.nakshatra,
          yoga: panchangData.yoga,
          karana: panchangData.karana
        },
        sunTimes: panchangData.sunTimes,
        additionalInfo: panchangData.additionalInfo,
        calculatedAt: panchangData.calculatedAt
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error calculating Panchang:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate Panchang',
      message: error.message
    });
  }
});

/**
 * GET /api/panchang/today
 * Get today's Panchang for a specific location
 */
router.get('/today', async (req, res) => {
  try {
    const { latitude, longitude, timezone = 'Asia/Kolkata', place } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const today = new Date();
    const date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const time = today.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

    const panchangData = panchangService.calculatePanchang(
      date, time, parseFloat(latitude), parseFloat(longitude), timezone
    );

    if (place) {
      panchangData.location = {
        name: place,
        coordinates: panchangData.coordinates
      };
    }

    res.status(200).json({
      success: true,
      data: panchangData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting today\'s Panchang:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get today\'s Panchang',
      message: error.message
    });
  }
});

/**
 * POST /api/panchang/month
 * Get Panchang for entire month
 */
router.post('/month', async (req, res) => {
  try {
    const monthSchema = Joi.object({
      year: Joi.number().min(1900).max(2100).required(),
      month: Joi.number().min(1).max(12).required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      timezone: Joi.string().default('Asia/Kolkata')
    });

    const { error, value } = monthSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { year, month, latitude, longitude, timezone } = value;
    
    // Calculate Panchang for each day of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthlyPanchang = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const time = '06:00'; // Standard sunrise time for calculation
      
      try {
        const dailyPanchang = panchangService.calculatePanchang(
          date, time, latitude, longitude, timezone
        );
        
        monthlyPanchang.push({
          date: date,
          day: day,
          weekday: dailyPanchang.date.weekday,
          tithi: dailyPanchang.tithi.name,
          nakshatra: dailyPanchang.nakshatra.name,
          yoga: dailyPanchang.yoga.name,
          sunrise: dailyPanchang.sunTimes.sunrise,
          sunset: dailyPanchang.sunTimes.sunset
        });
      } catch (dayError) {
        logger.warn(`Failed to calculate Panchang for ${date}:`, dayError);
        monthlyPanchang.push({
          date: date,
          day: day,
          error: 'Calculation failed'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        year: year,
        month: month,
        monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
        location: { latitude, longitude, timezone },
        days: monthlyPanchang
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error calculating monthly Panchang:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate monthly Panchang',
      message: error.message
    });
  }
});

module.exports = router;
