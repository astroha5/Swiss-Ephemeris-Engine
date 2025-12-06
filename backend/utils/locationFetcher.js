const WikipediaEventFetcher = require('../services/wikipediaEventFetcher');
const logger = require('../utils/logger');
const axios = require('axios');

// Rate limiting utilities
class RateLimiter {
    constructor(requestsPerSecond = 1) {
        this.requestsPerSecond = requestsPerSecond;
        this.lastRequestTime = 0;
        this.requestQueue = [];
        this.processing = false;
    }

    async waitForSlot() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / this.requestsPerSecond;
        
        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }
}

const rateLimiter = new RateLimiter(0.5); // 1 request per 2 seconds

// Manual geocoding service using multiple providers
class ManualGeocoder {
    constructor() {
        this.providers = [
            { name: 'nominatim', url: 'https://nominatim.openstreetmap.org/search' },
            { name: 'photon', url: 'https://photon.komoot.io/api' }
        ];
        this.cache = new Map();
    }

    async geocode(locationName) {
        if (!locationName || typeof locationName !== 'string') {
            return null;
        }

        const cleanLocation = locationName.trim();
        if (this.cache.has(cleanLocation)) {
            return this.cache.get(cleanLocation);
        }

        // Try Nominatim first (OpenStreetMap)
        try {
            await rateLimiter.waitForSlot();
            const result = await this.geocodeWithNominatim(cleanLocation);
            if (result) {
                this.cache.set(cleanLocation, result);
                return result;
            }
        } catch (error) {
          // logger.debug(`Nominatim geocoding failed for ${cleanLocation}:`, error.message);
        }

        // Fallback to Photon
        try {
            await rateLimiter.waitForSlot();
            const result = await this.geocodeWithPhoton(cleanLocation);
            if (result) {
                this.cache.set(cleanLocation, result);
                return result;
            }
        } catch (error) {
          // logger.debug(`Photon geocoding failed for ${cleanLocation}:`, error.message);
        }

        // Cache null result to avoid repeated requests
        this.cache.set(cleanLocation, null);
        return null;
    }

