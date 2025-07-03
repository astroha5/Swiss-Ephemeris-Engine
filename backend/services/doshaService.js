const logger = require('../utils/logger');

class DoshaService {
  /**
   * Calculate major doshas in the chart
   */
  calculateDoshas(planetaryPositions, ascendant) {
    const doshas = [];

    try {
      // Mangal Dosha (Mars Dosha)
      const mangalDosha = this.checkMangalDosha(planetaryPositions, ascendant);
      doshas.push({
        name: 'Mangal Dosha',
        present: mangalDosha.present,
        severity: mangalDosha.severity || null
      });

      // Kaal Sarp Dosha
      const kaalSarpDosha = this.checkKaalSarpDosha(planetaryPositions);
      doshas.push({
        name: 'Kaal Sarp Dosha',
        present: kaalSarpDosha.present,
        severity: kaalSarpDosha.severity || null
      });

      // Pitra Dosha
      const pitraDosha = this.checkPitraDosha(planetaryPositions);
      doshas.push({
        name: 'Pitra Dosha',
        present: pitraDosha.present,
        severity: pitraDosha.severity || null
      });

      // Shani Dosha (Saturn affliction)
      const shaniDosha = this.checkShaniDosha(planetaryPositions);
      doshas.push({
        name: 'Shani Dosha',
        present: shaniDosha.present,
        severity: shaniDosha.severity || null
      });

      logger.info(`Calculated ${doshas.length} doshas for the chart`);
      return doshas;

    } catch (error) {
      logger.error('Error calculating doshas:', error);
      return [
        { name: 'Mangal Dosha', present: false, severity: null },
        { name: 'Kaal Sarp Dosha', present: false, severity: null },
        { name: 'Pitra Dosha', present: false, severity: null }
      ];
    }
  }

  /**
   * Check for Mangal Dosha (Mars Dosha)
   */
  checkMangalDosha(planetaryPositions, ascendant) {
    const mars = planetaryPositions.mars;
    
    if (!mars) {
      return { present: false };
    }

    // Calculate Mars house position from ascendant
    let marsHouse = mars.signNumber - ascendant.signNumber + 1;
    if (marsHouse <= 0) marsHouse += 12;
    if (marsHouse > 12) marsHouse -= 12;

    // Mangal Dosha houses: 1, 4, 7, 8, 12
    const doshaHouses = [1, 4, 7, 8, 12];
    
    if (doshaHouses.includes(marsHouse)) {
      // Determine severity
      let severity = 'Mild';
      
      if ([1, 8].includes(marsHouse)) {
        severity = 'Severe';
      } else if ([4, 7, 12].includes(marsHouse)) {
        severity = 'Moderate';
      }

      // Check for cancellation conditions
      if (this.checkMangalDoshaCancellation(planetaryPositions, marsHouse)) {
        severity = 'Mild'; // Reduced severity due to cancellation
      }

      return { present: true, severity, house: marsHouse };
    }

    return { present: false };
  }

  /**
   * Check for Mangal Dosha cancellation conditions
   */
  checkMangalDoshaCancellation(planetaryPositions, marsHouse) {
    const mars = planetaryPositions.mars;
    
    // Cancellation if Mars is in own sign
    if (['Aries', 'Scorpio'].includes(mars.sign)) {
      return true;
    }

    // Cancellation if Mars is aspected by benefics (simplified check)
    const jupiter = planetaryPositions.jupiter;
    const venus = planetaryPositions.venus;
    
    if (jupiter && !jupiter.isRetrograde) {
      const jupiterMarsDistance = Math.abs(jupiter.signNumber - mars.signNumber);
      if ([5, 7, 9].includes(jupiterMarsDistance)) { // Jupiter's aspects
        return true;
      }
    }

    return false;
  }

