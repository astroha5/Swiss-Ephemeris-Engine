const { supabase, sql } = require('../config/supabase');
const logger = require('../utils/logger');

class PlanetaryPatternExtractorService {
  constructor() {
    // Define different types of patterns we can extract
    this.patternTypes = {
      DEGREE_SPECIFIC: 'degree_specific',
      ASPECT_PATTERN: 'aspect_pattern', 
      NAKSHATRA_PATTERN: 'nakshatra_pattern',
      SIGN_PATTERN: 'sign_pattern',
      HOUSE_PATTERN: 'house_pattern',
      COMBINED_PATTERN: 'combined_pattern'
    };

    // Critical degrees that are often significant
    this.criticalDegrees = [
      { degree: 0, name: 'Zero Degree - New Beginnings' },
      { degree: 13, name: 'Aries 13° - Critical Degree' },
      { degree: 26, name: 'Taurus 26° - Fixed Critical' },
      { degree: 9, name: 'Gemini 9° - Mutable Critical' },
      { degree: 21, name: 'Cancer 21° - Cardinal Critical' },
      { degree: 4, name: 'Leo 4° - Fixed Critical' },
      { degree: 17, name: 'Virgo 17° - Mutable Critical' },
      { degree: 29, name: 'Anaretic Degree - Completion' }
    ];

    // Significant nakshatras for different event types
    this.significantNakshatras = {
      financial: ['Rohini', 'Uttara Phalguni', 'Chitra', 'Jyeshtha', 'Uttara Ashadha'],
      war: ['Bharani', 'Magha', 'Vishakha', 'Jyeshtha', 'Mula'],
      natural_disaster: ['Ardra', 'Ashlesha', 'Moola', 'Revati'],
      political: ['Magha', 'Swati', 'Anuradha', 'Pushya'],
      pandemic: ['Ashlesha', 'Ardra', 'Shatabhisha', 'Revati']
    };
  }

  /**
   * Extract all types of planetary patterns from historical events
   * @param {Object} options - Analysis options
   * @returns {Object} Comprehensive pattern analysis
   */
  async extractPlanetaryPatterns(options = {}) {
    try {
      logger.info('🎯 Starting comprehensive planetary pattern extraction...');
      
      const filters = {
        impact_level: options.impact_level || ['high', 'extreme'],
        category: options.category,
        start_date: options.start_date || '1900-01-01',
        end_date: options.end_date || new Date().toISOString(),
        min_events: options.min_events || 3 // Minimum events needed to establish a pattern
      };

      // Get historical events with planetary data
      const events = await this.getEventsForPatternAnalysis(filters);
      
      if (!events || events.length < filters.min_events) {
        logger.warn(`Insufficient events for pattern analysis: ${events?.length || 0}`);
        return { patterns: [], message: `Need at least ${filters.min_events} events` };
      }

      logger.info(`📊 Analyzing ${events.length} events for planetary patterns`);

      // Extract different types of patterns
      const patterns = {
        degree_specific: await this.extractDegreeSpecificPatterns(events),
        aspects: await this.extractAspectPatterns(events),
        nakshatras: await this.extractNakshatraPatterns(events),
        signs: await this.extractSignPatterns(events),
        houses: await this.extractHousePatterns(events),
        combined: await this.extractCombinedPatterns(events)
      };

      // Store significant patterns in database
      const storedPatterns = await this.storeExtractedPatterns(patterns, filters);

      const analysis = {
        total_events_analyzed: events.length,
        analysis_filters: filters,
        patterns: patterns,
        stored_patterns: storedPatterns.length,
        extraction_timestamp: new Date().toISOString(),
        pattern_statistics: this.calculatePatternStatistics(patterns)
      };

      logger.info(`✅ Pattern extraction completed. Found ${storedPatterns.length} significant patterns`);
      return analysis;

    } catch (error) {
      logger.error('Error in planetary pattern extraction:', error);
      throw error;
    }
  }