    async geocodeWithNominatim(location) {
        const params = {
            q: location,
            format: 'json',
            limit: 1,
            countrycodes: '', // Allow all countries
            'accept-language': 'en'
        };

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params,
            headers: {
                'User-Agent': 'Astrova-Historical-Events-Geocoder/1.0 (https://astrova.app; contact@astrova.app)'
            },
            timeout: 10000
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
                display_name: result.display_name,
                source: 'nominatim'
            };
        }

        return null;
    }

    async geocodeWithPhoton(location) {
        const params = {
            q: location,
            limit: 1,
            lang: 'en'
        };

        const response = await axios.get('https://photon.komoot.io/api', {
            params,
            headers: {
                'User-Agent': 'Astrova-Historical-Events-Geocoder/1.0 (https://astrova.app; contact@astrova.app)'
            },
            timeout: 10000
        });

        if (response.data && response.data.features && response.data.features.length > 0) {
            const feature = response.data.features[0];
            if (feature.geometry && feature.geometry.coordinates) {
                return {
                    lat: feature.geometry.coordinates[1],
                    lon: feature.geometry.coordinates[0],
                    display_name: feature.properties.name || location,
                    source: 'photon'
                };
            }
        }

        return null;
    }

    // Enhanced NLP-based location extraction from text
    extractLocationsFromText(text) {
        const locations = [];
        
        // Enhanced country patterns with more variations
        const countryPattern = /\b(United States|USA|US|America|American|United Kingdom|UK|Britain|British|England|English|France|French|Germany|German|Italy|Italian|Spain|Spanish|Russia|Russian|China|Chinese|Japan|Japanese|India|Indian|Australia|Australian|Canada|Canadian|Brazil|Brazilian|Mexico|Mexican|Egypt|Egyptian|South Africa|Nigeria|Nigerian|Argentina|Argentine|Chile|Chilean|Peru|Peruvian|Colombia|Colombian|Venezuela|Venezuelan|Israel|Israeli|Turkey|Turkish|Greece|Greek|Poland|Polish|Ukraine|Ukrainian|Iran|Iranian|Iraq|Iraqi|Afghanistan|Pakistan|Pakistani|Saudi Arabia|UAE|Qatar|Kuwait|Lebanon|Lebanese|Syria|Syrian|Jordan|Morocco|Moroccan|Algeria|Tunisia|Libya|Ethiopia|Kenya|Tanzania|Uganda|Ghana|Cameroon|Angola|Zimbabwe|Zambia|Madagascar|Netherlands|Dutch|Belgium|Belgian|Switzerland|Swiss|Austria|Austrian|Sweden|Swedish|Norway|Norwegian|Finland|Finnish|Denmark|Danish|Portugal|Portuguese|Czech Republic|Hungary|Hungarian|Romania|Bulgarian|Serbia|Croatian|Bosnia|Albania|Lithuania|Latvia|Estonia|Slovakia|Slovenia|Ireland|Irish|Iceland|Malta|Cyprus|New France|Quebec|Louisiana|Texas|California|Florida|Virginia|Massachusetts|Pennsylvania|New York|Illinois|Ohio|Michigan|Georgia|North Carolina|Tennessee|Indiana|Kentucky|Wisconsin|Maryland|Missouri|Minnesota|Alabama|Louisiana|South Carolina|Connecticut|Iowa|Oklahoma|Arkansas|Kansas|Utah|Nevada|New Mexico|West Virginia|Nebraska|Idaho|Hawaii|New Hampshire|Maine|Rhode Island|Montana|Delaware|South Dakota|North Dakota|Alaska|Vermont|Wyoming)\b/gi;
        
        // Enhanced city patterns with historical names and variants
        const cityPattern = /\b(New York|NYC|Los Angeles|LA|Chicago|Houston|Philadelphia|Philly|Phoenix|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|El Paso|Nashville|Detroit|Oklahoma City|Portland|Las Vegas|Memphis|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Kansas City|Mesa|Virginia Beach|Atlanta|Colorado Springs|Omaha|Raleigh|Miami|Oakland|Minneapolis|Tulsa|Cleveland|Wichita|Arlington|London|Paris|Berlin|Rome|Madrid|Barcelona|Amsterdam|Vienna|Zurich|Geneva|Brussels|Warsaw|Prague|Budapest|Stockholm|Oslo|Helsinki|Copenhagen|Lisbon|Athens|Moscow|St Petersburg|Sankt Petersburg|Leningrad|Kiev|Kyiv|Istanbul|Constantinople|Ankara|Tokyo|Osaka|Kyoto|Beijing|Peking|Shanghai|Hong Kong|Seoul|Singapore|Mumbai|Bombay|New Delhi|Delhi|Bangalore|Calcutta|Kolkata|Chennai|Madras|Hyderabad|Pune|Ahmedabad|Karachi|Lahore|Islamabad|Dhaka|Bangkok|Manila|Jakarta|Kuala Lumpur|Hanoi|Ho Chi Minh City|Saigon|Cairo|Alexandria|Tel Aviv|Jerusalem|Beirut|Damascus|Baghdad|Tehran|Riyadh|Dubai|Casablanca|Lagos|Johannesburg|Cape Town|Nairobi|Addis Ababa|Toronto|Montreal|Vancouver|Ottawa|Mexico City|Buenos Aires|Sao Paulo|Rio de Janeiro|Lima|Bogota|Caracas|Santiago|Havana|Sydney|Melbourne|Brisbane|Perth|Adelaide|Auckland|Wellington|Birmingham|Liverpool|Manchester|Edinburgh|Glasgow|Belfast|Cardiff|Marseille|Lyon|Toulouse|Munich|Hamburg|Frankfurt|Cologne|Milan|Naples|Turin|Florence|Venice|Seville|Valencia|Bilbao|Porto|Krakow|Gdansk|St Louis|Pittsburgh|Cincinnati|Cleveland|Buffalo|Rochester|Albany|Richmond|Norfolk|Savannah|Charleston|Jacksonville|Tampa|Orlando|Fort Lauderdale|San Juan|Anchorage|Honolulu|Portland|Salt Lake City|Las Vegas|Reno|Spokane|Boise|Helena|Cheyenne|Pierre|Bismarck|Fargo|Sioux Falls|Des Moines|Cedar Rapids|Omaha|Lincoln|Topeka|Wichita|Little Rock|Jackson|Montgomery|Tallahassee|Gainesville|Pensacola|Mobile|Baton Rouge|Shreveport|New Orleans|Tulsa|Norman|Amarillo|Lubbock|El Paso|Austin|San Antonio|Houston|Dallas|Fort Worth|Corpus Christi|Beaumont|Tyler|Abilene|Waco|College Station|Brownsville|McAllen|Laredo|Odessa|Midland|Amarillo)\b/gi;
        
        // Regional and historical location patterns
        const regionPattern = /\b(Mesopotamia|Anatolia|Balkans|Scandinavia|Iberian Peninsula|British Isles|Low Countries|Central Europe|Eastern Europe|Western Europe|Southern Europe|Northern Europe|Mediterranean|Baltic|North Sea|Black Sea|Caspian Sea|Persian Gulf|Red Sea|Arabian Peninsula|Levant|Maghreb|Sahara|Sahel|Horn of Africa|Great Lakes|Great Plains|Rocky Mountains|Appalachian|Pacific Northwest|Southwest|Midwest|Northeast|Southeast|New England|Mid-Atlantic|South|West Coast|East Coast|Crimea|Caucasus|Siberia|Central Asia|Far East|Near East|Middle East|Holy Land|Palestine|Galilee|Judea|Samaria|Transylvania|Bohemia|Moravia|Silesia|Pomerania|Prussia|Bavaria|Rhineland|Alsace|Lorraine|Normandy|Brittany|Provence|Languedoc|Catalonia|Andalusia|Castile|Aragon|Leon|Galicia|Asturias|Basque Country|Navarre|Valencia|Murcia|Extremadura|La Mancha|Toledo|Seville|Cordoba|Granada|Malaga|Cadiz|Huelva|Almeria|Jaen|Ciudad Real|Albacete|Cuenca|Guadalajara|Segovia|Avila|Salamanca|Zamora|Valladolid|Palencia|Burgos|Soria|Logroño|Vitoria|Pamplona|San Sebastian|Bilbao|Santander|Oviedo|Leon|Pontevedra|Lugo|Orense|La Coruña)\b/gi;
        
        // Specific place name patterns (for battles, treaties, etc.)
        const specificPlacePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:battle|siege|treaty|peace|agreement|conference|congress|convention|war|revolt|revolution|rebellion|uprising|massacre|incident|affair|crisis|disaster|earthquake|flood|hurricane|tornado|fire|explosion|crash|collision|accident)\b/gi;
        
        let match;
        
        // Extract countries
        while ((match = countryPattern.exec(text)) !== null) {
            locations.push(this.normalizeLocationName(match[1]));
        }
        
        // Extract cities
        while ((match = cityPattern.exec(text)) !== null) {
            locations.push(this.normalizeLocationName(match[1]));
        }
        
        // Extract regions
        while ((match = regionPattern.exec(text)) !== null) {
            locations.push(this.normalizeLocationName(match[1]));
        }
        
        // Extract specific places from event descriptions
        while ((match = specificPlacePattern.exec(text)) !== null) {
            const placeName = match[1].trim();
            if (placeName && placeName.length > 2) {
                locations.push(this.normalizeLocationName(placeName));
            }
        }
        
        // Additional patterns for historical events
        const historicalPatterns = [
            // "in [Location]" pattern
            /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g,
            // "at [Location]" pattern
            /\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g,
            // "near [Location]" pattern
            /\bnear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g,
            // "from [Location]" pattern
            /\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g,
            // "to [Location]" pattern
            /\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g
        ];
        
        historicalPatterns.forEach(pattern => {
            while ((match = pattern.exec(text)) !== null) {
                const placeName = match[1].trim();
                if (this.isValidLocationName(placeName)) {
                    locations.push(this.normalizeLocationName(placeName));
                }
            }
        });
        
        // Remove duplicates and filter out invalid locations
        const uniqueLocations = [...new Set(locations)]
            .filter(loc => this.isValidLocationName(loc))
            .sort((a, b) => b.length - a.length); // Prioritize more specific locations
        
        return uniqueLocations;
    }
    
    // Normalize location names for better matching
    normalizeLocationName(name) {
        return name
            .replace(/\b(the|of|in|at|near|from|to)\b/gi, '') // Remove common words
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }
    
    // Enhanced validation for location names
    isValidLocationName(name) {
        if (!name || typeof name !== 'string' || name.length < 2) {
            return false;
        }
        
        // Exclude common non-location words
        const excludeWords = [
            'war', 'battle', 'siege', 'treaty', 'peace', 'agreement', 'conference',
            'congress', 'convention', 'revolt', 'revolution', 'rebellion', 'uprising',
            'massacre', 'incident', 'affair', 'crisis', 'disaster', 'earthquake',
            'flood', 'hurricane', 'tornado', 'fire', 'explosion', 'crash', 'collision',
            'accident', 'the', 'of', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
            'again', 'further', 'then', 'once', 'war', 'battle', 'president',
            'general', 'army', 'navy', 'air', 'force', 'military', 'government',
            'party', 'state', 'national', 'international', 'world', 'global',
            'first', 'second', 'third', 'last', 'final', 'initial', 'early', 'late',
            'new', 'old', 'great', 'small', 'large', 'big', 'major', 'minor'
        ];
        
        const normalized = name.toLowerCase().trim();
        if (excludeWords.includes(normalized)) {
            return false;
        }
        
        // Should contain at least one letter
        if (!/[a-zA-Z]/.test(name)) {
            return false;
        }
        
        // Should not be all uppercase (likely acronym)
        if (name === name.toUpperCase() && name.length > 4) {
            return false;
        }
        
        return true;
    }
}

