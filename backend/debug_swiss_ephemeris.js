#!/usr/bin/env node

/**
 * Standalone Swiss Ephemeris Debug Script
 * 
 * This script tests raw Swiss Ephemeris calculations with minimal wrapper code
 * to isolate potential issues in our astrological calculations.
 * 
 * Run with: node backend/debug_swiss_ephemeris.js
 */

const swisseph = require('swisseph');

// Test case: Barack Obama
// Birth: August 4, 1961, 19:24 (7:24 PM), Honolulu, Hawaii
// Expected results from multiple online calculators:
// - Moon: ~2° Gemini (Sidereal/Lahiri)
// - Ascendant: ~18° Aquarius (Sidereal/Lahiri)

const testCase = {
  name: "Barack Obama",
  year: 1961,
  month: 8,
  day: 4,
  hour: 19,
  minute: 24,
  second: 0,
  latitude: 21.3099,    // Honolulu
  longitude: -157.8581, // Honolulu
  timezone: -10,        // Hawaii Standard Time
  expectedMoon: "2° Gemini",
  expectedAscendant: "18° Aquarius"
};

/**
 * Convert date/time to Julian Day
 */
function calculateJulianDay(year, month, day, hour, minute, second, timezone) {
  // Convert local time to UTC with proper date rollover handling
  let utcYear = year;
  let utcMonth = month;
  let utcDay = day;
  let utcHour = hour - timezone;
  
  // Handle hour overflow/underflow with date adjustment
  if (utcHour >= 24) {
    utcHour -= 24;
    utcDay += 1;
    
    // Handle day overflow
    const daysInMonth = getDaysInMonth(utcYear, utcMonth);
    if (utcDay > daysInMonth) {
      utcDay = 1;
      utcMonth += 1;
      
      // Handle month overflow
      if (utcMonth > 12) {
        utcMonth = 1;
        utcYear += 1;
      }
    }
  } else if (utcHour < 0) {
    utcHour += 24;
    utcDay -= 1;
    
    // Handle day underflow
    if (utcDay < 1) {
      utcMonth -= 1;
      
      // Handle month underflow
      if (utcMonth < 1) {
        utcMonth = 12;
        utcYear -= 1;
      }
      
      utcDay = getDaysInMonth(utcYear, utcMonth);
    }
  }
  
  const utcTime = utcHour + minute/60 + second/3600;
  
  console.log(`🕐 Local time: ${year}-${month}-${day} ${hour}:${minute}:${second} (TZ: ${timezone})`);
  console.log(`🌍 UTC time: ${utcYear}-${utcMonth}-${utcDay} ${utcTime.toFixed(6)}`);
  
  const julianDay = swisseph.swe_julday(utcYear, utcMonth, utcDay, utcTime, swisseph.SE_GREG_CAL);
  console.log(`📅 Julian Day: ${julianDay.toFixed(8)}`);
  
  return julianDay;
}

/**
 * Get number of days in a month, accounting for leap years
 */
function getDaysInMonth(year, month) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  
  return daysInMonth[month - 1];
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Test planetary position calculation
 */
function testPlanetaryPosition(julianDay, planetId, planetName) {
  console.log(`\n🌟 Testing ${planetName} (ID: ${planetId}):`);
  
  try {
    // Calculate with TROPICAL (default)
    const tropicalResult = swisseph.swe_calc_ut(julianDay, planetId, swisseph.SEFLG_SPEED);
    if (tropicalResult.flag < 0) {
      console.error(`❌ Tropical calculation failed: ${tropicalResult.serr}`);
      return;
    }
    console.log(`🌡️  Tropical longitude: ${tropicalResult.longitude.toFixed(8)}°`);
    
    // Calculate with SIDEREAL (Lahiri)
    const siderealResult = swisseph.swe_calc_ut(julianDay, planetId, swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED);
    if (siderealResult.flag < 0) {
      console.error(`❌ Sidereal calculation failed: ${siderealResult.serr}`);
      return;
    }
    console.log(`🌌 Sidereal longitude: ${siderealResult.longitude.toFixed(8)}°`);
    
    // Calculate sign and degree
    const signIndex = Math.floor(siderealResult.longitude / 30);
    const degreeInSign = siderealResult.longitude % 30;
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    
    console.log(`📐 Sidereal position: ${degreeInSign.toFixed(2)}° ${signs[signIndex]} (Sign ${signIndex + 1})`);
    
    // Calculate difference (Ayanamsa effect)
    const difference = tropicalResult.longitude - siderealResult.longitude;
    console.log(`🔄 Tropical-Sidereal difference: ${difference.toFixed(6)}° (should be ~24° for Lahiri)`);
    
    return {
      tropical: tropicalResult.longitude,
      sidereal: siderealResult.longitude,
      sign: signs[signIndex],
      degree: degreeInSign,
      difference: difference
    };
    
  } catch (error) {
    console.error(`❌ Error calculating ${planetName}:`, error);
    return null;
  }
}