  /**
   * Extract degree-specific patterns (planets at specific degrees during events)
   * @param {Array} events - Historical events with planetary data
   * @returns {Object} Degree-specific pattern analysis
   */
  async extractDegreeSpecificPatterns(events) {
    try {
      const degreePatterns = {};
      const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

      planets.forEach(planet => {
        const degreeData = {};
        
        events.forEach(event => {
          if (event.planetary_transits && event.planetary_transits.length > 0) {
            const transit = event.planetary_transits[0];
            const longitude = transit[`${planet}_longitude`];
            const sign = transit[`${planet}_sign`];
            const degreeInSign = transit[`${planet}_degree_in_sign`];
            
            if (longitude !== null && degreeInSign !== null) {
              // Round to nearest degree for pattern recognition
              const roundedDegree = Math.round(degreeInSign);
              const key = `${sign}_${roundedDegree}`;
              
              if (!degreeData[key]) {
                degreeData[key] = {
                  sign: sign,
                  degree: roundedDegree,
                  occurrences: 0,
                  events: [],
                  is_critical: this.isCriticalDegree(roundedDegree),
                  absolute_longitude: longitude
                };
              }
              
              degreeData[key].occurrences++;
              degreeData[key].events.push({
                id: event.id,
                title: event.title,
                date: event.event_date,
                category: event.category,
                impact_level: event.impact_level
              });
            }
          }
        });

        // Find significant degree patterns (appearing in 3+ events)
        const significantPatterns = Object.entries(degreeData)
          .filter(([key, data]) => data.occurrences >= 3)
          .map(([key, data]) => ({
            ...data,
            significance_score: this.calculateDegreeSignificance(data, events.length),
            pattern_strength: (data.occurrences / events.length) * 100
          }))
          .sort((a, b) => b.significance_score - a.significance_score);

        degreePatterns[planet] = {
          total_patterns: significantPatterns.length,
          patterns: significantPatterns,
          most_significant: significantPatterns.slice(0, 5)
        };
      });

      return degreePatterns;
    } catch (error) {
      logger.error('Error extracting degree-specific patterns:', error);
      return {};
    }
  }

  /**
   * Extract aspect patterns between planets
   * @param {Array} events - Historical events
   * @returns {Object} Aspect pattern analysis
   */
  async extractAspectPatterns(events) {
    try {
      const aspectPatterns = {};
      const aspectTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx'];
      
      // Group aspects by type and planet pairs
      aspectTypes.forEach(aspectType => {
        const planetPairPatterns = {};
        
        events.forEach(event => {
          if (event.planetary_aspects && event.planetary_aspects.length > 0) {
            event.planetary_aspects
              .filter(aspect => aspect.aspect_type === aspectType)
              .forEach(aspect => {
                const pairKey = this.normalizePlanetPair(aspect.planet_a, aspect.planet_b);
                
                if (!planetPairPatterns[pairKey]) {
                  planetPairPatterns[pairKey] = {
                    planet_a: aspect.planet_a,
                    planet_b: aspect.planet_b,
                    aspect_type: aspectType,
                    occurrences: 0,
                    events: [],
                    average_orb: 0,
                    orb_sum: 0,
                    strength_scores: []
                  };
                }
                
                planetPairPatterns[pairKey].occurrences++;
                planetPairPatterns[pairKey].orb_sum += aspect.orb_degrees;
                planetPairPatterns[pairKey].strength_scores.push(aspect.strength_score || 5);
                planetPairPatterns[pairKey].events.push({
                  id: event.id,
                  title: event.title,
                  date: event.event_date,
                  category: event.category,
                  orb: aspect.orb_degrees
                });
              });
          }
        });

        // Calculate averages and significance
        Object.values(planetPairPatterns).forEach(pattern => {
          pattern.average_orb = pattern.orb_sum / pattern.occurrences;
          pattern.average_strength = pattern.strength_scores.reduce((a, b) => a + b, 0) / pattern.strength_scores.length;
          pattern.significance_score = this.calculateAspectSignificance(pattern, events.length);
        });

        // Filter significant patterns (3+ occurrences)
        const significantPatterns = Object.values(planetPairPatterns)
          .filter(pattern => pattern.occurrences >= 3)
          .sort((a, b) => b.significance_score - a.significance_score);

        aspectPatterns[aspectType] = {
          total_patterns: significantPatterns.length,
          patterns: significantPatterns,
          most_significant: significantPatterns.slice(0, 10)
        };
      });

      return aspectPatterns;
    } catch (error) {
      logger.error('Error extracting aspect patterns:', error);
      return {};
    }
  }

