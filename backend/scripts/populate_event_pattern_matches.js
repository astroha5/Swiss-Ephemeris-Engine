const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Populate the event_pattern_matches table by linking patterns to events
 */
async function populateEventPatternMatches() {
    try {
        logger.info('🔄 Starting to populate event_pattern_matches...');

        // Clear existing matches first
        const { error: clearError } = await supabase
            .from('event_pattern_matches')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            
        if (clearError) {
            logger.warn('Failed to clear existing matches:', clearError.message);
        } else {
            logger.info('✅ Cleared existing pattern matches');
        }

        // Fetch all events with planetary data
        const { data: events, error: eventsError } = await supabase
            .from('world_events')
            .select('id, title, event_date, category, impact_level, planetary_snapshot')
            .not('planetary_snapshot', 'is', null);

        if (eventsError) {
            throw new Error(`Failed to fetch events: ${eventsError.message}`);
        }

        // Fetch all patterns
        const { data: patterns, error: patternsError } = await supabase
            .from('astrological_patterns')
            .select('id, pattern_name, pattern_type, pattern_conditions');

        if (patternsError) {
            throw new Error(`Failed to fetch patterns: ${patternsError.message}`);
        }

        logger.info(`📊 Processing ${events.length} events against ${patterns.length} patterns...`);
        
        let totalMatches = 0;
        let processedEvents = 0;

        // Loop through events and find matches
        for (const event of events) {
            if (!event.planetary_snapshot || !event.planetary_snapshot.aspects) {
                logger.warn(`Skipping event ${event.title} - no planetary data`);
                continue;
            }
            
            let eventMatches = 0;
            
            for (const pattern of patterns) {
                try {
                    // Parse pattern conditions if it's a string
                    let conditions = pattern.pattern_conditions;
                    if (typeof conditions === 'string') {
                        conditions = JSON.parse(conditions);
                    }
                    
                    const match = checkPatternMatch(event.planetary_snapshot, conditions, pattern.pattern_type, event);

                    if (match) {
                        // Insert the match into event_pattern_matches
                        const { error } = await supabase
                            .from('event_pattern_matches')
                            .insert({
                                event_id: event.id,
                                pattern_id: pattern.id,
                                match_strength: match.strength,
                                exactness: match.exactness,
                                orb_applied: match.orb_applied,
                                match_details: match.details
                            });

                        if (error && !error.message.includes('duplicate')) {
                            logger.error(`Failed to insert match for event ${event.title} and pattern ${pattern.pattern_name}: ${error.message}`);
                        } else {
                            totalMatches++;
                            eventMatches++;
                        }
                    }
                } catch (patternError) {
                    logger.warn(`Error processing pattern ${pattern.pattern_name}:`, patternError.message);
                }
            }
            
            processedEvents++;
            if (eventMatches > 0) {
                logger.info(`   ${event.title}: ${eventMatches} pattern matches`);
            }
        }

        logger.info(`✅ Completed populating event_pattern_matches table.`);
        logger.info(`📈 Results: ${totalMatches} total matches across ${processedEvents} events`);
        
        // Update pattern statistics
        await updatePatternStatistics();
        
    } catch (error) {
        logger.error('❌ Error populating event_pattern_matches:', error.message);
        throw error;
    }
}

/**
 * Check if the event's planetary snapshot matches the pattern conditions
 * @param {Object} planetarySnapshot - The planetary data from the event
 * @param {Object} patternConditions - The pattern conditions to match
 * @param {string} patternType - The type of pattern (aspect, planetary, sign, etc.)
 * @param {Object} event - The event object for context
 * @returns {Object|false} - Returns match object or false if no match
 */
function checkPatternMatch(planetarySnapshot, patternConditions, patternType, event) {
    try {
        switch (patternType) {
            case 'aspect':
                return checkAspectPattern(planetarySnapshot, patternConditions);
            case 'planetary':
                return checkPlanetaryPattern(planetarySnapshot, patternConditions, event);
            case 'sign':
                return checkSignPattern(planetarySnapshot, patternConditions);
            case 'nakshatra':
                return checkNakshatraPattern(planetarySnapshot, patternConditions);
            case 'combined':
                return checkCombinedPattern(planetarySnapshot, patternConditions, event);
            default:
                logger.warn(`Unknown pattern type: ${patternType}`);
                return false;
        }
    } catch (error) {
        logger.warn(`Error in pattern matching:`, error.message);
        return false;
    }
}

