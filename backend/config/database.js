const { supabase, sql } = require('./supabase');
const logger = require('../utils/logger');

/**
 * Connect to the database and verify connection
 */
async function connectDatabase() {
  try {
    logger.info('🔌 Connecting to database...');
    
    // Test Supabase connection
    const { data, error } = await supabase
      .from('world_events')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      logger.warn('⚠️  Supabase connection test warning:', error.message);
    } else {
      logger.info('✅ Supabase connection established successfully');
    }
    
    // Test direct postgres connection if available
    if (sql) {
      try {
        await sql`SELECT 1`;
        logger.info('✅ Direct PostgreSQL connection established successfully');
      } catch (pgError) {
        logger.warn('⚠️  Direct PostgreSQL connection failed:', pgError.message);
        logger.info('💡 This is expected for some Supabase configurations. Using Supabase client instead.');
      }
    } else {
      logger.info('📝 Direct PostgreSQL connection not configured (using Supabase client only)');
    }
    
    logger.info('📊 Database connections initialized');
    return true;
    
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
}

module.exports = connectDatabase;
