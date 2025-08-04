const { supabase } = require('../config/supabase');
const getCoordinatesFromWikipediaUrl = require('../utils/locationFetcher');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// File to track failed events (temporary solution until DB columns are added)
const FAILED_EVENTS_FILE = path.join(__dirname, '../temp/failed_events.json');

// Load previously failed events
function loadFailedEvents() {
  try {
    if (fs.existsSync(FAILED_EVENTS_FILE)) {
      const data = fs.readFileSync(FAILED_EVENTS_FILE, 'utf8');
      return new Set(JSON.parse(data));
    }
  } catch (error) {
    logger.debug('Could not load failed events file:', error.message);
  }
  return new Set();
}

// Save failed events
function saveFailedEvents(failedEvents) {
  try {
    const dir = path.dirname(FAILED_EVENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FAILED_EVENTS_FILE, JSON.stringify([...failedEvents], null, 2));
  } catch (error) {
    logger.debug('Could not save failed events file:', error.message);
  }
}

/**
 * Update world events with coordinates from Wikipedia URLs
 */
async function updateEventCoordinates() {
  try {
    logger.info('🌍 Starting coordinate update for world events...');

    // Load previously failed events from file
    const failedEvents = loadFailedEvents();
    logger.info(`📝 Loaded ${failedEvents.size} previously failed events to skip`);

    // Fetch events that have source_url but no coordinates
    const { data: events, error: fetchError } = await supabase
      .from('world_events')
      .select('id, title, source_url, latitude, longitude')
      .not('source_url', 'is', null)
      .is('latitude', null)
      .limit(100); // Get more to filter out failed ones

    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      logger.info('📭 No events found that need coordinate updates');
      return;
    }

    // Filter out previously failed events
    const filteredEvents = events.filter(event => !failedEvents.has(event.title));
    const skippedCount = events.length - filteredEvents.length;
    
    logger.info(`📊 Found ${events.length} events, skipping ${skippedCount} previously failed, processing ${filteredEvents.length}`);

    const results = {
      updated: 0,
      failed: 0,
      skipped: skippedCount,
      errors: [],
      sources: {}
    };
    
    const newFailedEvents = new Set(failedEvents);

    // Process only first 50 to maintain batch size
    const eventsToProcess = filteredEvents.slice(0, 50);

    for (const event of eventsToProcess) {
      try {
        logger.info(`🔍 Processing: ${event.title}`);
        
        // Skip if not a Wikipedia URL
        if (!event.source_url.includes('wikipedia.org/wiki/')) {
          logger.info(`⏭️  Skipping non-Wikipedia URL: ${event.source_url}`);
          results.skipped++;
          continue;
        }

        // Get coordinates from Wikipedia URL with enhanced geocoding (with timeout)
        const coordinates = await Promise.race([
          getCoordinatesFromWikipediaUrl(event.source_url, event.title),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
          )
        ]);
        
        if (coordinates && coordinates.latitude && coordinates.longitude) {
          // Update the event with coordinates and metadata
          const updateData = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            updated_at: new Date().toISOString()
          };
          
          // Add location metadata if available
          if (coordinates.location_name && !event.location_name) {
            updateData.location_name = coordinates.location_name;
          }

          const { error: updateError } = await supabase
            .from('world_events')
            .update(updateData)
            .eq('id', event.id);

          if (updateError) {
            logger.error(`❌ Failed to update ${event.title}:`, updateError.message);
            results.failed++;
            results.errors.push({
              title: event.title,
              error: updateError.message,
              coordinates: coordinates
            });
          } else {
            const sourceInfo = coordinates.source ? ` (${coordinates.source})` : '';
            logger.info(`✅ Updated ${event.title}: ${coordinates.latitude}, ${coordinates.longitude}${sourceInfo}`);
            results.updated++;
            results.sources[coordinates.source] = (results.sources[coordinates.source] || 0) + 1;
          }
        } else {
          logger.warn(`⚠️  No coordinates found for: ${event.title}`);
          
          // Add to failed events list
          newFailedEvents.add(event.title);
          
          results.failed++;
          results.errors.push({
            title: event.title,
            error: 'No coordinates found',
            url: event.source_url
          });
        }

        // Enhanced rate limiting - longer delays between requests
        const delay = Math.random() * 1000 + 2000; // 2-3 seconds random delay
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        logger.error(`💥 Error processing ${event.title}:`, error.message);
        
        // Add to failed events list (including timeouts)
        newFailedEvents.add(event.title);
        
        results.failed++;
        results.errors.push({
          title: event.title,
          error: error.message
        });
      }
    }

    // Save updated failed events list
    if (newFailedEvents.size > failedEvents.size) {
      saveFailedEvents(newFailedEvents);
      logger.info(`💾 Saved ${newFailedEvents.size - failedEvents.size} new failed events to skip in future runs`);
    }

    // Final report
    logger.info('\n📊 COORDINATE UPDATE SUMMARY:');
    logger.info('='.repeat(60));
    logger.info(`✅ Successfully updated: ${results.updated}`);
    logger.info(`❌ Failed: ${results.failed}`);
    logger.info(`⏭️  Skipped: ${results.skipped}`);
    logger.info(`📈 Success Rate: ${Math.round((results.updated / (results.updated + results.failed)) * 100)}%`);

    if (results.errors.length > 0) {
      logger.info('\n❌ ERRORS:');
      logger.info('-'.repeat(60));
      results.errors.forEach(error => {
        logger.info(`${error.title}: ${error.error}`);
      });
    }

    return results;

  } catch (error) {
    logger.error('💥 Failed to update event coordinates:', error);
    throw error;
  }
}

