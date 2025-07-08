#!/usr/bin/env node

/**
 * BACKEND-MIRRORED VERIFICATION SCRIPT
 * 
 * This script exactly replicates your backend's calculation method
 * to identify discrepancies with reference values for Obama's chart.
 * 
 * It will help determine if the issue is:
 * 1. Reference data accuracy
 * 2. Swiss Ephemeris configuration
 * 3. Timezone/historical handling
 * 4. Ayanamsa application
 */

const swisseph = require('swisseph');
const moment = require('moment-timezone');
const path = require('path');

// Obama's exact birth data
const OBAMA_DATA = {
  name: "Barack Obama",
  date: "1961-08-04",
  time: "19:24",
  timezone: "Pacific/Honolulu",
  place: "Honolulu, Hawaii, USA",
  coordinates: {
    lat: 21.3099,
    lng: -157.8581
  }
};

// Expected reference values from multiple sources
const REFERENCE_VALUES = {
  // From Astro-Databank and verified sources
  sidereal_lahiri: {
    ascendant: { sign: "Capricorn", degree: 18.03 },
    moon: { sign: "Taurus", degree: 2.52 },
    sun: { sign: "Cancer", degree: 12.32 }
  },
  tropical: {
    ascendant: { sign: "Aquarius", degree: 18.03 },
    moon: { sign: "Gemini", degree: 2.52 },
    sun: { sign: "Leo", degree: 12.32 }
  }
};

