const fs = require('fs');
const path = require('path');
const { supabase, sql } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Setup Database Schema in Supabase
 * This script reads the schema.sql file and executes it in Supabase
 */
async function setupDatabase() {
  try {
    logger.info('🚀 Starting database setup...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('📄 Schema file read successfully');

    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    logger.info(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('create table') || 
          statement.toLowerCase().includes('create index') ||
          statement.toLowerCase().includes('create view') ||
          statement.toLowerCase().includes('create function') ||
          statement.toLowerCase().includes('create trigger') ||
          statement.toLowerCase().includes('insert into')) {
        
        try {
          logger.info(`⚙️  Executing statement ${i + 1}/${statements.length}`);
          
          // For PostgreSQL functions and triggers, we need to use rpc
          if (statement.toLowerCase().includes('create function') || 
              statement.toLowerCase().includes('create trigger')) {
            logger.info('⚠️  Skipping function/trigger - these need to be created in Supabase dashboard');
            continue;
          }

          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key')) {
              logger.info(`⚠️  Statement ${i + 1} already exists, skipping`);
            } else {
              logger.error(`❌ Error in statement ${i + 1}: ${error.message}`);
              errorCount++;
            }
          } else {
            successCount++;
          }
          
        } catch (err) {
          logger.error(`❌ Exception in statement ${i + 1}: ${err.message}`);
          errorCount++;
        }
      } else {
        logger.info(`⏭️  Skipping non-DDL statement ${i + 1}`);
      }
    }

    logger.info(`✅ Database setup completed!`);
    logger.info(`📈 Success: ${successCount}, Errors: ${errorCount}`);

    // Test the setup by checking if tables exist
    await testDatabaseSetup();

  } catch (error) {
    logger.error('❌ Database setup failed:', error.message);
    throw error;
  }
}

/**
 * Test if database setup was successful
 */
async function testDatabaseSetup() {
  try {
    logger.info('🧪 Testing database setup...');

    // Test if main tables exist by trying to select from them
    const tables = ['world_events', 'planetary_transits', 'planetary_aspects', 'astrological_patterns'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          logger.error(`❌ Table ${table} test failed: ${error.message}`);
        } else {
          logger.info(`✅ Table ${table} exists and is accessible`);
        }
      } catch (err) {
        logger.error(`❌ Exception testing table ${table}: ${err.message}`);
      }
    }

    logger.info('🧪 Database tests completed');

  } catch (error) {
    logger.error('❌ Database testing failed:', error.message);
  }
}

/**
 * Direct postgres setup method using postgres connection
 * This is more reliable than using Supabase RPC
 */