/**
 * Update a specific event by ID
 */
async function updateSingleEventCoordinates(eventId) {
  try {
    logger.info(`🎯 Updating coordinates for event ID: ${eventId}`);

    // Fetch the specific event
    const { data: event, error: fetchError } = await supabase
      .from('world_events')
      .select('id, title, source_url, latitude, longitude')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch event: ${fetchError.message}`);
    }

    if (!event.source_url || !event.source_url.includes('wikipedia.org/wiki/')) {
      throw new Error('Event does not have a valid Wikipedia URL');
    }

    // Get coordinates
    const coordinates = await getCoordinatesFromWikipediaUrl(event.source_url);
    
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      throw new Error('No coordinates found for this event');
    }

    // Update the event
    const { error: updateError } = await supabase
      .from('world_events')
      .update({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (updateError) {
      throw new Error(`Failed to update event: ${updateError.message}`);
    }

    logger.info(`✅ Updated ${event.title}: ${coordinates.latitude}, ${coordinates.longitude}`);
    return coordinates;

  } catch (error) {
    logger.error(`💥 Failed to update event ${eventId}:`, error.message);
    throw error;
  }
}

/**
 * Check how many events need coordinate updates
 */
async function checkEventsNeedingCoordinates() {
  try {
    const { count: totalEvents, error: totalError } = await supabase
      .from('world_events')
      .select('*', { count: 'exact', head: true });

    const { count: eventsWithCoords, error: coordsError } = await supabase
      .from('world_events')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    const { count: eventsWithUrls, error: urlsError } = await supabase
      .from('world_events')
      .select('*', { count: 'exact', head: true })
      .not('source_url', 'is', null)
      .is('latitude', null);

    if (totalError || coordsError || urlsError) {
      throw new Error('Failed to fetch event counts');
    }

    logger.info('📊 EVENT COORDINATE STATUS:');
    logger.info('-'.repeat(50));
    logger.info(`Total events: ${totalEvents}`);
    logger.info(`Events with coordinates: ${eventsWithCoords}`);
    logger.info(`Events with URLs but no coordinates: ${eventsWithUrls}`);
    logger.info(`Completion rate: ${Math.round((eventsWithCoords / totalEvents) * 100)}%`);

    return {
      total: totalEvents,
      withCoords: eventsWithCoords,
      needingCoords: eventsWithUrls
    };

  } catch (error) {
    logger.error('💥 Failed to check event status:', error);
    throw error;
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'check') {
    checkEventsNeedingCoordinates()
      .then(() => {
        logger.info('🎉 Status check completed!');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Status check failed:', error);
        process.exit(1);
      });
  } else if (command === 'update' && args[1]) {
    updateSingleEventCoordinates(args[1])
      .then(() => {
        logger.info('🎉 Single event update completed!');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Single event update failed:', error);
        process.exit(1);
      });
  } else {
    updateEventCoordinates()
      .then(() => {
        logger.info('🎉 Coordinate update completed!');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Coordinate update failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  updateEventCoordinates,
  updateSingleEventCoordinates,
  checkEventsNeedingCoordinates
};
