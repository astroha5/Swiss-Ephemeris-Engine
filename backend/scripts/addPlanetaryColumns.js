const postgres = require('postgres');
const logger = require('../utils/logger');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

/**
 * Add planetary_snapshot and planetary_aspects columns to existing world_events table
 */
async function addPlanetaryColumns() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment variables');
  }
  
  // Convert pooled connection to direct connection
  const directUrl = databaseUrl.replace(
    'aws-0-us-west-1.pooler.supabase.com:6543',
    'db.ypscvzznlrxjeqkjasmb.supabase.co:5432'
  );
  
  logger.info('🔗 Connecting to Supabase database...');
  const sql = postgres(directUrl, {
    ssl: 'require',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  });

  try {
    logger.info('🚀 Adding planetary columns to world_events table...');

    // Step 1: Add the new columns
    logger.info('📝 Adding planetary_snapshot and planetary_aspects columns...');
    await sql`
      ALTER TABLE world_events 
      ADD COLUMN IF NOT EXISTS planetary_snapshot JSONB,
      ADD COLUMN IF NOT EXISTS planetary_aspects TEXT[]
    `;

    // Step 2: Add indexes for better performance
    logger.info('🔍 Creating indexes for new columns...');
    await sql`CREATE INDEX IF NOT EXISTS idx_world_events_planetary_snapshot ON world_events USING GIN (planetary_snapshot)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_world_events_planetary_aspects ON world_events USING GIN (planetary_aspects)`;

    // Step 3: Add comments to document the columns
    logger.info('📋 Adding column comments...');
    await sql`COMMENT ON COLUMN world_events.planetary_snapshot IS 'Complete planetary data snapshot in JSON format containing all planetary positions, signs, degrees, nakshatras, ascendant, etc.'`;
    await sql`COMMENT ON COLUMN world_events.planetary_aspects IS 'Array of major planetary aspects like "Mars square Saturn", "Sun conjunct Jupiter"'`;

    // Step 4: Verify the columns were added
    logger.info('🔍 Verifying new columns...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'world_events' 
      AND column_name IN ('planetary_snapshot', 'planetary_aspects')
      ORDER BY column_name
    `;

    if (columns.length === 2) {
      logger.info('✅ New columns verified:');
      columns.forEach(col => {
        logger.info(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      logger.warn('⚠️  Column verification failed. Found columns:', columns);
    }

    // Step 5: Show current world_events table structure
    logger.info('📊 Current world_events table structure:');
    const allColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'world_events' 
      ORDER BY ordinal_position
    `;

    allColumns.forEach(col => {
      const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
      logger.info(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})${defaultVal}`);
    });

    logger.info('✅ Planetary columns added successfully!');
    
    // Step 6: Test basic functionality
    logger.info('🧪 Testing basic functionality...');
    const [testEvent] = await sql`
      SELECT id, title, planetary_snapshot, planetary_aspects 
      FROM world_events 
      LIMIT 1
    `;
    
    if (testEvent) {
      logger.info(`📝 Test event: "${testEvent.title}"`);
      logger.info(`  - planetary_snapshot: ${testEvent.planetary_snapshot || 'null'}`);
      logger.info(`  - planetary_aspects: ${testEvent.planetary_aspects || 'null'}`);
    }

    return true;
    
  } catch (error) {
    logger.error('❌ Failed to add planetary columns:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addPlanetaryColumns()
    .then(() => {
      logger.info('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { addPlanetaryColumns };
