const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const mlAnalyticsService = require('../services/mlAnalyticsService');
const { supabase } = require('../config/supabase');
const path = require('path');
const fs = require('fs');

/**
 * @route POST /api/ml/risk-assessment
 * @desc Generate ML-based risk assessment for current planetary conditions
 * @access Public
 */
router.post('/risk-assessment', async (req, res) => {
  try {
    logger.info('🔮 ML Risk Assessment request received');
    
    const { location, date, options } = req.body;
    
    // Default location to Global if not provided
    const targetLocation = location || { 
      latitude: 0, 
      longitude: 0, 
      name: 'Global' 
    };
    
    // Default date to current if not provided
    const targetDate = date ? new Date(date) : new Date();
    
    // Generate ML-based risk assessment using instance
    const mlService = new mlAnalyticsService();
    const riskAssessment = await mlService.predictCurrentRiskLevel(
      null, // Let service fetch current planetary data
      {
        location: targetLocation,
        date: targetDate,
        ...options
      }
    );
    
    res.json({
      success: true,
      data: riskAssessment,
      meta: {
        generated_at: new Date().toISOString(),
        model_version: 'enhanced_v1.0',
        location: targetLocation
      }
    });
    
  } catch (error) {
    logger.error('Error in ML risk assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ML risk assessment',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ml/pattern-matching
 * @desc Find patterns matching current planetary configuration
 * @access Public
 */
router.post('/pattern-matching', async (req, res) => {
  try {
    logger.info('🔍 ML Pattern Matching request received');
    
    const { planetary_data, threshold, limit } = req.body;
    
    if (!planetary_data) {
      return res.status(400).json({
        success: false,
        error: 'Planetary data is required'
      });
    }
    
    // Find matching patterns using pattern recognition service
    const patternRecognitionService = require('../services/patternRecognitionService');
    const matchingPatterns = await patternRecognitionService.findMatchingPatterns(planetary_data);
    
    // Filter by threshold if provided
    const filteredPatterns = threshold 
      ? matchingPatterns.filter(p => p.match_strength >= threshold)
      : matchingPatterns;
    
    // Limit results if specified
    const limitedPatterns = limit 
      ? filteredPatterns.slice(0, limit)
      : filteredPatterns;
    
    res.json({
      success: true,
      data: {
        matching_patterns: limitedPatterns,
        total_matches: filteredPatterns.length,
        parameters: {
          threshold: threshold || 0,
          limit: limit || 10
        }
      },
      meta: {
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error in pattern matching:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to match patterns',
      message: error.message
    });
  }
});

/**
 * @route GET /api/ml/models
 * @desc Get information about trained ML models
 * @access Public
 */
router.get('/models', async (req, res) => {
  try {
    logger.info('📊 ML Models info request received');
    
    // Get models from database
    const { data: models, error } = await supabase
      .from('ml_models')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Check for local model files
    const modelFiles = [];
    const modelDir = path.join(__dirname, '..');
    
    try {
      const files = fs.readdirSync(modelDir);
      const pklFiles = files.filter(file => file.endsWith('.pkl'));
      
      pklFiles.forEach(file => {
        const stats = fs.statSync(path.join(modelDir, file));
        modelFiles.push({
          filename: file,
          size: stats.size,
          modified: stats.mtime,
          type: file.includes('scaler') ? 'scaler' : 'model'
        });
      });
    } catch (err) {
      logger.warn('Could not read model files:', err.message);
    }
    
    res.json({
      success: true,
      data: {
        database_models: models || [],
        local_model_files: modelFiles,
        total_models: (models?.length || 0),
        local_files_count: modelFiles.length
      },
      meta: {
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error fetching ML models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ML models',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ml/train
 * @desc Trigger ML model training using current astrological patterns
 * @access Public
 */
router.post('/train', async (req, res) => {
  try {
    logger.info('🏋️ ML Training request received');
    
    const { categories, retrain, options } = req.body;
    
    // Start training process using groupHistoricalEventsByCategory
    const mlService = new mlAnalyticsService();
    const trainingResult = await mlService.groupHistoricalEventsByCategory({
      start_date: options?.start_date || '2000-01-01',
      end_date: options?.end_date || new Date().toISOString(),
      min_impact_level: options?.min_impact_level || 'medium',
      ...options
    });
    
    res.json({
      success: true,
      data: trainingResult,
      meta: {
        training_started_at: new Date().toISOString(),
        categories: categories || ['financial', 'political', 'natural_disaster', 'pandemic']
      }
    });
    
  } catch (error) {
    logger.error('Error in ML training:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start ML training',
      message: error.message
    });
  }
});

/**
 * @route GET /api/ml/predictions
 * @desc Get recent ML predictions
 * @access Public
 */
router.get('/predictions', async (req, res) => {
  try {
    logger.info('📈 ML Predictions request received');
    
    const { limit = 10, category, risk_level, days_back = 30 } = req.query;
    
    let query = supabase
      .from('ml_predictions')
      .select('*')
      .gte('created_at', new Date(Date.now() - days_back * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (category) {
      query = query.contains('category_predictions', { [category]: {} });
    }
    
    if (risk_level) {
      query = query.eq('risk_level', risk_level.toUpperCase());
    }
    
    const { data: predictions, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get summary statistics
    const stats = {
      total_predictions: predictions?.length || 0,
      risk_distribution: {},
      avg_confidence: 0
    };
    
    if (predictions && predictions.length > 0) {
      predictions.forEach(pred => {
        stats.risk_distribution[pred.risk_level] = (stats.risk_distribution[pred.risk_level] || 0) + 1;
      });
      
      const totalConfidence = predictions.reduce((sum, pred) => sum + (pred.confidence_score || 0), 0);
      stats.avg_confidence = totalConfidence / predictions.length;
    }
    
    res.json({
      success: true,
      data: {
        predictions: predictions || [],
        statistics: stats,
        filters: {
          limit: parseInt(limit),
          category,
          risk_level,
          days_back: parseInt(days_back)
        }
      },
      meta: {
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error fetching ML predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ML predictions',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ml/predict-with-file
 * @desc Use local trained model files for prediction
 * @access Public
 */
router.post('/predict-with-file', async (req, res) => {
  try {
    logger.info('🤖 Local Model Prediction request received');
    
    const { features, model_name = 'enhanced_astrological_model' } = req.body;
    
    if (!features || !Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        error: 'Features array is required'
      });
    }
    
    // Check if model files exist
    const modelPath = path.join(__dirname, '..', `${model_name}.pkl`);
    const scalerPath = path.join(__dirname, '..', `enhanced_astrological_scaler.pkl`);
    
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({
        success: false,
        error: `Model file not found: ${model_name}.pkl`
      });
    }
    
    // Call Python script for actual prediction
    const { spawn } = require('child_process');
    const pythonScript = path.join(__dirname, '..', 'ml_predict.py');
    
    const python = spawn('python3', [pythonScript, 'predict', JSON.stringify(features), model_name]);
    
    let result = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        logger.error('Python script error:', error);
        return res.status(500).json({
          success: false,
          error: 'Python prediction script failed',
          details: error
        });
      }
      
      try {
        const prediction = JSON.parse(result);
        
        res.json({
          success: true,
          data: prediction,
          meta: {
            model_path: modelPath,
            scaler_path: scalerPath,
            prediction_time: new Date().toISOString(),
            python_script: pythonScript
          }
        });
      } catch (parseError) {
        logger.error('Error parsing Python output:', parseError);
        res.status(500).json({
          success: false,
          error: 'Failed to parse prediction result',
          raw_output: result
        });
      }
    });
    
  } catch (error) {
    logger.error('Error in local model prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make prediction with local model',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ml/predict-pattern
 * @desc Predict astrological pattern success using trained model
 * @access Public
 */
router.post('/predict-pattern', async (req, res) => {
  try {
    logger.info('🔮 Pattern Prediction request received');
    
    const patternData = req.body;
    
    if (!patternData) {
      return res.status(400).json({
        success: false,
        error: 'Pattern data is required'
      });
    }
    
    // Call Python script for pattern prediction
    const { spawn } = require('child_process');
    const pythonScript = path.join(__dirname, '..', 'ml_predict.py');
    
    const python = spawn('python3', [pythonScript, 'pattern-predict', JSON.stringify(patternData)]);
    
    let result = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        logger.error('Python pattern prediction error:', error);
        return res.status(500).json({
          success: false,
          error: 'Python pattern prediction script failed',
          details: error
        });
      }
      
      try {
        const prediction = JSON.parse(result);
        
        res.json({
          success: true,
          data: prediction,
          meta: {
            input_pattern: patternData,
            prediction_time: new Date().toISOString(),
            python_script: pythonScript
          }
        });
      } catch (parseError) {
        logger.error('Error parsing Python pattern prediction output:', parseError);
        res.status(500).json({
          success: false,
          error: 'Failed to parse pattern prediction result',
          raw_output: result
        });
      }
    });
    
  } catch (error) {
    logger.error('Error in pattern prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make pattern prediction',
      message: error.message
    });
  }
});

/**
 * @route GET /api/ml/status
 * @desc Get ML system status and health
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    logger.info('🔍 ML Status check request received');
    
    // Check database connectivity
    const { data: modelsCount, error: modelsError } = await supabase
      .from('ml_models')
      .select('id', { count: 'exact' });
    
    const { data: predictionsCount, error: predictionsError } = await supabase
      .from('ml_predictions')
      .select('id', { count: 'exact' });
    
    const { data: patternsCount, error: patternsError } = await supabase
      .from('astrological_patterns')
      .select('id', { count: 'exact' });
    
    // Check local model files
    const modelDir = path.join(__dirname, '..');
    const modelFiles = fs.readdirSync(modelDir).filter(file => file.endsWith('.pkl'));
    
    const status = {
      database: {
        connected: !modelsError && !predictionsError && !patternsError,
        ml_models_count: modelsCount?.length || 0,
        predictions_count: predictionsCount?.length || 0,
        patterns_count: patternsCount?.length || 0
      },
      local_models: {
        available: modelFiles.length > 0,
        files: modelFiles,
        count: modelFiles.length
      },
      services: {
        ml_analytics: !!mlAnalyticsService,
        pattern_recognition: true
      },
      last_check: new Date().toISOString()
    };
    
    const overallHealth = status.database.connected && status.local_models.available;
    
    res.json({
      success: true,
      healthy: overallHealth,
      data: status,
      meta: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });
    
  } catch (error) {
    logger.error('Error checking ML status:', error);
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'Failed to check ML system status',
      message: error.message
    });
  }
});

module.exports = router;
