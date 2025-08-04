const { supabase } = require('../config/supabase');
const enhancedSwissEphemeris = require('./enhancedSwissEphemeris');
const { enrichWithAstroData } = require('../utils/enrichWithAstro');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

class PredictionService {
  constructor() {
    // Define astrological patterns that correlate with different event types
    this.eventPatterns = {
      financial: {
        // Financial crises often occur with Saturn-Pluto aspects
        saturnPlutoAspects: ['conjunction', 'opposition', 'square'],
        // Mars in Capricorn or Scorpio can indicate financial volatility
        marsInSigns: ['Capricorn', 'Scorpio'],
        // Jupiter-Saturn oppositions affect economic policies
        jupiterSaturnAspects: ['opposition', 'square'],
        // Eclipse in financial signs
        eclipseSigns: ['Taurus', 'Scorpio', 'Capricorn']
      },
      war: {
        // Mars aspects to outer planets
        marsAspects: ['conjunction', 'opposition', 'square'],
        // Mars in aggressive signs
        marsInSigns: ['Aries', 'Scorpio', 'Capricorn'],
        // Saturn-Pluto hard aspects
        saturnPlutoAspects: ['conjunction', 'opposition', 'square'],
        // Eclipse in cardinal signs
        eclipseSigns: ['Aries', 'Cancer', 'Libra', 'Capricorn']
      },
      natural_disaster: {
        // Uranus aspects (sudden events)
        uranusAspects: ['conjunction', 'opposition', 'square'],
        // Mars-Uranus aspects
        marsUranusAspects: ['conjunction', 'opposition', 'square'],
        // Eclipse in earth signs
        eclipseSigns: ['Taurus', 'Virgo', 'Capricorn'],
        // Saturn in cardinal signs
        saturnInSigns: ['Aries', 'Cancer', 'Libra', 'Capricorn']
      },
      political: {
        // Jupiter-Saturn conjunctions (major political changes)
        jupiterSaturnAspects: ['conjunction'],
        // Pluto aspects (transformation)
        plutoAspects: ['conjunction', 'opposition', 'square'],
        // Eclipse in leadership signs
        eclipseSigns: ['Leo', 'Aquarius', 'Aries', 'Libra']
      },
      terrorism: {
        // Mars-Pluto aspects (violence and extremism)
        marsPlutoAspects: ['conjunction', 'opposition', 'square'],
        // Mars in intense signs
        marsInSigns: ['Scorpio', 'Aries'],
        // Eclipse in fixed signs
        eclipseSigns: ['Taurus', 'Leo', 'Scorpio', 'Aquarius']
      }
    };
  }

  /**
   * Generate predictions for the next 6 months based on current planetary transits
   * @param {Date} startDate - Start date for predictions
   * @param {number} months - Number of months to predict (default: 6)
   * @returns {Array} Array of predictions
   */
  async generatePredictions(startDate = new Date(), months = 6) {
    try {
      logger.info(`🔮 Generating predictions for ${months} months starting ${startDate.toISOString()}`);

      const predictions = [];
      const endDate = moment(startDate).add(months, 'months').toDate();

      // Analyze historical patterns first
      const historicalPatterns = await this.analyzeHistoricalPatterns();
      logger.info(`📊 Found ${historicalPatterns.length} historical patterns`);

      // Get current and upcoming planetary transits
      const upcomingTransits = await this.getUpcomingTransits(startDate, endDate);
      logger.info(`🌟 Found ${upcomingTransits.length} significant upcoming transits`);

      // Generate predictions based on transit patterns
      for (const transit of upcomingTransits) {
        const prediction = await this.analyzeTrend(transit, historicalPatterns);
        if (prediction && prediction.confidence_score >= 30) { // Only store predictions with reasonable confidence
          predictions.push(prediction);
        }
      }

      // Store predictions in database
      const storedPredictions = [];
      for (const prediction of predictions) {
        try {
          const { data, error } = await supabase
            .from('future_predictions')
            .insert([prediction])
            .select()
            .single();

          if (error) {
            logger.error('Failed to store prediction:', error);
          } else {
            storedPredictions.push(data);
            logger.info(`✅ Stored prediction: ${prediction.predicted_category} (${prediction.confidence_score}% confidence)`);
          }
        } catch (storeError) {
          logger.error('Error storing prediction:', storeError);
        }
      }

      logger.info(`🎉 Generated ${storedPredictions.length} predictions successfully`);
      return storedPredictions;

    } catch (error) {
      logger.error('Error generating predictions:', error);
      throw error;
    }
  }

