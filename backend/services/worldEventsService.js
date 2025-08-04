const { supabase } = require('../config/supabase');
const { enrichWithAstroData } = require('../utils/enrichWithAstro');
const logger = require('../utils/logger');

class WorldEventsService {
  /**
   * Create a new world event with astronomical data
   * @param {Object} eventData - Event data
   * @returns {Object} Created event with ID
   */
  async createEvent(eventData) {
    try {
      logger.info(`🌍 Creating new world event: ${eventData.title}`);
      
      // Validate required fields
      if (!eventData.title || !eventData.event_date || !eventData.category) {
        throw new Error('Missing required fields: title, event_date, category');
      }

      // Insert the main event
      const { data: eventResult, error: eventError } = await supabase
        .from('world_events')
        .insert([{
          title: eventData.title,
          description: eventData.description || null,
          event_date: eventData.event_date,
          category: eventData.category,
          event_type: eventData.event_type || eventData.category,
          impact_level: eventData.impact_level || 'medium',
          location_name: eventData.location_name || null,
          latitude: eventData.latitude || null,
          longitude: eventData.longitude || null,
          country_code: eventData.country_code || null,
          affected_population: eventData.affected_population || null,
          source_url: eventData.source_url || null,
          source_name: eventData.source_name || 'manual'
        }])
        .select()
        .single();

      if (eventError) {
        logger.error('Failed to create event:', eventError);
        throw eventError;
      }

      logger.info(`✅ Event created with ID: ${eventResult.id}`);

      // Generate astronomical data if location is provided
      if (eventResult.latitude && eventResult.longitude) {
        await this.generateAstronomicalData(eventResult.id, eventResult.event_date, 
          eventResult.latitude, eventResult.longitude, eventResult.location_name || '');
      } else {
        logger.warn('No location provided, skipping astronomical calculations');
      }

      return eventResult;
    } catch (error) {
      logger.error('Error creating world event:', error);
      throw error;
    }
  }