/**
 * Check aspect patterns (conjunctions, oppositions, etc.)
 */
function checkAspectPattern(planetarySnapshot, conditions) {
    if (!conditions.aspect_type || !conditions.planets || conditions.planets.length < 2) {
        return false;
    }
    
    const aspectMatches = planetarySnapshot.aspects.filter(aspect => {
        const hasFromPlanet = conditions.planets.includes(aspect.fromPlanet);
        const hasToPlanet = conditions.planets.includes(aspect.toPlanet);
        const correctType = aspect.aspectType === conditions.aspect_type;
        
        return hasFromPlanet && hasToPlanet && correctType;
    });

    if (aspectMatches.length > 0) {
        const maxOrb = conditions.max_orb || conditions.orb || 5;
        const strength = calculateAspectStrength(aspectMatches[0], maxOrb);
        
        return {
            strength: strength,
            exactness: strength > 90,
            orb_applied: maxOrb,
            details: {
                matchedAspects: aspectMatches.map(aspect => aspect.description),
                aspectType: conditions.aspect_type,
                planetsInvolved: conditions.planets
            }
        };
    }
    
    return false;
}

/**
 * Check planetary patterns (planet in specific categories, etc.)
 */
function checkPlanetaryPattern(planetarySnapshot, conditions, event) {
    if (!conditions.planet) {
        return false;
    }
    
    // Check if event category matches pattern categories
    if (conditions.categories && conditions.categories.length > 0) {
        const categoryMatch = conditions.categories.includes(event.category);
        if (categoryMatch) {
            const planetData = planetarySnapshot[conditions.planet];
            if (planetData) {
                return {
                    strength: 85.0,
                    exactness: false,
                    orb_applied: 0,
                    details: {
                        planet: conditions.planet,
                        planetPosition: planetData,
                        matchedCategory: event.category,
                        eventImpact: event.impact_level
                    }
                };
            }
        }
    }
    
    return false;
}

/**
 * Check sign patterns (planet in specific sign)
 */
function checkSignPattern(planetarySnapshot, conditions) {
    if (!conditions.planet || !conditions.sign) {
        return false;
    }
    
    const planetData = planetarySnapshot[conditions.planet];
    if (planetData && typeof planetData === 'string') {
        const planetSign = planetData.split(' ')[0]; // Extract sign from "Aries 5.38°"
        if (planetSign.toLowerCase() === conditions.sign.toLowerCase()) {
            return {
                strength: 80.0,
                exactness: true,
                orb_applied: 0,
                details: {
                    planet: conditions.planet,
                    sign: conditions.sign,
                    planetPosition: planetData
                }
            };
        }
    }
    
    return false;
}

/**
 * Check nakshatra patterns
 */
function checkNakshatraPattern(planetarySnapshot, conditions) {
    if (!conditions.planet || !conditions.nakshatra) {
        return false;
    }
    
    // For moon nakshatra
    if (conditions.planet === 'moon' && planetarySnapshot.nakshatra) {
        if (planetarySnapshot.nakshatra.toLowerCase() === conditions.nakshatra.toLowerCase()) {
            return {
                strength: 90.0,
                exactness: true,
                orb_applied: 0,
                details: {
                    planet: 'moon',
                    nakshatra: conditions.nakshatra,
                    moonPosition: planetarySnapshot.moon
                }
            };
        }
    }
    
    return false;
}

/**
 * Check combined patterns (multiple conditions that must be met)
 */