const manualGeocoder = new ManualGeocoder();
const fallbackLocations = require('./fallbackLocations.json');

// Enhanced fallback location resolution
class FallbackLocationResolver {
    constructor() {
        this.fallbackData = fallbackLocations;
    }
    
    // Find location by partial title matching
    findFallbackLocation(eventTitle, wikipediaTitle = '') {
        const searchTexts = [eventTitle, wikipediaTitle.replace(/_/g, ' ')].filter(Boolean);
        
        for (const searchText of searchTexts) {
            // Try exact match first
            if (this.fallbackData[searchText]) {
                return this.fallbackData[searchText];
            }
            
            // Try partial matches
            for (const [key, data] of Object.entries(this.fallbackData)) {
                if (this.isPartialMatch(searchText, key)) {
                    return data;
                }
            }
        }
        
        return null;
    }
    
    // Check if search text partially matches a fallback key
    isPartialMatch(searchText, fallbackKey) {
        const searchLower = searchText.toLowerCase();
        const keyLower = fallbackKey.toLowerCase();
        
        // Check if key words appear in search text
        const keyWords = keyLower.split(/\s+/).filter(word => word.length > 2);
        const matchedWords = keyWords.filter(word => searchLower.includes(word));
        
        // Require at least 50% of key words to match
        return matchedWords.length >= Math.max(1, Math.ceil(keyWords.length * 0.5));
    }
}

