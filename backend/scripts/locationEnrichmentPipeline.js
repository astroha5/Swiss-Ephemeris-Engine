#!/usr/bin/env node

/**
 * Master Location Enrichment Pipeline
 * 
 * This script implements the robust multi-source pipeline to enrich location data
 * for historical events in the Supabase world_events table.
 * 
 * Pipeline Steps:
 * 1. Fetch Wikipedia Article and Extract Text
 * 2. Named Entity Recognition (NER)
 * 3. Check Wikidata for Structured Properties
 * 4. Heuristic Scoring / Fallback Logic
 * 5. Geocode the Location
 * 
 * Usage:
 *   node locationEnrichmentPipeline.js [options]
 * 
 * Options:
 *   --batch-size <number>    Number of events to process per batch (default: 50)
 *   --limit <number>         Total number of events to process (default: 1000)
 *   --dry-run               Run without updating database
 *   --stats                 Show current statistics
 */

const { supabase } = require('../config/supabase');
const wikipediaEventFetcher = require('../services/wikipediaEventFetcher');
const logger = require('../utils/logger');
const axios = require('axios');

class LocationEnrichmentPipeline {
    constructor() {
        this.results = {
            processed: 0,
            updated: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            sources: {}
        };
        
        this.batchSize = 50;
        this.wikipediaAPI = 'https://en.wikipedia.org/w/api.php';
        this.wikidataAPI = 'https://query.wikidata.org/sparql';
        
        // Request configuration
        this.axiosConfig = {
            timeout: 15000,
            headers: {
                'User-Agent': 'Astrova-Location-Enrichment/1.0 (https://astrova.app; contact@astrova.app)'
            }
        };
    }

