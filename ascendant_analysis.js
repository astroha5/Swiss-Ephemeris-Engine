#!/usr/bin/env node

/**
 * Comprehensive Ascendant Calculation Analysis
 * This tool helps debug discrepancies between different astrology systems
 */

// Birth details as provided
const birthDetails = {
  name: "Rahul Jana",
  date: "2000-09-30",
  time: "12:00",
  latitude: 22.5726459,
  longitude: 88.3638953,
  timezone: "Asia/Kolkata",
  place: "Kolkata, India"
};

// Expected from onlinejyotish.com
const expectedResult = {
  ascendant: "Sagittarius",
  degree: "10°34'15\"",
  planetary_positions: {
    Sun: { sign: "Virgo", degree: "13:32:16", house: 10 },
    Moon: { sign: "Libra", degree: "14:28:18", house: 11 },
    Mars: { sign: "Leo", degree: "14:28:48", house: 9 },
    Mercury: { sign: "Libra", degree: "08:13:19", house: 11 },
    Jupiter: { sign: "Taurus", degree: "17:22:15", house: 6, retrograde: true },
    Venus: { sign: "Libra", degree: "13:00:44", house: 11 },
    Saturn: { sign: "Taurus", degree: "06:49:59", house: 6, retrograde: true },
    Rahu: { sign: "Gemini", degree: "26:43:58", house: 7, retrograde: true },
    Ketu: { sign: "Sagittarius", degree: "26:43:58", house: 1, retrograde: true }
  }
};

// Your app's result
const appResult = {
  ascendant: "Capricorn",
  degree: "4°26'01\"",
  nakshatra: "Uttara Ashadha"
};

console.log("=".repeat(80));
console.log("               ASCENDANT CALCULATION ANALYSIS");
console.log("=".repeat(80));
console.log();

console.log("📋 BIRTH DETAILS:");
console.log(`Name: ${birthDetails.name}`);
console.log(`Date: ${birthDetails.date}`);
console.log(`Time: ${birthDetails.time}`);
console.log(`Place: ${birthDetails.place}`);
console.log(`Coordinates: ${birthDetails.latitude}°N, ${birthDetails.longitude}°E`);
console.log(`Timezone: ${birthDetails.timezone}`);
console.log();

console.log("⚖️  COMPARISON:");
console.log("                   OnlineJyotish.com    |    Your App");
console.log("-".repeat(60));
console.log(`Ascendant:         ${expectedResult.ascendant.padEnd(15)} |    ${appResult.ascendant}`);
console.log(`Degree:            ${expectedResult.degree.padEnd(15)} |    ${appResult.degree}`);
console.log();

// Calculate time differences and conversions
// Convert IST to UTC: IST = UTC + 5:30
const localHour = 12; // 12:00 noon
const utcHour = localHour - 5.5; // 6:30 AM UTC

console.log("🕐 TIME ANALYSIS:");
console.log(`Local Time (${birthDetails.timezone}): 2000-09-30 12:00:00 +05:30`);
console.log(`UTC Time: 2000-09-30 06:30:00 +00:00`);
console.log(`IST Time: 2000-09-30 12:00:00 +05:30`);
console.log();

// Calculate Julian Day using different methods
function calculateJulianDay(year, month, day, hour) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  return jdn + (hour / 24.0) - 0.5;
}

const year = 2000;
const month = 9;
const day = 30;
const hour = utcHour; // 6.5 (6:30 AM UTC)

const julianDay = calculateJulianDay(year, month, day, hour);

console.log("📅 JULIAN DAY CALCULATION:");
console.log(`UTC Year: ${year}`);
console.log(`UTC Month: ${month}`);
console.log(`UTC Day: ${day}`);
console.log(`UTC Hour (decimal): ${hour.toFixed(6)}`);
console.log(`Julian Day Number: ${julianDay.toFixed(8)}`);
console.log();

// Local Sidereal Time calculation
function calculateLocalSiderealTime(julianDay, longitude) {
  // Greenwich Sidereal Time at 0h UT
  const T = (julianDay - 2451545.0) / 36525.0;
  const gst0 = 280.46061837 + 360.98564736629 * (julianDay - 2451545.0) + 
               0.000387933 * T * T - T * T * T / 38710000.0;
  
  // Normalize to 0-360 degrees
  let gst = gst0 % 360;
  if (gst < 0) gst += 360;
  
  // Convert to Local Sidereal Time
  const lst = gst + longitude;
  
  return lst % 360;
}

const lst = calculateLocalSiderealTime(julianDay, birthDetails.longitude);
const lstHours = lst / 15; // Convert degrees to hours

console.log("⭐ SIDEREAL TIME CALCULATION:");
console.log(`Longitude: ${birthDetails.longitude}°E`);
console.log(`Local Sidereal Time: ${lst.toFixed(6)}° (${lstHours.toFixed(6)} hours)`);
console.log(`LST in H:M:S: ${Math.floor(lstHours)}:${Math.floor((lstHours % 1) * 60)}:${Math.floor(((lstHours % 1) * 60 % 1) * 60)}`);
console.log();

