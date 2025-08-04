const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Setup sample data for testing the database schema
 */
async function setupSampleData() {
  try {
    logger.info('🔧 Setting up sample data for testing...');
    
    // Sample world events
    const sampleEvents = [
      {
        title: 'Test Event 1 - Financial Crisis',
        description: 'Sample financial crisis event for testing',
        event_date: '2020-03-15T00:00:00Z',
        category: 'financial',
        event_type: 'market_crash',
        impact_level: 'high',
        location_name: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
        country_code: 'US',
        source_name: 'test'
      },
      {
        title: 'Test Event 2 - Natural Disaster',
        description: 'Sample natural disaster event for testing',
        event_date: '2021-08-20T00:00:00Z',
        category: 'natural_disaster',
        event_type: 'earthquake',
        impact_level: 'extreme',
        location_name: 'Tokyo',
        latitude: 35.6762,
        longitude: 139.6503,
        country_code: 'JP',
        source_name: 'test'
      },
      {
        title: 'Test Event 3 - Political Event',
        description: 'Sample political event for testing',
        event_date: '2022-06-15T00:00:00Z',
        category: 'political',
        event_type: 'election',
        impact_level: 'medium',
        location_name: 'Washington DC',
        latitude: 38.9072,
        longitude: -77.0369,
        country_code: 'US',
        source_name: 'test'
      }
    ];
    
    // Try to insert sample events
    logger.info('📊 Inserting sample world events...');
    
    for (const event of sampleEvents) {
      try {
        const { data, error } = await supabase
          .from('world_events')
          .insert(event)
          .select()
          .single();
          
        if (error) {
          if (error.code === '42P01') {
            logger.error('❌ world_events table does not exist! Database schema needs to be created.');
            logger.info('💡 Please create the database schema first using the Supabase dashboard.');
            logger.info('💡 You can find the SQL schema in: backend/database/schema.sql');
            return false;
          } else {
            logger.warn(`⚠️ Failed to insert event "${event.title}":`, error.message);
          }
        } else {
          logger.info(`✅ Inserted event: ${event.title} (ID: ${data.id})`);
        }
      } catch (err) {
        logger.warn(`⚠️ Error inserting event "${event.title}":`, err.message);
      }
    }
    
    // Try to create some sample patterns
    logger.info('🔮 Inserting sample astrological patterns...');
    
    const samplePatterns = [
      {
        pattern_name: 'Mars-Saturn High Impact',
        description: 'Mars-Saturn aspects correlating with high impact events',
        pattern_type: 'aspect',
        pattern_conditions: {
          planets: ['mars', 'saturn'],
          aspect_types: ['conjunction', 'opposition', 'square'],
          max_orb: 5
        },
        total_occurrences: 15,
        high_impact_occurrences: 12,
        success_rate: 80.0
      },
      {
        pattern_name: 'Jupiter Financial Events',
        description: 'Jupiter sign positions during financial events',
        pattern_type: 'planetary',
        pattern_conditions: {
          planet: 'jupiter',
          categories: ['financial'],
          threshold: 0.3
        },
        total_occurrences: 25,
        high_impact_occurrences: 18,
        success_rate: 72.0
      }
    ];
    
    for (const pattern of samplePatterns) {
      try {
        const { data, error } = await supabase
          .from('astrological_patterns')
          .insert(pattern)
          .select()
          .single();
          
        if (error) {
          if (error.code === '42P01') {
            logger.warn('⚠️ astrological_patterns table does not exist, skipping patterns');
            break;
          } else {
            logger.warn(`⚠️ Failed to insert pattern "${pattern.pattern_name}":`, error.message);
          }
        } else {
          logger.info(`✅ Inserted pattern: ${pattern.pattern_name}`);
        }
      } catch (err) {
        logger.warn(`⚠️ Error inserting pattern:`, err.message);
      }
    }
    
    // Test the queries that were failing
    logger.info('🧪 Testing problematic queries...');
    
    await testQueries();
    
    logger.info('✅ Sample data setup completed!');
    return true;
    
  } catch (error) {
    logger.error('❌ Sample data setup failed:', error);
    return false;
  }
}

/**
 * Test the queries that were failing in the pattern recognition service
 */
async function testQueries() {
  try {
    // Test world_events query
    logger.info('Testing world_events query...');
    const { data: events, error: eventsError } = await supabase
      .from('world_events')
      .select('*')
      .limit(5);
      
    if (eventsError) {
      logger.error('❌ world_events query failed:', eventsError.message);
    } else {
      logger.info(`✅ Found ${events?.length || 0} events`);
    }
    
    // Test planetary_transits query (may not have data)
    logger.info('Testing planetary_transits query...');
    const { data: transits, error: transitsError } = await supabase
      .from('planetary_transits')
      .select('count', { count: 'exact', head: true });
      
    if (transitsError) {
      logger.error('❌ planetary_transits query failed:', transitsError.message);
    } else {
      logger.info('✅ planetary_transits table accessible');
    }
    
    // Test planetary_aspects query (may not have data)
    logger.info('Testing planetary_aspects query...');
    const { data: aspects, error: aspectsError } = await supabase
      .from('planetary_aspects')
      .select('count', { count: 'exact', head: true });
      
    if (aspectsError) {
      logger.error('❌ planetary_aspects query failed:', aspectsError.message);
    } else {
      logger.info('✅ planetary_aspects table accessible');
    }
    
    // Test astrological_patterns query
    logger.info('Testing astrological_patterns query...');
    const { data: patterns, error: patternsError } = await supabase
      .from('astrological_patterns')
      .select('*')
      .limit(5);
      
    if (patternsError) {
      logger.error('❌ astrological_patterns query failed:', patternsError.message);
    } else {
      logger.info(`✅ Found ${patterns?.length || 0} patterns`);
    }
    
  } catch (error) {
    logger.error('❌ Query testing failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  setupSampleData()
    .then((success) => {
      if (success) {
        logger.info('🎉 Sample data setup completed successfully');
        process.exit(0);
      } else {
        logger.error('💥 Sample data setup failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('💥 Sample data setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSampleData, testQueries };
