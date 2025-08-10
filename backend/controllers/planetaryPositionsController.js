const enhancedSwissEphemeris = require('../services/enhancedSwissEphemeris');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const aspectsService = require('../services/aspectsService');
const patternRecognitionService = require('../services/patternRecognitionService');
const { checkPatternMatch } = require('../scripts/populate_event_pattern_matches');
const MLAnalyticsService = require('../services/mlAnalyticsService');

const planetaryPositionsController = {
  async getPlanetaryPositions(req, res) {
    try {
      console.log('🔍 DEBUG - Request body:', req.body);
      console.log('🔍 DEBUG - Request headers:', req.headers);
      
      const { date, time, latitude, longitude, timezone } = req.body;
      
      console.log('🔍 DEBUG - Extracted values:', { date, time, latitude, longitude, timezone });

      // Validate required fields
      if (!date || !time || latitude === undefined || longitude === undefined) {
        console.log('🔍 DEBUG - Validation failed:', {
          hasDate: !!date,
          hasTime: !!time,
          hasLatitude: latitude !== undefined,
          hasLongitude: longitude !== undefined
        });
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: date, time, latitude, longitude'
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(time)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time format. Use HH:MM'
        });
      }

      // Validate coordinates
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          error: 'Invalid latitude. Must be between -90 and 90'
        });
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid longitude. Must be between -180 and 180'
        });
      }

      // Use provided timezone or auto-detect
      const tz = timezone || 'Auto';

      console.log(`Getting planetary positions for ${date} ${time} at ${lat}, ${lng} (${tz})`);

      // Calculate Julian Day
      const julianDay = enhancedSwissEphemeris.getJulianDay(date, time, tz, null, { lat, lng });

      // Calculate planetary positions (using sidereal for Vedic astrology)
      const useTropical = req.body.zodiac === 'tropical'; // Default to sidereal unless explicitly requested as tropical
      const planetaryData = enhancedSwissEphemeris.getPlanetaryPositions(julianDay, useTropical);

      // Calculate ascendant
      const ascendant = enhancedSwissEphemeris.calculateAscendant(julianDay, lat, lng, useTropical);

      // Calculate house positions for chart
      const housePositions = enhancedSwissEphemeris.calculateHousePositions(planetaryData.planets, ascendant);

      // Calculate aspects using Vedic system
      const planetaryAspects = aspectsService.calculateAspects(planetaryData.planets, ascendant.longitude);
      const houseAspects = aspectsService.calculatePlanetaryAspectsToHouses(planetaryData.planets, ascendant.longitude);
      const strongestAspects = aspectsService.getStrongestAspects(planetaryAspects, 10);

      // Format response with the correct data structure
      const response = {
        success: true,
        data: {
          requestInfo: {
            date,
            time,
            latitude: lat,
            longitude: lng,
            timezone: tz,
            julianDay
          },
          ascendant: {
            degree: ascendant.degreeInSign,
            sign: ascendant.sign,
            nakshatra: ascendant.nakshatra,
            formatted: ascendant.degreeFormatted
          },
          planets: Object.values(planetaryData.planets).map(planet => {
            // Calculate house number for this planet
            const houseNumber = enhancedSwissEphemeris.calculateHouseNumber(planet.longitude, ascendant.longitude);
            
            return {
              name: planet.name,
              degree: planet.degreeInSign,
              sign: planet.sign,
              nakshatra: planet.nakshatra,
              isRetrograde: planet.isRetrograde,
              formatted: planet.degreeFormatted,
              longitude: planet.longitude,
              house: houseNumber
            };
          }),
          aspects: {
            planetaryAspects: planetaryAspects,
            houseAspects: houseAspects,
            strongestAspects: strongestAspects,
            summary: {
              totalPlanetaryAspects: planetaryAspects.length,
              planetsWithHouseAspects: Object.keys(houseAspects).length,
              rahuKetuSpecialAspectsEnabled: aspectsService.config.enableRahuKetuSpecialAspects
            }
          },
          charts: {
            lagna: {
              houses: housePositions,
              ascendant: ascendant,
              planets: planetaryData.planets
            }
          }
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Error calculating planetary positions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while calculating planetary positions'
      });
    }
  }
};

