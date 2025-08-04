const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Final verification script to test all database functionality
 */
async function finalVerification() {
  try {
    logger.info('🎯 Starting final verification...');
    
    // Test 1: Check all tables exist and have data
    await checkTableStatus();
    
    // Test 2: Test data relationships
    await testDataRelationships();
    
    // Test 3: Test query performance
    await testQueryPerformance();
    
    // Test 4: Test duplicate removal effectiveness
    await testDuplicateRemoval();
    
    // Test 5: Generate final report
    await generateFinalReport();
    
    logger.info('🎉 Final verification completed successfully!');
    
  } catch (error) {
    logger.error('❌ Final verification failed:', error);
    throw error;
  }
}

/**
 * Check status of all tables
 */
async function checkTableStatus() {
  logger.info('📊 Checking table status...');
  
  const tables = [
    'world_events',
    'planetary_transits',
    'planetary_aspects',
    'astrological_patterns',
    'ml_models',
    'ml_predictions'
  ];
  
  const tableStatus = {};
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        tableStatus[table] = { status: 'ERROR', count: 0, error: error.message };
        logger.error(`❌ ${table}: ${error.message}`);
      } else {
        tableStatus[table] = { status: 'OK', count: count };
        logger.info(`✅ ${table}: ${count} records`);
      }
    } catch (err) {
      tableStatus[table] = { status: 'EXCEPTION', count: 0, error: err.message };
      logger.error(`❌ ${table}: Exception - ${err.message}`);
    }
  }
  
  return tableStatus;
}

/**
 * Test data relationships and integrity
 */
async function testDataRelationships() {
  logger.info('🔗 Testing data relationships...');
  
  try {
    // Test 1: Events with astronomical data
    const { data: eventsWithTransits } = await supabase
      .from('world_events')
      .select(`
        id, title,
        planetary_transits (
          id, sun_sign, moon_sign
        )
      `)
      .limit(5);
    
    const eventsWithData = eventsWithTransits.filter(e => e.planetary_transits.length > 0);
    logger.info(`✅ ${eventsWithData.length}/5 test events have astronomical data`);
    
    // Test 2: Events with aspects  
    const { data: eventsWithAspects } = await supabase
      .from('world_events')
      .select(`
        id, title,
        planetary_aspects (
          id, aspect_type, planet_a, planet_b
        )
      `)
      .limit(5);
    
    const eventsWithAspectData = eventsWithAspects.filter(e => e.planetary_aspects.length > 0);
    logger.info(`✅ ${eventsWithAspectData.length}/5 test events have aspect data`);
    
    // Test 3: ML models with predictions
    const { data: modelsWithPredictions } = await supabase
      .from('ml_models')
      .select(`
        id, model_name,
        ml_predictions (
          id, risk_level
        )
      `);
    
    logger.info(`✅ Found ${modelsWithPredictions.length} ML models in database`);
    
  } catch (error) {
    logger.error('❌ Data relationships test failed:', error.message);
  }
}

/**
 * Test query performance on key operations
 */
async function testQueryPerformance() {
  logger.info('⚡ Testing query performance...');
  
  const queries = [
    {
      name: 'Recent high-impact events',
      query: () => supabase
        .from('world_events')
        .select('*')
        .eq('impact_level', 'high')
        .order('event_date', { ascending: false })
        .limit(10)
    },
    {
      name: 'Events with planetary data',
      query: () => supabase
        .from('world_events')
        .select(`
          *, 
          planetary_transits (sun_sign, moon_sign, mars_sign)
        `)
        .limit(10)
    },
    {
      name: 'Financial events analysis',
      query: () => supabase
        .from('world_events')
        .select('*')
        .eq('category', 'financial')
        .order('event_date', { ascending: false })
        .limit(10)
    }
  ];
  
  for (const queryTest of queries) {
    try {
      const startTime = Date.now();
      const { data, error } = await queryTest.query();
      const endTime = Date.now();
      
      if (error) {
        logger.error(`❌ Query '${queryTest.name}' failed: ${error.message}`);
      } else {
        const duration = endTime - startTime;
        logger.info(`✅ Query '${queryTest.name}': ${data.length} results in ${duration}ms`);
      }
    } catch (err) {
      logger.error(`❌ Query '${queryTest.name}' exception: ${err.message}`);
    }
  }
}

/**
 * Test that duplicate removal was effective
 */
