#!/usr/bin/env node

/**
 * Test different Ayanamsa values to match onlinejyotish.com results
 */

const axios = require('axios');

const birthDetails = {
  date: "2000-09-30",
  time: "12:00",
  latitude: 22.5726459,
  longitude: 88.3638953,
  timezone: "Asia/Kolkata",
  name: "Rahul Jana",
  place: "Kolkata"
};

const expectedResults = {
  ascendant: "Sagittarius",
  degree: "10°34'15\"",
  planetary_positions: {
    Sun: { sign: "Virgo", degree: "13:32:16", house: 10 },
    Moon: { sign: "Libra", degree: "14:28:18", house: 11 },
    Mars: { sign: "Leo", degree: "14:28:48", house: 9 },
    Mercury: { sign: "Libra", degree: "08:13:19", house: 11 },
    Jupiter: { sign: "Taurus", degree: "17:22:15", house: 6 },
    Venus: { sign: "Libra", degree: "13:00:44", house: 11 },
    Saturn: { sign: "Taurus", degree: "06:49:59", house: 6 },
    Rahu: { sign: "Gemini", degree: "26:43:58", house: 7 },
    Ketu: { sign: "Sagittarius", degree: "26:43:58", house: 1 }
  }
};

async function testCalculation() {
  try {
    console.log("🧪 Testing your app's calculation...\n");
    
    const response = await axios.post('http://localhost:3001/api/kundli', birthDetails);
    
    if (response.data.success) {
      const appResult = response.data.data;
      
      console.log("📊 COMPARISON RESULTS:");
      console.log("=".repeat(70));
      console.log("                    Expected          |    Your App");
      console.log("-".repeat(70));
      console.log(`Ascendant:          ${expectedResults.ascendant.padEnd(15)} |    ${appResult.chartSummary.ascendant.sign}`);
      console.log(`Degree:             ${expectedResults.degree.padEnd(15)} |    ${appResult.chartSummary.ascendant.degree}`);
      console.log();
      
      console.log("🪐 PLANETARY POSITIONS COMPARISON:");
      console.log("-".repeat(70));
      console.log("Planet      Expected Sign/House    |    Your App Sign/House");
      console.log("-".repeat(70));
      
      appResult.planetaryData.forEach(planet => {
        const expected = expectedResults.planetary_positions[planet.planet];
        if (expected) {
          const expectedStr = `${expected.sign} H${expected.house}`.padEnd(20);
          const appStr = `${planet.sign} H${planet.house}`;
          console.log(`${planet.planet.padEnd(11)} ${expectedStr} |    ${appStr}`);
        }
      });
      
      console.log();
      console.log("🔍 ANALYSIS:");
      
      // Check if ascendant matches
      const ascendantMatches = appResult.chartSummary.ascendant.sign === expectedResults.ascendant;
      console.log(`Ascendant Match: ${ascendantMatches ? '✅ YES' : '❌ NO'}`);
      
      // Check planetary sign matches
      let signMatches = 0;
      let totalPlanets = 0;
      
      appResult.planetaryData.forEach(planet => {
        const expected = expectedResults.planetary_positions[planet.planet];
        if (expected) {
          totalPlanets++;
          if (planet.sign === expected.sign) {
            signMatches++;
          }
        }
      });
      
      console.log(`Planetary Signs Match: ${signMatches}/${totalPlanets} (${((signMatches/totalPlanets)*100).toFixed(1)}%)`);
      
      if (signMatches === totalPlanets && ascendantMatches) {
        console.log("\n🎉 PERFECT MATCH! Your calculations are correct.");
      } else if (signMatches > totalPlanets * 0.8) {
        console.log("\n✅ GOOD MATCH! Minor discrepancies might be due to:");
        console.log("   • Slight time differences");
        console.log("   • Different precision levels");
        console.log("   • Rounding differences");
      } else {
        console.log("\n⚠️  SIGNIFICANT DIFFERENCES detected.");
        
        // Analyze the difference pattern
        const difference = calculateSignDifference(appResult.chartSummary.ascendant.sign, expectedResults.ascendant);
        console.log(`\nAscendant difference: ${difference} signs`);
        
        if (Math.abs(difference) === 1) {
          console.log("This suggests a ~24° Ayanamsa difference (Tropical vs Sidereal)");
        } else {
          console.log("This suggests a different calculation methodology");
        }
      }
      
    } else {
      console.error("❌ Failed to get calculation from your app:", response.data.error);
    }
    
  } catch (error) {
    console.error("❌ Error testing calculation:", error.message);
    console.log("\n💡 Make sure your backend server is running:");
    console.log("   cd backend && npm start");
  }
}

function calculateSignDifference(sign1, sign2) {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  
  const index1 = signs.indexOf(sign1);
  const index2 = signs.indexOf(sign2);
  
  let diff = index1 - index2;
  
  // Handle circular difference
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  
  return diff;
}

console.log("🔬 ASTROVA CALCULATION VERIFICATION");
console.log("=".repeat(50));
console.log();
console.log("Birth Details:");
console.log(`• Name: ${birthDetails.name}`);
console.log(`• Date: ${birthDetails.date}`);
console.log(`• Time: ${birthDetails.time}`);
console.log(`• Place: ${birthDetails.place}`);
console.log(`• Coordinates: ${birthDetails.latitude}°N, ${birthDetails.longitude}°E`);
console.log();

testCalculation();
