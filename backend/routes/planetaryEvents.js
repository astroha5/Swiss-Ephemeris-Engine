const express = require('express');
const router = express.Router();
const worldEventsService = require('../services/worldEventsService');
const patternRecognitionService = require('../services/patternRecognitionService');
const { enrichWithAstroData } = require('../utils/enrichWithAstro');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

// =====================================
// WORLD EVENTS ROUTES
// =====================================

/**
 * @route POST /api/planetary-events/events
 * @desc Create a new world event with astronomical data
 */
router.post('/events', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate required fields
    if (!eventData.title || !eventData.event_date || !eventData.category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, event_date, category'
      });
    }

    const result = await worldEventsService.createEvent(eventData);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Event created successfully with astronomical data'
    });

  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/planetary-events/events
 * @desc Get events with optional filters
 */
router.get('/events', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      impact_level: req.query.impact_level,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      sun_sign: req.query.sun_sign,
      moon_sign: req.query.moon_sign,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const events = await worldEventsService.getEvents(filters);
    
    res.json({
      success: true,
      data: events,
      count: events.length,
      filters_applied: filters
    });

  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/planetary-events/events/statistics
 * @desc Get statistical analysis of events
 */
router.get('/events/statistics', async (req, res) => {
  try {
    const statistics = await worldEventsService.getEventStatistics();
    
    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Error generating statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/planetary-events/events/:id
 * @desc Delete an event and all associated data
 */
router.delete('/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    await worldEventsService.deleteEvent(eventId);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================
// SEARCH AND QUERY ROUTES
// =====================================

/**
 * @route POST /api/planetary-events/search/planetary-positions
 * @desc Search events by planetary positions
 */
router.post('/search/planetary-positions', async (req, res) => {
  try {
    const searchParams = req.body;
    
    const results = await worldEventsService.searchByPlanetaryPositions(searchParams);
    
    res.json({
      success: true,
      data: results,
      count: results.length,
      search_params: searchParams
    });

  } catch (error) {
    logger.error('Error searching by planetary positions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/planetary-events/search/aspects
 * @desc Find events with specific aspects
 */
router.post('/search/aspects', async (req, res) => {
  try {
    const aspectParams = req.body;
    
    const results = await worldEventsService.findEventsByAspects(aspectParams);
    
    res.json({
      success: true,
      data: results,
      count: results.length,
      search_params: aspectParams
    });

  } catch (error) {
    logger.error('Error searching by aspects:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================
// PATTERN RECOGNITION ROUTES
// =====================================

/**
 * @route POST /api/planetary-events/patterns/analyze
 * @desc Analyze patterns in historical events
 */
router.post('/patterns/analyze', async (req, res) => {
  try {
    const options = req.body || {};
    
    const analysis = await patternRecognitionService.analyzePatterns(options);
    
    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Error analyzing patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/planetary-events/patterns/stats
 * @desc Get statistics about discovered patterns for ML training
 */
router.get('/patterns/stats', async (req, res) => {
  try {
    const stats = await patternRecognitionService.getPatternStatistics();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting pattern statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/planetary-events/patterns/match
 * @desc Find patterns matching current transits
 */
router.post('/patterns/match', async (req, res) => {
  try {
    const currentTransits = req.body.transits;
    
    if (!currentTransits) {
      return res.status(400).json({
        success: false,
        error: 'Missing current transits data'
      });
    }

    const matches = await patternRecognitionService.findMatchingPatterns(currentTransits);
    
    res.json({
      success: true,
      data: matches,
      count: matches.length
    });

  } catch (error) {
    logger.error('Error finding matching patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/planetary-events/predictions/generate
 * @desc Generate future predictions based on transits
 */
router.post('/predictions/generate', async (req, res) => {
  try {
    const { upcoming_transits, options } = req.body;
    
    if (!upcoming_transits) {
      return res.status(400).json({
        success: false,
        error: 'Missing upcoming transits data'
      });
    }

    const predictions = await patternRecognitionService.generatePredictions(upcoming_transits, options);
    
    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });

  } catch (error) {
    logger.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================
// UTILITY ROUTES
// =====================================

/**
 * @route POST /api/planetary-events/calculate-transits
 * @desc Calculate planetary transits for a specific date/location
 */
router.post('/calculate-transits', async (req, res) => {
  try {
    const { timestamp, latitude, longitude, location_name } = req.body;
    
    if (!timestamp || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: timestamp, latitude, longitude'
      });
    }

    const date = new Date(timestamp);
    const astroData = await enrichWithAstroData(date, latitude, longitude, location_name || '');
    
    res.json({
      success: true,
      data: {
        calculation_time: timestamp,
        location: { latitude, longitude, name: location_name },
        julian_day: astroData.julianDay,
        planetary_positions: astroData.astroSnapshot,
        aspects: astroData.aspects
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
 * @route GET /api/planetary-events/historical-pattern
 * @desc Get historical events that match a specific pattern
 */
router.get('/historical-pattern', async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'Pattern name is required'
      });
    }

    // Query world_events table for events that match this pattern
    // This is a simplified approach - you may need to adjust based on your actual data structure
    const { data: events, error: dbError } = await supabase
      .from('world_events')
      .select(`
        id,
        title,
        description,
        event_date,
        category,
        impact_level,
        location_name,
        source_url,
        created_at
      `)
      .order('event_date', { ascending: false })
      .limit(10);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Format the events for display
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.event_date,
      category: event.category,
      impact_level: event.impact_level,
      location: event.location_name,
      source_url: event.source_url,
      correlation: 'High' // This would be calculated based on actual pattern matching
    }));

    res.json({
      success: true,
      data: formattedEvents,
      pattern_name: pattern,
      count: formattedEvents.length
    });

  } catch (error) {
    logger.error('Error fetching historical pattern events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/planetary-events/today-risk
 * @desc Get risk assessment for today based on current transits
 */
router.get('/today-risk', async (req, res) => {
  try {
    const today = new Date();
    const latitude = parseFloat(req.query.lat) || 0; // Default to Greenwich
    const longitude = parseFloat(req.query.lon) || 0;
    
    // Calculate today's transits
    const todayTransits = await enrichWithAstroData(today, latitude, longitude, 'Current Location');
    
    if (!todayTransits.success) {
      throw new Error('Failed to calculate today\'s transits');
    }

    // Try to find matching patterns (gracefully handle missing tables)
    let matchingPatterns = [];
    let riskScore = 0;
    
    try {
      matchingPatterns = await patternRecognitionService.findMatchingPatterns(todayTransits.astroSnapshot);
      riskScore = matchingPatterns.reduce((total, pattern) => total + pattern.risk_level, 0) / matchingPatterns.length || 0;
    } catch (patternError) {
      logger.warn('Pattern analysis not available:', patternError.message);
      // Use basic risk assessment based on planetary positions
      riskScore = calculateBasicRiskScore(todayTransits.astroSnapshot);
    }
    
    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 7) riskLevel = 'extreme';
    else if (riskScore >= 5) riskLevel = 'high';
    else if (riskScore >= 3) riskLevel = 'medium';
    
    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        location: { latitude, longitude },
        overall_risk_score: Math.round(riskScore * 100) / 100,
        risk_level: riskLevel,
        matching_patterns: matchingPatterns.slice(0, 5),
        planetary_positions: todayTransits.astroSnapshot,
        interpretation: generateRiskInterpretation(riskLevel, matchingPatterns.slice(0, 3))
      }
    });

  } catch (error) {
    logger.error('Error calculating today\'s risk:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/planetary-events/enhance-planetary-data
 * @desc Enhance existing events with planetary calculations
 */
router.post('/enhance-planetary-data', async (req, res) => {
  try {
    const { event_ids, force_recalculate = false } = req.body;
    
    if (!event_ids || !Array.isArray(event_ids)) {
      return res.status(400).json({
        success: false,
        error: 'Missing event_ids array'
      });
    }

    const results = await worldEventsService.enhancePlanetaryData(event_ids, force_recalculate);
    
    res.json({
      success: true,
      data: results,
      message: `Enhanced ${results.enhanced} events with planetary data`
    });

  } catch (error) {
    logger.error('Error enhancing planetary data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/planetary-events/batch-create
 * @desc Create multiple events from CSV or JSON data
 */
router.post('/batch-create', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing events array or empty array provided'
      });
    }

    const results = {
      created: [],
      failed: [],
      total: events.length
    };

    // Process events in parallel (but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (eventData) => {
        try {
          const result = await worldEventsService.createEvent(eventData);
          results.created.push(result);
        } catch (error) {
          results.failed.push({
            event: eventData,
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
    }

    res.json({
      success: true,
      data: results,
      message: `Created ${results.created.length} events, ${results.failed.length} failed`
    });

  } catch (error) {
    logger.error('Error in batch create:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Calculate basic risk score based on planetary positions
 * @param {Object} planetaryPositions - Current planetary positions
 * @returns {number} Risk score (0-10)
 */
function calculateBasicRiskScore(planetaryPositions) {
  let riskScore = 2; // Base risk score
  
  // Mars in aggressive signs increases risk
  if (['Aries', 'Scorpio', 'Capricorn'].includes(planetaryPositions.mars_sign)) {
    riskScore += 1;
  }
  
  // Saturn in certain signs increases tension
  if (['Capricorn', 'Aquarius'].includes(planetaryPositions.saturn_sign)) {
    riskScore += 0.5;
  }
  
  // Rahu in prominent signs can increase volatility
  if (['Gemini', 'Virgo', 'Sagittarius'].includes(planetaryPositions.rahu_sign)) {
    riskScore += 0.5;
  }
  
  // Jupiter in debilitation or difficult signs
  if (['Capricorn', 'Virgo'].includes(planetaryPositions.jupiter_sign)) {
    riskScore += 0.3;
  }
  
  return Math.min(10, riskScore);
}

/**
 * Generate risk interpretation text
 * @param {string} riskLevel - Risk level
 * @param {Array} patterns - Top patterns
 * @returns {string} Interpretation text
 */
function generateRiskInterpretation(riskLevel, patterns = []) {
  let interpretation = `Current risk level is ${riskLevel.toUpperCase()}. `;
  
  if (patterns.length > 0) {
    interpretation += `Primary influences: ${patterns.map(p => p.pattern_name).join(', ')}. `;
  }
  
  switch (riskLevel) {
    case 'extreme':
      interpretation += 'Heightened probability of significant global events. Monitor news closely and be prepared for market volatility.';
      break;
    case 'high':
      interpretation += 'Elevated risk of important events. Good time for caution in major decisions.';
      break;
    case 'medium':
      interpretation += 'Moderate risk level. Some minor events possible but nothing major expected.';
      break;
    default:
      interpretation += 'Low risk period. Generally stable conditions expected.';
  }
  
  return interpretation;
}

module.exports = router;
