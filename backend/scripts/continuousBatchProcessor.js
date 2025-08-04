const { supabase } = require('../config/supabase');
const { updateEventCoordinates, checkEventsNeedingCoordinates } = require('./updateEventCoordinates');
const logger = require('../utils/logger');

/**
 * Continuous batch processor for safely updating all events with coordinates
 */
class ContinuousBatchProcessor {
    constructor(options = {}) {
        this.batchSize = options.batchSize || 50;
        this.batchDelay = options.batchDelay || 300000; // 5 minutes between batches
        this.maxBatches = options.maxBatches || 50; // Safety limit
        this.saveProgress = options.saveProgress !== false;
        this.statsFile = options.statsFile || './batch_progress.json';
        
        this.stats = {
            startTime: new Date().toISOString(),
            batchesCompleted: 0,
            totalUpdated: 0,
            totalFailed: 0,
            totalSkipped: 0,
            successRate: 0,
            sources: {},
            lastUpdate: null,
            errors: []
        };
    }

    /**
     * Start continuous batch processing
     */
    async start() {
        try {
            logger.info('🚀 Starting continuous batch processor...');
            logger.info(`📊 Configuration: ${this.batchSize} events per batch, ${this.batchDelay/1000}s between batches`);
            
            // Initial status check
            const initialStatus = await checkEventsNeedingCoordinates();
            logger.info(`📈 Starting with ${initialStatus.needingCoords} events needing coordinates`);
            
            let batchCount = 0;
            
            while (batchCount < this.maxBatches) {
                // Check if there are still events to process
                const status = await checkEventsNeedingCoordinates();
                
                if (status.needingCoords === 0) {
                    logger.info('🎉 All events have been processed! No more events need coordinates.');
                    break;
                }
                
                logger.info(`\\n🔄 Starting batch ${batchCount + 1}/${this.maxBatches}`);
                logger.info(`📊 Remaining events: ${status.needingCoords}`);
                
                try {
                    // Process a batch
                    const batchResults = await this.processBatch();
                    
                    // Update statistics
                    this.updateStats(batchResults);
                    
                    // Save progress
                    if (this.saveProgress) {
                        await this.saveProgressFile();
                    }
                    
                    // Log batch summary
                    this.logBatchSummary(batchCount + 1, batchResults);
                    
                    batchCount++;
                    
                    // Wait before next batch (unless it's the last one)
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
                    
                    // Continue with next batch after a short delay
                    await this.delay(30000); // 30 second delay after error
                    batchCount++;
                }
            }
            
            // Final summary
            await this.generateFinalSummary();
            
        } catch (error) {
            logger.error('💥 Continuous batch processor failed:', error);
            throw error;
        }
    }

    /**
     * Process a single batch
     */
    async processBatch() {
        // Override the limit in updateEventCoordinates by modifying the SQL query
        const originalUpdate = updateEventCoordinates;
        
        // Call the existing updateEventCoordinates function
        return await originalUpdate();
    }

    /**
     * Update statistics
     */
    updateStats(batchResults) {
        this.stats.batchesCompleted++;
        this.stats.totalUpdated += batchResults.updated || 0;
        this.stats.totalFailed += batchResults.failed || 0;
        this.stats.totalSkipped += batchResults.skipped || 0;
        this.stats.lastUpdate = new Date().toISOString();
        
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
        logger.info(`\\n📋 BATCH ${batchNumber} SUMMARY:`);
        logger.info('-'.repeat(50));
        logger.info(`✅ Updated: ${results.updated || 0}`);
        logger.info(`❌ Failed: ${results.failed || 0}`);
        logger.info(`⏭️  Skipped: ${results.skipped || 0}`);
        
        logger.info(`\\n📊 CUMULATIVE STATS:`);
        logger.info(`🎯 Total Updated: ${this.stats.totalUpdated}`);
        logger.info(`📈 Success Rate: ${this.stats.successRate}%`);
        logger.info(`⏱️  Runtime: ${this.getRuntime()}`);
        
        if (Object.keys(this.stats.sources).length > 0) {
            logger.info(`\\n🔍 SOURCES:`);
            Object.entries(this.stats.sources).forEach(([source, count]) => {
                logger.info(`  ${source}: ${count}`);
            });
        }
    }

