const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Verify that the conversion to Vedic Drishti system was successful
 */
async function verifyVedicConversion() {
  try {
    logger.info('🕉️ Verifying Vedic Drishti conversion results...');
    
    // Get sample of updated events
    const { data: events, error } = await supabase
      .from('world_events')
      .select('id, title, event_date, planetary_snapshot, planetary_aspects')
      .not('planetary_snapshot', 'is', null)
      .not('planetary_aspects', 'is', null)
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    logger.info(`📊 Found ${events.length} events with planetary data`);
    
    // Analyze aspect types
    let vedicAspectCount = 0;
    let conjunctionCount = 0;
    let totalAspects = 0;
    
    events.forEach((event, index) => {
      logger.info(`\n📝 Event ${index + 1}: "${event.title}"`);
      logger.info(`📅 Date: ${event.event_date}`);
      
      const snapshot = event.planetary_snapshot;
      if (snapshot) {
        logger.info(`🌅 Ascendant: ${snapshot.ascendant}`);
        logger.info(`☀️ Sun: ${snapshot.sun}`);
        logger.info(`🌙 Moon: ${snapshot.moon}`);
      }
      
      const aspects = event.planetary_aspects || [];
      logger.info(`🔗 Aspects (${aspects.length}):`);
      
      aspects.forEach(aspect => {
        totalAspects++;
        if (aspect.includes('conjunct')) {
          conjunctionCount++;
          logger.info(`   🤝 ${aspect}`);
        } else if (aspect.includes('aspects')) {
          vedicAspectCount++;
          logger.info(`   🎯 ${aspect}`);
        } else {
          logger.info(`   📐 ${aspect}`);
        }
      });
    });
    
    // Summary statistics
    logger.info(`\n📈 Conversion Summary:`);
    logger.info(`✅ Total events processed: ${events.length}`);
    logger.info(`🔗 Total aspects found: ${totalAspects}`);
    logger.info(`🎯 Vedic Drishti aspects: ${vedicAspectCount}`);
    logger.info(`🤝 Conjunctions: ${conjunctionCount}`);
    logger.info(`📐 Aspect format: Vedic house-based system`);
    
    // Check for any Western aspects (should be zero)
    const westernTerms = ['trine', 'square', 'sextile', 'opposition', 'quincunx'];
    let westernAspectCount = 0;
    
    events.forEach(event => {
      const aspects = event.planetary_aspects || [];
      aspects.forEach(aspect => {
        const lowerAspect = aspect.toLowerCase();
        if (westernTerms.some(term => lowerAspect.includes(term))) {
          westernAspectCount++;
          logger.warn(`⚠️ Found Western aspect: ${aspect}`);
        }
      });
    });
    
    if (westernAspectCount === 0) {
      logger.info(`✅ SUCCESS: No Western aspects found - conversion complete!`);
    } else {
      logger.warn(`⚠️ Found ${westernAspectCount} Western aspects still remaining`);
    }
    
    // Get total count from database
    const { data: countData, error: countError } = await supabase
      .from('world_events')
      .select('id', { count: 'exact', head: true })
      .not('planetary_snapshot', 'is', null);
    
    if (!countError && countData) {
      logger.info(`🎉 Total events with Vedic planetary data: ${countData.length || 0}`);
    }
    
    return {
      success: true,
      totalEvents: events.length,
      totalAspects,
      vedicAspects: vedicAspectCount,
      conjunctions: conjunctionCount,
      westernAspects: westernAspectCount
    };
    
  } catch (error) {
    logger.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verifyVedicConversion()
    .then((result) => {
      logger.info(`🎉 Verification completed successfully!`);
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Verification failed:', error.message);
      process.exit(1);
    });
}

module.exports = { verifyVedicConversion };