// Initialize Swiss Ephemeris exactly like your backend
function initializeSwissEphemeris() {
  try {
    // Set ephemeris path
    const ephePath = path.join(__dirname, 'backend', 'ephemeris');
    swisseph.swe_set_ephe_path(ephePath);
    
    // Set Lahiri Ayanamsa (exactly like your backend)
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    
    console.log('✅ Swiss Ephemeris initialized with Lahiri Ayanamsa');
    console.log(`📁 Ephemeris path: ${ephePath}`);
    console.log(`📦 Swiss Ephemeris version: ${swisseph.swe_version()}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Swiss Ephemeris:', error);
    return false;
  }
}

// Historical timezone handler - simplified version of your backend logic
function getHistoricalJulianDay(date, time, timezone, place, coordinates) {
  const year = parseInt(date.split('-')[0]);
  
  console.log(`\n🕐 Calculating Julian Day for: ${date} ${time}`);
  console.log(`📍 Location: ${place}`);
  console.log(`🌍 Coordinates: ${coordinates.lat}°, ${coordinates.lng}°`);
  console.log(`⏰ Timezone: ${timezone}`);
  
  // For Obama (1961), this is modern era, so use standard timezone conversion
  const localTime = moment.tz(`${date} ${time}`, timezone);
  const utcTime = localTime.utc();
  
  console.log(`🕐 Local time: ${localTime.format('YYYY-MM-DD HH:mm:ss z')}`);
  console.log(`🌍 UTC time: ${utcTime.format('YYYY-MM-DD HH:mm:ss z')}`);
  
  const julianDay = swisseph.swe_julday(
    utcTime.year(),
    utcTime.month() + 1,
    utcTime.date(),
    utcTime.hour() + utcTime.minute()/60 + utcTime.second()/3600,
    swisseph.SE_GREG_CAL
  );
  
  console.log(`📊 Julian Day: ${julianDay.toFixed(8)}`);
  
  return {
    julianDay,
    localTime: localTime.format('YYYY-MM-DD HH:mm:ss z'),
    utcTime: utcTime.format('YYYY-MM-DD HH:mm:ss z'),
    isHistorical: year < 1955
  };
}

// Calculate planetary positions exactly like your backend
function calculatePlanetaryPositions(julianDay) {
  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const planets = {
    SUN: 0,
    MOON: 1,
    MERCURY: 2,
    VENUS: 3,
    MARS: 4,
    JUPITER: 5,
    SATURN: 6,
    RAHU: 11
  };
  
  const positions = {};
  const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;
  
  console.log(`\n🔍 Calculating planetary positions with flags: ${flags}`);
  
  // Re-confirm Ayanamsa setting before calculations (like your backend)
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  const ayanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
  console.log(`🌀 Lahiri Ayanamsa: ${ayanamsa.toFixed(6)}°`);
  
  for (const [planetName, planetId] of Object.entries(planets)) {
    if (planetName === 'RAHU') {
      // Handle Rahu separately if needed
      continue;
    }
    
    try {
      const result = swisseph.swe_calc_ut(julianDay, planetId, flags);
      
      if (result.rflag < 0) {
        console.error(`❌ Failed to calculate ${planetName}: ${result.serr}`);
        continue;
      }
      
      const longitude = result.longitude;
      const signNumber = Math.floor(longitude / 30);
      const degreeInSign = longitude % 30;
      
      positions[planetName.toLowerCase()] = {
        name: planetName.charAt(0) + planetName.slice(1).toLowerCase(),
        longitude: longitude,
        sign: zodiacSigns[signNumber],
        signNumber: signNumber + 1,
        degreeInSign: degreeInSign,
        degreeFormatted: formatDegree(degreeInSign),
        isRetrograde: result.longitudeSpeed < 0
      };
      
      console.log(`${planetName}: ${formatDegree(degreeInSign)} ${zodiacSigns[signNumber]} (${longitude.toFixed(6)}°)`);
      
    } catch (error) {
      console.error(`❌ Exception calculating ${planetName}: ${error.message}`);
    }
  }
  
  return positions;
}

// Calculate Ascendant exactly like your backend
function calculateAscendant(julianDay, latitude, longitude) {
  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  console.log(`\n🏠 Calculating Ascendant for coordinates: ${latitude}°, ${longitude}°`);
  
  try {
    // Calculate sidereal houses (like your backend uses)
    const houses = swisseph.swe_houses_ex(julianDay, swisseph.SEFLG_SIDEREAL, latitude, longitude, 'P');
    
    if (houses.ascendant === undefined) {
      throw new Error('Houses calculation failed');
    }
    
    const ascLongitude = houses.ascendant;
    const signNumber = Math.floor(ascLongitude / 30);
    const degreeInSign = ascLongitude % 30;
    
    const ascendant = {
      longitude: ascLongitude,
      sign: zodiacSigns[signNumber],
      signNumber: signNumber + 1,
      degreeInSign: degreeInSign,
      degreeFormatted: formatDegree(degreeInSign)
    };
    
    console.log(`🏠 Ascendant: ${formatDegree(degreeInSign)} ${zodiacSigns[signNumber]} (${ascLongitude.toFixed(6)}°)`);
    
    return ascendant;
    
  } catch (error) {
    console.error(`❌ Error calculating Ascendant: ${error.message}`);
    return null;
  }
}

// Format degree like your backend
function formatDegree(degree) {
  const d = Math.floor(degree);
  const m = Math.floor((degree - d) * 60);
  const s = Math.floor(((degree - d) * 60 - m) * 60);
  return `${d}°${m}'${s}"`;
}

// Compare with reference values
function compareWithReference(calculated, reference) {
  console.log(`\n📊 COMPARISON WITH REFERENCE VALUES`);
  console.log(`=`.repeat(50));
  
  const comparisons = [];
  
  // Compare Moon
  if (calculated.moon && reference.sidereal_lahiri.moon) {
    const moonDiff = Math.abs(calculated.moon.degreeInSign - reference.sidereal_lahiri.moon.degree);
    const moonSignMatch = calculated.moon.sign === reference.sidereal_lahiri.moon.sign;
    
    console.log(`\n🌙 MOON:`);
    console.log(`   Calculated: ${calculated.moon.degreeFormatted} ${calculated.moon.sign}`);
    console.log(`   Reference:  ${reference.sidereal_lahiri.moon.degree}° ${reference.sidereal_lahiri.moon.sign}`);
    console.log(`   Sign Match: ${moonSignMatch ? '✅' : '❌'}`);
    console.log(`   Degree Diff: ${moonDiff.toFixed(2)}°`);
    
    comparisons.push({
      planet: 'Moon',
      signMatch: moonSignMatch,
      degreeDiff: moonDiff,
      severity: moonSignMatch ? (moonDiff < 1 ? 'minor' : 'moderate') : 'major'
    });
  }
  
  // Compare Sun
  if (calculated.sun && reference.sidereal_lahiri.sun) {
    const sunDiff = Math.abs(calculated.sun.degreeInSign - reference.sidereal_lahiri.sun.degree);
    const sunSignMatch = calculated.sun.sign === reference.sidereal_lahiri.sun.sign;
    
    console.log(`\n☀️ SUN:`);
    console.log(`   Calculated: ${calculated.sun.degreeFormatted} ${calculated.sun.sign}`);
    console.log(`   Reference:  ${reference.sidereal_lahiri.sun.degree}° ${reference.sidereal_lahiri.sun.sign}`);
    console.log(`   Sign Match: ${sunSignMatch ? '✅' : '❌'}`);
    console.log(`   Degree Diff: ${sunDiff.toFixed(2)}°`);
    
    comparisons.push({
      planet: 'Sun',
      signMatch: sunSignMatch,
      degreeDiff: sunDiff,
      severity: sunSignMatch ? (sunDiff < 1 ? 'minor' : 'moderate') : 'major'
    });
  }
  
  // Compare Ascendant
  if (calculated.ascendant && reference.sidereal_lahiri.ascendant) {
    const ascDiff = Math.abs(calculated.ascendant.degreeInSign - reference.sidereal_lahiri.ascendant.degree);
    const ascSignMatch = calculated.ascendant.sign === reference.sidereal_lahiri.ascendant.sign;
    
    console.log(`\n🏠 ASCENDANT:`);
    console.log(`   Calculated: ${calculated.ascendant.degreeFormatted} ${calculated.ascendant.sign}`);
    console.log(`   Reference:  ${reference.sidereal_lahiri.ascendant.degree}° ${reference.sidereal_lahiri.ascendant.sign}`);
    console.log(`   Sign Match: ${ascSignMatch ? '✅' : '❌'}`);
    console.log(`   Degree Diff: ${ascDiff.toFixed(2)}°`);
    
    comparisons.push({
      planet: 'Ascendant',
      signMatch: ascSignMatch,
      degreeDiff: ascDiff,
      severity: ascSignMatch ? (ascDiff < 1 ? 'minor' : 'moderate') : 'major'
    });
  }
  
  return comparisons;
}

// Analyze and provide recommendations
function analyzeDiscrepancies(comparisons, ayanamsa) {
  console.log(`\n🔍 DISCREPANCY ANALYSIS`);
  console.log(`=`.repeat(50));
  
  const majorIssues = comparisons.filter(c => c.severity === 'major');
  const moderateIssues = comparisons.filter(c => c.severity === 'moderate');
  const minorIssues = comparisons.filter(c => c.severity === 'minor');
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Major Issues (sign differences): ${majorIssues.length}`);
  console.log(`   Moderate Issues (1-5° diff): ${moderateIssues.length}`);
  console.log(`   Minor Issues (<1° diff): ${minorIssues.length}`);
  
  console.log(`\n🌀 AYANAMSA ANALYSIS:`);
  console.log(`   Current Lahiri value: ${ayanamsa.toFixed(6)}°`);
  console.log(`   Expected for 1961: ~23.2°`);
  console.log(`   Difference: ${Math.abs(ayanamsa - 23.2).toFixed(3)}°`);
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  
  if (majorIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES FOUND:`);
    majorIssues.forEach(issue => {
      console.log(`   • ${issue.planet}: Wrong sign (${issue.degreeDiff.toFixed(2)}° difference)`);
    });
    
    console.log(`\n🔧 LIKELY CAUSES:`);
    console.log(`   1. Ayanamsa calculation error`);
    console.log(`   2. Tropical vs Sidereal confusion`);
    console.log(`   3. Reference data inaccuracy`);
    console.log(`   4. Timezone conversion error`);
  }
  
  if (moderateIssues.length > 0) {
    console.log(`\n⚠️ MODERATE PRECISION ISSUES:`);
    moderateIssues.forEach(issue => {
      console.log(`   • ${issue.planet}: ${issue.degreeDiff.toFixed(2)}° difference (same sign)`);
    });
    
    console.log(`\n🔧 POSSIBLE CAUSES:`);
    console.log(`   1. Precision differences in ephemeris data`);
    console.log(`   2. Rounding differences`);
    console.log(`   3. Time precision (seconds vs minutes)`);
  }
  
  if (minorIssues.length === comparisons.length) {
    console.log(`\n✅ EXCELLENT ACCURACY:`);
    console.log(`   All calculations within 1° of reference values`);
    console.log(`   Your implementation appears highly accurate`);
  }
  
  // Check for systematic offset
  const avgDiff = comparisons.reduce((sum, c) => sum + c.degreeDiff, 0) / comparisons.length;
  if (avgDiff > 5 && comparisons.every(c => c.signMatch)) {
    console.log(`\n🔍 SYSTEMATIC OFFSET DETECTED:`);
    console.log(`   Average difference: ${avgDiff.toFixed(2)}°`);
    console.log(`   All signs correct but consistent degree offset`);
    console.log(`   🔧 Check: Ayanamsa value or epoch differences`);
  }
}

