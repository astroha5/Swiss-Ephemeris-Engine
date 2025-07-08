#!/usr/bin/env node

/**
 * ADVANCED CALCULATION DEBUGGING SCRIPT
 * 
 * This script implements ChatGPT's recommendations to identify the root cause
 * of systematic Moon sign and Ascendant calculation errors.
 * 
 * It will:
 * 1. Log detailed calculation steps
 * 2. Compare with known reference values
 * 3. Test timezone/Julian Day conversion
 * 4. Verify Ayanamsa application
 * 5. Cross-reference with Swiss Ephemeris command line
 */

const axios = require('axios');
const swisseph = require('swisseph');
const moment = require('moment-timezone');
const path = require('path');

// Test cases with expected values for verification
const TEST_CASES = [
  {
    name: "Barack Obama",
    date: "1961-08-04",
    time: "19:24",
    timezone: "Pacific/Honolulu",
    coordinates: { lat: 21.3099, lng: -157.8581 },
    expected: {
      jd_approximate: 2437516.725,  // Approximate JD for verification
      moon_tropical_deg: 63.35,     // Approximate tropical Moon longitude
      moon_sidereal_deg: 40.03,     // Approximate sidereal Moon longitude
      moon_sign: "Taurus",          // Expected sidereal Moon sign
      ayanamsa: 23.32               // Expected Lahiri Ayanamsa for 1961
    }
  },
  {
    name: "John F. Kennedy", 
    date: "1917-05-29",
    time: "15:00",
    timezone: "America/New_York", 
    coordinates: { lat: 42.3, lng: -71.1 },
    expected: {
      jd_approximate: 2421377.896,
      moon_sign: "Virgo",
      ayanamsa: 22.46
    }
  },
  {
    name: "Oprah Winfrey",
    date: "1954-01-29", 
    time: "04:30",
    timezone: "America/Chicago",
    coordinates: { lat: 33.7, lng: -90.7 },
    expected: {
      jd_approximate: 2434771.458,
      moon_sign: "Scorpio",
      ayanamsa: 23.14
    }
  }
];

/**
 * Step 1: Test Direct Swiss Ephemeris Calculations
 */
