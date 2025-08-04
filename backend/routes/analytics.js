const express = require('express');
const router = express.Router();
const mlAnalyticsService = require('../services/mlAnalyticsService');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

/**
 * POST /api/analytics/train-models
 * Train ML models from historical data
 */
router.post('/train-models', async (req, res) => {
  try {
    logger.info('🤖 ML Model Training endpoint called');
    
    const options = {
      start_date: req.body.start_date || '2000-01-01',
      end_date: req.body.end_date || new Date().toISOString(),
      min_impact_level: req.body.min_impact_level || 'medium',
      categories: req.body.categories // Optional specific categories
    };

    const trainingResult = await mlAnalyticsService.groupHistoricalEventsByCategory(options);
    
    res.json({
      success: true,
      message: 'ML model training completed successfully',
      data: trainingResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in ML training endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to train ML models'
    });
  }
});

/**
 * GET /api/analytics/risk-level
 * Get current risk level assessment using ML models
 */
router.get('/risk-level', async (req, res) => {
  try {
    logger.info('🔮 Risk Level Assessment endpoint called');
    
    const options = {
      date: req.query.date ? new Date(req.query.date) : new Date(),
      location: {
        latitude: parseFloat(req.query.latitude) || 0,
        longitude: parseFloat(req.query.longitude) || 0,
        name: req.query.location_name || 'Global'
      }
    };

    const riskAssessment = await mlAnalyticsService.predictCurrentRiskLevel(null, options);
    
    res.json({
      success: true,
      data: riskAssessment,
      message: `Risk assessment completed: ${riskAssessment.risk_level} level`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in risk level endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to assess risk level'
    });
  }
});

/**
 * POST /api/analytics/risk-level
 * Assess risk level for specific planetary data
 */
router.post('/risk-level', async (req, res) => {
  try {
    logger.info('🔮 ML Risk Level Assessment with data endpoint called');
    
    const { planetary_data, date, location } = req.body;
    
    const options = {
      date: date ? new Date(date) : new Date(),
      location: location || { latitude: 0, longitude: 0, name: 'Global' }
    };

    const riskAssessment = await mlAnalyticsService.predictCurrentRiskLevel(planetary_data, options);
    
    res.json({
      success: true,
      data: riskAssessment,
      message: `ML Risk assessment completed: ${riskAssessment.risk_level} level (${(riskAssessment.overall_risk_score * 100).toFixed(1)}%)`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in ML risk assessment endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to assess risk level with ML'
    });
  }
});

/**
 * GET /api/analytics/models
 * Get information about trained ML models
 */
router.get('/models', async (req, res) => {
  try {
    const filters = {
      model_type: req.query.model_type,
      category: req.query.category,
      is_active: req.query.is_active !== 'false' // Default to true
    };

    let query = supabase
      .from('ml_models')
      .select('*');

    if (filters.model_type) {
      query = query.eq('model_type', filters.model_type);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.is_active) {
      query = query.eq('is_active', true);
    }

    query = query.order('accuracy', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Get model performance data
    const modelNames = data.map(m => m.model_name);
    const { data: performanceData } = await supabase
      .from('ml_model_performance')
      .select('*')
      .in('model_name', modelNames)
      .order('evaluation_date', { ascending: false });

    // Combine model data with latest performance
    const modelsWithPerformance = data.map(model => {
      const latestPerformance = performanceData?.find(p => p.model_name === model.model_name);
      return {
        ...model,
        latest_performance: latestPerformance,
        model_data: undefined // Don't send full model data in list view
      };
    });

    res.json({
      success: true,
      data: modelsWithPerformance,
      count: modelsWithPerformance.length,
      filters: filters
    });

  } catch (error) {
    logger.error('Error fetching ML models:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch ML models'
    });
  }
});

/**
 * GET /api/analytics/predictions
 * Get ML predictions history
 */
router.get('/predictions', async (req, res) => {
  try {
    const filters = {
      risk_level: req.query.risk_level,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      location: req.query.location,
      was_accurate: req.query.was_accurate,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    let query = supabase
      .from('ml_predictions')
      .select('*');

    if (filters.risk_level) {
      query = query.eq('risk_level', filters.risk_level);
    }

    if (filters.start_date) {
      query = query.gte('prediction_date', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('prediction_date', filters.end_date);
    }

    if (filters.location) {
      query = query.ilike('location->>name', `%${filters.location}%`);
    }

    if (filters.was_accurate !== undefined) {
      query = query.eq('was_accurate', filters.was_accurate === 'true');
    }

    query = query
      .order('prediction_date', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: count
      },
      filters: filters
    });

  } catch (error) {
    logger.error('Error fetching ML predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch ML predictions'
    });
  }
});

/**
 * GET /api/analytics/model-performance/:modelName
 * Get performance metrics for a specific model
 */
