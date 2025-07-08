#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE CHART POSITIONING DEBUG SCRIPT
 * 
 * This script debugs the specific issue with North Indian chart
 * positioning logic as described in your explanation.
 * 
 * Key Issues to Test:
 * 1. House number positions (H1-H12) - these should NEVER move
 * 2. Planet placements in correct houses based on their signs
 * 3. Sign number assignments to house positions
 * 4. Ascendant calculation accuracy
 */

const axios = require('axios');

// Test case from your explanation
const testBirthData = {
  date: "2000-09-30",
  time: "12:00",
  latitude: 22.5726459,
  longitude: 88.3638953,
  timezone: "Asia/Kolkata",
  name: "Rahul Jana",
  place: "Kolkata, West Bengal, India"
};

// Expected results from onlinejyotish.com
const expectedResults = {
  ascendant: { sign: "Sagittarius", degree: "10°34'15\"" },
  planetary_positions: {
    Sun: { sign: "Virgo", house: 10 },
    Moon: { sign: "Libra", house: 11 },
    Mars: { sign: "Leo", house: 9 },
    Mercury: { sign: "Libra", house: 11 },
    Jupiter: { sign: "Taurus", house: 6 },
    Venus: { sign: "Libra", house: 11 },
    Saturn: { sign: "Taurus", house: 6 },
    Rahu: { sign: "Gemini", house: 7 },
    Ketu: { sign: "Sagittarius", house: 1 }
  }
};

// North Indian Chart House Layout (FIXED POSITIONS)
const NORTH_INDIAN_HOUSE_LAYOUT = {
  // Traditional North Indian layout - these NEVER change
  1: { position: "center-right", description: "Ascendant house" },
  2: { position: "top-right", description: "2nd house" },
  3: { position: "top-center", description: "3rd house" },
  4: { position: "top-left", description: "4th house" },
  5: { position: "center-left", description: "5th house" },
  6: { position: "bottom-left", description: "6th house" },
  7: { position: "bottom-center", description: "7th house" },
  8: { position: "bottom-right", description: "8th house" },
  9: { position: "inner-bottom-right", description: "9th house" },
  10: { position: "inner-top-right", description: "10th house" },
  11: { position: "inner-top-left", description: "11th house" },
  12: { position: "inner-bottom-left", description: "12th house" }
};

// Sign to number mapping
const SIGN_NUMBERS = {
  'Aries': 1, 'Taurus': 2, 'Gemini': 3, 'Cancer': 4,
  'Leo': 5, 'Virgo': 6, 'Libra': 7, 'Scorpio': 8,
  'Sagittarius': 9, 'Capricorn': 10, 'Aquarius': 11, 'Pisces': 12
};

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

/**
 * Calculate correct house assignments based on North Indian system
 */
function calculateCorrectHouseAssignments(ascendantSign, planetaryPositions) {
  console.log(`\n🏠 CALCULATING CORRECT HOUSE ASSIGNMENTS`);
  console.log(`Ascendant Sign: ${ascendantSign}`);
  
  const ascendantSignNumber = SIGN_NUMBERS[ascendantSign];
  console.log(`Ascendant Sign Number: ${ascendantSignNumber}`);
  
  // In North Indian system:
  // - House 1 always contains the ascendant sign
  // - Each subsequent house contains the next sign in order
  const houseSignAssignments = {};
  
  for (let house = 1; house <= 12; house++) {
    // Calculate which sign goes in this house
    const signIndex = (ascendantSignNumber - 1 + house - 1) % 12;
    const sign = SIGNS[signIndex];
    const signNumber = signIndex + 1;
    
    houseSignAssignments[house] = {
      sign: sign,
      signNumber: signNumber
    };
    
    console.log(`  House ${house}: ${sign} (Sign #${signNumber})`);
  }
  
  // Now determine which planets go in which houses
  const housePlacements = {};
  for (let house = 1; house <= 12; house++) {
    housePlacements[house] = {
      ...houseSignAssignments[house],
      planets: [],
      description: NORTH_INDIAN_HOUSE_LAYOUT[house].description
    };
  }
  
  // Place planets in correct houses based on their signs
  Object.entries(planetaryPositions).forEach(([planet, data]) => {
    const planetSignNumber = SIGN_NUMBERS[data.sign];
    
    // Find which house contains this sign
    for (let house = 1; house <= 12; house++) {
      if (houseSignAssignments[house].signNumber === planetSignNumber) {
        housePlacements[house].planets.push(planet);
        console.log(`  🪐 ${planet} (${data.sign}) → House ${house}`);
        break;
      }
    }
  });
  
  return { houseSignAssignments, housePlacements };
}