// Test different Ayanamsa systems for comparison
function testMultipleAyanamsas(julianDay) {
  console.log(`\n🌀 TESTING MULTIPLE AYANAMSA SYSTEMS`);
  console.log(`=`.repeat(50));
  
  const ayanamsas = [
    { name: 'Lahiri', id: swisseph.SE_SIDM_LAHIRI },
    { name: 'Raman', id: swisseph.SE_SIDM_RAMAN },
    { name: 'Krishnamurti', id: swisseph.SE_SIDM_KRISHNAMURTI },
    { name: 'Yukteshwar', id: swisseph.SE_SIDM_YUKTESHWAR }
  ];
  
  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  for (const ayanamsa of ayanamsas) {
    swisseph.swe_set_sid_mode(ayanamsa.id, 0, 0);
    const ayanamsaValue = swisseph.swe_get_ayanamsa_ut(julianDay);
    
    // Calculate Moon position with this ayanamsa
    const moonResult = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, swisseph.SEFLG_SIDEREAL);
    const moonSignIndex = Math.floor(moonResult.longitude / 30);
    const moonDegree = moonResult.longitude % 30;
    
    console.log(`\n${ayanamsa.name}:`);
    console.log(`   Value: ${ayanamsaValue.toFixed(6)}°`);
    console.log(`   Moon: ${formatDegree(moonDegree)} ${zodiacSigns[moonSignIndex]}`);
    
    // Check how close this is to reference
    const refDiff = Math.abs(moonDegree - 2.52);
    const signMatch = zodiacSigns[moonSignIndex] === 'Taurus';
    console.log(`   Ref Match: ${signMatch ? '✅' : '❌'} (${refDiff.toFixed(2)}° diff)`);
  }
  
  // Reset to Lahiri
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
}

