const { supabase } = require('../config/supabase');
const { enrichWithAstroData } = require('../utils/enrichWithAstro');
const logger = require('../utils/logger');

/**
 * Extract patterns from astrological data and store in astrological_patterns table
 * @param {Object} astroData - Astrological data from enrichWithAstroData
 * @param {Object} event - Event data
 * @param {Object} planetarySnapshot - Planetary snapshot data
 */
async function extractAndStorePatterns(astroData, event, planetarySnapshot) {
  try {
    const patterns = [];
    
    // Extract conjunction patterns
    if (astroData.aspects) {
      const conjunctions = astroData.aspects.filter(aspect => aspect.aspectType === 'conjunction');
      for (const conjunction of conjunctions) {
        const patternName = `${conjunction.fromPlanet}-${conjunction.toPlanet} Conjunction`;
        patterns.push({
          pattern_name: patternName,
          description: `Conjunction between ${conjunction.fromPlanet} and ${conjunction.toPlanet}`,
          pattern_type: 'aspect',
          pattern_conditions: {
            aspect_type: 'conjunction',
            planets: [conjunction.fromPlanet, conjunction.toPlanet],
            orb: conjunction.orb || 3
          }
        });
      }
    }
    
    // Extract nakshatra patterns
    if (astroData.astroSnapshot && astroData.astroSnapshot.moon && astroData.astroSnapshot.moon.nakshatra) {
      const nakshatra = astroData.astroSnapshot.moon.nakshatra;
      patterns.push({
        pattern_name: `Moon in ${nakshatra}`,
        description: `Moon positioned in ${nakshatra} nakshatra`,
        pattern_type: 'nakshatra',
        pattern_conditions: {
          planet: 'moon',
          nakshatra: nakshatra
        }
      });
    }
    
    // Extract planetary sign patterns for major planets
    const majorPlanets = ['sun', 'moon', 'mars', 'jupiter', 'saturn'];
    for (const planet of majorPlanets) {
      if (astroData.astroSnapshot && astroData.astroSnapshot[planet] && astroData.astroSnapshot[planet].sign) {
        const sign = astroData.astroSnapshot[planet].sign;
        patterns.push({
          pattern_name: `${planet.charAt(0).toUpperCase() + planet.slice(1)} in ${sign}`,
          description: `${planet.charAt(0).toUpperCase() + planet.slice(1)} positioned in ${sign} sign`,
          pattern_type: 'sign',
          pattern_conditions: {
            planet: planet,
            sign: sign
          }
        });
      }
    }
    
    // Store patterns in astrological_patterns table (avoiding duplicates)
    for (const pattern of patterns) {
      try {
        const { error } = await supabase
          .from('astrological_patterns')
          .upsert(pattern, {
            onConflict: 'pattern_name',
            ignoreDuplicates: false
          });
          
        if (error && !error.message.includes('duplicate')) {
          logger.warn(`Failed to store pattern "${pattern.pattern_name}": ${error.message}`);
        }
      } catch (patternError) {
        logger.warn(`Error storing pattern "${pattern.pattern_name}": ${patternError.message}`);
      }
    }
    
    logger.info(`   📋 Extracted and stored ${patterns.length} astrological patterns`);
    
  } catch (error) {
    logger.warn(`Failed to extract patterns for event "${event.title}": ${error.message}`);
  }
}

/**
 * Recalculate and populate planetary data for all world events using Vedic Drishti system
 * Processes ALL events to replace Western aspects with Vedic aspects
 */
