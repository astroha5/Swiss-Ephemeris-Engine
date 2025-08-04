const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Remove duplicates from all Supabase tables
 * This script identifies and removes duplicate records while preserving the most recent ones
 */
async function removeDuplicates() {
  logger.info('🧹 Starting duplicate removal process...');
  
  try {
    // Remove duplicates from each table
    await removeDuplicatesFromWorldEvents();
    await removeDuplicatesFromPlanetaryTransits();
    await removeDuplicatesFromPlanetaryAspects();
    await removeDuplicatesFromAstrologicalPatterns();
    await removeDuplicatesFromMLModels();
    await removeDuplicatesFromMLPredictions();
    await removeDuplicatesFromPatternAnalysisResults();
    await removeDuplicatesFromRiskAlerts();
    
    logger.info('✅ Duplicate removal process completed successfully!');
    
    // Show final counts
    await showTableCounts();
    
  } catch (error) {
    logger.error('❌ Error during duplicate removal:', error);
    throw error;
  }
}

/**
 * Remove duplicates from world_events table
 * Duplicates identified by: title + event_date + location_name
 */
async function removeDuplicatesFromWorldEvents() {
  logger.info('🔍 Checking world_events for duplicates...');
  
  try {
    // Get all records
    const { data: allRecords, error } = await supabase
      .from('world_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching world_events:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in world_events');
      return;
    }

    // Group by duplicate criteria
    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      const key = `${record.title}|${record.event_date}|${record.location_name || 'null'}`;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    // Find and remove duplicates
    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicates for: ${key.split('|')[0]}`);
        
        // Keep the most recent record (first in our DESC ordered list)
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('world_events')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting world_events record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
            logger.info(`Deleted duplicate: ${record.title} (${record.id})`);
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from world_events`);
    
  } catch (error) {
    logger.error('Error processing world_events duplicates:', error);
  }
}

/**
 * Remove duplicates from planetary_transits table
 * Duplicates identified by: event_id + julian_day
 */
async function removeDuplicatesFromPlanetaryTransits() {
  logger.info('🔍 Checking planetary_transits for duplicates...');
  
  try {
    const { data: allRecords, error } = await supabase
      .from('planetary_transits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching planetary_transits:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in planetary_transits');
      return;
    }

    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      const key = `${record.event_id}|${record.julian_day}`;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicate transits for event: ${key.split('|')[0]}`);
        
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('planetary_transits')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting planetary_transits record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from planetary_transits`);
    
  } catch (error) {
    logger.error('Error processing planetary_transits duplicates:', error);
  }
}

/**
 * Remove duplicates from planetary_aspects table
 * Duplicates identified by: event_id + planet_a + planet_b + aspect_type
 */
async function removeDuplicatesFromPlanetaryAspects() {
  logger.info('🔍 Checking planetary_aspects for duplicates...');
  
  try {
    const { data: allRecords, error } = await supabase
      .from('planetary_aspects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching planetary_aspects:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in planetary_aspects');
      return;
    }

    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      const key = `${record.event_id}|${record.planet_a}|${record.planet_b}|${record.aspect_type}`;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicate aspects: ${key}`);
        
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('planetary_aspects')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting planetary_aspects record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from planetary_aspects`);
    
  } catch (error) {
    logger.error('Error processing planetary_aspects duplicates:', error);
  }
}

/**
 * Remove duplicates from astrological_patterns table
 * Duplicates identified by: pattern_name
 */
async function removeDuplicatesFromAstrologicalPatterns() {
  logger.info('🔍 Checking astrological_patterns for duplicates...');
  
  try {
    const { data: allRecords, error } = await supabase
      .from('astrological_patterns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching astrological_patterns:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in astrological_patterns');
      return;
    }

    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      const key = record.pattern_name;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicate patterns: ${key}`);
        
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('astrological_patterns')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting astrological_patterns record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from astrological_patterns`);
    
  } catch (error) {
    logger.error('Error processing astrological_patterns duplicates:', error);
  }
}

/**
 * Remove duplicates from ml_models table
 * Duplicates identified by: model_name
 */
async function removeDuplicatesFromMLModels() {
  logger.info('🔍 Checking ml_models for duplicates...');
  
  try {
    const { data: allRecords, error } = await supabase
      .from('ml_models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching ml_models:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in ml_models');
      return;
    }

    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      const key = record.model_name;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicate ML models: ${key}`);
        
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('ml_models')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting ml_models record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from ml_models`);
    
  } catch (error) {
    logger.error('Error processing ml_models duplicates:', error);
  }
}

