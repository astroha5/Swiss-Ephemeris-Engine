const express = require('express');
const router = express.Router();
const PlanetaryPatternExtractorService = require('../services/planetaryPatternExtractorService');

// Initialize services
const patternExtractor = new PlanetaryPatternExtractorService();


/**
 * POST /api/patterns/match
 * Check if current planetary conditions match stored patterns
 */
router.post('/match', async (req, res) => {
  try {
    const { date, location } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Get astrological data for the specified date
    const { enrichWithAstroData } = require('../utils/enrichWithAstro');
    const astroData = await enrichWithAstroData(
      new Date(date),
      location?.latitude || 0,
      location?.longitude || 0,
      location?.name || 'Global'
    );

    if (!astroData.success) {
      throw new Error('Failed to calculate astrological data');
    }

    // Get stored patterns
    const { supabase } = require('../config/supabase');
    const { data: patterns, error } = await supabase
      .from('astrological_patterns')
      .select('*')
      .gte('success_rate', 60); // Only high-confidence patterns

    if (error) {
      throw error;
    }

    // Check for matches
    const matches = [];
    for (const pattern of patterns || []) {
      // Pattern matching functionality removed - notificationService no longer available
      const match = null;
      if (match && match.match_strength >= 70) {
        matches.push({
          ...match,
          pattern_id: pattern.id,
          pattern_name: pattern.pattern_name,
          pattern_type: pattern.pattern_type,
          success_rate: pattern.success_rate
        });
      }
    }

    // Sort by match strength
    matches.sort((a, b) => b.match_strength - a.match_strength);

    res.json({
      success: true,
      data: {
        date: date,
        location: location,
        total_patterns_checked: patterns?.length || 0,
        matches: matches,
        highest_risk_score: matches.length > 0 ? matches[0].match_strength : 0,
        planetary_snapshot: astroData.astroSnapshot,
        aspects: astroData.aspects
      },
      message: `Found ${matches.length} pattern matches`
    });

  } catch (error) {
    logger.error('Error in pattern matching endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check pattern matches'
    });
  }
});

/**
 * GET /api/patterns/statistics
 * Get pattern analysis statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const { supabase } = require('../config/supabase');

    // Get pattern statistics
    const [patternsResult, eventsResult, matchesResult] = await Promise.all([
      supabase
        .from('astrological_patterns')
        .select('pattern_type, success_rate, total_occurrences')
        .order('success_rate', { ascending: false }),
      
      supabase
        .from('world_events')
        .select('category, impact_level')
        .order('event_date', { ascending: false }),
      
      supabase
        .from('pattern_matches')
        .select('match_strength, created_at')
        .order('created_at', { ascending: false })
    ]);

    const patterns = patternsResult.data || [];
    const events = eventsResult.data || [];
    const matches = matchesResult.data || [];

    // Calculate statistics
    const stats = {
      patterns: {
        total: patterns.length,
        by_type: {},
        avg_success_rate: 0,
        high_confidence: patterns.filter(p => p.success_rate >= 80).length
      },
      events: {
        total: events.length,
        by_category: {},
        by_impact: {}
      },
      matches: {
        total: matches.length,
        avg_strength: 0,
        recent_matches: matches.slice(0, 10)
      }
    };

    // Pattern statistics
    patterns.forEach(pattern => {
      stats.patterns.by_type[pattern.pattern_type] = 
        (stats.patterns.by_type[pattern.pattern_type] || 0) + 1;
    });

    if (patterns.length > 0) {
      stats.patterns.avg_success_rate = 
        patterns.reduce((sum, p) => sum + (p.success_rate || 0), 0) / patterns.length;
    }

    // Event statistics
    events.forEach(event => {
      stats.events.by_category[event.category] = 
        (stats.events.by_category[event.category] || 0) + 1;
      stats.events.by_impact[event.impact_level] = 
        (stats.events.by_impact[event.impact_level] || 0) + 1;
    });

    // Match statistics
    if (matches.length > 0) {
      stats.matches.avg_strength = 
        matches.reduce((sum, m) => sum + (m.match_strength || 0), 0) / matches.length;
    }

    res.json({
      success: true,
      data: stats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching pattern statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch pattern statistics'
    });
  }
});

/**
 * GET /api/patterns/:id/details
 * Get detailed information about a pattern including associated events
 */
