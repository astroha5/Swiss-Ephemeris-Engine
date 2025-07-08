#!/usr/bin/env node

/**
 * Moon Verification Debug Script
 * Precise diagnosis of Moon sign calculations with reference comparison
 * Based on ChatGPT recommendations for achieving 90%+ accuracy
 */

const moment = require('moment-timezone');
const logger = require('./utils/logger');
const enhancedSwissEph = require('./services/enhancedSwissEphemeris');
const historicalTimezoneHandler = require('./services/historicalTimezoneHandler');

// Known test cases with verified reference data
const moonTestCases = [
  {
    name: "John F. Kennedy",
    date: "1917-05-29",
    time: "15:00",
    latitude: 42.3,
    longitude: -71.1,
    timezone: "America/New_York",
    place: "Brookline, MA, USA",
    expected: {
      moon: "Virgo",
      expectedMoonLongitude: 174.5, // Approximate - will verify
      expectedAyanamsa: 22.46, // 1917 Lahiri
      expectedUTC: "1917-05-29T20:00:00Z",
      expectedJD: 2421378.3333,
      source: "Astro-Databank + JHora verification"
    }
  },
  {
    name: "Oprah Winfrey", 
    date: "1954-01-29",
    time: "04:30",
    latitude: 33.7,
    longitude: -90.7,
    timezone: "America/Chicago",
    place: "Kosciusko, MS, USA",
    expected: {
      moon: "Scorpio",
      expectedMoonLongitude: 221.3, // Should be in Scorpio (210-240°)
      expectedAyanamsa: 23.22, // 1954 Lahiri
      expectedUTC: "1954-01-29T10:30:00Z", // Central = UTC-6
      expectedJD: 2434771.9375,
      source: "Verified working case"
    }
  },
  {
    name: "Adolf Hitler",
    date: "1889-04-20",
    time: "18:30",
    latitude: 48.3,
    longitude: 13.1,
    timezone: "Europe/Berlin",
    place: "Braunau am Inn, Austria",
    expected: {
      moon: "Capricorn",
      expectedMoonLongitude: 284.0, // Should be in Capricorn (270-300°)
      expectedAyanamsa: 22.18, // 1889 Lahiri
      expectedUTC: "1889-04-20T17:38:00Z", // LMT calculation
      expectedJD: 2411113.2347,
      source: "AstroSage + JHora"
    }
  }
];