router.get('/model-performance/:modelName', async (req, res) => {
  try {
    const modelName = req.params.modelName;
    const days = parseInt(req.query.days) || 30;

    const { data, error } = await supabase
      .from('ml_model_performance')
      .select('*')
      .eq('model_name', modelName)
      .gte('evaluation_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('evaluation_date', { ascending: false });

    if (error) throw error;

    // Calculate trends
    const performance = data || [];
    const trends = {
      accuracy_trend: calculateTrend(performance.map(p => p.accuracy)),
      precision_trend: calculateTrend(performance.map(p => p.precision)),
      recall_trend: calculateTrend(performance.map(p => p.recall))
    };

    // Check for model drift
    const { data: driftCheck } = await supabase
      .rpc('detect_model_drift', { p_model_name: modelName });

    res.json({
      success: true,
      data: {
        model_name: modelName,
        performance_history: performance,
        trends: trends,
        drift_detected: driftCheck,
        evaluation_period_days: days
      }
    });

  } catch (error) {
    logger.error('Error fetching model performance:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch model performance'
    });
  }
});


/**
 * GET /api/analytics/risk-alerts
 * Get active risk alerts
 */
router.get('/risk-alerts', async (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'ACTIVE',
      risk_level: req.query.risk_level,
      alert_type: req.query.alert_type,
      limit: parseInt(req.query.limit) || 20
    };

    let query = supabase
      .from('risk_alerts')
      .select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.risk_level) {
      query = query.eq('risk_level', filters.risk_level);
    }

    if (filters.alert_type) {
      query = query.eq('alert_type', filters.alert_type);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters.limit);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      filters: filters
    });

  } catch (error) {
    logger.error('Error fetching risk alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch risk alerts'
    });
  }
});

/**
 * POST /api/analytics/validate-prediction/:predictionId
 * Manually validate a prediction's accuracy
 */
router.post('/validate-prediction/:predictionId', async (req, res) => {
  try {
    const predictionId = req.params.predictionId;
    const { was_accurate, actual_events, notes } = req.body;

    const { data, error } = await supabase
      .from('ml_predictions')
      .update({
        was_accurate: was_accurate,
        actual_events: actual_events,
        user_feedback: { validation_notes: notes, validated_at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      })
      .eq('id', predictionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: 'Prediction validation updated successfully'
    });

  } catch (error) {
    logger.error('Error validating prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to validate prediction'
    });
  }
});

/**
 * GET /api/analytics/dashboard-stats
 * Get dashboard statistics for ML analytics
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Get various statistics in parallel
    const [modelsResult, predictionsResult, alertsResult, accuracyResult] = await Promise.all([
      supabase.from('ml_models').select('count', { count: 'exact' }).eq('is_active', true),
      supabase.from('ml_predictions').select('count', { count: 'exact' }).gte('prediction_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('risk_alerts').select('count', { count: 'exact' }).eq('status', 'ACTIVE'),
      supabase.from('ml_predictions').select('was_accurate, risk_level').not('was_accurate', 'is', null)
    ]);

    // Calculate accuracy statistics
    const accuracyData = accuracyResult.data || [];
    const totalValidated = accuracyData.length;
    const accurate = accuracyData.filter(p => p.was_accurate).length;
    const overallAccuracy = totalValidated > 0 ? (accurate / totalValidated) * 100 : 0;

    // Calculate accuracy by risk level
    const accuracyByRisk = {};
    ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'].forEach(level => {
      const levelPredictions = accuracyData.filter(p => p.risk_level === level);
      const levelAccurate = levelPredictions.filter(p => p.was_accurate).length;
      accuracyByRisk[level] = levelPredictions.length > 0 ? (levelAccurate / levelPredictions.length) * 100 : 0;
    });

    const stats = {
      active_models: modelsResult.count || 0,
      recent_predictions: predictionsResult.count || 0,
      active_alerts: alertsResult.count || 0,
      overall_accuracy: Math.round(overallAccuracy * 100) / 100,
      predictions_validated: totalValidated,
      accuracy_by_risk_level: accuracyByRisk,
      generated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Helper function to calculate trend
function calculateTrend(values) {
  if (!values || values.length < 2) return 'stable';
  
  const recentValues = values.slice(0, Math.min(5, values.length));
  const olderValues = values.slice(Math.min(5, values.length));
  
  if (olderValues.length === 0) return 'stable';
  
  const recentAvg = recentValues.reduce((a, b) => (a || 0) + (b || 0), 0) / recentValues.length;
  const olderAvg = olderValues.reduce((a, b) => (a || 0) + (b || 0), 0) / olderValues.length;
  
  const difference = recentAvg - olderAvg;
  const threshold = olderAvg * 0.05; // 5% threshold
  
  if (Math.abs(difference) < threshold) return 'stable';
  return difference > 0 ? 'improving' : 'declining';
}

module.exports = router;