  /**
   * Generate and store astronomical data for an event
   * @param {string} eventId - Event ID
   * @param {string} eventDate - Event date
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude  
   * @param {string} locationName - Location name
   */
  async generateAstronomicalData(eventId, eventDate, latitude, longitude, locationName = '') {
    try {
      logger.info(`🔭 Generating astronomical data for event ${eventId}`);
      
      const timestamp = new Date(eventDate);
      
      // Get astrological data using your existing enrichment system
      const astroData = await enrichWithAstroData(timestamp, latitude, longitude, locationName);
      
      if (!astroData.success) {
        throw new Error('Failed to calculate astronomical data');
      }

      // Store planetary transit data
      const transitData = {
        event_id: eventId,
        julian_day: astroData.julianDay,
        calculation_location_lat: latitude,
        calculation_location_lon: longitude,
        
        // Sun
        sun_longitude: astroData.astroSnapshot.sun.longitude,
        sun_sign: astroData.astroSnapshot.sun.sign,
        sun_degree_in_sign: astroData.astroSnapshot.sun.degree,
        sun_nakshatra: astroData.astroSnapshot.sun.nakshatra,
        
        // Moon
        moon_longitude: astroData.astroSnapshot.moon.longitude,
        moon_sign: astroData.astroSnapshot.moon.sign,
        moon_degree_in_sign: astroData.astroSnapshot.moon.degree,
        moon_nakshatra: astroData.astroSnapshot.moon.nakshatra,
        
        // Mars
        mars_longitude: astroData.astroSnapshot.mars.longitude,
        mars_sign: astroData.astroSnapshot.mars.sign,
        mars_degree_in_sign: astroData.astroSnapshot.mars.degree,
        mars_nakshatra: astroData.astroSnapshot.mars.nakshatra,
        
        // Mercury
        mercury_longitude: astroData.astroSnapshot.mercury.longitude,
        mercury_sign: astroData.astroSnapshot.mercury.sign,
        mercury_degree_in_sign: astroData.astroSnapshot.mercury.degree,
        mercury_nakshatra: astroData.astroSnapshot.mercury.nakshatra,
        
        // Jupiter
        jupiter_longitude: astroData.astroSnapshot.jupiter.longitude,
        jupiter_sign: astroData.astroSnapshot.jupiter.sign,
        jupiter_degree_in_sign: astroData.astroSnapshot.jupiter.degree,
        jupiter_nakshatra: astroData.astroSnapshot.jupiter.nakshatra,
        
        // Venus
        venus_longitude: astroData.astroSnapshot.venus.longitude,
        venus_sign: astroData.astroSnapshot.venus.sign,
        venus_degree_in_sign: astroData.astroSnapshot.venus.degree,
        venus_nakshatra: astroData.astroSnapshot.venus.nakshatra,
        
        // Saturn
        saturn_longitude: astroData.astroSnapshot.saturn.longitude,
        saturn_sign: astroData.astroSnapshot.saturn.sign,
        saturn_degree_in_sign: astroData.astroSnapshot.saturn.degree,
        saturn_nakshatra: astroData.astroSnapshot.saturn.nakshatra,
        
        // Rahu
        rahu_longitude: astroData.astroSnapshot.rahu.longitude,
        rahu_sign: astroData.astroSnapshot.rahu.sign,
        rahu_degree_in_sign: astroData.astroSnapshot.rahu.degree,
        rahu_nakshatra: astroData.astroSnapshot.rahu.nakshatra,
        
        // Ketu
        ketu_longitude: astroData.astroSnapshot.ketu.longitude,
        ketu_sign: astroData.astroSnapshot.ketu.sign,
        ketu_degree_in_sign: astroData.astroSnapshot.ketu.degree,
        ketu_nakshatra: astroData.astroSnapshot.ketu.nakshatra,
        
        // Ascendant
        ascendant_longitude: astroData.astroSnapshot.ascendant.longitude,
        ascendant_sign: astroData.astroSnapshot.ascendant.sign,
        ascendant_degree_in_sign: astroData.astroSnapshot.ascendant.degree,
        ascendant_nakshatra: astroData.astroSnapshot.ascendant.nakshatra
      };



      // Prepare planetary snapshot data
      const snapshotData = {
        event_id: eventId,
        julian_day: astroData.julianDay,
        calculation_location_lat: latitude,
        calculation_location_lon: longitude,
        timezone: 'UTC',
        planetary_data: astroData.astroSnapshot,
        sun_sign: astroData.astroSnapshot.sun.sign,
        moon_sign: astroData.astroSnapshot.moon.sign,
        mars_sign: astroData.astroSnapshot.mars.sign,
        jupiter_sign: astroData.astroSnapshot.jupiter.sign,
        saturn_sign: astroData.astroSnapshot.saturn.sign,
        ascendant_sign: astroData.astroSnapshot.ascendant.sign,
        major_aspects_count: astroData.aspects ? astroData.aspects.length : 0,
        exact_aspects_count: astroData.aspects ? astroData.aspects.filter(a => a.exact).length : 0,
        calculation_engine: 'swiss_ephemeris',
        calculation_version: '1.0'
      };

      const { error: snapshotError } = await supabase
        .from('planetary_snapshot')
        .upsert([snapshotData]);

      if (snapshotError) {
        logger.error('Failed to store planetary snapshot:', snapshotError);
        // Don't throw error here - the core data is already stored
        logger.warn('Continuing without snapshot storage');
      } else {
        logger.info(`📸 Planetary snapshot stored for event ${eventId}`);
      }

      logger.info(`✅ Astronomical data generated and stored for event ${eventId}`);
      
    } catch (error) {
      logger.error(`Error generating astronomical data for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate aspect strength score (0-10)
   * @param {Object} aspect - Aspect data
   * @returns {number} Strength score
   */
  calculateAspectStrength(aspect) {
    const baseStrengths = {
      'conjunction': 10,
      'opposition': 9,
      'square': 8,
      'trine': 7,
      'sextile': 5,
      'quincunx': 4
    };

    const baseStrength = baseStrengths[aspect.type] || 5;
    
    // Reduce strength based on orb
    const orbPenalty = aspect.orb * 0.2;
    const finalStrength = Math.max(1, baseStrength - orbPenalty);
    
    return Math.round(finalStrength * 100) / 100;
  }

  /**
   * Get events with their astronomical data
   * @param {Object} filters - Query filters
   * @returns {Array} Events with astronomical data
   */
  async getEvents(filters = {}) {
    try {
      // First try the view, fallback to basic table if view doesn't exist
      let query;
      let useView = true;
      
      try {
        query = supabase
          .from('world_events')
          .select('*');
      } catch (viewError) {
        logger.warn('events_with_transits view not available, using world_events table directly');
        useView = false;
        
        // Try to join with planetary_transits to get planetary data
        try {
          query = supabase
            .from('world_events')
            .select(`
              *,
              planetary_snapshot,
              planetary_aspects
            `);
        } catch (joinError) {
          logger.warn('Planetary transits join failed, using basic table only');
          query = supabase
            .from('world_events')
            .select('*');
        }
      }

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.impact_level) {
        query = query.eq('impact_level', filters.impact_level);
      }
      
      if (filters.start_date) {
        query = query.gte('event_date', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('event_date', filters.end_date);
      }

      // Only apply astronomical filters if using the view
      if (useView) {
        if (filters.sun_sign) {
          query = query.eq('sun_sign', filters.sun_sign);
        }

        if (filters.moon_sign) {
          query = query.eq('moon_sign', filters.moon_sign);
        }
      }

      // Limit, offset, and order
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.order('event_date', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching events:', error);
        
        // If view failed, try basic table
        if (useView && error.code === '42P01') {
          logger.warn('Retrying with basic world_events table');
          return this.getEventsBasic(filters);
        }
        
        throw error;
      }

      // If we used joins, flatten the planetary data
      if (!useView && data) {
        const flattenedData = data.map(event => {
          const flattened = { ...event };
          
          // Add planetary_snapshot data directly to the event object
          if (event.planetary_snapshot) {
            Object.entries(event.planetary_snapshot).forEach(([key, value]) => {
              flattened[key] = value;
            });
          }
          return flattened;
        });
        
        return flattenedData;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getEvents:', error);
      
      // Final fallback - return empty array
      if (error.code === '42P01') {
        logger.warn('Database tables not found, returning empty array');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Get events from basic table without astronomical data
   * @param {Object} filters - Query filters
   * @returns {Array} Events
   */
  async getEventsBasic(filters = {}) {
    try {
      let query = supabase
        .from('world_events')
        .select('*');

      // Apply basic filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.impact_level) {
        query = query.eq('impact_level', filters.impact_level);
      }
      
      if (filters.start_date) {
        query = query.gte('event_date', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('event_date', filters.end_date);
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.order('event_date', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching basic events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getEventsBasic:', error);
      return [];
    }
  }

  /**
   * Search for events by planetary positions
   * @param {Object} searchParams - Search parameters
   * @returns {Array} Matching events
   */
  async searchByPlanetaryPositions(searchParams) {
    try {
      logger.info('🔍 Searching events by planetary positions:', searchParams);
      
      let query = supabase.from('world_events').select('id, planetary_snapshot');

      // Add planetary position filters
      if (searchParams.sun_sign) {
        query = query.eq('sun_sign', searchParams.sun_sign);
      }
      
      if (searchParams.moon_sign) {
        query = query.eq('moon_sign', searchParams.moon_sign);
      }
      
      if (searchParams.mars_sign) {
        query = query.eq('mars_sign', searchParams.mars_sign);
      }
      
      if (searchParams.jupiter_sign) {
        query = query.eq('jupiter_sign', searchParams.jupiter_sign);
      }
      
      if (searchParams.saturn_sign) {
        query = query.eq('saturn_sign', searchParams.saturn_sign);
      }

      const { data: eventsWithSnapshots, error } = await query.limit(100);

      if (error) {
        logger.error('Error searching by planetary positions:', error);
        throw error;
      }

      if (!eventsWithSnapshots || eventsWithSnapshots.length === 0) {
        return [];
      }

      // Get corresponding events
      const eventIds = eventsWithSnapshots.map(e => e.id);
      const { data: events, error: eventsError } = await supabase
        .from('world_events')
        .select('*')
        .in('id', eventIds);

      if (eventsError) {
        logger.error('Error fetching events:', eventsError);
        throw eventsError;
      }

      // Apply date filters to events if specified
      let filteredEvents = events || [];
      if (searchParams.start_date || searchParams.end_date) {
        filteredEvents = events.filter(event => {
          const eventDate = new Date(event.event_date);
          const startDate = searchParams.start_date ? new Date(searchParams.start_date) : null;
          const endDate = searchParams.end_date ? new Date(searchParams.end_date) : null;
          
          if (startDate && eventDate < startDate) return false;
          if (endDate && eventDate > endDate) return false;
          return true;
        });
      }

      // Combine snapshot and event data
      const results = filteredEvents.map(event => {
        const eventWithSnapshot = eventsWithSnapshots.find(e => e.id === event.id);
        return {
          planetary_snapshot: eventWithSnapshot ? eventWithSnapshot.planetary_snapshot : null,
          world_events: event
        };
      });

      return results;
    } catch (error) {
      logger.error('Error in searchByPlanetaryPositions:', error);
      throw error;
    }
  }

  /**
   * Find events with specific aspects
   * @param {Object} aspectParams - Aspect search parameters
   * @returns {Array} Events with matching aspects
   */
  async findEventsByAspects(aspectParams) {
    try {
      logger.info('🔗 Searching events by aspects:', aspectParams);
      
      let query = supabase.from('world_events').select('id, planetary_aspects');

      if (aspectParams.planet_a) {
        query = query.eq('planet_a', aspectParams.planet_a.toLowerCase());
      }
      
      if (aspectParams.planet_b) {
        query = query.eq('planet_b', aspectParams.planet_b.toLowerCase());
      }
      
      if (aspectParams.aspect_type) {
        query = query.eq('aspect_type', aspectParams.aspect_type);
      }
      
      if (aspectParams.exact_only) {
        query = query.eq('is_exact', true);
      }
      
      if (aspectParams.max_orb) {
        query = query.lte('orb_degrees', aspectParams.max_orb);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        logger.error('Error searching by aspects:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in findEventsByAspects:', error);
      throw error;
    }
  }

  /**
   * Get statistical analysis of events
   * @returns {Object} Statistical data
   */
  async getEventStatistics() {
    try {
      logger.info('📊 Generating event statistics');
      
      // Total events by category
      const { data: categoryStats } = await supabase
        .from('world_events')
        .select('category')
        .then(result => {
          const stats = {};
          result.data?.forEach(event => {
            stats[event.category] = (stats[event.category] || 0) + 1;
          });
          return { data: stats };
        });

      // Events by impact level
      const { data: impactStats } = await supabase
        .from('world_events')
        .select('impact_level')
        .then(result => {
          const stats = {};
          result.data?.forEach(event => {
            stats[event.impact_level] = (stats[event.impact_level] || 0) + 1;
          });
          return { data: stats };
        });

      // Most common planetary signs during high-impact events
      // This part is commented out since detailed planetary positions should be part of snapshots
      const planetaryStats = [];

      return {
        categories: categoryStats,
        impact_levels: impactStats,
        high_impact_planetary_positions: planetaryStats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error generating statistics:', error);
      throw error;
    }
  }

  /**
   * Enhance existing events with planetary calculations
   * @param {Array} eventIds - Array of event IDs to enhance
   * @param {boolean} forceRecalculate - Force recalculation even if data exists
   * @returns {Object} Enhancement results
   */
  async enhancePlanetaryData(eventIds, forceRecalculate = false) {
    try {
      logger.info(`🔭 Enhancing planetary data for ${eventIds.length} events`);
      
      const results = {
        enhanced: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      // Get events that need enhancement
      const { data: events, error: eventsError } = await supabase
        .from('world_events')
        .select('id, event_date, latitude, longitude, location_name')
        .in('id', eventIds);

      if (eventsError) {
        logger.error('Error fetching events for enhancement:', eventsError);
        throw eventsError;
      }

      if (!events || events.length === 0) {
        logger.warn('No events found for enhancement');
        return results;
      }

      // Check which events already have planetary data (unless forcing recalculation)
      let eventsToProcess = events;
      if (!forceRecalculate) {
        // Check snapshot first
        const { data: existingSnapshots } = await supabase
          .from('planetary_snapshot')
          .select('event_id')
          .in('event_id', eventIds);

        const existingSnapshotIds = new Set(existingSnapshots?.map(s => s.event_id) || []);
        eventsToProcess = events.filter(event => !existingSnapshotIds.has(event.id));
        results.skipped = events.length - eventsToProcess.length;
      }

      logger.info(`Processing ${eventsToProcess.length} events (${results.skipped} skipped)`);

      // Process events in batches to avoid overwhelming the system
      const batchSize = 3;
      for (let i = 0; i < eventsToProcess.length; i += batchSize) {
        const batch = eventsToProcess.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (event) => {
          try {
            // Skip events without location data
            if (!event.latitude || !event.longitude) {
              logger.warn(`Event ${event.id} missing location data, skipping`);
              results.skipped++;
              return;
            }

            // If forcing recalculation, delete existing data first
            if (forceRecalculate) {
              await supabase.from('planetary_transits').delete().eq('event_id', event.id);
              await supabase.from('planetary_aspects').delete().eq('event_id', event.id);
              await supabase.from('planetary_snapshot').delete().eq('event_id', event.id);
            }

            // Generate astronomical data
            await this.generateAstronomicalData(
              event.id, 
              event.event_date, 
              event.latitude, 
              event.longitude, 
              event.location_name || ''
            );
            
            results.enhanced++;
            logger.info(`✅ Enhanced event ${event.id}`);
            
          } catch (error) {
            logger.error(`❌ Failed to enhance event ${event.id}:`, error);
            results.failed++;
            results.errors.push({
              event_id: event.id,
              error: error.message
            });
          }
        });

        await Promise.all(batchPromises);
        
        // Add small delay between batches to be gentle on the system
        if (i + batchSize < eventsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`🎉 Enhancement complete: ${results.enhanced} enhanced, ${results.skipped} skipped, ${results.failed} failed`);
      return results;
      
    } catch (error) {
      logger.error('Error in enhancePlanetaryData:', error);
      throw error;
    }
  }

  /**
   * Delete an event and all associated data
   * @param {string} eventId - Event ID to delete
   */
  async deleteEvent(eventId) {
    try {
      logger.info(`🗑️ Deleting event: ${eventId}`);
      
      const { error } = await supabase
        .from('world_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        logger.error('Error deleting event:', error);
        throw error;
      }

      logger.info(`✅ Event ${eventId} deleted successfully`);
    } catch (error) {
      logger.error('Error in deleteEvent:', error);
      throw error;
    }
  }
}

module.exports = new WorldEventsService();
