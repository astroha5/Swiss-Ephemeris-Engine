const { supabase } = require('../config/supabase');
const wikipediaEventFetcher = require('./wikipediaEventFetcher');
const worldEventsService = require('./worldEventsService');
const logger = require('../utils/logger');

/**
 * Historical Event Enrichment Service
 * Integrates Wikipedia/Wikidata fetching with your existing Astrova database
 * Automatically calculates astrological data for each event
 */
class HistoricalEventEnrichmentService {
  constructor() {
    this.batchSize = 10; // Process events in batches to avoid overwhelming APIs
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Main method to fetch and enrich historical events
   * @param {Object} options - Configuration options
   * @returns {Object} Processing results
   */
  async enrichHistoricalEvents(options = {}) {
    try {
      logger.info('🚀 Starting historical events enrichment process...');

      const startTime = Date.now();
      const results = {
        success: true,
        totalFetched: 0,
        totalProcessed: 0,
        totalStored: 0,
        errors: [],
        duplicatesSkipped: 0,
        astrologicalEnrichments: 0,
        processingTime: 0,
        events: []
      };

      // Step 1: Fetch events from Wikipedia/Wikidata
      logger.info('📥 Fetching events from Wikipedia and Wikidata...');
      const fetchedEvents = await wikipediaEventFetcher.fetchHistoricalEvents(options);
      results.totalFetched = fetchedEvents.length;
      
      if (fetchedEvents.length === 0) {
        logger.warn('⚠️ No events fetched from external sources');
        return results;
      }

      logger.info(`✅ Fetched ${fetchedEvents.length} events from external sources`);

      // Step 2: Filter out existing events to prevent duplicates
      const newEvents = await this.filterExistingEvents(fetchedEvents);
      results.duplicatesSkipped = fetchedEvents.length - newEvents.length;
      
      if (newEvents.length === 0) {
        logger.info('ℹ️ All fetched events already exist in database');
        results.processingTime = Date.now() - startTime;
        return results;
      }

      logger.info(`🆕 Found ${newEvents.length} new events to process`);

      // Step 3: Process events in batches
      const batches = this.createBatches(newEvents, this.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} events)...`);
        
        try {
          const batchResults = await this.processBatch(batch);
          
          results.totalProcessed += batchResults.processed;
          results.totalStored += batchResults.stored;
          results.astrologicalEnrichments += batchResults.astrologicalEnrichments;
          results.errors.push(...batchResults.errors);
          results.events.push(...batchResults.events);
          
          // Rate limiting between batches
          if (i < batches.length - 1) {
            await this.delay(500);
          }
          
        } catch (error) {
          logger.error(`❌ Error processing batch ${i + 1}:`, error);
          results.errors.push({
            batch: i + 1,
            error: error.message,
            eventsInBatch: batch.length
          });
        }
      }

      results.processingTime = Date.now() - startTime;
      
      logger.info('🎉 Historical events enrichment completed!');
      logger.info(`📊 Summary: ${results.totalStored} events stored, ${results.astrologicalEnrichments} astrological enrichments`);
      
      return results;

    } catch (error) {
      logger.error('💥 Fatal error in historical events enrichment:', error);
      throw error;
    }
  }

  /**
   * Process a batch of events
   */
  async processBatch(events) {
    const batchResults = {
      processed: 0,
      stored: 0,
      astrologicalEnrichments: 0,
      errors: [],
      events: []
    };

    for (const event of events) {
      try {
        // Convert Wikipedia event to your database format
        const dbEvent = await this.convertToDbFormat(event);
        
        // Store in database
        const storedEvent = await this.storeEvent(dbEvent);
        
        if (storedEvent) {
          batchResults.stored++;
          batchResults.events.push(storedEvent);
          
          // Calculate and store astrological data if location is available
          if (storedEvent.latitude && storedEvent.longitude) {
            try {
              const astroData = await this.calculateAstrologicalData(storedEvent);
              if (astroData) {
                batchResults.astrologicalEnrichments++;
              }
            } catch (astroError) {
              logger.warn(`⚠️ Failed to calculate astrological data for ${storedEvent.title}:`, astroError.message);
            }
          }
        }
        
        batchResults.processed++;

      } catch (error) {
        logger.error(`❌ Error processing event "${event.title}":`, error);
        batchResults.errors.push({
          title: event.title,
          error: error.message
        });
      }
    }

    return batchResults;
  }

  /**
   * Filter out events that already exist in the database
   */
  async filterExistingEvents(events) {
    try {
      logger.info('🔍 Checking for existing events in database...');
      
      const newEvents = [];
      
      for (const event of events) {
        // Check if event already exists by title and approximate date
        const existing = await this.checkEventExists(event);
        
        if (!existing) {
          newEvents.push(event);
        }
      }

      logger.info(`✅ Filtered out ${events.length - newEvents.length} existing events`);
      return newEvents;

    } catch (error) {
      logger.error('Error filtering existing events:', error);
      return events; // Return all events if filtering fails
    }
  }

  /**
   * Check if an event already exists in the database
   */
  async checkEventExists(event) {
    try {
      if (!event.title || !event.event_date) {
        return false;
      }

      // Search for similar titles and dates
      const { data, error } = await supabase
        .from('world_events')
        .select('id, title, event_date')
        .ilike('title', `%${event.title.substring(0, 50)}%`)
        .limit(1);

      if (error) {
        logger.debug('Error checking event existence:', error.message);
        return false;
      }

      return data && data.length > 0;

    } catch (error) {
      logger.debug('Error in checkEventExists:', error.message);
      return false;
    }
  }

  /**
   * Convert Wikipedia event format to your database format
   */
  async convertToDbFormat(wikipediaEvent) {
    try {
      const dbEvent = {
        title: this.sanitizeTitle(wikipediaEvent.title),
        description: this.sanitizeDescription(wikipediaEvent.description),
        event_date: wikipediaEvent.event_date,
        category: wikipediaEvent.category || 'other',
        event_type: wikipediaEvent.event_type || 'unknown',
        impact_level: wikipediaEvent.impact_level || 'medium',
        location_name: wikipediaEvent.location_name,
        latitude: wikipediaEvent.latitude,
        longitude: wikipediaEvent.longitude,
        country_code: wikipediaEvent.country_code,
        source_url: wikipediaEvent.wikipedia_url,
        source_name: wikipediaEvent.source_name || 'wikipedia_api',
        
        // Additional metadata
        external_metadata: {
          wikipedia_url: wikipediaEvent.wikipedia_url,
          wikidata_uri: wikipediaEvent.wikidata_uri,
          source_category: wikipediaEvent.source_category,
          raw_data: wikipediaEvent.raw_data
        }
      };

      // Estimate affected population if not provided
      if (!dbEvent.affected_population) {
        dbEvent.affected_population = this.estimateAffectedPopulation(dbEvent);
      }

      return dbEvent;

    } catch (error) {
      logger.error('Error converting event to DB format:', error);
      throw error;
    }
  }

  /**
   * Store event in database
   */
  async storeEvent(eventData) {
    try {
      // Use your existing world events service
      const result = await worldEventsService.createEvent(eventData);
      
      if (result && result.id) {
        logger.info(`✅ Stored event: ${eventData.title}`);
        return result;
      } else {
        logger.warn(`⚠️ Failed to store event: ${eventData.title}`);
        return null;
      }

    } catch (error) {
      logger.error(`❌ Error storing event: ${eventData.title}`, error);
      return null; // Don't throw, just return null to continue processing other events
    }
  }

  /**
   * Calculate astrological data for the event
   */
  async calculateAstrologicalData(event) {
    try {
      logger.debug(`🔮 Calculating astrological data for: ${event.title}`);

      // Use the existing worldEventsService to generate astrological data
      // This is already handled in the storeEvent method through worldEventsService.createEvent
      // which calls generateAstronomicalData if coordinates are provided
      logger.debug(`✅ Astrological data will be calculated during event storage for: ${event.title}`);
      return { success: true, message: 'Astrological calculation delegated to worldEventsService' };

    } catch (error) {
      // Don't throw here - astrological calculation is optional
      logger.warn(`⚠️ Error in astrological data calculation for ${event.title}:`, error.message);
      return null;
    }
  }

  /**
   * Sanitize title for database storage
   */
  sanitizeTitle(title) {
    if (!title) return 'Unknown Event';
    
    return title
      .trim()
      .substring(0, 200) // Limit length
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Sanitize description for database storage
   */
  sanitizeDescription(description) {
    if (!description) return '';
    
    return description
      .trim()
      .substring(0, 1000) // Limit length
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Estimate affected population based on event type and impact level
   */
  estimateAffectedPopulation(event) {
    const impactMultipliers = {
      'extreme': 1000000,
      'high': 100000,
      'medium': 10000,
      'low': 1000
    };

    const categoryMultipliers = {
      'pandemic': 10,
      'war': 5,
      'natural_disaster': 3,
      'financial': 8,
      'political': 2,
      'terrorism': 1,
      'accident': 1,
      'technology': 0.5,
      'social': 2,
      'other': 1
    };

    const basePopulation = impactMultipliers[event.impact_level] || impactMultipliers['medium'];
    const categoryMultiplier = categoryMultipliers[event.category] || 1;

    return Math.floor(basePopulation * categoryMultiplier);
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
   * Get enrichment statistics
   */
  async getEnrichmentStats() {
    try {
      // Get total events by source
      const { data: events, error } = await supabase
        .from('world_events')
        .select('source_name, category, impact_level, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const stats = {
        totalEvents: events.length,
        bySource: {},
        byCategory: {},
        byImpactLevel: {},
        recentlyAdded: events.filter(e => {
          const createdAt = new Date(e.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdAt > weekAgo;
        }).length
      };

      // Group by source
      events.forEach(event => {
        stats.bySource[event.source_name] = (stats.bySource[event.source_name] || 0) + 1;
        stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
        stats.byImpactLevel[event.impact_level] = (stats.byImpactLevel[event.impact_level] || 0) + 1;
      });

      return stats;

    } catch (error) {
      logger.error('Error getting enrichment stats:', error);
      throw error;
    }
  }

  /**
   * Fetch events for a specific date range and category
   */
  async fetchEventsForDateRange(startDate, endDate, options = {}) {
    try {
      const fetchOptions = {
        startYear: new Date(startDate).getFullYear(),
        endYear: new Date(endDate).getFullYear(),
        categories: options.categories,
        categoryLimit: options.limit || 20,
        useOnThisDay: true,
        useWikidata: true,
        useTimelines: options.useTimelines !== false,
        ...options
      };

      return await this.enrichHistoricalEvents(fetchOptions);

    } catch (error) {
      logger.error('Error fetching events for date range:', error);
      throw error;
    }
  }

  /**
   * Update existing events with Wikipedia data
   */
  async updateExistingEventsWithWikipediaData(options = {}) {
    try {
      logger.info('🔄 Updating existing events with Wikipedia data...');

      // Get events that don't have Wikipedia URLs
      const { data: events, error } = await supabase
        .from('world_events')
        .select('*')
        .is('source_url', null)
        .limit(options.limit || 50);

      if (error) {
        throw error;
      }

      const updateResults = {
        processed: 0,
        updated: 0,
        errors: []
      };

      for (const event of events) {
        try {
          // Try to find Wikipedia page for this event
          const wikipediaData = await wikipediaEventFetcher.fetchPageSummary(event.title);
          
          if (wikipediaData && wikipediaData.wikipedia_url) {
            // Update the event with Wikipedia data
            const { error: updateError } = await supabase
              .from('world_events')
              .update({
                source_url: wikipediaData.wikipedia_url,
                external_metadata: {
                  ...event.external_metadata,
                  wikipedia_data: wikipediaData.raw_data
                }
              })
              .eq('id', event.id);

            if (!updateError) {
              updateResults.updated++;
              logger.debug(`✅ Updated ${event.title} with Wikipedia data`);
            } else {
              updateResults.errors.push({
                event: event.title,
                error: updateError.message
              });
            }
          }

          updateResults.processed++;

          // Rate limiting
          await this.delay(100);

        } catch (error) {
          updateResults.errors.push({
            event: event.title,
            error: error.message
          });
        }
      }

      logger.info(`✅ Updated ${updateResults.updated} events with Wikipedia data`);
      return updateResults;

    } catch (error) {
      logger.error('Error updating existing events:', error);
      throw error;
    }
  }

  /**
   * Rate limiting delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new HistoricalEventEnrichmentService();
