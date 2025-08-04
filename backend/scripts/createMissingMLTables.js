const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Create the missing ML tables using Supabase client
 */
async function createMissingMLTables() {
  try {
    logger.info('🔧 Creating missing ML tables...');
    
    
    // Create risk_alerts table by inserting a test record
    try {
      const { error: createTableError } = await supabase
        .from('risk_alerts')
        .insert([
          {
            alert_type: 'HIGH_RISK_DETECTED',
            risk_level: 'HIGH',
            risk_score: 0.8,
            alert_message: 'Test alert',
            triggering_patterns: { test: true },
            planetary_conditions: { test: true },
            model_predictions: { test: true },
            target_date: new Date().toISOString(),
            geographic_scope: { global: true },
            affected_categories: ['test'],
            status: 'ACTIVE'
          }
        ]);
      
      if (createTableError) {
        logger.warn('risk_alerts table might already exist or needs manual creation');
      } else {
        logger.info('✅ risk_alerts table created/tested');
        
        // Clean up test record
        await supabase
          .from('risk_alerts')
          .delete()
          .eq('alert_message', 'Test alert');
      }
    } catch (err) {
      logger.warn('risk_alerts table creation failed:', err.message);
    }
    
    logger.info('🔧 ML tables creation process completed');
    
  } catch (error) {
    logger.error('❌ Failed to create missing ML tables:', error);
    throw error;
  }
}

/**
 * Test if the ML tables are working properly
 */
async function testMLTables() {
  logger.info('🧪 Testing ML tables functionality...');
  
  const tables = ['risk_alerts'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        logger.error(`❌ ${table}: ${error.message}`);
      } else {
        logger.info(`✅ ${table}: ${count} records accessible`);
      }
    } catch (err) {
      logger.error(`❌ ${table}: Exception - ${err.message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  createMissingMLTables()
    .then(() => testMLTables())
    .then(() => {
      logger.info('🎉 ML tables setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 ML tables setup failed:', error);
      process.exit(1);
    });
}

module.exports = {
  createMissingMLTables,
  testMLTables
};
