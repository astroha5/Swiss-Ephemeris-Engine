const { supabase } = require('../config/supabase');
const majorPatternDetectorService = require('./majorPatternDetectorService');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

/**
 * Historical Event Correlator Service
 * Correlates detected planetary patterns with historical events to build predictive models
 * This is the core engine for understanding which patterns correlate with which types of events
 */
class HistoricalEventCorrelatorService {
  constructor() {
    // Event type correlations - which patterns typically coincide with which events
    this.eventPatternCorrelations = {
      'financial': {
        primaryPatterns: ['saturn-pluto', 'jupiter-saturn', 'jupiter-pluto', 'saturn-uranus'],
        secondaryPatterns: ['mars-saturn', 'jupiter-neptune'],
        cardinalIngresses: ['saturn', 'jupiter'],
        significantRetrogrades: ['venus', 'mercury', 'jupiter'],
        keywords: ['recession', 'market crash', 'economic crisis', 'inflation', 'currency crisis']
      },
      'war': {
        primaryPatterns: ['saturn-pluto', 'mars-saturn', 'uranus-pluto'],
        secondaryPatterns: ['mars-rahu', 'saturn-uranus'],
        eclipseTypes: ['solar-eclipse', 'lunar-eclipse'],
        cardinalIngresses: ['mars', 'saturn'],
        significantRetrogrades: ['mars'],
        keywords: ['conflict', 'invasion', 'military action', 'civil war', 'revolution']
      },
      'natural_disaster': {
        primaryPatterns: ['uranus-pluto', 'saturn-uranus', 'mars-saturn'],
        secondaryPatterns: ['mars-rahu'],
        eclipseTypes: ['lunar-eclipse'],
        cardinalIngresses: ['saturn'],
        criticalDegrees: ['anaretic', 'zero-degree'],
        keywords: ['earthquake', 'tsunami', 'hurricane', 'flood', 'volcanic eruption']
      },
      'political': {
        primaryPatterns: ['jupiter-saturn', 'saturn-pluto', 'uranus-pluto'],
        secondaryPatterns: ['saturn-uranus', 'jupiter-pluto'],
        eclipseTypes: ['solar-eclipse'],
        cardinalIngresses: ['jupiter', 'saturn'],
        significantRetrogrades: ['jupiter', 'saturn'],
        keywords: ['election', 'regime change', 'revolution', 'coup', 'independence']
      },
      'pandemic': {
        primaryPatterns: ['saturn-pluto', 'jupiter-neptune', 'saturn-uranus'],
        secondaryPatterns: ['jupiter-pluto'],
        kalaSarpaYoga: true,
        cardinalIngresses: ['saturn'],
        significantRetrogrades: ['saturn', 'jupiter'],
        keywords: ['disease outbreak', 'epidemic', 'quarantine', 'public health crisis']
      },
      'terrorism': {
        primaryPatterns: ['mars-rahu', 'mars-saturn', 'saturn-pluto'],
        secondaryPatterns: ['mars-pluto', 'saturn-uranus'],
        eclipseTypes: ['lunar-eclipse'],
        cardinalIngresses: ['mars'],
        criticalDegrees: ['anaretic'],
        keywords: ['terrorist attack', 'extremism', 'violence', 'bombing', 'assassination']
      }
    };

    // Pattern strength weights for correlation scoring
    this.patternWeights = {
      'outer-planet-conjunction': {
        'saturn-pluto': 10,
        'jupiter-saturn': 9, 
        'uranus-pluto': 10,
        'jupiter-pluto': 8,
        'saturn-uranus': 8,
        'neptune-pluto': 9
      },
      'major-aspect': {
        'mars-saturn': 7,
        'saturn-uranus': 7,
        'jupiter-neptune': 6,
        'mars-rahu': 8
      },
      'eclipses': {
        'solar-eclipse': 6,
        'lunar-eclipse': 6
      },
      'retrograde-station': {
        'mars': 6,
        'venus': 4,
        'mercury': 3,
        'jupiter': 5,
        'saturn': 6
      },
      'cardinal-ingress': {
        'jupiter': 5,
        'saturn': 7,
        'mars': 4,
        'venus': 3
      },
      'kala-sarpa-yoga': 8,
      'gandanta-transit': 5,
      'critical-degree-transit': 4
    };

    // Time windows for pattern-event correlation (days before/after event)
    this.correlationWindows = {
      'outer-planet-conjunction': 180, // 6 months window
      'major-aspect': 60, // 2 months window
      'eclipses': 30, // 1 month window
      'retrograde-station': 90, // 3 months window
      'cardinal-ingress': 120, // 4 months window
      'kala-sarpa-yoga': 90, // 3 months window
      'gandanta-transit': 45, // 1.5 months window
      'critical-degree-transit': 15 // 2 weeks window
    };
  }

