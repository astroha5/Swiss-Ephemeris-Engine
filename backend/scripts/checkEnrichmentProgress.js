const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

async function checkEnrichmentProgress() {
  try {
    logger.info('📊 Checking location enrichment progress...');
    
    // Count total events
    const { count: totalCount, error: totalError } = await supabase
      .from('world_events')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      logger.error('Error counting total events:', totalError.message);
      return;
    }
    
    // Count events with location data
    const { count: enrichedCount, error: enrichedError } = await supabase
      .from('world_events')
      .select('*', { count: 'exact', head: true })
      .not('location_name', 'is', null)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    
    if (enrichedError) {
      logger.error('Error counting enriched events:', enrichedError.message);
      return;
    }
    
    // Count events needing enrichment
    const { count: needingCount, error: needingError } = await supabase
      .from('world_events')
      .select('*', { count: 'exact', head: true })
      .or('location_name.is.null,latitude.is.null,longitude.is.null');
    
    if (needingError) {
      logger.error('Error counting events needing enrichment:', needingError.message);
      return;
    }
    const percentage = totalCount > 0 ? ((enrichedCount / totalCount) * 100).toFixed(1) : 0;
    
    console.log('\\n📈 LOCATION ENRICHMENT PROGRESS REPORT');
    console.log('=====================================');
    console.log(`📊 Total Events: ${totalCount}`);
    console.log(`✅ Events with Location Data: ${enrichedCount} (${percentage}%)`);
    console.log(`⚠️  Events Needing Enrichment: ${needingCount}`);
    console.log('=====================================\\n');
    
    if (enrichedCount > 0) {
      logger.info('🎉 Great progress! Location enrichment is working successfully.');
    }
    
    return {
      total: totalCount,
      enriched: enrichedCount,
      needing: needingCount,
      percentage: parseFloat(percentage)
    };
    
  } catch (error) {
    logger.error('Error checking enrichment progress:', error.message);
  }
}

if (require.main === module) {
  checkEnrichmentProgress()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Progress check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkEnrichmentProgress };
