const { supabase } = require('../config/supabase');
const enhancedSwissEphemeris = require('./enhancedSwissEphemeris');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

/**
 * Major Planetary Pattern Detector Service
 * Detects the specific patterns outlined for Astrova correlation analysis:
 * 
 * 1. Outer Planet Conjunctions (Saturn+Pluto ~33yr, Jupiter+Saturn ~20yr, etc.)
 * 2. Key Planetary Aspects (especially tense ones)
 * 3. Eclipses (Solar & Lunar)
 * 4. Retrogrades (Mars, Venus, Jupiter/Saturn)
 * 5. Ingress into Cardinal Signs
 * 6. Nakshatra-Based patterns (Gandanta, Kala Sarpa, Saturn in Rohini)
 */
class MajorPatternDetectorService {
  constructor() {
    // Outer planet conjunctions with their cycles and significance
    this.outerPlanetConjunctions = {
      'saturn-pluto': {
        cycle: 33,
        keywords: ['endings', 'death-rebirth', 'wars', 'pandemics', 'authoritarianism', 'transformation'],
        significance: 'extreme',
        orb: 5, // degrees
        examples: ['2020 COVID pandemic', '1982 recession', '1947 partition of India']
      },
      'jupiter-saturn': {
        cycle: 20,
        keywords: ['new socio-economic cycles', 'political cycles', 'global trends'],
        significance: 'high',
        orb: 5,
        examples: ['2020 great conjunction', '2000 dot-com era', '1980 conservative shift']
      },
      'jupiter-pluto': {
        cycle: 13,
        keywords: ['economic power shifts', 'rise of ideologies', 'expansion of control'],
        significance: 'high',
        orb: 4,
        examples: ['2020 economic transformation', '2007 financial bubbles']
      },
      'uranus-pluto': {
        cycle: 111,
        keywords: ['revolutionary movements', 'breakdown of old systems'],
        significance: 'extreme',
        orb: 6,
        examples: ['1960s revolutionary era', '1850s industrial transformation']
      },
      'saturn-uranus': {
        cycle: 45,
        keywords: ['tradition vs progress', 'rebellion', 'reform'],
        significance: 'high',
        orb: 5,
        examples: ['2021 social unrest', '1976 political upheavals']
      },
      'neptune-pluto': {
        cycle: 492,
        keywords: ['massive civilizational transformation', 'spiritual shifts'],
        significance: 'extreme',
        orb: 8,
        examples: ['1891-1892 sextile lasting centuries']
      }
    };

    // Key aspect patterns for major events
    this.majorAspectPatterns = {
      'mars-saturn': {
        aspects: ['conjunction', 'opposition', 'square'],
        keywords: ['war', 'repression', 'accidents', 'delays', 'frustration'],
        orb: 3,
        significance: 'high'
      },
      'saturn-uranus': {
        aspects: ['conjunction', 'opposition', 'square'],
        keywords: ['civil unrest', 'rebellion', 'sudden restrictions'],
        orb: 4,
        significance: 'high'
      },
      'jupiter-neptune': {
        aspects: ['conjunction', 'opposition', 'square'],
        keywords: ['idealism', 'inflation', 'deception', 'mass movements'],
        orb: 4,
        significance: 'medium'
      },
      'mars-rahu': {
        aspects: ['conjunction', 'opposition', 'square'],
        keywords: ['violence', 'impulsiveness', 'riots', 'accidents'],
        orb: 3,
        significance: 'high'
      }
    };

    // Critical degrees and Gandanta points
    this.criticalDegrees = {
      gandanta: [
        { sign: 'Cancer', degrees: [29, 30] }, // Cancer-Leo junction
        { sign: 'Leo', degrees: [0, 1] },
        { sign: 'Scorpio', degrees: [29, 30] }, // Scorpio-Sagittarius junction
        { sign: 'Sagittarius', degrees: [0, 1] },
        { sign: 'Pisces', degrees: [29, 30] }, // Pisces-Aries junction
        { sign: 'Aries', degrees: [0, 1] }
      ],
      anaretic: 29, // 29th degree of any sign
      critical: [0, 13, 26] // Traditional critical degrees
    };

    // Significant nakshatras for different patterns
    this.significantNakshatras = {
      rohini: { name: 'Rohini', range: [40, 53.33], significance: 'Saturn here brings famine/wars' },
      bharani: { name: 'Bharani', range: [13.33, 26.67], significance: 'Regime changes' },
      ardra: { name: 'Ardra', range: [66.67, 80], significance: 'Storms, upheavals' },
      ashlesha: { name: 'Ashlesha', range: [110, 120], significance: 'Deception, hidden enemies' },
      magha: { name: 'Magha', range: [120, 133.33], significance: 'Royal power, authority' },
      moola: { name: 'Moola', range: [240, 253.33], significance: 'Destruction, root changes' }
    };

    // Cardinal signs for ingress detection
    this.cardinalSigns = ['Aries', 'Cancer', 'Libra', 'Capricorn'];
  }