function testDirectSwissEphemeris(testCase) {
  console.log(`\n🔬 DIRECT SWISS EPHEMERIS TEST: ${testCase.name}`);
  console.log('='.repeat(60));
  
  try {
    // Initialize Swiss Ephemeris
    const ephePath = path.join(__dirname, 'backend', 'ephemeris');
    swisseph.swe_set_ephe_path(ephePath);
    
    // Convert to UTC step by step
    const localTime = moment.tz(`${testCase.date} ${testCase.time}`, testCase.timezone);
    const utcTime = localTime.utc();
    
    console.log(`📅 Input: ${testCase.date} ${testCase.time} (${testCase.timezone})`);
    console.log(`🕐 Local: ${localTime.format('YYYY-MM-DD HH:mm:ss z')}`);
    console.log(`🌍 UTC:   ${utcTime.format('YYYY-MM-DD HH:mm:ss z')}`);
    
    // Calculate Julian Day
    const julianDay = swisseph.swe_julday(
      utcTime.year(),
      utcTime.month() + 1,
      utcTime.date(),
      utcTime.hour() + utcTime.minute()/60 + utcTime.second()/3600,
      swisseph.SE_GREG_CAL
    );
    
    console.log(`📊 Julian Day: ${julianDay.toFixed(8)}`);
    console.log(`📊 Expected JD: ${testCase.expected.jd_approximate || 'N/A'}`);
    
    if (testCase.expected.jd_approximate) {
      const jdDiff = Math.abs(julianDay - testCase.expected.jd_approximate);
      console.log(`📊 JD Difference: ${jdDiff.toFixed(6)} ${jdDiff < 0.1 ? '✅' : '❌'}`);
    }
    
    // Set Lahiri Ayanamsa
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    const ayanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
    
    console.log(`🌀 Ayanamsa: ${ayanamsa.toFixed(6)}°`);
    console.log(`🌀 Expected: ${testCase.expected.ayanamsa || 'N/A'}°`);
    
    // Calculate Moon - Tropical first
    const moonTropical = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, swisseph.SEFLG_SPEED);
    console.log(`🌙 Moon Tropical: ${moonTropical.longitude.toFixed(6)}°`);
    
    // Calculate Moon - Sidereal
    const moonSidereal = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED);
    console.log(`🌙 Moon Sidereal: ${moonSidereal.longitude.toFixed(6)}°`);
    
    // Calculate signs
    const tropicalSign = getSignFromLongitude(moonTropical.longitude);
    const siderealSign = getSignFromLongitude(moonSidereal.longitude);
    
    console.log(`🌙 Tropical Sign: ${tropicalSign.degree.toFixed(2)}° ${tropicalSign.sign}`);
    console.log(`🌙 Sidereal Sign: ${siderealSign.degree.toFixed(2)}° ${siderealSign.sign}`);
    console.log(`🌙 Expected Sign: ${testCase.expected.moon_sign}`);
    console.log(`🌙 Match: ${siderealSign.sign === testCase.expected.moon_sign ? '✅' : '❌'}`);
    
    // Manual Ayanamsa verification
    const manualSidereal = moonTropical.longitude - ayanamsa;
    const adjustedSidereal = manualSidereal < 0 ? manualSidereal + 360 : manualSidereal;
    const manualSign = getSignFromLongitude(adjustedSidereal);
    
    console.log(`🔧 Manual Sidereal: ${adjustedSidereal.toFixed(6)}° (${manualSign.degree.toFixed(2)}° ${manualSign.sign})`);
    console.log(`🔧 Swiss vs Manual: ${Math.abs(moonSidereal.longitude - adjustedSidereal).toFixed(6)}° difference`);
    
    return {
      julianDay,
      ayanamsa,
      moonTropical: moonTropical.longitude,
      moonSidereal: moonSidereal.longitude,
      siderealSign: siderealSign.sign,
      expectedSign: testCase.expected.moon_sign,
      match: siderealSign.sign === testCase.expected.moon_sign
    };
    
  } catch (error) {
    console.error(`❌ Error in direct calculation: ${error.message}`);
    return null;
  }
}

/**
 * Step 2: Test Your Backend API
 */
