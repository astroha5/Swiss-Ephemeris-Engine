#!/usr/bin/env node

/**
 * Manual Location Updater - Fetches Wikipedia content to extract location data
 * This script reads source URLs and extracts precise location information
 */

const { supabase } = require('../config/supabase');
const axios = require('axios');
const cheerio = require('cheerio');

class ManualLocationUpdater {
    constructor() {
        this.results = {
            processed: 0,
            updated: 0,
            failed: 0,
            errors: []
        };
        
        // Hard-coded location mappings for specific events (fallback)
        this.locationMappings = {
            // Ancient Rome events
            'Great Fire of Rome': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Roman Emperor': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Pope': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            
            // Ancient China events
            'Han dynasty': { location: 'Chang\'an', country: 'China', country_code: 'CN', lat: 34.2667, lon: 108.9000 },
            'Dong Zhuo': { location: 'Luoyang', country: 'China', country_code: 'CN', lat: 34.6197, lon: 112.4540 },
            'Sun Quan': { location: 'Nanjing', country: 'China', country_code: 'CN', lat: 32.0603, lon: 118.7969 },
            'Eastern Wu': { location: 'Nanjing', country: 'China', country_code: 'CN', lat: 32.0603, lon: 118.7969 },

            // Additional historical battle events
            'Battle of Adrianople': { location: 'Edirne', country: 'Turkey', country_code: 'TR', lat: 41.6772, lon: 26.5559},
            'Battle of Milvian Bridge': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9333, lon: 12.4656 },
            'Battle of Tours': { location: 'Poitiers', country: 'France', country_code: 'FR', lat: 46.5802, lon: 0.3404 },

            // Empire-related events
            'Constantinople': { location: 'Istanbul', country: 'Turkey', country_code: 'TR', lat: 41.0082, lon: 28.9784 },
            'Ottoman Empire': { location: 'Istanbul', country: 'Turkey', country_code: 'TR', lat: 41.0082, lon: 28.9784 },
            
            // Alexandria events
            'Alexandria': { location: 'Alexandria', country: 'Egypt', country_code: 'EG', lat: 31.2001, lon: 29.9187 },
            
            // Battle locations
            'Battle of Cibalae': { location: 'Vinkovci', country: 'Croatia', country_code: 'HR', lat: 45.2883, lon: 18.8047 },
            'Battle of Callinicum': { location: 'Raqqa', country: 'Syria', country_code: 'SY', lat: 35.9500, lon: 39.0167 },
            'Battle of the Frigidus': { location: 'Vipava Valley', country: 'Slovenia', country_code: 'SI', lat: 45.8167, lon: 13.9667 },
            
            // Council locations
            'Council of Chalcedon': { location: 'Kadıköy', country: 'Turkey', country_code: 'TR', lat: 40.9833, lon: 29.0333 },
            
            // Other specific locations
            'Tarsus': { location: 'Tarsus', country: 'Turkey', country_code: 'TR', lat: 36.9178, lon: 34.8956 },
            'Sicily': { location: 'Palermo', country: 'Italy', country_code: 'IT', lat: 38.1157, lon: 13.3613 },
            
            // Roman Empire related events
            'Roman': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Empire': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Caesar': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Augustus': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Nero': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Galba': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Licinius': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Constantine': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Theodosius': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Gratian': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Honorius': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Visigoths': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Alaric': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            
            // Byzantine Empire
            'Byzantine': { location: 'Istanbul', country: 'Turkey', country_code: 'TR', lat: 41.0082, lon: 28.9784 },
            'Belisarius': { location: 'Istanbul', country: 'Turkey', country_code: 'TR', lat: 41.0082, lon: 28.9784 },
            
            // Chinese dynasties and events
            'China': { location: 'Beijing', country: 'China', country_code: 'CN', lat: 39.9042, lon: 116.4074 },
            'Chinese': { location: 'Beijing', country: 'China', country_code: 'CN', lat: 39.9042, lon: 116.4074 },
            'dynasty': { location: 'Beijing', country: 'China', country_code: 'CN', lat: 39.9042, lon: 116.4074 },
            'Wang Mang': { location: 'Chang\'an', country: 'China', country_code: 'CN', lat: 34.2667, lon: 108.9000 },
            'Xin dynasty': { location: 'Chang\'an', country: 'China', country_code: 'CN', lat: 34.2667, lon: 108.9000 },
            'Lü Bu': { location: 'Luoyang', country: 'China', country_code: 'CN', lat: 34.6197, lon: 112.4540 },
            
            // Persian/Sasanian Empire
            'Persian': { location: 'Isfahan', country: 'Iran', country_code: 'IR', lat: 32.6546, lon: 51.6680 },
            'Sasanian': { location: 'Ctesiphon', country: 'Iraq', country_code: 'IQ', lat: 33.0938, lon: 44.5836 },
            'Hormizd': { location: 'Ctesiphon', country: 'Iraq', country_code: 'IQ', lat: 33.0938, lon: 44.5836 },
            'Vistahm': { location: 'Ctesiphon', country: 'Iraq', country_code: 'IQ', lat: 33.0938, lon: 44.5836 },
            
            // Christianity and Church events
            'Christian': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Christianity': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Church': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Patriarch': { location: 'Alexandria', country: 'Egypt', country_code: 'EG', lat: 31.2001, lon: 29.9187 },
            'Athanasius': { location: 'Alexandria', country: 'Egypt', country_code: 'EG', lat: 31.2001, lon: 29.9187 },
            'Council': { location: 'Rome', country: 'Italy', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            
            // Egypt/Ptolemaic events
            'Egypt': { location: 'Alexandria', country: 'Egypt', country_code: 'EG', lat: 31.2001, lon: 29.9187 },
            'Egyptian': { location: 'Alexandria', country: 'Egypt', country_code: 'EG', lat: 31.2001, lon: 29.9187 },
            'hieroglyphs': { location: 'Luxor', country: 'Egypt', country_code: 'EG', lat: 25.6872, lon: 32.6396 },
            'Esmet-Akhom': { location: 'Philae', country: 'Egypt', country_code: 'EG', lat: 24.0267, lon: 32.8839 },
            
            // Germanic tribes
            'Germanic': { location: 'Berlin', country: 'Germany', country_code: 'DE', lat: 52.5200, lon: 13.4050 },
            'Frankish': { location: 'Paris', country: 'France', country_code: 'FR', lat: 48.8566, lon: 2.3522 },
            'Arbogast': { location: 'Paris', country: 'France', country_code: 'FR', lat: 48.8566, lon: 2.3522 }
        };
    }