module.exports = planetaryPositionsController;

/**
 * Helper: normalize planets list to quick lookup keyed by lowercase planet name
 */
function indexPlanetsByName(planetsArray) {
  const map = {};
  (planetsArray || []).forEach((p) => {
    if (p && p.name) {
      map[String(p.name).toLowerCase()] = p;
    }
  });
  return map;
}

/**
 * Helper: build snapshot object compatible with pattern matchers
 * Each planet key holds a string like "Aries 10.5° (Ashwini)" so sign-based patterns work out of the box
 */
function buildSnapshotForMatching(planetsArray, planetaryAspects) {
  const snapshot = {};
  const planets = indexPlanetsByName(planetsArray);
  for (const [key, p] of Object.entries(planets)) {
    const sign = p.sign || '';
    const degree = typeof p.degree === 'number' ? p.degree : (typeof p.degreeInSign === 'number' ? p.degreeInSign : undefined);
    const formattedDegree = typeof degree === 'number' ? `${Number(degree).toFixed(2)}°` : '';
    const nak = p.nakshatra ? ` (${p.nakshatra})` : '';
    snapshot[key] = `${sign} ${formattedDegree}${nak}`.trim();
  }
  // Vedic aspects snapshot (house drishti labels)
  snapshot.aspects = Array.isArray(planetaryAspects) ? planetaryAspects.map((a) => {
    const fromPlanet = (a.planet1 || a.fromPlanet || a.from || '').toString().toLowerCase();
    const toPlanet = (a.planet2 || a.toPlanet || a.to || '').toString().toLowerCase();
    const typeLabel = a.aspect || a.aspectType || a.type || 'Drishti';
    return {
      fromPlanet,
      toPlanet,
      aspectType: typeLabel, // e.g., "Seventh House Drishti"
      description: a.aspect || a.description || `${fromPlanet} drishti ${toPlanet || (a.toHouse ? `house ${a.toHouse}` : '')}`,
      fromHouse: a.fromHouse,
      toHouse: a.toHouse
    };
  }) : [];
  return snapshot;
}

/**
 * Helper: compute planet_signs and planet_longitudes for event_planetary_summaries
 */
function computeSummaryMaps(planetsArray) {
  const planetSigns = {};
  const planetLongitudes = {};
  const signOrder = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
  ];
  const signIndex = Object.fromEntries(signOrder.map((s, i) => [s.toLowerCase(), i]));
  (planetsArray || []).forEach((p) => {
    if (!p || !p.name) return;
    const key = String(p.name).toLowerCase();
    if (p.sign) planetSigns[key] = p.sign;
    const lon = typeof p.longitude === 'number' ? p.longitude : undefined;
    if (typeof lon === 'number') {
      planetLongitudes[key] = Number(lon.toFixed(4));
    } else if (p.sign && typeof p.degree === 'number') {
      const idx = signIndex[p.sign.toLowerCase()];
      planetLongitudes[key] = typeof idx === 'number' ? Number((idx * 30 + p.degree).toFixed(4)) : undefined;
    }
  });
  return { planetSigns, planetLongitudes };
}