  /**
   * Extract nakshatra patterns for different event categories
   * @param {Array} events - Historical events
   * @returns {Object} Nakshatra pattern analysis
   */
  async extractNakshatraPatterns(events) {
    try {
      const nakshatraPatterns = {};
      const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
      
      // Group events by category first
      const eventsByCategory = {};
      events.forEach(event => {
        if (!eventsByCategory[event.category]) {
          eventsByCategory[event.category] = [];
        }
        eventsByCategory[event.category].push(event);
      });

      // Analyze nakshatra patterns for each planet and category
      planets.forEach(planet => {
        nakshatraPatterns[planet] = {};
        
        Object.entries(eventsByCategory).forEach(([category, categoryEvents]) => {
          const nakshatraData = {};
          
          categoryEvents.forEach(event => {
            if (event.planetary_transits && event.planetary_transits.length > 0) {
              const transit = event.planetary_transits[0];
              const nakshatra = transit[`${planet}_nakshatra`];
              
              if (nakshatra) {
                if (!nakshatraData[nakshatra]) {
                  nakshatraData[nakshatra] = {
                    nakshatra: nakshatra,
                    occurrences: 0,
                    events: [],
                    is_significant: this.isSignificantNakshatra(nakshatra, category)
                  };
                }
                
                nakshatraData[nakshatra].occurrences++;
                nakshatraData[nakshatra].events.push({
                  id: event.id,
                  title: event.title,
                  date: event.event_date,
                  impact_level: event.impact_level
                });
              }
            }
          });

          // Calculate significance and filter patterns
          const significantPatterns = Object.values(nakshatraData)
            .filter(pattern => pattern.occurrences >= 2) // Lower threshold for nakshatras
            .map(pattern => ({
              ...pattern,
              frequency_percentage: (pattern.occurrences / categoryEvents.length) * 100,
              significance_score: this.calculateNakshatraSignificance(pattern, categoryEvents.length, category)
            }))
            .sort((a, b) => b.significance_score - a.significance_score);

          if (significantPatterns.length > 0) {
            nakshatraPatterns[planet][category] = {
              total_events: categoryEvents.length,
              patterns: significantPatterns,
              most_significant: significantPatterns.slice(0, 5)
            };
          }
        });
      });

      return nakshatraPatterns;
    } catch (error) {
      logger.error('Error extracting nakshatra patterns:', error);
      return {};
    }
  }

  /**
   * Extract sign patterns (planets in specific signs during events)
   * @param {Array} events - Historical events
   * @returns {Object} Sign pattern analysis
   */
  async extractSignPatterns(events) {
    try {
      const signPatterns = {};
      const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
      
      planets.forEach(planet => {
        const signData = {};
        
        events.forEach(event => {
          if (event.planetary_transits && event.planetary_transits.length > 0) {
            const transit = event.planetary_transits[0];
            const sign = transit[`${planet}_sign`];
            
            if (sign) {
              if (!signData[sign]) {
                signData[sign] = {
                  sign: sign,
                  occurrences: 0,
                  events: [],
                  impact_levels: { low: 0, medium: 0, high: 0, extreme: 0 },
                  categories: {}
                };
              }
              
              signData[sign].occurrences++;
              signData[sign].impact_levels[event.impact_level]++;
              
              if (!signData[sign].categories[event.category]) {
                signData[sign].categories[event.category] = 0;
              }
              signData[sign].categories[event.category]++;
              
              signData[sign].events.push({
                id: event.id,
                title: event.title,
                date: event.event_date,
                category: event.category,
                impact_level: event.impact_level
              });
            }
          }
        });

        // Calculate statistical significance
        const totalEvents = events.length;
        const expectedFrequency = totalEvents / 12; // Equal distribution across 12 signs
        
        const significantPatterns = Object.values(signData)
          .map(pattern => ({
            ...pattern,
            frequency_percentage: (pattern.occurrences / totalEvents) * 100,
            expected_frequency: expectedFrequency,
            deviation_from_expected: pattern.occurrences - expectedFrequency,
            significance_score: this.calculateSignSignificance(pattern, totalEvents),
            high_impact_ratio: (pattern.impact_levels.high + pattern.impact_levels.extreme) / pattern.occurrences
          }))
          .filter(pattern => Math.abs(pattern.deviation_from_expected) > 1) // Filter statistically significant
          .sort((a, b) => b.significance_score - a.significance_score);

        signPatterns[planet] = {
          total_patterns: significantPatterns.length,
          patterns: significantPatterns,
          most_over_represented: significantPatterns.filter(p => p.deviation_from_expected > 0).slice(0, 3),
          most_under_represented: significantPatterns.filter(p => p.deviation_from_expected < 0).slice(-3)
        };
      });

      return signPatterns;
    } catch (error) {
      logger.error('Error extracting sign patterns:', error);
      return {};
    }
  }

