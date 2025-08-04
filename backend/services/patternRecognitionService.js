const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

class PatternRecognitionService {
  /**
   * Analyze planetary patterns in historical events
   * @param {Object} options - Analysis options
   * @returns {Object} Pattern analysis results
   */
  async analyzePatterns(options = {}) {
    try {
      logger.info('🔍 Starting pattern analysis...');
      
      const filters = {
        impact_level: options.impact_level || 'high',
        category: options.category,
        start_date: options.start_date,
        end_date: options.end_date,
        limit: options.limit || 100
      };

      // Get high-impact events with their planetary data
      const events = await this.getEventsForAnalysis(filters);
      
      if (!events || events.length === 0) {
        logger.warn('No events found for pattern analysis');
        return { patterns: [], message: 'No events found' };
      }

      logger.info(`📊 Analyzing ${events.length} events for patterns`);

      // Analyze different types of patterns
      const planetarySignPatterns = this.analyzePlanetarySignPatterns(events);
      const aspectPatterns = await this.analyzeAspectPatterns(events);
      const nakshatraPatterns = this.analyzeNakshatraPatterns(events);
      const combinedPatterns = this.analyzeCombinedPatterns(events);

      const analysis = {
        total_events_analyzed: events.length,
        analysis_filters: filters,
        patterns: {
          planetary_signs: planetarySignPatterns,
          aspects: aspectPatterns,
          nakshatras: nakshatraPatterns,
          combined: combinedPatterns
        },
        timestamp: new Date().toISOString()
      };

      // Store significant patterns in database
      await this.storeSignificantPatterns(analysis.patterns);

      logger.info(`✅ Pattern analysis completed. Found ${Object.keys(analysis.patterns).length} pattern types`);
      
      return analysis;

    } catch (error) {
      logger.error('Error in pattern analysis:', error);
      throw error;
    }
  }