  /**
   * Main method to detect all major patterns for a given date range
   * @param {Date} startDate - Start date for pattern detection
   * @param {Date} endDate - End date for pattern detection
   * @param {Object} options - Detection options
   * @returns {Object} Comprehensive pattern analysis
   */
  async detectMajorPatterns(startDate, endDate, options = {}) {
    try {
      logger.info(`🔍 Detecting major planetary patterns from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const patterns = {
        outerPlanetConjunctions: await this.detectOuterPlanetConjunctions(startDate, endDate),
        majorAspects: await this.detectMajorAspects(startDate, endDate),
        eclipses: await this.calculateEclipses(startDate, endDate),
        retrogrades: await this.detectRetrogrades(startDate, endDate),
        cardinalIngresses: await this.detectCardinalIngresses(startDate, endDate),
        kalaSarpaYoga: await this.detectKalaSarpaYoga(startDate, endDate),
        gandantaTransits: await this.detectGandantaTransits(startDate, endDate),
        criticalDegreeTransits: await this.detectCriticalDegreeTransits(startDate, endDate),
        summary: {
          totalPatterns: 0,
          highSignificancePatterns: 0,
          detectionPeriod: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            daysAnalyzed: moment(endDate).diff(moment(startDate), 'days')
          }
        }
      };

      // Calculate summary statistics
      this.calculatePatternSummary(patterns);

      logger.info(`✅ Pattern detection completed. Found ${patterns.summary.totalPatterns} patterns, ${patterns.summary.highSignificancePatterns} high significance`);
      
      return patterns;

    } catch (error) {
      logger.error('Error in major pattern detection:', error);
      throw error;
    }
  }

  /**
   * Detect outer planet conjunctions
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @returns {Array} Detected outer planet conjunctions
   */
  async detectOuterPlanetConjunctions(startDate, endDate) {
    const conjunctions = [];
    let currentDate = moment(startDate);
    const finalDate = moment(endDate);

    // Check every week for outer planet positions
    while (currentDate.isBefore(finalDate)) {
      try {
        const julianDay = enhancedSwissEphemeris.getJulianDay(
          currentDate.format('YYYY-MM-DD'),
          '12:00',
          'UTC'
        );

        const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);

        // Check each conjunction type
        for (const [conjunctionType, config] of Object.entries(this.outerPlanetConjunctions)) {
          const [planet1, planet2] = conjunctionType.split('-');
          
          const pos1 = positions.planets[planet1];
          const pos2 = positions.planets[planet2];

          if (pos1 && pos2) {
            const angularDistance = this.calculateAngularDistance(pos1.longitude, pos2.longitude);
            
            if (angularDistance <= config.orb) {
              conjunctions.push({
                date: currentDate.format('YYYY-MM-DD'),
                type: 'outer-planet-conjunction',
                planets: [planet1, planet2],
                conjunction: conjunctionType,
                orb: angularDistance,
                significance: config.significance,
                keywords: config.keywords,
                cycle: config.cycle,
                positions: {
                  [planet1]: {
                    longitude: pos1.longitude,
                    sign: pos1.sign,
                    degree: pos1.degreeInSign,
                    nakshatra: pos1.nakshatra
                  },
                  [planet2]: {
                    longitude: pos2.longitude,
                    sign: pos2.sign,
                    degree: pos2.degreeInSign,
                    nakshatra: pos2.nakshatra
                  }
                },
                historicalContext: config.examples,
                isExact: angularDistance <= 1
              });

              logger.info(`🎯 Found ${conjunctionType} conjunction on ${currentDate.format('YYYY-MM-DD')} (orb: ${angularDistance.toFixed(2)}°)`);
            }
          }
        }

        currentDate.add(7, 'days'); // Check weekly
      } catch (error) {
        logger.error(`Error checking conjunctions for ${currentDate.format('YYYY-MM-DD')}:`, error);
        currentDate.add(7, 'days');
      }
    }

    return conjunctions;
  }

  /**
   * Detect major planetary aspects
   */
  async detectMajorAspects(startDate, endDate) {
    const aspects = [];
    let currentDate = moment(startDate);
    const finalDate = moment(endDate);

    // Check every 3 days for aspect formations
    while (currentDate.isBefore(finalDate)) {
      try {
        const julianDay = enhancedSwissEphemeris.getJulianDay(
          currentDate.format('YYYY-MM-DD'),
          '12:00',
          'UTC'
        );

        const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);

        // Check each major aspect pattern
        for (const [aspectPattern, config] of Object.entries(this.majorAspectPatterns)) {
          const [planet1, planet2] = aspectPattern.split('-');
          
          const pos1 = positions.planets[planet1];
          const pos2 = positions.planets[planet2];

          if (pos1 && pos2) {
            for (const aspectType of config.aspects) {
              const aspect = this.calculateAspect(pos1.longitude, pos2.longitude, aspectType);
              
              if (aspect && aspect.orb <= config.orb) {
                aspects.push({
                  date: currentDate.format('YYYY-MM-DD'),
                  type: 'major-aspect',
                  planets: [planet1, planet2],
                  aspectType: aspectType,
                  orb: aspect.orb,
                  significance: config.significance,
                  keywords: config.keywords,
                  positions: {
                    [planet1]: {
                      longitude: pos1.longitude,
                      sign: pos1.sign,
                      degree: pos1.degreeInSign,
                      nakshatra: pos1.nakshatra,
                      isRetrograde: pos1.isRetrograde
                    },
                    [planet2]: {
                      longitude: pos2.longitude,
                      sign: pos2.sign,
                      degree: pos2.degreeInSign,
                      nakshatra: pos2.nakshatra,
                      isRetrograde: pos2.isRetrograde
                    }
                  },
                  isExact: aspect.orb <= 1,
                  isApplying: aspect.isApplying
                });

                logger.info(`⚡ Found ${planet1}-${planet2} ${aspectType} on ${currentDate.format('YYYY-MM-DD')} (orb: ${aspect.orb.toFixed(2)}°)`);
              }
            }
          }
        }

        currentDate.add(3, 'days'); // Check every 3 days
      } catch (error) {
        logger.error(`Error checking aspects for ${currentDate.format('YYYY-MM-DD')}:`, error);
        currentDate.add(3, 'days');
      }
    }

    return aspects;
  }

  /**
   * Calculate eclipses (simplified version - real implementation would use more complex eclipse algorithms)
   */
  async calculateEclipses(startDate, endDate) {
    const eclipses = [];
    let currentDate = moment(startDate);
    const finalDate = moment(endDate);

    // Check for lunar eclipses (Full Moon near lunar nodes)
    // Check for solar eclipses (New Moon near lunar nodes)
    while (currentDate.isBefore(finalDate)) {
      try {
        const julianDay = enhancedSwissEphemeris.getJulianDay(
          currentDate.format('YYYY-MM-DD'),
          '12:00',
          'UTC'
        );

        const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
        const sun = positions.planets.sun;
        const moon = positions.planets.moon;
        const rahu = positions.planets.rahu;

        if (sun && moon && rahu) {
          // Check for lunar eclipse (opposition of Sun-Moon near nodes)
          const sunMoonDistance = this.calculateAngularDistance(sun.longitude, moon.longitude);
          const moonRahuDistance = this.calculateAngularDistance(moon.longitude, rahu.longitude);

          if (sunMoonDistance > 170 && sunMoonDistance < 190 && moonRahuDistance < 15) {
            eclipses.push({
              date: currentDate.format('YYYY-MM-DD'),
              type: 'lunar-eclipse',
              eclipseType: 'total', // Simplified
              visibility: 'global', // Simplified
              significance: 'high',
              moonSign: moon.sign,
              sunSign: sun.sign,
              nearNode: moonRahuDistance < 8 ? 'rahu' : 'close-to-rahu',
              keywords: ['endings', 'revelations', 'emotional climax', 'completion'],
              positions: {
                sun: { longitude: sun.longitude, sign: sun.sign, degree: sun.degreeInSign },
                moon: { longitude: moon.longitude, sign: moon.sign, degree: moon.degreeInSign },
                rahu: { longitude: rahu.longitude, sign: rahu.sign, degree: rahu.degreeInSign }
              }
            });

            logger.info(`🌙 Found lunar eclipse on ${currentDate.format('YYYY-MM-DD')} in ${moon.sign}`);
          }

          // Check for solar eclipse (conjunction of Sun-Moon near nodes)
          if (sunMoonDistance < 10 && moonRahuDistance < 15) {
            eclipses.push({
              date: currentDate.format('YYYY-MM-DD'),
              type: 'solar-eclipse',
              eclipseType: 'total', // Simplified
              visibility: 'regional', // Simplified
              significance: 'high',
              sign: sun.sign, // Eclipse sign
              nearNode: moonRahuDistance < 8 ? 'rahu' : 'close-to-rahu',
              keywords: ['new beginnings', 'hidden revelations', 'leadership changes', 'fresh starts'],
              positions: {
                sun: { longitude: sun.longitude, sign: sun.sign, degree: sun.degreeInSign },
                moon: { longitude: moon.longitude, sign: moon.sign, degree: moon.degreeInSign },
                rahu: { longitude: rahu.longitude, sign: rahu.sign, degree: rahu.degreeInSign }
              }
            });

            logger.info(`☀️ Found solar eclipse on ${currentDate.format('YYYY-MM-DD')} in ${sun.sign}`);
          }
        }

        currentDate.add(1, 'day'); // Check daily for eclipses
      } catch (error) {
        logger.error(`Error checking eclipses for ${currentDate.format('YYYY-MM-DD')}:`, error);
        currentDate.add(1, 'day');
      }
    }

    return eclipses;
  }

  /**
   * Detect retrograde periods
   */
  async detectRetrogrades(startDate, endDate) {
    const retrogrades = [];
    const planetsToCheck = ['mars', 'venus', 'mercury', 'jupiter', 'saturn'];
    
    for (const planet of planetsToCheck) {
      let currentDate = moment(startDate);
      let lastRetrogradeStat = null;

      while (currentDate.isBefore(moment(endDate))) {
        try {
          const julianDay = enhancedSwissEphemeris.getJulianDay(
            currentDate.format('YYYY-MM-DD'),
            '12:00',
            'UTC'
          );

          const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
          const planetData = positions.planets[planet];

          if (planetData) {
            const isRetrograde = planetData.isRetrograde;
            
            // Detect retrograde station (start/end)
            if (lastRetrogradeStat !== null && lastRetrogradeStat !== isRetrograde) {
              const stationType = isRetrograde ? 'retrograde-start' : 'retrograde-end';
              const significance = this.getRetrogradeSignificance(planet, stationType);

              retrogrades.push({
                date: currentDate.format('YYYY-MM-DD'),
                type: 'retrograde-station',
                planet: planet,
                stationType: stationType,
                significance: significance.level,
                keywords: significance.keywords,
                position: {
                  longitude: planetData.longitude,
                  sign: planetData.sign,
                  degree: planetData.degreeInSign,
                  nakshatra: planetData.nakshatra
                },
                duration: significance.averageDuration
              });

              logger.info(`🔄 ${planet} ${stationType} on ${currentDate.format('YYYY-MM-DD')} in ${planetData.sign}`);
            }

            lastRetrogradeStat = isRetrograde;
          }

          currentDate.add(1, 'day');
        } catch (error) {
          logger.error(`Error checking ${planet} retrograde for ${currentDate.format('YYYY-MM-DD')}:`, error);
          currentDate.add(1, 'day');
        }
      }
    }

    return retrogrades;
  }

  /**
   * Detect ingresses into cardinal signs
   */
  async detectCardinalIngresses(startDate, endDate) {
    const ingresses = [];
    const planetsToCheck = ['jupiter', 'saturn', 'mars', 'venus'];
    
    for (const planet of planetsToCheck) {
      let currentDate = moment(startDate);
      let lastSign = null;

      while (currentDate.isBefore(moment(endDate))) {
        try {
          const julianDay = enhancedSwissEphemeris.getJulianDay(
            currentDate.format('YYYY-MM-DD'),
            '12:00',
            'UTC'
          );

          const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
          const planetData = positions.planets[planet];

          if (planetData) {
            const currentSign = planetData.sign;
            
            // Check for sign change into cardinal sign
            if (lastSign && lastSign !== currentSign && this.cardinalSigns.includes(currentSign)) {
              const significance = this.getIngressSignificance(planet, currentSign);

              ingresses.push({
                date: currentDate.format('YYYY-MM-DD'),
                type: 'cardinal-ingress',
                planet: planet,
                fromSign: lastSign,
                toSign: currentSign,
                significance: significance.level,
                keywords: significance.keywords,
                position: {
                  longitude: planetData.longitude,
                  sign: currentSign,
                  degree: planetData.degreeInSign,
                  nakshatra: planetData.nakshatra
                },
                duration: significance.averageDuration,
                historicalContext: significance.examples
              });

              logger.info(`🚪 ${planet} ingress into ${currentSign} on ${currentDate.format('YYYY-MM-DD')}`);
            }

            lastSign = currentSign;
          }

          // Check weekly for slower planets, daily for faster ones
          const increment = ['jupiter', 'saturn'].includes(planet) ? 7 : 1;
          currentDate.add(increment, 'days');
        } catch (error) {
          logger.error(`Error checking ${planet} ingress for ${currentDate.format('YYYY-MM-DD')}:`, error);
          currentDate.add(1, 'day');
        }
      }
    }

    return ingresses;
  }

  /**
   * Detect Kala Sarpa Yoga (all planets between Rahu-Ketu axis)
   */
  async detectKalaSarpaYoga(startDate, endDate) {
    const kalaSarpaPatterns = [];
    let currentDate = moment(startDate);
    const finalDate = moment(endDate);

    // Check every week
    while (currentDate.isBefore(finalDate)) {
      try {
        const julianDay = enhancedSwissEphemeris.getJulianDay(
          currentDate.format('YYYY-MM-DD'),
          '12:00',
          'UTC'
        );

        const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
        const rahu = positions.planets.rahu;
        const ketu = positions.planets.ketu;

        if (rahu && ketu) {
          const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
          let planetsBetweenNodes = 0;
          let planetsOutsideNodes = 0;

          for (const planet of planets) {
            const planetData = positions.planets[planet];
            if (planetData) {
              const isBetweenNodes = this.isPlanetBetweenNodes(
                planetData.longitude, 
                rahu.longitude, 
                ketu.longitude
              );

              if (isBetweenNodes) {
                planetsBetweenNodes++;
              } else {
                planetsOutsideNodes++;
              }
            }
          }

          // Kala Sarpa Yoga when all 7 planets are on one side of Rahu-Ketu axis
          if (planetsBetweenNodes === 7 || planetsOutsideNodes === 7) {
            kalaSarpaPatterns.push({
              date: currentDate.format('YYYY-MM-DD'),
              type: 'kala-sarpa-yoga',
              variant: planetsBetweenNodes === 7 ? 'classic' : 'reverse',
              significance: 'high',
              keywords: ['instability', 'polarity', 'karmic intensity', 'collective challenges'],
              nodePositions: {
                rahu: { longitude: rahu.longitude, sign: rahu.sign, degree: rahu.degreeInSign },
                ketu: { longitude: ketu.longitude, sign: ketu.sign, degree: ketu.degreeInSign }
              },
              planetDistribution: {
                betweenNodes: planetsBetweenNodes,
                outsideNodes: planetsOutsideNodes
              }
            });

            logger.info(`🐍 Kala Sarpa Yoga detected on ${currentDate.format('YYYY-MM-DD')} (${planetsBetweenNodes === 7 ? 'classic' : 'reverse'})`);
          }
        }

        currentDate.add(7, 'days'); // Check weekly
      } catch (error) {
        logger.error(`Error checking Kala Sarpa Yoga for ${currentDate.format('YYYY-MM-DD')}:`, error);
        currentDate.add(7, 'days');
      }
    }

    return kalaSarpaPatterns;
  }

  /**
   * Detect Gandanta transits (planets at fire-water junctions)
   */
  async detectGandantaTransits(startDate, endDate) {
    const gandantaTransits = [];
    const planetsToCheck = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
    
    for (const planet of planetsToCheck) {
      let currentDate = moment(startDate);

      while (currentDate.isBefore(moment(endDate))) {
        try {
          const julianDay = enhancedSwissEphemeris.getJulianDay(
            currentDate.format('YYYY-MM-DD'),
            '12:00',
            'UTC'
          );

          const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
          const planetData = positions.planets[planet];

          if (planetData) {
            const isGandanta = this.isGandantaDegree(planetData.sign, planetData.degreeInSign);
            
            if (isGandanta) {
              gandantaTransits.push({
                date: currentDate.format('YYYY-MM-DD'),
                type: 'gandanta-transit',
                planet: planet,
                significance: 'high',
                keywords: ['karmic unraveling', 'transformation', 'challenges', 'spiritual growth'],
                position: {
                  longitude: planetData.longitude,
                  sign: planetData.sign,
                  degree: planetData.degreeInSign,
                  nakshatra: planetData.nakshatra
                },
                gandantaType: isGandanta.type,
                junction: isGandanta.junction
              });

              logger.info(`🔥💧 ${planet} in Gandanta on ${currentDate.format('YYYY-MM-DD')} at ${planetData.sign} ${planetData.degreeInSign.toFixed(2)}°`);
            }
          }

          // Check daily for fast planets, weekly for slow ones
          const increment = ['jupiter', 'saturn'].includes(planet) ? 7 : 1;
          currentDate.add(increment, 'days');
        } catch (error) {
          logger.error(`Error checking ${planet} Gandanta for ${currentDate.format('YYYY-MM-DD')}:`, error);
          currentDate.add(1, 'day');
        }
      }
    }

    return gandantaTransits;
  }

  /**
   * Detect critical degree transits
   */
  async detectCriticalDegreeTransits(startDate, endDate) {
    const criticalTransits = [];
    const planetsToCheck = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
    
    for (const planet of planetsToCheck) {
      let currentDate = moment(startDate);

      while (currentDate.isBefore(moment(endDate))) {
        try {
          const julianDay = enhancedSwissEphemeris.getJulianDay(
            currentDate.format('YYYY-MM-DD'),
            '12:00',
            'UTC'
          );

          const positions = enhancedSwissEphemeris.getPlanetaryPositions(julianDay);
          const planetData = positions.planets[planet];

          if (planetData) {
            const criticalInfo = this.isCriticalDegree(planetData.degreeInSign);
            
            if (criticalInfo) {
              criticalTransits.push({
                date: currentDate.format('YYYY-MM-DD'),
                type: 'critical-degree-transit',
                planet: planet,
                significance: criticalInfo.significance,
                keywords: criticalInfo.keywords,
                position: {
                  longitude: planetData.longitude,
                  sign: planetData.sign,
                  degree: planetData.degreeInSign,
                  nakshatra: planetData.nakshatra
                },
                criticalType: criticalInfo.type,
                description: criticalInfo.description
              });

              logger.info(`🎯 ${planet} at critical degree on ${currentDate.format('YYYY-MM-DD')} - ${criticalInfo.type}`);
            }
          }

          // Check daily for all planets for critical degrees
          currentDate.add(1, 'day');
        } catch (error) {
          logger.error(`Error checking ${planet} critical degree for ${currentDate.format('YYYY-MM-DD')}:`, error);
          currentDate.add(1, 'day');
        }
      }
    }

    return criticalTransits;
  }

  // Helper methods

  /**
   * Calculate angular distance between two longitudes
   */
  calculateAngularDistance(lon1, lon2) {
    let distance = Math.abs(lon1 - lon2);
    if (distance > 180) {
      distance = 360 - distance;
    }
    return distance;
  }

  /**
   * Calculate specific aspect between two planets
   */
  calculateAspect(lon1, lon2, aspectType) {
    const aspectDegrees = {
      'conjunction': 0,
      'opposition': 180,
      'trine': 120,
      'square': 90,
      'sextile': 60
    };

    const targetAngle = aspectDegrees[aspectType];
    if (targetAngle === undefined) return null;

    const actualAngle = this.calculateAngularDistance(lon1, lon2);
    const orb = Math.abs(actualAngle - targetAngle);
    
    if (aspectType === 'opposition' && actualAngle > 180) {
      return { orb: Math.abs(360 - actualAngle - targetAngle), isApplying: false };
    }

    return {
      orb: orb,
      isApplying: false // Simplified - would need speed calculation for proper determination
    };
  }

  /**
   * Check if planet is between Rahu-Ketu axis
   */
  isPlanetBetweenNodes(planetLon, rahuLon, ketuLon) {
    // Ketu is opposite to Rahu
    let ketuLon_calc = rahuLon + 180;
    if (ketuLon_calc >= 360) ketuLon_calc -= 360;

    // Check if planet is in the hemisphere from Rahu to Ketu
    if (rahuLon < ketuLon_calc) {
      return planetLon >= rahuLon && planetLon <= ketuLon_calc;
    } else {
      return planetLon >= rahuLon || planetLon <= ketuLon_calc;
    }
  }

  /**
   * Check if position is in Gandanta
   */
  isGandantaDegree(sign, degree) {
    const gandantaRanges = {
      'Cancer': { min: 29, max: 30, junction: 'Cancer-Leo', type: 'water-fire' },
      'Leo': { min: 0, max: 1, junction: 'Cancer-Leo', type: 'water-fire' },
      'Scorpio': { min: 29, max: 30, junction: 'Scorpio-Sagittarius', type: 'water-fire' },
      'Sagittarius': { min: 0, max: 1, junction: 'Scorpio-Sagittarius', type: 'water-fire' },
      'Pisces': { min: 29, max: 30, junction: 'Pisces-Aries', type: 'water-fire' },
      'Aries': { min: 0, max: 1, junction: 'Pisces-Aries', type: 'water-fire' }
    };

    const range = gandantaRanges[sign];
    if (range && degree >= range.min && degree <= range.max) {
      return {
        type: range.type,
        junction: range.junction
      };
    }
    return null;
  }

  /**
   * Check if degree is critical
   */
  isCriticalDegree(degree) {
    const roundedDegree = Math.round(degree);

    if (roundedDegree === 0) {
      return {
        type: 'zero-degree',
        significance: 'high',
        keywords: ['new beginnings', 'fresh energy', 'initiation'],
        description: 'Zero degree - pure sign energy'
      };
    }

    if (roundedDegree === 29) {
      return {
        type: 'anaretic',
        significance: 'high',
        keywords: ['completion', 'crisis', 'urgent action', 'endings'],
        description: '29th degree - crisis and completion'
      };
    }

    if ([13, 26].includes(roundedDegree)) {
      return {
        type: 'traditional-critical',
        significance: 'medium',
        keywords: ['intensity', 'turning point', 'challenges'],
        description: 'Traditional critical degree'
      };
    }

    return null;
  }

  /**
   * Get retrograde significance
   */
  getRetrogradeSignificance(planet, stationType) {
    const retrogradeData = {
      'mars': {
        keywords: ['delayed action', 'internal anger', 'strategy revision', 'conflicts'],
        level: 'high',
        averageDuration: '60-80 days'
      },
      'venus': {
        keywords: ['relationship review', 'value reassessment', 'artistic blocks', 'financial delays'],
        level: 'medium',
        averageDuration: '40-45 days'
      },
      'mercury': {
        keywords: ['communication issues', 'technology problems', 'travel delays', 'miscommunication'],
        level: 'medium',
        averageDuration: '20-24 days'
      },
      'jupiter': {
        keywords: ['wisdom internalization', 'belief questioning', 'growth delays', 'legal issues'],
        level: 'high',
        averageDuration: '120 days'
      },
      'saturn': {
        keywords: ['karmic review', 'structural problems', 'authority issues', 'delayed progress'],
        level: 'high',
        averageDuration: '140 days'
      }
    };

    return retrogradeData[planet] || { keywords: [], level: 'low', averageDuration: 'unknown' };
  }

  /**
   * Get ingress significance
   */
  getIngressSignificance(planet, sign) {
    const ingressData = {
      'jupiter': {
        'Aries': { level: 'high', keywords: ['expansion', 'leadership', 'new ventures'], averageDuration: '1 year', examples: ['2023 fresh starts'] },
        'Cancer': { level: 'high', keywords: ['emotional growth', 'nurturing', 'family focus'], averageDuration: '1 year', examples: ['2013-2014 family values'] },
        'Libra': { level: 'high', keywords: ['justice', 'partnerships', 'balance'], averageDuration: '1 year', examples: ['2016-2017 relationship focus'] },
        'Capricorn': { level: 'high', keywords: ['authority', 'structure', 'achievement'], averageDuration: '1 year', examples: ['2019-2020 institutional changes'] }
      },
      'saturn': {
        'Aries': { level: 'extreme', keywords: ['leadership tests', 'pioneering challenges', 'authority conflicts'], averageDuration: '2.5 years', examples: ['1996-1999 individual responsibility'] },
        'Cancer': { level: 'extreme', keywords: ['family restrictions', 'emotional maturity', 'home challenges'], averageDuration: '2.5 years', examples: ['2003-2005 security issues'] },
        'Libra': { level: 'extreme', keywords: ['relationship tests', 'justice issues', 'partnership challenges'], averageDuration: '2.5 years', examples: ['2009-2012 economic balance'] },
        'Capricorn': { level: 'extreme', keywords: ['authority restructure', 'institutional changes', 'career challenges'], averageDuration: '2.5 years', examples: ['2017-2020 structural transformation'] }
      }
    };

    return ingressData[planet]?.[sign] || { level: 'medium', keywords: [], averageDuration: 'varies', examples: [] };
  }

  /**
   * Calculate pattern summary statistics
   */
  calculatePatternSummary(patterns) {
    let totalPatterns = 0;
    let highSignificancePatterns = 0;

    for (const [key, patternArray] of Object.entries(patterns)) {
      if (key === 'summary') continue;
      if (Array.isArray(patternArray)) {
        totalPatterns += patternArray.length;
        highSignificancePatterns += patternArray.filter(p => 
          p.significance === 'high' || p.significance === 'extreme'
        ).length;
      }
    }

    patterns.summary.totalPatterns = totalPatterns;
    patterns.summary.highSignificancePatterns = highSignificancePatterns;
    patterns.summary.patternBreakdown = {
      outerPlanetConjunctions: patterns.outerPlanetConjunctions.length,
      majorAspects: patterns.majorAspects.length,
      eclipses: patterns.eclipses.length,
      retrogrades: patterns.retrogrades.length,
      cardinalIngresses: patterns.cardinalIngresses.length,
      kalaSarpaYoga: patterns.kalaSarpaYoga.length,
      gandantaTransits: patterns.gandantaTransits.length,
      criticalDegreeTransits: patterns.criticalDegreeTransits.length
    };
  }

  /**
   * Store detected patterns in database
   */
  async storeDetectedPatterns(patterns, eventContext = null) {
    try {
      const storedPatterns = [];

      for (const [patternType, patternArray] of Object.entries(patterns)) {
        if (patternType === 'summary' || !Array.isArray(patternArray)) continue;

        for (const pattern of patternArray) {
          const patternRecord = {
            pattern_name: `${pattern.type}_${pattern.date}`,
            description: this.generatePatternDescription(pattern),
            pattern_type: 'combined',
            pattern_conditions: {
              type: pattern.type,
              date: pattern.date,
              significance: pattern.significance,
              keywords: pattern.keywords,
              details: pattern
            },
            total_occurrences: 1,
            success_rate: null, // To be calculated after correlation analysis
            created_at: new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('astrological_patterns')
            .insert([patternRecord])
            .select()
            .single();

          if (error) {
            logger.error('Error storing pattern:', error);
          } else {
            storedPatterns.push(data);
          }
        }
      }

      logger.info(`✅ Stored ${storedPatterns.length} patterns in database`);
      return storedPatterns;

    } catch (error) {
      logger.error('Error storing detected patterns:', error);
      throw error;
    }
  }

  /**
   * Generate human-readable pattern description
   */
  generatePatternDescription(pattern) {
    switch (pattern.type) {
      case 'outer-planet-conjunction':
        return `${pattern.planets.join('-')} conjunction with ${pattern.orb.toFixed(2)}° orb. Historically associated with ${pattern.keywords.slice(0, 3).join(', ')}.`;
      
      case 'major-aspect':
        return `${pattern.planets.join('-')} ${pattern.aspectType} with ${pattern.orb.toFixed(2)}° orb. Keywords: ${pattern.keywords.slice(0, 3).join(', ')}.`;
      
      case 'lunar-eclipse':
        return `Lunar eclipse in ${pattern.moonSign} near ${pattern.nearNode}. Keywords: ${pattern.keywords.slice(0, 3).join(', ')}.`;
      
      case 'solar-eclipse':
        return `Solar eclipse in ${pattern.sign} near ${pattern.nearNode}. Keywords: ${pattern.keywords.slice(0, 3).join(', ')}.`;
      
      case 'retrograde-station':
        return `${pattern.planet} ${pattern.stationType} in ${pattern.position.sign}. Duration: ${pattern.duration}.`;
      
      case 'cardinal-ingress':
        return `${pattern.planet} ingress from ${pattern.fromSign} to ${pattern.toSign}. Duration: ${pattern.duration}.`;
      
      case 'kala-sarpa-yoga':
        return `Kala Sarpa Yoga (${pattern.variant}) - all planets ${pattern.variant === 'classic' ? 'between' : 'outside'} Rahu-Ketu axis.`;
      
      case 'gandanta-transit':
        return `${pattern.planet} in Gandanta at ${pattern.junction}. Karmic transformation period.`;
      
      case 'critical-degree-transit':
        return `${pattern.planet} at ${pattern.criticalType} (${pattern.position.degree.toFixed(2)}° ${pattern.position.sign}).`;
      
      default:
        return `${pattern.type} pattern detected with ${pattern.significance} significance.`;
    }
  }
}

module.exports = new MajorPatternDetectorService();