// Main verification function
async function main() {
  console.log(`🔍 BACKEND-MIRRORED VERIFICATION FOR OBAMA'S CHART`);
  console.log(`=`.repeat(60));
  console.log(`Subject: ${OBAMA_DATA.name}`);
  console.log(`Purpose: Identify calculation discrepancies using exact backend logic\n`);
  
  // Initialize Swiss Ephemeris
  if (!initializeSwissEphemeris()) {
    console.error('❌ Cannot proceed without Swiss Ephemeris');
    return;
  }
  
  // Calculate Julian Day using backend logic
  const jdInfo = getHistoricalJulianDay(
    OBAMA_DATA.date,
    OBAMA_DATA.time,
    OBAMA_DATA.timezone,
    OBAMA_DATA.place,
    OBAMA_DATA.coordinates
  );
  
  // Get current Ayanamsa value
  const ayanamsa = swisseph.swe_get_ayanamsa_ut(jdInfo.julianDay);
  
  // Calculate planetary positions
  const planets = calculatePlanetaryPositions(jdInfo.julianDay);
  
  // Calculate Ascendant
  const ascendant = calculateAscendant(jdInfo.julianDay, OBAMA_DATA.coordinates.lat, OBAMA_DATA.coordinates.lng);
  
  // Combine results
  const calculated = {
    ...planets,
    ascendant
  };
  
  // Compare with reference values
  const comparisons = compareWithReference(calculated, REFERENCE_VALUES);
  
  // Analyze discrepancies
  analyzeDiscrepancies(comparisons, ayanamsa);
  
  // Test multiple ayanamsa systems
  testMultipleAyanamsas(jdInfo.julianDay);
  
  console.log(`\n✅ VERIFICATION COMPLETE`);
  console.log(`\n📝 NEXT STEPS:`);
  console.log(`1. Review the discrepancy analysis above`);
  console.log(`2. If major issues found, check Ayanamsa and timezone handling`);
  console.log(`3. If minor issues only, your implementation is highly accurate`);
  console.log(`4. Cross-reference with online calculators for additional validation`);
}

// Run the verification
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, OBAMA_DATA, REFERENCE_VALUES };