  /**
   * Get events for pattern analysis
   * @param {Object} filters - Event filters
   * @returns {Array} Events with planetary data
   */
  async getEventsForAnalysis(filters) {
    try {
      // Check if tables exist by attempting queries with error handling
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        logger.warn('Required tables do not exist. Returning empty result.');
        return [];
      }

      // Get events with basic filters - only from world_events table
      let eventQuery = supabase.from('world_events').select('*');

      // Apply filters
      if (filters.impact_level) {
        eventQuery = eventQuery.eq('impact_level', filters.impact_level);
      }
      
      if (filters.category) {
        eventQuery = eventQuery.eq('category', filters.category);
      }
      
      if (filters.start_date) {
        eventQuery = eventQuery.gte('event_date', filters.start_date);
      }
      
      if (filters.end_date) {
        eventQuery = eventQuery.lte('event_date', filters.end_date);
      }

      const limit = filters.limit || 100;
      eventQuery = eventQuery.order('event_date', { ascending: false }).limit(limit);

      const { data: events, error: eventsError } = await eventQuery;

      if (eventsError) {
        logger.error('Error fetching events for analysis:', eventsError);
        throw eventsError;
      }

      if (!events || events.length === 0) {
        return [];
      }

      // Process the data directly from world_events table
      const eventsWithData = events.map(event => {
        // Convert planetary_snapshot to transit format for analysis
        const eventTransits = event.planetary_snapshot ? [this.convertSnapshotToTransitFormat(event.planetary_snapshot)] : [];
        
        // Extract aspects from planetary_snapshot.aspects (JSONB array)
        let eventAspects = [];
        if (event.planetary_snapshot && event.planetary_snapshot.aspects) {
          eventAspects = event.planetary_snapshot.aspects;
        }

        return {
          ...event,
          planetary_transits: eventTransits,
          planetary_aspects: eventAspects
        };
      });

      return eventsWithData;
    } catch (error) {
      logger.error('Error in getEventsForAnalysis:', error);
      throw error;
    }
  }

  /**
   * Convert planetary_snapshot format to transit format expected by pattern analysis
   * @param {Object} snapshot - Planetary snapshot from world_events
   * @returns {Object} Transit format data
   */
  convertSnapshotToTransitFormat(snapshot) {
    const transit = {};
    const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    
    planets.forEach(planet => {
      if (snapshot[planet]) {
        // Parse format like "Gemini 18.08°" or "Libra 1.08° (Chitra)"
        const planetData = snapshot[planet];
        const signMatch = planetData.match(/^([A-Za-z]+)\s+([0-9.]+)°/);
        const nakshatraMatch = planetData.match(/\(([^)]+)\)/);
        
        if (signMatch) {
          transit[`${planet}_sign`] = signMatch[1];
          transit[`${planet}_degree_in_sign`] = parseFloat(signMatch[2]);
        }
        
        if (nakshatraMatch) {
          transit[`${planet}_nakshatra`] = nakshatraMatch[1];
        }
      }
    });
    
    return transit;
  }

  /**
   * Check if required tables exist
   * @returns {boolean} True if tables exist
   */
  async checkTablesExist() {
    try {
      // Only check world_events table since we're using planetary_snapshot from there
      const { error } = await supabase
        .from('world_events')
        .select('count', { count: 'exact', head: true });
        
      if (error) {
        logger.warn('world_events table not accessible:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.warn('Error checking tables:', error.message);
      return false;
    }
  }

  /**
   * Analyze planetary sign patterns
   * @param {Array} events - Events to analyze
   * @returns {Object} Planetary sign pattern analysis
   */
  analyzePlanetarySignPatterns(events) {
    const patterns = {};
    const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    
    planets.forEach(planet => {
      const signCounts = {};
      
      events.forEach(event => {
        if (event.planetary_transits && event.planetary_transits.length > 0) {
          const transit = event.planetary_transits[0];
          const sign = transit[`${planet}_sign`];
          
          if (sign) {
            signCounts[sign] = (signCounts[sign] || 0) + 1;
          }
        }
      });

      // Calculate percentages and significance
      const totalEvents = events.length;
      const signPatterns = Object.entries(signCounts)
        .map(([sign, count]) => ({
          sign,
          occurrences: count,
          percentage: ((count / totalEvents) * 100).toFixed(2),
          significance: this.calculateSignificance(count, totalEvents, 12) // 12 signs
        }))
        .sort((a, b) => b.occurrences - a.occurrences);

      patterns[planet] = {
        total_events: totalEvents,
        patterns: signPatterns.slice(0, 5), // Top 5 most common
        most_significant: signPatterns.filter(p => p.significance > 0.5).slice(0, 3) // Lowered threshold
      };
    });

    return patterns;
  }

  /**
   * Analyze aspect patterns from stored aspect data
   * @param {Array} events - Events to analyze
   * @returns {Object} Aspect pattern analysis
   */
  async analyzeAspectPatterns(events) {
    try {
      const aspectCounts = {};
      const planetPairCounts = {};
      
      events.forEach(event => {
        if (event.planetary_aspects && event.planetary_aspects.length > 0) {
          event.planetary_aspects.forEach(aspect => {
            // Count aspect types from JSONB structure
            const aspectType = aspect.aspectType; // Note: using aspectType from JSONB structure
            aspectCounts[aspectType] = (aspectCounts[aspectType] || 0) + 1;
            
            // Count planet pairs from JSONB structure
            if (aspect.fromPlanet && aspect.toPlanet) {
              const planetPair = `${aspect.fromPlanet}-${aspect.toPlanet}`;
              const reversePair = `${aspect.toPlanet}-${aspect.fromPlanet}`;
              const normalizedPair = planetPair < reversePair ? planetPair : reversePair;
              
              if (!planetPairCounts[normalizedPair]) {
                planetPairCounts[normalizedPair] = {};
              }
              planetPairCounts[normalizedPair][aspectType] = 
                (planetPairCounts[normalizedPair][aspectType] || 0) + 1;
            }
          });
        }
      });

      const totalEvents = events.length;
      
      // Most common aspect types
      const aspectTypePatterns = Object.entries(aspectCounts)
        .map(([type, count]) => ({
          aspect_type: type,
          occurrences: count,
          percentage: ((count / totalEvents) * 100).toFixed(2)
        }))
        .sort((a, b) => b.occurrences - a.occurrences);

      // Most significant planet pair combinations
      const planetPairPatterns = Object.entries(planetPairCounts)
        .map(([pair, aspects]) => {
          const totalAspects = Object.values(aspects).reduce((sum, count) => sum + count, 0);
          return {
            planet_pair: pair,
            total_aspects: totalAspects,
            aspect_breakdown: aspects,
            significance: this.calculateSignificance(totalAspects, totalEvents, 36) // 9 planets = 36 pairs
          };
        })
        .filter(p => p.significance > 1.2)
        .sort((a, b) => b.total_aspects - a.total_aspects)
        .slice(0, 10);

      return {
        total_events: totalEvents,
        aspect_types: aspectTypePatterns,
        significant_planet_pairs: planetPairPatterns
      };

    } catch (error) {
      logger.error('Error analyzing aspect patterns:', error);
      return { error: error.message };
    }
  }

  /**
   * Analyze nakshatra patterns
   * @param {Array} events - Events to analyze
   * @returns {Object} Nakshatra pattern analysis
   */
  analyzeNakshatraPatterns(events) {
    const patterns = {};
    const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    
    planets.forEach(planet => {
      const nakshatraCounts = {};
      
      events.forEach(event => {
        if (event.planetary_transits && event.planetary_transits.length > 0) {
          const transit = event.planetary_transits[0];
          const nakshatra = transit[`${planet}_nakshatra`];
          
          if (nakshatra) {
            nakshatraCounts[nakshatra] = (nakshatraCounts[nakshatra] || 0) + 1;
          }
        }
      });

      const totalEvents = events.length;
      const nakshatraPatterns = Object.entries(nakshatraCounts)
        .map(([nakshatra, count]) => ({
          nakshatra,
          occurrences: count,
          percentage: ((count / totalEvents) * 100).toFixed(2),
          significance: this.calculateSignificance(count, totalEvents, 27) // 27 nakshatras
        }))
        .sort((a, b) => b.occurrences - a.occurrences);

      patterns[planet] = {
        total_events: totalEvents,
        patterns: nakshatraPatterns.slice(0, 5),
        most_significant: nakshatraPatterns.filter(p => p.significance > 1.5).slice(0, 3)
      };
    });

    return patterns;
  }

  /**
   * Analyze combined patterns (multiple factors together)
   * @param {Array} events - Events to analyze
   * @returns {Object} Combined pattern analysis
   */
  analyzeCombinedPatterns(events) {
    const combinations = {};
    
    events.forEach(event => {
      if (event.planetary_transits && event.planetary_transits.length > 0) {
        const transit = event.planetary_transits[0];
        
        // Sun-Moon sign combinations
        const sunMoonCombo = `${transit.sun_sign}-${transit.moon_sign}`;
        combinations[`sun_moon_${sunMoonCombo}`] = (combinations[`sun_moon_${sunMoonCombo}`] || 0) + 1;
        
        // Mars-Saturn combinations (conflict indicators)
        const marsSaturnCombo = `${transit.mars_sign}-${transit.saturn_sign}`;
        combinations[`mars_saturn_${marsSaturnCombo}`] = (combinations[`mars_saturn_${marsSaturnCombo}`] || 0) + 1;
        
        // Jupiter-Saturn combinations (economic indicators)
        const jupiterSaturnCombo = `${transit.jupiter_sign}-${transit.saturn_sign}`;
        combinations[`jupiter_saturn_${jupiterSaturnCombo}`] = (combinations[`jupiter_saturn_${jupiterSaturnCombo}`] || 0) + 1;
      }
    });

    const totalEvents = events.length;
    
    return Object.entries(combinations)
      .map(([combo, count]) => ({
        combination: combo,
        occurrences: count,
        percentage: ((count / totalEvents) * 100).toFixed(2),
        significance: this.calculateSignificance(count, totalEvents, 144) // 12x12 combinations
      }))
      .filter(p => p.occurrences >= 2) // At least 2 occurrences
      .sort((a, b) => b.significance - a.significance)
      .slice(0, 20);
  }

  /**
   * Calculate statistical significance of a pattern
   * @param {number} observed - Observed occurrences
   * @param {number} total - Total events
   * @param {number} expectedDivisions - Expected number of divisions (e.g., 12 for signs)
   * @returns {number} Significance score
   */
  calculateSignificance(observed, total, expectedDivisions) {
    const expected = total / expectedDivisions;
    const chisquare = Math.pow(observed - expected, 2) / expected;
    return parseFloat(chisquare.toFixed(2));
  }

  /**
   * Store significant patterns in database
   * @param {Object} patterns - Analyzed patterns
   */
  async storeSignificantPatterns(patterns) {
    try {
      const patternsToStore = [];

      // Store planetary sign patterns
      if (patterns.planetary_signs) {
        Object.entries(patterns.planetary_signs).forEach(([planet, data]) => {
          data.most_significant?.forEach(pattern => {
            if (pattern.significance > 1.0) { // Lowered storage threshold
              patternsToStore.push({
                pattern_name: `${planet}_in_${pattern.sign}`,
                description: `${planet.toUpperCase()} in ${pattern.sign} appears in ${pattern.percentage}% of high-impact events`,
                pattern_type: 'planetary',
                pattern_conditions: {
                  planet: planet,
                  sign: pattern.sign,
                  significance: pattern.significance
                },
                total_occurrences: pattern.occurrences,
                success_rate: parseFloat(pattern.percentage)
              });
            }
          });
        });
      }

      // Store aspect patterns
      if (patterns.aspects?.significant_planet_pairs) {
        patterns.aspects.significant_planet_pairs.forEach(pattern => {
          if (pattern.significance > 2.0) {
            patternsToStore.push({
              pattern_name: `${pattern.planet_pair}_aspects`,
              description: `${pattern.planet_pair} aspects appear in ${pattern.total_aspects} high-impact events`,
              pattern_type: 'aspect',
              pattern_conditions: {
                planet_pair: pattern.planet_pair,
                aspects: pattern.aspect_breakdown,
                significance: pattern.significance
              },
              total_occurrences: pattern.total_aspects,
              success_rate: ((pattern.total_aspects / patterns.aspects.total_events) * 100)
            });
          }
        });
      }

      // Insert patterns (ignore duplicates)
      if (patternsToStore.length > 0) {
        const { error } = await supabase
          .from('astrological_patterns')
          .upsert(patternsToStore, { 
            onConflict: 'pattern_name',
            ignoreDuplicates: false 
          });

        if (error) {
          logger.error('Error storing patterns:', error);
        } else {
          logger.info(`✅ Stored ${patternsToStore.length} significant patterns`);
        }
      }

    } catch (error) {
      logger.error('Error storing significant patterns:', error);
    }
  }

  /**
   * Find current planetary configuration and match against known patterns
   * @param {Object} currentTransits - Current planetary positions
   * @returns {Array} Matching patterns with risk levels
   */
  async findMatchingPatterns(currentTransits) {
    try {
      logger.info('🔮 Finding patterns matching current transits');

      // Get all stored patterns
      const { data: storedPatterns, error } = await supabase
        .from('astrological_patterns')
        .select('*')
        .gte('success_rate', 10) // At least 10% success rate
        .order('success_rate', { ascending: false });

      if (error) {
        logger.error('Error fetching stored patterns:', error);
        throw error;
      }

      const matches = [];

      storedPatterns.forEach(pattern => {
        const matchStrength = this.calculatePatternMatch(currentTransits, pattern);
        
        if (matchStrength > 0) {
          matches.push({
            pattern_name: pattern.pattern_name,
            pattern_type: pattern.pattern_type,
            description: pattern.description,
            match_strength: matchStrength,
            success_rate: pattern.success_rate,
            total_occurrences: pattern.total_occurrences,
            risk_level: this.calculateRiskLevel(matchStrength, pattern.success_rate)
          });
        }
      });

      // Sort by risk level and match strength
      matches.sort((a, b) => (b.risk_level * b.match_strength) - (a.risk_level * a.match_strength));

      logger.info(`✅ Found ${matches.length} matching patterns`);
      return matches.slice(0, 10); // Top 10 matches

    } catch (error) {
      logger.error('Error finding matching patterns:', error);
      throw error;
    }
  }

  /**
   * Calculate how well current transits match a stored pattern
   * @param {Object} currentTransits - Current planetary positions
   * @param {Object} pattern - Stored pattern
   * @returns {number} Match strength (0-100)
   */
  calculatePatternMatch(currentTransits, pattern) {
    const conditions = pattern.pattern_conditions;
    
    if (pattern.pattern_type === 'planetary') {
      const planet = conditions.planet;
      const requiredSign = conditions.sign;
      const currentSign = currentTransits[`${planet}_sign`];
      
      return currentSign === requiredSign ? 100 : 0;
    }
    
    if (pattern.pattern_type === 'aspect') {
      // This would require current aspect calculations
      // For now, return 0 as placeholder
      return 0;
    }
    
    return 0;
  }

  /**
   * Calculate risk level based on match strength and success rate
   * @param {number} matchStrength - How well pattern matches (0-100)
   * @param {number} successRate - Historical success rate (0-100)
   * @returns {number} Risk level (0-10)
   */
  calculateRiskLevel(matchStrength, successRate) {
    const normalizedMatch = matchStrength / 100;
    const normalizedSuccess = successRate / 100;
    
    return Math.round((normalizedMatch * normalizedSuccess) * 10 * 100) / 100;
  }

  /**
   * Generate future predictions based on upcoming transits
   * @param {Object} upcomingTransits - Upcoming planetary positions
   * @param {Object} options - Prediction options
   * @returns {Array} Predictions
   */
  async generatePredictions(upcomingTransits, options = {}) {
    try {
      logger.info('🔮 Generating future predictions');
      
      const predictions = [];
      const targetDateStart = new Date(options.target_date_start || Date.now());
      const targetDateEnd = new Date(options.target_date_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days

      // Find matching patterns for upcoming transits
      const matchingPatterns = await this.findMatchingPatterns(upcomingTransits);
      
      // Generate predictions based on top matches
      matchingPatterns.slice(0, 5).forEach((match, index) => {
        if (match.risk_level > 3) { // Only predict for significant risks
          predictions.push({
            prediction_date: new Date().toISOString(),
            target_date_start: targetDateStart.toISOString(),
            target_date_end: targetDateEnd.toISOString(),
            predicted_category: this.inferCategoryFromPattern(match.pattern_name),
            predicted_impact_level: this.inferImpactFromRisk(match.risk_level),
            confidence_score: Math.min(95, match.risk_level * 10),
            contributing_patterns: [match],
            planetary_config: upcomingTransits,
            prediction_notes: `Based on pattern: ${match.description}`
          });
        }
      });

      // Store predictions in database
      if (predictions.length > 0) {
        const { error } = await supabase
          .from('future_predictions')
          .insert(predictions);

        if (error) {
          logger.error('Error storing predictions:', error);
        } else {
          logger.info(`✅ Generated and stored ${predictions.length} predictions`);
        }
      }

      return predictions;

    } catch (error) {
      logger.error('Error generating predictions:', error);
      throw error;
    }
  }

  /**
   * Infer event category from pattern name
   * @param {string} patternName - Pattern name
   * @returns {string} Inferred category
   */
  inferCategoryFromPattern(patternName) {
    const lowerPattern = patternName.toLowerCase();
    
    if (lowerPattern.includes('mars') || lowerPattern.includes('saturn')) {
      return 'political';
    }
    if (lowerPattern.includes('jupiter')) {
      return 'financial';
    }
    if (lowerPattern.includes('moon') || lowerPattern.includes('rahu')) {
      return 'social';
    }
    
    return 'other';
  }

  /**
   * Infer impact level from risk score
   * @param {number} riskLevel - Risk level (0-10)
   * @returns {string} Impact level
   */
  inferImpactFromRisk(riskLevel) {
    if (riskLevel >= 8) return 'extreme';
    if (riskLevel >= 6) return 'high';
    if (riskLevel >= 4) return 'medium';
    return 'low';
  }

  /**
   * Get statistics about discovered patterns for ML training
   * @returns {Object} Pattern statistics
   */
  async getPatternStatistics() {
    try {
      logger.info('📊 Getting pattern statistics for ML training');

      // Get total pattern count
      const { data: allPatterns, error: allPatternsError } = await supabase
        .from('astrological_patterns')
        .select('*');

      if (allPatternsError) {
        throw allPatternsError;
      }

      // Get pattern counts by type
      const patternsByType = {};
      const patternsBySuccessRate = { low: 0, medium: 0, high: 0, extreme: 0 };
      const recentPatterns = [];
      
      allPatterns.forEach(pattern => {
        // Count by type
        const type = pattern.pattern_type || 'unknown';
        patternsByType[type] = (patternsByType[type] || 0) + 1;
        
        // Count by success rate ranges
        const successRate = pattern.success_rate || 0;
        if (successRate >= 80) patternsBySuccessRate.extreme++;
        else if (successRate >= 60) patternsBySuccessRate.high++;
        else if (successRate >= 30) patternsBySuccessRate.medium++;
        else patternsBySuccessRate.low++;
        
        // Collect recent patterns (last 30 days)
        const createdAt = new Date(pattern.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (createdAt > thirtyDaysAgo) {
          recentPatterns.push(pattern);
        }
      });

      // Get top performing patterns
      const topPatterns = allPatterns
        .sort((a, b) => (b.success_rate * b.total_occurrences) - (a.success_rate * a.total_occurrences))
        .slice(0, 10)
        .map(pattern => ({
          name: pattern.pattern_name,
          type: pattern.pattern_type,
          success_rate: pattern.success_rate,
          occurrences: pattern.total_occurrences,
          score: pattern.success_rate * pattern.total_occurrences
        }));

      // Get distribution of success rates
      const successRateDistribution = allPatterns.reduce((acc, pattern) => {
        const rate = Math.floor(pattern.success_rate / 10) * 10;
        const bucket = `${rate}-${rate + 9}%`;
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
      }, {});

      const statistics = {
        summary: {
          total_patterns: allPatterns.length,
          patterns_by_type: patternsByType,
          patterns_by_success_rate: patternsBySuccessRate,
          recent_patterns_count: recentPatterns.length,
          avg_success_rate: allPatterns.length > 0 
            ? (allPatterns.reduce((sum, p) => sum + p.success_rate, 0) / allPatterns.length).toFixed(2)
            : 0,
          avg_occurrences: allPatterns.length > 0
            ? (allPatterns.reduce((sum, p) => sum + p.total_occurrences, 0) / allPatterns.length).toFixed(2)
            : 0
        },
        top_patterns: topPatterns,
        success_rate_distribution: successRateDistribution,
        ml_readiness: {
          sufficient_data: allPatterns.length >= 50,
          diverse_patterns: Object.keys(patternsByType).length >= 2,
          quality_patterns: allPatterns.filter(p => p.success_rate >= 30).length,
          recommendation: this.getMLReadinessRecommendation(allPatterns)
        },
        data_quality: {
          patterns_with_conditions: allPatterns.filter(p => p.pattern_conditions).length,
          patterns_with_descriptions: allPatterns.filter(p => p.description).length,
          complete_patterns: allPatterns.filter(p => 
            p.pattern_conditions && p.description && p.success_rate > 0
          ).length
        },
        timestamp: new Date().toISOString()
      };

      logger.info(`✅ Pattern statistics generated: ${statistics.summary.total_patterns} total patterns`);
      return statistics;

    } catch (error) {
      logger.error('Error getting pattern statistics:', error);
      throw error;
    }
  }

  /**
   * Get ML readiness recommendation based on pattern data
   * @param {Array} patterns - All patterns
   * @returns {string} Recommendation
   */
  getMLReadinessRecommendation(patterns) {
    const totalPatterns = patterns.length;
    const qualityPatterns = patterns.filter(p => p.success_rate >= 30).length;
    const diverseTypes = new Set(patterns.map(p => p.pattern_type)).size;
    
    if (totalPatterns < 20) {
      return 'Insufficient data - need at least 20 patterns for basic ML training';
    }
    
    if (qualityPatterns < 10) {
      return 'Need more quality patterns (30%+ success rate) - run more pattern analysis';
    }
    
    if (diverseTypes < 2) {
      return 'Need more diverse pattern types - analyze different astrological factors';
    }
    
    if (totalPatterns >= 100 && qualityPatterns >= 30) {
      return 'Excellent - ready for advanced ML training with neural networks';
    }
    
    if (totalPatterns >= 50 && qualityPatterns >= 15) {
      return 'Good - ready for ML training with ensemble methods';
    }
    
    return 'Ready for basic ML training - consider gathering more data for better accuracy';
  }
}

module.exports = new PatternRecognitionService();