    /**
     * Main pipeline execution
     */
    async runPipeline(options = {}) {
        try {
            console.log('🚀 Starting Location Enrichment Pipeline...');
            console.log('=' .repeat(60));
            
            const batchSize = options.batchSize || this.batchSize;
            const limit = options.limit || 1000;
            const dryRun = options.dryRun || false;
            
            if (dryRun) {
                console.log('🧪 Running in DRY RUN mode - no database updates will be made');
            }
            
            // Get events with missing location data
            const { data: events, error } = await supabase
                .from('world_events')
                .select('id, title, description, event_date, source_url, location_name, latitude, longitude, country_code')
                .or('location_name.is.null,latitude.is.null,longitude.is.null,country_code.is.null')
                .order('event_date', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            if (!events || events.length === 0) {
                console.log('✅ No events found that need location enrichment');
                return this.results;
            }

            console.log(`📊 Found ${events.length} events with missing location data`);

            // Process events in batches
            const batches = this.createBatches(events, batchSize);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`\n🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} events)`);
                
                const batchResults = await this.processBatch(batch, dryRun);
                this.mergeResults(batchResults);
                
                // Rate limiting between batches
                if (i < batches.length - 1) {
                    await this.delay(1000);
                }
            }

            // Show final results
            this.showFinalResults();
            
            return this.results;

        } catch (error) {
            logger.error('❌ Fatal error in location enrichment pipeline:', error);
            throw error;
        }
    }

    /**
     * Process a batch of events
     */
    async processBatch(events, dryRun = false) {
        const batchResults = {
            processed: 0,
            updated: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            sources: {}
        };

        for (const event of events) {
            try {
                batchResults.processed++;
                
                console.log(`\n🔍 [${batchResults.processed}/${events.length}] Processing: ${event.title}`);
                console.log(`📅 Date: ${event.event_date}`);
                
                // Run the pipeline for this event
                const locationData = await this.runEventPipeline(event);
                
                if (locationData) {
                    const source = locationData.source || 'unknown';
                    batchResults.sources[source] = (batchResults.sources[source] || 0) + 1;
                    
                    if (!dryRun) {
                        await this.updateEventLocation(event, locationData);
                    }
                    
                    console.log(`✅ ${dryRun ? '[DRY RUN] ' : ''}Updated: ${locationData.location_name} (${locationData.latitude}, ${locationData.longitude}) - Source: ${source}`);
                    batchResults.updated++;
                } else {
                    console.log(`❌ No location data found`);
                    batchResults.failed++;
                    batchResults.errors.push({
                        id: event.id,
                        title: event.title,
                        error: 'No location data could be determined'
                    });
                }
                
                // Rate limiting between events
                await this.delay(500);
                
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
                batchResults.failed++;
                batchResults.errors.push({
                    id: event.id,
                    title: event.title,
                    error: error.message
                });
            }
        }

        return batchResults;
    }

    /**
     * Run the complete pipeline for a single event
     */
    async runEventPipeline(event) {
        try {
            // Step 1: Fetch Wikipedia Article and Extract Text
            const wikiIntroText = await this.fetchWikipediaArticle(event);
            if (!wikiIntroText) {
                console.log('  ⚠️  No Wikipedia article found');
                return null;
            }
            console.log('  📖 Wikipedia article fetched');

            // Step 2: Named Entity Recognition (NER)
            const detectedLocations = await this.performNER(wikiIntroText);
            console.log(`  🧠 NER detected ${detectedLocations.length} potential locations`);

            // Step 3: Check Wikidata for Structured Properties
            const wikidataLocations = await this.checkWikidataProperties(event);
            console.log(`  🔗 Wikidata returned ${wikidataLocations.length} structured locations`);

            // Step 4: Heuristic Scoring / Fallback Logic
            const mainLocation = await this.applyHeuristics(detectedLocations, wikidataLocations, wikiIntroText, event);
            if (!mainLocation) {
                console.log('  ❌ Heuristics could not determine main location');
                return null;
            }
            console.log(`  🎯 Heuristics selected: ${mainLocation.name}`);

            // Step 5: Geocode the Location
            const geocodedLocation = await this.geocodeLocation(mainLocation);
            if (!geocodedLocation) {
                console.log('  ❌ Geocoding failed');
                return null;
            }
            console.log(`  🌍 Geocoded successfully`);

            return {
                location_name: geocodedLocation.location_name,
                latitude: geocodedLocation.latitude,
                longitude: geocodedLocation.longitude,
                country_code: geocodedLocation.country_code,
                timezone: geocodedLocation.timezone,
                source: geocodedLocation.source,
                confidence: geocodedLocation.confidence || 'medium'
            };

        } catch (error) {
            logger.debug(`Error in event pipeline for ${event.title}:`, error.message);
            return null;
        }
    }

    /**
     * Step 1: Fetch Wikipedia Article and Extract Text
     */
    async fetchWikipediaArticle(event) {
        try {
            let pageTitle = null;
            
            // Try to extract page title from source URL if available
            if (event.source_url && event.source_url.includes('wikipedia.org/wiki/')) {
                pageTitle = event.source_url.split('/wiki/')[1];
            } else {
                // Search for Wikipedia page by event title
                pageTitle = await this.searchWikipediaPage(event.title);
            }
            
            if (!pageTitle) {
                return null;
            }
            
            // Fetch the article content
            const params = {
                action: 'query',
                titles: decodeURIComponent(pageTitle),
                prop: 'extracts|pageprops',
                exintro: true,
                explaintext: true,
                exsectionformat: 'plain',
                format: 'json'
            };

            const response = await axios.get(this.wikipediaAPI, { params, ...this.axiosConfig });
            const pages = response.data.query?.pages || {};
            const page = Object.values(pages)[0];
            
            if (!page || page.missing) {
                return null;
            }

            return {
                title: page.title,
                extract: page.extract,
                wikibase_item: page.pageprops?.wikibase_item
            };

        } catch (error) {
            logger.debug('Error fetching Wikipedia article:', error.message);
            return null;
        }
    }

    /**
     * Search for Wikipedia page by title
     */
    async searchWikipediaPage(title) {
        try {
            const params = {
                action: 'query',
                list: 'search',
                srsearch: title,
                srlimit: 1,
                format: 'json'
            };

            const response = await axios.get(this.wikipediaAPI, { params, ...this.axiosConfig });
            const results = response.data.query?.search || [];
            
            return results.length > 0 ? results[0].title : null;

        } catch (error) {
            logger.debug('Error searching Wikipedia:', error.message);
            return null;
        }
    }

    /**
     * Step 2: Named Entity Recognition (NER)
     */
    async performNER(wikiData) {
        try {
            const text = wikiData.extract || '';
            
            // Use the Wikipedia event fetcher's NER functionality
            const nerResults = await wikipediaEventFetcher.performNER(text);
            const detectedLocations = wikipediaEventFetcher.extractEntities(nerResults);
            
            return detectedLocations;

        } catch (error) {
            logger.debug('Error performing NER:', error.message);
            return [];
        }
    }

    /**
     * Step 3: Check Wikidata for Structured Properties
     */
    async checkWikidataProperties(event) {
        try {
            // First try to get Wikidata ID from Wikipedia article
            const wikiData = await this.fetchWikipediaArticle(event);
            const wikidataId = wikiData?.wikibase_item;
            
            if (!wikidataId) {
                return [];
            }
            
            // Use the Wikipedia event fetcher's Wikidata functionality
            const wikidataLocations = await wikipediaEventFetcher.checkWikidataForProperties(wikidataId);
            
            return wikidataLocations;

        } catch (error) {
            logger.debug('Error checking Wikidata properties:', error.message);
            return [];
        }
    }

    /**
     * Step 4: Heuristic Scoring / Fallback Logic
     */
    async applyHeuristics(detectedLocations, wikidataLocations, wikiIntroText, event) {
        const text = `${event.title} ${event.description || ''} ${wikiIntroText?.extract || ''}`.toLowerCase();
        
        // Priority 1: Single detected location
        if (detectedLocations.length === 1) {
            return {
                ...detectedLocations[0],
                source: 'ner_single'
            };
        }
        
        // Priority 2: Stock exchange events -> New York
        if (text.includes('stock exchange') || text.includes('wall street') || text.includes('nasdaq')) {
            const nyLocation = detectedLocations.find(loc => 
                loc.name.toLowerCase().includes('new york') || 
                loc.name.toLowerCase().includes('wall street')
            );
            if (nyLocation) {
                return {
                    ...nyLocation,
                    source: 'heuristic_stock_exchange'
                };
            }
            // Fallback to New York
            return {
                name: 'New York City',
                latitude: 40.7128,
                longitude: -74.0060,
                country_code: 'US',
                source: 'heuristic_stock_exchange_fallback'
            };
        }
        
        // Priority 3: Major financial centers
        const majorCities = ['new york', 'london', 'tokyo', 'hong kong', 'singapore'];
        for (const city of majorCities) {
            if (text.includes(city)) {
                const cityLocation = detectedLocations.find(loc => 
                    loc.name.toLowerCase().includes(city)
                );
                if (cityLocation) {
                    return {
                        ...cityLocation,
                        source: 'heuristic_major_city'
                    };
                }
            }
        }
        
        // Priority 4: Wikidata structured locations
        if (wikidataLocations.length > 0) {
            return {
                ...wikidataLocations[0],
                source: 'wikidata_structured'
            };
        }
        
        // Priority 5: First detected location with coordinates
        const locationWithCoords = detectedLocations.find(loc => 
            loc.latitude && loc.longitude
        );
        if (locationWithCoords) {
            return {
                ...locationWithCoords,
                source: 'ner_first_with_coords'
            };
        }
        
        // Priority 6: Text pattern extraction
        const extractedLocation = wikipediaEventFetcher.extractLocationFromText({
            title: event.title,
            description: event.description || ''
        });
        
        if (extractedLocation) {
            const geocoded = await wikipediaEventFetcher.simpleGeocode(extractedLocation);
            if (geocoded) {
                return {
                    name: extractedLocation,
                    latitude: geocoded.lat,
                    longitude: geocoded.lon,
                    country_code: geocoded.country_code,
                    source: 'pattern_extraction'
                };
            }
        }
        
        return null;
    }

    /**
     * Step 5: Geocode the Location
     */
    async geocodeLocation(location) {
        try {
            // If location already has coordinates, validate and return
            if (location.latitude && location.longitude) {
                return {
                    location_name: location.name,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    country_code: location.country_code,
                    source: location.source,
                    confidence: 'high'
                };
            }
            
            // Use the built-in geocoder
            const geocoded = await wikipediaEventFetcher.simpleGeocode(location.name);
            if (geocoded) {
                return {
                    location_name: location.name,
                    latitude: geocoded.lat,
                    longitude: geocoded.lon,
                    country_code: geocoded.country_code,
                    source: location.source,
                    confidence: 'medium'
                };
            }
            
            return null;

        } catch (error) {
            logger.debug('Error geocoding location:', error.message);
            return null;
        }
    }

    /**
     * Update event location in database
     */
    async updateEventLocation(event, locationData) {
        const updateData = {};
        
        if (locationData.location_name && !event.location_name) {
            updateData.location_name = locationData.location_name;
        }
        if (locationData.latitude && !event.latitude) {
            updateData.latitude = locationData.latitude;
        }
        if (locationData.longitude && !event.longitude) {
            updateData.longitude = locationData.longitude;
        }
        if (locationData.country_code && !event.country_code) {
            updateData.country_code = locationData.country_code;
        }
        if (locationData.timezone) {
            updateData.timezone = locationData.timezone;
        }
        
        updateData.updated_at = new Date().toISOString();

        if (Object.keys(updateData).length === 0) {
            throw new Error('No new location data to update');
        }

        const { error } = await supabase
            .from('world_events')
            .update(updateData)
            .eq('id', event.id);

        if (error) {
            throw new Error(`Database update failed: ${error.message}`);
        }
    }

    /**
     * Create batches from array
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Merge batch results into main results
     */
    mergeResults(batchResults) {
        this.results.processed += batchResults.processed;
        this.results.updated += batchResults.updated;
        this.results.failed += batchResults.failed;
        this.results.skipped += batchResults.skipped;
        this.results.errors.push(...batchResults.errors);
        
        // Merge sources
        for (const [source, count] of Object.entries(batchResults.sources)) {
            this.results.sources[source] = (this.results.sources[source] || 0) + count;
        }
    }

    /**
     * Show final results
     */
    showFinalResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📈 FINAL RESULTS:');
        console.log(`✅ Successfully updated: ${this.results.updated} events`);
        console.log(`❌ Failed to update: ${this.results.failed} events`);
        console.log(`⏭️  Skipped: ${this.results.skipped} events`);
        console.log(`📊 Total processed: ${this.results.processed} events`);
        
        if (this.results.updated > 0) {
            const successRate = ((this.results.updated / this.results.processed) * 100).toFixed(1);
            console.log(`📈 Success Rate: ${successRate}%`);
        }

        if (Object.keys(this.results.sources).length > 0) {
            console.log('\n📊 SOURCES BREAKDOWN:');
            for (const [source, count] of Object.entries(this.results.sources)) {
                console.log(`  ${source}: ${count} events`);
            }
        }

        if (this.results.errors.length > 0) {
            console.log('\n❌ ERRORS (first 5):');
            this.results.errors.slice(0, 5).forEach((error, idx) => {
                console.log(`  ${idx + 1}. ${error.title}: ${error.error}`);
            });
            if (this.results.errors.length > 5) {
                console.log(`  ... and ${this.results.errors.length - 5} more errors`);
            }
        }
    }

    /**
     * Show statistics
     */
    async showStats() {
        try {
            console.log('📊 Location Data Statistics:');
            console.log('=' .repeat(40));
            
            // Total events
            const { count: totalEvents } = await supabase
                .from('world_events')
                .select('*', { count: 'exact', head: true });

            // Events with complete location data
            const { count: withLocation } = await supabase
                .from('world_events')
                .select('*', { count: 'exact', head: true })
                .not('location_name', 'is', null)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .not('country_code', 'is', null);

            // Events missing location data
            const { count: missingLocation } = await supabase
                .from('world_events')
                .select('*', { count: 'exact', head: true })
                .or('location_name.is.null,latitude.is.null,longitude.is.null,country_code.is.null');

            console.log(`Total events: ${totalEvents}`);
            console.log(`Events with complete location data: ${withLocation}`);
            console.log(`Events missing location data: ${missingLocation}`);
            console.log(`Location completion rate: ${((withLocation / totalEvents) * 100).toFixed(1)}%`);

        } catch (error) {
            console.error('❌ Error getting statistics:', error);
        }
    }

    /**
     * Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI execution
async function main() {
    const args = process.argv.slice(2);
    const pipeline = new LocationEnrichmentPipeline();
    
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--batch-size':
                options.batchSize = parseInt(args[++i]) || 50;
                break;
            case '--limit':
                options.limit = parseInt(args[++i]) || 1000;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--stats':
                await pipeline.showStats();
                return;
            case '--help':
            case '-h':
                console.log(`
📍 Location Enrichment Pipeline

Usage:
  node locationEnrichmentPipeline.js [options]

Options:
  --batch-size <number>    Number of events to process per batch (default: 50)
  --limit <number>         Total number of events to process (default: 1000)
  --dry-run               Run without updating database
  --stats                 Show current statistics
  --help                  Show this help message

Pipeline Steps:
  1. 🎓 Fetch Wikipedia Article and Extract Text
  2. 🧠 Named Entity Recognition (NER)
  3. 🔗 Check Wikidata for Structured Properties
  4. 🎯 Heuristic Scoring / Fallback Logic
  5. 🌍 Geocode the Location

Output Format:
  {
    "event_name": "Black Monday (1987)",
    "location_name": "New York City",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "country_code": "US",
    "source": "Wikipedia + Wikidata + NER",
    "confidence": "high"
  }
                `);
                return;
        }
    }
    
    try {
        await pipeline.runPipeline(options);
    } catch (error) {
        console.error('❌ Pipeline failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = LocationEnrichmentPipeline;
