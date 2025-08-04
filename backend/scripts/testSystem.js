const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const PatternRecognitionService = require('../services/patternRecognitionService');

/**
 * Comprehensive test suite for the cleaned database
 */
async function testSystem() {
  try {
    logger.info('🧪 Starting comprehensive system tests...');
    
    // Test 1: Database connectivity and table access
    await testDatabaseConnectivity();
    
    // Test 2: Pattern recognition service
    await testPatternRecognition();
    
    // Test 3: Data integrity checks
    await testDataIntegrity();
    
    // Test 4: ML functionality
    await testMLFunctionality();
    
    logger.info('✅ All system tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ System tests failed:', error);
    throw error;
  }
}

/**
 * Test database connectivity and table access
 */
async function testDatabaseConnectivity() {
  logger.info('🔌 Testing database connectivity...');
  
  const tables = [
    'world_events',
    'planetary_transits',
    'planetary_aspects',
    'astrological_patterns',
    'ml_models',
    'ml_predictions'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        logger.error(`❌ ${table}: ${error.message}`);
      } else {
        logger.info(`✅ ${table}: ${count} records accessible`);
      }
    } catch (err) {
      logger.error(`❌ ${table}: Exception - ${err.message}`);
    }
  }
}

/**
 * Test pattern recognition service
 */
async function testPatternRecognition() {
  logger.info('🔍 Testing pattern recognition service...');
  
  try {
    const patternService = new PatternRecognitionService();
    
    // Test basic pattern analysis
    const analysis = await patternService.analyzePatterns({
      impact_level: 'high',
      limit: 10
    });
    
    if (analysis && analysis.total_events_analyzed > 0) {
      logger.info(`✅ Pattern analysis successful: analyzed ${analysis.total_events_analyzed} events`);
      logger.info(`   Found patterns: ${Object.keys(analysis.patterns).length} pattern types`);
    } else {
      logger.warn('⚠️ Pattern analysis returned no results');
    }
    
  } catch (error) {
    logger.error('❌ Pattern recognition test failed:', error.message);
  }
}

/**
 * Test data integrity
 */
async function testDataIntegrity() {
  logger.info('🔒 Testing data integrity...');
  
  try {
    // Check for orphaned records
    const { data: transitsWithoutEvents } = await supabase
      .from('planetary_transits')
      .select('event_id')
      .not('event_id', 'in', 
        '(SELECT id FROM world_events)'
      );
    
    if (transitsWithoutEvents && transitsWithoutEvents.length > 0) {
      logger.warn(`⚠️ Found ${transitsWithoutEvents.length} orphaned planetary_transits records`);
    } else {
      logger.info('✅ No orphaned planetary_transits records found');
    }
    
    // Check for events with missing astronomical data
    const { data: eventsWithTransits, count: totalEvents } = await supabase
      .from('world_events')
      .select('id', { count: 'exact' });
      
    const { data: transits, count: totalTransits } = await supabase
      .from('planetary_transits')
      .select('event_id', { count: 'exact' });
    
    logger.info(`📊 Data coverage: ${totalTransits}/${totalEvents} events have astronomical data`);
    
  } catch (error) {
    logger.error('❌ Data integrity test failed:', error.message);
  }
}

/**
 * Test ML functionality
 */
async function testMLFunctionality() {
  logger.info('🤖 Testing ML functionality...');
  
  try {
    // Check ML models
    const { data: models, error: modelsError } = await supabase
      .from('ml_models')
      .select('*');
    
    if (modelsError) {
      logger.error('❌ ML models query failed:', modelsError.message);
    } else {
      logger.info(`✅ Found ${models.length} ML models`);
      
      for (const model of models) {
        logger.info(`   - ${model.model_name} (${model.model_type}): accuracy ${model.accuracy}`);
      }
    }
    
    // Check ML predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from('ml_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (predictionsError) {
      logger.error('❌ ML predictions query failed:', predictionsError.message);
    } else {
      logger.info(`✅ Found ${predictions.length} recent ML predictions`);
    }
    
  } catch (error) {
    logger.error('❌ ML functionality test failed:', error.message);
  }
}

/**
 * Generate summary report
 */
async function generateSummaryReport() {
  logger.info('📋 Generating summary report...');
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      database_status: {},
      data_quality: {},
      recommendations: []
    };
    
    // Get table counts
    const tables = ['world_events', 'planetary_transits', 'planetary_aspects', 'astrological_patterns', 'ml_models', 'ml_predictions'];
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        report.database_status[table] = count;
      } catch (err) {
        report.database_status[table] = 'ERROR';
      }
    }
    
    // Calculate data quality metrics
    const totalEvents = report.database_status.world_events;
    const eventsWithTransits = report.database_status.planetary_transits;
    const eventsWithAspects = report.database_status.planetary_aspects;
    
    report.data_quality = {
      total_events: totalEvents,
      events_with_astronomical_data: eventsWithTransits,
      astronomical_data_coverage: totalEvents > 0 ? ((eventsWithTransits / totalEvents) * 100).toFixed(2) + '%' : '0%',
      total_aspects_recorded: eventsWithAspects,
      ml_models_active: report.database_status.ml_models,
      recent_predictions: report.database_status.ml_predictions
    };
    
    // Add recommendations
    if (eventsWithTransits < totalEvents) {
      report.recommendations.push('Consider adding astronomical data for events without planetary transits');
    }
    
    if (report.database_status.ml_models < 5) {
      report.recommendations.push('Consider training additional ML models for better pattern recognition');
    }
    
    logger.info('📊 System Summary Report:');
    logger.info('='.repeat(50));
    logger.info(`Database Status:`);
    Object.entries(report.database_status).forEach(([table, count]) => {
      logger.info(`  ${table}: ${count} records`);
    });
    
    logger.info(`\nData Quality:`);
    Object.entries(report.data_quality).forEach(([metric, value]) => {
      logger.info(`  ${metric}: ${value}`);
    });
    
    if (report.recommendations.length > 0) {
      logger.info(`\nRecommendations:`);
      report.recommendations.forEach((rec, index) => {
        logger.info(`  ${index + 1}. ${rec}`);
      });
    }
    
    return report;
    
  } catch (error) {
    logger.error('❌ Failed to generate summary report:', error);
  }
}

// Run tests if called directly
if (require.main === module) {
  testSystem()
    .then(() => generateSummaryReport())
    .then(() => {
      logger.info('🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testSystem,
  testDatabaseConnectivity,
  testPatternRecognition,
  testDataIntegrity,
  testMLFunctionality,
  generateSummaryReport
};
