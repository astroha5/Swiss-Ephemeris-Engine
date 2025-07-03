const logger = require('../utils/logger');

class YogaService {
  /**
   * Calculate major yogas in the chart
   */
  calculateYogas(planetaryPositions, ascendant) {
    const yogas = [];

    try {
      // Gaja Kesari Yoga (Jupiter and Moon in Kendra from each other)
      const gajaKesari = this.checkGajaKesariYoga(planetaryPositions);
      if (gajaKesari.present) {
        yogas.push({
          name: 'Gaja Kesari Yoga',
          strength: gajaKesari.strength,
          effect: 'Wealth, wisdom, and prosperity'
        });
      }

      // Raj Yoga (benefic planets in Kendra and Trikona houses)
      const rajYoga = this.checkRajYoga(planetaryPositions, ascendant);
      if (rajYoga.present) {
        yogas.push({
          name: 'Raj Yoga',
          strength: rajYoga.strength,
          effect: 'Leadership, authority, and success'
        });
      }

      // Dhana Yoga (wealth combinations)
      const dhanaYoga = this.checkDhanaYoga(planetaryPositions, ascendant);
      if (dhanaYoga.present) {
        yogas.push({
          name: 'Dhana Yoga',
          strength: dhanaYoga.strength,
          effect: 'Financial prosperity and abundance'
        });
      }

      // Neecha Bhanga Raj Yoga (cancellation of debilitation)
      const neechaBhanga = this.checkNeechaBhangaYoga(planetaryPositions);
      if (neechaBhanga.present) {
        yogas.push({
          name: 'Neecha Bhanga Raj Yoga',
          strength: neechaBhanga.strength,
          effect: 'Rise from humble beginnings to greatness'
        });
      }

      // Panch Mahapurusha Yogas
      const pancharMahapurusha = this.checkPanchaMahapurushaYogas(planetaryPositions);
      yogas.push(...pancharMahapurusha);

      logger.info(`Found ${yogas.length} yogas in the chart`);
      return yogas;

    } catch (error) {
      logger.error('Error calculating yogas:', error);
      return [];
    }
  }

  /**
   * Check for Gaja Kesari Yoga
   */
  checkGajaKesariYoga(planetaryPositions) {
    const jupiter = planetaryPositions.jupiter;
    const moon = planetaryPositions.moon;

    if (!jupiter || !moon) {
      return { present: false };
    }

    // Calculate the difference between Jupiter and Moon positions
    let signDifference = Math.abs(jupiter.signNumber - moon.signNumber);
    if (signDifference > 6) signDifference = 12 - signDifference;

    // Gaja Kesari forms when Jupiter and Moon are in Kendra (1, 4, 7, 10) from each other
    const isKendra = [1, 4, 7, 10].includes(signDifference);

    if (isKendra) {
      // Determine strength based on planet conditions
      let strength = 'Moderate';
      
      if (!jupiter.isRetrograde && !moon.isRetrograde) {
        strength = 'Strong';
      }
      
      if (jupiter.sign === 'Cancer' || moon.sign === 'Cancer') {
        strength = 'Strong'; // Moon exalted or in own sign
      }

      return { present: true, strength };
    }

    return { present: false };
  }

  /**
   * Check for Raj Yoga
   */
  checkRajYoga(planetaryPositions, ascendant) {
    // Simplified Raj Yoga: Lords of Kendra and Trikona houses together or aspecting
    const kendraHouses = [1, 4, 7, 10];
    const trikonaHouses = [1, 5, 9];
    
    let beneficCount = 0;
    const strongPlanets = ['Jupiter', 'Venus', 'Mercury'];
    
    for (const planet of Object.values(planetaryPositions)) {
      if (strongPlanets.includes(planet.name) && !planet.isRetrograde) {
        beneficCount++;
      }
    }

    if (beneficCount >= 2) {
      const strength = beneficCount >= 3 ? 'Strong' : 'Moderate';
      return { present: true, strength };
    }

    return { present: false };
  }

  /**
   * Check for Dhana Yoga
   */
  checkDhanaYoga(planetaryPositions, ascendant) {
    // Simplified: Jupiter and Venus in good houses
    const jupiter = planetaryPositions.jupiter;
    const venus = planetaryPositions.venus;
    
    const wealthHouses = [2, 5, 9, 11]; // Houses of wealth
    
    let wealthIndicators = 0;
    
    if (jupiter && !jupiter.isRetrograde) {
      wealthIndicators++;
    }
    
    if (venus && !venus.isRetrograde) {
      wealthIndicators++;
    }

    if (wealthIndicators >= 1) {
      const strength = wealthIndicators >= 2 ? 'Strong' : 'Weak';
      return { present: true, strength };
    }

    return { present: false };
  }

  /**
   * Check for Neecha Bhanga Raj Yoga
   */
  checkNeechaBhangaYoga(planetaryPositions) {
    const debilitationSigns = {
      'Sun': 'Libra',
      'Moon': 'Scorpio', 
      'Mars': 'Cancer',
      'Mercury': 'Pisces',
      'Jupiter': 'Capricorn',
      'Venus': 'Virgo',
      'Saturn': 'Aries'
    };

    for (const planet of Object.values(planetaryPositions)) {
      const debilitationSign = debilitationSigns[planet.name];
      if (planet.sign === debilitationSign) {
        // Check for cancellation conditions (simplified)
        // In full implementation, check for dispositor strength, exaltation of dispositor, etc.
        return { 
          present: true, 
          strength: 'Moderate',
          planet: planet.name 
        };
      }
    }

    return { present: false };
  }

  /**
   * Check for Pancha Mahapurusha Yogas
   */
  checkPanchaMahapurushaYogas(planetaryPositions) {
    const yogas = [];
    
    const mahapurushaYogas = {
      'Mars': { yoga: 'Ruchaka Yoga', houses: [1, 4, 7, 10], signs: ['Aries', 'Scorpio'] },
      'Mercury': { yoga: 'Bhadra Yoga', houses: [1, 4, 7, 10], signs: ['Gemini', 'Virgo'] },
      'Jupiter': { yoga: 'Hamsa Yoga', houses: [1, 4, 7, 10], signs: ['Sagittarius', 'Pisces'] },
      'Venus': { yoga: 'Malavya Yoga', houses: [1, 4, 7, 10], signs: ['Taurus', 'Libra'] },
      'Saturn': { yoga: 'Shasha Yoga', houses: [1, 4, 7, 10], signs: ['Capricorn', 'Aquarius'] }
    };

    for (const [planetName, yogaInfo] of Object.entries(mahapurushaYogas)) {
      const planet = planetaryPositions[planetName.toLowerCase()];
      
      if (planet && yogaInfo.signs.includes(planet.sign) && !planet.isRetrograde) {
        yogas.push({
          name: yogaInfo.yoga,
          strength: 'Strong',
          effect: `${planetName} bestows leadership and noble qualities`
        });
      }
    }

    return yogas;
  }
}

module.exports = new YogaService();