async function populatePlanetaryData() {
  try {
    logger.info('🚀 Starting Vedic planetary data recalculation for ALL world events...');
    logger.info('🕉️ Converting from Western aspects to Vedic Drishti system');
    
    // Step 1: Get ALL events with location data (force recalculation)
    const { data: events, error } = await supabase
      .from('world_events')
      .select('id, title, event_date, location_name, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('event_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    if (!events || events.length === 0) {
      logger.info('✅ No events found that need planetary data computation');
      return;
    }

    logger.info(`📊 Found ${events.length} events that need planetary data`);

    let successCount = 0;
    let errorCount = 0;

    // Step 2: Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      try {
        logger.info(`\n🌟 Processing event ${i + 1}/${events.length}: "${event.title}"`);
        logger.info(`📅 Date: ${event.event_date}, 📍 Location: ${event.location_name || 'Unknown'}`);

        // Check if there's already planetary data for this event; skip if present
        const { data: existingRow, error: checkError } = await supabase
          .from('world_events')
          .select('planetary_snapshot')
          .eq('id', event.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw new Error(`Failed to check existing data: ${checkError.message}`);
        }

        if (existingRow && existingRow.planetary_snapshot) {
          logger.info('⏭️ Skipping: planetary data already exists for this event');
          // small delay to keep pacing even when skipping
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        // Calculate planetary data
        const timestamp = new Date(event.event_date);
        const astroData = await enrichWithAstroData(
          timestamp,
          parseFloat(event.latitude),
          parseFloat(event.longitude),
          event.location_name || ''
        );

        if (!astroData.success) {
          throw new Error('Failed to calculate planetary data');
        }

        // Prepare planetary snapshot
        const planetarySnapshot = {
          ascendant: astroData.astroSnapshot.ascendant.sign + ' ' + astroData.astroSnapshot.ascendant.degree.toFixed(2) + '°',
          sun: astroData.astroSnapshot.sun.sign + ' ' + astroData.astroSnapshot.sun.degree.toFixed(2) + '°',
          moon: astroData.astroSnapshot.moon.sign + ' ' + astroData.astroSnapshot.moon.degree.toFixed(2) + '° (' + astroData.astroSnapshot.moon.nakshatra + ')',
          mars: astroData.astroSnapshot.mars.sign + ' ' + astroData.astroSnapshot.mars.degree.toFixed(2) + '°',
          mercury: astroData.astroSnapshot.mercury.sign + ' ' + astroData.astroSnapshot.mercury.degree.toFixed(2) + '°',
          jupiter: astroData.astroSnapshot.jupiter.sign + ' ' + astroData.astroSnapshot.jupiter.degree.toFixed(2) + '°',
          venus: astroData.astroSnapshot.venus.sign + ' ' + astroData.astroSnapshot.venus.degree.toFixed(2) + '°',
          saturn: astroData.astroSnapshot.saturn.sign + ' ' + astroData.astroSnapshot.saturn.degree.toFixed(2) + '°',
          rahu: astroData.astroSnapshot.rahu.sign + ' ' + astroData.astroSnapshot.rahu.degree.toFixed(2) + '°',
          ketu: astroData.astroSnapshot.ketu.sign + ' ' + astroData.astroSnapshot.ketu.degree.toFixed(2) + '°',
          nakshatra: astroData.astroSnapshot.moon.nakshatra,
          julian_day: astroData.julianDay,
          calculation_timestamp: new Date().toISOString(),
          aspects: astroData.aspects || []
        };

        // Prepare major aspects array - Vedic Drishti format
        const majorAspects = (astroData.aspects || []).map(aspect => {
          if (aspect.aspectType === 'conjunction') {
            return `${aspect.fromPlanet} conjunct ${aspect.toPlanet}`;
          } else if (aspect.aspectType === 'drishti') {
            return `${aspect.fromPlanet} aspects ${aspect.toPlanet} (${aspect.fromHouse}→${aspect.toHouse})`;
          } else {
            return aspect.description || `${aspect.fromPlanet} ${aspect.aspectType} ${aspect.toPlanet}`;
          }
        });

        

        // Update the event with planetary data
        const { error: updateError } = await supabase
          .from('world_events')
          .update({
            planetary_snapshot: planetarySnapshot,
            planetary_aspects: majorAspects
          })
          .eq('id', event.id);

        if (updateError) {
          throw new Error(`Failed to update event: ${updateError.message}`);
        }

        // Now extract patterns and add to astrological_patterns if they don't exist
        await extractAndStorePatterns(astroData, event, planetarySnapshot);

        logger.info(`✅ Successfully computed planetary data:`);
        logger.info(`   🌅 Ascendant: ${planetarySnapshot.ascendant}`);
        logger.info(`   ☀️ Sun: ${planetarySnapshot.sun}`);
        logger.info(`   🌙 Moon: ${planetarySnapshot.moon}`);
        logger.info(`   🔗 Aspects: ${majorAspects.length} found`);
        
        successCount++;

        // Add a small delay to avoid overwhelming the ephemeris calculations
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        logger.error(`❌ Failed to process event "${event.title}": ${error.message}`);
        errorCount++;
        
        // Continue with next event despite this error
        continue;
      }
    }

    // Step 3: Summary
    logger.info(`\n📈 Planetary data population completed!`);
    logger.info(`✅ Success: ${successCount} events`);
    logger.info(`❌ Errors: ${errorCount} events`);
    
    if (successCount > 0) {
      logger.info(`\n🎉 ${successCount} events now have precomputed planetary data!`);
    }

    // Step 4: Verify results
    const { data: updatedEvents, error: verifyError } = await supabase
      .from('world_events')
      .select('id, title, planetary_snapshot, planetary_aspects')
      .not('planetary_snapshot', 'is', null)
      .limit(5);

    if (!verifyError && updatedEvents && updatedEvents.length > 0) {
      logger.info(`\n🔍 Sample of updated events:`);
      updatedEvents.forEach(event => {
        const snapshot = event.planetary_snapshot;
        logger.info(`   📝 "${event.title}"`);
        logger.info(`      Sun: ${snapshot?.sun || 'N/A'}, Moon: ${snapshot?.moon || 'N/A'}`);
        logger.info(`      Aspects: ${event.planetary_aspects?.length || 0} aspects`);
      });
    }

    return { successCount, errorCount };

  } catch (error) {
    logger.error('❌ Planetary data population failed:', error);
    throw error;
  }
}

