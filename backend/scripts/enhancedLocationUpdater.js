#!/usr/bin/env node

/**
 * Enhanced Location Updater
 * Uses the country_codes.csv data to improve location parsing and update NULL locations
 * Implements smart country detection and city/state extraction for Wikipedia events
 */

const { supabase } = require('../config/supabase');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class EnhancedLocationUpdater {
    constructor() {
        this.countryCodes = new Map();
        this.countryLookup = new Map(); // For reverse lookups and variations
        this.citiesData = new Map(); // City name -> {country, coordinates}
        this.citiesByCountry = new Map(); // Country code -> Set of cities
        this.geocodeCache = new Map();
        this.batchSize = 20;
        
        // Enhanced location patterns (ordered by specificity)
        this.locationPatterns = [
            // City, State/Country format (most specific)
            /\b([A-Z][a-zA-Z\s\-'\.]+),\s*([A-Z][a-zA-Z\s\-'\.]+)(?=\s|$|\.|,|;|!|\?)/g,
            
            // "in [City, State]" or "in [City]" patterns
            /\bin\s+([A-Z][a-zA-Z\s\-'\.]+(?:,\s*[A-Z][a-zA-Z\s\-'\.]+)?)(?=\s(?:results?|causes?|leads?|kills?|injures?|destroys?|damages?|affects?|[a-z]))/g,
            
            // Parenthetical locations
            /\(([A-Z][a-zA-Z\s\-'\.]+(?:,\s*[A-Z][a-zA-Z\s\-'\.]+)?)\)/g,
            
            // Battle/Siege/Attack patterns
            /\b(?:Battle|Siege|Attack|Bombing|Earthquake|Fire|Flood|Riot)\s+(?:of|in|at)\s+([A-Z][a-zA-Z\s\-'\.]{2,40})/gi,
            
            // Event location patterns (e.g., "London Bridge attack")
            /^([A-Z][a-zA-Z\s\-'\.]+)\s+(?:attack|bombing|earthquake|fire|flood|riot|disaster|incident)/i,
            
            // "at [Location]" or "of [Location]" patterns  
            /\b(?:at|of)\s+([A-Z][a-zA-Z\s\-'\.]{2,40})(?=\s)/g,
            
            // Country-specific patterns
            /\b(?:United\s+States?|USA?|America)\b/gi,
            /\b(?:United\s+Kingdom|UK|Britain|England|Scotland|Wales)\b/gi,
            /\b(?:Soviet\s+Union|USSR|Russia)\b/gi
        ];
        
        // US States mapping for better location recognition
        this.usStates = new Set([
            'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
            'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
            'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
            'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
            'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
            'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
            'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
            'wisconsin', 'wyoming'
        ]);
        
        // Common non-location words to filter out
        this.nonLocationWords = new Set([
            'the', 'and', 'but', 'for', 'with', 'from', 'this', 'that', 'they', 'them', 'their',
            'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
            'january', 'february', 'march', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 
            'saturday', 'sunday', 'emperor', 'king', 'queen', 'president', 'prime', 'minister', 
            'general', 'captain', 'admiral', 'world', 'war', 'army', 'navy', 'air', 'force', 
            'battle', 'treaty', 'peace', 'agreement', 'discovery', 'religion', 'independence', 
            'revolution', 'empire', 'kingdom', 'republic', 'crisis', 'act', 'law', 'bill', 
            'amendment', 'constitution', 'government', 'parliament', 'university', 'college', 
            'school', 'hospital', 'airport', 'station', 'bridge', 'canal', 'company', 
            'corporation', 'foundation', 'organization', 'association', 'society', 'north', 
            'south', 'east', 'west', 'central', 'lower', 'upper', 'great', 'little', 'first', 
            'second', 'third', 'fourth', 'fifth', 'last', 'final', 'new', 'old', 'ancient'
        ]);
    }

    /**
     * Load country codes from CSV
     */
    async loadCountryCodes() {
        console.log('📊 Loading country codes from CSV...');
        
        const csvPath = path.join(__dirname, '../../data/country_codes.csv');
        
        if (!fs.existsSync(csvPath)) {
            throw new Error(`Country codes CSV not found at: ${csvPath}`);
        }

        return new Promise((resolve, reject) => {
            const countries = [];
            
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    countries.push(row);
                })
                .on('end', () => {
                    this.processCountryData(countries);
                    console.log(`✅ Loaded ${countries.length} countries from CSV`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    /**
     * Load cities data from CSV
     */
    async loadCitiesData() {
        console.log('🏙️ Loading cities data from CSV...');
        
        const csvPath = path.join(__dirname, '../../data/cities_improved.csv');
        
        if (!fs.existsSync(csvPath)) {
            throw new Error(`Cities CSV not found at: ${csvPath}`);
        }

        return new Promise((resolve, reject) => {
            const cities = [];
            
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    cities.push(row);
                })
                .on('end', () => {
                    this.processCitiesData(cities);
                    console.log(`✅ Loaded ${cities.length} cities from CSV`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    /**
     * Process country data and create lookup maps
     */
    processCountryData(countries) {
        for (const country of countries) {
            const iso_name = country.iso_name?.trim();
            const official_name = country.official_name?.trim();
            const alpha_2 = country.alpha_2?.trim();
            const alpha_3 = country.alpha_3?.trim();

            if (!iso_name || !alpha_2) continue;

            const countryInfo = {
                iso_name,
                official_name,
                alpha_2,
                alpha_3,
                numeric: country.numeric
            };

            // Store by alpha-2 code
            this.countryCodes.set(alpha_2, countryInfo);

            // Create lookup variations
            this.addCountryLookup(iso_name.toLowerCase(), countryInfo);
            
            if (official_name && official_name !== iso_name) {
                this.addCountryLookup(official_name.toLowerCase(), countryInfo);
                
                // Clean official name (remove "the", "Republic of", etc.)
                const cleanOfficial = official_name
                    .replace(/^(the\s+|republic\s+of\s+|kingdom\s+of\s+|state\s+of\s+)/i, '')
                    .trim();
                if (cleanOfficial && cleanOfficial.toLowerCase() !== iso_name.toLowerCase()) {
                    this.addCountryLookup(cleanOfficial.toLowerCase(), countryInfo);
                }
            }

            // Add alpha codes
            this.addCountryLookup(alpha_2.toLowerCase(), countryInfo);
            if (alpha_3) {
                this.addCountryLookup(alpha_3.toLowerCase(), countryInfo);
            }

            // Add common variations
            this.addCommonVariations(iso_name, countryInfo);
        }

        console.log(`📝 Created ${this.countryLookup.size} country lookup variations`);
    }

    /**
     * Process cities data and create lookup maps
     */
    processCitiesData(cities) {
        let processedCount = 0;
        let skippedCount = 0;
        
        for (const city of cities) {
            const cityName = city.name?.trim();
            const countryName = city.country?.trim();
            
            if (!cityName || !countryName) {
                skippedCount++;
                continue;
            }

            // Find the country code for this country
            let countryInfo = this.findCountry(countryName);
            if (!countryInfo) {
                // Try alternative country name matching
                const altCountryInfo = this.findCountryAlternative(countryName);
                if (altCountryInfo) {
                    countryInfo = altCountryInfo;
                } else {
                    // Debug: Log first few unmatched countries
                    if (skippedCount < 5) {
                        console.log(`    ⚠️ Could not match country: "${countryName}" for city: "${cityName}"`);
                    }
                    skippedCount++;
                    continue; // Skip if we can't match the country
                }
            }

            const cityData = {
                name: cityName,
                country: countryInfo.iso_name,
                country_code: countryInfo.alpha_2,
                source: city.source || 'cities_csv'
            };

            // Store city by name (lowercase for lookup)
            const cityKey = cityName.toLowerCase();
            this.citiesData.set(cityKey, cityData);

            // Store cities by country
            if (!this.citiesByCountry.has(countryInfo.alpha_2)) {
                this.citiesByCountry.set(countryInfo.alpha_2, new Set());
            }
            this.citiesByCountry.get(countryInfo.alpha_2).add(cityName);

            // Add alternative city names/spellings if needed
            this.addCityVariations(cityName, cityData);
            processedCount++;
        }

        console.log(`🏙️ Processed ${processedCount} cities successfully, ${skippedCount} skipped`);
        console.log(`🏙️ Total unique cities in database: ${this.citiesData.size} across ${this.citiesByCountry.size} countries`);
    }

    /**
     * Add city name variations for better matching
     */
    addCityVariations(cityName, cityData) {
        const variations = new Set();
        
        // Remove common prefixes/suffixes
        variations.add(cityName.replace(/^(Greater|Old|New|North|South|East|West)\s+/i, ''));
        variations.add(cityName.replace(/\s+(City|Town|Municipality)$/i, ''));
        
        // Handle special cases
        const specialCases = {
            'New York': ['NYC', 'New York City'],
            'Los Angeles': ['LA', 'L.A.'],
            'San Francisco': ['SF', 'San Fran'],
            'Washington': ['Washington DC', 'Washington D.C.', 'DC'],
            'St. Petersburg': ['Saint Petersburg'],
            'São Paulo': ['Sao Paulo'],
            'Rio de Janeiro': ['Rio'],
            'Mumbai': ['Bombay'],
            'Chennai': ['Madras'],
            'Kolkata': ['Calcutta'],
            'Beijing': ['Peking'],
            'Ho Chi Minh City': ['Saigon']
        };

        if (specialCases[cityName]) {
            specialCases[cityName].forEach(variant => variations.add(variant));
        }

        // Store variations
        variations.forEach(variation => {
            if (variation && variation !== cityName && variation.length > 1) {
                this.citiesData.set(variation.toLowerCase(), cityData);
            }
        });
    }

    /**
     * Find country with alternative matching including US states
     */
    findCountryAlternative(countryName) {
        // Check if it's a US state first
        if (this.usStates.has(countryName.toLowerCase())) {
            return this.findCountry('United States');
        }
        
        // Additional country matching logic for cities CSV
        const alternatives = {
            'USA': 'United States',
            'US': 'United States',
            'America': 'United States',
            'UK': 'United Kingdom', 
            'Britain': 'United Kingdom',
            'England': 'United Kingdom',
            'Scotland': 'United Kingdom',
            'Wales': 'United Kingdom',
            'UAE': 'United Arab Emirates',
            'South Korea': 'Korea (the Republic of)',
            'North Korea': 'Korea (the Democratic People\'s Republic of)',
            // US State abbreviations
            'CA': 'United States', 'NY': 'United States', 'TX': 'United States', 'FL': 'United States',
            'PA': 'United States', 'IL': 'United States', 'OH': 'United States', 'GA': 'United States',
            'NC': 'United States', 'MI': 'United States', 'NJ': 'United States', 'VA': 'United States',
            'WA': 'United States', 'AZ': 'United States', 'MA': 'United States', 'TN': 'United States',
            'IN': 'United States', 'MO': 'United States', 'MD': 'United States', 'WI': 'United States',
            'CO': 'United States', 'MN': 'United States', 'SC': 'United States', 'AL': 'United States',
            'LA': 'United States', 'KY': 'United States', 'OR': 'United States', 'OK': 'United States',
            'CT': 'United States', 'UT': 'United States', 'IA': 'United States', 'NV': 'United States',
            'AR': 'United States', 'MS': 'United States', 'KS': 'United States', 'NM': 'United States',
            'NE': 'United States', 'WV': 'United States', 'ID': 'United States', 'HI': 'United States',
            'NH': 'United States', 'ME': 'United States', 'MT': 'United States', 'RI': 'United States',
            'DE': 'United States', 'SD': 'United States', 'ND': 'United States', 'AK': 'United States',
            'VT': 'United States', 'WY': 'United States',
            // Common country name mappings from cities CSV
            'Brazil': 'Brazil',
            'Canada': 'Canada', 
            'China': 'China',
            'France': 'France',
            'Germany': 'Germany',
            'India': 'India',
            'Japan': 'Japan',
            'Italy': 'Italy',
            'Mexico': 'Mexico',
            'Australia': 'Australia',
            'Spain': 'Spain',
            'Netherlands': 'Netherlands (Kingdom of the)',
            'Russia': 'Russian Federation (the)',
            'Turkey': 'Turkey',
            'Poland': 'Poland',
            'Argentina': 'Argentina',
            'South Africa': 'South Africa',
            'Egypt': 'Egypt',
            'Thailand': 'Thailand',
            'Vietnam': 'Viet Nam',
            'Indonesia': 'Indonesia',
            'Philippines': 'Philippines (the)',
            'Malaysia': 'Malaysia',
            'Singapore': 'Singapore',
            'Taiwan': 'Taiwan (Province of China)',
            'Hong Kong': 'Hong Kong',
            'Pakistan': 'Pakistan',
            'Bangladesh': 'Bangladesh',
            'Sri Lanka': 'Sri Lanka',
            'Myanmar': 'Myanmar',
            'Cambodia': 'Cambodia',
            'Laos': 'Lao People\'s Democratic Republic (the)',
            'Mongolia': 'Mongolia'
        };

        const alt = alternatives[countryName];
        if (alt) {
            return this.findCountry(alt);
        }

        return null;
    }

    /**
     * Add country lookup with variations
     */
    addCountryLookup(key, countryInfo) {
        if (key && key.length >= 2) {
            // Skip common English words that might conflict with country codes
            const commonWords = new Set(['in', 'on', 'at', 'to', 'be', 'or', 'as', 'is', 'it', 'us', 'an', 'am']);
            
            if (!commonWords.has(key.toLowerCase())) {
                this.countryLookup.set(key, countryInfo);
            }
        }
    }

    /**
     * Add common country name variations
     */
    addCommonVariations(countryName, countryInfo) {
        const name = countryName.toLowerCase();
        
        const variations = {
            'united states': ['usa', 'america', 'us', 'united states of america'],
            'united kingdom': ['uk', 'britain', 'great britain', 'england'],
            'russia': ['russian federation', 'soviet union', 'ussr'],
            'china': ['people\'s republic of china', 'prc'],
            'south korea': ['korea', 'republic of korea'],
            'north korea': ['democratic people\'s republic of korea', 'dprk'],
            'iran': ['islamic republic of iran'],
            'syria': ['syrian arab republic'],
            'venezuela': ['bolivarian republic of venezuela'],
            'bolivia': ['plurinational state of bolivia'],
            'democratic republic of the congo': ['congo', 'drc'],
            'czech republic': ['czechia'],
            'myanmar': ['burma'],
            'eswatini': ['swaziland']
        };

        if (variations[name]) {
            variations[name].forEach(variant => {
                this.addCountryLookup(variant, countryInfo);
            });
        }
    }

    /**
     * Enhanced location extraction from text
     */
    extractLocationFromText(title, description = '') {
        const text = `${title} ${description}`;
        const locations = new Set();

        // Try each pattern
        for (const pattern of this.locationPatterns) {
            let match;
            const regex = new RegExp(pattern.source, pattern.flags);
            
            while ((match = regex.exec(text)) !== null) {
                const captured = match[1]?.trim();
                if (captured && this.isValidLocationName(captured)) {
                    locations.add(captured);
                }
            }
        }

        // Parse and prioritize locations
        const locationArray = Array.from(locations);
        return this.parseAndPrioritizeLocations(locationArray);
    }

    /**
     * Parse locations and extract city/country information
     */
    parseAndPrioritizeLocations(locations) {
        const parsed = [];

        for (const location of locations) {
            const parsed_location = this.parseLocation(location);
            if (parsed_location) {
                parsed.push(parsed_location);
            }
        }

        // Sort by confidence score
        parsed.sort((a, b) => b.confidence - a.confidence);
        
        return parsed.length > 0 ? parsed[0] : null;
    }

    /**
     * Parse a single location string with enhanced city matching
     */
    parseLocation(locationStr) {
        // Handle "City, Country" format (highest confidence)
        const commaMatch = locationStr.match(/^([^,]+),\s*(.+)$/);
        
        if (commaMatch) {
            const [, cityPart, countryPart] = commaMatch;
            const cityName = cityPart.trim();
            const countryName = countryPart.trim();
            
            const countryInfo = this.findCountry(countryName);
            
            if (countryInfo) {
                // Verify city exists in our database
                const cityData = this.findCity(cityName);
                
                if (cityData && cityData.country_code === countryInfo.alpha_2) {
                    // Perfect match: city and country both found and match
                    return {
                        original: locationStr,
                        city: cityData.name,
                        country: countryInfo.iso_name,
                        country_code: countryInfo.alpha_2,
                        confidence: 0.95,
                        format: 'verified_city_country',
                        cityData: cityData
                    };
                } else {
                    // Country found but city not verified - still good
                    return {
                        original: locationStr,
                        city: cityName,
                        country: countryInfo.iso_name,
                        country_code: countryInfo.alpha_2,
                        confidence: 0.8,
                        format: 'city_country'
                    };
                }
            }
        }

        // Try to match as single city name
        const cityData = this.findCity(locationStr);
        if (cityData) {
            return {
                original: locationStr,
                city: cityData.name,
                country: cityData.country,
                country_code: cityData.country_code,
                confidence: 0.85,
                format: 'city_only',
                cityData: cityData
            };
        }

        // Try to match as country only
        const countryInfo = this.findCountry(locationStr);
        if (countryInfo) {
            return {
                original: locationStr,
                city: null,
                country: countryInfo.iso_name,
                country_code: countryInfo.alpha_2,
                confidence: 0.7,
                format: 'country_only'
            };
        }

        // Try to extract city/country from longer text
        const extractedLocation = this.extractFromLongerText(locationStr);
        if (extractedLocation) {
            return extractedLocation;
        }

        return null;
    }

    /**
     * Extract location from longer text using city and country databases
     */
    extractFromLongerText(locationStr) {
        const words = locationStr.split(/\s+/);
        
        // Try to find cities in the text
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j <= Math.min(words.length, i + 4); j++) { // Limit to 4 words for city names
                const phrase = words.slice(i, j).join(' ');
                const cityData = this.findCity(phrase);
                
                if (cityData) {
                    return {
                        original: locationStr,
                        city: cityData.name,
                        country: cityData.country,
                        country_code: cityData.country_code,
                        confidence: 0.75,
                        format: 'extracted_city',
                        cityData: cityData
                    };
                }
            }
        }

        // Try to find countries in the text (skip single words unless they're clearly countries)
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j <= Math.min(words.length, i + 3); j++) { // Limit to 3 words for country names
                const phrase = words.slice(i, j).join(' ');
                
                // Skip short phrases that are likely prepositions or common words
                if (phrase.length < 3) continue;
                
                const countryInfo = this.findCountry(phrase);
                
                if (countryInfo) {
                    const remaining = words.filter((_, idx) => idx < i || idx >= j).join(' ');
                    return {
                        original: locationStr,
                        city: remaining.trim() || null,
                        country: countryInfo.iso_name,
                        country_code: countryInfo.alpha_2,
                        confidence: 0.6,
                        format: 'extracted_country'
                    };
                }
            }
        }

        return null;
    }

    /**
     * Find city in the cities database
     */
    findCity(cityName) {
        if (!cityName) return null;
        
        const normalized = cityName.toLowerCase().trim();
        return this.citiesData.get(normalized) || null;
    }

    /**
     * Find country information by name
     */
    findCountry(name) {
        if (!name) return null;
        
        const normalized = name.toLowerCase().trim();
        return this.countryLookup.get(normalized) || null;
    }

    /**
     * Check if extracted text is a valid location name
     */
    isValidLocationName(location) {
        if (!location || location.length < 2 || location.length > 100) {
            return false;
        }

        const normalized = location.toLowerCase().trim();
        
        // Skip common non-location words
        if (this.nonLocationWords.has(normalized)) {
            return false;
        }

        // Should contain at least one letter
        if (!/[a-zA-Z]/.test(location)) {
            return false;
        }

        // Skip if it's mostly numbers
        if (/^\d+$/.test(location.replace(/\s/g, ''))) {
            return false;
        }

        return true;
    }

    /**
     * Enhanced geocoding using cities database and known locations
     */
    async enhancedGeocode(locationData) {
        const cacheKey = `${locationData.country_code}_${locationData.city || 'capital'}`;
        
        if (this.geocodeCache.has(cacheKey)) {
            return this.geocodeCache.get(cacheKey);
        }

        let result = null;

        // First priority: Use verified city data with coordinates if available
        if (locationData.cityData && locationData.cityData.coordinates) {
            result = {
                lat: locationData.cityData.coordinates.lat,
                lon: locationData.cityData.coordinates.lon,
                country_code: locationData.country_code,
                source: 'cities_database'
            };
        }

        // Second priority: Try known locations from existing geocoding
        if (!result) {
            const knownLocations = this.getKnownLocations();
            
            // Try exact city match
            if (locationData.city) {
                const cityKey = locationData.city.toLowerCase();
                result = knownLocations[cityKey];
            }

            // Try country name
            if (!result) {
                const countryKey = locationData.country.toLowerCase();
                result = knownLocations[countryKey];
            }

            // Try country code
            if (!result && locationData.country_code) {
                const codeKey = locationData.country_code.toLowerCase();
                result = knownLocations[codeKey];
            }
        }

        // Third priority: Get approximate coordinates for major cities
        if (!result && locationData.city) {
            result = this.getApproximateCityCoordinates(locationData.city, locationData.country_code);
        }

        // Final fallback: Capital city coordinates
        if (!result) {
            result = this.getCapitalCoordinates(locationData.country_code);
        }

        if (result) {
            result.country_code = locationData.country_code;
            this.geocodeCache.set(cacheKey, result);
        }

        return result;
    }

    /**
     * Get approximate coordinates for cities based on country and city patterns
     */
    getApproximateCityCoordinates(cityName, countryCode) {
        // This could be expanded with a more comprehensive city coordinates database
        // For now, we'll use the capital as a reasonable approximation
        const capital = this.getCapitalCoordinates(countryCode);
        
        if (capital) {
            // Add some randomness to avoid all cities in a country having same coordinates
            const latOffset = (Math.random() - 0.5) * 2; // ±1 degree
            const lonOffset = (Math.random() - 0.5) * 2; // ±1 degree
            
            return {
                lat: capital.lat + latOffset,
                lon: capital.lon + lonOffset,
                source: 'approximate_city'
            };
        }
        
        return null;
    }

    /**
     * Get known locations from existing geocoding data
     */
    getKnownLocations() {
        return {
            // Major cities and countries from wikipediaEventFetcher.js
            'new york': { lat: 40.7128, lon: -74.0060 },
            'london': { lat: 51.5074, lon: -0.1278 },
            'paris': { lat: 48.8566, lon: 2.3522 },
            'berlin': { lat: 52.5200, lon: 13.4050 },
            'rome': { lat: 41.9028, lon: 12.4964 },
            'madrid': { lat: 40.4168, lon: -3.7038 },
            'moscow': { lat: 55.7558, lon: 37.6176 },
            'tokyo': { lat: 35.6762, lon: 139.6503 },
            'beijing': { lat: 39.9042, lon: 116.4074 },
            'mumbai': { lat: 19.0760, lon: 72.8777 },
            'delhi': { lat: 28.6139, lon: 77.2090 },
            'cairo': { lat: 30.0444, lon: 31.2357 },
            'sydney': { lat: -33.8688, lon: 151.2093 },
            'toronto': { lat: 43.6532, lon: -79.3832 },
            'buenos aires': { lat: -34.6118, lon: -58.3960 },
            
            // Countries
            'united states': { lat: 38.9072, lon: -77.0369 },
            'united kingdom': { lat: 51.5074, lon: -0.1278 },
            'france': { lat: 48.8566, lon: 2.3522 },
            'germany': { lat: 52.5200, lon: 13.4050 },
            'italy': { lat: 41.9028, lon: 12.4964 },
            'spain': { lat: 40.4168, lon: -3.7038 },
            'russia': { lat: 55.7558, lon: 37.6176 },
            'china': { lat: 39.9042, lon: 116.4074 },
            'japan': { lat: 35.6762, lon: 139.6503 },
            'india': { lat: 28.6139, lon: 77.2090 },
            'australia': { lat: -35.2809, lon: 149.1300 },
            'canada': { lat: 45.4215, lon: -75.6972 },
            'brazil': { lat: -15.8267, lon: -47.9218 },
            'mexico': { lat: 19.4326, lon: -99.1332 },
            'egypt': { lat: 30.0444, lon: 31.2357 }
        };
    }

    /**
     * Get capital city coordinates for a country code
     */
    getCapitalCoordinates(countryCode) {
        const capitals = {
            'US': { lat: 38.9072, lon: -77.0369 }, // Washington, D.C.
            'GB': { lat: 51.5074, lon: -0.1278 },  // London
            'FR': { lat: 48.8566, lon: 2.3522 },   // Paris
            'DE': { lat: 52.5200, lon: 13.4050 },  // Berlin
            'IT': { lat: 41.9028, lon: 12.4964 },  // Rome
            'ES': { lat: 40.4168, lon: -3.7038 },  // Madrid
            'RU': { lat: 55.7558, lon: 37.6176 },  // Moscow
            'CN': { lat: 39.9042, lon: 116.4074 }, // Beijing
            'JP': { lat: 35.6762, lon: 139.6503 }, // Tokyo
            'IN': { lat: 28.6139, lon: 77.2090 },  // New Delhi
            'AU': { lat: -35.2809, lon: 149.1300 }, // Canberra
            'CA': { lat: 45.4215, lon: -75.6972 }, // Ottawa
            'BR': { lat: -15.8267, lon: -47.9218 }, // Brasília
            'MX': { lat: 19.4326, lon: -99.1332 }, // Mexico City
            'EG': { lat: 30.0444, lon: 31.2357 }   // Cairo
        };

        return capitals[countryCode] || null;
    }

    /**
     * Update events with missing location data
     */
    async updateMissingLocations(options = {}) {
        try {
            console.log('🚀 Starting enhanced location update process...');
            
            await this.loadCountryCodes();
            await this.loadCitiesData();
            
            // Get events with missing location data
            const { data: events, error } = await supabase
                .from('world_events')
                .select('id, title, description, event_date, location_name, latitude, longitude, country_code')
                .or('location_name.is.null,latitude.is.null,longitude.is.null,country_code.is.null')
                .limit(options.limit || 100)
                .order('event_date', { ascending: false });

            if (error) {
                throw error;
            }

            console.log(`📊 Found ${events.length} events with missing location data`);

            if (events.length === 0) {
                console.log('✅ All events already have location data!');
                return { updated: 0, failed: 0, total: 0 };
            }

            const results = {
                total: events.length,
                updated: 0,
                failed: 0,
                errors: []
            };

            // Process in batches
            const batches = this.createBatches(events, this.batchSize);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`\n🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} events)`);
                
                const batchResults = await this.processBatch(batch);
                results.updated += batchResults.updated;
                results.failed += batchResults.failed;
                results.errors.push(...batchResults.errors);
                
                // Rate limiting
                if (i < batches.length - 1) {
                    await this.delay(500);
                }
            }

            console.log('\n📈 Final Results:');
            console.log(`✅ Successfully updated: ${results.updated} events`);
            console.log(`❌ Failed to update: ${results.failed} events`);
            console.log(`📊 Total processed: ${results.total} events`);

            if (results.errors.length > 0) {
                console.log(`\n⚠️ Errors encountered:`);
                results.errors.slice(0, 5).forEach((error, idx) => {
                    console.log(`  ${idx + 1}. ${error.title}: ${error.error}`);
                });
                if (results.errors.length > 5) {
                    console.log(`  ... and ${results.errors.length - 5} more errors`);
                }
            }

            return results;

        } catch (error) {
            console.error('❌ Error in enhanced location update:', error);
            throw error;
        }
    }

    /**
     * Process a batch of events
     */
    async processBatch(events) {
        const results = {
            updated: 0,
            failed: 0,
            errors: []
        };

        for (const event of events) {
            try {
                console.log(`  🔍 Processing: ${event.title}`);
                
                // Extract location using enhanced parsing
                const locationData = this.extractLocationFromText(event.title, event.description);
                
                if (!locationData) {
                    console.log(`    ❌ No location found`);
                    results.failed++;
                    continue;
                }

                const cityInfo = locationData.city ? ` ${locationData.city},` : '';
                const formatInfo = locationData.format ? ` [${locationData.format}]` : '';
                const confidenceInfo = ` (confidence: ${(locationData.confidence * 100).toFixed(0)}%)`;
                console.log(`    📍 Found:${cityInfo} ${locationData.country} (${locationData.country_code})${formatInfo}${confidenceInfo}`);

                // Get coordinates
                const coordinates = await this.enhancedGeocode(locationData);
                
                if (!coordinates) {
                    console.log(`    ❌ No coordinates found`);
                    results.failed++;
                    continue;
                }

                // Prepare update data
                const updateData = {};
                
                if (!event.location_name && locationData.original) {
                    updateData.location_name = locationData.original;
                }
                if (!event.latitude && coordinates.lat) {
                    updateData.latitude = coordinates.lat;
                }
                if (!event.longitude && coordinates.lon) {
                    updateData.longitude = coordinates.lon;
                }
                if (!event.country_code && locationData.country_code) {
                    updateData.country_code = locationData.country_code;
                }

                // Update database
                if (Object.keys(updateData).length > 0) {
                    const { error: updateError } = await supabase
                        .from('world_events')
                        .update(updateData)
                        .eq('id', event.id);

                    if (updateError) {
                        throw updateError;
                    }

                    console.log(`    ✅ Updated with coordinates: ${coordinates.lat}, ${coordinates.lon}`);
                    results.updated++;
                } else {
                    console.log(`    ℹ️ Event already has all location data`);
                }

                // Small delay between requests
                await this.delay(100);

            } catch (error) {
                console.error(`    ❌ Error processing ${event.title}:`, error.message);
                results.failed++;
                results.errors.push({
                    id: event.id,
                    title: event.title,
                    error: error.message
                });
            }
        }

        return results;
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
     * Delay function for rate limiting
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Show statistics about location data
     */
    async showStats() {
        try {
            console.log('📊 Enhanced Location Data Statistics:\n');
            
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

            // Events by country
            const { data: countryCounts } = await supabase
                .from('world_events')
                .select('country_code')
                .not('country_code', 'is', null);

            const countryStats = {};
            countryCounts.forEach(event => {
                countryStats[event.country_code] = (countryStats[event.country_code] || 0) + 1;
            });

            const topCountries = Object.entries(countryStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);

            console.log(`Total events: ${totalEvents}`);
            console.log(`Events with complete location data: ${withLocation}`);
            console.log(`Events missing location data: ${missingLocation}`);
            console.log(`Location completion rate: ${((withLocation / totalEvents) * 100).toFixed(1)}%`);
            
            console.log('\n🌍 Top Countries by Event Count:');
            topCountries.forEach(([code, count], index) => {
                console.log(`  ${index + 1}. ${code}: ${count} events`);
            });

        } catch (error) {
            console.error('❌ Error getting statistics:', error);
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const updater = new EnhancedLocationUpdater();

    try {
        if (args.includes('--stats')) {
            await updater.showStats();
        } else if (args.includes('--help') || args.includes('-h')) {
            console.log(`
🌍 Enhanced Location Updater

Usage:
  node enhancedLocationUpdater.js [options]

Options:
  --stats              Show location data statistics
  --limit <number>     Limit number of events to process (default: 100)
  --help, -h          Show this help message

Examples:
  node enhancedLocationUpdater.js
  node enhancedLocationUpdater.js --limit 50
  node enhancedLocationUpdater.js --stats

This script uses the country_codes.csv data to improve location parsing
and update events with missing location information.
            `);
        } else {
            const limitArg = args.find(arg => arg.startsWith('--limit'));
            const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf(limitArg) + 1]) : 100;
            
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

module.exports = EnhancedLocationUpdater;
