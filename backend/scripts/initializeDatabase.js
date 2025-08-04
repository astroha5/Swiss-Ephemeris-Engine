const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Initialize the database schema
 * This script creates all necessary tables and relationships
 */
async function initializeDatabase() {
  try {
    logger.info('🚀 Starting database initialization...');
    
    // Step 1: Create world_events table
    logger.info('📊 Creating world_events table...');
    const worldEventsTable = `
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
      );
    `;
    
    await executeSQL(worldEventsTable, 'world_events table');
    
    // Step 2: Create planetary_transits table
    logger.info('📊 Creating planetary_transits table...');
    const planetaryTransitsTable = `
      CREATE TABLE IF NOT EXISTS planetary_transits (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_id UUID NOT NULL REFERENCES world_events(id) ON DELETE CASCADE,
        julian_day DECIMAL(15, 8) NOT NULL,
        calculation_location_lat DECIMAL(10, 8) NOT NULL,
        calculation_location_lon DECIMAL(11, 8) NOT NULL,
        
        sun_longitude DECIMAL(10, 6),
        sun_sign TEXT,
        sun_degree_in_sign DECIMAL(8, 6),
        sun_nakshatra TEXT,
        
        moon_longitude DECIMAL(10, 6),
        moon_sign TEXT,
        moon_degree_in_sign DECIMAL(8, 6),
        moon_nakshatra TEXT,
        
        mars_longitude DECIMAL(10, 6),
        mars_sign TEXT,
        mars_degree_in_sign DECIMAL(8, 6),
        mars_nakshatra TEXT,
        
        mercury_longitude DECIMAL(10, 6),
        mercury_sign TEXT,
        mercury_degree_in_sign DECIMAL(8, 6),
        mercury_nakshatra TEXT,
        
        jupiter_longitude DECIMAL(10, 6),
        jupiter_sign TEXT,
        jupiter_degree_in_sign DECIMAL(8, 6),
        jupiter_nakshatra TEXT,
        
        venus_longitude DECIMAL(10, 6),
        venus_sign TEXT,
        venus_degree_in_sign DECIMAL(8, 6),
        venus_nakshatra TEXT,
        
        saturn_longitude DECIMAL(10, 6),
        saturn_sign TEXT,
        saturn_degree_in_sign DECIMAL(8, 6),
        saturn_nakshatra TEXT,
        
        rahu_longitude DECIMAL(10, 6),
        rahu_sign TEXT,
        rahu_degree_in_sign DECIMAL(8, 6),
        rahu_nakshatra TEXT,
        
        ketu_longitude DECIMAL(10, 6),
        ketu_sign TEXT,
        ketu_degree_in_sign DECIMAL(8, 6),
        ketu_nakshatra TEXT,
        
        ascendant_longitude DECIMAL(10, 6),
        ascendant_sign TEXT,
        ascendant_degree_in_sign DECIMAL(8, 6),
        ascendant_nakshatra TEXT,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await executeSQL(planetaryTransitsTable, 'planetary_transits table');
    
    // Step 3: Create planetary_aspects table
    logger.info('📊 Creating planetary_aspects table...');
    const planetaryAspectsTable = `
      CREATE TABLE IF NOT EXISTS planetary_aspects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_id UUID NOT NULL REFERENCES world_events(id) ON DELETE CASCADE,
        planet_a TEXT NOT NULL,
        planet_b TEXT NOT NULL,
        aspect_type TEXT NOT NULL CHECK (aspect_type IN ('conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx')),
        orb_degrees DECIMAL(8, 4) NOT NULL,
        is_exact BOOLEAN DEFAULT FALSE,
        is_applying BOOLEAN,
        strength_score DECIMAL(4, 2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(event_id, planet_a, planet_b, aspect_type)
      );
    `;
    
    await executeSQL(planetaryAspectsTable, 'planetary_aspects table');
    
    // Step 4: Create astrological_patterns table
    logger.info('📊 Creating astrological_patterns table...');
    const astrologicalPatternsTable = `
      CREATE TABLE IF NOT EXISTS astrological_patterns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pattern_name TEXT NOT NULL UNIQUE,
        description TEXT,
        pattern_type TEXT CHECK (pattern_type IN ('planetary', 'aspect', 'nakshatra', 'sign', 'house', 'combined')),
        pattern_conditions JSONB NOT NULL,
        total_occurrences INTEGER DEFAULT 0,
        high_impact_occurrences INTEGER DEFAULT 0,
        success_rate DECIMAL(5, 2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await executeSQL(astrologicalPatternsTable, 'astrological_patterns table');
    
    // Step 5: Create indexes
    logger.info('🔍 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_world_events_date ON world_events(event_date DESC);',
      'CREATE INDEX IF NOT EXISTS idx_world_events_category ON world_events(category);',
      'CREATE INDEX IF NOT EXISTS idx_world_events_impact ON world_events(impact_level);',
      'CREATE INDEX IF NOT EXISTS idx_transits_event_id ON planetary_transits(event_id);',
      'CREATE INDEX IF NOT EXISTS idx_transits_sun_sign ON planetary_transits(sun_sign);',
      'CREATE INDEX IF NOT EXISTS idx_transits_moon_sign ON planetary_transits(moon_sign);',
      'CREATE INDEX IF NOT EXISTS idx_aspects_event_id ON planetary_aspects(event_id);',
      'CREATE INDEX IF NOT EXISTS idx_aspects_type ON planetary_aspects(aspect_type);'
    ];
    
    for (const index of indexes) {
      await executeSQL(index, 'index');
    }
    
    // Step 6: Create views
    logger.info('👁️ Creating views...');
    const eventsWithTransitsView = `
      CREATE OR REPLACE VIEW events_with_transits AS
      SELECT 
        e.*,
        p.sun_sign,
        p.sun_degree_in_sign,
        p.moon_sign,
        p.moon_degree_in_sign,
        p.mars_sign,
        p.jupiter_sign,
        p.saturn_sign,
        p.julian_day
      FROM world_events e
      LEFT JOIN planetary_transits p ON e.id = p.event_id;
    `;
    
    await executeSQL(eventsWithTransitsView, 'events_with_transits view');
    
    // Step 7: Insert sample patterns
    logger.info('📝 Inserting sample astrological patterns...');
    const samplePatterns = [
      {
        pattern_name: 'Saturn-Mars Conjunction',
        description: 'Conflicts and aggressive actions when Saturn and Mars are conjunct',
        pattern_type: 'aspect',
        pattern_conditions: JSON.stringify({
          aspect_type: 'conjunction',
          planets: ['saturn', 'mars'],
          max_orb: 3
        })
      },
      {
        pattern_name: 'Jupiter-Saturn Opposition',
        description: 'Economic and social tensions during Jupiter-Saturn oppositions',
        pattern_type: 'aspect',
        pattern_conditions: JSON.stringify({
          aspect_type: 'opposition',
          planets: ['jupiter', 'saturn'],
          max_orb: 5
        })
      }
    ];
    
    for (const pattern of samplePatterns) {
      const { error } = await supabase
        .from('astrological_patterns')
        .insert(pattern)
        .select();
        
      if (error && !error.message.includes('duplicate')) {
        logger.warn(`Failed to insert pattern ${pattern.pattern_name}:`, error.message);
      }
    }
    
    // Step 8: Test the setup
    logger.info('🧪 Testing database setup...');
    await testDatabaseSetup();
    
    logger.info('✅ Database initialization completed successfully!');
    
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Execute SQL with error handling
 * @param {string} sql - SQL statement to execute
 * @param {string} description - Description for logging
 */
async function executeSQL(sql, description) {
  try {
    // For Supabase, we need to use the SQL editor or migrations
    // Since we can't execute arbitrary SQL via the client library directly,
    // we'll need to handle this differently
    
    // For now, we'll create a custom function or use the REST API
    const response = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'apikey': supabase.supabaseKey,
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      logger.warn(`Failed to create ${description}:`, error);
    } else {
      logger.info(`✅ Created ${description}`);
    }
    
  } catch (error) {
    logger.warn(`Failed to create ${description}:`, error.message);
  }
}

/**
 * Test database setup
 */
async function testDatabaseSetup() {
  const tables = ['world_events', 'planetary_transits', 'planetary_aspects', 'astrological_patterns'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
        
      if (error) {
        logger.error(`❌ ${table} test failed:`, error.message);
      } else {
        logger.info(`✅ ${table} is accessible`);
      }
    } catch (err) {
      logger.error(`❌ ${table} test error:`, err.message);
    }
  }
  
  // Test the view
  try {
    const { data, error } = await supabase
      .from('events_with_transits')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      logger.error('❌ events_with_transits view test failed:', error.message);
    } else {
      logger.info('✅ events_with_transits view is accessible');
    }
  } catch (err) {
    logger.error('❌ events_with_transits view test error:', err.message);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info('🎉 Database initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Database initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, testDatabaseSetup };
