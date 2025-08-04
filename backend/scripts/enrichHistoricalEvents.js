#!/usr/bin/env node

const historicalEventEnrichmentService = require('../services/historicalEventEnrichmentService');
const logger = require('../utils/logger');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

/**
 * Script to fetch and enrich historical events from Wikipedia/Wikidata
 * 
 * Usage examples:
 * node enrichHistoricalEvents.js --run
 * node enrichHistoricalEvents.js --run --limit=50
 * node enrichHistoricalEvents.js --run --categories=financial,natural_disaster
 * node enrichHistoricalEvents.js --run --startYear=2000 --endYear=2023
 * node enrichHistoricalEvents.js --stats
 * node enrichHistoricalEvents.js --update-existing
 */

const argv = yargs(hideBin(process.argv))
  .option('run', {
    alias: 'r',
    type: 'boolean',
    description: 'Run the historical events enrichment process'
  })
  .option('stats', {
    alias: 's',
    type: 'boolean',
    description: 'Show enrichment statistics'
  })
  .option('update-existing', {
    alias: 'u',
    type: 'boolean',
    description: 'Update existing events with Wikipedia data'
  })
  .option('limit', {
    alias: 'l',
    type: 'number',
    description: 'Limit number of events to fetch per category',
    default: 30
  })
  .option('categories', {
    alias: 'c',
    type: 'string',
    description: 'Comma-separated list of categories to fetch (financial,natural_disaster,political,war,terrorism,pandemic,technology,social,accident)'
  })
  .option('startYear', {
    type: 'number',
    description: 'Start year for fetching events',
    default: 1900
  })
  .option('endYear', {
    type: 'number',
    description: 'End year for fetching events',
    default: new Date().getFullYear()
  })
  .option('sources', {
    type: 'string',
    description: 'Comma-separated list of sources (categories,onthisday,wikidata,timelines)',
    default: 'categories,onthisday,wikidata'
  })
  .option('batch-size', {
    type: 'number',
    description: 'Number of events to process in each batch',
    default: 10
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'Fetch events but don\'t store them in database'
  })
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Main function
 */
async function main() {
  try {
    logger.info('🚀 Historical Events Enrichment Script Started');
    logger.info(`⚙️ Arguments: ${JSON.stringify(argv, null, 2)}`);

    if (argv.stats) {
      await showStats();
    } else if (argv.updateExisting) {
      await updateExistingEvents();
    } else if (argv.run) {
      await runEnrichment();
    } else {
      logger.warn('⚠️ No action specified. Use --run, --stats, or --update-existing');
      logger.info('💡 Use --help for usage information');
    }

  } catch (error) {
    logger.error('💥 Script failed:', error);
    process.exit(1);
  }
}

/**
 * Run the main enrichment process
 */
async function runEnrichment() {
  try {
    logger.info('🌍 Starting Wikipedia historical events enrichment...');

    // Parse options
    const options = {
      categoryLimit: argv.limit,
      startYear: argv.startYear,
      endYear: argv.endYear,
      dryRun: argv.dryRun || false
    };

    // Parse categories
    if (argv.categories) {
      const validCategories = ['financial', 'natural_disaster', 'political', 'war', 'terrorism', 'pandemic', 'technology', 'social', 'accident'];
      const requestedCategories = argv.categories.split(',').map(c => c.trim());
      
      // Map to Wikipedia category names
      const categoryMapping = {
        'financial': ['Financial crises', 'Stock market crashes', 'Economic history'],
        'natural_disaster': ['Natural disasters', 'Earthquakes', 'Tsunamis', 'Hurricanes'],
        'political': ['Political events', 'Elections', 'Coups d\'état', 'Revolutions'],
        'war': ['Wars', 'Military conflicts', 'Battles', 'World wars'],
        'terrorism': ['Terrorist incidents', 'Terrorist attacks', 'Bombings'],
        'pandemic': ['Pandemics', 'Epidemics', 'Disease outbreaks'],
        'technology': ['Space exploration', 'Technological breakthroughs'],
        'social': ['Social movements', 'Civil rights movements', 'Protests'],
        'accident': ['Nuclear accidents', 'Industrial accidents', 'Aviation accidents']
      };

      options.categories = [];
      requestedCategories.forEach(cat => {
        if (validCategories.includes(cat) && categoryMapping[cat]) {
          options.categories.push(...categoryMapping[cat]);
        }
      });

      logger.info(`📂 Fetching from categories: ${options.categories.join(', ')}`);
    }

    // Parse sources
    if (argv.sources) {
      const sources = argv.sources.split(',').map(s => s.trim());
      options.useCategories = sources.includes('categories');
      options.useOnThisDay = sources.includes('onthisday');
      options.useWikidata = sources.includes('wikidata');
      options.useTimelines = sources.includes('timelines');
      
      logger.info(`🔍 Using sources: ${sources.join(', ')}`);
    }

    // Set batch size
    if (argv.batchSize) {
      // This would need to be passed to the service somehow
      logger.info(`⚡ Batch size: ${argv.batchSize}`);
    }

    // Run the enrichment
    const startTime = Date.now();
    const results = await historicalEventEnrichmentService.enrichHistoricalEvents(options);
    const endTime = Date.now();

    // Display results
    displayResults(results, endTime - startTime);

  } catch (error) {
    logger.error('❌ Enrichment process failed:', error);
    throw error;
  }
}

