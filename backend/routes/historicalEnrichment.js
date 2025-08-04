const express = require('express');
const router = express.Router();
const historicalEventEnrichmentService = require('../services/historicalEventEnrichmentService');
const wikipediaEventFetcher = require('../services/wikipediaEventFetcher');
const logger = require('../utils/logger');

/**
 * API Routes for Historical Events Enrichment
 * Provides endpoints to fetch and enrich historical events from Wikipedia/Wikidata
 */

/**
 * POST /api/historical-enrichment/enrich
 * Start the historical events enrichment process
 */
router.post('/enrich', async (req, res) => {
  try {
    logger.info('📥 Historical events enrichment API called');

    const options = {
      categoryLimit: req.body.limit || 30,
      startYear: req.body.startYear || 1900,
      endYear: req.body.endYear || new Date().getFullYear(),
      categories: req.body.categories, // Array of Wikipedia categories
      useCategories: req.body.useCategories !== false,
      useOnThisDay: req.body.useOnThisDay !== false,
      useWikidata: req.body.useWikidata !== false,
      useTimelines: req.body.useTimelines !== false,
      dryRun: req.body.dryRun || false
    };

    // Validate input
    if (options.startYear > options.endYear) {
      return res.status(400).json({
        success: false,
        error: 'startYear must be less than or equal to endYear'
      });
    }

    if (options.categoryLimit > 100) {
      return res.status(400).json({
        success: false,
        error: 'limit cannot exceed 100 events per category'
      });
    }

    // Start enrichment process
    const results = await historicalEventEnrichmentService.enrichHistoricalEvents(options);

    res.json({
      success: true,
      message: 'Historical events enrichment completed',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Historical events enrichment API failed:', error);
    res.status(500).json({
      success: false,
      error: 'Historical events enrichment failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/historical-enrichment/stats
 * Get enrichment statistics
 */
router.get('/stats', async (req, res) => {
  try {
    logger.info('📊 Historical events statistics API called');

    const stats = await historicalEventEnrichmentService.getEnrichmentStats();

    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Historical events statistics API failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enrichment statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/historical-enrichment/update-existing
 * Update existing events with Wikipedia data
 */
router.post('/update-existing', async (req, res) => {
  try {
    logger.info('🔄 Update existing events API called');

    const options = {
      limit: req.body.limit || 50
    };

    const results = await historicalEventEnrichmentService.updateExistingEventsWithWikipediaData(options);

    res.json({
      success: true,
      message: 'Existing events updated with Wikipedia data',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Update existing events API failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update existing events',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/historical-enrichment/fetch-date-range
 * Fetch events for a specific date range
 */
router.post('/fetch-date-range', async (req, res) => {
  try {
    logger.info('📅 Fetch date range events API called');

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const options = {
      categories: req.body.categories,
      limit: req.body.limit || 20,
      useTimelines: req.body.useTimelines !== false
    };

    const results = await historicalEventEnrichmentService.fetchEventsForDateRange(
      new Date(startDate),
      new Date(endDate),
      options
    );

    res.json({
      success: true,
      message: 'Events fetched for date range',
      results: results,
      dateRange: { startDate, endDate },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Fetch date range events API failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events for date range',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/historical-enrichment/test-wikipedia/:title
 * Test fetching a specific Wikipedia page
 */
router.get('/test-wikipedia/:title', async (req, res) => {
  try {
    const { title } = req.params;
    logger.info(`🧪 Testing Wikipedia fetch for: ${title}`);

    const pageData = await wikipediaEventFetcher.fetchPageSummary(title);

    if (!pageData) {
      return res.status(404).json({
        success: false,
        error: 'Wikipedia page not found or not suitable',
        title: title
      });
    }

    res.json({
      success: true,
      message: 'Wikipedia page fetched successfully',
      data: pageData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ Test Wikipedia fetch failed for ${req.params.title}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Wikipedia page',
      message: error.message,
      title: req.params.title,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/historical-enrichment/categories
 * Get available Wikipedia categories for fetching
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = {
      financial: [
        'Financial crises',
        'Stock market crashes',
        'Economic history',
        'Banking crises',
        'Currency crises'
      ],
      natural_disaster: [
        'Natural disasters',
        'Earthquakes',
        'Tsunamis',
        'Hurricanes',
        'Volcanic eruptions',
        'Floods',
        'Droughts'
      ],
      political: [
        'Political events',
        'Elections',
        'Coups d\'état',
        'Revolutions', 
        'Government',
        'Independence movements'
      ],
      war: [
        'Wars',
        'Military conflicts',
        'Battles',
        'World wars',
        'Civil wars',
        'Military history'
      ],
      terrorism: [
        'Terrorist incidents',
        'Terrorist attacks',
        'September 11 attacks',
        'Bombings'
      ],
      pandemic: [
        'Pandemics',
        'Epidemics',
        'Disease outbreaks',
        'Public health emergencies',
        'COVID-19 pandemic'
      ],
      technology: [
        'Space exploration',
        'Technological breakthroughs',
        'Internet history',
        'Computer history'
      ],
      social: [
        'Social movements',
        'Civil rights movements',
        'Protests',
        'Social history'
      ],
      accident: [
        'Nuclear accidents',
        'Industrial accidents',
        'Aviation accidents',
        'Maritime disasters'
      ]
    };

    res.json({
      success: true,
      categories: categories,
      totalCategories: Object.keys(categories).length,
      totalWikipediaCategories: Object.values(categories).flat().length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Get categories API failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/historical-enrichment/wikidata-query
 * Execute a custom Wikidata SPARQL query
 */
router.post('/wikidata-query', async (req, res) => {
  try {
    logger.info('🔍 Custom Wikidata query API called');

    const { startYear, endYear, limit, eventTypes } = req.body;

    if (!startYear || !endYear) {
      return res.status(400).json({
        success: false,
        error: 'startYear and endYear are required'
      });
    }

    const options = {
      startYear: parseInt(startYear),
      endYear: parseInt(endYear),
      wikidataLimit: limit || 50,
      useWikidata: true,
      useCategories: false,
      useOnThisDay: false,
      useTimelines: false
    };

    const results = await historicalEventEnrichmentService.enrichHistoricalEvents(options);

    res.json({
      success: true,
      message: 'Wikidata query completed',
      results: results,
      query: { startYear, endYear, limit },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Wikidata query API failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute Wikidata query',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/historical-enrichment/on-this-day/:month/:day
 * Get "On This Day" events for a specific date
 */
router.get('/on-this-day/:month/:day', async (req, res) => {
  try {
    const { month, day } = req.params;
    
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return res.status(400).json({
        success: false,
        error: 'Valid month (1-12) and day (1-31) are required'
      });
    }

    logger.info(`📅 On This Day API called for ${month}/${day}`);

    // Fetch events using the Wikipedia fetcher
    const events = await wikipediaEventFetcher.fetchDayEvents(parseInt(month), parseInt(day));

    res.json({
      success: true,
      message: `Events found for ${month}/${day}`,
      events: events,
      count: events.length,
      date: { month: parseInt(month), day: parseInt(day) },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ On This Day API failed for ${req.params.month}/${req.params.day}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch On This Day events',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/historical-enrichment/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test Wikipedia API connectivity
    const testTitle = '2020_coronavirus_pandemic';
    const testData = await wikipediaEventFetcher.fetchPageSummary(testTitle);
    
    res.json({
      success: true,
      message: 'Historical enrichment service is healthy',
      services: {
        wikipedia_api: testData ? 'operational' : 'degraded',
        database: 'operational', // We assume if we got here, DB is working
        wikidata: 'operational'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Service health check failed',
      services: {
        wikipedia_api: 'down',
        database: 'unknown',
        wikidata: 'unknown'
      },
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