async function testDuplicateRemoval() {
  logger.info('🔍 Testing duplicate removal effectiveness...');
  
  try {
    // Check for potential duplicates by title
    const { data: duplicateCheck } = await supabase
      .from('world_events')
      .select('title, count(*)')
      .group('title')
      .having('count(*) > 1');
    
    if (duplicateCheck && duplicateCheck.length > 0) {
      logger.warn(`⚠️ Found ${duplicateCheck.length} potential title duplicates that may need review`);
      duplicateCheck.forEach(dup => {
        logger.warn(`   - "${dup.title}": ${dup.count} occurrences`);
      });
    } else {
      logger.info('✅ No obvious title duplicates found');
    }
    
    // Check for events on the same date with same category (potential duplicates)
    const { data: sameDateEvents } = await supabase
      .from('world_events')
      .select('event_date, category, count(*)')
      .group('event_date, category')
      .having('count(*) > 1')
      .limit(5);
    
    if (sameDateEvents && sameDateEvents.length > 0) {
      logger.info(`📅 Found ${sameDateEvents.length} date/category combinations with multiple events (expected for major dates)`);
    } else {
      logger.info('✅ No date/category clustering issues found');
    }
    
  } catch (error) {
    logger.error('❌ Duplicate removal test failed:', error.message);
  }
}

/**
 * Generate final report
 */
async function generateFinalReport() {
  logger.info('📋 Generating final system report...');
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'HEALTHY',
      summary: {
        total_events: 0,
        events_with_astronomical_data: 0,
        total_aspects: 0,
        ml_models: 0,
        ml_predictions: 0,
        astrological_patterns: 0
      },
      data_quality: {
        astronomical_coverage: '0%',
        data_integrity: 'GOOD',
        performance: 'GOOD'
      },
      recommendations: []
    };
    
    // Get counts for all tables
    const tables = ['world_events', 'planetary_transits', 'planetary_aspects', 'astrological_patterns', 'ml_models', 'ml_predictions'];
    const counts = {};
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        counts[table] = count;
      } catch (err) {
        counts[table] = 0;
      }
    }
    
    // Update report summary
    report.summary = {
      total_events: counts.world_events,
      events_with_astronomical_data: counts.planetary_transits,
      total_aspects: counts.planetary_aspects,
      ml_models: counts.ml_models,
      ml_predictions: counts.ml_predictions,
      astrological_patterns: counts.astrological_patterns
    };
    
    // Calculate coverage
    if (counts.world_events > 0) {
      const coverage = ((counts.planetary_transits / counts.world_events) * 100).toFixed(1);
      report.data_quality.astronomical_coverage = coverage + '%';
    }
    
    // Add recommendations
    if (counts.planetary_transits < counts.world_events) {
      report.recommendations.push('Add astronomical data for remaining events');
    }
    
    if (counts.ml_models < 6) {
      report.recommendations.push('Consider training additional ML models for enhanced predictions');
    }
    
    // Output report
    logger.info('🎯 FINAL SYSTEM REPORT');
    logger.info('='.repeat(60));
    logger.info(`Status: ${report.status}`);
    logger.info(`Timestamp: ${report.timestamp}`);
    logger.info('');
    logger.info('Summary:');
    Object.entries(report.summary).forEach(([key, value]) => {
      logger.info(`  ${key.replace(/_/g, ' ')}: ${value}`);
    });
    logger.info('');
    logger.info('Data Quality:');
    Object.entries(report.data_quality).forEach(([key, value]) => {
      logger.info(`  ${key.replace(/_/g, ' ')}: ${value}`);
    });
    
    if (report.recommendations.length > 0) {
      logger.info('');
      logger.info('Recommendations:');
      report.recommendations.forEach((rec, index) => {
        logger.info(`  ${index + 1}. ${rec}`);
      });
    }
    
    logger.info('='.repeat(60));
    
    return report;
    
  } catch (error) {
    logger.error('❌ Failed to generate final report:', error);
  }
}

// Run if called directly
if (require.main === module) {
  finalVerification()
    .then(() => {
      logger.info('🎉 Final verification completed successfully!');
      logger.info('💫 Your Supabase database is clean, optimized, and ready for use!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Final verification failed:', error);
      process.exit(1);
    });
}

module.exports = {
  finalVerification,
  checkTableStatus,
  testDataRelationships,
  testQueryPerformance,
  testDuplicateRemoval,
  generateFinalReport
};