/**
 * Show enrichment statistics
 */
async function showStats() {
  try {
    logger.info('📊 Fetching enrichment statistics...');

    const stats = await historicalEventEnrichmentService.getEnrichmentStats();

    console.log('\n📈 Historical Events Database Statistics');
    console.log('=====================================');
    console.log(`Total Events: ${stats.totalEvents}`);
    console.log(`Recently Added (Last 7 days): ${stats.recentlyAdded}`);
    console.log('');

    console.log('📊 Events by Source:');
    Object.entries(stats.bySource)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
    console.log('');

    console.log('📊 Events by Category:');
    Object.entries(stats.byCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    console.log('');

    console.log('📊 Events by Impact Level:');
    Object.entries(stats.byImpactLevel)
      .sort(([,a], [,b]) => b - a)
      .forEach(([level, count]) => {
        console.log(`  ${level}: ${count}`);
      });

  } catch (error) {
    logger.error('❌ Failed to get statistics:', error);
    throw error;
  }
}

/**
 * Update existing events with Wikipedia data
 */
async function updateExistingEvents() {
  try {
    logger.info('🔄 Updating existing events with Wikipedia data...');

    const options = {
      limit: argv.limit || 50
    };

    const results = await historicalEventEnrichmentService.updateExistingEventsWithWikipediaData(options);

    console.log('\n🔄 Update Results');
    console.log('================');
    console.log(`Processed: ${results.processed}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.event}: ${error.error}`);
      });
    }

  } catch (error) {
    logger.error('❌ Failed to update existing events:', error);
    throw error;
  }
}

/**
 * Display enrichment results
 */
function displayResults(results, processingTime) {
  console.log('\n🎉 Enrichment Process Completed!');
  console.log('================================');
  console.log(`✅ Success: ${results.success}`);
  console.log(`⏱️  Processing Time: ${Math.round(processingTime / 1000)}s`);
  console.log(`📥 Total Fetched: ${results.totalFetched}`);
  console.log(`🔄 Total Processed: ${results.totalProcessed}`);
  console.log(`💾 Total Stored: ${results.totalStored}`);
  console.log(`🔮 Astrological Enrichments: ${results.astrologicalEnrichments}`);
  console.log(`🚫 Duplicates Skipped: ${results.duplicatesSkipped}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Error Details:');
    results.errors.forEach((error, index) => {
      if (error.batch) {
        console.log(`  Batch ${error.batch}: ${error.error} (${error.eventsInBatch} events)`);
      } else {
        console.log(`  ${index + 1}. ${error.title || 'Unknown'}: ${error.error}`);
      }
    });
  }

  if (results.events && results.events.length > 0) {
    console.log(`\\n📋 Sample of Stored Events (showing first 5 of ${results.events.length}):`);
    results.events.slice(0, 5).forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (${event.event_date?.substring(0, 10)}) - ${event.category}/${event.impact_level}`);
    });
  }

  // Performance metrics
  if (results.totalProcessed > 0) {
    const eventsPerSecond = Math.round((results.totalProcessed / processingTime) * 1000);
    console.log(`\\n⚡ Performance: ${eventsPerSecond} events/second`);
  }

  // Success rate
  if (results.totalFetched > 0) {
    const successRate = Math.round((results.totalStored / results.totalFetched) * 100);
    console.log(`📈 Success Rate: ${successRate}%`);
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
  logger.info('\\n🛑 Received SIGINT, gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\\n🛑 Received SIGTERM, gracefully shutting down...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    logger.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  runEnrichment,
  showStats,
  updateExistingEvents
};