  /**
   * Main correlation analysis method
   * @param {Date} startDate - Start date for analysis
   * @param {Date} endDate - End date for analysis
   * @param {Object} options - Analysis options
   * @returns {Object} Comprehensive correlation analysis
   */
  async performCorrelationAnalysis(startDate, endDate, options = {}) {
    try {
      logger.info(`🔍 Starting historical event correlation analysis from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Step 1: Get historical events in the date range
      const historicalEvents = await this.getHistoricalEvents(startDate, endDate, options);
      logger.info(`📅 Found ${historicalEvents.length} historical events to analyze`);

      if (historicalEvents.length === 0) {
        return {
          success: false,
          message: 'No historical events found in the specified date range',
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
        };
      }

      // Step 2: Detect planetary patterns for the same period
      const planetaryPatterns = await majorPatternDetectorService.detectMajorPatterns(startDate, endDate);
      logger.info(`🌟 Detected ${planetaryPatterns.summary.totalPatterns} planetary patterns`);

      // Step 3: Correlate events with patterns
      const correlations = await this.correlateEventsWithPatterns(historicalEvents, planetaryPatterns);

      // Step 4: Calculate correlation statistics and build predictive model
      const correlationStats = this.calculateCorrelationStatistics(correlations);

      // Step 5: Generate predictive insights
      const predictiveInsights = this.generatePredictiveInsights(correlations, correlationStats);

      // Step 6: Store findings in database
      await this.storeCorrelationFindings(correlations, correlationStats);

      const results = {
        success: true,
        analysis: {
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            duration: moment(endDate).diff(moment(startDate), 'days')
          },
          dataPoints: {
            historicalEvents: historicalEvents.length,
            planetaryPatterns: planetaryPatterns.summary.totalPatterns,
            successfulCorrelations: correlations.filter(c => c.correlationScore > 0.3).length
          },
          correlations: correlations,
          statistics: correlationStats,
          predictiveInsights: predictiveInsights,
          recommendations: this.generateRecommendations(correlationStats)
        },
        timestamp: new Date().toISOString()
      };

      logger.info(`✅ Correlation analysis completed. Found ${results.analysis.dataPoints.successfulCorrelations} strong correlations`);
      return results;

    } catch (error) {
      logger.error('Error in correlation analysis:', error);
      throw error;
    }
  }

  /**
   * Get historical events from database
   */
  async getHistoricalEvents(startDate, endDate, options = {}) {
    try {
      let query = supabase
        .from('world_events')
        .select(`
          *,
          planetary_transits (*),
          planetary_aspects (*)
        `)
        .gte('event_date', startDate.toISOString())
        .lte('event_date', endDate.toISOString())
        .order('event_date', { ascending: true });

      // Apply filters
      if (options.categories && options.categories.length > 0) {
        query = query.in('category', options.categories);
      }

      if (options.impactLevels && options.impactLevels.length > 0) {
        query = query.in('impact_level', options.impactLevels);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: events, error } = await query;

      if (error) {
        throw error;
      }

      return events || [];

    } catch (error) {
      logger.error('Error fetching historical events:', error);
      return [];
    }
  }

  /**
   * Correlate events with planetary patterns
   */
  async correlateEventsWithPatterns(events, patterns) {
    const correlations = [];

    for (const event of events) {
      const eventDate = moment(event.event_date);
      const eventCorrelation = {
        event: {
          id: event.id,
          title: event.title,
          date: event.event_date,
          category: event.category,
          impact_level: event.impact_level,
          location: event.location_name,
          description: event.description
        },
        correlatedPatterns: [],
        correlationScore: 0,
        patternStrength: 0,
        temporalAlignment: {},
        significanceAnalysis: {}
      };

      // Check each pattern type for correlations
      for (const [patternType, patternArray] of Object.entries(patterns)) {
        if (patternType === 'summary' || !Array.isArray(patternArray)) continue;

        for (const pattern of patternArray) {
          const patternDate = moment(pattern.date);
          const timeDifference = Math.abs(eventDate.diff(patternDate, 'days'));
          const maxWindow = this.correlationWindows[pattern.type] || 60;

          // Check if pattern falls within correlation window
          if (timeDifference <= maxWindow) {
            const correlation = this.calculatePatternEventCorrelation(event, pattern, timeDifference);
            
            if (correlation.score > 0.2) { // Minimum correlation threshold
              eventCorrelation.correlatedPatterns.push({
                pattern: pattern,
                correlation: correlation,
                timeDifference: timeDifference,
                isWithinPrimaryWindow: timeDifference <= maxWindow / 2
              });

              // Add to total correlation score
              eventCorrelation.correlationScore += correlation.score * correlation.weight;
              eventCorrelation.patternStrength += this.getPatternStrength(pattern);
            }
          }
        }
      }

      // Normalize correlation score
      if (eventCorrelation.correlatedPatterns.length > 0) {
        eventCorrelation.correlationScore = Math.min(1.0, eventCorrelation.correlationScore / eventCorrelation.correlatedPatterns.length);
        eventCorrelation.temporalAlignment = this.analyzeTemporalAlignment(eventCorrelation.correlatedPatterns);
        eventCorrelation.significanceAnalysis = this.analyzePatternSignificance(eventCorrelation.correlatedPatterns, event.category);
      }

      correlations.push(eventCorrelation);
    }

    // Sort by correlation score (highest first)
    correlations.sort((a, b) => b.correlationScore - a.correlationScore);

    return correlations;
  }

  /**
   * Calculate correlation between a specific pattern and event
   */
  calculatePatternEventCorrelation(event, pattern, timeDifference) {
    let score = 0;
    let weight = 1;
    let reasoning = [];

    // Base correlation from event category and pattern type
    const categoryCorrelation = this.getCategoryPatternCorrelation(event.category, pattern);
    score += categoryCorrelation.score;
    weight *= categoryCorrelation.weight;
    reasoning.push(categoryCorrelation.reasoning);

    // Time proximity bonus
    const maxWindow = this.correlationWindows[pattern.type] || 60;
    const timeProximityScore = Math.max(0, 1 - (timeDifference / maxWindow));
    score += timeProximityScore * 0.3;
    reasoning.push(`Time proximity: ${timeDifference} days (${(timeProximityScore * 100).toFixed(1)}%)`);

    // Pattern significance bonus
    const significanceBonus = this.getSignificanceBonus(pattern.significance);
    score += significanceBonus;
    reasoning.push(`Significance bonus: ${pattern.significance} (+${(significanceBonus * 100).toFixed(1)}%)`);

    // Impact level alignment
    const impactAlignment = this.getImpactAlignment(event.impact_level, pattern.significance);
    score += impactAlignment;
    reasoning.push(`Impact alignment: ${event.impact_level} event with ${pattern.significance} pattern (+${(impactAlignment * 100).toFixed(1)}%)`);

    return {
      score: Math.min(1.0, score),
      weight: weight,
      reasoning: reasoning,
      components: {
        categoryCorrelation: categoryCorrelation.score,
        timeProximity: timeProximityScore,
        significanceBonus: significanceBonus,
        impactAlignment: impactAlignment
      }
    };
  }

  /**
   * Get correlation between event category and pattern
   */
  getCategoryPatternCorrelation(eventCategory, pattern) {
    const categoryConfig = this.eventPatternCorrelations[eventCategory];
    if (!categoryConfig) {
      return { score: 0.1, weight: 0.5, reasoning: 'Unknown category correlation' };
    }

    let score = 0;
    let weight = 1;
    let reasoning = '';

    // Check primary patterns
    if (pattern.type === 'outer-planet-conjunction' && categoryConfig.primaryPatterns) {
      if (categoryConfig.primaryPatterns.includes(pattern.conjunction)) {
        score = 0.8;
        weight = 1.5;
        reasoning = `Primary pattern: ${pattern.conjunction} for ${eventCategory} events`;
      }
    }

    // Check secondary patterns
    if (score === 0 && pattern.type === 'major-aspect' && categoryConfig.secondaryPatterns) {
      const aspectKey = pattern.planets.join('-');
      if (categoryConfig.secondaryPatterns.includes(aspectKey)) {
        score = 0.6;
        weight = 1.2;
        reasoning = `Secondary pattern: ${aspectKey} ${pattern.aspectType} for ${eventCategory} events`;
      }
    }

    // Check eclipse correlations
    if (pattern.type.includes('eclipse') && categoryConfig.eclipseTypes) {
      if (categoryConfig.eclipseTypes.includes(pattern.type)) {
        score = 0.5;
        weight = 1.1;
        reasoning = `Eclipse correlation: ${pattern.type} for ${eventCategory} events`;
      }
    }

    // Check retrograde correlations
    if (pattern.type === 'retrograde-station' && categoryConfig.significantRetrogrades) {
      if (categoryConfig.significantRetrogrades.includes(pattern.planet)) {
        score = 0.4;
        weight = 1.0;
        reasoning = `Retrograde correlation: ${pattern.planet} for ${eventCategory} events`;
      }
    }

    // Check cardinal ingress correlations
    if (pattern.type === 'cardinal-ingress' && categoryConfig.cardinalIngresses) {
      if (categoryConfig.cardinalIngresses.includes(pattern.planet)) {
        score = 0.5;
        weight = 1.1;
        reasoning = `Cardinal ingress: ${pattern.planet} into ${pattern.toSign} for ${eventCategory} events`;
      }
    }

    // Check Kala Sarpa Yoga
    if (pattern.type === 'kala-sarpa-yoga' && categoryConfig.kalaSarpaYoga) {
      score = 0.6;
      weight = 1.3;
      reasoning = `Kala Sarpa Yoga correlation for ${eventCategory} events`;
    }

    // Default correlation for other patterns
    if (score === 0) {
      score = 0.2;
      weight = 0.8;
      reasoning = `General pattern correlation for ${eventCategory}`;
    }

    return { score, weight, reasoning };
  }

  /**
   * Get significance bonus
   */
  getSignificanceBonus(significance) {
    const bonuses = {
      'extreme': 0.3,
      'high': 0.2,
      'medium': 0.1,
      'low': 0.05
    };
    return bonuses[significance] || 0;
  }

  /**
   * Get impact level alignment bonus
   */
  getImpactAlignment(eventImpact, patternSignificance) {
    const impactScores = { 'low': 1, 'medium': 2, 'high': 3, 'extreme': 4 };
    const significanceScores = { 'low': 1, 'medium': 2, 'high': 3, 'extreme': 4 };

    const eventScore = impactScores[eventImpact] || 2;
    const patternScore = significanceScores[patternSignificance] || 2;

    // Bonus for aligned impact levels
    const alignment = 1 - Math.abs(eventScore - patternScore) / 4;
    return alignment * 0.2;
  }

  /**
   * Get pattern strength
   */
  getPatternStrength(pattern) {
    const baseWeights = this.patternWeights[pattern.type] || {};
    
    if (pattern.type === 'outer-planet-conjunction') {
      return baseWeights[pattern.conjunction] || 5;
    } else if (pattern.type === 'major-aspect') {
      const aspectKey = pattern.planets.join('-');
      return baseWeights[aspectKey] || 4;
    } else if (pattern.type === 'retrograde-station') {
      return baseWeights[pattern.planet] || 3;
    } else if (pattern.type === 'cardinal-ingress') {
      return baseWeights[pattern.planet] || 3;
    } else {
      return this.patternWeights[pattern.type] || 3;
    }
  }

  /**
   * Analyze temporal alignment of patterns
   */
  analyzeTemporalAlignment(correlatedPatterns) {
    const timeline = correlatedPatterns.map(cp => ({
      date: cp.pattern.date,
      timeDiff: cp.timeDifference,
      type: cp.pattern.type,
      significance: cp.pattern.significance
    }));

    timeline.sort((a, b) => a.timeDiff - b.timeDiff);

    return {
      totalPatterns: correlatedPatterns.length,
      closestPattern: timeline[0],
      patternSpread: timeline.length > 1 ? timeline[timeline.length - 1].timeDiff - timeline[0].timeDiff : 0,
      patternsWithinWeek: timeline.filter(p => p.timeDiff <= 7).length,
      patternsWithinMonth: timeline.filter(p => p.timeDiff <= 30).length,
      timeline: timeline
    };
  }

  /**
   * Analyze pattern significance for event category
   */
  analyzePatternSignificance(correlatedPatterns, eventCategory) {
    const categoryConfig = this.eventPatternCorrelations[eventCategory] || {};
    
    let primaryPatternCount = 0;
    let secondaryPatternCount = 0;
    let highSignificanceCount = 0;
    let exactPatternCount = 0;

    for (const cp of correlatedPatterns) {
      const pattern = cp.pattern;
      
      // Count primary patterns
      if (pattern.type === 'outer-planet-conjunction' && categoryConfig.primaryPatterns) {
        if (categoryConfig.primaryPatterns.includes(pattern.conjunction)) {
          primaryPatternCount++;
        }
      }

      // Count secondary patterns
      if (pattern.type === 'major-aspect' && categoryConfig.secondaryPatterns) {
        const aspectKey = pattern.planets.join('-');
        if (categoryConfig.secondaryPatterns.includes(aspectKey)) {
          secondaryPatternCount++;
        }
      }

      // Count high significance
      if (['high', 'extreme'].includes(pattern.significance)) {
        highSignificanceCount++;
      }

      // Count exact patterns
      if (pattern.isExact || (pattern.orb && pattern.orb <= 1)) {
        exactPatternCount++;
      }
    }

    return {
      primaryPatternCount,
      secondaryPatternCount,
      highSignificanceCount,
      exactPatternCount,
      significanceRatio: highSignificanceCount / correlatedPatterns.length,
      primaryPatternRatio: primaryPatternCount / correlatedPatterns.length,
      categoryAlignment: this.calculateCategoryAlignment(correlatedPatterns, eventCategory)
    };
  }

  /**
   * Calculate category alignment score
   */
  calculateCategoryAlignment(correlatedPatterns, eventCategory) {
    const categoryConfig = this.eventPatternCorrelations[eventCategory];
    if (!categoryConfig) return 0;

    let alignmentScore = 0;
    let totalPossibleScore = 0;

    for (const cp of correlatedPatterns) {
      const pattern = cp.pattern;
      totalPossibleScore += 1;

      // Check various alignment factors
      if (pattern.type === 'outer-planet-conjunction' && categoryConfig.primaryPatterns?.includes(pattern.conjunction)) {
        alignmentScore += 1;
      } else if (pattern.type === 'major-aspect' && categoryConfig.secondaryPatterns?.includes(pattern.planets.join('-'))) {
        alignmentScore += 0.8;
      } else if (pattern.type.includes('eclipse') && categoryConfig.eclipseTypes?.includes(pattern.type)) {
        alignmentScore += 0.6;
      } else if (pattern.type === 'retrograde-station' && categoryConfig.significantRetrogrades?.includes(pattern.planet)) {
        alignmentScore += 0.5;
      } else if (pattern.type === 'cardinal-ingress' && categoryConfig.cardinalIngresses?.includes(pattern.planet)) {
        alignmentScore += 0.6;
      } else if (pattern.type === 'kala-sarpa-yoga' && categoryConfig.kalaSarpaYoga) {
        alignmentScore += 0.7;
      } else {
        alignmentScore += 0.2; // Base alignment for any pattern
      }
    }

    return totalPossibleScore > 0 ? alignmentScore / totalPossibleScore : 0;
  }

  /**
   * Calculate correlation statistics
   */
  calculateCorrelationStatistics(correlations) {
    const stats = {
      totalEvents: correlations.length,
      eventsWithCorrelations: correlations.filter(c => c.correlatedPatterns.length > 0).length,
      averageCorrelationScore: 0,
      strongCorrelations: correlations.filter(c => c.correlationScore > 0.6).length,
      moderateCorrelations: correlations.filter(c => c.correlationScore > 0.3 && c.correlationScore <= 0.6).length,
      weakCorrelations: correlations.filter(c => c.correlationScore > 0 && c.correlationScore <= 0.3).length,
      byCategory: {},
      byImpactLevel: {},
      mostCorrelatedPatterns: {},
      temporalAnalysis: {},
      predictiveAccuracy: {}
    };

    // Calculate averages
    const totalScore = correlations.reduce((sum, c) => sum + c.correlationScore, 0);
    stats.averageCorrelationScore = stats.totalEvents > 0 ? totalScore / stats.totalEvents : 0;

    // Analyze by category
    const categories = [...new Set(correlations.map(c => c.event.category))];
    for (const category of categories) {
      const categoryEvents = correlations.filter(c => c.event.category === category);
      stats.byCategory[category] = {
        totalEvents: categoryEvents.length,
        eventsWithCorrelations: categoryEvents.filter(c => c.correlatedPatterns.length > 0).length,
        averageScore: categoryEvents.reduce((sum, c) => sum + c.correlationScore, 0) / categoryEvents.length,
        strongCorrelations: categoryEvents.filter(c => c.correlationScore > 0.6).length
      };
    }

    // Analyze by impact level
    const impactLevels = [...new Set(correlations.map(c => c.event.impact_level))];
    for (const level of impactLevels) {
      const levelEvents = correlations.filter(c => c.event.impact_level === level);
      stats.byImpactLevel[level] = {
        totalEvents: levelEvents.length,
        eventsWithCorrelations: levelEvents.filter(c => c.correlatedPatterns.length > 0).length,
        averageScore: levelEvents.reduce((sum, c) => sum + c.correlationScore, 0) / levelEvents.length,
        strongCorrelations: levelEvents.filter(c => c.correlationScore > 0.6).length
      };
    }

    // Most correlated patterns
    const patternCounts = {};
    for (const correlation of correlations) {
      for (const cp of correlation.correlatedPatterns) {
        const patternKey = cp.pattern.type;
        if (!patternCounts[patternKey]) {
          patternCounts[patternKey] = { count: 0, totalScore: 0, events: [] };
        }
        patternCounts[patternKey].count++;
        patternCounts[patternKey].totalScore += cp.correlation.score;
        patternCounts[patternKey].events.push(correlation.event.title);
      }
    }

    for (const [pattern, data] of Object.entries(patternCounts)) {
      stats.mostCorrelatedPatterns[pattern] = {
        frequency: data.count,
        averageScore: data.totalScore / data.count,
        exampleEvents: data.events.slice(0, 3)
      };
    }

    return stats;
  }

  /**
   * Generate predictive insights
   */
  generatePredictiveInsights(correlations, stats) {
    const insights = {
      patternReliability: {},
      categoryPredictors: {},
      temporalPatterns: {},
      riskAssessment: {},
      recommendations: []
    };

    // Analyze pattern reliability
    for (const [pattern, data] of Object.entries(stats.mostCorrelatedPatterns)) {
      const reliability = data.averageScore * (data.frequency / stats.totalEvents);
      insights.patternReliability[pattern] = {
        reliability: reliability,
        frequency: data.frequency,
        averageScore: data.averageScore,
        confidence: reliability > 0.3 ? 'high' : reliability > 0.15 ? 'medium' : 'low'
      };
    }

    // Category predictors
    for (const [category, data] of Object.entries(stats.byCategory)) {
      const predictability = (data.eventsWithCorrelations / data.totalEvents) * data.averageScore;
      insights.categoryPredictors[category] = {
        predictability: predictability,
        correlationRate: data.eventsWithCorrelations / data.totalEvents,
        averageScore: data.averageScore,
        confidence: predictability > 0.4 ? 'high' : predictability > 0.2 ? 'medium' : 'low'
      };
    }

    // Generate recommendations
    insights.recommendations = this.generateRecommendations(stats);

    return insights;
  }

  /**
   * Generate recommendations based on correlation analysis
   */
  generateRecommendations(stats) {
    const recommendations = [];

    // High correlation patterns
    const highReliabilityPatterns = Object.entries(stats.mostCorrelatedPatterns)
      .filter(([pattern, data]) => data.averageScore > 0.5 && data.frequency > 2)
      .sort((a, b) => b[1].averageScore - a[1].averageScore);

    if (highReliabilityPatterns.length > 0) {
      recommendations.push({
        type: 'pattern-monitoring',
        priority: 'high',
        title: 'Monitor High-Correlation Patterns',
        description: `Focus monitoring on ${highReliabilityPatterns.slice(0, 3).map(([pattern]) => pattern).join(', ')} as they show strong correlation with historical events.`,
        patterns: highReliabilityPatterns.slice(0, 5)
      });
    }

    // Category-specific recommendations
    const highPredictabilityCategories = Object.entries(stats.byCategory)
      .filter(([category, data]) => data.averageScore > 0.3)
      .sort((a, b) => b[1].averageScore - a[1].averageScore);

    if (highPredictabilityCategories.length > 0) {
      recommendations.push({
        type: 'category-focus',
        priority: 'medium',
        title: 'Focus on Predictable Event Categories',
        description: `${highPredictabilityCategories[0][0]} events show highest predictability (${(highPredictabilityCategories[0][1].averageScore * 100).toFixed(1)}% average correlation).`,
        categories: highPredictabilityCategories
      });
    }

    // Data improvement recommendations
    if (stats.eventsWithCorrelations / stats.totalEvents < 0.5) {
      recommendations.push({
        type: 'data-improvement',
        priority: 'medium',
        title: 'Improve Historical Data Coverage',
        description: `Only ${((stats.eventsWithCorrelations / stats.totalEvents) * 100).toFixed(1)}% of events have pattern correlations. Consider expanding historical event database.`
      });
    }

    return recommendations;
  }

  /**
   * Store correlation findings in database
   */
  async storeCorrelationFindings(correlations, stats) {
    try {
      const findings = {
        analysis_date: new Date().toISOString(),
        total_events_analyzed: stats.totalEvents,
        correlation_statistics: stats,
        successful_correlations: correlations.filter(c => c.correlationScore > 0.3).length,
        average_correlation_score: stats.averageCorrelationScore,
        strongest_correlations: correlations.slice(0, 10).map(c => ({
          event_title: c.event.title,
          event_date: c.event.date,
          correlation_score: c.correlationScore,
          top_patterns: c.correlatedPatterns.slice(0, 3).map(cp => ({
            type: cp.pattern.type,
            significance: cp.pattern.significance,
            correlation_score: cp.correlation.score
          }))
        }))
      };

      // Note: This would typically be stored in a dedicated table for correlation analysis results
      logger.info(`📊 Correlation analysis complete - ${findings.successful_correlations} strong correlations found`);
      
      return findings;

    } catch (error) {
      logger.error('Error storing correlation findings:', error);
      throw error;
    }
  }

  /**
   * Get pattern predictions for future dates
   * @param {Date} targetDate - Date to analyze for patterns
   * @param {Array} categories - Event categories to predict
   * @returns {Object} Predictions based on detected patterns
   */
  async getPredictionsForDate(targetDate, categories = []) {
    try {
      logger.info(`🔮 Generating predictions for ${targetDate.toISOString()}`);

      // Detect patterns around the target date (±30 days)
      const analysisStart = moment(targetDate).subtract(30, 'days').toDate();
      const analysisEnd = moment(targetDate).add(30, 'days').toDate();

      const patterns = await majorPatternDetectorService.detectMajorPatterns(analysisStart, analysisEnd);
      
      const predictions = {
        targetDate: targetDate.toISOString(),
        activePatternsNearDate: [],
        categoryPredictions: {},
        overallRiskLevel: 'low',
        confidence: 0,
        recommendations: []
      };

      // Find patterns close to target date
      for (const [patternType, patternArray] of Object.entries(patterns)) {
        if (patternType === 'summary' || !Array.isArray(patternArray)) continue;

        for (const pattern of patternArray) {
          const patternDate = moment(pattern.date);
          const daysDifference = Math.abs(patternDate.diff(moment(targetDate), 'days'));
          
          if (daysDifference <= 30) {
            predictions.activePatternsNearDate.push({
              pattern: pattern,
              daysDifference: daysDifference,
              patternStrength: this.getPatternStrength(pattern)
            });
          }
        }
      }

      // Generate category-specific predictions
      const targetCategories = categories.length > 0 ? categories : Object.keys(this.eventPatternCorrelations);
      
      for (const category of targetCategories) {
        const categoryPrediction = this.predictCategoryRisk(predictions.activePatternsNearDate, category);
        predictions.categoryPredictions[category] = categoryPrediction;
      }

      // Calculate overall risk level
      const riskLevels = Object.values(predictions.categoryPredictions).map(p => p.riskScore);
      const averageRisk = riskLevels.length > 0 ? riskLevels.reduce((a, b) => a + b, 0) / riskLevels.length : 0;
      
      predictions.overallRiskLevel = averageRisk > 0.7 ? 'high' : averageRisk > 0.4 ? 'medium' : 'low';
      predictions.confidence = Math.min(0.9, predictions.activePatternsNearDate.length * 0.1);

      logger.info(`🎯 Generated predictions for ${targetDate.toISOString()}: ${predictions.overallRiskLevel} risk level`);
      
      return predictions;

    } catch (error) {
      logger.error('Error generating predictions:', error);
      throw error;
    }
  }

  /**
   * Predict risk for specific category based on active patterns
   */
  predictCategoryRisk(activePatterns, category) {
    const categoryConfig = this.eventPatternCorrelations[category];
    if (!categoryConfig) {
      return { riskScore: 0, confidence: 0, reasoning: 'Unknown category' };
    }

    let riskScore = 0;
    let confidence = 0;
    let reasoning = [];
    let contributingPatterns = [];

    for (const { pattern, daysDifference, patternStrength } of activePatterns) {
      let patternScore = 0;
      let patternReasoning = '';

      // Check primary patterns
      if (pattern.type === 'outer-planet-conjunction' && categoryConfig.primaryPatterns?.includes(pattern.conjunction)) {
        patternScore = 0.8 * (30 - daysDifference) / 30; // Distance-weighted
        patternReasoning = `Primary pattern: ${pattern.conjunction}`;
      }
      
      // Check secondary patterns
      else if (pattern.type === 'major-aspect' && categoryConfig.secondaryPatterns?.includes(pattern.planets.join('-'))) {
        patternScore = 0.6 * (30 - daysDifference) / 30;
        patternReasoning = `Secondary pattern: ${pattern.planets.join('-')} ${pattern.aspectType}`;
      }
      
      // Check other pattern types
      else if (pattern.type.includes('eclipse') && categoryConfig.eclipseTypes?.includes(pattern.type)) {
        patternScore = 0.5 * (30 - daysDifference) / 30;
        patternReasoning = `Eclipse correlation: ${pattern.type}`;
      }
      
      else if (pattern.type === 'retrograde-station' && categoryConfig.significantRetrogrades?.includes(pattern.planet)) {
        patternScore = 0.4 * (30 - daysDifference) / 30;
        patternReasoning = `Retrograde: ${pattern.planet}`;
      }
      
      else if (pattern.type === 'kala-sarpa-yoga' && categoryConfig.kalaSarpaYoga) {
        patternScore = 0.7 * (30 - daysDifference) / 30;
        patternReasoning = 'Kala Sarpa Yoga';
      }

      if (patternScore > 0) {
        riskScore += patternScore;
        confidence += 0.1;
        reasoning.push(patternReasoning);
        contributingPatterns.push(pattern);
      }
    }

    // Normalize scores
    riskScore = Math.min(1.0, riskScore);
    confidence = Math.min(0.9, confidence);

    return {
      riskScore: riskScore,
      confidence: confidence,
      reasoning: reasoning,
      contributingPatterns: contributingPatterns.length,
      topContributors: reasoning.slice(0, 3)
    };
  }
}

module.exports = new HistoricalEventCorrelatorService();