async function testBackendAPI(testCase) {
  console.log(`\n🔗 BACKEND API TEST: ${testCase.name}`);
  console.log('='.repeat(60));
  
  try {
    const payload = {
      date: testCase.date,
      time: testCase.time,
      latitude: testCase.coordinates.lat,
      longitude: testCase.coordinates.lng,
      timezone: testCase.timezone,
      name: testCase.name,
      place: "Test Location"
    };
    
    console.log(`📤 Sending to API: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await axios.post('http://localhost:3001/api/kundli', payload);
    
    if (!response.data.success) {
      console.log(`❌ API Error: ${response.data.error}`);
      return null;
    }
    
    const result = response.data.data.chartSummary;
    
    console.log(`📥 API Response:`);
    console.log(`   Moon: ${result.moonSign.degree} ${result.moonSign.sign}`);
    console.log(`   Ascendant: ${result.ascendant.degree} ${result.ascendant.sign}`);
    console.log(`   Expected Moon: ${testCase.expected.moon_sign}`);
    console.log(`   Match: ${result.moonSign.sign === testCase.expected.moon_sign ? '✅' : '❌'}`);
    
    return {
      moonSign: result.moonSign.sign,
      ascendantSign: result.ascendant.sign,
      moonDegree: result.moonSign.degree,
      ascendantDegree: result.ascendant.degree,
      expectedMoonSign: testCase.expected.moon_sign,
      match: result.moonSign.sign === testCase.expected.moon_sign
    };
    
  } catch (error) {
    console.error(`❌ API Error: ${error.message}`);
    return null;
  }
}

/**
 * Get sign from longitude
 */
function getSignFromLongitude(longitude) {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const signIndex = Math.floor(longitude / 30);
  const degreeInSign = longitude % 30;
  return {
    sign: signs[signIndex],
    degree: degreeInSign,
    signIndex: signIndex
  };
}

/**
 * Main debugging function
 */
async function runDebugging() {
  console.log('🚨 ADVANCED CALCULATION DEBUGGING');
  console.log('='.repeat(80));
  console.log('Purpose: Identify root cause of systematic Moon sign errors');
  console.log('Approach: Step-by-step verification of calculations\n');
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    console.log(`\n${'🔎'.repeat(20)} ${testCase.name.toUpperCase()} ${'🔎'.repeat(20)}`);
    
    // Test direct Swiss Ephemeris
    const directResult = testDirectSwissEphemeris(testCase);
    
    // Test backend API
    const apiResult = await testBackendAPI(testCase);
    
    // Compare results
    if (directResult && apiResult) {
      console.log(`\n📊 COMPARISON ANALYSIS:`);
      console.log(`   Direct Swiss: ${directResult.siderealSign} ${directResult.match ? '✅' : '❌'}`);
      console.log(`   Backend API:  ${apiResult.moonSign} ${apiResult.match ? '✅' : '❌'}`);
      console.log(`   Consistency:  ${directResult.siderealSign === apiResult.moonSign ? '✅' : '❌'}`);
      
      if (directResult.siderealSign !== apiResult.moonSign) {
        console.log(`   🚨 BACKEND INCONSISTENCY DETECTED!`);
        console.log(`   🔧 Backend may have different calculation logic`);
      }
    }
    
    results.push({
      name: testCase.name,
      direct: directResult,
      api: apiResult
    });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final analysis
  console.log(`\n${'📈'.repeat(20)} FINAL ANALYSIS ${'📈'.repeat(20)}`);
  
  const directMatches = results.filter(r => r.direct?.match).length;
  const apiMatches = results.filter(r => r.api?.match).length;
  const consistentResults = results.filter(r => r.direct?.siderealSign === r.api?.moonSign).length;
  
  console.log(`\n📊 SUMMARY STATISTICS:`);
  console.log(`   Direct Swiss Ephemeris Matches: ${directMatches}/${results.length}`);
  console.log(`   Backend API Matches: ${apiMatches}/${results.length}`);
  console.log(`   Direct vs API Consistency: ${consistentResults}/${results.length}`);
  
  console.log(`\n🔍 ROOT CAUSE ANALYSIS:`);
  
  if (directMatches === results.length) {
    console.log(`✅ Direct Swiss Ephemeris calculations are PERFECT`);
    if (apiMatches < directMatches) {
      console.log(`🚨 Issue is in your BACKEND WRAPPER CODE`);
      console.log(`🔧 Check: timezone conversion, Julian Day calculation, or Ayanamsa application`);
    }
  } else {
    console.log(`❌ Direct Swiss Ephemeris calculations are failing`);
    console.log(`🔧 Check: Swiss Ephemeris setup, Ayanamsa mode, or reference data accuracy`);
  }
  
  if (consistentResults < results.length) {
    console.log(`🚨 Backend API produces different results than direct Swiss Ephemeris`);
    console.log(`🔧 Your backend is not correctly calling Swiss Ephemeris`);
  }
  
  console.log(`\n💡 NEXT STEPS:`);
  console.log(`1. If direct calculations are wrong: Check reference data or Swiss Ephemeris setup`);
  console.log(`2. If backend differs from direct: Debug your wrapper code`);
  console.log(`3. If both are consistently wrong: Check timezone handling or Ayanamsa`);
  console.log(`4. Compare Julian Days with online calculators for verification`);
  
  return results;
}

// Run the debugging
if (require.main === module) {
  runDebugging().catch(console.error);
}

module.exports = { runDebugging, testDirectSwissEphemeris };
