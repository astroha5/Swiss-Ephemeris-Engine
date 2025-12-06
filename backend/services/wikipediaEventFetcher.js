const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

/**
 * Wikipedia Event Fetcher Service
 * Fetches major historical events from Wikipedia and Wikidata
 * Extracts structured data: title, date, location, summary, category
 */
class WikipediaEventFetcher {
  constructor() {
    this.wikipediaAPI = 'https://en.wikipedia.org/w/api.php';
    this.wikipediaREST = 'https://en.wikipedia.org/api/rest_v1';
    this.wikidataAPI = 'https://query.wikidata.org/sparql';
    
    // Request configuration
    this.axiosConfig = {
      timeout: 10000,
      headers: {
        'User-Agent': 'Astrova-Historical-Events-Fetcher/1.0 (https://astrova.app; contact@astrova.app)'
      }
    };

    // Category mappings from Wikipedia to your schema
    this.categoryMappings = {
      'financial': ['Financial crisis', 'Stock market crashes', 'Economic history', 'Banking crises', 'Currency crises'],
      'natural_disaster': ['Natural disasters', 'Earthquakes', 'Tsunamis', 'Hurricanes', 'Volcanic eruptions', 'Floods', 'Droughts'],
      'political': ['Political events', 'Elections', 'Coups d\'état', 'Revolutions', 'Government', 'Independence movements'],
      'war': ['Wars', 'Military conflicts', 'Battles', 'World wars', 'Civil wars', 'Military history'],
      'terrorism': ['Terrorist incidents', 'Terrorist attacks', 'September 11 attacks', 'Bombings'],
      'pandemic': ['Pandemics', 'Epidemics', 'Disease outbreaks', 'Public health emergencies', 'COVID-19 pandemic'],
      'technology': ['Space exploration', 'Technological breakthroughs', 'Internet history', 'Computer history'],
      'social': ['Social movements', 'Civil rights movements', 'Protests', 'Social history'],
      'accident': ['Nuclear accidents', 'Industrial accidents', 'Aviation accidents', 'Maritime disasters']
    };

    // Keywords for impact level determination
    this.impactLevelKeywords = {
      'extreme': ['global', 'worldwide', 'catastrophic', 'massive', 'unprecedented', 'deadliest', 'worst', 'major', 'great depression', 'world war', 'pandemic'],
      'high': ['national', 'significant', 'major', 'severe', 'serious', 'widespread', 'historic', 'important'],
      'medium': ['regional', 'notable', 'considerable', 'substantial', 'local'],
      'low': ['minor', 'small', 'limited', 'brief', 'short-term']
    };
  }

  /**
   * Main method to fetch historical events from multiple sources
   * @param {Object} options - Configuration options
   * @returns {Array} Array of structured event objects
   */
  async fetchHistoricalEvents(options = {}) {
    try {
      logger.info('🌍 Starting Wikipedia historical events fetching...');

      const events = [];
      
      // Fetch from different sources
      if (options.useCategories !== false) {
        const categoryEvents = await this.fetchFromCategories(options);
        events.push(...categoryEvents);
      }
      
      if (options.useOnThisDay !== false) {
        const dailyEvents = await this.fetchOnThisDayEvents(options);
        events.push(...dailyEvents);
      }
      
      if (options.useWikidata !== false) {
        const wikidataEvents = await this.fetchFromWikidata(options);
        events.push(...wikidataEvents);
      }

      if (options.useTimelines !== false) {
        const timelineEvents = await this.fetchFromTimelines(options);
        events.push(...timelineEvents);
      }

      // Remove duplicates and process
      const uniqueEvents = this.removeDuplicates(events);
      const processedEvents = await this.processAndEnrichEvents(uniqueEvents);

      logger.info(`✅ Successfully fetched ${processedEvents.length} unique historical events`);
      return processedEvents;

    } catch (error) {
      logger.error('Error fetching historical events from Wikipedia:', error);
      throw error;
    }
  }

  /**
   * Fetch events from Wikipedia categories
   */
  async fetchFromCategories(options = {}) {
    const events = [];
    const categories = options.categories || this.getDefaultCategories();
    
    logger.info(`📂 Fetching events from ${categories.length} Wikipedia categories...`);

    for (const category of categories) {
      try {
        const categoryEvents = await this.fetchCategoryMembers(category, options);
        events.push(...categoryEvents);
        
        // Rate limiting
        await this.delay(100);
      } catch (error) {
        logger.warn(`Failed to fetch category ${category}:`, error.message);
      }
    }

    return events;
  }