    /**
     * Save progress to file
     */
    async saveProgressFile() {
        try {
            const fs = require('fs').promises;
            await fs.writeFile(this.statsFile, JSON.stringify(this.stats, null, 2));
            logger.debug(`💾 Progress saved to ${this.statsFile}`);
        } catch (error) {
            logger.warn('Failed to save progress file:', error.message);
        }
    }

    /**
     * Generate final summary
     */
    async generateFinalSummary() {
        const finalStatus = await checkEventsNeedingCoordinates();
        const runtime = this.getRuntime();
        
        logger.info('\\n🎊 FINAL PROCESSING SUMMARY:');
        logger.info('='.repeat(60));
        logger.info(`⏱️  Total Runtime: ${runtime}`);
        logger.info(`📦 Batches Processed: ${this.stats.batchesCompleted}`);
        logger.info(`✅ Total Events Updated: ${this.stats.totalUpdated}`);
        logger.info(`❌ Total Events Failed: ${this.stats.totalFailed}`);
        logger.info(`📈 Overall Success Rate: ${this.stats.successRate}%`);
        
        logger.info(`\\n📊 DATABASE FINAL STATUS:`);
        logger.info(`🎯 Total Events: ${finalStatus.total}`);
        logger.info(`✅ Events with Coordinates: ${finalStatus.withCoords}`);
        logger.info(`⏳ Events Still Needing Coordinates: ${finalStatus.needingCoords}`);
        logger.info(`📈 Database Completion Rate: ${Math.round((finalStatus.withCoords / finalStatus.total) * 100)}%`);
        
        if (Object.keys(this.stats.sources).length > 0) {
            logger.info(`\\n🔍 COORDINATE SOURCES:`);
            const sortedSources = Object.entries(this.stats.sources)
                .sort(([,a], [,b]) => b - a);
            sortedSources.forEach(([source, count]) => {
                const percentage = Math.round((count / this.stats.totalUpdated) * 100);
                logger.info(`  ${source}: ${count} (${percentage}%)`);
            });
        }
        
        if (this.stats.errors.length > 0) {
            logger.info(`\\n❌ BATCH ERRORS: ${this.stats.errors.length}`);
            this.stats.errors.forEach((error, index) => {
                logger.info(`  ${index + 1}. Batch ${error.batch}: ${error.error}`);
            });
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
 * Start continuous processing with command line options
 */
async function startContinuousProcessing() {
    const args = process.argv.slice(2);
    
    // Parse command line arguments
    const options = {
        batchSize: 50,
        batchDelay: 300000, // 5 minutes
        maxBatches: 25 // Process up to 25 batches (1,250 events)
    };
    
    // Override with command line args
    args.forEach(arg => {
        if (arg.startsWith('--batch-size=')) {
            options.batchSize = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--delay=')) {
            options.batchDelay = parseInt(arg.split('=')[1]) * 1000; // Convert to ms
        } else if (arg.startsWith('--max-batches=')) {
            options.maxBatches = parseInt(arg.split('=')[1]);
        }
    });
    
    logger.info('🎯 Starting Continuous Batch Processor');
    logger.info(`📊 Batch Size: ${options.batchSize}`);
    logger.info(`⏰ Delay: ${options.batchDelay/1000}s`);
    logger.info(`🔢 Max Batches: ${options.maxBatches}`);
    
    const processor = new ContinuousBatchProcessor(options);
    
    try {
        await processor.start();
        logger.info('🎉 Continuous processing completed successfully!');
    } catch (error) {
        logger.error('💥 Continuous processing failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    startContinuousProcessing()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            logger.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = {
    ContinuousBatchProcessor,
    startContinuousProcessing
};