  /**
   * Analyze historical patterns from stored events
   * @returns {Array} Array of pattern analysis results
   */
  async analyzeHistoricalPatterns() {
    try {
      // Get all events with their planetary data
      const { data: events, error } = await supabase
        .from('events_with_transits')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) {
        throw error;
      }

      const patterns = [];

      // Group events by category and analyze common planetary configurations
      const eventsByCategory = {};
      events.forEach(event => {
        if (!eventsByCategory[event.category]) {
          eventsByCategory[event.category] = [];
        }
        eventsByCategory[event.category].push(event);
      });

      // Analyze patterns for each category
      for (const [category, categoryEvents] of Object.entries(eventsByCategory)) {
        if (categoryEvents.length >= 2) { // Need at least 2 events to identify a pattern
          const pattern = this.identifyPatternInCategory(category, categoryEvents);
          if (pattern) {
            patterns.push(pattern);
          }
        }
      }

      return patterns;

    } catch (error) {
      logger.error('Error analyzing historical patterns:', error);
      throw error;
    }
  }

  /**
   * Identify common astrological patterns in a category of events
   * @param {string} category - Event category
   * @param {Array} events - Events in this category
   * @returns {Object} Pattern analysis
   */
  identifyPatternInCategory(category, events) {
    const signFrequency = {};
    const aspectPatterns = [];
    
    // Analyze planetary sign positions
    const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
    
    planets.forEach(planet => {
      const signColumn = `${planet}_sign`;
      const signs = events.map(e => e[signColumn]).filter(s => s);
      
      signs.forEach(sign => {
        const key = `${planet}_in_${sign}`;
        signFrequency[key] = (signFrequency[key] || 0) + 1;
      });
    });

    // Find most common patterns (frequency > 20% of events in category)
    const threshold = Math.max(2, Math.ceil(events.length * 0.2));
    const significantPatterns = Object.entries(signFrequency)
      .filter(([pattern, freq]) => freq >= threshold)
      .sort((a, b) => b[1] - a[1]);

    if (significantPatterns.length > 0) {
      return {
        category,
        eventCount: events.length,
        patterns: significantPatterns.slice(0, 5), // Top 5 patterns
        successRate: this.calculateSuccessRate(category, significantPatterns, events.length),
        strength: significantPatterns[0][1] / events.length // Percentage of events showing top pattern
      };
    }

    return null;
  }

  /**
   * Calculate success rate for a pattern
   * @param {string} category - Event category
   * @param {Array} patterns - Identified patterns
   * @param {number} totalEvents - Total events in category
   * @returns {number} Success rate percentage
   */
  calculateSuccessRate(category, patterns, totalEvents) {
    // Simple success rate calculation based on pattern strength
    const topPatternFreq = patterns[0] ? patterns[0][1] : 0;
    return Math.min(95, (topPatternFreq / totalEvents) * 100);
  }

  /**
   * Get upcoming significant planetary transits
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of significant transits
   */
  async getUpcomingTransits(startDate, endDate) {
    try {
      const transits = [];
      const currentDate = moment(startDate);
      const finalDate = moment(endDate);

      // Check transits weekly
      while (currentDate.isBefore(finalDate)) {
        try {
          // Get planetary positions for this date (using UTC coordinates)
          const astroData = await enrichWithAstroData(
            currentDate.toDate(), 
            0, 0, // Use Greenwich as neutral location
            'Global', 
            'UTC'
          );

          if (astroData.success) {
            // Analyze this date for significant transits
            const significantTransit = this.identifySignificantTransits(currentDate.toDate(), astroData);
            if (significantTransit) {
              transits.push(significantTransit);
            }
          }
        } catch (transitError) {
          logger.warn(`Error calculating transit for ${currentDate.format('YYYY-MM-DD')}: ${transitError.message}`);
        }

        currentDate.add(7, 'days'); // Check weekly
      }

      return transits;

    } catch (error) {
      logger.error('Error getting upcoming transits:', error);
      throw error;
    }
  }

  /**
   * Identify significant transits for a given date
   * @param {Date} date - Date to analyze
   * @param {Object} astroData - Astrological data
   * @returns {Object|null} Significant transit or null
   */
  identifySignificantTransits(date, astroData) {
    const planets = astroData.astroSnapshot;
    const aspects = astroData.aspects;

    // Check for significant aspects
    const significantAspects = aspects.filter(aspect => {
      // Major aspects with tight orbs
      return (
        (['conjunction', 'opposition', 'square'].includes(aspect.type) && aspect.orb <= 3) ||
        (['trine', 'sextile'].includes(aspect.type) && aspect.orb <= 2)
      );
    });

    if (significantAspects.length > 0) {
      return {
        date: date,
        type: 'aspect',
        details: significantAspects,
        planetarySnapshot: planets,
        significance: this.calculateTransitSignificance(significantAspects, planets)
      };
    }

    // Check for planets changing signs
    const signChanges = this.checkForSignChanges(date, planets);
    if (signChanges.length > 0) {
      return {
        date: date,
        type: 'sign_change',
        details: signChanges,
        planetarySnapshot: planets,
        significance: this.calculateSignChangeSignificance(signChanges)
      };
    }

    return null;
  }

  /**
   * Check for significant sign changes (this is simplified - in reality you'd compare with previous positions)
   * @param {Date} date - Date
   * @param {Object} planets - Planetary positions
   * @returns {Array} Sign changes
   */
  checkForSignChanges(date, planets) {
    const changes = [];
    
    // Check if slow-moving planets are at sign boundaries (within 2 degrees)
    const slowPlanets = ['jupiter', 'saturn', 'mars'];
    
    slowPlanets.forEach(planet => {
      const planetData = planets[planet];
      if (planetData && (planetData.degree <= 2 || planetData.degree >= 28)) {
        changes.push({
          planet: planet,
          sign: planetData.sign,
          degree: planetData.degree,
          type: planetData.degree <= 2 ? 'entering' : 'leaving'
        });
      }
    });

    return changes;
  }

  /**
   * Calculate significance of a transit
   * @param {Array} aspects - Significant aspects
   * @param {Object} planets - Planetary positions
   * @returns {number} Significance score (0-100)
   */
  calculateTransitSignificance(aspects, planets) {
    let score = 0;

    aspects.forEach(aspect => {
      // Weight by aspect type
      const aspectWeights = {
        'conjunction': 10,
        'opposition': 9,
        'square': 8,
        'trine': 6,
        'sextile': 4
      };

      score += aspectWeights[aspect.type] || 3;

      // Bonus for exact aspects
      if (aspect.exact) {
        score += 5;
      }

      // Bonus for outer planet aspects
      const outerPlanets = ['jupiter', 'saturn', 'rahu', 'ketu'];
      if (outerPlanets.includes(aspect.planetA.toLowerCase()) || 
          outerPlanets.includes(aspect.planetB.toLowerCase())) {
        score += 3;
      }
    });

    return Math.min(100, score);
  }

  /**
   * Calculate significance of sign changes
   * @param {Array} changes - Sign changes
   * @returns {number} Significance score
   */
  calculateSignChangeSignificance(changes) {
    let score = 0;

    changes.forEach(change => {
      const planetWeights = {
        'saturn': 15,
        'jupiter': 12,
        'mars': 8,
        'venus': 5,
        'mercury': 3
      };

      score += planetWeights[change.planet] || 2;
    });

    return Math.min(100, score);
  }

  /**
   * Analyze a transit and generate prediction
   * @param {Object} transit - Transit data
   * @param {Array} historicalPatterns - Historical patterns
   * @returns {Object|null} Prediction or null
   */
  async analyzeTrend(transit, historicalPatterns) {
    try {
      const predictions = [];

      // Match current transit against historical patterns
      for (const pattern of historicalPatterns) {
        const match = this.matchTransitToPattern(transit, pattern);
        if (match.confidence > 25) {
          predictions.push({
            prediction_date: new Date(),
            target_date_start: transit.date,
            target_date_end: moment(transit.date).add(2, 'weeks').toDate(),
            predicted_category: pattern.category,
            predicted_impact_level: this.predictImpactLevel(match.confidence, pattern.strength),
            confidence_score: match.confidence,
            contributing_patterns: [pattern],
            planetary_config: transit.planetarySnapshot,
            prediction_notes: `Based on ${pattern.category} pattern analysis. ${match.reasoning}`
          });
        }
      }

      // Return the highest confidence prediction
      if (predictions.length > 0) {
        return predictions.sort((a, b) => b.confidence_score - a.confidence_score)[0];
      }

      return null;

    } catch (error) {
      logger.error('Error analyzing trend:', error);
      return null;
    }
  }

  /**
   * Match a transit to a historical pattern
   * @param {Object} transit - Transit data
   * @param {Object} pattern - Historical pattern
   * @returns {Object} Match result with confidence
   */
  matchTransitToPattern(transit, pattern) {
    let confidence = 0;
    let reasoning = '';

    // Check aspects match
    if (transit.type === 'aspect' && transit.details) {
      const aspectPatterns = this.eventPatterns[pattern.category];
      if (aspectPatterns) {
        transit.details.forEach(aspect => {
          // Check for relevant aspect patterns
          const planetA = aspect.planetA?.toLowerCase();
          const planetB = aspect.planetB?.toLowerCase();
          const aspectType = aspect.type;

          // Mars aspects
          if (aspectPatterns.marsAspects && 
              (planetA === 'mars' || planetB === 'mars') &&
              aspectPatterns.marsAspects.includes(aspectType)) {
            confidence += 20;
            reasoning += `Mars ${aspectType} aspect detected. `;
          }

          // Saturn-Pluto aspects (high significance)
          if (aspectPatterns.saturnPlutoAspects &&
              ((planetA === 'saturn' && planetB === 'pluto') || 
               (planetA === 'pluto' && planetB === 'saturn')) &&
              aspectPatterns.saturnPlutoAspects.includes(aspectType)) {
            confidence += 30;
            reasoning += `Saturn-Pluto ${aspectType} - historically significant. `;
          }

          // Jupiter-Saturn aspects
          if (aspectPatterns.jupiterSaturnAspects &&
              ((planetA === 'jupiter' && planetB === 'saturn') || 
               (planetA === 'saturn' && planetB === 'jupiter')) &&
              aspectPatterns.jupiterSaturnAspects.includes(aspectType)) {
            confidence += 25;
            reasoning += `Jupiter-Saturn ${aspectType} - economic implications. `;
          }
        });
      }
    }

    // Check sign positions
    if (transit.planetarySnapshot) {
      const aspectPatterns = this.eventPatterns[pattern.category];
      if (aspectPatterns && aspectPatterns.marsInSigns) {
        const marsSign = transit.planetarySnapshot.mars?.sign;
        if (marsSign && aspectPatterns.marsInSigns.includes(marsSign)) {
          confidence += 15;
          reasoning += `Mars in ${marsSign} - matches ${pattern.category} pattern. `;
        }
      }
    }

    // Boost confidence based on historical pattern strength
    confidence = confidence * (1 + pattern.strength);

    return {
      confidence: Math.min(95, confidence),
      reasoning: reasoning || 'General astrological correlation.'
    };
  }

  /**
   * Predict impact level based on confidence and pattern strength
   * @param {number} confidence - Confidence score
   * @param {number} patternStrength - Pattern strength
   * @returns {string} Impact level
   */
  predictImpactLevel(confidence, patternStrength) {
    const score = confidence * patternStrength;
    
    if (score >= 70) return 'extreme';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Get all stored predictions
   * @param {Object} filters - Filter options
   * @returns {Array} Array of predictions
   */
  async getPredictions(filters = {}) {
    try {
      let query = supabase
        .from('future_predictions')
        .select('*')
        .order('confidence_score', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('predicted_category', filters.category);
      }

      if (filters.impact_level) {
        query = query.eq('predicted_impact_level', filters.impact_level);
      }

      if (filters.min_confidence) {
        query = query.gte('confidence_score', filters.min_confidence);
      }

      if (filters.date_from) {
        query = query.gte('target_date_start', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('target_date_end', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      logger.error('Error getting predictions:', error);
      throw error;
    }
  }

  /**
   * Update prediction accuracy after events occur
   * @param {string} predictionId - Prediction ID
   * @param {boolean} wasAccurate - Whether prediction was accurate
   * @param {Array} actualEvents - Array of actual event IDs
   * @param {string} notes - Accuracy notes
   */
  async updatePredictionAccuracy(predictionId, wasAccurate, actualEvents = [], notes = '') {
    try {
      const { data, error } = await supabase
        .from('future_predictions')
        .update({
          was_accurate: wasAccurate,
          actual_events: actualEvents,
          accuracy_notes: notes,
          updated_at: new Date()
        })
        .eq('id', predictionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info(`✅ Updated prediction accuracy for ${predictionId}: ${wasAccurate ? 'accurate' : 'inaccurate'}`);
      return data;

    } catch (error) {
      logger.error('Error updating prediction accuracy:', error);
      throw error;
    }
  }
}

module.exports = new PredictionService();
