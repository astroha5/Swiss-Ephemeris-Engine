const logger = require('../utils/logger');
const PlanetaryPatternExtractorService = require('../services/planetaryPatternExtractorService');

// Ensure Supabase client initializes and tests connection
require('../config/supabase');

async function main() {
  try {
    logger.info('🚀 Running full planetary pattern extraction for Supabase world_events');
    const extractor = new PlanetaryPatternExtractorService();

    const analysis = await extractor.extractPlanetaryPatterns({
      // Defaults as per service: high-impact events since 1900 to now
      // impact_level: ['high', 'extreme'],
      // start_date: '1900-01-01',
      // end_date: new Date().toISOString(),
      // min_events: 3
    });

    logger.info('✅ Extraction complete');
    logger.info(`Total events analyzed: ${analysis.total_events_analyzed}`);
    logger.info(`Stored patterns: ${analysis.stored_patterns}`);
    logger.info(`Extraction timestamp: ${analysis.extraction_timestamp}`);

    // Summarize stored patterns by type if available
    const p = analysis.patterns || {};
    const summary = {
      degree_specific: Object.values(p.degree_specific || {}).reduce((acc, v) => acc + (v.most_significant?.length || 0), 0),
      aspects: Object.values(p.aspects || {}).reduce((acc, v) => acc + (v.most_significant?.length || 0), 0),
      nakshatras: Object.values(p.nakshatras || {}).reduce((acc, planet) => {
        return acc + Object.values(planet).reduce((a, v) => a + (v.most_significant?.length || 0), 0);
      }, 0),
      signs: Object.values(p.signs || {}).reduce((acc, v) => acc + (v.patterns?.length || 0), 0),
      combined: (p.combined?.significant_patterns?.length) || 0
    };
    logger.info(`Pattern summary -> Degree: ${summary.degree_specific}, Aspects: ${summary.aspects}, Nakshatras: ${summary.nakshatras}, Signs: ${summary.signs}, Combined: ${summary.combined}`);

    process.exit(0);
  } catch (err) {
    logger.error('❌ Extraction failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
