#!/usr/bin/env node

/**
 * Debug Moon Calculation Error
 * Investigating why Moon shows Sagittarius instead of Virgo
 */

console.log("🔍 DEBUGGING MOON CALCULATION ERROR");
console.log("=".repeat(60));
console.log();

// Test case from user
const testCase = {
  date: "1973-04-24",
  time: "18:01",
  place: "Mumbai, Maharashtra, India",
  coordinates: { lat: 19.076, lng: 72.8777 },
  timezone: "Asia/Kolkata",
  expected: {
    moon: "Virgo 29°",
    ascendant: "Libra"
  },
  actual: {
    moon: "Sagittarius 27°05'15\"",
    ascendant: "Libra 21°43'00\""
  }
};

console.log("📋 TEST CASE:");
console.log(`Date: ${testCase.date}`);
console.log(`Time: ${testCase.time} IST`);
console.log(`Place: ${testCase.place}`);
console.log(`Coordinates: ${testCase.coordinates.lat}°N, ${testCase.coordinates.lng}°E`);
console.log();

console.log("⚖️ COMPARISON:");
console.log("                Expected    |    Your App's Result");
console.log("-".repeat(50));
console.log(`Moon Sign:      ${testCase.expected.moon.padEnd(12)} |    ${testCase.actual.moon}`);
console.log(`Ascendant:      ${testCase.expected.ascendant.padEnd(12)} |    ${testCase.actual.ascendant}`);
console.log();

// Calculate time conversions manually
const istTime = "18:01";
const [hours, minutes] = istTime.split(':').map(Number);
const istDecimal = hours + (minutes / 60);
const utcDecimal = istDecimal - 5.5; // IST is UTC+5:30

console.log("🕐 TIME ANALYSIS:");
console.log(`IST Time: ${istTime} (${istDecimal.toFixed(2)} hours)`);
console.log(`UTC Time: ${utcDecimal < 0 ? `${24 + utcDecimal}:${Math.abs((utcDecimal % 1) * 60).toFixed(0).padStart(2, '0')} (previous day)` : `${Math.floor(utcDecimal)}:${((utcDecimal % 1) * 60).toFixed(0).padStart(2, '0')}`}`);
console.log(`Expected UTC: 12:31 (12.52 hours)`);
console.log();

// Julian Day calculation
function calculateJulianDay(year, month, day, hourUTC) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  return jdn + (hourUTC / 24.0) - 0.5;
}

const julianDay = calculateJulianDay(1973, 4, 24, utcDecimal);

console.log("📅 JULIAN DAY:");
console.log(`Calculated JD: ${julianDay.toFixed(8)}`);
console.log(`Expected JD: ~2441797.021` );
console.log();

console.log("🧠 POTENTIAL ISSUES:");
console.log();

console.log("1. 🕒 TIME ZONE BUG:");
console.log("   • Your app might not be converting IST to UTC correctly");
console.log("   • 18:01 IST should become 12:31 UTC");
console.log("   • If using 18:01 as UTC instead of IST → Wrong by 5.5 hours");
console.log();

console.log("2. 🌍 AYANAMSA NOT APPLIED:");
console.log("   • Sagittarius vs Virgo = ~90° difference");
console.log("   • If Ayanamsa (~24°) isn't applied, positions shift");
console.log("   • But 90° is too large for just Ayanamsa");
console.log();

console.log("3. 🧮 CALCULATION ORDER BUG:");
console.log("   • swe_set_sid_mode() must be called BEFORE swe_calc_ut()");
console.log("   • If called after, Swiss Ephemeris uses Tropical by default");
console.log("   • Check initialization order in your service");
console.log();

console.log("4. 📅 DATE PARSING BUG:");
console.log("   • Wrong year/month/day passed to Swiss Ephemeris");
console.log("   • JavaScript Date() months are 0-indexed (April = 3, not 4)");
console.log("   • Check if you're using moment.month() vs moment.month()+1");
console.log();

console.log("5. 🏗️ WRONG SERVICE:");
console.log("   • Fallback to non-Sidereal service when Swiss Ephemeris fails");
console.log("   • Check if enhancedSwissEphemeris is actually being used");
console.log("   • Look for fallback to astronomyEngine.js");
console.log();

console.log("🔧 DEBUGGING STEPS:");
console.log();
console.log("1. Check Julian Day calculation:");
console.log("   • Add console.log in getJulianDay() method");
console.log("   • Verify UTC conversion: 18:01 IST → 12:31 UTC");
console.log();

console.log("2. Check sidereal mode initialization:");
console.log("   • Add console.log after swe_set_sid_mode()");
console.log("   • Ensure it's called before any calculations");
console.log();

console.log("3. Check planetary calculation flags:");
console.log("   • Verify SEFLG_SIDEREAL is used in swe_calc_ut()");
console.log("   • Add console.log for the flags parameter");
console.log();

console.log("4. Compare with reference:");
console.log("   • Use astrosage.com with same details");
console.log("   • Should show Moon in Virgo for this birth time");
console.log();

console.log("📐 MATHEMATICAL ANALYSIS:");
const expectedMoonLong = 8 * 30 + 29; // Virgo 29° = 269°
const actualMoonLong = 8 * 30 + 27 + (5/60) + (15/3600); // Sagittarius 27°05'15" = 267.087°
const difference = Math.abs(actualMoonLong - expectedMoonLong);

console.log(`Expected Moon longitude: ~269° (Virgo 29°)`);
console.log(`Your app's Moon longitude: 267.09° (Sagittarius 27°05'15")`);
console.log(`Difference: ${difference.toFixed(2)}° = ${(difference/30).toFixed(2)} signs`);
console.log();

if (difference > 80 && difference < 100) {
  console.log("🎯 LIKELY CAUSE: 90° shift suggests:");
  console.log("   • Wrong Julian Day (off by ~1/4 year)");
  console.log("   • OR major timezone calculation error");
  console.log("   • OR using Tropical instead of Sidereal");
} else {
  console.log("🤔 Unusual difference pattern - investigate calculation logic");
}

console.log();
console.log("🛠️ RECOMMENDED FIX:");
console.log("1. Add debug logging to enhancedSwissEphemeris.js");
console.log("2. Verify timezone conversion: IST → UTC");
console.log("3. Check swe_set_sid_mode() is called during initialization");
console.log("4. Ensure SEFLG_SIDEREAL flag is used in all calculations");
console.log("5. Cross-verify with online Vedic calculators");

console.log();
console.log("=".repeat(60));
console.log("Debug analysis complete!");