// Simplified Ascendant calculation
function calculateAscendantSimple(lst, latitude) {
  // This is a very simplified version - real calculation is much more complex
  // involving spherical trigonometry and proper obliquity corrections
  
  const lstRadians = lst * Math.PI / 180;
  const latRadians = latitude * Math.PI / 180;
  const obliquity = 23.4367; // Approximate obliquity of ecliptic
  const oblRadians = obliquity * Math.PI / 180;
  
  // Simplified calculation (not astronomically accurate)
  const x = Math.cos(lstRadians);
  const y = Math.sin(lstRadians) * Math.cos(oblRadians) + 
            Math.tan(latRadians) * Math.sin(oblRadians);
  
  let ascendant = Math.atan2(y, x) * 180 / Math.PI;
  if (ascendant < 0) ascendant += 360;
  
  return ascendant;
}

const simplifiedAscendant = calculateAscendantSimple(lst, birthDetails.latitude);
const simplifiedSign = Math.floor(simplifiedAscendant / 30);
const simplifiedDegree = simplifiedAscendant % 30;

const zodiacSigns = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

console.log("🧮 SIMPLIFIED ASCENDANT CALCULATION:");
console.log(`Calculated Longitude: ${simplifiedAscendant.toFixed(6)}°`);
console.log(`Sign: ${zodiacSigns[simplifiedSign]} (${simplifiedSign + 1})`);
console.log(`Degree in Sign: ${simplifiedDegree.toFixed(6)}°`);
console.log();

console.log("🔍 POSSIBLE CAUSES OF DISCREPANCY:");
console.log();
console.log("1. AYANAMSA DIFFERENCE:");
console.log("   • Your app uses Lahiri Ayanamsa");
console.log("   • OnlineJyotish might use a different Ayanamsa");
console.log("   • Different Ayanamsa can cause ~24° difference");
console.log();

console.log("2. COORDINATE SYSTEM:");
console.log("   • Tropical vs Sidereal calculations");
console.log("   • Your app: Sidereal (Vedic)");
console.log("   • Some websites mix tropical/sidereal");
console.log();

console.log("3. TIME ZONE HANDLING:");
console.log("   • Local Mean Time vs Standard Time");
console.log("   • Daylight Saving Time considerations");
console.log("   • Timezone offset accuracy");
console.log();

console.log("4. EPHEMERIS DATA:");
console.log("   • Swiss Ephemeris vs other ephemeris");
console.log("   • Different precision levels");
console.log("   • Update frequencies");
console.log();

console.log("5. HOUSE SYSTEM:");
console.log("   • Placidus vs Equal House vs KP");
console.log("   • Different house systems affect ascendant slightly");
console.log();

console.log("💡 RECOMMENDATIONS:");
console.log();
console.log("1. Verify Ayanamsa Settings:");
console.log("   • Check if onlinejyotish.com uses Lahiri Ayanamsa");
console.log("   • Try different Ayanamsa values in your app");
console.log();

console.log("2. Cross-verify with other tools:");
console.log("   • Jagannatha Hora (free software)");
console.log("   • AstroSage.com");
console.log("   • JyotishyaDeepika.com");
console.log();

console.log("3. Check calculation details:");
console.log("   • Enable debug logging in Swiss Ephemeris");
console.log("   • Compare intermediate values (LST, etc.)");
console.log();

console.log("4. Consider using different birth time:");
console.log("   • Try 11:30 AM and 12:30 PM to see impact");
console.log("   • Birth time accuracy affects ascendant significantly");
console.log();

// Calculate what Ayanamsa difference would explain the discrepancy
const expectedAscLongitude = 8 * 30 + 10.57; // Sagittarius 10°34'15" = 250.57°
const appAscLongitude = 9 * 30 + 4.43; // Capricorn 4°26'01" = 274.43°
const difference = appAscLongitude - expectedAscLongitude;

console.log("📐 MATHEMATICAL ANALYSIS:");
console.log(`Expected Ascendant: ${expectedAscLongitude.toFixed(2)}° (Sagittarius)`);
console.log(`Your App's Ascendant: ${appAscLongitude.toFixed(2)}° (Capricorn)`);
console.log(`Difference: ${difference.toFixed(2)}° = ${(difference/30).toFixed(2)} signs`);
console.log();

if (Math.abs(difference - 24) < 2) {
  console.log("🎯 LIKELY CAUSE: Ayanamsa difference (~24°)");
  console.log("   This suggests a tropical vs sidereal issue");
} else {
  console.log("🤔 The difference doesn't match standard Ayanamsa values");
  console.log("   This might be a more complex calculation issue");
}

console.log();
console.log("=".repeat(80));
console.log("Analysis complete. Check the recommendations above!");
console.log("=".repeat(80));
