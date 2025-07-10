const logger = require('../utils/logger');

class AspectsService {
  constructor() {
    // Traditional Vedic aspects and Western aspects
    this.vedic_aspects = {
      '1': { name: 'Conjunction', orb: 5, strength: 'Strong' },
      '7': { name: 'Opposition', orb: 5, strength: 'Strong' },
      '4': { name: 'Square', orb: 5, strength: 'Moderate' },
      '10': { name: 'Square', orb: 5, strength: 'Moderate' },
      '3': { name: 'Trine', orb: 5, strength: 'Harmonious' },
      '9': { name: 'Trine', orb: 5, strength: 'Harmonious' },
      '2': { name: 'Sextile', orb: 3, strength: 'Mild' },
      '12': { name: 'Sextile', orb: 3, strength: 'Mild' }
    };

    // Planet natures for aspect interpretation
    this.planet_natures = {
      'sun': 'benefic',
      'moon': 'benefic',
      'mercury': 'neutral',
      'venus': 'benefic',
      'mars': 'malefic',
      'jupiter': 'benefic',
      'saturn': 'malefic',
      'rahu': 'malefic',
      'ketu': 'malefic'
    };
  }

  /**
   * Calculate all aspects between planets
   */
  calculateAspects(planetaryPositions) {
    try {
      const aspects = [];
      const planets = Object.keys(planetaryPositions);

      for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
          const planet1 = planets[i];
          const planet2 = planets[j];
          
          const position1 = planetaryPositions[planet1];
          const position2 = planetaryPositions[planet2];

          if (!position1 || !position2) continue;

          const aspect = this.calculateAspectBetweenPlanets(planet1, position1, planet2, position2);
          if (aspect) {
            aspects.push(aspect);
          }
        }
      }

      logger.info(`Calculated ${aspects.length} planetary aspects`);
      return aspects;

    } catch (error) {
      logger.error('Error calculating aspects:', error);
      return [];
    }
  }

  /**
   * Calculate aspect between two planets
   */
  calculateAspectBetweenPlanets(planet1, position1, planet2, position2) {
    const longitude1 = position1.longitude;
    const longitude2 = position2.longitude;

    // Calculate the angular separation
    let separation = Math.abs(longitude1 - longitude2);
    if (separation > 180) {
      separation = 360 - separation;
    }

    // Convert to sign difference
    const signDifference = Math.round(separation / 30);
    
    // Check if this forms a valid aspect
    const aspectInfo = this.vedic_aspects[signDifference.toString()];
    if (!aspectInfo) return null;

    // Calculate orb (difference from exact aspect)
    const exactAspect = signDifference * 30;
    const orb = Math.abs(separation - exactAspect);

    // Check if within orb
    if (orb <= aspectInfo.orb) {
      const strength = this.calculateAspectStrength(planet1, planet2, aspectInfo, orb);
      const nature = this.determineAspectNature(planet1, planet2, aspectInfo);

      return {
        planet1: position1.name,
        planet2: position2.name,
        aspect: aspectInfo.name,
        orb: orb.toFixed(2),
        strength: strength,
        nature: nature,
        separation: separation.toFixed(2),
        applying: this.isAspectApplying(position1, position2)
      };
    }

    return null;
  }

  /**
   * Calculate aspect strength based on orb and planet nature
   */
  calculateAspectStrength(planet1, planet2, aspectInfo, orb) {
    let baseStrength = aspectInfo.strength;
    
    // Reduce strength based on orb
    const orbFactor = 1 - (orb / aspectInfo.orb);
    
    // Increase strength for luminaries (Sun/Moon) and benefics
    if (['sun', 'moon', 'jupiter'].includes(planet1) || ['sun', 'moon', 'jupiter'].includes(planet2)) {
      if (orbFactor > 0.7) return 'Very Strong';
      if (orbFactor > 0.5) return 'Strong';
    }

    if (orbFactor > 0.8) return 'Strong';
    if (orbFactor > 0.5) return 'Moderate';
    return 'Weak';
  }

  /**
   * Determine if aspect is benefic, malefic, or mixed
   */
  determineAspectNature(planet1, planet2, aspectInfo) {
    const nature1 = this.planet_natures[planet1] || 'neutral';
    const nature2 = this.planet_natures[planet2] || 'neutral';

    // Conjunction aspects depend on planet natures
    if (aspectInfo.name === 'Conjunction') {
      if (nature1 === 'benefic' && nature2 === 'benefic') return 'Benefic';
      if (nature1 === 'malefic' && nature2 === 'malefic') return 'Malefic';
      return 'Mixed';
    }

    // Trine aspects are generally harmonious
    if (aspectInfo.name === 'Trine') {
      return 'Benefic';
    }

    // Square and Opposition aspects depend on planets involved
    if (['Square', 'Opposition'].includes(aspectInfo.name)) {
      if (nature1 === 'benefic' || nature2 === 'benefic') return 'Mixed';
      return 'Challenging';
    }

    // Sextile aspects are mildly harmonious
    if (aspectInfo.name === 'Sextile') {
      return 'Harmonious';
    }

    return 'Neutral';
  }

  /**
   * Check if aspect is applying (getting closer) or separating
   */
  isAspectApplying(position1, position2) {
    // Simplified check based on planetary speeds
    // In a full implementation, this would use actual planetary speeds
    const speed1 = position1.speed || 0;
    const speed2 = position2.speed || 0;
    
    return speed1 > speed2;
  }

  /**
   * Get the strongest aspects for display
   */
  getStrongestAspects(aspects, limit = 10) {
    return aspects
      .filter(aspect => ['Very Strong', 'Strong'].includes(aspect.strength))
      .sort((a, b) => {
        const strengthOrder = { 'Very Strong': 3, 'Strong': 2, 'Moderate': 1, 'Weak': 0 };
        const strengthDiff = strengthOrder[b.strength] - strengthOrder[a.strength];
        if (strengthDiff !== 0) return strengthDiff;
        
        // Secondary sort by orb (smaller orb = stronger)
        return parseFloat(a.orb) - parseFloat(b.orb);
      })
      .slice(0, limit);
  }
}

module.exports = new AspectsService();