  /**
   * Check for Kaal Sarp Dosha
   */
  checkKaalSarpDosha(planetaryPositions) {
    const rahu = planetaryPositions.rahu;
    const ketu = planetaryPositions.ketu;
    
    if (!rahu || !ketu) {
      return { present: false };
    }

    // Check if all planets are between Rahu and Ketu
    const rahuSign = rahu.signNumber;
    const ketuSign = ketu.signNumber;
    
    let planetsOnOneSide = true;
    let planetsOnOtherSide = true;
    
    const mainPlanets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
    
    for (const planetKey of mainPlanets) {
      const planet = planetaryPositions[planetKey];
      if (!planet) continue;
      
      const planetSign = planet.signNumber;
      
      // Check if planet is between Rahu and Ketu (clockwise)
      let betweenRahuKetu;
      if (rahuSign < ketuSign) {
        betweenRahuKetu = planetSign > rahuSign && planetSign < ketuSign;
      } else {
        betweenRahuKetu = planetSign > rahuSign || planetSign < ketuSign;
      }
      
      if (betweenRahuKetu) {
        planetsOnOtherSide = false;
      } else {
        planetsOnOneSide = false;
      }
    }
    
    if (planetsOnOneSide || planetsOnOtherSide) {
      // Determine severity based on how close planets are to Rahu-Ketu axis
      let severity = 'Mild';
      
      // Count planets very close to Rahu or Ketu
      let closeConjunctions = 0;
      for (const planetKey of mainPlanets) {
        const planet = planetaryPositions[planetKey];
        if (!planet) continue;
        
        const distanceFromRahu = Math.min(
          Math.abs(planet.signNumber - rahuSign),
          12 - Math.abs(planet.signNumber - rahuSign)
        );
        
        const distanceFromKetu = Math.min(
          Math.abs(planet.signNumber - ketuSign),
          12 - Math.abs(planet.signNumber - ketuSign)
        );
        
        if (distanceFromRahu <= 1 || distanceFromKetu <= 1) {
          closeConjunctions++;
        }
      }
      
      if (closeConjunctions >= 3) {
        severity = 'Severe';
      } else if (closeConjunctions >= 2) {
        severity = 'Moderate';
      }
      
      return { present: true, severity };
    }

    return { present: false };
  }

  /**
   * Check for Pitra Dosha
   */
  checkPitraDosha(planetaryPositions) {
    const sun = planetaryPositions.sun;
    const rahu = planetaryPositions.rahu;
    const ketu = planetaryPositions.ketu;
    
    if (!sun || !rahu || !ketu) {
      return { present: false };
    }

    // Pitra Dosha conditions:
    // 1. Sun conjunct with Rahu or Ketu
    // 2. Sun in 9th house with malefics
    // 3. 9th house afflicted
    
    const sunRahuDistance = Math.abs(sun.signNumber - rahu.signNumber);
    const sunKetuDistance = Math.abs(sun.signNumber - ketu.signNumber);
    
    // Check conjunction (same sign or adjacent sign)
    if (sunRahuDistance <= 1 || sunKetuDistance <= 1) {
      let severity = 'Moderate';
      
      // Increase severity if exact conjunction (same degrees approximately)
      const rahuDegreeDistance = Math.abs(sun.degree - rahu.degree);
      const ketuDegreeDistance = Math.abs(sun.degree - ketu.degree);
      
      if (rahuDegreeDistance <= 10 || ketuDegreeDistance <= 10) {
        severity = 'Severe';
      }
      
      return { present: true, severity };
    }

    // Check for other Pitra Dosha combinations (simplified)
    const saturn = planetaryPositions.saturn;
    if (saturn && saturn.isRetrograde) {
      return { present: true, severity: 'Mild' };
    }

    return { present: false };
  }

  /**
   * Check for Shani Dosha (Saturn affliction)
   */
  checkShaniDosha(planetaryPositions) {
    const saturn = planetaryPositions.saturn;
    
    if (!saturn) {
      return { present: false };
    }

    // Check for Saturn's malefic conditions
    let doshaFactors = 0;
    let severity = 'Mild';

    // Retrograde Saturn
    if (saturn.isRetrograde) {
      doshaFactors++;
    }

    // Saturn in debilitation sign
    if (saturn.sign === 'Aries') {
      doshaFactors += 2;
    }

    // Saturn with malefics (Rahu/Ketu)
    const rahu = planetaryPositions.rahu;
    const ketu = planetaryPositions.ketu;
    
    if (rahu && Math.abs(saturn.signNumber - rahu.signNumber) <= 1) {
      doshaFactors++;
    }
    
    if (ketu && Math.abs(saturn.signNumber - ketu.signNumber) <= 1) {
      doshaFactors++;
    }

    if (doshaFactors >= 3) {
      severity = 'Severe';
    } else if (doshaFactors >= 2) {
      severity = 'Moderate';
    } else if (doshaFactors >= 1) {
      severity = 'Mild';
    }

    if (doshaFactors > 0) {
      return { present: true, severity };
    }

    return { present: false };
  }
}

module.exports = new DoshaService();
