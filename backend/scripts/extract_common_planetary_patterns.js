/**
 * Extract common planetary patterns from world_events
 * - Creates per-event summaries in event_planetary_summaries
 * - Aggregates common patterns and upserts into astrological_patterns
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const { populateEventPatternMatches } = require('./populate_event_pattern_matches');

const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];

async function ensureEventSummaryTable() {
  // Skip DDL creation via RPC - assume tables exist or will be created by migrations
  logger.info('Skipping DDL creation via RPC - using existing schema');
}

function parsePlanetaryData(snapshot) {
  const planetSigns = {};
  const planetHouses = {};
  const planetLongitudes = {};

  if (!snapshot) return { planetSigns, planetHouses, planetLongitudes };

  const signOrder = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const signIndex = Object.fromEntries(signOrder.map((s, i) => [s.toLowerCase(), i]));

  PLANETS.forEach((planet) => {
    const data = snapshot[planet];
    if (!data) return;

    if (typeof data === 'string') {
      // Examples: "Cancer 11.51°", "Libra 1.08° (Chitra)"
      const match = data.match(/^([A-Za-z]+)\s+([\d.]+)°/);
      if (match) {
        const sign = match[1];
        const degInSign = parseFloat(match[2]);
        planetSigns[planet] = sign;
        const idx = signIndex[sign.toLowerCase()];
        if (idx != null && !Number.isNaN(degInSign)) {
          planetLongitudes[planet] = +(idx * 30 + degInSign).toFixed(4);
        }
      }
    } else if (typeof data === 'object') {
      if (data.sign) planetSigns[planet] = data.sign;
      if (data.house != null) planetHouses[planet] = data.house;
      // Try object-based longitude fields
      const lon =
        data.longitude ??
        data.ecliptic_longitude ??
        data.long ??
        data.lng ??
        (data.degree_in_sign != null && planetSigns[planet]
          ? (signIndex[String(planetSigns[planet]).toLowerCase()] ?? null) * 30 + Number(data.degree_in_sign)
          : null);

      if (lon != null && !Number.isNaN(Number(lon))) {
        planetLongitudes[planet] = +Number(lon).toFixed(4);
      } else if (data.sign && data.degree_in_sign != null) {
        const idx = signIndex[String(data.sign).toLowerCase()];
        const degInSign = Number(data.degree_in_sign);
        if (idx != null && !Number.isNaN(degInSign)) {
          planetLongitudes[planet] = +(idx * 30 + degInSign).toFixed(4);
        }
      }
    }
  });

  return { planetSigns, planetHouses, planetLongitudes };
}

function extractAspects(snapshot, stringAspects) {
  const aspects = [];
  const conjunctions = [];
  
  // Parse from snapshot.aspects if available
  if (snapshot && Array.isArray(snapshot.aspects)) {
    snapshot.aspects.forEach(aspect => {
      if (aspect.description) {
        const desc = aspect.description.toLowerCase();
        
        // Check for conjunctions
        if (desc.includes('conjunct')) {
          const match = desc.match(/(\w+)\s+conjunct\s+(\w+)/);
          if (match) {
            conjunctions.push({
              planet1: match[1].toLowerCase(),
              planet2: match[2].toLowerCase(),
              type: 'conjunction',
              house: aspect.fromHouse || aspect.toHouse
            });
          }
        }
        
        // Check for aspects
        if (desc.includes('aspects')) {
          if (aspect.toPlanet) {
            // Planet-to-planet aspect
            aspects.push({
              from: aspect.fromPlanet.toLowerCase(),
              to: aspect.toPlanet.toLowerCase(),
              type: aspect.aspectType || 'aspect',
              fromHouse: aspect.fromHouse,
              toHouse: aspect.toHouse
            });
          } else if (aspect.toHouse) {
            // Planet-to-house aspect
            aspects.push({
              planet: aspect.fromPlanet.toLowerCase(),
              house: aspect.toHouse,
              type: aspect.aspectType || 'aspect',
              fromHouse: aspect.fromHouse
            });
          }
        }
      }
    });
  }
  
  // Parse from string aspects if available
  if (Array.isArray(stringAspects)) {
    stringAspects.forEach(str => {
      const desc = str.toLowerCase();
      
      // Parse conjunctions
      if (desc.includes('conjunct')) {
        const match = desc.match(/(\w+)\s+conjunct\s+(\w+)/);
        if (match) {
          conjunctions.push({
            planet1: match[1].toLowerCase(),
            planet2: match[2].toLowerCase(),
            type: 'conjunction'
          });
        }
      }
      
      // Parse planet aspects
      const planetAspectMatch = desc.match(/(\w+)\s+aspects\s+(\w+)/);
      if (planetAspectMatch && !desc.includes('house')) {
        aspects.push({
          from: planetAspectMatch[1].toLowerCase(),
          to: planetAspectMatch[2].toLowerCase(),
          type: 'aspect'
        });
      }
      
      // Parse house aspects
      const houseAspectMatch = desc.match(/(\w+)\s+\(\d+[a-z]{2}\s+house\)\s+aspects\s+(\d+)[a-z]{2}\s+house/);
      if (houseAspectMatch) {
        aspects.push({
          planet: houseAspectMatch[1].toLowerCase(),
          house: parseInt(houseAspectMatch[2]),
          type: 'house_aspect'
        });
      }
    });
  }
  
  return { aspects, conjunctions };
}

async function upsertEventSummary(eventId, summary) {
  const payload = {
    event_id: eventId,
    planet_signs: summary.planetSigns,
    planet_longitudes: summary.planetLongitudes || {},
    aspects: summary.aspects,
    conjunctions: summary.conjunctions,
    computed_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('event_planetary_summaries')
    .upsert(payload, { onConflict: 'event_id' });
    
  if (error) {
    logger.warn('Failed to upsert event summary for ' + eventId + ': ' + error.message);
  }
}

function aggregatePatterns(summaries) {
  const patterns = {
    planetSigns: {},
    planetHouses: {},
    conjunctions: {},
    aspects: {}
  };
  
  summaries.forEach(summary => {
    // Planet signs
    Object.entries(summary.planetSigns).forEach(([planet, sign]) => {
      const key = `${planet}|${sign}`;
      if (!patterns.planetSigns[key]) {
        patterns.planetSigns[key] = {
          planet,
          sign,
          count: 0,
          events: []
        };
      }
      patterns.planetSigns[key].count++;
      patterns.planetSigns[key].events.push(summary.event_id);
    });
    
    // Planet houses
    Object.entries(summary.planetHouses).forEach(([planet, house]) => {
      const key = `${planet}|${house}`;
      if (!patterns.planetHouses[key]) {
        patterns.planetHouses[key] = {
          planet,
          house,
          count: 0,
          events: []
        };
      }
      patterns.planetHouses[key].count++;
      patterns.planetHouses[key].events.push(summary.event_id);
    });
    
    // Conjunctions
    summary.conjunctions.forEach(conjunction => {
      const planets = [conjunction.planet1, conjunction.planet2].sort();
      const key = `${planets[0]}-${planets[1]}`;
      if (!patterns.conjunctions[key]) {
        patterns.conjunctions[key] = {
          planet1: planets[0],
          planet2: planets[1],
          count: 0,
          events: []
        };
      }
      patterns.conjunctions[key].count++;
      patterns.conjunctions[key].events.push(summary.event_id);
    });
    
    // Aspects
    summary.aspects.forEach(aspect => {
      let key;
      if (aspect.to) {
        // Planet-to-planet aspect
        const planets = [aspect.from, aspect.to].sort();
        key = `${planets[0]}-${planets[1]}|${aspect.type}`;
      } else {
        // Planet-to-house aspect
        key = `${aspect.planet}|house${aspect.house}|${aspect.type}`;
      }
      
      if (!patterns.aspects[key]) {
        patterns.aspects[key] = {
          ...aspect,
          count: 0,
          events: []
        };
      }
      patterns.aspects[key].count++;
      patterns.aspects[key].events.push(summary.event_id);
    });
  });
  
  return patterns;
}

function buildAstrologicalPatterns(patterns, totalEvents) {
  const astrologicalPatterns = [];

  // Planet sign patterns -> pattern_type 'sign'
  Object.values(patterns.planetSigns).forEach((pattern) => {
    if (pattern.count >= 2) {
      astrologicalPatterns.push({
        pattern_name: `${pattern.planet.toUpperCase()} in ${pattern.sign}`,
        description: `${pattern.planet} in ${pattern.sign} observed in ${pattern.count} events`,
        pattern_type: 'sign',
        pattern_conditions: {
          planet: pattern.planet,
          sign: pattern.sign,
        },
        total_occurrences: pattern.count,
        success_rate: parseFloat(((pattern.count / totalEvents) * 100).toFixed(2)),
      });
    }
  });

  // Planet house patterns -> pattern_type 'house'
  Object.values(patterns.planetHouses).forEach((pattern) => {
    if (pattern.count >= 2) {
      astrologicalPatterns.push({
        pattern_name: `${pattern.planet.toUpperCase()} in House ${pattern.house}`,
        description: `${pattern.planet} in house ${pattern.house} observed in ${pattern.count} events`,
        pattern_type: 'house',
        pattern_conditions: {
          planet: pattern.planet,
          house: pattern.house,
        },
        total_occurrences: pattern.count,
        success_rate: parseFloat(((pattern.count / totalEvents) * 100).toFixed(2)),
      });
    }
  });

  // Conjunction patterns -> pattern_type 'aspect' with aspect_type: 'conjunction'
  Object.values(patterns.conjunctions).forEach((pattern) => {
    if (pattern.count >= 2) {
      astrologicalPatterns.push({
        pattern_name: `${pattern.planet1.toUpperCase()} conjunct ${pattern.planet2.toUpperCase()}`,
        description: `${pattern.planet1} conjunct ${pattern.planet2} observed in ${pattern.count} events`,
        pattern_type: 'aspect',
        pattern_conditions: {
          planets: [pattern.planet1, pattern.planet2],
          aspect_type: 'conjunction',
        },
        total_occurrences: pattern.count,
        success_rate: parseFloat(((pattern.count / totalEvents) * 100).toFixed(2)),
      });
    }
  });

  // Aspect patterns -> pattern_type 'aspect'
  Object.values(patterns.aspects).forEach((pattern) => {
    if (pattern.count >= 2) {
      let name;
      let description;

      if (pattern.to) {
        name = `${pattern.from.toUpperCase()} ${pattern.type} ${pattern.to.toUpperCase()}`;
        description = `${pattern.from} ${pattern.type} ${pattern.to} observed in ${pattern.count} events`;
      } else {
        name = `${pattern.planet.toUpperCase()} ${pattern.type} House ${pattern.house}`;
        description = `${pattern.planet} ${pattern.type} house ${pattern.house} observed in ${pattern.count} events`;
      }

      astrologicalPatterns.push({
        pattern_name: name,
        description,
        pattern_type: 'aspect',
        pattern_conditions: pattern.to
          ? {
              planets: [pattern.from, pattern.to],
              aspect_type: pattern.type,
            }
          : {
              planet: pattern.planet,
              house: pattern.house,
              aspect_type: pattern.type,
            },
        total_occurrences: pattern.count,
        success_rate: parseFloat(((pattern.count / totalEvents) * 100).toFixed(2)),
      });
    }
  });

  return astrologicalPatterns;
}

async function upsertAstrologicalPatterns(patterns) {
  const chunks = [];
  const size = 500;
  for (let i = 0; i < patterns.length; i += size) {
    chunks.push(patterns.slice(i, i + size));
  }
  
  let stored = 0;
  for (let chunk of chunks) {
    const { error } = await supabase
      .from('astrological_patterns')
      .upsert(chunk, { onConflict: 'pattern_name' });
      
    if (error) {
      logger.warn('Failed upserting patterns batch: ' + error.message);
    } else {
      stored += chunk.length;
    }
  }
  return stored;
}

async function fetchEventsBatch(from, limit) {
  const { data, error } = await supabase
    .from('world_events')
    .select('id, planetary_snapshot, planetary_aspects')
    .order('event_date', { ascending: true })
    .range(from, from + limit - 1);
    
  if (error) throw new Error(error.message);
  return data || [];
}

async function runExtraction() {
  await ensureEventSummaryTable();

  // Count total events
  const { count: totalEvents, error: countError } = await supabase
    .from('world_events')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    logger.warn('Unable to count world_events: ' + countError.message);
  }
  
  logger.info('Found ' + (totalEvents || 0) + ' events');

  const summaries = [];
  const pageSize = 1000;
  
  for (let offset = 0; ; offset += pageSize) {
    const batch = await fetchEventsBatch(offset, pageSize);
    if (!batch.length) break;

    for (const event of batch) {
      const { planetSigns, planetHouses, planetLongitudes } = parsePlanetaryData(event.planetary_snapshot);
      const { aspects, conjunctions } = extractAspects(event.planetary_snapshot, event.planetary_aspects);
      
      const summary = {
        event_id: event.id,
        planetSigns,
        planetHouses,
        planetLongitudes,
        aspects,
        conjunctions
      };
      
      await upsertEventSummary(event.id, summary);
      summaries.push(summary);
    }
    
    logger.info('Processed batch starting at ' + offset + ', size ' + batch.length);
  }

  // Aggregate and store common patterns
  const patterns = aggregatePatterns(summaries);
  const astrologicalPatterns = buildAstrologicalPatterns(patterns, summaries.length);
  const storedCount = await upsertAstrologicalPatterns(astrologicalPatterns);

  // Also populate event_pattern_matches to reference world_events via matches
  if (storedCount > 0) {
    try {
      await populateEventPatternMatches();
    } catch (e) {
      logger.warn('Failed to populate event_pattern_matches: ' + e.message);
    }
  }

  logger.info('Upserted ' + storedCount + ' patterns into astrological_patterns');
  logger.info('Extraction complete');
  
  return { 
    stored_patterns: storedCount, 
    events_processed: summaries.length,
    patterns_found: {
      planet_signs: Object.keys(patterns.planetSigns).length,
      planet_houses: Object.keys(patterns.planetHouses).length,
      conjunctions: Object.keys(patterns.conjunctions).length,
      aspects: Object.keys(patterns.aspects).length
    }
  };
}

if (require.main === module) {
  runExtraction()
    .then(result => {
      console.log('Extraction completed:', result);
      process.exit(0);
    })
    .catch(err => {
      logger.error('Extraction failed: ' + err.message);
      process.exit(1);
    });
}

module.exports = { runExtraction };