// Helper: enrich interpretations
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function deriveSignPlacementInterpretation(planet, sign) {
  const planetKey = planet.toLowerCase();
  const signKey = String(sign);
  const planetThemes = {
    sun: 'vitality, authority, and visibility',
    moon: 'mood, public sentiment, and tides of emotion',
    mercury: 'thinking, information flow, trade, and communication',
    venus: 'harmony, finance, and relationships',
    mars: 'assertion, conflict, and rapid action',
    jupiter: 'expansion, law, and macro-finance',
    saturn: 'constraints, governance, and structural tests',
    rahu: 'amplification, disruption, and sudden shifts',
    ketu: 'detachment, dissolution, and karmic correction'
  };
  const signFlavors = {
    Aries: 'decisive, pioneering momentum',
    Taurus: 'stability and material focus',
    Gemini: 'exchange, mobility, and versatility',
    Cancer: 'security, sentiment, and domestic themes',
    Leo: 'visibility, leadership, and performance',
    Virgo: 'analysis, systems, and refinement',
    Libra: 'balance, negotiation, and aesthetics',
    Scorpio: 'depth, secrecy, and transformative pressure',
    Sagittarius: 'expansion, ideals, and outreach',
    Capricorn: 'structure, governance, and discipline',
    Aquarius: 'innovation, networks, and technology',
    Pisces: 'intuition, diffusion, and ambiguity'
  };
  const base = planetThemes[planetKey] || 'influence';
  const flavor = signFlavors[signKey] || 'its domain';
  // Special callouts for well-known combos
  const specials = {
    'mercury-Pisces': 'intuitive thinking with potential communication diffusion',
    'mercury-Gemini': 'rapid exchange and amplified news cycles',
    'jupiter-Capricorn': 'growth under constraints; cautious finance and regulation',
    'saturn-Aquarius': 'structural reforms around technology and networks',
    'mars-Scorpio': 'intense willpower; potential for covert action'
  };
  const spKey = `${planetKey}-${signKey}`;
  const extra = specials[spKey] ? ` ${capitalize(specials[spKey])}.` : '';
  return `${capitalize(planet)} in ${sign} focuses ${base} through ${flavor}.${extra}`.trim();
}

function deriveAspectInterpretation(p1, p2, aspectType) {
  const pair = `${p1.toLowerCase()}-${p2.toLowerCase()}`;
  const reversed = `${p2.toLowerCase()}-${p1.toLowerCase()}`;
  const pairThemes = {
    'mars-saturn': 'tension between acceleration and restriction; tests of resolve',
    'saturn-mars': 'tension between acceleration and restriction; tests of resolve',
    'jupiter-saturn': 'balance of expansion and regulation; policy and macro shifts',
    'venus-jupiter': 'ease and optimism; consumption and credit impulses',
    'mercury-mars': 'heated discourse; sharp rhetoric and rapid moves',
    'sun-saturn': 'authority checks; accountability and structural pressure',
    'moon-rahu': 'surges in sentiment and narratives; volatility',
    'moon-ketu': 'emotional detachment; focus on endings and cleanup'
  };
  const theme = pairThemes[pair] || pairThemes[reversed] || 'interplay of the planets’ themes';
  const aspectNotes = {
    conjunction: 'intensifies and fuses their themes',
    opposition: 'polarizes themes; externalized tension',
    trine: 'smooths expression; constructive flow',
    square: 'creates friction; demands adjustment',
    sextile: 'opens mild opportunity; cooperative tone'
  };
  const note = aspectNotes[aspectType.toLowerCase()] || 'activates their interaction';
  return `${capitalize(p1)}–${capitalize(p2)} ${aspectType} ${note}; ${theme}.`;
}

function buildInsightHeadline(name, interpretation, occurrences) {
  const short = interpretation ? interpretation.split('. ')[0] : '';
  return `${name} – ${short}`.trim();
}

/**
 * Controller method: Generate full report and persist snapshot/matches
 */
