const moment = require('moment-timezone');
const logger = require('../utils/logger');

class DashaService {
  constructor() {
    // Vimshottari Dasha periods in years
    this.dashaPeriods = {
      'Ketu': 7,
      'Venus': 20,
      'Sun': 6,
      'Moon': 10,
      'Mars': 7,
      'Rahu': 18,
      'Jupiter': 16,
      'Saturn': 19,
      'Mercury': 17
    };

    // Dasha sequence
    this.dashaSequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

    // Nakshatra lords for determining birth dasha
    this.nakshatraLords = [
      'Ketu',    // Ashwini
      'Venus',   // Bharani
      'Sun',     // Krittika
      'Moon',    // Rohini
      'Mars',    // Mrigashirsha
      'Rahu',    // Ardra
      'Jupiter', // Punarvasu
      'Saturn',  // Pushya
      'Mercury', // Ashlesha
      'Ketu',    // Magha
      'Venus',   // Purva Phalguni
      'Sun',     // Uttara Phalguni
      'Moon',    // Hasta
      'Mars',    // Chitra
      'Rahu',    // Swati
      'Jupiter', // Vishakha
      'Saturn',  // Anuradha
      'Mercury', // Jyeshtha
      'Ketu',    // Mula
      'Venus',   // Purva Ashadha
      'Sun',     // Uttara Ashadha
      'Moon',    // Shravana
      'Mars',    // Dhanishta
      'Rahu',    // Shatabhisha
      'Jupiter', // Purva Bhadrapada
      'Saturn',  // Uttara Bhadrapada
      'Mercury'  // Revati
    ];

    this.planetSymbols = {
      'Ketu': '☋',
      'Venus': '♀',
      'Sun': '☉',
      'Moon': '☽',
      'Mars': '♂',
      'Rahu': '☊',
      'Jupiter': '♃',
      'Saturn': '♄',
      'Mercury': '☿'
    };
  }

  /**
   * Calculate complete Vimshottari Dasha timeline
   */
  calculateDashaTimeline(birthDate, birthTime, moonNakshatra, moonNakshatraProgress, timezone = 'Asia/Kolkata') {
    try {
      logger.info(`Calculating Dasha timeline for birth: ${birthDate} ${birthTime}, Moon in ${moonNakshatra}`);

      // Determine birth nakshatra index (0-based)
      const nakshatraIndex = this.getNakshatraIndex(moonNakshatra);
      if (nakshatraIndex === -1) {
        throw new Error(`Invalid nakshatra: ${moonNakshatra}`);
      }

      // Get birth dasha lord
      const birthDashaLord = this.nakshatraLords[nakshatraIndex];
      
      // Calculate birth moment
      const birthMoment = moment.tz(`${birthDate} ${birthTime}`, 'YYYY-MM-DD HH:mm', timezone);
      
      // Calculate remaining period in birth dasha
      const totalNakshatraSpan = this.dashaPeriods[birthDashaLord] * 365.25; // Total days
      const completedDays = (moonNakshatraProgress / 100) * totalNakshatraSpan;
      const remainingDays = totalNakshatraSpan - completedDays;

      // Generate complete dasha sequence starting from birth
      const dashaTimeline = this.generateDashaSequence(birthMoment, birthDashaLord, remainingDays);

      // Find current dasha
      const now = moment();
      const currentDasha = this.findCurrentDasha(dashaTimeline, now);

      // Calculate current antardasha
      const currentAntardasha = this.calculateCurrentAntardasha(currentDasha, now);

      return {
        birthDetails: {
          date: birthDate,
          time: birthTime,
          moonNakshatra: moonNakshatra,
          birthDashaLord: birthDashaLord,
          remainingAtBirth: this.formatDuration(remainingDays)
        },
        currentMahadasha: {
          planet: currentDasha.planet,
          symbol: this.planetSymbols[currentDasha.planet],
          startDate: currentDasha.startDate.format('YYYY-MM-DD'),
          endDate: currentDasha.endDate.format('YYYY-MM-DD'),
          totalYears: currentDasha.years,
          remainingYears: this.calculateRemainingYears(now, currentDasha.endDate),
          isActive: true
        },
        currentAntardasha: currentAntardasha,
        dashaSequence: this.formatDashaSequence(dashaTimeline, now),
        timeline: this.generateDetailedTimeline(dashaTimeline),
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error calculating Dasha timeline:', error);
      throw new Error(`Dasha calculation failed: ${error.message}`);
    }
  }

  /**
   * Get nakshatra index from name
   */
  getNakshatraIndex(nakshatraName) {
    const nakshatras = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ];
    return nakshatras.indexOf(nakshatraName);
  }