/**
 * Debug your app's current logic
 */
async function debugAppLogic() {
  try {
    console.log(`🧪 TESTING YOUR APP'S CURRENT LOGIC`);
    console.log(`=`.repeat(50));
    
    const response = await axios.post('http://localhost:3001/api/kundli', testBirthData);
    
    if (!response.data.success) {
      console.error(`❌ API Error: ${response.data.error}`);
      return null;
    }
    
    const appData = response.data.data;
    console.log(`\n📊 YOUR APP'S RESULTS:`);
    console.log(`Ascendant: ${appData.chartSummary.ascendant.sign} ${appData.chartSummary.ascendant.degree}`);
    
    // Extract planetary positions from your app
    const appPlanetaryPositions = {};
    appData.planetaryData.forEach(planet => {
      appPlanetaryPositions[planet.planet] = {
        sign: planet.sign,
        house: planet.house,
        degree: planet.degree
      };
    });
    
    return {
      ascendant: appData.chartSummary.ascendant,
      planetaryPositions: appPlanetaryPositions,
      houses: appData.houseSummary || appData.houses
    };
    
  } catch (error) {
    console.error(`❌ Error calling your app: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`💡 Make sure your backend is running: cd backend && npm start`);
    }
    return null;
  }
}

/**
 * Compare expected vs actual results
 */
function compareResults(appResult, expectedResult) {
  console.log(`\n🔍 DETAILED COMPARISON`);
  console.log(`=`.repeat(50));
  
  // 1. Compare Ascendant
  console.log(`\n🌅 ASCENDANT COMPARISON:`);
  console.log(`Expected: ${expectedResult.ascendant.sign} ${expectedResult.ascendant.degree}`);
  console.log(`Your App: ${appResult.ascendant.sign} ${appResult.ascendant.degree || 'N/A'}`);
  
  const ascendantMatches = appResult.ascendant.sign === expectedResult.ascendant.sign;
  console.log(`Match: ${ascendantMatches ? '✅' : '❌'}`);
  
  if (!ascendantMatches) {
    const expectedSignNum = SIGN_NUMBERS[expectedResult.ascendant.sign];
    const actualSignNum = SIGN_NUMBERS[appResult.ascendant.sign];
    const signDifference = actualSignNum - expectedSignNum;
    console.log(`🔍 Sign difference: ${signDifference} signs (${signDifference * 30}°)`);
    
    if (Math.abs(signDifference) === 1 || Math.abs(signDifference) === 11) {
      console.log(`💡 This suggests a ~24° Ayanamsa difference or time zone issue`);
    }
  }
  
  // 2. Compare Planetary Signs
  console.log(`\n🪐 PLANETARY SIGN COMPARISON:`);
  console.log(`Planet`.padEnd(10) + `Expected`.padEnd(15) + `Your App`.padEnd(15) + `Match`);
  console.log(`-`.repeat(55));
  
  let signMatches = 0;
  let totalPlanets = 0;
  
  Object.entries(expectedResult.planetary_positions).forEach(([planet, expected]) => {
    const actual = appResult.planetaryPositions[planet];
    if (actual) {
      totalPlanets++;
      const matches = actual.sign === expected.sign;
      if (matches) signMatches++;
      
      console.log(
        `${planet.padEnd(10)}${expected.sign.padEnd(15)}${actual.sign.padEnd(15)}${matches ? '✅' : '❌'}`
      );
    }
  });
  
  console.log(`\nPlanetary Signs Accuracy: ${signMatches}/${totalPlanets} (${((signMatches/totalPlanets)*100).toFixed(1)}%)`);
  
  // 3. Compare House Placements
  console.log(`\n🏠 HOUSE PLACEMENT COMPARISON:`);
  console.log(`Planet`.padEnd(10) + `Expected H`.padEnd(12) + `Your App H`.padEnd(12) + `Match`);
  console.log(`-`.repeat(50));
  
  let houseMatches = 0;
  
  Object.entries(expectedResult.planetary_positions).forEach(([planet, expected]) => {
    const actual = appResult.planetaryPositions[planet];
    if (actual) {
      const matches = actual.house === expected.house;
      if (matches) houseMatches++;
      
      console.log(
        `${planet.padEnd(10)}${('H' + expected.house).padEnd(12)}${('H' + actual.house).padEnd(12)}${matches ? '✅' : '❌'}`
      );
    }
  });
  
  console.log(`\nHouse Placement Accuracy: ${houseMatches}/${totalPlanets} (${((houseMatches/totalPlanets)*100).toFixed(1)}%)`);
  
  return {
    ascendantMatch: ascendantMatches,
    signAccuracy: signMatches / totalPlanets,
    houseAccuracy: houseMatches / totalPlanets
  };
}

/**
 * Validate North Indian chart logic
 */
function validateNorthIndianLogic(appResult) {
  console.log(`\n🔧 VALIDATING NORTH INDIAN CHART LOGIC`);
  console.log(`=`.repeat(50));
  
  // Calculate what the correct house assignments should be
  const correctAssignments = calculateCorrectHouseAssignments(
    appResult.ascendant.sign, 
    appResult.planetaryPositions
  );
  
  console.log(`\n📋 CORRECT HOUSE ASSIGNMENTS (Based on ${appResult.ascendant.sign} Ascendant):`);
  Object.entries(correctAssignments.housePlacements).forEach(([house, data]) => {
    const planetList = data.planets.length > 0 ? data.planets.join(', ') : '(empty)';
    console.log(`  House ${house}: ${data.sign} (Sign #${data.signNumber}) - ${planetList}`);
  });
  
  console.log(`\n🔍 CHECKING YOUR APP'S HOUSE LOGIC:`);
  
  // Check if your app's house assignments match the expected North Indian logic
  let correctHousePlacements = 0;
  let totalPlacements = 0;
  
  Object.entries(appResult.planetaryPositions).forEach(([planet, planetData]) => {
    totalPlacements++;
    
    // Find which house should contain this planet based on its sign
    const planetSignNumber = SIGN_NUMBERS[planetData.sign];
    let expectedHouse = null;
    
    for (let house = 1; house <= 12; house++) {
      if (correctAssignments.houseSignAssignments[house].signNumber === planetSignNumber) {
        expectedHouse = house;
        break;
      }
    }
    
    const actualHouse = planetData.house;
    const matches = actualHouse === expectedHouse;
    
    if (matches) correctHousePlacements++;
    
    console.log(`  ${planet}: ${planetData.sign} → Expected H${expectedHouse}, Got H${actualHouse} ${matches ? '✅' : '❌'}`);
  });
  
  console.log(`\nHouse Logic Accuracy: ${correctHousePlacements}/${totalPlacements} (${((correctHousePlacements/totalPlacements)*100).toFixed(1)}%)`);
  
  return {
    correctAssignments,
    logicAccuracy: correctHousePlacements / totalPlacements
  };
}

/**
 * Diagnose specific issues
 */
function diagnoseIssues(appResult, expectedResult, comparisonResult, validationResult) {
  console.log(`\n🩺 DIAGNOSIS & RECOMMENDATIONS`);
  console.log(`=`.repeat(50));
  
  const issues = [];
  const recommendations = [];
  
  // 1. Ascendant Issues
  if (!comparisonResult.ascendantMatch) {
    issues.push("❌ Ascendant calculation discrepancy");
    recommendations.push("🔧 Check Ayanamsa setting and timezone conversion");
    recommendations.push("🔧 Verify Julian Day calculation accuracy");
    recommendations.push("🔧 Compare with multiple online calculators");
  }
  
  // 2. Planetary Sign Issues
  if (comparisonResult.signAccuracy < 0.8) {
    issues.push("❌ Planetary sign calculations are inaccurate");
    recommendations.push("🔧 Verify Swiss Ephemeris sidereal flag usage");
    recommendations.push("🔧 Check if Lahiri Ayanamsa is properly applied");
  }
  
  // 3. House Logic Issues
  if (validationResult.logicAccuracy < 1.0) {
    issues.push("❌ House placement logic is incorrect");
    recommendations.push("🔧 Fix calculateHouseNumber() function");
    recommendations.push("🔧 Ensure houses are assigned based on sign positions, not longitude differences");
  }
  
  // 4. Overall Assessment
  console.log(`\n📊 OVERALL ASSESSMENT:`);
  console.log(`Ascendant: ${comparisonResult.ascendantMatch ? '✅ Correct' : '❌ Incorrect'}`);
  console.log(`Planetary Signs: ${(comparisonResult.signAccuracy * 100).toFixed(1)}% accurate`);
  console.log(`House Placements: ${(comparisonResult.houseAccuracy * 100).toFixed(1)}% accurate`);
  console.log(`Chart Logic: ${(validationResult.logicAccuracy * 100).toFixed(1)}% accurate`);
  
  if (issues.length === 0) {
    console.log(`\n🎉 CONGRATULATIONS! Your chart calculations appear to be working correctly!`);
  } else {
    console.log(`\n🚨 ISSUES FOUND:`);
    issues.forEach(issue => console.log(`  ${issue}`));
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  // 5. Specific Code Fixes
  if (validationResult.logicAccuracy < 1.0) {
    console.log(`\n🔧 SPECIFIC CODE FIX NEEDED:`);
    console.log(`Your calculateHouseNumber() function should be:`);
    console.log(`
    calculateHouseNumber(planetSign, ascendantSign) {
      const planetSignNumber = getSignNumber(planetSign);
      const ascendantSignNumber = getSignNumber(ascendantSign);
      
      // In North Indian system, house = (planetSign - ascendantSign + 1)
      let house = planetSignNumber - ascendantSignNumber + 1;
      if (house <= 0) house += 12;
      if (house > 12) house -= 12;
      
      return house;
    }`);
  }
}

/**
 * Main debugging function
 */
async function runDebugSession() {
  console.log(`🔍 NORTH INDIAN CHART POSITIONING DEBUG SESSION`);
  console.log(`=`.repeat(60));
  console.log(`Birth Data: ${testBirthData.name}, ${testBirthData.date} ${testBirthData.time}`);
  console.log(`Location: ${testBirthData.place}`);
  console.log(`Expected Ascendant: ${expectedResults.ascendant.sign}`);
  
  // Get your app's current results
  const appResult = await debugAppLogic();
  if (!appResult) {
    console.log(`❌ Cannot proceed without app results. Please check your backend.`);
    return;
  }
  
  // Compare with expected results
  const comparisonResult = compareResults(appResult, expectedResults);
  
  // Validate North Indian chart logic
  const validationResult = validateNorthIndianLogic(appResult);
  
  // Provide diagnosis and recommendations
  diagnoseIssues(appResult, expectedResults, comparisonResult, validationResult);
  
  console.log(`\n✅ Debug session complete. Check the analysis above for specific issues and fixes.`);
}

// Run the debug session
if (require.main === module) {
  runDebugSession().catch(console.error);
}

module.exports = {
  runDebugSession,
  calculateCorrectHouseAssignments,
  NORTH_INDIAN_HOUSE_LAYOUT,
  SIGN_NUMBERS
};