async function verifyMoonCalculation(testCase) {
  console.log(`\n🔬 MOON VERIFICATION: ${testCase.name}`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Timezone & UTC Conversion
    console.log('\n📅 STEP 1: UTC CONVERSION VERIFICATION');
    console.log('─'.repeat(40));
    
    const coordinates = { lat: testCase.latitude, lng: testCase.longitude };
    const conversion = historicalTimezoneHandler.convertToUTC(
      testCase.date, testCase.time, testCase.place, coordinates, testCase.timezone
    );
    
    const actualUTC = conversion.utcMoment.format('YYYY-MM-DDTHH:mm:ss[Z]');
    const utcMatch = actualUTC === testCase.expected.expectedUTC;
    
    console.log(`Expected UTC: ${testCase.expected.expectedUTC}`);
    console.log(`Actual UTC:   ${actualUTC}`);
    console.log(`UTC Match:    ${utcMatch ? '✅' : '❌'}`);
    
    if (!utcMatch) {
      const expectedMoment = moment.utc(testCase.expected.expectedUTC);
      const actualMoment = conversion.utcMoment;
      const diffMinutes = actualMoment.diff(expectedMoment, 'minutes');
      console.log(`⚠️  UTC Difference: ${diffMinutes} minutes`);
    }
    
    // Step 2: Julian Day Verification
    console.log('\n📊 STEP 2: JULIAN DAY VERIFICATION');
    console.log('─'.repeat(40));
    
    const julianDay = enhancedSwissEph.getJulianDay(
      testCase.date, testCase.time, testCase.timezone, testCase.place, coordinates
    );
    
    const jdDiff = Math.abs(julianDay - testCase.expected.expectedJD);
    const jdMatch = jdDiff < 0.01; // Within ~14 minutes
    
    console.log(`Expected JD: ${testCase.expected.expectedJD}`);
    console.log(`Actual JD:   ${julianDay.toFixed(8)}`);
    console.log(`JD Match:    ${jdMatch ? '✅' : '❌'} (diff: ${jdDiff.toFixed(8)})`);
    
    // Step 3: Ayanamsa Verification
    console.log('\n📐 STEP 3: AYANAMSA VERIFICATION');
    console.log('─'.repeat(40));
    
    const swisseph = require('swisseph');
    const actualAyanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
    const ayanamsaDiff = Math.abs(actualAyanamsa - testCase.expected.expectedAyanamsa);
    const ayanamsaMatch = ayanamsaDiff < 0.1; // Within 6 arcminutes
    
    console.log(`Expected Ayanamsa: ${testCase.expected.expectedAyanamsa}°`);
    console.log(`Actual Ayanamsa:   ${actualAyanamsa.toFixed(6)}°`);
    console.log(`Ayanamsa Match:    ${ayanamsaMatch ? '✅' : '❌'} (diff: ${ayanamsaDiff.toFixed(6)}°)`);
    
    // Step 4: Moon Position Verification
    console.log('\n🌙 STEP 4: MOON POSITION VERIFICATION');
    console.log('─'.repeat(40));
    
    const planetaryResult = enhancedSwissEph.getPlanetaryPositions(julianDay);
    const moonData = planetaryResult.planets.moon;
    
    const moonLongDiff = Math.abs(moonData.longitude - testCase.expected.expectedMoonLongitude);
    const actualMoonSign = moonData.sign;
    const moonSignMatch = actualMoonSign === testCase.expected.moon;
    
    console.log(`Expected Moon Sign: ${testCase.expected.moon}`);
    console.log(`Actual Moon Sign:   ${actualMoonSign}`);
    console.log(`Moon Sign Match:    ${moonSignMatch ? '✅' : '❌'}`);
    console.log(`Expected Longitude: ~${testCase.expected.expectedMoonLongitude}°`);
    console.log(`Actual Longitude:   ${moonData.longitude.toFixed(6)}°`);
    console.log(`Longitude Diff:     ${moonLongDiff.toFixed(6)}°`);
    
    // Step 5: Tropical vs Sidereal Cross-Check
    console.log('\n🌍 STEP 5: TROPICAL vs SIDEREAL CROSS-CHECK');
    console.log('─'.repeat(40));
    
    const tropicalFlags = swisseph.SEFLG_SPEED;
    const siderealFlags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;
    
    const moonTropical = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, tropicalFlags);
    const moonSidereal = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, siderealFlags);
    
    if (moonTropical.rflag >= 0 && moonSidereal.rflag >= 0) {
      const tropicalSign = enhancedSwissEph.zodiacSigns[Math.floor(moonTropical.longitude / 30)];
      const siderealSign = enhancedSwissEph.zodiacSigns[Math.floor(moonSidereal.longitude / 30)];
      const systemDiff = moonTropical.longitude - moonSidereal.longitude;
      
      console.log(`Tropical Moon:  ${moonTropical.longitude.toFixed(6)}° (${tropicalSign})`);
      console.log(`Sidereal Moon:  ${moonSidereal.longitude.toFixed(6)}° (${siderealSign})`);
      console.log(`System Diff:    ${systemDiff.toFixed(6)}° (should ≈ ${actualAyanamsa.toFixed(2)}°)`);
      console.log(`Ayanamsa Check: ${Math.abs(systemDiff - actualAyanamsa) < 0.1 ? '✅' : '❌'}`);
    }
    
    // Step 6: Summary & Recommendations
    console.log('\n💡 STEP 6: DIAGNOSIS & RECOMMENDATIONS');
    console.log('─'.repeat(40));
    
    const overallMatch = utcMatch && jdMatch && ayanamsaMatch && moonSignMatch;
    
    if (overallMatch) {
      console.log('🎉 PERFECT MATCH! All calculations are correct.');
    } else {
      console.log('❌ DISCREPANCIES FOUND:');
      
      if (!utcMatch) {
        console.log('   🔧 Fix UTC conversion (timezone handling)');
      }
      if (!jdMatch) {
        console.log('   🔧 Fix Julian Day calculation (time precision)');
      }
      if (!ayanamsaMatch) {
        console.log('   🔧 Fix Ayanamsa (Lahiri implementation or epoch)');
      }
      if (!moonSignMatch) {
        console.log('   🔧 Fix Moon calculation (sidereal mode or boundaries)');
        
        // Boundary analysis
        const moonDegreeInSign = moonData.longitude % 30;
        if (moonDegreeInSign < 2 || moonDegreeInSign > 28) {
          console.log(`   ⚠️  Moon is near sign boundary (${moonDegreeInSign.toFixed(4)}° in sign)`);
          console.log('   📊 Small timing errors can cause sign shifts near boundaries');
        }
      }
    }
    
    console.log(`\n📚 Reference: ${testCase.expected.source}`);
    
    return {
      name: testCase.name,
      overallMatch,
      utcMatch,
      jdMatch,
      ayanamsaMatch,
      moonSignMatch,
      details: {
        actualUTC,
        julianDay,
        actualAyanamsa,
        moonLongitude: moonData.longitude,
        moonSign: actualMoonSign
      }
    };
    
  } catch (error) {
    console.error(`❌ Verification failed for ${testCase.name}:`, error.message);
    return {
      name: testCase.name,
      overallMatch: false,
      error: error.message
    };
  }
}

async function runMoonVerificationSuite() {
  console.log('🔬 MOON VERIFICATION SUITE');
  console.log('🎯 Goal: Achieve 90%+ Moon sign accuracy');
  console.log('📊 Testing against verified reference data\n');
  
  const results = [];
  
  for (const testCase of moonTestCases) {
    const result = await verifyMoonVerification(testCase);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary Report
  console.log('\n📊 VERIFICATION SUITE SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.overallMatch);
  const successRate = (successful.length / results.length) * 100;
  
  console.log(`Overall Success Rate: ${successful.length}/${results.length} (${successRate.toFixed(1)}%)`);
  
  console.log('\nDetailed Results:');
  results.forEach(r => {
    const status = r.overallMatch ? '✅' : '❌';
    console.log(`${status} ${r.name}: ${r.overallMatch ? 'PERFECT' : 'ISSUES FOUND'}`);
    if (r.error) {
      console.log(`     Error: ${r.error}`);
    }
  });
  
  if (successRate < 90) {
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Fix identified UTC/JD/Ayanamsa issues');
    console.log('2. Re-run verification suite');
    console.log('3. Compare with JHora/AstroSage for boundary cases');
    console.log('4. Consider minor Ayanamsa epoch adjustments if needed');
  } else {
    console.log('\n🎉 EXCELLENT! Ready for production use.');
  }
}

// Export for external use
async function verifyMoonVerification(testCase) {
  return await verifyMoonCalculation(testCase);
}

module.exports = { verifyMoonVerification, runMoonVerificationSuite };

// Run if called directly
if (require.main === module) {
  runMoonVerificationSuite().catch(console.error);
}
