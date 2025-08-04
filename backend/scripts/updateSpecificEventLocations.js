#!/usr/bin/env node

/**
 * Update Specific Event Locations Script
 * 
 * This script updates specific historical events in the world_events table
 * with manually corrected location data, including proper coordinates and
 * country codes for events that were previously incorrectly geocoded or
 * had missing location information.
 * 
 * Usage:
 *   node updateSpecificEventLocations.js [--dry-run]
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// Manual location corrections for specific events
const LOCATION_CORRECTIONS = [
    {
        // Match criteria - will find events with titles containing these keywords
        titleKeywords: ['china', 'united states', 'trade war', 'start'],
        // Exact location data to set
        locationData: {
            location_name: 'Washington, D.C.',
            latitude: 38.9072,
            longitude: -77.0369,
            country_code: 'US'
        },
        description: 'Start of the China–United States trade war'
    },
    {
        titleKeywords: ['nasa', 'insight', 'lander', 'mars'],
        locationData: {
            location_name: 'Pasadena, California',
            latitude: 34.1478,
            longitude: -118.1445,
            country_code: 'US'
        },
        description: "NASA's InSight lander touches down on Mars (Mission Control)"
    },
    {
        titleKeywords: ['ukrainian', 'filmmaker', 'oleg sentsov', 'released'],
        locationData: {
            location_name: 'Boryspil International Airport, Kyiv',
            latitude: 50.3450,
            longitude: 30.8947,
            country_code: 'UA'
        },
        description: 'Ukrainian filmmaker Oleg Sentsov and 66 others are released'
    },
    {
        titleKeywords: ['muhyiddin yassin', 'prime minister', 'malaysia'],
        locationData: {
            location_name: 'Istana Negara, Kuala Lumpur',
            latitude: 3.1478,
            longitude: 101.7089,
            country_code: 'MY'
        },
        description: 'Muhyiddin Yassin is appointed as the 8th Prime Minister of Malaysia'
    },
    {
        titleKeywords: ['unemployment rate', '14.9%', 'u.s.'],
        locationData: {
            location_name: 'Washington, D.C.',
            latitude: 38.9072,
            longitude: -77.0369,
            country_code: 'US'
        },
        description: 'U.S. unemployment rate hits 14.9%'
    }
];

class SpecificEventLocationUpdater {
    constructor() {
        this.results = {
            found: 0,
            updated: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Main execution function
     */
    async run(dryRun = false) {
        try {
            console.log('🎯 Starting Specific Event Location Updates...');
            console.log('=' .repeat(60));
            
            if (dryRun) {
                console.log('🧪 Running in DRY RUN mode - no database updates will be made');
            }

            for (const correction of LOCATION_CORRECTIONS) {
                console.log(`\n🔍 Looking for: ${correction.description}`);
                
                try {
                    const event = await this.findEvent(correction.titleKeywords);
                    
                    if (event) {
                        this.results.found++;
                        console.log(`✅ Found event: "${event.title}" (ID: ${event.id})`);
                        console.log(`📅 Date: ${event.event_date}`);
                        console.log(`📍 Current location: ${event.location_name || 'None'}`);
                        console.log(`🎯 New location: ${correction.locationData.location_name}`);
                        
                        if (!dryRun) {
                            await this.updateEvent(event, correction.locationData);
                            this.results.updated++;
                            console.log(`✅ Updated successfully`);
                        } else {
                            console.log(`✅ [DRY RUN] Would update with: ${JSON.stringify(correction.locationData, null, 2)}`);
                        }
                    } else {
                        console.log(`❌ Event not found for keywords: ${correction.titleKeywords.join(', ')}`);
                    }
                    
                } catch (error) {
                    console.log(`❌ Error processing correction: ${error.message}`);
                    this.results.failed++;
                    this.results.errors.push({
                        description: correction.description,
                        error: error.message
                    });
                }
            }

            this.showResults(dryRun);
            return this.results;

        } catch (error) {
            logger.error('❌ Fatal error in specific event location updater:', error);
            throw error;
        }
    }

    /**
     * Find an event based on title keywords
     */
    async findEvent(keywords) {
        try {
            // Build a query to find events containing all keywords in the title
            let query = supabase
                .from('world_events')
                .select('id, title, description, event_date, location_name, latitude, longitude, country_code');

            // Add ILIKE filters for each keyword
            for (const keyword of keywords) {
                query = query.ilike('title', `%${keyword}%`);
            }

            const { data: events, error } = await query.limit(5);

            if (error) {
                throw error;
            }

            if (!events || events.length === 0) {
                // Try a more flexible search with OR conditions
                const orConditions = keywords.map(keyword => `title.ilike.%${keyword}%`);
                const { data: flexibleEvents, error: flexibleError } = await supabase
                    .from('world_events')
                    .select('id, title, description, event_date, location_name, latitude, longitude, country_code')
                    .or(orConditions.join(','))
                    .limit(10);

                if (flexibleError) {
                    throw flexibleError;
                }

                // Find the best match by counting keyword matches
                if (flexibleEvents && flexibleEvents.length > 0) {
                    let bestMatch = null;
                    let maxMatches = 0;

                    for (const event of flexibleEvents) {
                        const titleLower = event.title.toLowerCase();
                        const matches = keywords.filter(keyword => 
                            titleLower.includes(keyword.toLowerCase())
                        ).length;

                        if (matches > maxMatches) {
                            maxMatches = matches;
                            bestMatch = event;
                        }
                    }

                    return bestMatch;
                }

                return null;
            }

            // Return the first exact match
            return events[0];

        } catch (error) {
            logger.error('Error finding event:', error);
            throw error;
        }
    }

    /**
     * Update an event with new location data
     */
    async updateEvent(event, locationData) {
        try {
            const updateData = {
                ...locationData,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('world_events')
                .update(updateData)
                .eq('id', event.id);

            if (error) {
                throw error;
            }

        } catch (error) {
            logger.error(`Error updating event ${event.id}:`, error);
            throw error;
        }
    }

    /**
     * Show final results
     */
    showResults(dryRun) {
        console.log('\n' + '='.repeat(60));
        console.log('📈 RESULTS:');
        console.log(`🔍 Events found: ${this.results.found}/${LOCATION_CORRECTIONS.length}`);
        
        if (!dryRun) {
            console.log(`✅ Successfully updated: ${this.results.updated} events`);
        } else {
            console.log(`✅ Would update: ${this.results.found} events`);
        }
        
        console.log(`❌ Failed: ${this.results.failed} events`);

        if (this.results.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.results.errors.forEach((error, idx) => {
                console.log(`  ${idx + 1}. ${error.description}: ${error.error}`);
            });
        }

        if (this.results.found > 0) {
            console.log('\n✨ Location corrections applied successfully!');
        }
    }
}

// CLI execution
async function main() {
    const args = process.argv.slice(2);
    const updater = new SpecificEventLocationUpdater();
    
    const dryRun = args.includes('--dry-run');
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎯 Specific Event Location Updater

This script updates specific historical events with manually corrected location data.

Usage:
  node updateSpecificEventLocations.js [--dry-run]

Options:
  --dry-run    Run without making database updates (preview mode)
  --help       Show this help message

Events to be updated:
  1. Start of the China–United States trade war → Washington, D.C.
  2. NASA's InSight lander touches down on Mars → Pasadena, California
  3. Ukrainian filmmaker Oleg Sentsov released → Boryspil Airport, Kyiv
  4. Muhyiddin Yassin appointed PM of Malaysia → Istana Negara, Kuala Lumpur
  5. U.S. unemployment rate hits 14.9% → Washington, D.C.
        `);
        return;
    }
    
    try {
        await updater.run(dryRun);
    } catch (error) {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = SpecificEventLocationUpdater;
