const patternRecognitionService = require('./services/patternRecognitionService');
const { supabase } = require('./config/supabase');

async function testPatternAnalysis() {
  try {
    console.log('🔍 Testing pattern analysis directly...');
    
    // Get a few events
    const { data: events, error } = await supabase
      .from('world_events')
      .select('*')
      .eq('impact_level', 'high')
      .limit(5);
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    console.log(`Found ${events.length} events`);
    
    // Process events and test sign pattern analysis
    const eventsWithData = events.map(event => {
      const eventTransits = event.planetary_snapshot ? [patternRecognitionService.convertSnapshotToTransitFormat(event.planetary_snapshot)] : [];
      const eventAspects = event.planetary_snapshot?.aspects || [];
      
      return {
        ...event,
        planetary_transits: eventTransits,
        planetary_aspects: eventAspects
      };
    });
    
    console.log('\\nFirst event transit data:');
    console.log(JSON.stringify(eventsWithData[0].planetary_transits[0], null, 2));
    
    // Test sign pattern analysis manually
    const signCounts = {};
    eventsWithData.forEach(event => {
      if (event.planetary_transits && event.planetary_transits.length > 0) {
        const transit = event.planetary_transits[0];
        const sign = transit.mars_sign;
        if (sign) {
          signCounts[sign] = (signCounts[sign] || 0) + 1;
        }
      }
    });
    
    console.log('\\nMars sign counts:', signCounts);
    
    // Run the actual pattern analysis
    const patterns = patternRecognitionService.analyzePlanetarySignPatterns(eventsWithData);
    console.log('\\nMars patterns from service:', JSON.stringify(patterns.mars, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPatternAnalysis();