planetaryPositionsController.generateReport = async function generateReport(req, res) {
  try {
    const { date, time, latitude, longitude, timezone, location_name, place } = req.body || {};

    // Validate minimal inputs
    if (!date || !time || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: date, time, latitude, longitude' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Invalid coordinates' });
    }

    const tz = timezone || 'Auto';

    // One-time calculation of planetary data (no recomputation downstream)
    const julianDay = enhancedSwissEphemeris.getJulianDay(date, time, tz, null, { lat, lng });
    // Force sidereal (Vedic) calculations unless explicitly asked for tropical
    const useTropical = req.body.zodiac === 'tropical' ? true : false;
    const planetaryData = enhancedSwissEphemeris.getPlanetaryPositions(julianDay, useTropical);
    const ascendant = enhancedSwissEphemeris.calculateAscendant(julianDay, lat, lng, useTropical);
    const housePositions = enhancedSwissEphemeris.calculateHousePositions(planetaryData.planets, ascendant);
    const planetaryAspects = aspectsService.calculateAspects(planetaryData.planets, ascendant.longitude);
    const houseAspects = aspectsService.calculatePlanetaryAspectsToHouses(planetaryData.planets, ascendant.longitude);
    const strongestAspects = aspectsService.getStrongestAspects(planetaryAspects, 10);

    const planetsPayload = Object.values(planetaryData.planets).map((planet) => {
      const houseNumber = enhancedSwissEphemeris.calculateHouseNumber(planet.longitude, ascendant.longitude);
      return {
        name: planet.name,
        degree: planet.degreeInSign,
        sign: planet.sign,
        nakshatra: planet.nakshatra,
        isRetrograde: planet.isRetrograde,
        formatted: planet.degreeFormatted,
        longitude: planet.longitude,
        house: houseNumber
      };
    });

    // 1) Insert lightweight event to satisfy FK for matches
    const eventTitle = `Planetary Snapshot ${date} ${time}${place ? ' - ' + place : ''}`;
    const { data: eventInsert, error: eventErr } = await supabase
      .from('world_events')
      .insert([
        {
          title: eventTitle,
          description: 'Auto-generated snapshot from Planetary Positions page',
          // Store as date-only to match schema expectations; time info is implicit in title/description
          event_date: `${date}`,
          category: 'snapshot',
          event_type: 'snapshot',
          impact_level: 'low',
          location_name: location_name || place || null,
          latitude: lat,
          longitude: lng,
          source_name: 'planetary_positions_ui'
        }
      ])
      .select('id, event_date')
      .single();
    let eventId = null;
    let persisted = true;
    if (eventErr) {
      persisted = false;
      logger.warn('Proceeding without persistence. Failed to insert snapshot world_event: ' + eventErr.message);
    } else {
      eventId = eventInsert.id;
    }

    // 2) Upsert into event_planetary_summaries
    const { planetSigns, planetLongitudes } = computeSummaryMaps(planetsPayload);
    const planetHousesMap = (() => {
      const out = {};
      (planetsPayload || []).forEach(p => {
        if (p && p.name && typeof p.house === 'number') {
          out[String(p.name).toLowerCase()] = Number(p.house);
        }
      });
      return out;
    })();
    const aspectsForSummary = (planetaryAspects || []).map((a) => ({
      fromPlanet: (a.planet1 || '').toString().toLowerCase(),
      toPlanet: (a.planet2 || '').toString().toLowerCase(),
      aspectType: a.aspect || 'aspect',
      fromHouse: typeof a.fromHouse === 'number' ? a.fromHouse : null,
      toHouse: typeof a.toHouse === 'number' ? a.toHouse : null
    }));
    const conjunctions = []; // Vedic house aspect engine does not natively derive conjunctions here
    if (eventId) {
      try {
        await supabase
          .from('event_planetary_summaries')
          .upsert({
            event_id: eventId,
            planet_signs: planetSigns,
            planet_houses: planetHousesMap,
            planet_longitudes: planetLongitudes,
            aspects: aspectsForSummary,
            conjunctions: conjunctions,
            computed_at: new Date().toISOString()
          }, { onConflict: 'event_id' });
      } catch (e) {
        logger.warn('event_planetary_summaries upsert skipped:', e.message);
      }
    }

    // 3) Pattern matching against astrological_patterns
    const { data: patterns, error: patternsErr } = await supabase
      .from('astrological_patterns')
      .select('id, pattern_name, pattern_type, pattern_conditions, description, success_rate, total_occurrences');
    if (patternsErr) {
      logger.warn('Could not fetch patterns:', patternsErr.message);
    }

    const snapshotForMatch = buildSnapshotForMatching(planetsPayload, planetaryAspects);
    // Build structured snapshot for ML similarity fallback
    const structuredSnapshot = (() => {
      const snap = {};
      (planetsPayload || []).forEach(p => {
        const key = String(p.name).toLowerCase();
        snap[key] = { sign: p.sign, degree: typeof p.degree === 'number' ? p.degree : undefined };
      });
      return snap;
    })();
    const matchedPatterns = [];
    if (Array.isArray(patterns)) {
      for (const pattern of patterns) {
        let conditions = pattern.pattern_conditions;
        try { if (typeof conditions === 'string') conditions = JSON.parse(conditions); } catch (_) {}
        // Use shared matcher where possible
        let match = null;
        try {
          match = checkPatternMatch(snapshotForMatch, conditions, pattern.pattern_type, { category: 'snapshot' });
        } catch (e) {
          match = null;
        }
        // Fallback simple sign/house checks if shared matcher is not sufficient
        if (!match && pattern.pattern_type === 'sign' && conditions?.planet && conditions?.sign) {
          const planetKey = String(conditions.planet).toLowerCase();
          const planet = planetsPayload.find((p) => String(p.name).toLowerCase() === planetKey);
          if (planet && planet.sign?.toLowerCase() === String(conditions.sign).toLowerCase()) {
            match = {
              strength: 80,
              exactness: true,
              orb_applied: 0,
              details: { planet: planetKey, sign: planet.sign }
            };
          }
        }
        if (!match && pattern.pattern_type === 'house' && conditions?.planet && conditions?.house) {
          const planetKey = String(conditions.planet).toLowerCase();
          const planet = planetsPayload.find((p) => String(p.name).toLowerCase() === planetKey);
          if (planet && Number(planet.house) === Number(conditions.house)) {
            match = {
              strength: 75,
              exactness: true,
              orb_applied: 0,
              details: { planet: planetKey, house: planet.house }
            };
          }
        }
        if (match) {
          matchedPatterns.push({
            pattern_id: pattern.id,
            pattern_name: pattern.pattern_name,
            pattern_type: pattern.pattern_type,
            success_rate: pattern.success_rate || 0,
            total_occurrences: pattern.total_occurrences || 0,
            description: pattern.description || null,
            pattern_conditions: conditions || null,
            match_strength: match.strength,
            exactness: !!match.exactness,
            orb_applied: match.orb_applied || 0,
            match_details: match.details || {}
          });
        }
      }
    }

    // Persist matches
    if (eventId && matchedPatterns.length > 0) {
      try {
        const rows = matchedPatterns.map((m) => ({
          event_id: eventId,
          pattern_id: m.pattern_id,
          match_strength: m.match_strength,
          exactness: m.exactness,
          orb_applied: m.orb_applied,
          match_details: m.match_details
        }));
        const { error: insertMatchesErr } = await supabase.from('event_pattern_matches').insert(rows);
        if (insertMatchesErr) logger.warn('Failed inserting event_pattern_matches: ' + insertMatchesErr.message);
      } catch (e) {
        logger.warn('Insert into event_pattern_matches failed:', e.message);
      }
    }

    // 4) Historical parallels via view or join
    let historicalParallels = [];
    try {
      const topPatternIds = matchedPatterns
        .sort((a, b) => b.match_strength - a.match_strength)
        .slice(0, 5)
        .map((m) => m.pattern_id);
      if (topPatternIds.length > 0) {
        // Prefer the events_with_pattern_matches view if available
        const { data: parallels, error: parErr } = await supabase
          .from('events_with_pattern_matches')
          .select('event_id, event_date, title, category, impact_level, pattern_id, match_strength')
          .in('pattern_id', topPatternIds)
          .neq('event_id', eventId)
          .order('match_strength', { ascending: false })
          .limit(25);
        if (!parErr && Array.isArray(parallels)) {
          const sorted = parallels.sort((a, b) => {
            const strengthDiff = (b.match_strength || 0) - (a.match_strength || 0);
            if (strengthDiff !== 0) return strengthDiff;
            return new Date(b.event_date) - new Date(a.event_date);
          });
          historicalParallels = sorted.slice(0, 5).map((e) => ({
            event_id: e.event_id,
            date: e.event_date,
            title: e.title,
            category: e.category,
            impact_level: e.impact_level
          }));
        } else {
          // Fallback: manual join via two queries
          const { data: matches, error: mErr } = await supabase
            .from('event_pattern_matches')
            .select('event_id, pattern_id, match_strength')
            .in('pattern_id', topPatternIds)
            .neq('event_id', eventId)
            .limit(100);
          if (!mErr && Array.isArray(matches) && matches.length) {
            const byEvent = new Map();
            matches.forEach((m) => {
              const prev = byEvent.get(m.event_id);
              if (!prev || (m.match_strength || 0) > (prev.match_strength || 0)) byEvent.set(m.event_id, m);
            });
            const ids = Array.from(byEvent.keys());
            const { data: events, error: eErr } = await supabase
              .from('world_events')
              .select('id, title, event_date, category, impact_level')
              .in('id', ids);
            if (!eErr && Array.isArray(events)) {
              const merged = events.map((e) => ({
                event_id: e.id,
                title: e.title,
                date: e.event_date,
                category: e.category,
                impact_level: e.impact_level,
                match_strength: (byEvent.get(e.id) || {}).match_strength || 0
              }));
              historicalParallels = merged
                .sort((a, b) => {
                  const s = b.match_strength - a.match_strength;
                  if (s !== 0) return s;
                  return new Date(b.date) - new Date(a.date);
                })
                .slice(0, 5);
            }
          }
        }
        // If no exact or direct matches, allow partial overlap (>=60% pattern overlap)
        if (!historicalParallels.length) {
          const currentTop = new Set(topPatternIds);
          const neededOverlap = Math.max(1, Math.ceil(0.6 * currentTop.size));
          const { data: partialMatches, error: pErr } = await supabase
            .from('event_pattern_matches')
            .select('event_id, pattern_id, match_strength')
            .in('pattern_id', Array.from(currentTop))
            .neq('event_id', eventId)
            .limit(1000);
        if (!pErr && Array.isArray(partialMatches) && partialMatches.length) {
            const byEvent = new Map();
            for (const m of partialMatches) {
              if (!byEvent.has(m.event_id)) byEvent.set(m.event_id, []);
              byEvent.get(m.event_id).push(m);
            }
            const candidates = [];
            byEvent.forEach((arr, evId) => {
              const unique = new Set(arr.map(x => x.pattern_id));
              const overlap = Array.from(currentTop).filter(id => unique.has(id)).length;
              if (overlap >= neededOverlap) {
                const combinedStrength = arr.reduce((s, x) => s + (x.match_strength || 0), 0);
                candidates.push({ event_id: evId, overlap, combinedStrength });
              }
            });
            if (candidates.length) {
              const ids = candidates.map(c => c.event_id);
              const { data: evs, error: evErr } = await supabase
                .from('world_events')
                .select('id, title, event_date, category, impact_level')
                .in('id', ids);
              if (!evErr && Array.isArray(evs)) {
                const byId = Object.fromEntries(evs.map(e => [e.id, e]));
                let prelim = candidates
                  .map(c => ({
                    event_id: c.event_id,
                    date: byId[c.event_id]?.event_date,
                    title: byId[c.event_id]?.title,
                    category: byId[c.event_id]?.category,
                    impact_level: byId[c.event_id]?.impact_level,
                    combined_strength: c.combinedStrength,
                    overlap_ratio: c.overlap / currentTop.size
                  }))
                  .filter(e => e.date && e.title)
                  .sort((a, b) => {
                    const s = (b.combined_strength || 0) - (a.combined_strength || 0);
                    if (s !== 0) return s;
                    return new Date(b.date) - new Date(a.date);
                  })
                  .slice(0, 5);
                // Enrich with description summary
                const idsTop = prelim.map(p => p.event_id);
                if (idsTop.length) {
                  const { data: descRows, error: dErr } = await supabase
                    .from('world_events')
                    .select('id, description')
                    .in('id', idsTop);
                  if (!dErr && Array.isArray(descRows)) {
                    const by = Object.fromEntries(descRows.map(r => [r.id, r.description]));
                    prelim = prelim.map(p => ({
                      ...p,
                      summary: (by[p.event_id] || '')?.slice(0, 180) || null
                    }));
                  }
                }
                historicalParallels = prelim;
              }
            }
          }
        }
        // If still empty, use ML similarity on planetary_snapshot
        if (!historicalParallels.length) {
          try {
            const ml = new MLAnalyticsService();
            const mlMatches = await ml.findHistoricalSimilarities({ planetary_snapshot: structuredSnapshot });
            if (Array.isArray(mlMatches) && mlMatches.length) {
              historicalParallels = mlMatches.map(m => ({
                date: m.event.date,
                title: m.event.title,
                category: m.event.category,
                impact_level: m.event.impact_level,
                similarity_score: Math.round((m.similarity_score || 0) * 100)
              }));
            }
          } catch (e) {
            logger.warn('ML similarity fallback failed:', e.message);
          }
        }
      }
    } catch (e) {
      logger.warn('Historical parallels lookup failed:', e.message);
    }

    // 5) Predictive indicators
    // Get total historical events to compute rarity percentages
    let totalHistoricalEvents = 0;
    try {
      const { count: totalCount, error: countErr } = await supabase
        .from('world_events')
        .select('*', { count: 'exact', head: true });
      if (!countErr) totalHistoricalEvents = totalCount || 0;
    } catch (_) {}

    const activePatterns = matchedPatterns
      .sort((a, b) => b.match_strength - a.match_strength)
      .slice(0, 10)
      .map((m) => {
        // Build brief interpretation
        let interpretation = m.description || '';
        if (!interpretation && m.pattern_conditions) {
          const c = m.pattern_conditions;
          if (m.pattern_type === 'sign' && c.planet && c.sign) {
            interpretation = deriveSignPlacementInterpretation(String(c.planet), String(c.sign));
          } else if (m.pattern_type === 'house' && c.planet && c.house) {
            interpretation = `${String(c.planet).toUpperCase()} in house ${c.house} emphasizing the life area of that house.`;
          } else if (m.pattern_type === 'aspect' && Array.isArray(c.planets) && c.planets.length >= 2 && c.aspect_type) {
            interpretation = deriveAspectInterpretation(String(c.planets[0]), String(c.planets[1]), String(c.aspect_type));
          }
        }
        // Rarity metrics removed
        // Clean pattern name to remove "observed in X events" if present
        const cleanPatternName = m.pattern_name.replace(/\s+observed\s+in\s+\d+\s+events?/i, '');
        const headline = buildInsightHeadline(cleanPatternName, interpretation, m.total_occurrences);
        return {
          name: cleanPatternName,
          type: m.pattern_type,
          match_strength: Math.round(m.match_strength),
          success_rate: Math.round(m.success_rate || 0),
          interpretation: interpretation || null,
          total_occurrences: m.total_occurrences || 0,
          // Removed rarity flags and percentage
          headline
        };
      });

    // Per-category forecast using pattern names
    const categoryTallies = {};
    for (const m of matchedPatterns) {
      // Clean pattern name for category inference
      const cleanPatternName = m.pattern_name.replace(/\s+observed\s+\d+\s+events?/i, '');
      const cat = patternRecognitionService.inferCategoryFromPattern(cleanPatternName);
      if (!categoryTallies[cat]) categoryTallies[cat] = { totalStrength: 0, count: 0, successAgg: 0 };
      categoryTallies[cat].totalStrength += m.match_strength;
      categoryTallies[cat].successAgg += (m.success_rate || 0);
      categoryTallies[cat].count += 1;
    }

    // Optional ML blending
    let mlBlend = {};
    try {
      const { data: mlPreds } = await supabase
        .from('ml_predictions')
        .select('category, probability')
        .gte('prediction_date', `${date}T00:00:00.000Z`)
        .lte('prediction_date', `${date}T23:59:59.999Z`);
      if (Array.isArray(mlPreds)) {
        mlPreds.forEach((p) => { mlBlend[p.category] = Math.max(mlBlend[p.category] || 0, p.probability || 0); });
      }
    } catch (_) {}

    const predictiveOutlook = Object.entries(categoryTallies).map(([cat, vals]) => {
      const avgStrength = vals.totalStrength / Math.max(1, vals.count);
      const avgSuccess = vals.successAgg / Math.max(1, vals.count);
      const patternProb = (avgStrength / 100) * (avgSuccess / 100);
      const mlProb = mlBlend[cat] || 0;
      const composite = 0.6 * patternProb + 0.4 * mlProb;
      const likelihood = composite >= 0.6 ? 'high' : composite >= 0.3 ? 'moderate' : 'low';
      // Historical context: estimate successes from matched patterns for this category
      let totalCases = 0;
      let estimatedSuccesses = 0;
      const patternsMention = [];
      for (const m of matchedPatterns) {
        const cleanPatternName = m.pattern_name.replace(/\s+observed\s+\d+\s+events?/i, '');
        if (patternRecognitionService.inferCategoryFromPattern(cleanPatternName) === cat) {
          const occ = m.total_occurrences || 0;
          const sr = (m.success_rate || 0) / 100;
          totalCases += occ;
          estimatedSuccesses += Math.round(occ * sr);
          if (patternsMention.length < 2 && cleanPatternName) patternsMention.push(cleanPatternName);
        }
      }
      const rawLabel = String(cat || 'general').replace(/_/g, ' ');
      const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      const friendlyLikelihood = likelihood === 'high' ? 'high chance' : likelihood === 'moderate' ? 'moderate chance' : 'low chance';
      let context = `${label} – ${friendlyLikelihood}.`;
      if (totalCases > 0) {
        context += ` In the past, this Vedic configuration appeared ${totalCases} times and aligned with ${label.toLowerCase()} changes about ${estimatedSuccesses} times.`;
      }
      if (patternsMention.length) {
        context += ` Notable Vedic patterns now: ${patternsMention.join(' · ')}.`;
      }
      return { category: cat, likelihood, probability: Math.round(composite * 100), context, historical_counts: { successes: estimatedSuccesses, cases: totalCases }, patterns_mentioned: patternsMention };
    }).sort((a, b) => b.probability - a.probability);

    // 6) Optional timeline view: compute aspects 24h window (lightweight summary only)
    const timeline = {
      enabled: true,
      note: 'Vedic house drishti using whole-sign houses. Orbs shown are informational; labels come from house distances.',
      entries: (planetaryAspects || []).slice(0, 12).map(a => ({
        pair: `${a.planet1}–${a.planet2}`,
        aspect: a.aspect, // e.g., Seventh House Drishti
        orb: Number(a.orb),
        strength: a.strength,
        status: a.applying ? 'applying' : 'separating',
        window: a.applying && Number(a.orb) <= 5 ? 'Peaks likely within 24h' : 'Trend likely to diminish over 24h',
        fromHouse: a.fromHouse,
        toHouse: a.toHouse
      }))
    };

    // Rarity analysis removed as per requirements

    // Final report
    const report = {
      planetaryOverview: {
        requestInfo: { date, time, latitude: lat, longitude: lng, timezone: tz, julianDay },
        ascendant: { degree: ascendant.degreeInSign, sign: ascendant.sign, nakshatra: ascendant.nakshatra, formatted: ascendant.degreeFormatted },
        planets: planetsPayload,
        aspects: { planetaryAspects, houseAspects, strongestAspects }
      },
      activePatterns,
      historicalParallels,
      predictiveOutlook,
      timeline
    };

    // Rare alignment note removed

    return res.json({ success: true, data: report, event_id: eventId, persisted });
  } catch (error) {
    logger.error('Error generating planetary report:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error while generating report',
      details: error?.message
    });
  }
};