/**
 * Test Ascendant calculation
 */
function testAscendant(julianDay, latitude, longitude) {
  console.log(`\n🏠 Testing Ascendant calculation:`);
  console.log(`📍 Coordinates: ${latitude}°, ${longitude}°`);
  
  try {
    // Calculate with TROPICAL houses
    const tropicalHouses = swisseph.swe_houses_ex(julianDay, 0, latitude, longitude, 'P');
    if (tropicalHouses.flag < 0) {
      console.error(`❌ Tropical houses calculation failed: ${tropicalHouses.serr}`);
      return;
    }
    console.log(`🌡️  Tropical Ascendant: ${tropicalHouses.ascendant.toFixed(8)}°`);
    
    // Calculate with SIDEREAL houses
    const siderealHouses = swisseph.swe_houses_ex(julianDay, swisseph.SEFLG_SIDEREAL, latitude, longitude, 'P');
    if (siderealHouses.flag < 0) {
      console.error(`❌ Sidereal houses calculation failed: ${siderealHouses.serr}`);
      return;
    }
    console.log(`🌌 Sidereal Ascendant: ${siderealHouses.ascendant.toFixed(8)}°`);
    
    // Calculate sign and degree for sidereal
    const signIndex = Math.floor(siderealHouses.ascendant / 30);
    const degreeInSign = siderealHouses.ascendant % 30;
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    
    console.log(`📐 Sidereal Ascendant: ${degreeInSign.toFixed(2)}° ${signs[signIndex]} (Sign ${signIndex + 1})`);
    
    // Calculate difference
    const difference = tropicalHouses.ascendant - siderealHouses.ascendant;
    console.log(`🔄 Tropical-Sidereal difference: ${difference.toFixed(6)}° (should be ~24° for Lahiri)`);
    
    return {
      tropical: tropicalHouses.ascendant,
      sidereal: siderealHouses.ascendant,
      sign: signs[signIndex],
      degree: degreeInSign,
      difference: difference
    };
    
  } catch (error) {
    console.error(`❌ Error calculating Ascendant:`, error);
    return null;
  }
}

/**
 * Test Ayanamsa value
 */
function testAyanamsa(julianDay) {
  console.log(`\n🌀 Testing Ayanamsa:`);
  
  try {
    // Set and test different Ayanamsa modes
    const ayanamsas = [
      { name: 'Lahiri', mode: swisseph.SE_SIDM_LAHIRI },
      { name: 'Raman', mode: swisseph.SE_SIDM_RAMAN },
      { name: 'Krishnamurti', mode: swisseph.SE_SIDM_KRISHNAMURTI }
    ];
    
    for (const ayanamsa of ayanamsas) {
      swisseph.swe_set_sid_mode(ayanamsa.mode, 0, 0);
      const value = swisseph.swe_get_ayanamsa_ut(julianDay);
      console.log(`🔢 ${ayanamsa.name} Ayanamsa: ${value.toFixed(8)}°`);
    }
    
    // Set back to Lahiri for consistency
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    const lahiriValue = swisseph.swe_get_ayanamsa_ut(julianDay);
    
    return lahiriValue;
    
  } catch (error) {
    console.error(`❌ Error calculating Ayanamsa:`, error);
    return null;
  }
}

/**
 * Test Swiss Ephemeris setup and version
 */