/**
 * Remove duplicates from ml_predictions table
 * Duplicates identified by: prediction_date + risk_level + planetary_snapshot (JSON comparison)
 */
async function removeDuplicatesFromMLPredictions() {
  logger.info('🔍 Checking ml_predictions for duplicates...');
  
  try {
    const { data: allRecords, error } = await supabase
      .from('ml_predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching ml_predictions:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in ml_predictions');
      return;
    }

    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      // Create a unique key based on prediction date and risk details
      const key = `${record.prediction_date}|${record.risk_level}|${record.risk_score}|${JSON.stringify(record.planetary_snapshot || {})}`;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicate predictions for: ${key.split('|')[0]}`);
        
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('ml_predictions')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting ml_predictions record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from ml_predictions`);
    
  } catch (error) {
    logger.error('Error processing ml_predictions duplicates:', error);
  }
}

/**
 * Remove duplicates from pattern_analysis_results table
 * Duplicates identified by: analysis_name + analysis_type + date_range
 */
async function removeDuplicatesFromPatternAnalysisResults() {
  logger.info('🔍 Checking pattern_analysis_results for duplicates...');
  
  try {
    const { data: allRecords, error } = await supabase
      .from('pattern_analysis_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching pattern_analysis_results:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in pattern_analysis_results');
      return;
    }

    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      const key = `${record.analysis_name}|${record.analysis_type}|${JSON.stringify(record.date_range || {})}`;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicate analysis results: ${key.split('|')[0]}`);
        
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('pattern_analysis_results')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting pattern_analysis_results record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from pattern_analysis_results`);
    
  } catch (error) {
    logger.error('Error processing pattern_analysis_results duplicates:', error);
  }
}

/**
 * Remove duplicates from risk_alerts table
 * Duplicates identified by: alert_type + risk_level + target_date + alert_message
 */
async function removeDuplicatesFromRiskAlerts() {
  logger.info('🔍 Checking risk_alerts for duplicates...');
  
  try {
    const { data: allRecords, error } = await supabase
      .from('risk_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching risk_alerts:', error);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      logger.info('No records found in risk_alerts');
      return;
    }

    const duplicateGroups = new Map();
    
    for (const record of allRecords) {
      const key = `${record.alert_type}|${record.risk_level}|${record.target_date}|${record.alert_message}`;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(record);
    }

    let duplicatesRemoved = 0;
    
    for (const [key, records] of duplicateGroups) {
      if (records.length > 1) {
        logger.info(`Found ${records.length} duplicate risk alerts: ${key.split('|')[0]}`);
        
        const toKeep = records[0];
        const toDelete = records.slice(1);
        
        for (const record of toDelete) {
          const { error: deleteError } = await supabase
            .from('risk_alerts')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            logger.error(`Error deleting risk_alerts record ${record.id}:`, deleteError);
          } else {
            duplicatesRemoved++;
          }
        }
      }
    }
    
    logger.info(`✅ Removed ${duplicatesRemoved} duplicates from risk_alerts`);
    
  } catch (error) {
    logger.error('Error processing risk_alerts duplicates:', error);
  }
}

/**
 * Show final record counts for all tables
 */
async function showTableCounts() {
  logger.info('📊 Final table counts:');
  
  const tables = [
    'world_events',
    'planetary_transits', 
    'planetary_aspects',
    'astrological_patterns',
    'ml_models',
    'ml_predictions',
    'pattern_analysis_results',
    'risk_alerts'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        logger.info(`   ${table}: Error - ${error.message}`);
      } else {
        logger.info(`   ${table}: ${count} records`);
      }
    } catch (err) {
      logger.info(`   ${table}: Error - ${err.message}`);
    }
  }
}

// Run the duplicate removal if called directly
if (require.main === module) {
  removeDuplicates()
    .then(() => {
      logger.info('🎉 Duplicate removal completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Duplicate removal failed:', error);
      process.exit(1);
    });
}

module.exports = {
  removeDuplicates,
  removeDuplicatesFromWorldEvents,
  removeDuplicatesFromPlanetaryTransits,
  removeDuplicatesFromPlanetaryAspects,
  removeDuplicatesFromAstrologicalPatterns,
  removeDuplicatesFromMLModels,
  removeDuplicatesFromMLPredictions,
  removeDuplicatesFromPatternAnalysisResults,
  removeDuplicatesFromRiskAlerts,
  showTableCounts
};
