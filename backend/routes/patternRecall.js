const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

// GET /api/pattern-recall - Retrieve patterns from Supabase
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching pattern recall data from Supabase');
    
    // Example query - adjust based on your actual Supabase table structure
    const { data, error } = await supabase
      .from('world_events') // or whatever your events table is called
      .select('*')
      .limit(100);

    if (error) {
      logger.error('Error fetching pattern data:', error);
      return res.status(500).json({
        error: 'Failed to fetch pattern data',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in pattern recall endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /api/pattern-recall/analyze - Analyze patterns in events
router.post('/analyze', async (req, res) => {
  try {
    const { startDate, endDate, eventTypes, keywords } = req.body;
    
    logger.info('Analyzing patterns with filters:', { startDate, endDate, eventTypes, keywords });

    // Build query based on filters
    let query = supabase.from('world_events').select('*');
    
    if (startDate) {
      query = query.gte('event_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('event_date', endDate);
    }
    
    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }
    
    if (keywords && keywords.length > 0) {
      // Basic text search - adjust based on your table structure
      query = query.or(keywords.map(keyword => 
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%`
      ).join(','));
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      logger.error('Error analyzing patterns:', error);
      return res.status(500).json({
        error: 'Failed to analyze patterns',
        message: error.message
      });
    }

    // Basic pattern analysis
    const patterns = analyzeEventPatterns(data || []);

    res.json({
      success: true,
      patterns,
      eventCount: data?.length || 0,
      filters: { startDate, endDate, eventTypes, keywords },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in pattern analysis endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/pattern-recall/events/:id - Get specific event details
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`Fetching event details for ID: ${id}`);

    const { data, error } = await supabase
      .from('world_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error fetching event details:', error);
      return res.status(404).json({
        error: 'Event not found',
        message: error.message
      });
    }

    res.json({
      success: true,
      event: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in event details endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Helper function to analyze event patterns
function analyzeEventPatterns(events) {
  if (!events || events.length === 0) {
    return {
      totalEvents: 0,
      patterns: [],
      summary: 'No events found for analysis'
    };
  }

  // Basic pattern analysis - you can enhance this based on your needs
  const patterns = {
    byType: {},
    byMonth: {},
    bySource: {},
    trending: []
  };

  events.forEach(event => {
    // Group by event type
    if (event.event_type) {
      patterns.byType[event.event_type] = (patterns.byType[event.event_type] || 0) + 1;
    }

    // Group by month
    if (event.event_date) {
      const month = new Date(event.event_date).toISOString().slice(0, 7); // YYYY-MM
      patterns.byMonth[month] = (patterns.byMonth[month] || 0) + 1;
    }

    // Group by source
    if (event.source) {
      patterns.bySource[event.source] = (patterns.bySource[event.source] || 0) + 1;
    }
  });

  return {
    totalEvents: events.length,
    patterns,
    summary: `Analyzed ${events.length} events for pattern recognition`
  };
}

module.exports = router;