  /**
   * Generate complete dasha sequence for 120 years
   */
  generateDashaSequence(startMoment, startingPlanet, remainingDaysInFirst) {
    const sequence = [];
    let currentMoment = startMoment.clone();
    let planetIndex = this.dashaSequence.indexOf(startingPlanet);

    // First dasha (partial)
    const firstEndMoment = currentMoment.clone().add(remainingDaysInFirst, 'days');
    sequence.push({
      planet: startingPlanet,
      startDate: currentMoment.clone(),
      endDate: firstEndMoment,
      years: this.dashaPeriods[startingPlanet],
      status: this.getDashaStatus(currentMoment, firstEndMoment)
    });

    currentMoment = firstEndMoment;

    // Generate subsequent dashas for 120 years total
    const totalYears = 120;
    let accumulatedYears = remainingDaysInFirst / 365.25;

    while (accumulatedYears < totalYears) {
      planetIndex = (planetIndex + 1) % this.dashaSequence.length;
      const planet = this.dashaSequence[planetIndex];
      const years = this.dashaPeriods[planet];
      const endMoment = currentMoment.clone().add(years, 'years');

      sequence.push({
        planet: planet,
        startDate: currentMoment.clone(),
        endDate: endMoment,
        years: years,
        status: this.getDashaStatus(currentMoment, endMoment)
      });

      currentMoment = endMoment;
      accumulatedYears += years;
    }

    return sequence;
  }

  /**
   * Find current dasha from timeline
   */
  findCurrentDasha(dashaTimeline, currentMoment) {
    for (const dasha of dashaTimeline) {
      if (currentMoment.isBetween(dasha.startDate, dasha.endDate, 'day', '[]')) {
        return dasha;
      }
    }
    
    // If not found, return the last completed or next upcoming
    const pastDashas = dashaTimeline.filter(d => currentMoment.isAfter(d.endDate));
    const futureDashas = dashaTimeline.filter(d => currentMoment.isBefore(d.startDate));
    
    if (pastDashas.length > 0) {
      return pastDashas[pastDashas.length - 1]; // Last completed
    } else if (futureDashas.length > 0) {
      return futureDashas[0]; // Next upcoming
    }
    
    return dashaTimeline[0]; // Fallback
  }

  /**
   * Calculate current antardasha within mahadasha
   */
  calculateCurrentAntardasha(currentMahadasha, currentMoment) {
    const mahadashaLord = currentMahadasha.planet;
    const mahadashaStart = currentMahadasha.startDate;
    const mahadashaEnd = currentMahadasha.endDate;
    const mahadashaDuration = mahadashaEnd.diff(mahadashaStart, 'days');

    // Generate antardasha sequence starting with mahadasha lord
    let antardashaSequence = [mahadashaLord];
    let nextIndex = (this.dashaSequence.indexOf(mahadashaLord) + 1) % this.dashaSequence.length;
    
    while (antardashaSequence.length < 9) {
      antardashaSequence.push(this.dashaSequence[nextIndex]);
      nextIndex = (nextIndex + 1) % this.dashaSequence.length;
    }

    // Calculate antardasha periods
    let currentAntardashaStart = mahadashaStart.clone();
    
    for (const antardashaLord of antardashaSequence) {
      const antardashaYears = this.dashaPeriods[antardashaLord];
      const antardashaProportion = antardashaYears / 120; // Proportion of 120-year cycle
      const antardashaDays = mahadashaDuration * antardashaProportion;
      const antardashaEnd = currentAntardashaStart.clone().add(antardashaDays, 'days');

      if (currentMoment.isBetween(currentAntardashaStart, antardashaEnd, 'day', '[]')) {
        const totalMonths = antardashaEnd.diff(currentAntardashaStart, 'months', true);
        const remainingMonths = antardashaEnd.diff(currentMoment, 'months', true);

        return {
          planet: antardashaLord,
          symbol: this.planetSymbols[antardashaLord],
          startDate: currentAntardashaStart.format('YYYY-MM-DD'),
          endDate: antardashaEnd.format('YYYY-MM-DD'),
          totalMonths: Math.round(totalMonths * 10) / 10,
          remainingMonths: Math.round(remainingMonths * 10) / 10,
          isActive: true
        };
      }

      currentAntardashaStart = antardashaEnd;
    }

    // Fallback - return first antardasha
    const firstAntardashaYears = this.dashaPeriods[antardashaSequence[0]];
    const firstAntardashaProportion = firstAntardashaYears / 120;
    const firstAntardashadays = mahadashaDuration * firstAntardashaProportion;
    const firstAntardashaEnd = mahadashaStart.clone().add(firstAntardashadays, 'days');

    return {
      planet: antardashaSequence[0],
      symbol: this.planetSymbols[antardashaSequence[0]],
      startDate: mahadashaStart.format('YYYY-MM-DD'),
      endDate: firstAntardashaEnd.format('YYYY-MM-DD'),
      totalMonths: Math.round(firstAntardashadays / 30 * 10) / 10,
      remainingMonths: Math.round(firstAntardashaEnd.diff(currentMoment, 'days') / 30 * 10) / 10,
      isActive: true
    };
  }