  /**
   * Extract house patterns (placeholder - would need house calculations)
   * @param {Array} events - Historical events
   * @returns {Object} House pattern analysis
   */
  async extractHousePatterns(events) {
    // This would require house calculations based on location and time
    // For now, return a placeholder structure
    return {
      note: "House patterns require location-specific calculations",
      implementation_needed: "Calculate houses for each event location and time",
      total_events: events.length
    };
  }

  /**
   * Extract combined patterns (multiple factors together)
   * @param {Array} events - Historical events
   * @returns {Object} Combined pattern analysis
   */
  async extractCombinedPatterns(events) {
    try {
      const combinedPatterns = [];
      
      // Look for combinations like "Mars in Capricorn + Saturn-Pluto square"
      events.forEach(event => {
        if (event.planetary_transits && event.planetary_transits.length > 0 && 
            event.planetary_aspects && event.planetary_aspects.length > 0) {
          
          const transit = event.planetary_transits[0];
          const aspects = event.planetary_aspects;
          
          // Create pattern signatures
          const planetaryConfig = {
            mars_sign: transit.mars_sign,
            saturn_sign: transit.saturn_sign,
            jupiter_sign: transit.jupiter_sign,
            sun_sign: transit.sun_sign,
            moon_sign: transit.moon_sign
          };
          
          const aspectConfig = aspects.map(asp => 
            `${asp.planet_a}-${asp.planet_b}-${asp.aspect_type}`
          ).sort();
          
          const combinedSignature = {
            planetary: planetaryConfig,
            aspects: aspectConfig,
            event: {
              id: event.id,
              category: event.category,
              impact_level: event.impact_level,
              date: event.event_date,
              title: event.title
            }
          };
          
          combinedPatterns.push(combinedSignature);
        }
      });

      // Find recurring combined patterns
      const patternFrequency = {};
      combinedPatterns.forEach(pattern => {
        // Create a simplified signature for matching
        const signature = JSON.stringify({
          mars: pattern.planetary.mars_sign,
          saturn: pattern.planetary.saturn_sign,
          top_aspects: pattern.aspects.slice(0, 3) // Top 3 aspects
        });
        
        if (!patternFrequency[signature]) {
          patternFrequency[signature] = {
            pattern: pattern.planetary,
            aspects: pattern.aspects.slice(0, 3),
            occurrences: 0,
            events: []
          };
        }
        
        patternFrequency[signature].occurrences++;
        patternFrequency[signature].events.push(pattern.event);
      });

      // Filter and rank combined patterns
      const significantCombined = Object.values(patternFrequency)
        .filter(p => p.occurrences >= 2)
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 10);

      return {
        total_combinations_analyzed: combinedPatterns.length,
        significant_patterns: significantCombined,
        pattern_complexity: "planetary_signs + aspects"
      };

    } catch (error) {
      logger.error('Error extracting combined patterns:', error);
      return {};
    }
  }

  /**
   * Store extracted patterns in the database
   * @param {Object} patterns - Extracted patterns
   * @param {Object} filters - Analysis filters
   * @returns {Array} Stored patterns
   */
  async storeExtractedPatterns(patterns, filters) {
    try {
      const storedPatterns = [];
      
      // Store degree-specific patterns
      for (const [planet, planetPatterns] of Object.entries(patterns.degree_specific || {})) {
        for (const pattern of planetPatterns.most_significant || []) {
          const patternData = {
            pattern_name: `${planet.toUpperCase()} at ${pattern.sign} ${pattern.degree}°`,
            description: `${planet} at ${pattern.degree}° ${pattern.sign} appears in ${pattern.occurrences} significant events`,
            pattern_type: this.patternTypes.DEGREE_SPECIFIC,
            pattern_conditions: {
              planet: planet,
              sign: pattern.sign,
              degree: pattern.degree,
              is_critical: pattern.is_critical,
              orb_tolerance: 1
            },
            total_occurrences: pattern.occurrences,
            high_impact_occurrences: pattern.events.filter(e => ['high', 'extreme'].includes(e.impact_level)).length,
            success_rate: parseFloat(pattern.pattern_strength.toFixed(2))
          };
          
          await this.storePattern(patternData);
          storedPatterns.push(patternData);
        }
      }

      // Store aspect patterns
      for (const [aspectType, aspectData] of Object.entries(patterns.aspects || {})) {
        for (const pattern of aspectData.most_significant || []) {
          const patternData = {
            pattern_name: `${pattern.planet_a.toUpperCase()}-${pattern.planet_b.toUpperCase()} ${aspectType}`,
            description: `${pattern.planet_a}-${pattern.planet_b} ${aspectType} appears in ${pattern.occurrences} significant events`,
            pattern_type: this.patternTypes.ASPECT_PATTERN,
            pattern_conditions: {
              planets: [pattern.planet_a, pattern.planet_b],
              aspect_type: aspectType,
              max_orb: Math.ceil(pattern.average_orb),
              strength_threshold: pattern.average_strength
            },
            total_occurrences: pattern.occurrences,
            high_impact_occurrences: pattern.events.filter(e => e.category).length,
            success_rate: parseFloat(pattern.significance_score.toFixed(2))
          };
          
          await this.storePattern(patternData);
          storedPatterns.push(patternData);
        }
      }

      // Store nakshatra patterns
      for (const [planet, planetData] of Object.entries(patterns.nakshatras || {})) {
        for (const [category, categoryData] of Object.entries(planetData)) {
          for (const pattern of categoryData.most_significant || []) {
            const patternData = {
              pattern_name: `${planet.toUpperCase()} in ${pattern.nakshatra} - ${category}`,
              description: `${planet} in ${pattern.nakshatra} appears in ${pattern.occurrences} ${category} events`,
              pattern_type: this.patternTypes.NAKSHATRA_PATTERN,
              pattern_conditions: {
                planet: planet,
                nakshatra: pattern.nakshatra,
                category: category,
                is_traditionally_significant: pattern.is_significant
              },
              total_occurrences: pattern.occurrences,
              high_impact_occurrences: pattern.events.filter(e => ['high', 'extreme'].includes(e.impact_level)).length,
              success_rate: parseFloat(pattern.significance_score.toFixed(2))
            };
            
            await this.storePattern(patternData);
            storedPatterns.push(patternData);
          }
        }
      }

      // Persist combined patterns as well (previously only logged)
      if (patterns.combined && Array.isArray(patterns.combined.significant_patterns)) {
        for (const combo of patterns.combined.significant_patterns) {
          const planets = combo.pattern || {};
          const topAspects = combo.aspects || [];
          const patternName = `Combined: Mars ${planets.mars_sign || 'NA'}, Saturn ${planets.saturn_sign || 'NA'} + Aspects ${topAspects.join(', ')}`;

          const totalOcc = combo.occurrences || 0;
          const hiOcc = (combo.events || []).filter(e => ['high', 'extreme'].includes(e.impact_level)).length;

          const patternData = {
            pattern_name: patternName,
            description: `Recurring combo of planetary signs and aspects across ${totalOcc} events`,
            pattern_type: this.patternTypes.COMBINED_PATTERN,
            pattern_conditions: {
              planetary: planets,
              aspects: topAspects
            },
            total_occurrences: totalOcc,
            high_impact_occurrences: hiOcc,
            success_rate: totalOcc > 0 ? parseFloat(((hiOcc / totalOcc) * 100).toFixed(2)) : 0
          };

          await this.storePattern(patternData);
          storedPatterns.push(patternData);
        }
      }

      logger.info(`✅ Stored ${storedPatterns.length} significant patterns in database`);
      return storedPatterns;

    } catch (error) {
      logger.error('Error storing extracted patterns:', error);
      return [];
    }
  }

  /**
   * Store individual pattern in database
   * @param {Object} patternData - Pattern to store
   */
  async storePattern(patternData) {
    // Prefer direct Postgres connection when available to write to astrological_patterns only
    try {
      if (sql) {
        const rows = await sql`
          INSERT INTO astrological_patterns
            (pattern_name, description, pattern_type, pattern_conditions, total_occurrences, high_impact_occurrences, success_rate)
          VALUES
            (${patternData.pattern_name}, ${patternData.description}, ${patternData.pattern_type}, ${patternData.pattern_conditions}, ${patternData.total_occurrences}, ${patternData.high_impact_occurrences}, ${patternData.success_rate})
          ON CONFLICT (pattern_name) DO UPDATE SET
            description = EXCLUDED.description,
            pattern_type = EXCLUDED.pattern_type,
            pattern_conditions = EXCLUDED.pattern_conditions,
            total_occurrences = EXCLUDED.total_occurrences,
            high_impact_occurrences = EXCLUDED.high_impact_occurrences,
            success_rate = EXCLUDED.success_rate;
        `;
        return rows;
      } else {
        const { error } = await supabase
          .from('astrological_patterns')
          .upsert([patternData], { 
            onConflict: 'pattern_name',
            ignoreDuplicates: false 
          });

        if (error) {
          logger.warn(`Failed to store pattern ${patternData.pattern_name}:`, error.message);
        }
      }
    } catch (error) {
      logger.warn('Error storing individual pattern via direct SQL:', error.message);
    }
  }

  /**
   * Get events with planetary data for pattern analysis
   * @param {Object} filters - Analysis filters
   * @returns {Array} Events with planetary data
   */
  async getEventsForPatternAnalysis(filters) {
    try {
      // Fetch events with embedded JSON columns if available; avoid implicit relationship joins
      let query = supabase
        .from('world_events')
        .select(`
          id,
          title,
          event_date,
          category,
          impact_level,
          planetary_snapshot,
          planetary_aspects
        `);

      // Apply filters
      if (Array.isArray(filters.impact_level)) {
        query = query.in('impact_level', filters.impact_level);
      } else if (filters.impact_level) {
        query = query.eq('impact_level', filters.impact_level);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.start_date) {
        query = query.gte('event_date', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('event_date', filters.end_date);
      }

      query = query.order('event_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching events for pattern analysis:', error);
        throw error;
      }

      // Normalize to expected structure used by extractors
      const normalized = (data || []).map(e => {
        // planetary_transits expected by degree/nakshatra/sign extractors: wrap snapshot into array with expected keys
        const pt = [];
        if (e.planetary_snapshot && typeof e.planetary_snapshot === 'object') {
          const ps = e.planetary_snapshot;
          pt.push({
            sun_longitude: ps.sun?.longitude ?? null,
            sun_sign: ps.sun?.sign ?? null,
            sun_degree_in_sign: ps.sun?.degree ?? null,
            sun_nakshatra: ps.sun?.nakshatra ?? null,

            moon_longitude: ps.moon?.longitude ?? null,
            moon_sign: ps.moon?.sign ?? null,
            moon_degree_in_sign: ps.moon?.degree ?? null,
            moon_nakshatra: ps.moon?.nakshatra ?? null,

            mars_longitude: ps.mars?.longitude ?? null,
            mars_sign: ps.mars?.sign ?? null,
            mars_degree_in_sign: ps.mars?.degree ?? null,
            mars_nakshatra: ps.mars?.nakshatra ?? null,

            mercury_longitude: ps.mercury?.longitude ?? null,
            mercury_sign: ps.mercury?.sign ?? null,
            mercury_degree_in_sign: ps.mercury?.degree ?? null,
            mercury_nakshatra: ps.mercury?.nakshatra ?? null,

            jupiter_longitude: ps.jupiter?.longitude ?? null,
            jupiter_sign: ps.jupiter?.sign ?? null,
            jupiter_degree_in_sign: ps.jupiter?.degree ?? null,
            jupiter_nakshatra: ps.jupiter?.nakshatra ?? null,

            venus_longitude: ps.venus?.longitude ?? null,
            venus_sign: ps.venus?.sign ?? null,
            venus_degree_in_sign: ps.venus?.degree ?? null,
            venus_nakshatra: ps.venus?.nakshatra ?? null,

            saturn_longitude: ps.saturn?.longitude ?? null,
            saturn_sign: ps.saturn?.sign ?? null,
            saturn_degree_in_sign: ps.saturn?.degree ?? null,
            saturn_nakshatra: ps.saturn?.nakshatra ?? null,

            rahu_longitude: ps.rahu?.longitude ?? null,
            rahu_sign: ps.rahu?.sign ?? null,
            rahu_degree_in_sign: ps.rahu?.degree ?? null,
            rahu_nakshatra: ps.rahu?.nakshatra ?? null,

            ketu_longitude: ps.ketu?.longitude ?? null,
            ketu_sign: ps.ketu?.sign ?? null,
            ketu_degree_in_sign: ps.ketu?.degree ?? null,
            ketu_nakshatra: ps.ketu?.nakshatra ?? null,

            ascendant_longitude: ps.ascendant?.longitude ?? null,
            ascendant_sign: ps.ascendant?.sign ?? null,
            ascendant_degree_in_sign: ps.ascendant?.degree ?? null,
            ascendant_nakshatra: ps.ascendant?.nakshatra ?? null,
          });
        }

        // planetary_aspects expected by aspect extractor: ensure array
        const aspects = Array.isArray(e.planetary_aspects) ? e.planetary_aspects : [];

        return {
          id: e.id,
          title: e.title,
          event_date: e.event_date,
          category: e.category,
          impact_level: e.impact_level,
          planetary_transits: pt,
          planetary_aspects: aspects
        };
      });

      return normalized;
    } catch (error) {
      logger.error('Error in getEventsForPatternAnalysis:', error);
      throw error;
    }
  }

  // Helper methods for significance calculations
  isCriticalDegree(degree) {
    return this.criticalDegrees.some(cd => Math.abs(cd.degree - degree) <= 1);
  }

  isSignificantNakshatra(nakshatra, category) {
    return this.significantNakshatras[category]?.includes(nakshatra) || false;
  }

  calculateDegreeSignificance(degreeData, totalEvents) {
    let score = (degreeData.occurrences / totalEvents) * 100;
    if (degreeData.is_critical) score *= 1.5; // Boost critical degrees
    return score;
  }

  calculateAspectSignificance(aspectData, totalEvents) {
    const baseScore = (aspectData.occurrences / totalEvents) * 100;
    const orbBonus = aspectData.average_orb < 2 ? 1.3 : 1.0; // Tight orbs more significant
    const strengthBonus = aspectData.average_strength > 7 ? 1.2 : 1.0;
    return baseScore * orbBonus * strengthBonus;
  }

  calculateNakshatraSignificance(nakshatraData, categoryEvents, category) {
    let score = (nakshatraData.occurrences / categoryEvents) * 100;
    if (nakshatraData.is_significant) score *= 1.4; // Boost traditionally significant nakshatras
    return score;
  }

  calculateSignSignificance(signData, totalEvents) {
    const expectedFreq = totalEvents / 12;
    const deviation = Math.abs(signData.occurrences - expectedFreq);
    const relativeDeviation = deviation / expectedFreq;
    return relativeDeviation * 100;
  }

  normalizePlanetPair(planetA, planetB) {
    return planetA < planetB ? `${planetA}-${planetB}` : `${planetB}-${planetA}`;
  }

  calculatePatternStatistics(patterns) {
    const stats = {
      total_degree_patterns: 0,
      total_aspect_patterns: 0,
      total_nakshatra_patterns: 0,
      total_sign_patterns: 0,
      total_combined_patterns: 0
    };

    // Count patterns in each category
    Object.values(patterns.degree_specific || {}).forEach(planetData => {
      stats.total_degree_patterns += planetData.patterns?.length || 0;
    });

    Object.values(patterns.aspects || {}).forEach(aspectData => {
      stats.total_aspect_patterns += aspectData.patterns?.length || 0;
    });

    Object.values(patterns.nakshatras || {}).forEach(planetData => {
      Object.values(planetData).forEach(categoryData => {
        stats.total_nakshatra_patterns += categoryData.patterns?.length || 0;
      });
    });

    Object.values(patterns.signs || {}).forEach(planetData => {
      stats.total_sign_patterns += planetData.patterns?.length || 0;
    });

    stats.total_combined_patterns = patterns.combined?.significant_patterns?.length || 0;

    return stats;
  }
}

module.exports = PlanetaryPatternExtractorService;