/**
 * Populate planetary data for a specific event
 * @param {string} eventId - Event ID to process
 */
async function populateEventPlanetaryData(eventId) {
  try {
    logger.info(`🌟 Processing single event: ${eventId}`);
    
    const { data: event, error } = await supabase
      .from('world_events')
      .select('id, title, event_date, location_name, latitude, longitude')
      .eq('id', eventId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch event: ${error.message}`);
    }

    if (!event.latitude || !event.longitude) {
      throw new Error('Event does not have location data (latitude/longitude required)');
    }

    // Calculate planetary data
    const timestamp = new Date(event.event_date);
    const astroData = await enrichWithAstroData(
      timestamp,
      parseFloat(event.latitude),
      parseFloat(event.longitude),
      event.location_name || ''
    );

    if (!astroData.success) {
      throw new Error('Failed to calculate planetary data');
    }

    // Prepare data for storage
    const planetarySnapshot = {
      ascendant: astroData.astroSnapshot.ascendant.sign + ' ' + astroData.astroSnapshot.ascendant.degree.toFixed(2) + '°',
      sun: astroData.astroSnapshot.sun.sign + ' ' + astroData.astroSnapshot.sun.degree.toFixed(2) + '°',
      moon: astroData.astroSnapshot.moon.sign + ' ' + astroData.astroSnapshot.moon.degree.toFixed(2) + '° (' + astroData.astroSnapshot.moon.nakshatra + ')',
      mars: astroData.astroSnapshot.mars.sign + ' ' + astroData.astroSnapshot.mars.degree.toFixed(2) + '°',
      mercury: astroData.astroSnapshot.mercury.sign + ' ' + astroData.astroSnapshot.mercury.degree.toFixed(2) + '°',
      jupiter: astroData.astroSnapshot.jupiter.sign + ' ' + astroData.astroSnapshot.jupiter.degree.toFixed(2) + '°',
      venus: astroData.astroSnapshot.venus.sign + ' ' + astroData.astroSnapshot.venus.degree.toFixed(2) + '°',
      saturn: astroData.astroSnapshot.saturn.sign + ' ' + astroData.astroSnapshot.saturn.degree.toFixed(2) + '°',
      rahu: astroData.astroSnapshot.rahu.sign + ' ' + astroData.astroSnapshot.rahu.degree.toFixed(2) + '°',
      ketu: astroData.astroSnapshot.ketu.sign + ' ' + astroData.astroSnapshot.ketu.degree.toFixed(2) + '°',
      nakshatra: astroData.astroSnapshot.moon.nakshatra,
      julian_day: astroData.julianDay,
      calculation_timestamp: new Date().toISOString(),
      aspects: astroData.aspects || []
    };

    const majorAspects = (astroData.aspects || []).map(aspect => 
      `${aspect.planetA} ${aspect.type} ${aspect.planetB}`
    );

    // Update the event
    const { error: updateError } = await supabase
      .from('world_events')
      .update({
        planetary_snapshot: planetarySnapshot,
        planetary_aspects: majorAspects
      })
      .eq('id', eventId);

    if (updateError) {
      throw new Error(`Failed to update event: ${updateError.message}`);
    }

    logger.info(`✅ Successfully computed planetary data for "${event.title}"`);
    return planetarySnapshot;

  } catch (error) {
    logger.error(`❌ Failed to populate planetary data for event ${eventId}:`, error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  populatePlanetaryData()
    .then((result) => {
      if (result) {
        logger.info(`🎉 Population completed! Success: ${result.successCount}, Errors: ${result.errorCount}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Population failed:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  populatePlanetaryData,
  populateEventPlanetaryData
};
