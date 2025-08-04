const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Query and display event titles that need location enrichment
 */
async function queryEventTitles() {
  try {
    logger.info('🔍 Querying event titles from world_events table...');
    
    // Query events that have NULL location fields (need enrichment)
    const { data: events, error } = await supabase
      .from('world_events')
      .select('id, title, location_name, latitude, longitude, country_code')
      .or('location_name.is.null,latitude.is.null,longitude.is.null')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      logger.error('❌ Error querying events:', error.message);
      throw error;
    }
    
    if (!events || events.length === 0) {
      logger.info('✅ No events found that need location enrichment');
      return [];
    }
    
    logger.info(`📊 Found ${events.length} events that need location enrichment:`);
    
    // Display each event title
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Current location: ${event.location_name || 'NULL'}`);
      console.log(`   Current coordinates: ${event.latitude || 'NULL'}, ${event.longitude || 'NULL'}`);
      console.log(`   Current country: ${event.country_code || 'NULL'}`);
    });
    
    // Return the first event title for processing
    if (events.length > 0) {
      const firstEvent = events[0];
      logger.info(`\n🎯 First event to process: "${firstEvent.title}"`);
      return firstEvent.title;
    }
    
    return null;
    
  } catch (error) {
    logger.error('❌ Failed to query event titles:', error);
    throw error;
  }
}

// If this script is run directly, execute the query
if (require.main === module) {
  queryEventTitles()
    .then((title) => {
      if (title) {
        console.log('\n✅ Query completed successfully');
        console.log(`📝 Copy this title for location enrichment:\n"${title}"`);
      } else {
        console.log('\n✅ No events need location enrichment');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Query failed:', error.message);
      process.exit(1);
    });
}

module.exports = { queryEventTitles };