  /**
   * Fetch category members from Wikipedia
   */
  async fetchCategoryMembers(category, options = {}) {
    try {
      const limit = options.categoryLimit || 50;
      const url = `${this.wikipediaAPI}`;
      
      const params = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Category:${category}`,
        cmlimit: limit,
        format: 'json',
        cmnamespace: 0 // Main namespace only
      };

      const response = await axios.get(url, { params, ...this.axiosConfig });
      const members = response.data.query?.categorymembers || [];

      const events = [];
      for (const member of members) {
        try {
          const eventData = await this.fetchPageSummary(member.title);
          if (eventData && this.isValidEvent(eventData)) {
            eventData.source_category = category;
            events.push(eventData);
          }
          
          // Rate limiting
          await this.delay(50);
        } catch (error) {
          // logger.debug(`Failed to fetch page ${member.title}:`, error.message);
        }
      }

      logger.info(`📄 Fetched ${events.length} events from category: ${category}`);
      return events;

    } catch (error) {
      logger.error(`Error fetching category ${category}:`, error);
      return [];
    }
  }

  /**
   * Fetch page summary from Wikipedia REST API
   */
  async fetchPageSummary(title) {
    try {
      const encodedTitle = encodeURIComponent(title);
      const url = `${this.wikipediaREST}/page/summary/${encodedTitle}`;
      
      const response = await axios.get(url, this.axiosConfig);
      const data = response.data;

      if (!data || data.type === 'disambiguation') {
        return null;
      }

      // Extract structured data
      const eventData = {
        title: data.title,
        description: data.extract || data.description || '',
        wikipedia_url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
        source_name: 'wikipedia_api',
        raw_data: {
          pageid: data.pageid,
          wikibase_item: data.wikibase_item,
          thumbnail: data.thumbnail,
          coordinates: data.coordinates,
          lang: data.lang
        }
      };

      // Extract date, location, and category from title and description
      const enrichedData = await this.enrichEventData(eventData);
      
      return enrichedData;

    } catch (error) {
      if (error.response?.status === 404) {
        // logger.debug(`Page not found: ${title}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetch "On This Day" events from Wikipedia
   */
  async fetchOnThisDayEvents(options = {}) {
    try {
      logger.info('📅 Fetching "On This Day" events from Wikipedia...');
      
      const events = [];
      const startDate = options.startDate || moment().subtract(1, 'year');
      const endDate = options.endDate || moment();
      const daysToFetch = options.daysToFetch || 30;
      
      // Sample random days throughout the year
      const dates = this.generateRandomDates(startDate, endDate, daysToFetch);
      
      for (const date of dates) {
        try {
          const dailyEvents = await this.fetchDayEvents(date.month(), date.date());
          events.push(...dailyEvents);
          
          // Rate limiting
          await this.delay(200);
        } catch (error) {
          // logger.debug(`Failed to fetch events for ${date.format('MM-DD')}:`, error.message);
        }
      }

      logger.info(`📅 Fetched ${events.length} "On This Day" events`);
      return events;

    } catch (error) {
      logger.error('Error fetching On This Day events:', error);
      return [];
    }
  }

  /**
   * Fetch events for a specific day
   */
  async fetchDayEvents(month, day) {
    try {
      const url = `${this.wikipediaREST}/feed/onthisday/events/${month}/${day}`;
      
      const response = await axios.get(url, this.axiosConfig);
      const data = response.data;

      const events = [];
      
      if (data.events) {
        for (const event of data.events) {
          try {
            const eventData = {
              title: event.text,
              description: event.text,
              event_date: this.parseEventDate(event.year, month, day),
              wikipedia_url: event.pages?.[0]?.content_urls?.desktop?.page,
              source_name: 'wikipedia_onthisday',
              raw_data: {
                year: event.year,
                pages: event.pages
              }
            };

            const enrichedData = await this.enrichEventData(eventData);
            if (enrichedData && this.isValidEvent(enrichedData)) {
              events.push(enrichedData);
            }
          } catch (error) {
            // logger.debug('Error processing daily event:', error.message);
          }
        }
      }

      return events;

    } catch (error) {
      // logger.debug(`Error fetching day events for ${month}/${day}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch events from Wikidata SPARQL
   */
  async fetchFromWikidata(options = {}) {
    try {
      logger.info('🔍 Fetching events from Wikidata...');
      
      const limit = options.wikidataLimit || 100;
      const startYear = options.startYear || 1900;
      const endYear = options.endYear || new Date().getFullYear();

      const sparqlQuery = `
        SELECT DISTINCT ?event ?eventLabel ?date ?locationLabel ?typeLabel ?description WHERE {
          ?event wdt:P31/wdt:P279* wd:Q1190554.  # Instance of historical event
          ?event wdt:P585 ?date.                  # Point in time
          
          OPTIONAL { ?event wdt:P276 ?location. } # Location
          OPTIONAL { ?event wdt:P31 ?type. }      # Instance of
          OPTIONAL { ?event schema:description ?description. }
          
          FILTER(YEAR(?date) >= ${startYear} && YEAR(?date) <= ${endYear})
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        ORDER BY DESC(?date)
        LIMIT ${limit}
      `;

      const response = await axios.get(this.wikidataAPI, {
        params: {
          query: sparqlQuery,
          format: 'json'
        },
        ...this.axiosConfig
      });

      const bindings = response.data.results?.bindings || [];
      const events = [];

      for (const binding of bindings) {
        try {
          const eventData = {
            title: binding.eventLabel?.value || 'Unknown Event',
            description: binding.description?.value || binding.eventLabel?.value || '',
            event_date: binding.date?.value,
            location_name: binding.locationLabel?.value,
            event_type: binding.typeLabel?.value,
            source_name: 'wikidata',
            wikidata_uri: binding.event?.value,
            raw_data: binding
          };

          const enrichedData = await this.enrichEventData(eventData);
          if (enrichedData && this.isValidEvent(enrichedData)) {
            events.push(enrichedData);
          }
        } catch (error) {
          // logger.debug('Error processing Wikidata event:', error.message);
        }
      }

      logger.info(`🔍 Fetched ${events.length} events from Wikidata`);
      return events;

    } catch (error) {
      logger.error('Error fetching from Wikidata:', error);
      return [];
    }
  }

  /**
   * Fetch events from Wikipedia timeline pages
   */
  async fetchFromTimelines(options = {}) {
    try {
      logger.info('📜 Fetching events from Wikipedia timeline pages...');
      
      const timelinePages = [
        'Timeline_of_the_20th_century',
        'Timeline_of_the_21st_century',
        'Timeline_of_World_War_II',
        'Timeline_of_the_COVID-19_pandemic',
        'Timeline_of_the_2008_financial_crisis'
      ];

      const events = [];
      
      for (const page of timelinePages) {
        try {
          const pageEvents = await this.parseTimelinePage(page);
          events.push(...pageEvents);
          
          // Rate limiting
          await this.delay(300);
        } catch (error) {
          // logger.debug(`Failed to parse timeline page ${page}:`, error.message);
        }
      }

      logger.info(`📜 Fetched ${events.length} events from timeline pages`);
      return events;

    } catch (error) {
      logger.error('Error fetching timeline events:', error);
      return [];
    }
  }

  /**
   * Parse a Wikipedia timeline page
   */
  async parseTimelinePage(pageTitle) {
    try {
      // Get page content
      const url = `${this.wikipediaAPI}`;
      const params = {
        action: 'query',
        titles: pageTitle,
        prop: 'extracts',
        exintro: false,
        explaintext: false,
        format: 'json'
      };

      const response = await axios.get(url, { params, ...this.axiosConfig });
      const pages = response.data.query?.pages || {};
      const page = Object.values(pages)[0];
      
      if (!page || page.missing) {
        return [];
      }

      const html = page.extract;
      const $ = cheerio.load(html);
      const events = [];

      // Extract events from timeline format
      // This is a simplified parser - real implementation would be more complex
      $('li, p').each((i, element) => {
        const text = $(element).text();
        const dateMatch = text.match(/(\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4})/);
        
        if (dateMatch && text.length > 50) {
          const eventData = {
            title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            description: text,
            source_name: 'wikipedia_timeline',
            source_page: pageTitle,
            raw_text: text
          };

          // Try to parse the date
          const parsedDate = this.parseFlexibleDate(dateMatch[1]);
          if (parsedDate) {
            eventData.event_date = parsedDate;
            events.push(eventData);
          }
        }
      });

      return events;

    } catch (error) {
      // logger.debug(`Error parsing timeline page ${pageTitle}:`, error.message);
      return [];
    }
  }

  /**
   * Enrich event data with category, impact level, and coordinates
   */
  async enrichEventData(eventData) {
    try {
      // Determine category based on title and description
      eventData.category = this.determineCategory(eventData);
      
      // Determine impact level
      eventData.impact_level = this.determineImpactLevel(eventData);
      
      // Determine event type
      eventData.event_type = this.determineEventType(eventData);
      
// Extract or geocode location
      await this.applyNERAndHeuristics(eventData);
      await this.addLocationData(eventData);
      
      // Parse and validate date
      if (eventData.event_date) {
        eventData.event_date = this.standardizeDate(eventData.event_date);
      }

      return eventData;

    } catch (error) {
      // logger.debug('Error enriching event data:', error.message);
      return eventData;
    }
  }

  /**
   * Determine event category based on content
   */
  determineCategory(eventData) {
    const text = `${eventData.title} ${eventData.description}`.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryMappings)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }

    // Fallback category detection based on common words
    if (text.match(/\b(war|battle|conflict|invasion|military)\b/)) return 'war';
    if (text.match(/\b(earthquake|tsunami|hurricane|disaster|flood)\b/)) return 'natural_disaster';
    if (text.match(/\b(election|president|government|political|coup)\b/)) return 'political';
    if (text.match(/\b(market|financial|economic|crisis|recession)\b/)) return 'financial';
    if (text.match(/\b(pandemic|epidemic|disease|outbreak|virus)\b/)) return 'pandemic';
    if (text.match(/\b(terrorist|attack|bombing|assassination)\b/)) return 'terrorism';
    if (text.match(/\b(technology|space|internet|computer|innovation)\b/)) return 'technology';
    if (text.match(/\b(protest|movement|civil rights|social)\b/)) return 'social';
    if (text.match(/\b(accident|nuclear|industrial|crash)\b/)) return 'accident';

    return 'other';
  }

  /**
   * Determine impact level based on content and keywords
   */
  determineImpactLevel(eventData) {
    const text = `${eventData.title} ${eventData.description}`.toLowerCase();
    
    for (const [level, keywords] of Object.entries(this.impactLevelKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return level;
        }
      }
    }

    // Default based on category
    if (['war', 'pandemic', 'natural_disaster'].includes(eventData.category)) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Determine specific event type
   */
  determineEventType(eventData) {
    const text = `${eventData.title} ${eventData.description}`.toLowerCase();
    const category = eventData.category;

    const typeMapping = {
      'financial': {
        'market_crash': ['crash', 'collapse', 'black'],
        'recession': ['recession', 'depression'],
        'crisis': ['crisis', 'bailout']
      },
      'natural_disaster': {
        'earthquake': ['earthquake', 'quake'],
        'tsunami': ['tsunami'],
        'hurricane': ['hurricane', 'cyclone', 'typhoon'],
        'flood': ['flood', 'flooding'],
        'wildfire': ['fire', 'wildfire'],
        'volcanic': ['volcano', 'eruption']
      },
      'political': {
        'election': ['election', 'vote'],
        'revolution': ['revolution', 'uprising'],
        'coup': ['coup', 'overthrow'],
        'independence': ['independence'],
        'referendum': ['referendum']
      },
      'war': {
        'invasion': ['invasion', 'invade'],
        'battle': ['battle'],
        'declaration': ['declared war'],
        'peace_treaty': ['peace', 'treaty']
      },
      'terrorism': {
        'terrorist_attack': ['attack', 'bombing', 'terrorist'],
        'assassination': ['assassination', 'killed']
      },
      'pandemic': {
        'disease_outbreak': ['outbreak', 'epidemic', 'pandemic'],
        'declaration': ['declared', 'emergency']
      }
    };

    if (typeMapping[category]) {
      for (const [type, keywords] of Object.entries(typeMapping[category])) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            return type;
          }
        }
      }
    }

    return category + '_event';
  }

  /**
   * Add location data (geocoding)
   */
  async addLocationData(eventData) {
    try {
      // If coordinates already exist, use them
      if (eventData.raw_data?.coordinates) {
        eventData.latitude = eventData.raw_data.coordinates.lat;
        eventData.longitude = eventData.raw_data.coordinates.lon;
        return;
      }

      // First, try to get structured location data from Wikidata
      if (eventData.raw_data?.wikibase_item && !eventData.location_name) {
        const wikidataLocation = await this.getLocationFromWikidata(eventData.raw_data.wikibase_item);
        if (wikidataLocation) {
          eventData.location_name = wikidataLocation.location_name;
          eventData.latitude = wikidataLocation.latitude;
          eventData.longitude = wikidataLocation.longitude;
          eventData.country_code = wikidataLocation.country_code;
          return;
        }
      }

      // Extract location from title or description if not already provided
      if (!eventData.location_name) {
        eventData.location_name = this.extractLocationFromText(eventData);
      }

      // Geocode the location using our enhanced database
      if (eventData.location_name) {
        const coords = await this.simpleGeocode(eventData.location_name);
        if (coords) {
          eventData.latitude = coords.lat;
          eventData.longitude = coords.lon;
          eventData.country_code = coords.country_code;
        }
      }

    } catch (error) {
      // logger.debug('Error adding location data:', error.message);
    }
  }

  /**
   * Apply Named Entity Recognition (NER) and heuristics.
   */
  async applyNERAndHeuristics(eventData) {
    try {
      const text = `${eventData.title} ${eventData.description}`;
      const nerResults = await this.performNER(text);

      // Extract entities
      const detectedLocations = this.extractEntities(nerResults);
      const wikidataLocations = await this.checkWikidataForProperties(eventData.raw_data.wikibase_item);

      // Apply heuristics to choose main location
      const mainLocation = this.applyHeuristics(detectedLocations, wikidataLocations, text);

      if (mainLocation) {
        eventData.location_name = mainLocation.name;
        eventData.latitude = mainLocation.latitude;
        eventData.longitude = mainLocation.longitude;
        eventData.country_code = mainLocation.country_code;
      }

    } catch (error) {
      logger.error('Error during NER and heuristics application:', error);
    }
  }

  /**
   * Perform Named Entity Recognition (NER) using Transformers or spaCy
   */
  async performNER(text) {
    try {
      const { NlpManager } = require('node-nlp');

      // Initialize NLP Manager
      const manager = new NlpManager({ languages: ['en'] });

      // Train or load a pre-trained model (Note: Simplified for illustration)
      await manager.train();

      // Analyze the text
      const response = manager.process(text);

      // Extract entities
      const entities = (response.entities || []).map(entity => ({
        name: entity.resolution?.values?.[0]?.value || entity.sourceText,
        type: entity.entity,
      }));

      return entities;
    } catch (error) {
      logger.error('Error performing NER:', error);
      return [];
    }
  }

  /**
   * Extract ORG, GPE, and LOC entities from NER results
   */
  extractEntities(nerResults) {
    const locationEntities = [];
    
    // Filter entities by types relevant to locations
    const relevantTypes = ['LOCATION', 'GPE', 'ORG', 'LOC', 'PERSON'];
    
    for (const entity of nerResults) {
      if (relevantTypes.includes(entity.type?.toUpperCase())) {
        // Try to geocode the entity to verify it's a location
        const geocoded = this.simpleGeocode(entity.name);
        if (geocoded) {
          locationEntities.push({
            name: entity.name,
            type: entity.type,
            latitude: geocoded.lat,
            longitude: geocoded.lon,
            country_code: geocoded.country_code,
            confidence: 'medium'
          });
        }
      }
    }
    
    return locationEntities;
  }

  /**
   * Check Wikidata for structured properties
   */
  async checkWikidataForProperties(wikidataId) {
    try {
      if (!wikidataId) return [];
      
      // Extract Q-ID from full URI if needed
      const qId = wikidataId.includes('/') ? wikidataId.split('/').pop() : wikidataId;
      
      const sparqlQuery = `
        SELECT DISTINCT ?locationLabel ?location ?coordinates ?countryLabel ?country WHERE {
          {
            wd:${qId} wdt:P276 ?location .  # location property
          } UNION {
            wd:${qId} wdt:P131 ?location .  # administrative entity
          } UNION {
            wd:${qId} wdt:P17 ?location .   # country
          }
          
          OPTIONAL { 
            ?location wdt:P625 ?coordinates .  # coordinate location
          }
          OPTIONAL { 
            ?location wdt:P17 ?country .  # country
          }
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 5
      `;

      const response = await axios.get(this.wikidataAPI, {
        params: {
          query: sparqlQuery,
          format: 'json'
        },
        ...this.axiosConfig
      });

      const bindings = response.data.results?.bindings || [];
      const wikidataLocations = [];
      
      for (const binding of bindings) {
        const locationName = binding.locationLabel?.value;
        const coordinates = binding.coordinates?.value;
        const countryLabel = binding.countryLabel?.value;
        
        if (locationName) {
          const locationData = {
            name: locationName,
            source: 'wikidata',
            confidence: 'high'
          };
          
          // Parse coordinates if available
          if (coordinates) {
            const coordMatch = coordinates.match(/Point\(([\-\d\.]+)\s+([\-\d\.]+)\)/);
            if (coordMatch) {
              locationData.longitude = parseFloat(coordMatch[1]);
              locationData.latitude = parseFloat(coordMatch[2]);
            }
          }
          
          // Add country code if available
          if (countryLabel) {
            locationData.country_code = this.getCountryCode(countryLabel);
          }
          
          wikidataLocations.push(locationData);
        }
      }
      
      return wikidataLocations;
      
    } catch (error) {
      // logger.debug(`Error fetching Wikidata properties for ${wikidataId}:`, error.message);
      return [];
    }
  }

  /**
   * Apply heuristic scoring to determine main location
   */
  applyHeuristics(detectedLocations, wikidataLocations, text) {
    let mainLocation = null;
    if (detectedLocations.length === 1) {
      mainLocation = detectedLocations[0];
    } else if (text.toLowerCase().includes("stock exchange")) {
      mainLocation = detectedLocations.find(loc => loc.name.includes('New York Stock Exchange') || loc.name.includes('Wall Street'));
    } else if (detectedLocations.some(loc => ["New York", "London", "Tokyo"].includes(loc.name))) {
      mainLocation = detectedLocations[0]; // Simplified selection logic
    } else if (wikidataLocations.length) {
      mainLocation = wikidataLocations[0];
    }
    return mainLocation;
  }

  /**
   * Extract location from event title and description
   */
  extractLocationFromText(eventData) {
    const text = `${eventData.title} ${eventData.description}`;
    
    // Common location patterns
    const locationPatterns = [
      // "in [Location]", "at [Location]", "of [Location]"
      /\b(?:in|at|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      // City, Country format
      /\b([A-Z][a-z]+),\s*([A-Z][a-z]+)/g,
      // Parenthetical locations
      /\(([^)]+)\)/g,
      // Battle of [Location], Siege of [Location]
      /\b(?:Battle|Siege|Attack)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      // [Location] [Event Type] - e.g., "London Bridge attack"
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:attack|bombing|earthquake|fire|flood|riot)/i
    ];

    const locations = new Set();

    // Extract using patterns
    for (const pattern of locationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const location = match[1]?.trim();
        if (location && this.isValidLocationName(location)) {
          locations.add(location);
        }
      }
    }

    // Return the first valid location found
    const locationArray = Array.from(locations);
    if (locationArray.length > 0) {
      // Prefer shorter, more specific locations
      return locationArray.sort((a, b) => a.length - b.length)[0];
    }

    return null;
  }

  /**
   * Check if extracted text is likely a valid location name
   */
  isValidLocationName(location) {
    if (!location || location.length < 3 || location.length > 50) {
      return false;
    }

    // Skip common non-location words
    const nonLocationWords = [
      'the', 'and', 'but', 'for', 'with', 'from', 'this', 'that', 'they', 'them', 'their',
      'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
      'January', 'February', 'March', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      'Emperor', 'King', 'Queen', 'President', 'Prime', 'Minister', 'General', 'Captain', 'Admiral',
      'World', 'War', 'Army', 'Navy', 'Air', 'Force', 'Battle', 'Treaty', 'Peace', 'Agreement',
      'Discovery', 'Religion', 'Independence', 'Revolution', 'Empire', 'Kingdom', 'Republic',
      'Crisis', 'Act', 'Law', 'Bill', 'Amendment', 'Constitution', 'Government', 'Parliament',
      'University', 'College', 'School', 'Hospital', 'Airport', 'Station', 'Bridge', 'Canal',
      'Company', 'Corporation', 'Foundation', 'Organization', 'Association', 'Society',
      'North', 'South', 'East', 'West', 'Central', 'Lower', 'Upper', 'Great', 'Little',
      'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Last', 'Final', 'New', 'Old', 'Ancient'
    ];

    const normalized = location.toLowerCase();
    if (nonLocationWords.includes(normalized)) {
      return false;
    }

    // Should start with capital letter
    if (!/^[A-Z]/.test(location)) {
      return false;
    }

    return true;
  }

  /**
   * Enhanced geocoding for world cities, countries, and regions
   */
  async simpleGeocode(location) {
    const knownLocations = {
      // Major US Cities
      'new york': { lat: 40.7128, lon: -74.0060, country_code: 'US' },
      'new york city': { lat: 40.7128, lon: -74.0060, country_code: 'US' },
      'washington': { lat: 38.9072, lon: -77.0369, country_code: 'US' },
      'washington dc': { lat: 38.9072, lon: -77.0369, country_code: 'US' },
      'los angeles': { lat: 34.0522, lon: -118.2437, country_code: 'US' },
      'chicago': { lat: 41.8781, lon: -87.6298, country_code: 'US' },
      'houston': { lat: 29.7604, lon: -95.3698, country_code: 'US' },
      'philadelphia': { lat: 39.9526, lon: -75.1652, country_code: 'US' },
      'phoenix': { lat: 33.4484, lon: -112.0740, country_code: 'US' },
      'san antonio': { lat: 29.4241, lon: -98.4936, country_code: 'US' },
      'san diego': { lat: 32.7157, lon: -117.1611, country_code: 'US' },
      'dallas': { lat: 32.7767, lon: -96.7970, country_code: 'US' },
      'san jose': { lat: 37.3382, lon: -121.8863, country_code: 'US' },
      'san francisco': { lat: 37.7749, lon: -122.4194, country_code: 'US' },
      'boston': { lat: 42.3601, lon: -71.0589, country_code: 'US' },
      'atlanta': { lat: 33.7490, lon: -84.3880, country_code: 'US' },
      'miami': { lat: 25.7617, lon: -80.1918, country_code: 'US' },
      'seattle': { lat: 47.6062, lon: -122.3321, country_code: 'US' },
      'detroit': { lat: 42.3314, lon: -83.0458, country_code: 'US' },
      'las vegas': { lat: 36.1699, lon: -115.1398, country_code: 'US' },
      
      // Europe
      'london': { lat: 51.5074, lon: -0.1278, country_code: 'GB' },
      'paris': { lat: 48.8566, lon: 2.3522, country_code: 'FR' },
      'berlin': { lat: 52.5200, lon: 13.4050, country_code: 'DE' },
      'rome': { lat: 41.9028, lon: 12.4964, country_code: 'IT' },
      'madrid': { lat: 40.4168, lon: -3.7038, country_code: 'ES' },
      'barcelona': { lat: 41.3851, lon: 2.1734, country_code: 'ES' },
      'amsterdam': { lat: 52.3676, lon: 4.9041, country_code: 'NL' },
      'vienna': { lat: 48.2082, lon: 16.3738, country_code: 'AT' },
      'zurich': { lat: 47.3769, lon: 8.5417, country_code: 'CH' },
      'geneva': { lat: 46.2044, lon: 6.1432, country_code: 'CH' },
      'brussels': { lat: 50.8503, lon: 4.3517, country_code: 'BE' },
      'warsaw': { lat: 52.2297, lon: 21.0122, country_code: 'PL' },
      'prague': { lat: 50.0755, lon: 14.4378, country_code: 'CZ' },
      'budapest': { lat: 47.4979, lon: 19.0402, country_code: 'HU' },
      'stockholm': { lat: 59.3293, lon: 18.0686, country_code: 'SE' },
      'oslo': { lat: 59.9139, lon: 10.7522, country_code: 'NO' },
      'helsinki': { lat: 60.1699, lon: 24.9384, country_code: 'FI' },
      'copenhagen': { lat: 55.6761, lon: 12.5683, country_code: 'DK' },
      'lisbon': { lat: 38.7223, lon: -9.1393, country_code: 'PT' },
      'athens': { lat: 37.9838, lon: 23.7275, country_code: 'GR' },
      'thessaloniki': { lat: 40.6401, lon: 22.9444, country_code: 'GR' },
      'patras': { lat: 38.2466, lon: 21.7346, country_code: 'GR' },
      'heraklion': { lat: 35.3387, lon: 25.1442, country_code: 'GR' },
      'larissa': { lat: 39.6390, lon: 22.4194, country_code: 'GR' },
      'volos': { lat: 39.3669, lon: 22.9426, country_code: 'GR' },
      'rhodes': { lat: 36.4341, lon: 28.2176, country_code: 'GR' },
      'ioannina': { lat: 39.6650, lon: 20.8537, country_code: 'GR' },
      'chania': { lat: 35.5138, lon: 24.0180, country_code: 'GR' },
      'kalamata': { lat: 37.0381, lon: 22.1141, country_code: 'GR' },
      'kavala': { lat: 40.9396, lon: 24.4020, country_code: 'GR' },
      'serres': { lat: 41.0858, lon: 23.5498, country_code: 'GR' },
      'xanthi': { lat: 41.1342, lon: 24.8880, country_code: 'GR' },
      'trikala': { lat: 39.5558, lon: 21.7684, country_code: 'GR' },
      'lamia': { lat: 38.8998, lon: 22.4334, country_code: 'GR' },
      'moscow': { lat: 55.7558, lon: 37.6176, country_code: 'RU' },
      'st petersburg': { lat: 59.9311, lon: 30.3609, country_code: 'RU' },
      'kiev': { lat: 50.4501, lon: 30.5234, country_code: 'UA' },
      'istanbul': { lat: 41.0082, lon: 28.9784, country_code: 'TR' },
      'ankara': { lat: 39.9334, lon: 32.8597, country_code: 'TR' },
      
      // Asia
      'tokyo': { lat: 35.6762, lon: 139.6503, country_code: 'JP' },
      'osaka': { lat: 34.6937, lon: 135.5023, country_code: 'JP' },
      'kyoto': { lat: 35.0116, lon: 135.7681, country_code: 'JP' },
      'beijing': { lat: 39.9042, lon: 116.4074, country_code: 'CN' },
      'shanghai': { lat: 31.2304, lon: 121.4737, country_code: 'CN' },
      'hong kong': { lat: 22.3193, lon: 114.1694, country_code: 'HK' },
      'seoul': { lat: 37.5665, lon: 126.9780, country_code: 'KR' },
      'singapore': { lat: 1.3521, lon: 103.8198, country_code: 'SG' },
      'mumbai': { lat: 19.0760, lon: 72.8777, country_code: 'IN' },
      'new delhi': { lat: 28.6139, lon: 77.2090, country_code: 'IN' },
      'delhi': { lat: 28.6139, lon: 77.2090, country_code: 'IN' },
      'bangalore': { lat: 12.9716, lon: 77.5946, country_code: 'IN' },
      'calcutta': { lat: 22.5726, lon: 88.3639, country_code: 'IN' },
      'kolkata': { lat: 22.5726, lon: 88.3639, country_code: 'IN' },
      'chennai': { lat: 13.0827, lon: 80.2707, country_code: 'IN' },
      'madras': { lat: 13.0827, lon: 80.2707, country_code: 'IN' },
      'hyderabad': { lat: 17.3850, lon: 78.4867, country_code: 'IN' },
      'pune': { lat: 18.5204, lon: 73.8567, country_code: 'IN' },
      'ahmedabad': { lat: 23.0225, lon: 72.5714, country_code: 'IN' },
      'surat': { lat: 21.1702, lon: 72.8311, country_code: 'IN' },
      'jaipur': { lat: 26.9124, lon: 75.7873, country_code: 'IN' },
      'lucknow': { lat: 26.8467, lon: 80.9462, country_code: 'IN' },
      'kanpur': { lat: 26.4499, lon: 80.3319, country_code: 'IN' },
      'nagpur': { lat: 21.1458, lon: 79.0882, country_code: 'IN' },
      'indore': { lat: 22.7196, lon: 75.8577, country_code: 'IN' },
      'thane': { lat: 19.2183, lon: 72.9781, country_code: 'IN' },
      'bhopal': { lat: 23.2599, lon: 77.4126, country_code: 'IN' },
      'visakhapatnam': { lat: 17.6868, lon: 83.2185, country_code: 'IN' },
      'pimpri': { lat: 18.6298, lon: 73.8075, country_code: 'IN' },
      'patna': { lat: 25.5941, lon: 85.1376, country_code: 'IN' },
      'vadodara': { lat: 22.3072, lon: 73.1812, country_code: 'IN' },
      'agra': { lat: 27.1767, lon: 78.0081, country_code: 'IN' },
      'ludhiana': { lat: 30.9010, lon: 75.8573, country_code: 'IN' },
      'nashik': { lat: 19.9975, lon: 73.7898, country_code: 'IN' },
      'faridabad': { lat: 28.4089, lon: 77.3178, country_code: 'IN' },
      'meerut': { lat: 28.9845, lon: 77.7064, country_code: 'IN' },
      'rajkot': { lat: 22.3039, lon: 70.8022, country_code: 'IN' },
      'kalyan': { lat: 19.2437, lon: 73.1355, country_code: 'IN' },
      'karachi': { lat: 24.8615, lon: 67.0099, country_code: 'PK' },
      'lahore': { lat: 31.5204, lon: 74.3587, country_code: 'PK' },
      'islamabad': { lat: 33.6844, lon: 73.0479, country_code: 'PK' },
      'dhaka': { lat: 23.8103, lon: 90.4125, country_code: 'BD' },
      'bangkok': { lat: 13.7563, lon: 100.5018, country_code: 'TH' },
      'manila': { lat: 14.5995, lon: 120.9842, country_code: 'PH' },
      'jakarta': { lat: -6.2088, lon: 106.8456, country_code: 'ID' },
      'kuala lumpur': { lat: 3.1390, lon: 101.6869, country_code: 'MY' },
      'hanoi': { lat: 21.0285, lon: 105.8542, country_code: 'VN' },
      'ho chi minh city': { lat: 10.8231, lon: 106.6297, country_code: 'VN' },
      'saigon': { lat: 10.8231, lon: 106.6297, country_code: 'VN' },
      
      // Middle East & Africa
      'cairo': { lat: 30.0444, lon: 31.2357, country_code: 'EG' },
      'alexandria': { lat: 31.2001, lon: 29.9187, country_code: 'EG' },
      'casablanca': { lat: 33.5731, lon: -7.5898, country_code: 'MA' },
      'lagos': { lat: 6.5244, lon: 3.3792, country_code: 'NG' },
      'johannesburg': { lat: -26.2041, lon: 28.0473, country_code: 'ZA' },
      'cape town': { lat: -33.9249, lon: 18.4241, country_code: 'ZA' },
      'nairobi': { lat: -1.2921, lon: 36.8219, country_code: 'KE' },
      'addis ababa': { lat: 9.1450, lon: 40.4897, country_code: 'ET' },
      'baghdad': { lat: 33.3152, lon: 44.3661, country_code: 'IQ' },
      'tehran': { lat: 35.6892, lon: 51.3890, country_code: 'IR' },
      'riyadh': { lat: 24.7136, lon: 46.6753, country_code: 'SA' },
      'dubai': { lat: 25.2048, lon: 55.2708, country_code: 'AE' },
      'tel aviv': { lat: 32.0853, lon: 34.7818, country_code: 'IL' },
      'jerusalem': { lat: 31.7683, lon: 35.2137, country_code: 'IL' },
      'beirut': { lat: 33.8938, lon: 35.5018, country_code: 'LB' },
      'damascus': { lat: 33.5138, lon: 36.2765, country_code: 'SY' },
      
      // Americas
      'toronto': { lat: 43.6532, lon: -79.3832, country_code: 'CA' },
      'montreal': { lat: 45.5017, lon: -73.5673, country_code: 'CA' },
      'vancouver': { lat: 49.2827, lon: -123.1207, country_code: 'CA' },
      'ottawa': { lat: 45.4215, lon: -75.6972, country_code: 'CA' },
      'mexico city': { lat: 19.4326, lon: -99.1332, country_code: 'MX' },
      'guadalajara': { lat: 20.6597, lon: -103.3496, country_code: 'MX' },
      'monterrey': { lat: 25.6866, lon: -100.3161, country_code: 'MX' },
      'buenos aires': { lat: -34.6118, lon: -58.3960, country_code: 'AR' },
      'sao paulo': { lat: -23.5558, lon: -46.6396, country_code: 'BR' },
      'rio de janeiro': { lat: -22.9068, lon: -43.1729, country_code: 'BR' },
      'brasilia': { lat: -15.8267, lon: -47.9218, country_code: 'BR' },
      'lima': { lat: -12.0464, lon: -77.0428, country_code: 'PE' },
      'bogota': { lat: 4.7110, lon: -74.0721, country_code: 'CO' },
      'caracas': { lat: 10.4806, lon: -66.9036, country_code: 'VE' },
      'santiago': { lat: -33.4489, lon: -70.6693, country_code: 'CL' },
      'havana': { lat: 23.1136, lon: -82.3666, country_code: 'CU' },
      
      // Oceania
      'sydney': { lat: -33.8688, lon: 151.2093, country_code: 'AU' },
      'melbourne': { lat: -37.8136, lon: 144.9631, country_code: 'AU' },
      'brisbane': { lat: -27.4698, lon: 153.0251, country_code: 'AU' },
      'perth': { lat: -31.9505, lon: 115.8605, country_code: 'AU' },
      'adelaide': { lat: -34.9285, lon: 138.6007, country_code: 'AU' },
      'auckland': { lat: -36.8485, lon: 174.7633, country_code: 'NZ' },
      'wellington': { lat: -41.2865, lon: 174.7762, country_code: 'NZ' },
      
      // Countries (using capital city coordinates)
      'united states': { lat: 38.9072, lon: -77.0369, country_code: 'US' },
      'usa': { lat: 38.9072, lon: -77.0369, country_code: 'US' },
      'united kingdom': { lat: 51.5074, lon: -0.1278, country_code: 'GB' },
      'uk': { lat: 51.5074, lon: -0.1278, country_code: 'GB' },
      'england': { lat: 51.5074, lon: -0.1278, country_code: 'GB' },
      'britain': { lat: 51.5074, lon: -0.1278, country_code: 'GB' },
      'france': { lat: 48.8566, lon: 2.3522, country_code: 'FR' },
      'germany': { lat: 52.5200, lon: 13.4050, country_code: 'DE' },
      'italy': { lat: 41.9028, lon: 12.4964, country_code: 'IT' },
      'spain': { lat: 40.4168, lon: -3.7038, country_code: 'ES' },
      'russia': { lat: 55.7558, lon: 37.6176, country_code: 'RU' },
      'china': { lat: 39.9042, lon: 116.4074, country_code: 'CN' },
      'japan': { lat: 35.6762, lon: 139.6503, country_code: 'JP' },
      'india': { lat: 28.6139, lon: 77.2090, country_code: 'IN' },
      'australia': { lat: -35.2809, lon: 149.1300, country_code: 'AU' },
      'canada': { lat: 45.4215, lon: -75.6972, country_code: 'CA' },
      'brazil': { lat: -15.8267, lon: -47.9218, country_code: 'BR' },
      'mexico': { lat: 19.4326, lon: -99.1332, country_code: 'MX' },
      'egypt': { lat: 30.0444, lon: 31.2357, country_code: 'EG' },
      'south africa': { lat: -25.7479, lon: 28.2293, country_code: 'ZA' },
      'nigeria': { lat: 9.0579, lon: 7.4951, country_code: 'NG' },
      'iran': { lat: 35.6892, lon: 51.3890, country_code: 'IR' },
      'iraq': { lat: 33.3152, lon: 44.3661, country_code: 'IQ' },
      'afghanistan': { lat: 34.5553, lon: 69.2075, country_code: 'AF' },
      'pakistan': { lat: 33.6844, lon: 73.0479, country_code: 'PK' },
      'ukraine': { lat: 50.4501, lon: 30.5234, country_code: 'UA' },
      'peru': { lat: -12.0464, lon: -77.0428, country_code: 'PE' },
      'poland': { lat: 52.2297, lon: 21.0122, country_code: 'PL' },
      'greece': { lat: 37.9838, lon: 23.7275, country_code: 'GR' },
      'turkey': { lat: 39.9334, lon: 32.8597, country_code: 'TR' },
      'israel': { lat: 31.7683, lon: 35.2137, country_code: 'IL' },
      'lebanon': { lat: 33.8938, lon: 35.5018, country_code: 'LB' },
      'syria': { lat: 33.5138, lon: 36.2765, country_code: 'SY' },
      'libya': { lat: 32.8872, lon: 13.1913, country_code: 'LY' },
      'tunisia': { lat: 36.8065, lon: 10.1815, country_code: 'TN' },
      'morocco': { lat: 33.9716, lon: -6.8498, country_code: 'MA' },
      'algeria': { lat: 36.7538, lon: 3.0588, country_code: 'DZ' },
      'ethiopia': { lat: 9.1450, lon: 40.4897, country_code: 'ET' },
      'kenya': { lat: -1.2921, lon: 36.8219, country_code: 'KE' },
      'sudan': { lat: 15.5007, lon: 32.5599, country_code: 'SD' },
      'zimbabwe': { lat: -17.8292, lon: 31.0522, country_code: 'ZW' },
      'zambia': { lat: -15.3875, lon: 28.3228, country_code: 'ZM' },
      'tanzania': { lat: -6.3690, lon: 34.8888, country_code: 'TZ' },
      'uganda': { lat: 1.3733, lon: 32.2903, country_code: 'UG' },
      'ghana': { lat: 7.9465, lon: -1.0232, country_code: 'GH' },
      'ivory coast': { lat: 7.5400, lon: -5.5471, country_code: 'CI' },
      'senegal': { lat: 14.4974, lon: -14.4524, country_code: 'SN' },
      'mali': { lat: 17.5707, lon: -3.9962, country_code: 'ML' },
      'niger': { lat: 17.6078, lon: 8.0817, country_code: 'NE' },
      'chad': { lat: 15.4542, lon: 18.7322, country_code: 'TD' },
      'cameroon': { lat: 7.3697, lon: 12.3547, country_code: 'CM' },
      'angola': { lat: -11.2027, lon: 17.8739, country_code: 'AO' },
      'mozambique': { lat: -18.6657, lon: 35.5296, country_code: 'MZ' },
      'madagascar': { lat: -18.7669, lon: 46.8691, country_code: 'MG' },
      
      // Historical/Alternative names
      'constantinople': { lat: 41.0082, lon: 28.9784, country_code: 'TR' },
      'bombay': { lat: 19.0760, lon: 72.8777, country_code: 'IN' },
      'peking': { lat: 39.9042, lon: 116.4074, country_code: 'CN' },
      'leningrad': { lat: 59.9311, lon: 30.3609, country_code: 'RU' },
      'petrograd': { lat: 59.9311, lon: 30.3609, country_code: 'RU' },
      'stalingrad': { lat: 48.7080, lon: 44.5133, country_code: 'RU' },
      'volgograd': { lat: 48.7080, lon: 44.5133, country_code: 'RU' },
      'yugoslavia': { lat: 44.7866, lon: 20.4489, country_code: 'RS' },
      'soviet union': { lat: 55.7558, lon: 37.6176, country_code: 'RU' },
      'ussr': { lat: 55.7558, lon: 37.6176, country_code: 'RU' },
      'czechoslovakia': { lat: 50.0755, lon: 14.4378, country_code: 'CZ' },
      'east germany': { lat: 52.5200, lon: 13.4050, country_code: 'DE' },
      'west germany': { lat: 52.5200, lon: 13.4050, country_code: 'DE' },
      'persia': { lat: 35.6892, lon: 51.3890, country_code: 'IR' },
      'rhodesia': { lat: -17.8292, lon: 31.0522, country_code: 'ZW' },
      'burma': { lat: 19.7633, lon: 96.0785, country_code: 'MM' },
      'myanmar': { lat: 19.7633, lon: 96.0785, country_code: 'MM' },
      'ceylon': { lat: 7.8731, lon: 80.7718, country_code: 'LK' },
      'sri lanka': { lat: 7.8731, lon: 80.7718, country_code: 'LK' },
      
      // Regions
      'middle east': { lat: 29.2985, lon: 42.5510, country_code: 'SA' },
      'persian gulf': { lat: 26.0667, lon: 51.4167, country_code: 'SA' },
      'balkans': { lat: 42.6026, lon: 21.7797, country_code: 'RS' },
      'scandinavia': { lat: 60.1282, lon: 18.6435, country_code: 'SE' },
      'siberia': { lat: 60.0000, lon: 105.0000, country_code: 'RU' },
      'california': { lat: 36.7783, lon: -119.4179, country_code: 'US' },
      'texas': { lat: 31.9686, lon: -99.9018, country_code: 'US' },
      'florida': { lat: 27.7663, lon: -82.6404, country_code: 'US' },
      'new york state': { lat: 42.1657, lon: -74.9481, country_code: 'US' },
      'alaska': { lat: 61.2181, lon: -149.9003, country_code: 'US' },
      'hawaii': { lat: 21.0943, lon: -157.4983, country_code: 'US' }
    };

    const normalized = location.toLowerCase().trim();
    
    // Try exact match first
    if (knownLocations[normalized]) {
      return knownLocations[normalized];
    }
    
    // Try partial matches for compound location names
    for (const [key, coords] of Object.entries(knownLocations)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return coords;
      }
    }
    
    return null;
  }

  /**
   * Standardize date format
   */
  standardizeDate(dateString) {
    try {
      if (!dateString) return null;
      
      const date = moment(dateString);
      return date.isValid() ? date.utc().toISOString() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse flexible date formats
   */
  parseFlexibleDate(dateString) {
    try {
      // Try various date formats
      const formats = [
        'YYYY-MM-DD',
        'YYYY-MM-DDTHH:mm:ss',
        'MM/DD/YYYY',
        'MMMM DD, YYYY',
        'DD MMMM YYYY',
        'YYYY'
      ];

      for (const format of formats) {
        const parsed = moment(dateString, format, true);
        if (parsed.isValid()) {
          return parsed.utc().toISOString();
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse event date
   */
  parseEventDate(year, month, day) {
    try {
      return moment.utc({ year, month: month - 1, day }).toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate random dates for sampling
   */
  generateRandomDates(startDate, endDate, count) {
    const dates = [];
    const start = moment(startDate);
    const end = moment(endDate);
    
    for (let i = 0; i < count; i++) {
      const randomDate = start.clone().add(
        Math.random() * end.diff(start, 'days'),
        'days'
      );
      dates.push(randomDate);
    }
    
    return dates;
  }

  /**
   * Get default categories to fetch
   */
  getDefaultCategories() {
    return [
      'Natural disasters',
      'Financial crises',
      'Terrorist incidents',
      'Political events',
      'Wars by year',
      'Pandemics',
      'Space exploration',
      'Nuclear accidents',
      'Social movements'
    ];
  }

  /**
   * Validate if event is worth storing
   */
  isValidEvent(eventData) {
    return eventData.title && 
           eventData.title.length > 10 &&
           eventData.description && 
           eventData.description.length > 20 &&
           eventData.event_date &&
           eventData.category &&
           eventData.impact_level;
  }

  /**
   * Remove duplicate events
   */
  removeDuplicates(events) {
    const seen = new Set();
    return events.filter(event => {
      const key = `${event.title}_${event.event_date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Process and enrich all events
   */
  async processAndEnrichEvents(events) {
    const processed = [];
    
    for (const event of events) {
      try {
        const enriched = await this.enrichEventData(event);
        if (enriched && this.isValidEvent(enriched)) {
          processed.push(enriched);
        }
      } catch (error) {
        // logger.debug('Error processing event:', error.message);
      }
    }

    return processed;
  }

  /**
   * Get location data from Wikidata using structured properties
   */
  async getLocationFromWikidata(wikidataId) {
    try {
      if (!wikidataId) return null;
      
      // Extract Q-ID from full URI if needed
      const qId = wikidataId.includes('/') ? wikidataId.split('/').pop() : wikidataId;
      
      const sparqlQuery = `
        SELECT DISTINCT ?locationLabel ?location ?coordinates ?countryLabel ?country WHERE {
          wd:${qId} wdt:P276 ?location .  # location property
          
          OPTIONAL { 
            ?location wdt:P625 ?coordinates .  # coordinate location
          }
          OPTIONAL { 
            ?location wdt:P17 ?country .  # country
          }
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 1
      `;

      const response = await axios.get(this.wikidataAPI, {
        params: {
          query: sparqlQuery,
          format: 'json'
        },
        ...this.axiosConfig
      });

      const bindings = response.data.results?.bindings || [];
      
      if (bindings.length > 0) {
        const binding = bindings[0];
        const locationName = binding.locationLabel?.value;
        const coordinates = binding.coordinates?.value;
        const countryLabel = binding.countryLabel?.value;
        
        if (locationName) {
          const result = {
            location_name: locationName
          };
          
          // Parse coordinates if available
          if (coordinates) {
            const coordMatch = coordinates.match(/Point\(([\-\d\.]+)\s+([\-\d\.]+)\)/);
            if (coordMatch) {
              result.longitude = parseFloat(coordMatch[1]);
              result.latitude = parseFloat(coordMatch[2]);
            }
          }
          
          // Add country code if available
          if (countryLabel) {
            result.country_code = this.getCountryCode(countryLabel);
          }
          
          // logger.debug(`📍 Retrieved location from Wikidata: ${locationName}`);
          return result;
        }
      }
      
      return null;
      
    } catch (error) {
      // logger.debug(`Error fetching location from Wikidata for ${wikidataId}:`, error.message);
      return null;
    }
  }

  /**
   * Convert country name to ISO country code
   */
  getCountryCode(countryName) {
    const countryMapping = {
      'united states': 'US',
      'united states of america': 'US',
      'usa': 'US',
      'united kingdom': 'GB',
      'uk': 'GB',
      'england': 'GB',
      'scotland': 'GB',
      'wales': 'GB',
      'northern ireland': 'GB',
      'britain': 'GB',
      'great britain': 'GB',
      'france': 'FR',
      'germany': 'DE',
      'italy': 'IT',
      'spain': 'ES',
      'russia': 'RU',
      'russian federation': 'RU',
      'china': 'CN',
      'people\'s republic of china': 'CN',
      'japan': 'JP',
      'india': 'IN',
      'canada': 'CA',
      'australia': 'AU',
      'brazil': 'BR',
      'mexico': 'MX',
      'argentina': 'AR',
      'south africa': 'ZA',
      'egypt': 'EG',
      'greece': 'GR',
      'turkey': 'TR',
      'iran': 'IR',
      'iraq': 'IQ',
      'israel': 'IL',
      'lebanon': 'LB',
      'syria': 'SY',
      'ukraine': 'UA',
      'poland': 'PL',
      'netherlands': 'NL',
      'belgium': 'BE',
      'switzerland': 'CH',
      'austria': 'AT',
      'sweden': 'SE',
      'norway': 'NO',
      'finland': 'FI',
      'denmark': 'DK',
      'portugal': 'PT',
      'czech republic': 'CZ',
      'hungary': 'HU',
      'pakistan': 'PK',
      'bangladesh': 'BD',
      'thailand': 'TH',
      'philippines': 'PH',
      'indonesia': 'ID',
      'malaysia': 'MY',
      'vietnam': 'VN',
      'singapore': 'SG',
      'south korea': 'KR',
      'republic of korea': 'KR',
      'north korea': 'KP',
      'democratic people\'s republic of korea': 'KP',
      'colombia': 'CO',
      'venezuela': 'VE',
      'peru': 'PE',
      'chile': 'CL',
      'ecuador': 'EC',
      'bolivia': 'BO',
      'uruguay': 'UY',
      'paraguay': 'PY',
      'cuba': 'CU',
      'nigeria': 'NG',
      'kenya': 'KE',
      'ethiopia': 'ET',
      'morocco': 'MA',
      'algeria': 'DZ',
      'tunisia': 'TN',
      'libya': 'LY',
      'sudan': 'SD',
      'ghana': 'GH',
      'zimbabwe': 'ZW',
      'zambia': 'ZM',
      'tanzania': 'TZ',
      'uganda': 'UG',
      'madagascar': 'MG',
      'mozambique': 'MZ',
      'angola': 'AO',
      'cameroon': 'CM',
      'ivory coast': 'CI',
      'senegal': 'SN',
      'mali': 'ML',
      'burkina faso': 'BF',
      'niger': 'NE',
      'chad': 'TD',
      'central african republic': 'CF',
      'democratic republic of the congo': 'CD',
      'republic of the congo': 'CG',
      'gabon': 'GA',
      'equatorial guinea': 'GQ',
      'sao tome and principe': 'ST',
      'cape verde': 'CV',
      'guinea-bissau': 'GW',
      'guinea': 'GN',
      'sierra leone': 'SL',
      'liberia': 'LR',
      'gambia': 'GM',
      'mauritania': 'MR',
      'romania': 'RO',
      'bulgaria': 'BG',
      'serbia': 'RS',
      'croatia': 'HR',
      'bosnia and herzegovina': 'BA',
      'montenegro': 'ME',
      'albania': 'AL',
      'macedonia': 'MK',
      'north macedonia': 'MK',
      'kosovo': 'XK',
      'moldova': 'MD',
      'belarus': 'BY',
      'lithuania': 'LT',
      'latvia': 'LV',
      'estonia': 'EE',
      'slovakia': 'SK',
      'slovenia': 'SI',
      'luxembourg': 'LU',
      'malta': 'MT',
      'cyprus': 'CY',
      'iceland': 'IS',
      'ireland': 'IE',
      'afghanistan': 'AF',
      'myanmar': 'MM',
      'burma': 'MM',
      'sri lanka': 'LK',
      'ceylon': 'LK',
      'nepal': 'NP',
      'bhutan': 'BT',
      'maldives': 'MV',
      'mongolia': 'MN',
      'kazakhstan': 'KZ',
      'uzbekistan': 'UZ',
      'turkmenistan': 'TM',
      'kyrgyzstan': 'KG',
      'tajikistan': 'TJ',
      'armenia': 'AM',
      'azerbaijan': 'AZ',
      'georgia': 'GE',
      'jordan': 'JO',
      'kuwait': 'KW',
      'bahrain': 'BH',
      'qatar': 'QA',
      'united arab emirates': 'AE',
      'oman': 'OM',
      'yemen': 'YE',
      'saudi arabia': 'SA',
      'new zealand': 'NZ',
      'papua new guinea': 'PG',
      'fiji': 'FJ',
      'solomon islands': 'SB',
      'vanuatu': 'VU',
      'samoa': 'WS',
      'tonga': 'TO',
      'kiribati': 'KI',
      'tuvalu': 'TV',
      'nauru': 'NR',
      'palau': 'PW',
      'marshall islands': 'MH',
      'micronesia': 'FM',
      'honduras': 'HN',
      'guatemala': 'GT',
      'belize': 'BZ',
      'el salvador': 'SV',
      'nicaragua': 'NI',
      'costa rica': 'CR',
      'panama': 'PA',
      'jamaica': 'JM',
      'haiti': 'HT',
      'dominican republic': 'DO',
      'trinidad and tobago': 'TT',
      'barbados': 'BB',
      'grenada': 'GD',
      'saint lucia': 'LC',
      'saint vincent and the grenadines': 'VC',
      'antigua and barbuda': 'AG',
      'dominica': 'DM',
      'saint kitts and nevis': 'KN',
      'bahamas': 'BS'
    };
    
    const normalized = countryName.toLowerCase().trim();
    return countryMapping[normalized] || null;
  }

  /**
   * Rate limiting delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WikipediaEventFetcher();