const fallbackResolver = new FallbackLocationResolver();

async function getCoordinatesFromWikipediaUrl(wikipediaUrl, eventTitle = '') {
    const fetcher = WikipediaEventFetcher;

    // Extract title from URL
    const title = wikipediaUrl.split('/wiki/')[1];
    // logger.debug(`🔍 Processing Wikipedia page: ${title}`);

    try {
        // Rate limiting for Wikipedia requests
        await rateLimiter.waitForSlot();
        
        // Attempt to get structured event data from Wikipedia and Wikidata
        const eventData = await fetcher.fetchPageSummary(title);

        if (eventData) {
            // logger.debug(`📄 Retrieved event data for: ${eventData.title}`);
            
            // Attempt to get location from Wikidata directly
            if (eventData.raw_data && eventData.raw_data.wikibase_item) {
                // logger.debug(`🔗 Found Wikidata item: ${eventData.raw_data.wikibase_item}`);
                await rateLimiter.waitForSlot();
                
                const location = await fetcher.getLocationFromWikidata(eventData.raw_data.wikibase_item);
                if (location && location.latitude && location.longitude) {
                    // logger.debug(`✅ Wikidata coordinates found: ${location.latitude}, ${location.longitude}`);
                    return { 
                        latitude: location.latitude, 
                        longitude: location.longitude,
                        source: 'wikidata',
                        location_name: location.location_name
                    };
                }
            }

            // Attempt geocoding with built-in geocoder if no direct location
            if (eventData.location_name) {
                // logger.debug(`🌍 Trying built-in geocoding for: ${eventData.location_name}`);
                const coords = await fetcher.simpleGeocode(eventData.location_name);
                if (coords && coords.lat && coords.lon) {
                    // logger.debug(`✅ Built-in geocoding successful: ${coords.lat}, ${coords.lon}`);
                    return { 
                        latitude: coords.lat, 
                        longitude: coords.lon,
                        source: 'builtin_geocoder',
                        location_name: eventData.location_name
                    };
                }
            }
            
            // Try to extract location from text if not already found
            if (!eventData.location_name) {
                const extractedLocation = fetcher.extractLocationFromText(eventData);
                if (extractedLocation) {
                    // logger.debug(`📍 Extracted location from text: ${extractedLocation}`);
                    const coords = await fetcher.simpleGeocode(extractedLocation);
                    if (coords && coords.lat && coords.lon) {
                        // logger.debug(`✅ Text extraction geocoding successful: ${coords.lat}, ${coords.lon}`);
                        return { 
                            latitude: coords.lat, 
                            longitude: coords.lon,
                            source: 'text_extraction',
                            location_name: extractedLocation
                        };
                    }
                }
            }
        }

    } catch (error) {
        if (error.response && error.response.status === 403) {
            logger.warn(`⚠️  Wikipedia API rate limited for: ${title}`);
            // Don't throw, continue to manual geocoding
        } else {
            // logger.debug('Error retrieving coordinates from Wikipedia:', error.message);
        }
    }

    // Manual geocoding fallback - extract locations from event title
    // logger.debug(`🔧 Falling back to manual geocoding for: ${eventTitle || title}`);
    const textToAnalyze = `${eventTitle} ${title.replace(/_/g, ' ')}`;
    const potentialLocations = manualGeocoder.extractLocationsFromText(textToAnalyze);
    
    for (const location of potentialLocations) {
        try {
            // logger.debug(`🌐 Manual geocoding attempt: ${location}`);
            const coords = await manualGeocoder.geocode(location);
            if (coords && coords.lat && coords.lon) {
                // logger.debug(`✅ Manual geocoding successful: ${coords.lat}, ${coords.lon}`);
                return {
                    latitude: coords.lat,
                    longitude: coords.lon,
                    source: `manual_${coords.source}`,
                    location_name: location,
                    display_name: coords.display_name
                };
            }
        } catch (error) {
            // logger.debug(`Manual geocoding failed for ${location}:`, error.message);
        }
    }

    // Final fallback: try hardcoded locations for known problematic events
    // logger.debug(`🎯 Trying fallback location resolution for: ${eventTitle || title}`);
    const fallbackLocation = fallbackResolver.findFallbackLocation(eventTitle, title);
    
    if (fallbackLocation) {
        // logger.debug(`✅ Fallback location found: ${fallbackLocation.latitude}, ${fallbackLocation.longitude} (${fallbackLocation.reason})`);
        return {
            latitude: fallbackLocation.latitude,
            longitude: fallbackLocation.longitude,
            source: fallbackLocation.source,
            location_name: fallbackLocation.location_name,
            reason: fallbackLocation.reason
        };
    }

    // logger.debug(`❌ No coordinates found for: ${eventTitle || title}`);
    return null;
}

module.exports = getCoordinatesFromWikipediaUrl;