async function directSetup() {
  if (!sql) {
    throw new Error('Direct postgres connection not available. Please check your DATABASE_URL environment variable.');
  }

  try {
    logger.info('🚀 Starting direct postgres database setup...');

    // Create world_events table
    logger.info('Creating world_events table...');
    await sql`
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
          
          -- NEW: Planetary data stored directly in world_events
          planetary_snapshot JSONB,
          planetary_aspects TEXT[],
          
          CONSTRAINT valid_coordinates CHECK (
              (latitude IS NULL AND longitude IS NULL) OR 
              (latitude IS NOT NULL AND longitude IS NOT NULL AND 
               latitude >= -90 AND latitude <= 90 AND 
               longitude >= -180 AND longitude <= 180)
          )
      )
    `;

    // Create planetary_transits table
    logger.info('Creating planetary_transits table...');
    await sql`
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
      )
    `;

    // Create planetary_aspects table
    logger.info('Creating planetary_aspects table...');
    await sql`
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
      )
    `;

    // Create astrological_patterns table
    logger.info('Creating astrological_patterns table...');
    await sql`
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
      )
    `;

    // Create indexes
    logger.info('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_world_events_date ON world_events(event_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_world_events_category ON world_events(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_world_events_impact ON world_events(impact_level)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transits_event_id ON planetary_transits(event_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aspects_event_id ON planetary_aspects(event_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_patterns_type ON astrological_patterns(pattern_type)`;

    // Create view
    logger.info('Creating views...');
    await sql`
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
      LEFT JOIN planetary_transits p ON e.id = p.event_id
    `;

    // Insert sample data
    logger.info('Inserting sample patterns...');
    const patterns = [
      {
        name: 'Saturn-Mars Conjunction',
        description: 'Conflicts and aggressive actions when Saturn and Mars are conjunct',
        type: 'aspect',
        conditions: { aspect_type: 'conjunction', planets: ['saturn', 'mars'], max_orb: 3 }
      },
      {
        name: 'Jupiter Financial Events',
        description: 'Financial market movements during Jupiter transits',
        type: 'planetary',
        conditions: { planet: 'jupiter', categories: ['financial'] }
      },
      {
        name: 'Jupiter-Saturn Opposition',
        description: 'Economic and social tensions during Jupiter-Saturn oppositions',
        type: 'aspect',
        conditions: { aspect_type: 'opposition', planets: ['jupiter', 'saturn'], max_orb: 5 }
      }
    ];

    for (const pattern of patterns) {
      try {
        await sql`
          INSERT INTO astrological_patterns (pattern_name, description, pattern_type, pattern_conditions) 
          VALUES (${pattern.name}, ${pattern.description}, ${pattern.type}, ${JSON.stringify(pattern.conditions)})
          ON CONFLICT (pattern_name) DO NOTHING
        `;
      } catch (err) {
        logger.warn(`Pattern ${pattern.name} could not be inserted:`, err.message);
      }
    }

    // Insert sample events
    logger.info('Inserting sample events...');
    const events = [
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

    for (const event of events) {
      try {
        await sql`
          INSERT INTO world_events (title, description, event_date, category, event_type, impact_level, location_name, latitude, longitude, country_code, source_name) 
          VALUES (${event.title}, ${event.description}, ${event.event_date}, ${event.category}, ${event.event_type}, ${event.impact_level}, ${event.location_name}, ${event.latitude}, ${event.longitude}, ${event.country_code}, ${event.source_name})
        `;
      } catch (err) {
        if (err.message.includes('duplicate')) {
          logger.info(`Event "${event.title}" already exists, skipping...`);
        } else {
          logger.warn(`Could not insert event "${event.title}":`, err.message);
        }
      }
    }

    // Test the setup
    const [eventCount] = await sql`SELECT COUNT(*) as count FROM world_events`;
    const [patternCount] = await sql`SELECT COUNT(*) as count FROM astrological_patterns`;
    
    logger.info('✅ Direct postgres setup completed successfully!');
    logger.info(`📈 Database status: ${eventCount.count} events, ${patternCount.count} patterns`);

  } catch (error) {
    logger.error('❌ Direct postgres setup failed:', error);
    throw error;
  }
}

/**
 * Alternative manual setup method
 * Use this if the automatic setup doesn't work
 */
async function manualSetup() {
  try {
    logger.info('🔧 Starting manual database setup...');

    // Create world_events table
    const { error: eventsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS world_events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          event_date TIMESTAMPTZ NOT NULL,
          category TEXT NOT NULL,
          event_type TEXT NOT NULL,
          impact_level TEXT NOT NULL,
          location_name TEXT,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          country_code TEXT,
          affected_population BIGINT,
          source_url TEXT,
          source_name TEXT DEFAULT 'manual',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (eventsError && !eventsError.message.includes('already exists')) {
      logger.error('Error creating world_events table:', eventsError.message);
    } else {
      logger.info('✅ world_events table created');
    }

    // Add more table creations as needed...
    logger.info('🔧 Manual setup completed');

  } catch (error) {
    logger.error('❌ Manual setup failed:', error.message);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('🎉 Database setup process finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Database setup process failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  setupDatabase,
  testDatabaseSetup,
  manualSetup,
  directSetup
};
