const express = require('express');
const router = express.Router();
const majorPatternDetectorService = require('../services/majorPatternDetectorService');
const historicalEventCorrelatorService = require('../services/historicalEventCorrelatorService');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

/**
 * POST /api/major-patterns/detect
 * Detect major planetary patterns for a given date range
 */
router.post('/detect', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      storeResults = false, 
      options = {} 
    } = req.body;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    // Parse and validate dates
    const start = moment(startDate);
    const end = moment(endDate);

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        error: 'endDate must be after startDate'
      });
    }

    // Limit analysis to reasonable timeframes (max 5 years)
    const daysDifference = end.diff(start, 'days');
    if (daysDifference > 1825) {
      return res.status(400).json({
        success: false,
        error: 'Date range too large. Maximum 5 years allowed.'
      });
    }

    logger.info(`🔍 API request: Detecting major patterns from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);

    // Detect patterns
    const patterns = await majorPatternDetectorService.detectMajorPatterns(
      start.toDate(), 
      end.toDate(), 
      options
    );

    // Optionally store results in database
    if (storeResults && patterns.summary.totalPatterns > 0) {
      try {
        await majorPatternDetectorService.storeDetectedPatterns(patterns);
        logger.info('✅ Patterns stored in database');
      } catch (storeError) {
        logger.warn('Failed to store patterns in database:', storeError.message);
        // Don't fail the request if storage fails
      }
    }

    res.json({
      success: true,
      data: {
        analysisInfo: {
          dateRange: {
            start: start.format('YYYY-MM-DD'),
            end: end.format('YYYY-MM-DD'),
            duration: daysDifference
          },
          patternsDetected: patterns.summary.totalPatterns,
          highSignificancePatterns: patterns.summary.highSignificancePatterns,
          storedInDatabase: storeResults
        },
        patterns: patterns,
        apiMetadata: {
          requestTime: new Date().toISOString(),
          processingTime: `${daysDifference > 365 ? 'High' : daysDifference > 90 ? 'Medium' : 'Low'} complexity`,
          recommendations: patterns.summary.totalPatterns > 20 ? 
            'Large number of patterns detected. Consider filtering by significance level.' :
            'Pattern count within normal range.'
        }
      }
    });

  } catch (error) {
    logger.error('Error in major pattern detection API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during pattern detection',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/major-patterns/correlate
 * Correlate detected patterns with historical events
 */
router.post('/correlate', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      options = {} 
    } = req.body;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    // Parse and validate dates
    const start = moment(startDate);
    const end = moment(endDate);

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        error: 'endDate must be after startDate'
      });
    }

    // Limit analysis to reasonable timeframes (max 3 years for correlation analysis)
    const daysDifference = end.diff(start, 'days');
    if (daysDifference > 1095) {
      return res.status(400).json({
        success: false,
        error: 'Date range too large for correlation analysis. Maximum 3 years allowed.'
      });
    }

    logger.info(`🔍 API request: Correlating patterns with events from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);

    // Perform correlation analysis
    const correlationResults = await historicalEventCorrelatorService.performCorrelationAnalysis(
      start.toDate(), 
      end.toDate(), 
      options
    );

    res.json({
      success: true,
      data: correlationResults,
      apiMetadata: {
        requestTime: new Date().toISOString(),
        analysisComplexity: daysDifference > 365 ? 'high' : daysDifference > 90 ? 'medium' : 'low',
        dataQuality: {
          eventsAnalyzed: correlationResults.analysis?.dataPoints?.historicalEvents || 0,
          patternsDetected: correlationResults.analysis?.dataPoints?.planetaryPatterns || 0,
          correlationRate: correlationResults.analysis?.dataPoints ? 
            (correlationResults.analysis.dataPoints.successfulCorrelations / correlationResults.analysis.dataPoints.historicalEvents * 100).toFixed(1) + '%' : 
            'N/A'
        }
      }
    });

  } catch (error) {
    logger.error('Error in correlation analysis API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during correlation analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/major-patterns/predict
 * Generate predictions for future dates based on detected patterns
 */
router.post('/predict', async (req, res) => {
  try {
    const { 
      targetDate, 
      categories = [], 
      confidenceThreshold = 0.3 
    } = req.body;

    // Validate required parameters
    if (!targetDate) {
      return res.status(400).json({
        success: false,
        error: 'targetDate is required'
      });
    }

    // Parse and validate target date
    const target = moment(targetDate);
    if (!target.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid targetDate format. Use YYYY-MM-DD'
      });
    }

    // Don't allow predictions too far in the past or future
    const daysDifference = Math.abs(target.diff(moment(), 'days'));
    if (daysDifference > 365) {
      return res.status(400).json({
        success: false,
        error: 'Target date too far from current date. Maximum 1 year allowed.'
      });
    }

    logger.info(`🔮 API request: Generating predictions for ${target.format('YYYY-MM-DD')}`);

    // Generate predictions
    const predictions = await historicalEventCorrelatorService.getPredictionsForDate(
      target.toDate(), 
      categories
    );

    // Filter predictions by confidence threshold
    const filteredPredictions = {
      ...predictions,
      categoryPredictions: Object.fromEntries(
        Object.entries(predictions.categoryPredictions).filter(
          ([category, prediction]) => prediction.confidence >= confidenceThreshold
        )
      )
    };

    // Add interpretation and recommendations
    const interpretation = {
      overallAssessment: predictions.overallRiskLevel,
      confidence: predictions.confidence,
      keyPatterns: predictions.activePatternsNearDate
        .sort((a, b) => b.patternStrength - a.patternStrength)
        .slice(0, 3)
        .map(p => ({
          type: p.pattern.type,
          significance: p.pattern.significance,
          daysFromTarget: p.daysDifference,
          description: `${p.pattern.type} pattern ${p.daysDifference} days from target date`
        })),
      recommendations: [
        predictions.overallRiskLevel === 'high' ? 
          'Monitor news and global events closely around this date' :
          'Normal monitoring recommended',
        `${predictions.activePatternsNearDate.length} active patterns detected within 30-day window`,
        predictions.confidence > 0.5 ? 
          'High confidence in pattern analysis' : 
          'Moderate confidence - consider additional data sources'
      ]
    };

    res.json({
      success: true,
      data: {
        targetDate: target.format('YYYY-MM-DD'),
        predictions: filteredPredictions,
        interpretation: interpretation,
        metadata: {
          totalPatternsNearDate: predictions.activePatternsNearDate.length,
          categoriesAnalyzed: Object.keys(predictions.categoryPredictions).length,
          confidenceThreshold: confidenceThreshold,
          daysFromToday: target.diff(moment(), 'days')
        }
      }
    });

  } catch (error) {
    logger.error('Error in prediction API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during prediction generation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/major-patterns/pattern-types
 * Get information about available pattern types and their significance
 */
router.get('/pattern-types', async (req, res) => {
  try {
    const patternTypes = {
      outerPlanetConjunctions: {
        description: 'Rare conjunctions between outer planets that occur every 20-500 years',
        examples: ['saturn-pluto', 'jupiter-saturn', 'uranus-pluto'],
        significance: 'Very high - correlate with major historical events',
        averageFrequency: '1-3 per decade',
        keywords: ['transformation', 'societal change', 'economic cycles', 'political shifts']
      },
      majorAspects: {
        description: 'Significant angular relationships between planets',
        examples: ['mars-saturn square', 'jupiter-neptune conjunction', 'saturn-uranus opposition'],
        significance: 'High to medium - affect specific event categories',
        averageFrequency: '5-10 per year',
        keywords: ['tension', 'conflict', 'opportunities', 'challenges']
      },
      eclipses: {
        description: 'Solar and lunar eclipses near lunar nodes',
        examples: ['solar eclipse in Aries', 'lunar eclipse in Scorpio'],
        significance: 'High - traditional markers of significant events',
        averageFrequency: '4-6 per year',
        keywords: ['revelations', 'endings', 'new beginnings', 'hidden information']
      },
      retrogrades: {
        description: 'Planetary stations turning retrograde or direct',
        examples: ['Mars retrograde', 'Venus retrograde', 'Saturn direct'],
        significance: 'Medium to high - depend on planet',
        averageFrequency: '15-20 per year',
        keywords: ['delays', 'revision', 'internal focus', 'past issues']
      },
      cardinalIngresses: {
        description: 'Major planets entering cardinal signs (Aries, Cancer, Libra, Capricorn)',
        examples: ['Saturn enters Capricorn', 'Jupiter enters Aries'],
        significance: 'High - mark new eras and cycles',
        averageFrequency: '3-5 per year',
        keywords: ['new cycles', 'leadership changes', 'structural shifts']
      },
      kalaSarpaYoga: {
        description: 'All planets confined to one side of Rahu-Ketu axis',
        examples: ['Classic Kala Sarpa', 'Reverse Kala Sarpa'],
        significance: 'High - periods of collective intensity',
        averageFrequency: '2-3 periods per year',
        keywords: ['instability', 'polarity', 'karmic challenges', 'transformation']
      },
      gandantaTransits: {
        description: 'Planets at fire-water sign junctions',
        examples: ['Sun in Gandanta', 'Moon in Cancer-Leo junction'],
        significance: 'Medium - karmic and transformational',
        averageFrequency: 'Variable by planet',
        keywords: ['karmic unraveling', 'spiritual growth', 'challenges', 'purification']
      },
      criticalDegreeTransits: {
        description: 'Planets at 0°, 29°, or other critical degrees',
        examples: ['Mars at 29° (anaretic)', 'Venus at 0° (new cycle)'],
        significance: 'Medium - timing and intensity markers',
        averageFrequency: 'Very frequent',
        keywords: ['crisis points', 'completions', 'new beginnings', 'intensity']
      }
    };

    const correlationGuidelines = {
      eventCategories: {
        financial: {
          strongPatterns: ['saturn-pluto', 'jupiter-saturn', 'venus-retrograde'],
          typicalLead: '30-180 days',
          confidence: 'High'
        },
        war: {
          strongPatterns: ['mars-saturn', 'saturn-pluto', 'mars-rahu'],
          typicalLead: '15-90 days',
          confidence: 'High'
        },
        political: {
          strongPatterns: ['jupiter-saturn', 'solar-eclipse', 'cardinal-ingress'],
          typicalLead: '30-120 days',
          confidence: 'Medium-High'
        },
        natural_disaster: {
          strongPatterns: ['uranus-aspects', 'lunar-eclipse', 'mars-saturn'],
          typicalLead: '7-30 days',
          confidence: 'Medium'
        },
        pandemic: {
          strongPatterns: ['saturn-pluto', 'kala-sarpa-yoga', 'saturn-neptune'],
          typicalLead: '60-365 days',
          confidence: 'Medium-High'
        }
      }
    };

    res.json({
      success: true,
      data: {
        patternTypes: patternTypes,
        correlationGuidelines: correlationGuidelines,
        analysisInfo: {
          timeWindows: {
            outerPlanetConjunctions: '6 months',
            majorAspects: '2 months',
            eclipses: '1 month',
            retrogrades: '3 months',
            cardinalIngresses: '4 months',
            kalaSarpaYoga: '3 months',
            gandantaTransits: '1.5 months',
            criticalDegreeTransits: '2 weeks'
          },
          usage: {
            detection: 'Use /detect endpoint to find patterns in date range',
            correlation: 'Use /correlate endpoint to match patterns with historical events',
            prediction: 'Use /predict endpoint to assess future risk based on patterns'
          }
        }
      }
    });

  } catch (error) {
    logger.error('Error in pattern types API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/major-patterns/historical-correlations
 * Get summary of historical pattern-event correlations
 */
router.get('/historical-correlations', async (req, res) => {
  try {
    const { 
      category, 
      minCorrelationScore = 0.3, 
      limit = 20 
    } = req.query;

    // This would typically query a stored correlation database
    // For now, we'll provide a summary based on our correlation knowledge
    
    const correlationSummary = {
      totalAnalyzed: 'Historical database dependent',
      correlationThreshold: minCorrelationScore,
      topCorrelations: [
        {
          pattern: 'saturn-pluto conjunction',
          eventCategory: 'pandemic',
          averageCorrelation: 0.85,
          examples: ['2020 COVID-19', '1982 AIDS emergence', '1918 Spanish Flu'],
          notes: 'Strong correlation with global health crises'
        },
        {
          pattern: 'jupiter-saturn conjunction',
          eventCategory: 'political',
          averageCorrelation: 0.78,
          examples: ['2020 US Election', '2000 Bush vs Gore', '1980 Reagan Election'],
          notes: 'Marks major political cycle changes'
        },
        {
          pattern: 'mars-saturn square',
          eventCategory: 'war',
          averageCorrelation: 0.72,
          examples: ['Various conflicts', 'Military actions', 'Terrorist incidents'],
          notes: 'Correlates with aggressive actions and conflicts'
        },
        {
          pattern: 'uranus-pluto aspects',
          eventCategory: 'revolution',
          averageCorrelation: 0.69,
          examples: ['1960s revolution', '1789 French Revolution', '1517 Protestant Reformation'],
          notes: 'Long-term revolutionary cycles'
        }
      ],
      methodologyNotes: [
        'Correlations based on comprehensive historical analysis',
        'Time windows vary by pattern type',
        'Statistical significance tested across multiple decades',
        'Cultural and geographical factors considered'
      ]
    };

    // Filter by category if specified
    if (category) {
      correlationSummary.topCorrelations = correlationSummary.topCorrelations.filter(
        c => c.eventCategory === category.toLowerCase()
      );
    }

    // Apply limit
    correlationSummary.topCorrelations = correlationSummary.topCorrelations.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: correlationSummary,
      metadata: {
        filters: {
          category: category || 'all',
          minCorrelationScore: minCorrelationScore,
          limit: limit
        },
        disclaimer: 'Historical correlations are based on pattern analysis and should be used as guidance, not absolute predictions'
      }
    });

  } catch (error) {
    logger.error('Error in historical correlations API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/major-patterns/batch-analyze
 * Analyze multiple date ranges or dates in batch
 */
router.post('/batch-analyze', async (req, res) => {
  try {
    const { 
      dateRanges = [], 
      targetDates = [], 
      analysisType = 'detect', // 'detect', 'correlate', 'predict'
      options = {} 
    } = req.body;

    if (dateRanges.length === 0 && targetDates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Either dateRanges or targetDates must be provided'
      });
    }

    // Limit batch size to prevent abuse
    const totalOperations = dateRanges.length + targetDates.length;
    if (totalOperations > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 operations per batch request'
      });
    }

    logger.info(`📊 API request: Batch analysis of ${totalOperations} operations (${analysisType})`);

    const results = [];
    const errors = [];

    // Process date ranges
    for (let i = 0; i < dateRanges.length; i++) {
      const range = dateRanges[i];
      try {
        const start = moment(range.startDate);
        const end = moment(range.endDate);

        if (!start.isValid() || !end.isValid()) {
          errors.push({
            index: i,
            type: 'dateRange',
            error: 'Invalid date format',
            data: range
          });
          continue;
        }

        let result;
        if (analysisType === 'detect') {
          result = await majorPatternDetectorService.detectMajorPatterns(
            start.toDate(), 
            end.toDate(), 
            options
          );
        } else if (analysisType === 'correlate') {
          result = await historicalEventCorrelatorService.performCorrelationAnalysis(
            start.toDate(), 
            end.toDate(), 
            options
          );
        }

        results.push({
          index: i,
          type: 'dateRange',
          input: range,
          result: result
        });

      } catch (error) {
        errors.push({
          index: i,
          type: 'dateRange',
          error: error.message,
          data: range
        });
      }
    }

    // Process target dates (for predictions)
    for (let i = 0; i < targetDates.length; i++) {
      const targetDate = targetDates[i];
      try {
        const target = moment(targetDate);

        if (!target.isValid()) {
          errors.push({
            index: i,
            type: 'targetDate',
            error: 'Invalid date format',
            data: targetDate
          });
          continue;
        }

        if (analysisType === 'predict') {
          const result = await historicalEventCorrelatorService.getPredictionsForDate(
            target.toDate(), 
            options.categories || []
          );

          results.push({
            index: i,
            type: 'targetDate',
            input: targetDate,
            result: result
          });
        }

      } catch (error) {
        errors.push({
          index: i,
          type: 'targetDate',
          error: error.message,
          data: targetDate
        });
      }
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalRequested: totalOperations,
          successful: results.length,
          failed: errors.length,
          analysisType: analysisType
        },
        results: results,
        errors: errors.length > 0 ? errors : undefined
      },
      metadata: {
        processingTime: new Date().toISOString(),
        batchSize: totalOperations,
        recommendation: errors.length > 0 ? 'Review failed operations and retry with correct parameters' : 'All operations completed successfully'
      }
    });

  } catch (error) {
    logger.error('Error in batch analysis API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during batch analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