function testSwissEphemerisSetup() {
  console.log('\n🔧 Testing Swiss Ephemeris setup:');
  
  try {
    // Get Swiss Ephemeris version
    const version = swisseph.swe_version();
    console.log(`📦 Swiss Ephemeris version: ${version}`);
    
    // Set ephemeris path
    const ephePath = require('path').join(__dirname, 'ephemeris');
    swisseph.swe_set_ephe_path(ephePath);
    console.log(`📁 Ephemeris path set to: ${ephePath}`);
    
    // Test if data files are accessible by calculating a simple position
    const testJd = 2451545.0; // J2000.0 epoch
    const testResult = swisseph.swe_calc_ut(testJd, swisseph.SE_SUN, 0);
    
    if (testResult.flag < 0) {
      console.error(`❌ Swiss Ephemeris data test failed: ${testResult.serr}`);
      return false;
    } else {
      console.log(`✅ Swiss Ephemeris data files accessible`);
      console.log(`🌞 Test Sun position at J2000.0: ${testResult.longitude.toFixed(6)}°`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Swiss Ephemeris setup error:`, error);
    return false;
  }
}

/**
 * Main test function
 */
function runTests() {
  console.log('🚀 Swiss Ephemeris Debug Test');
  console.log('============================\n');
  
  // Test Swiss Ephemeris setup first
  if (!testSwissEphemerisSetup()) {
    console.error('❌ Swiss Ephemeris setup failed. Cannot proceed with tests.');
    return;
  }
  
  console.log(`\n📋 Test Case: ${testCase.name}`);
  console.log(`🎯 Expected Moon: ${testCase.expectedMoon}`);
  console.log(`🎯 Expected Ascendant: ${testCase.expectedAscendant}\n`);
  
  // Calculate Julian Day
  const julianDay = calculateJulianDay(
    testCase.year, testCase.month, testCase.day,
    testCase.hour, testCase.minute, testCase.second,
    testCase.timezone
  );
  
  // Set Lahiri Ayanamsa mode
  console.log(`\n🔧 Setting Lahiri Ayanamsa mode...`);
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  
  // Test Ayanamsa value
  const ayanamsa = testAyanamsa(julianDay);
  
  // Test planetary positions
  const planets = [
    { id: swisseph.SE_SUN, name: 'Sun' },
    { id: swisseph.SE_MOON, name: 'Moon' },
    { id: swisseph.SE_MARS, name: 'Mars' },
    { id: swisseph.SE_MERCURY, name: 'Mercury' },
    { id: swisseph.SE_JUPITER, name: 'Jupiter' },
    { id: swisseph.SE_VENUS, name: 'Venus' },
    { id: swisseph.SE_SATURN, name: 'Saturn' }
  ];
  
  const results = {};
  for (const planet of planets) {
    results[planet.name] = testPlanetaryPosition(julianDay, planet.id, planet.name);
  }
  
  // Test Ascendant
  results.Ascendant = testAscendant(julianDay, testCase.latitude, testCase.longitude);
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`⏰ Julian Day: ${julianDay.toFixed(8)}`);
  console.log(`🌀 Lahiri Ayanamsa: ${ayanamsa ? ayanamsa.toFixed(6) + '°' : 'N/A'}`);
  
  if (results.Moon) {
    console.log(`🌙 Moon: ${results.Moon.degree.toFixed(2)}° ${results.Moon.sign} (Expected: ${testCase.expectedMoon})`);
  }
  
  if (results.Ascendant) {
    console.log(`🏠 Ascendant: ${results.Ascendant.degree.toFixed(2)}° ${results.Ascendant.sign} (Expected: ${testCase.expectedAscendant})`);
  }
  
  // Expected Lahiri Ayanamsa for 1961 should be around 23.2°
  if (ayanamsa) {
    const expectedAyanamsa = 23.2; // Approximate for 1961
    const ayanamsaDiff = Math.abs(ayanamsa - expectedAyanamsa);
    console.log(`🎯 Ayanamsa check: ${ayanamsa.toFixed(2)}° vs ~${expectedAyanamsa}° (diff: ${ayanamsaDiff.toFixed(2)}°)`);
  }
  
  console.log('\n✅ Test completed. Check the values against expected results.');
  console.log('💡 If Moon shows significantly different degrees/sign, there may be an issue with Swiss Ephemeris integration.');
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testCase };
