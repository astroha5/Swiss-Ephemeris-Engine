#!/usr/bin/env node

/**
 * Detailed astronomical debugging script to analyze calculation discrepancies
 * Focuses on comparing our calculations with expected Astro-Databank verified values
 */

const moment = require('moment-timezone');
const logger = require('./utils/logger');
const enhancedSwissEph = require('./services/enhancedSwissEphemeris');
const historicalTimezoneHandler = require('./services/historicalTimezoneHandler');

// Test case: Oprah Winfrey (only one with correct Moon sign in our batch)
const testCase = {
  name: "Oprah Winfrey",
  date: "1954-01-29",
  time: "04:30",
  latitude: 33.7,
  longitude: -90.7,
  timezone: "America/Chicago",
  place: "Kosciusko, MS, USA",
  expected: { 
    ascendant: "Sagittarius", 
    moon: "Scorpio",
    // Additional verified data points for deeper analysis
    sun: "Capricorn", // We can verify this
    mercury: "Aquarius",
    venus: "Aquarius"
  }
};

async function debugAstronomicalCalculations() {
  console.log('🔍 DETAILED ASTRONOMICAL DEBUGGING');
  console.log('==================================');
  console.log(`\n📊 Test Case: ${testCase.name}`);
  console.log(`📅 Birth: ${testCase.date} ${testCase.time} (${testCase.timezone})`);
  console.log(`📍 Location: ${testCase.latitude}°N, ${testCase.longitude}°W`);
  
  try {
    // Step 1: Detailed timezone conversion analysis
    console.log('\n🕐 STEP 1: TIMEZONE CONVERSION ANALYSIS');
    console.log('=========================================');
    
    const coordinates = { lat: testCase.latitude, lng: testCase.longitude };
    const conversion = historicalTimezoneHandler.convertToUTC(
      testCase.date, testCase.time, testCase.place, coordinates, testCase.timezone
    );
    
    console.log(`📅 Input Local Time: ${testCase.date} ${testCase.time}`);
    console.log(`🌐 UTC Result: ${conversion.utcMoment.format('YYYY-MM-DD HH:mm:ss')} UTC`);
    console.log(`⏰ Timezone Offset: ${conversion.historicalOffset} hours`);
    console.log(`📊 Day Shift: ${conversion.conversionDetails.dayShift}`);
    console.log(`🔄 Historical: ${conversion.isHistorical}`);
    
    // Step 2: Julian Day calculation
    console.log('\n📊 STEP 2: JULIAN DAY CALCULATION');
    console.log('==================================');
    
    const julianDay = enhancedSwissEph.getJulianDay(
      testCase.date, testCase.time, testCase.timezone, testCase.place, coordinates
    );
    
    console.log(`🎯 Julian Day: ${julianDay.toFixed(8)}`);
    
    // Manual verification of Julian Day
    const utcMoment = conversion.utcMoment;
    const year = utcMoment.year();
    const month = utcMoment.month() + 1;
    const day = utcMoment.date();
    const hour = utcMoment.hour() + (utcMoment.minute() / 60.0) + (utcMoment.second() / 3600.0);
    
    console.log(`📋 UTC Components: ${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toFixed(4)}h`);
    
    // Step 3: Planetary position analysis
    console.log('\n🌟 STEP 3: PLANETARY POSITION ANALYSIS');
    console.log('======================================');
    
    const planetaryResult = enhancedSwissEph.getPlanetaryPositions(julianDay);
    const planets = planetaryResult.planets;
    
    // Analyze key planets
    const keyPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    
    keyPlanets.forEach(planetKey => {
      const planet = planets[planetKey];
      if (planet) {
        console.log(`\n${planet.name.toUpperCase()}:`);
        console.log(`  🌌 Raw Longitude: ${planet.longitude.toFixed(6)}°`);
        console.log(`  🏠 Sign: ${planet.sign} (${planet.signNumber})`);
        console.log(`  📐 Degree in Sign: ${planet.degreeInSign.toFixed(4)}°`);
        console.log(`  ⭐ Nakshatra: ${planet.nakshatra} (Pada ${planet.nakshatraPada})`);
        console.log(`  ↗️ Retrograde: ${planet.isRetrograde}`);
        
        // Compare with expected (if available)
        const expected = testCase.expected[planetKey.toLowerCase()];
        if (expected) {
          const match = planet.sign === expected ? '✅' : '❌';
          console.log(`  🎯 Expected: ${expected} ${match}`);
        }
      }
    });
    
    // Step 4: Ascendant calculation analysis
    console.log('\n🌅 STEP 4: ASCENDANT CALCULATION ANALYSIS');
    console.log('=========================================');
    
    const ascendant = enhancedSwissEph.calculateAscendant(julianDay, testCase.latitude, testCase.longitude);
    
    console.log(`🌌 Ascendant Longitude: ${ascendant.longitude.toFixed(6)}°`);
    console.log(`🏠 Ascendant Sign: ${ascendant.sign} (${ascendant.signNumber})`);
    console.log(`📐 Degree in Sign: ${ascendant.degreeInSign.toFixed(4)}°`);
    console.log(`⭐ Nakshatra: ${ascendant.nakshatra} (Pada ${ascendant.nakshatraPada})`);
    
    const ascMatch = ascendant.sign === testCase.expected.ascendant ? '✅' : '❌';
    console.log(`🎯 Expected: ${testCase.expected.ascendant} ${ascMatch}`);
    
    // Step 5: Ayanamsa analysis
    console.log('\n🔄 STEP 5: AYANAMSA ANALYSIS');
    console.log('============================');
    
    // Check current Ayanamsa value for the given date
    try {
      const swisseph = require('swisseph');
      const ayanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
      console.log(`🔢 Lahiri Ayanamsa: ${ayanamsa.toFixed(6)}°`);
      console.log(`🔢 Ayanamsa in degrees-minutes: ${enhancedSwissEph.formatDegree(ayanamsa)}`);
      
      // For 1954, Lahiri Ayanamsa should be around 23.18°
      const expectedAyanamsa = 23.18; // Approximate for 1954
      const ayanamsaDiff = Math.abs(ayanamsa - expectedAyanamsa);
      console.log(`🎯 Expected ~${expectedAyanamsa}°, Difference: ${ayanamsaDiff.toFixed(4)}°`);
      
    } catch (error) {
      console.log(`❌ Error getting Ayanamsa: ${error.message}`);
    }
    
    // Step 6: Tropical vs Sidereal comparison
    console.log('\n🌍 STEP 6: TROPICAL VS SIDEREAL COMPARISON');
    console.log('==========================================');
    
    try {
      const swisseph = require('swisseph');
      
      // Calculate Moon in both systems for comparison
      const tropicalFlags = swisseph.SEFLG_SPEED; // No sidereal flag
      const siderealFlags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;
      
      const moonTropical = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, tropicalFlags);
      const moonSidereal = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, siderealFlags);
      
      if (moonTropical.rflag >= 0 && moonSidereal.rflag >= 0) {
        console.log(`🌙 Moon Tropical: ${moonTropical.longitude.toFixed(6)}° (${enhancedSwissEph.zodiacSigns[Math.floor(moonTropical.longitude / 30)]})`);
        console.log(`🌙 Moon Sidereal: ${moonSidereal.longitude.toFixed(6)}° (${enhancedSwissEph.zodiacSigns[Math.floor(moonSidereal.longitude / 30)]})`);
        console.log(`🔄 Difference: ${(moonTropical.longitude - moonSidereal.longitude).toFixed(6)}°`);
      }
      
    } catch (error) {
      console.log(`❌ Error in tropical/sidereal comparison: ${error.message}`);
    }
    
    // Step 7: Recommendations
    console.log('\n💡 STEP 7: DIAGNOSTIC RECOMMENDATIONS');
    console.log('=====================================');
    
    const moonMatch = planets.moon.sign === testCase.expected.moon;
    const ascendantMatch = ascendant.sign === testCase.expected.ascendant;
    
    if (!moonMatch) {
      console.log(`❌ Moon calculation issue detected:`);
      console.log(`   Calculated: ${planets.moon.sign} at ${planets.moon.longitude.toFixed(4)}°`);
      console.log(`   Expected: ${testCase.expected.moon}`);
      console.log(`   🔧 Check: Ayanamsa, Julian Day accuracy, Sidereal mode`);
    }
    
    if (!ascendantMatch) {
      console.log(`❌ Ascendant calculation issue detected:`);
      console.log(`   Calculated: ${ascendant.sign} at ${ascendant.longitude.toFixed(4)}°`);
      console.log(`   Expected: ${testCase.expected.ascendant}`);
      console.log(`   🔧 Check: House system, coordinate precision, timezone`);
    }
    
    if (moonMatch && ascendantMatch) {
      console.log(`✅ All calculations match! This case is working correctly.`);
    }
    
  } catch (error) {
    console.error('❌ Debugging failed:', error.message);
    console.error(error.stack);
  }
}

// Run the detailed analysis
debugAstronomicalCalculations();
