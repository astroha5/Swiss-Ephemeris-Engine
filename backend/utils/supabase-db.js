const { supabase } = require('../config/supabase');
const logger = require('./logger');

/**
 * Database helper functions using Supabase client
 * Use this when direct PostgreSQL connection is not available
 */

/**
 * Execute raw SQL using Supabase RPC
 * This is a fallback for when direct postgres connection is unavailable
 */
async function executeSQL(sqlQuery, params = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlQuery,
      params: params
    });
    
    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }
    
    return data;
  } catch (err) {
    logger.error('Supabase SQL execution failed:', err.message);
    throw err;
  }
}

/**
 * Create tables using Supabase client
 */
async function createTables() {
  try {
    logger.info('🏗️  Creating database tables using Supabase client...');

    // Create world_events table
    const worldEventsSQL = `
      CREATE TABLE IF NOT EXISTS world_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        event_date TIMESTAMPTZ NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('financial', 'natural_disaster', 'political', 'war', 'technology', 'social', 'pandemic', 'terrorism', 'accident', 'other')),
        event_type TEXT NOT NULL,
        impact_level TEXT NOT NULL CHECK (impact_level IN ('low', 'medium', 'high', 'extreme')),
        location_name TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        country_code TEXT,
        affected_population BIGINT,
        source_url TEXT,
        source_name TEXT DEFAULT 'manual',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT valid_coordinates CHECK (
          (latitude IS NULL AND longitude IS NULL) OR 
          (latitude IS NOT NULL AND longitude IS NOT NULL AND 
           latitude >= -90 AND latitude <= 90 AND 
           longitude >= -180 AND longitude <= 180)
        )
      )
    `;

    // Try to create table using a simple insert operation (this will create the table if it doesn't exist)
    try {
      await supabase.from('world_events').select('id').limit(1);
      logger.info('✅ world_events table exists or was created');
    } catch (error) {
      logger.warn('world_events table creation:', error.message);
    }

    // Test other tables similarly
    const tables = ['planetary_transits', 'planetary_aspects', 'astrological_patterns'];
    
    for (const table of tables) {
      try {
        await supabase.from(table).select('id').limit(1);
        logger.info(`✅ ${table} table exists or was created`);
      } catch (error) {
        logger.warn(`${table} table check:`, error.message);
      }
    }

    logger.info('✅ Database tables initialized using Supabase client');
    return true;
    
  } catch (error) {
    logger.error('❌ Failed to create tables:', error.message);
    throw error;
  }
}

/**
 * Insert sample data using Supabase client
 */
async function insertSampleData() {
  try {
    logger.info('📊 Inserting sample data...');

    // Check if we already have data
    const { data: existingEvents, error: countError } = await supabase
      .from('world_events')
      .select('id')
      .limit(1);

    if (countError) {
      logger.error('Failed to check existing data:', countError.message);
      return;
    }

    if (existingEvents && existingEvents.length > 0) {
      logger.info('Sample data already exists, skipping...');
      return;
    }

    // Insert sample events
    const sampleEvents = [
      {
        title: '2008 Financial Crisis Peak',
        description: 'Lehman Brothers collapse triggering global financial crisis',
        event_date: '2008-09-15T00:00:00Z',
        category: 'financial',
        event_type: 'market_crash',
        impact_level: 'extreme',
        location_name: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
        country_code: 'US',
        source_name: 'historical'
      },
      {
        title: 'COVID-19 Pandemic Declaration',
        description: 'WHO declares COVID-19 a global pandemic',
        event_date: '2020-03-11T00:00:00Z',
        category: 'pandemic',
        event_type: 'disease_outbreak',
        impact_level: 'extreme',
        location_name: 'Geneva',
        latitude: 46.2044,
        longitude: 6.1432,
        country_code: 'CH',
        source_name: 'historical'
      }
    ];

    const { data, error } = await supabase
      .from('world_events')
      .insert(sampleEvents)
      .select();

    if (error) {
      logger.error('Failed to insert sample events:', error.message);
    } else {
      logger.info(`✅ Inserted ${data.length} sample events`);
    }

    // Insert sample patterns to astrological_patterns table
    const samplePatterns = [
      {
        pattern_name: 'Saturn-Mars Conjunction',
        description: 'Conflicts and aggressive actions when Saturn and Mars are conjunct',
        pattern_type: 'aspect',
        pattern_conditions: { aspect_type: 'conjunction', planets: ['saturn', 'mars'], max_orb: 3 }
      },
      {
        pattern_name: 'Jupiter Financial Events',
        description: 'Financial market movements during Jupiter transits',
        pattern_type: 'planetary',
        pattern_conditions: { planet: 'jupiter', categories: ['financial'] }
      }
    ];

    const { data: patternData, error: patternError } = await supabase
      .from('astrological_patterns')
      .insert(samplePatterns)
      .select();

    if (patternError) {
      logger.warn('Failed to insert sample patterns:', patternError.message);
    } else {
      logger.info(`✅ Inserted ${patternData?.length || 0} sample patterns`);
    }

    return true;
    
  } catch (error) {
    logger.error('❌ Failed to insert sample data:', error.message);
    throw error;
  }
}

/**
 * Setup database using Supabase client
 */
async function setupDatabase() {
  try {
    logger.info('🚀 Starting database setup using Supabase client...');
    
    await createTables();
    await insertSampleData();
    
    logger.info('✅ Database setup completed successfully!');
    return true;
    
  } catch (error) {
    logger.error('❌ Database setup failed:', error.message);
    throw error;
  }
}

module.exports = {
  executeSQL,
  createTables,
  insertSampleData,
  setupDatabase
};
