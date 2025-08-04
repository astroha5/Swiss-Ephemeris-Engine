#!/usr/bin/env node

/**
 * Script to update existing events with missing location data
 * Uses enhanced Wikipedia and Wikidata fetching to enrich location info
 */

const { supabase } = require('../config/supabase');
const wikipediaEventFetcher = require('../services/wikipediaEventFetcher');

async function updateMissingLocations(batchSize = 10) {
    console.log(`🔍 Starting location update process (batch size: ${batchSize})...`);
    
    try {
        // Get events with missing location data
        const { data: eventsWithoutLocation, error } = await supabase
            .from('world_events')
            .select('id, title, description, event_date, source_url, location_name, latitude, longitude, country_code')
            .or('location_name.is.null,latitude.is.null,longitude.is.null,country_code.is.null')
            .limit(batchSize); // Process in batches

        if (error) {
            throw error;
        }

        console.log(`📊 Found ${eventsWithoutLocation.length} events with missing location data`);

        if (eventsWithoutLocation.length === 0) {
            console.log('✅ All events already have location data!');
            return;
        }

        const fetcher = wikipediaEventFetcher;
        let updated = 0;
        let failed = 0;

        for (const event of eventsWithoutLocation) {
            try {
                console.log(`\n🔄 Processing: ${event.title}`);
                
                let locationData = null;

                // Try text-based location extraction
                if (!locationData) {
                    console.log('  📝 Attempting text-based location extraction');
                    const extractedLocation = fetcher.extractLocationFromText({
                        title: event.title,
                        description: event.description || ''
                    });
                    
                    if (extractedLocation) {
                        const geocoded = await fetcher.simpleGeocode(extractedLocation);
                        if (geocoded) {
                            locationData = {
                                location: extractedLocation,
                                latitude: geocoded.lat,
                                longitude: geocoded.lon,
                                country_code: geocoded.country_code
                            };
                        }
                    }
                }

                // Update the event if we found location data
                if (locationData) {
                    const updateData = {};
                    
                    if (locationData.location && !event.location_name) {
                        updateData.location_name = locationData.location;
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

                    if (Object.keys(updateData).length > 0) {
                        const { error: updateError } = await supabase
                            .from('world_events')
                            .update(updateData)
                            .eq('id', event.id);

                        if (updateError) {
                            throw updateError;
                        }

                        console.log(`  ✅ Updated with location: ${locationData.location} (${locationData.latitude}, ${locationData.longitude})`);
                        updated++;
                    } else {
                        console.log('  ℹ️  Event already has all location data');
                    }
                } else {
                    console.log('  ❌ No location data found');
                    failed++;
                }

                // Add a small delay to avoid overwhelming external APIs
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`  ❌ Error processing event ${event.id}:`, error.message);
                failed++;
            }
        }

        console.log('\n📈 Update Summary:');
        console.log(`✅ Successfully updated: ${updated} events`);
        console.log(`❌ Failed to update: ${failed} events`);
        console.log(`📊 Total processed: ${eventsWithoutLocation.length} events`);

        // Show remaining events with missing location data
        const { count: remainingCount } = await supabase
            .from('world_events')
            .select('*', { count: 'exact', head: true })
            .or('location_name.is.null,latitude.is.null,longitude.is.null,country_code.is.null');

        console.log(`📊 Remaining events with missing location data: ${remainingCount || 0}`);

    } catch (error) {
        console.error('❌ Error during location update process:', error);
        process.exit(1);
    }
}

async function showStats() {
    console.log('📊 Location Data Statistics:\n');
    
    try {
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

        // Events missing any location data
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

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--stats')) {
        await showStats();
    } else if (args.includes('--help') || args.includes('-h')) {
        console.log(`
📍 Update Missing Locations Script

Usage:
  node updateMissingLocations.js [options]

Options:
  --stats    Show location data statistics
  --help     Show this help message

Default: Run the location update process
        `);
    } else {
        await updateMissingLocations(100); // Process 100 events at a time
    }
}

if (require.main === module) {
    main();
}
