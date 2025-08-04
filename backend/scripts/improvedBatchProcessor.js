const { supabase } = require('../config/supabase');
const getCoordinatesFromWikipediaUrl = require('../utils/locationFetcher');
const logger = require('../utils/logger');

/**
 * Improved batch processor that properly handles pagination and avoids duplicate processing
 */
class ImprovedBatchProcessor {
    constructor(options = {}) {
        this.batchSize = options.batchSize || 25; // Smaller batches for better control
        this.batchDelay = options.batchDelay || 120000; // 2 minutes between batches
        this.maxBatches = options.maxBatches || 50;
        this.processedEventIds = new Set(); // Track processed events
        
        this.stats = {
            startTime: new Date().toISOString(),
            batchesCompleted: 0,
            totalUpdated: 0,
            totalFailed: 0,
            totalSkipped: 0,
            successRate: 0,
            sources: {},
            errors: []
        };
    }

    /**
     * Start improved batch processing
     */
    async start() {
        try {
            logger.info('🚀 Starting improved batch processor...');
            logger.info(`📊 Configuration: ${this.batchSize} events per batch, ${this.batchDelay/1000}s between batches`);
            
            const initialStatus = await this.checkEventsNeedingCoordinates();
            logger.info(`📈 Starting with ${initialStatus.needingCoords} events needing coordinates`);
            
            let batchCount = 0;
            let totalProcessed = 0;
            
            while (batchCount < this.maxBatches) {
                const status = await this.checkEventsNeedingCoordinates();
                
                if (status.needingCoords === 0) {
                    logger.info('🎉 All events have been processed!');
                    break;
                }
                
                logger.info(`\n🔄 Starting batch ${batchCount + 1}/${this.maxBatches}`);
                logger.info(`📊 Remaining events: ${status.needingCoords}`);
                
                try {
                    // Get fresh batch of events (avoiding already processed ones)
                    const events = await this.getBatchOfEvents();
                    
                    if (!events || events.length === 0) {
                        logger.info('📭 No more events to process');
                        break;
                    }
                    
                    logger.info(`📦 Processing ${events.length} events in this batch`);
                    
                    // Process the batch
                    const batchResults = await this.processBatch(events);
                    
                    // Update statistics
                    this.updateStats(batchResults);
                    totalProcessed += events.length;
                    
                    // Log batch summary
                    this.logBatchSummary(batchCount + 1, batchResults);
                    
                    batchCount++;
                    
                    // Wait before next batch
                    if (batchCount < this.maxBatches && status.needingCoords > this.batchSize) {
                        logger.info(`⏰ Waiting ${this.batchDelay/1000} seconds before next batch...`);
                        await this.delay(this.batchDelay);
                    }
                    
                } catch (error) {
                    logger.error(`💥 Batch ${batchCount + 1} failed:`, error.message);
                    this.stats.errors.push({
                        batch: batchCount + 1,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    batchCount++;
                    await this.delay(60000); // 1 minute delay after error
                }
            }
            
            await this.generateFinalSummary();
            
        } catch (error) {
            logger.error('💥 Improved batch processor failed:', error);
            throw error;
        }
    }

    /**
     * Get a fresh batch of events that haven't been processed yet
     */
    async getBatchOfEvents() {
        try {
            // Get events that need coordinates, excluding already processed ones
            let query = supabase
                .from('world_events')
                .select('id, title, source_url, latitude, longitude, location_name')
                .not('source_url', 'is', null)
                .is('latitude', null)
                .order('created_at', { ascending: true }) // Process oldest first
                .limit(this.batchSize);

            // If we have processed events, exclude them
            if (this.processedEventIds.size > 0) {
                const processedIds = Array.from(this.processedEventIds);
                query = query.not('id', 'in', processedIds);
            }

            const { data: events, error } = await query;

            if (error) {
                throw new Error(`Failed to fetch events: ${error.message}`);
            }

            return events || [];

        } catch (error) {
            logger.error('Error fetching batch of events:', error);
            throw error;
        }
    }

    /**
     * Process a batch of specific events
     */
    async processBatch(events) {
        const results = {
            updated: 0,
            failed: 0,
            skipped: 0,
            sources: {},
            errors: []
        };

        for (const event of events) {
            // Mark as processed regardless of outcome
            this.processedEventIds.add(event.id);

            try {
                logger.info(`🔍 Processing: ${event.title.substring(0, 80)}...`);
                
                // Skip if not a Wikipedia URL
                if (!event.source_url.includes('wikipedia.org/wiki/')) {
                    logger.info(`⏭️  Skipping non-Wikipedia URL`);
                    results.skipped++;
                    continue;
                }

                // Get coordinates
                const coordinates = await getCoordinatesFromWikipediaUrl(event.source_url, event.title);
                
                if (coordinates && coordinates.latitude && coordinates.longitude) {
                    // Update the event
                    const updateData = {
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                        updated_at: new Date().toISOString()
                    };
                    
                    if (coordinates.location_name && !event.location_name) {
                        updateData.location_name = coordinates.location_name;
                    }

                    const { error: updateError } = await supabase
                        .from('world_events')
                        .update(updateData)
                        .eq('id', event.id);

                    if (updateError) {
                        logger.error(`❌ Database update failed: ${updateError.message}`);
                        results.failed++;
                        results.errors.push({
                            title: event.title,
                            error: updateError.message
                        });
                    } else {
                        const sourceInfo = coordinates.source ? ` (${coordinates.source})` : '';
                        logger.info(`✅ Updated: ${coordinates.latitude}, ${coordinates.longitude}${sourceInfo}`);
                        results.updated++;
                        results.sources[coordinates.source] = (results.sources[coordinates.source] || 0) + 1;
                    }
                } else {
                    logger.warn(`⚠️  No coordinates found`);
                    results.failed++;
                    results.errors.push({
                        title: event.title,
                        error: 'No coordinates found'
                    });
                }

                // Enhanced rate limiting with jitter
                const delay = Math.random() * 2000 + 3000; // 3-5 seconds
                await this.delay(delay);

            } catch (error) {
                logger.error(`💥 Error processing event:`, error.message);
                results.failed++;
                results.errors.push({
                    title: event.title,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Check how many events need coordinates
     */
    async checkEventsNeedingCoordinates() {
        try {
            const { count: totalEvents, error: totalError } = await supabase
                .from('world_events')
                .select('*', { count: 'exact', head: true });

            const { count: eventsWithCoords, error: coordsError } = await supabase
                .from('world_events')
                .select('*', { count: 'exact', head: true })
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            const { count: eventsWithUrls, error: urlsError } = await supabase
                .from('world_events')
                .select('*', { count: 'exact', head: true })
                .not('source_url', 'is', null)
                .is('latitude', null);

            if (totalError || coordsError || urlsError) {
                throw new Error('Failed to fetch event counts');
            }

            return {
                total: totalEvents,
                withCoords: eventsWithCoords,
                needingCoords: eventsWithUrls,
                completionRate: Math.round((eventsWithCoords / totalEvents) * 100)
            };

        } catch (error) {
            logger.error('💥 Failed to check event status:', error);
            throw error;
        }
    }

    /**
     * Update statistics
     */
    updateStats(batchResults) {
        this.stats.batchesCompleted++;
        this.stats.totalUpdated += batchResults.updated || 0;
        this.stats.totalFailed += batchResults.failed || 0;
        this.stats.totalSkipped += batchResults.skipped || 0;
        
        // Update sources
        if (batchResults.sources) {
            Object.keys(batchResults.sources).forEach(source => {
                this.stats.sources[source] = (this.stats.sources[source] || 0) + batchResults.sources[source];
            });
        }
        
        // Calculate success rate
        const totalProcessed = this.stats.totalUpdated + this.stats.totalFailed;
        this.stats.successRate = totalProcessed > 0 ? Math.round((this.stats.totalUpdated / totalProcessed) * 100) : 0;
    }

    /**
     * Log batch summary
     */
    logBatchSummary(batchNumber, results) {
        logger.info(`\n📋 BATCH ${batchNumber} SUMMARY:`);
        logger.info('-'.repeat(50));
        logger.info(`✅ Updated: ${results.updated || 0}`);
        logger.info(`❌ Failed: ${results.failed || 0}`);
        logger.info(`⏭️  Skipped: ${results.skipped || 0}`);
        
        logger.info(`\n📊 CUMULATIVE STATS:`);
        logger.info(`🎯 Total Updated: ${this.stats.totalUpdated}`);
        logger.info(`📈 Success Rate: ${this.stats.successRate}%`);
        logger.info(`🔢 Events Processed: ${this.processedEventIds.size}`);
        logger.info(`⏱️  Runtime: ${this.getRuntime()}`);
        
        if (Object.keys(this.stats.sources).length > 0) {
            logger.info(`\n🔍 SOURCES:`);
            Object.entries(this.stats.sources).forEach(([source, count]) => {
                logger.info(`  ${source}: ${count}`);
            });
        }
    }

    /**
     * Generate final summary
     */
    async generateFinalSummary() {
        try {
            const finalStatus = await this.checkEventsNeedingCoordinates();
            const runtime = this.getRuntime();
            
            logger.info('\n🎊 FINAL PROCESSING SUMMARY:');
            logger.info('='.repeat(60));
            logger.info(`⏱️  Total Runtime: ${runtime}`);
            logger.info(`📦 Batches Processed: ${this.stats.batchesCompleted}`);
            logger.info(`✅ Total Events Updated: ${this.stats.totalUpdated}`);
            logger.info(`❌ Total Events Failed: ${this.stats.totalFailed}`);
            logger.info(`📈 Overall Success Rate: ${this.stats.successRate}%`);
            
            logger.info(`\n📊 DATABASE FINAL STATUS:`);
            logger.info(`🎯 Total Events: ${finalStatus.total}`);
            logger.info(`✅ Events with Coordinates: ${finalStatus.withCoords}`);
            logger.info(`⏳ Events Still Needing Coordinates: ${finalStatus.needingCoords}`);
            logger.info(`📈 Database Completion Rate: ${finalStatus.completionRate}%`);
            
            if (Object.keys(this.stats.sources).length > 0) {
                logger.info(`\n🔍 COORDINATE SOURCES:`);
                const sortedSources = Object.entries(this.stats.sources)
                    .sort(([,a], [,b]) => b - a);
                sortedSources.forEach(([source, count]) => {
                    const percentage = Math.round((count / this.stats.totalUpdated) * 100);
                    logger.info(`  ${source}: ${count} (${percentage}%)`);
                });
            }
            
        } catch (error) {
            logger.error('Error generating final summary:', error);
        }
    }

    /**
     * Get formatted runtime
     */
    getRuntime() {
        const start = new Date(this.stats.startTime);
        const now = new Date();
        const diffMs = now - start;
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Start improved processing
 */
async function startImprovedProcessing() {
    const args = process.argv.slice(2);
    
    const options = {
        batchSize: 25,
        batchDelay: 120000, // 2 minutes
        maxBatches: 50
    };
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg.startsWith('--batch-size=')) {
            options.batchSize = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--delay=')) {
            options.batchDelay = parseInt(arg.split('=')[1]) * 1000;
        } else if (arg.startsWith('--max-batches=')) {
            options.maxBatches = parseInt(arg.split('=')[1]);
        }
    });
    
    logger.info('🎯 Starting Improved Batch Processor');
    logger.info(`📊 Batch Size: ${options.batchSize}`);
    logger.info(`⏰ Delay: ${options.batchDelay/1000}s`);
    logger.info(`🔢 Max Batches: ${options.maxBatches}`);
    
    const processor = new ImprovedBatchProcessor(options);
    
    try {
        await processor.start();
        logger.info('🎉 Improved processing completed successfully!');
    } catch (error) {
        logger.error('💥 Improved processing failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    startImprovedProcessing()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            logger.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = {
    ImprovedBatchProcessor,
    startImprovedProcessing
};