router.get('/:id/details', async (req, res) => {
  try {
    const patternId = req.params.id;
    const { supabase } = require('../config/supabase');

    // Get the pattern details
    const { data: pattern, error: patternError } = await supabase
      .from('astrological_patterns')
      .select('*')
      .eq('id', patternId)
      .single();

    if (patternError) {
      throw patternError;
    }

    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Pattern not found'
      });
    }

    // Get pattern matches with event details
    const { data: patternMatches, error: matchesError } = await supabase
      .from('pattern_matches')
      .select(`
        *,
        world_events!inner(
          id,
          title,
          description,
          event_date,
          category,
          event_type,
          impact_level,
          location_name,
          country_code
        )
      `)
      .eq('pattern_id', patternId)
      .order('match_strength', { ascending: false });

    // Since pattern_matches table is empty, let's find events based on pattern conditions and aspects
    let associatedEvents = [];
    
    // Always try to find events that match pattern conditions since pattern_matches is empty
    const { data: allEvents, error: eventsError } = await supabase
      .from('world_events')
      .select(`
        id,
        title,
        description,
        event_date,
        category,
        event_type,
        impact_level,
        location_name,
        country_code,
        source_url,
        source_name,
planetary_snapshot,
        planetary_aspects
      `)
      .order('event_date', { ascending: false })
      .limit(100);

    if (!eventsError && allEvents) {
      logger.info(`🔍 Filtering ${allEvents.length} events for pattern: ${pattern.pattern_name}`);
      logger.info(`Pattern conditions:`, pattern.pattern_conditions);
      
      // Filter events based on pattern conditions
      associatedEvents = allEvents.filter(event => {
        if (pattern.pattern_conditions) {
          const conditions = pattern.pattern_conditions;
          
          // For aspect patterns (like mercury-venus_aspects, mars-saturn_aspects)
          if (pattern.pattern_type === 'aspect' && conditions.planet_pair) {
            const [planet1, planet2] = conditions.planet_pair.split('-');
            
            // Check if this event has aspects between these planets
          }
          
          // Alternative approach for aspect patterns - check pattern name directly
          if (pattern.pattern_type === 'aspect' && pattern.pattern_name.includes('_aspects')) {
            const patternName = pattern.pattern_name.toLowerCase();
            // Extract planet names from pattern name (e.g., "mercury-venus_aspects")
            const planetMatch = patternName.match(/([a-z]+)-([a-z]+)_aspects/);
            if (planetMatch) {
              const [, planet1, planet2] = planetMatch;
              
              if (event.planetary_aspects && event.planetary_aspects.length > 0) {
                const hasAspect = event.planetary_aspects.some(aspect => {
                  return (aspect.planet_a === planet1 && aspect.planet_b === planet2) ||
                         (aspect.planet_a === planet2 && aspect.planet_b === planet1);
                });
                
                if (hasAspect) {
                  return true;
                }
              }
            }
          }
          
          // For general patterns, check category match
          if (conditions.category && event.category === conditions.category) {
            return true;
          }
          
          // For planetary patterns, check sign matches
          if (conditions.planets && event.planetary_snapshot) {
            return conditions.planets.some(planet => {
              const planetData = event.planetary_snapshot[planet];
              return planetData && planetData.sign && conditions.sign && planetData.sign === conditions.sign;
            });
          }
          
          // If it's a high-impact pattern, include high-impact events
          if (pattern.pattern_name.includes('High Impact') && 
              ['high', 'extreme'].includes(event.impact_level)) {
            return true;
          }
        }
        
        // Fallback: if no conditions or no match, but pattern has high success rate,
        // include high-impact events
        if (pattern.success_rate >= 70 && ['high', 'extreme'].includes(event.impact_level)) {
          return true;
        }
        
        return false;
      });
      
      logger.info(`🎯 Found ${associatedEvents.length} matching events before sorting/limiting`);
      
      // Sort by event date (most recent first) and limit based on pattern's total_occurrences
      associatedEvents = associatedEvents
        .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
        .slice(0, Math.max(pattern.total_occurrences || 15, 15)); // Show at least 15 or the total occurrences
        
      logger.info(`📊 Final result: ${associatedEvents.length} events after sorting/limiting`);
    }

    // If we still have no events and pattern_matches exists, use that
    if (associatedEvents.length === 0 && patternMatches && patternMatches.length > 0) {
      associatedEvents = patternMatches.map(match => ({
        ...match.world_events,
        match_strength: match.match_strength,
        match_details: match.match_details
      }));
    }

    // Get pattern statistics
    const { data: allMatches } = await supabase
      .from('pattern_matches')
      .select('match_strength')
      .eq('pattern_id', patternId);

    const matchStats = allMatches ? {
      total_matches: allMatches.length,
      avg_match_strength: allMatches.length > 0 
        ? allMatches.reduce((sum, m) => sum + (m.match_strength || 0), 0) / allMatches.length 
        : 0,
      high_confidence_matches: allMatches.filter(m => m.match_strength >= 80).length
    } : {
      total_matches: 0,
      avg_match_strength: 0,
      high_confidence_matches: 0
    };

    res.json({
      success: true,
      data: {
        pattern: pattern,
        associated_events: associatedEvents,
        statistics: matchStats,
        events_count: associatedEvents.length
      },
      message: `Found ${associatedEvents.length} events associated with pattern`
    });

  } catch (error) {
    logger.error('Error fetching pattern details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch pattern details'
    });
  }
});

module.exports = router;
