#!/usr/bin/env node

const swisseph = require('swisseph');
const moment = require('moment-timezone');
const path = require('path');

console.log('🔧 Swiss Ephemeris Debug Script');
console.log('================================\n');

// Obama's birth data
const birthData = {
  date: "1961-08-04",
  time: "19:24",
  timezone: "Pacific/Honolulu",
  lat: 21.3099,
  lng: -157.8581
};

try {
  // Set ephemeris path
  const ephePath = path.join(__dirname, 'backend', 'ephemeris');
  console.log(`Setting ephemeris path: ${ephePath}`);
  swisseph.swe_set_ephe_path(ephePath);
  
  // Get Swiss Ephemeris version
  const version = swisseph.swe_version();
  console.log(`Swiss Ephemeris version: ${version}\n`);
  
  // Calculate Julian Day
  const localTime = moment.tz(`${birthData.date} ${birthData.time}`, birthData.timezone);
  const utcTime = localTime.utc();
  
  console.log(`Local time: ${localTime.format('YYYY-MM-DD HH:mm:ss z')}`);
  console.log(`UTC time: ${utcTime.format('YYYY-MM-DD HH:mm:ss z')}`);
  
  const julianDay = swisseph.swe_julday(
    utcTime.year(), 
    utcTime.month() + 1, 
    utcTime.date(), 
    utcTime.hour() + utcTime.minute()/60, 
    swisseph.SE_GREG_CAL
  );
  
  console.log(`Julian Day: ${julianDay}\n`);
  
  // Test basic calculation - Sun position
  console.log('Testing Sun calculation...');
  const sunResult = swisseph.swe_calc_ut(julianDay, swisseph.SE_SUN, 0);
  console.log('Sun result:', sunResult);
  
  if (sunResult.flag >= 0) {
    console.log(`✓ Sun calculation successful`);
    console.log(`Sun longitude: ${sunResult.longitude}°`);
    
    // Calculate sign
    const signIndex = Math.floor(sunResult.longitude / 30);
    const degreeInSign = sunResult.longitude % 30;
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    
    console.log(`Sun position: ${degreeInSign.toFixed(2)}° ${signs[signIndex]}`);
  } else {
    console.log(`✗ Sun calculation failed: ${sunResult.serr}`);
  }
  
  // Test Moon
  console.log('\nTesting Moon calculation...');
  const moonResult = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, 0);
  console.log('Moon result:', moonResult);
  
  if (moonResult.flag >= 0) {
    console.log(`✓ Moon calculation successful`);
    console.log(`Moon longitude: ${moonResult.longitude}°`);
    
    const signIndex = Math.floor(moonResult.longitude / 30);
    const degreeInSign = moonResult.longitude % 30;
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    
    console.log(`Moon position: ${degreeInSign.toFixed(2)}° ${signs[signIndex]}`);
  } else {
    console.log(`✗ Moon calculation failed: ${moonResult.serr}`);
  }
  
  // Test sidereal calculation
  console.log('\nTesting sidereal calculation...');
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  const ayanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
  console.log(`Lahiri Ayanamsa: ${ayanamsa}°`);
  
  const sunSidereal = swisseph.swe_calc_ut(julianDay, swisseph.SE_SUN, swisseph.SEFLG_SIDEREAL);
  console.log('Sun sidereal result:', sunSidereal);
  
  if (sunSidereal.flag >= 0) {
    const signIndex = Math.floor(sunSidereal.longitude / 30);
    const degreeInSign = sunSidereal.longitude % 30;
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    
    console.log(`Sun sidereal: ${degreeInSign.toFixed(2)}° ${signs[signIndex]}`);
  }
  
  // Test houses
  console.log('\nTesting house calculation...');
  const houses = swisseph.swe_houses_ex(julianDay, 0, birthData.lat, birthData.lng, 'P');
  console.log('Houses result:', houses);
  
  if (houses.flag >= 0) {
    const ascSignIndex = Math.floor(houses.ascendant / 30);
    const ascDegreeInSign = houses.ascendant % 30;
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    
    console.log(`Ascendant: ${ascDegreeInSign.toFixed(2)}° ${signs[ascSignIndex]}`);
  }
  
  console.log('\n✅ Debug script completed');
  
} catch (error) {
  console.error('❌ Error in debug script:', error);
}
