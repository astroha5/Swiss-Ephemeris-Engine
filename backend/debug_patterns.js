const patternRecognitionService = require('./services/patternRecognitionService');
const logger = require('./utils/logger');

async function debugPatterns() {
  try {
    logger.info('🔍 Starting debug pattern analysis...');
    
    // Get events for analysis with detailed logging
    const events = await patternRecognitionService.getEventsForAnalysis({
      impact_level: 'high',
      limit: 5
    });
    
    logger.info(`Found ${events.length} events`);
    
    // Check the first event structure
    if (events.length > 0) {
      const firstEvent = events[0];
      console.log('\nFirst event structure:');
      console.log('  Title:', firstEvent.title);
      console.log('  Has planetary_snapshot:', !!firstEvent.planetary_snapshot);
      console.log('  Has planetary_transits:', firstEvent.planetary_transits?.length || 0);
      console.log('  Has planetary_aspects:', firstEvent.planetary_aspects?.length || 0);
      
      if (firstEvent.planetary_snapshot) {
        console.log('\nPlanetary snapshot sample:');
        console.log('  Sun:', firstEvent.planetary_snapshot.sun);
        console.log('  Moon:', firstEvent.planetary_snapshot.moon);
        console.log('  Mars:', firstEvent.planetary_snapshot.mars);
        console.log('  Aspects count:', firstEvent.planetary_snapshot.aspects?.length || 0);
      }
      
      if (firstEvent.planetary_transits && firstEvent.planetary_transits.length > 0) {
        console.log('\nTransit data sample:');
        console.log(JSON.stringify(firstEvent.planetary_transits[0], null, 2));
      }
    }
    
    // Test the conversion function directly
    const sampleSnapshot = {
      "sun": "Gemini 18.08°",
      "moon": "Libra 1.08° (Chitra)",
      "mars": "Leo 15.30°",
      "jupiter": "Gemini 11.28°"
    };
    
    const converted = patternRecognitionService.convertSnapshotToTransitFormat(sampleSnapshot);
    logger.info('Conversion test:', converted);
    
  } catch (error) {
    logger.error('Debug error:', error);
  }
}

debugPatterns();