  /**
   * Format dasha sequence for frontend
   */
  formatDashaSequence(dashaTimeline, currentMoment) {
    return dashaTimeline.slice(0, 10).map(dasha => ({ // Limit to first 10 for display
      planet: dasha.planet,
      symbol: this.planetSymbols[dasha.planet],
      startDate: dasha.startDate.format('YYYY-MM-DD'),
      endDate: dasha.endDate.format('YYYY-MM-DD'),
      years: dasha.years,
      status: this.getDashaStatus(dasha.startDate, dasha.endDate, currentMoment),
      subPeriods: this.generateSubPeriods(dasha, currentMoment)
    }));
  }

  /**
   * Generate sub-periods (antardasha) for a mahadasha
   */
  generateSubPeriods(mahadasha, currentMoment) {
    const mahadashaLord = mahadasha.planet;
    const mahadashaStart = mahadasha.startDate;
    const mahadashaEnd = mahadasha.endDate;
    const mahadashaDuration = mahadashaEnd.diff(mahadashaStart, 'days');

    // Generate antardasha sequence
    let antardashaSequence = [mahadashaLord];
    let nextIndex = (this.dashaSequence.indexOf(mahadashaLord) + 1) % this.dashaSequence.length;
    
    while (antardashaSequence.length < 9) {
      antardashaSequence.push(this.dashaSequence[nextIndex]);
      nextIndex = (nextIndex + 1) % this.dashaSequence.length;
    }

    const subPeriods = [];
    let currentStart = mahadashaStart.clone();

    for (const antardashaLord of antardashaSequence) {
      const antardashaYears = this.dashaPeriods[antardashaLord];
      const antardashaProportion = antardashaYears / 120;
      const antardashadays = mahadashaDuration * antardashaProportion;
      const antardashaEnd = currentStart.clone().add(antardashadays, 'days');

      const duration = this.formatDuration(antardashadays);
      const status = this.getDashaStatus(currentStart, antardashaEnd, currentMoment);

      subPeriods.push({
        planet: antardashaLord,
        duration: duration,
        startDate: currentStart.format('YYYY-MM-DD'),
        endDate: antardashaEnd.format('YYYY-MM-DD'),
        status: status
      });

      currentStart = antardashaEnd;
    }

    return subPeriods;
  }

  /**
   * Generate detailed timeline for visualization
   */
  generateDetailedTimeline(dashaTimeline) {
    return dashaTimeline.map(dasha => ({
      planet: dasha.planet,
      symbol: this.planetSymbols[dasha.planet],
      startYear: dasha.startDate.year(),
      endYear: dasha.endDate.year(),
      duration: dasha.years,
      startDate: dasha.startDate.format('YYYY-MM-DD'),
      endDate: dasha.endDate.format('YYYY-MM-DD'),
      status: dasha.status
    }));
  }

  /**
   * Determine dasha status (completed, current, upcoming)
   */
  getDashaStatus(startDate, endDate, referenceMoment = moment()) {
    if (referenceMoment.isBefore(startDate)) {
      return 'upcoming';
    } else if (referenceMoment.isAfter(endDate)) {
      return 'completed';
    } else {
      return 'current';
    }
  }

  /**
   * Calculate remaining years from current moment to end date
   */
  calculateRemainingYears(currentMoment, endMoment) {
    const remainingYears = endMoment.diff(currentMoment, 'years', true);
    return Math.round(remainingYears * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Format duration in years, months, days
   */
  formatDuration(days) {
    const years = Math.floor(days / 365.25);
    const months = Math.floor((days % 365.25) / 30.44);
    const remainingDays = Math.floor(days % 30.44);

    if (years > 0) {
      return `${years}y ${months}m ${remainingDays}d`;
    } else if (months > 0) {
      return `${months}m ${remainingDays}d`;
    } else {
      return `${remainingDays}d`;
    }
  }
}

module.exports = new DashaService();