    /**
     * Main function to update missing locations
     */
    async updateMissingLocations(options = {}) {
        try {
            const limit = options.limit || 50;
            console.log(`🌍 Starting manual location update for ${limit} events...`);
            console.log('='.repeat(60));

            // Get events with missing location data that have source URLs
            const { data: events, error } = await supabase
                .from('world_events')
                .select('id, title, description, event_date, source_url, source_name, location_name, latitude, longitude, country_code')
                .or('location_name.is.null,latitude.is.null,longitude.is.null,country_code.is.null')
                .not('source_url', 'is', null)
                .order('event_date', { ascending: true })
                .limit(limit);

            if (error) {
                throw error;
            }

            if (!events || events.length === 0) {
                console.log('✅ No events with missing location data found!');
                return this.results;
            }

            console.log(`📊 Found ${events.length} events to process\n`);

            // Process each event
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                console.log(`\n🔍 [${i + 1}/${events.length}] Processing: ${event.title}`);
                console.log(`📅 Date: ${event.event_date}`);
                console.log(`🔗 Source: ${event.source_url}`);

                await this.processEvent(event);
                
                // Add delay to be respectful to Wikipedia
                await this.delay(1000);
            }

            // Show final results
            console.log('\n' + '='.repeat(60));
            console.log('📈 FINAL RESULTS:');
            console.log(`✅ Successfully updated: ${this.results.updated} events`);
            console.log(`❌ Failed to update: ${this.results.failed} events`);
            console.log(`📊 Total processed: ${this.results.processed} events`);

            if (this.results.errors.length > 0) {
                console.log('\n❌ ERRORS:');
                this.results.errors.forEach(error => {
                    console.log(`- ${error.title}: ${error.error}`);
                });
            }

            return this.results;

        } catch (error) {
            console.error('❌ Fatal error:', error);
            throw error;
        }
    }

    /**
     * Process a single event
     */
    async processEvent(event) {
        try {
            this.results.processed++;
            
            let locationData = null;

            // Method 1: Try to extract from Wikipedia URL
            if (event.source_url && event.source_url.includes('wikipedia.org')) {
                locationData = await this.extractLocationFromWikipedia(event.source_url, event.title);
            }

            // Method 2: Try hard-coded mappings if Wikipedia extraction failed
            if (!locationData) {
                locationData = this.getLocationFromMappings(event.title, event.description);
            }

            // Method 3: Try parsing the event title for known patterns
            if (!locationData) {
                locationData = this.parseLocationFromTitle(event.title);
            }

            if (locationData) {
                await this.updateEventLocation(event, locationData);
                console.log(`✅ Updated: ${locationData.location} (${locationData.lat}, ${locationData.lon})`);
                this.results.updated++;
            } else {
                console.log(`❌ No location data found`);
                this.results.failed++;
                this.results.errors.push({
                    id: event.id,
                    title: event.title,
                    error: 'No location data could be determined'
                });
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            this.results.failed++;
            this.results.errors.push({
                id: event.id,
                title: event.title,
                error: error.message
            });
        }
    }

    /**
     * Extract location from Wikipedia article
     */
    async extractLocationFromWikipedia(url, title) {
        try {
            console.log('  📖 Fetching Wikipedia content...');
            
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'AstroVA Historical Events Bot/1.0 (https://github.com/astrova)'
                }
            });

            const $ = cheerio.load(response.data);
            
            // Method 1: Look for coordinates in the page
            const coords = this.extractCoordinatesFromWikipedia($);
            if (coords) {
                const locationName = this.extractLocationNameFromWikipedia($, title);
                return {
                    location: locationName || 'Unknown',
                    lat: coords.lat,
                    lon: coords.lon,
                    country_code: coords.country_code || this.guessCountryFromCoords(coords.lat, coords.lon)
                };
            }

            // Method 2: Look for location mentions in the article
            const locationFromText = this.extractLocationFromWikipediaText($, title);
            if (locationFromText) {
                return locationFromText;
            }

            return null;

        } catch (error) {
            console.log(`  ⚠️ Wikipedia fetch failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract coordinates from Wikipedia page
     */
    extractCoordinatesFromWikipedia($) {
        try {
            // Look for coordinates in the geodata
            const geoMicroformat = $('.geo');
            if (geoMicroformat.length > 0) {
                const lat = parseFloat($('.latitude', geoMicroformat).text());
                const lon = parseFloat($('.longitude', geoMicroformat).text());
                if (!isNaN(lat) && !isNaN(lon)) {
                    return { lat, lon };
                }
            }

            // Look for coordinates in the coord template
            const coordSpan = $('span.coordinates');
            if (coordSpan.length > 0) {
                const coordText = coordSpan.text();
                const coordMatch = coordText.match(/([+-]?\d+\.?\d*)[°\s]+([+-]?\d+\.?\d*)/);
                if (coordMatch) {
                    return {
                        lat: parseFloat(coordMatch[1]),
                        lon: parseFloat(coordMatch[2])
                    };
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract location name from Wikipedia page
     */
    extractLocationNameFromWikipedia($, title) {
        try {
            // Try to get location from the infobox
            const locationRows = $('.infobox tr').filter((i, el) => {
                const label = $(el).find('td:first-child, th:first-child').text().toLowerCase();
                return label.includes('location') || label.includes('place') || label.includes('city');
            });

            if (locationRows.length > 0) {
                const location = $(locationRows[0]).find('td:last-child').text().trim();
                if (location) return location;
            }

            // Try to get from the first paragraph
            const firstPara = $('.mw-parser-output > p').first().text();
            const locationMatch = firstPara.match(/(?:in|at|near)\s+([A-Z][a-zA-Z\s]+?)(?:,|\.|$)/);
            if (locationMatch) {
                return locationMatch[1].trim();
            }

            return title.split(' ')[0]; // Fallback to first word of title
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract location from Wikipedia article text
     */
    extractLocationFromWikipediaText($, title) {
        try {
            const text = $('.mw-parser-output').text().toLowerCase();
            
            // Look for common location patterns
            const patterns = [
                /(?:in|at|near)\s+([A-Z][a-zA-Z\s]+?)(?:,|\.|$)/g,
                /(?:city of|town of)\s+([A-Z][a-zA-Z\s]+)/g,
                /([A-Z][a-zA-Z\s]+?)\s+(?:empire|kingdom|dynasty)/g
            ];

            for (const pattern of patterns) {
                const matches = [...text.matchAll(pattern)];
                if (matches.length > 0) {
                    const location = matches[0][1].trim();
                    // Try to get coordinates for this location
                    const knownLocation = this.getKnownLocationCoords(location);
                    if (knownLocation) {
                        return knownLocation;
                    }
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get location from hard-coded mappings
     */
    getLocationFromMappings(title, description = '') {
        const text = (title + ' ' + (description || '')).toLowerCase();
        
        for (const [keyword, location] of Object.entries(this.locationMappings)) {
            if (text.includes(keyword.toLowerCase())) {
                console.log(`  📍 Found mapping for: ${keyword}`);
                return location;
            }
        }
        
        return null;
    }

    /**
     * Parse location from event title using patterns
     */
    parseLocationFromTitle(title) {
        // Pattern matching for common historical event formats
        const patterns = [
            // "Battle of Location"
            { regex: /Battle of ([A-Z][a-zA-Z\s]+)/i, type: 'battle' },
            // "Siege of Location"
            { regex: /Siege of ([A-Z][a-zA-Z\s]+)/i, type: 'siege' },
            // "Location is captured/destroyed/etc"
            { regex: /([A-Z][a-zA-Z\s]+?) is (?:captured|destroyed|founded|established)/i, type: 'city' },
            // "Emperor of Location"
            { regex: /Emperor of ([A-Z][a-zA-Z\s]+)/i, type: 'empire' }
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern.regex);
            if (match) {
                const locationName = match[1].trim();
                const knownLocation = this.getKnownLocationCoords(locationName);
                if (knownLocation) {
                    console.log(`  📍 Parsed from title: ${locationName}`);
                    return knownLocation;
                }
            }
        }

        return null;
    }

    /**
     * Get coordinates for known locations
     */
    getKnownLocationCoords(locationName) {
        const knownLocations = {
            'Rome': { location: 'Rome', country_code: 'IT', lat: 41.9028, lon: 12.4964 },
            'Constantinople': { location: 'Istanbul', country_code: 'TR', lat: 41.0082, lon: 28.9784 },
            'Alexandria': { location: 'Alexandria', country_code: 'EG', lat: 31.2001, lon: 29.9187 },
            'Athens': { location: 'Athens', country_code: 'GR', lat: 37.9755, lon: 23.7348 },
            'Jerusalem': { location: 'Jerusalem', country_code: 'IL', lat: 31.7683, lon: 35.2137 },
            'Damascus': { location: 'Damascus', country_code: 'SY', lat: 33.5138, lon: 36.2765 },
            'Baghdad': { location: 'Baghdad', country_code: 'IQ', lat: 33.3152, lon: 44.3661 },
            'Cairo': { location: 'Cairo', country_code: 'EG', lat: 30.0444, lon: 31.2357 },
            'London': { location: 'London', country_code: 'GB', lat: 51.5074, lon: -0.1278 },
            'Paris': { location: 'Paris', country_code: 'FR', lat: 48.8566, lon: 2.3522 },
            'Beijing': { location: 'Beijing', country_code: 'CN', lat: 39.9042, lon: 116.4074 },
            'Chang\'an': { location: 'Xi\'an', country_code: 'CN', lat: 34.2667, lon: 108.9000 },
            'Luoyang': { location: 'Luoyang', country_code: 'CN', lat: 34.6197, lon: 112.4540 },
            'Nanjing': { location: 'Nanjing', country_code: 'CN', lat: 32.0603, lon: 118.7969 }
        };

        const normalized = locationName.toLowerCase().trim();
        for (const [key, coords] of Object.entries(knownLocations)) {
            if (key.toLowerCase() === normalized || normalized.includes(key.toLowerCase())) {
                return coords;
            }
        }

        return null;
    }

    /**
     * Guess country code from coordinates
     */
    guessCountryFromCoords(lat, lon) {
        // Very basic country guessing based on lat/lon ranges
        if (lat >= 25 && lat <= 48 && lon >= -10 && lon <= 40) return 'EU'; // Europe region
        if (lat >= 20 && lat <= 50 && lon >= 70 && lon <= 140) return 'CN'; // China region
        if (lat >= 25 && lat <= 37 && lon >= 26 && lon <= 45) return 'TR'; // Turkey/Middle East
        if (lat >= 35 && lat <= 42 && lon >= 10 && lon <= 20) return 'IT'; // Italy
        
        return null;
    }

    /**
     * Update event location in database
     */
    async updateEventLocation(event, locationData) {
        const updateData = {};
        
        if (locationData.location && !event.location_name) {
            updateData.location_name = locationData.location;
        }
        if (locationData.lat && !event.latitude) {
            updateData.latitude = locationData.lat;
        }
        if (locationData.lon && !event.longitude) {
            updateData.longitude = locationData.lon;
        }
        if (locationData.country_code && !event.country_code) {
            updateData.country_code = locationData.country_code;
        }

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
     * Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const updater = new ManualLocationUpdater();

    try {
        if (args.includes('--stats')) {
            await updater.showStats();
        } else if (args.includes('--help') || args.includes('-h')) {
            console.log(`
🌍 Manual Location Updater

Usage:
  node manualLocationUpdater.js [options]

Options:
  --limit <number>     Limit number of events to process (default: 50)
  --stats              Show location data statistics
  --help, -h          Show this help message

Examples:
  node manualLocationUpdater.js
  node manualLocationUpdater.js --limit 100
  node manualLocationUpdater.js --stats

This script fetches Wikipedia content and uses hard-coded mappings to
accurately determine location information for historical events.
            `);
        } else {
            const limitArg = args.find(arg => arg.startsWith('--limit'));
            const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf(limitArg) + 1]) : 50;
            
            const results = await updater.updateMissingLocations({ limit });
            
            // Show final statistics
            if (results.updated > 0) {
                console.log('\n📊 Updated Statistics:');
                await updater.showStats();
            }
        }
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = ManualLocationUpdater;