function checkCombinedPattern(planetarySnapshot, conditions, event) {
    // For combined patterns, we'll check if multiple sub-conditions are met
    let totalStrength = 0;
    let matchedConditions = 0;
    let totalConditions = 0;
    const details = {
        subMatches: []
    };
    
    // Check for aspect-based conditions
    if (conditions.aspects && Array.isArray(conditions.aspects)) {
        for (const aspectCondition of conditions.aspects) {
            totalConditions++;
            const aspectMatch = checkAspectPattern(planetarySnapshot, aspectCondition);
            if (aspectMatch) {
                matchedConditions++;
                totalStrength += aspectMatch.strength;
                details.subMatches.push({
                    type: 'aspect',
                    match: aspectMatch
                });
            }
        }
    }
    
    // Check for planetary conditions
    if (conditions.planets && Array.isArray(conditions.planets)) {
        for (const planetCondition of conditions.planets) {
            totalConditions++;
            
            // Check if planet is in specific sign
            if (planetCondition.sign) {
                const signMatch = checkSignPattern(planetarySnapshot, planetCondition);
                if (signMatch) {
                    matchedConditions++;
                    totalStrength += signMatch.strength;
                    details.subMatches.push({
                        type: 'sign',
                        match: signMatch
                    });
                }
            }
        }
    }
    
    // Check category-based conditions
    if (conditions.categories && Array.isArray(conditions.categories)) {
        totalConditions++;
        if (conditions.categories.includes(event.category)) {
            matchedConditions++;
            totalStrength += 75.0;
            details.subMatches.push({
                type: 'category',
                match: {
                    category: event.category,
                    strength: 75.0
                }
            });
        }
    }
    
    // Determine overall match
    if (totalConditions === 0) {
        return false;
    }
    
    const matchRatio = matchedConditions / totalConditions;
    const threshold = conditions.threshold || 0.5; // Default: at least 50% of conditions must match
    
    if (matchRatio >= threshold) {
        const averageStrength = totalStrength / matchedConditions;
        return {
            strength: Math.min(averageStrength * matchRatio, 100), // Scale by match ratio
            exactness: matchRatio >= 0.8, // 80%+ match is considered exact
            orb_applied: 0,
            details: {
                ...details,
                matchedConditions,
                totalConditions,
                matchRatio: Math.round(matchRatio * 100) / 100
            }
        };
    }
    
    return false;
}

/**
 * Calculate aspect strength based on orb
 */
function calculateAspectStrength(aspect, maxOrb) {
    // For now, return a fixed strength since we don't have orb data in aspects
    // In a real implementation, you'd calculate based on actual planetary degrees
    return 85.0; // Placeholder
}

/**
 * Update statistics in astrological_patterns table
 */
async function updatePatternStatistics() {
    try {
        logger.info('📊 Updating pattern statistics...');
        
        const { data: patterns, error } = await supabase
            .from('astrological_patterns')
            .select('id, pattern_name');
            
        if (error) {
            throw new Error(`Failed to fetch patterns: ${error.message}`);
        }
        
        for (const pattern of patterns) {
            // Count total occurrences
            const { count: totalCount, error: countError } = await supabase
                .from('event_pattern_matches')
                .select('*', { count: 'exact', head: true })
                .eq('pattern_id', pattern.id);
                
            // Count high impact occurrences
            const { count: highImpactCount, error: hiCountError } = await supabase
                .from('events_with_pattern_matches')
                .select('*', { count: 'exact', head: true })
                .eq('pattern_id', pattern.id)
                .in('impact_level', ['high', 'extreme']);
                
            if (!countError && !hiCountError) {
                const successRate = totalCount > 0 ? (highImpactCount / totalCount * 100) : 0;
                
                const { error: updateError } = await supabase
                    .from('astrological_patterns')
                    .update({
                        total_occurrences: totalCount || 0,
                        high_impact_occurrences: highImpactCount || 0,
                        success_rate: Math.round(successRate * 100) / 100 // Round to 2 decimal places
                    })
                    .eq('id', pattern.id);
                    
                if (updateError) {
                    logger.warn(`Failed to update statistics for ${pattern.pattern_name}:`, updateError.message);
                } else {
                    logger.info(`   ${pattern.pattern_name}: ${totalCount} total, ${highImpactCount} high-impact (${successRate.toFixed(1)}% success)`);
                }
            }
        }
        
        logger.info('✅ Pattern statistics updated successfully');
        
    } catch (error) {
        logger.error('❌ Failed to update pattern statistics:', error.message);
    }
}

// Run the script if called directly
if (require.main === module) {
    populateEventPatternMatches()
        .then(() => {
            logger.info('🎉 Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('💥 Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    populateEventPatternMatches,
    checkPatternMatch,
    updatePatternStatistics
};
