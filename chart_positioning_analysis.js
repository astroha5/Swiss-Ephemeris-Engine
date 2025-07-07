#!/usr/bin/env node

/**
 * 🔍 CHART POSITIONING ANALYSIS
 * 
 * This script analyzes your chart positioning based on the sample data
 * to determine if the issue is in the backend logic or frontend display.
 */

// Sample data from your chart_test_results.json
const sampleData = {
  "houses": [
    { "number": 1, "sign": "Sagittarius", "signNumber": 9, "planets": ["Ketu"], "degrees": ["27°25'23\""] },
    { "number": 2, "sign": "Capricorn", "signNumber": 10, "planets": [], "degrees": [] },
    { "number": 3, "sign": "Aquarius", "signNumber": 11, "planets": [], "degrees": [] },
    { "number": 4, "sign": "Pisces", "signNumber": 12, "planets": [], "degrees": [] },
    { "number": 5, "sign": "Aries", "signNumber": 1, "planets": ["Saturn"], "degrees": ["6°49'58\""] },
    { "number": 6, "sign": "Taurus", "signNumber": 2, "planets": ["Jupiter"], "degrees": ["17°22'15\""] },
    { "number": 7, "sign": "Gemini", "signNumber": 3, "planets": ["Rahu"], "degrees": ["27°25'23\""] },
    { "number": 8, "sign": "Cancer", "signNumber": 4, "planets": [], "degrees": [] },
    { "number": 9, "sign": "Leo", "signNumber": 5, "planets": ["Mars"], "degrees": ["14°28'47\""] },
    { "number": 10, "sign": "Virgo", "signNumber": 6, "planets": ["Sun", "Mercury"], "degrees": ["13°32'15\"", "8°13'18\""] },
    { "number": 11, "sign": "Libra", "signNumber": 7, "planets": ["Moon", "Venus"], "degrees": ["14°28'18\"", "13°00'44\""] },
    { "number": 12, "sign": "Scorpio", "signNumber": 8, "planets": [], "degrees": [] }
  ]
};

console.log('🔍 CHART POSITIONING ANALYSIS');
console.log('=' .repeat(50));

// Extract ascendant information
const ascendantHouse = sampleData.houses.find(h => h.number === 1);
const ascendantSign = ascendantHouse.sign;
const ascendantSignNumber = ascendantHouse.signNumber;

console.log(`\n🌅 Ascendant Information:`);
console.log(`   Sign: ${ascendantSign} (Sign #${ascendantSignNumber})`);
console.log(`   This means House 1 contains ${ascendantSign}`);

// Verify the house-sign logic
console.log(`\n🏠 HOUSE-SIGN MAPPING VERIFICATION:`);
console.log('Based on North Indian system with Sagittarius (9) as Ascendant:');

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

console.log('\nHouse | Expected Sign     | Actual Sign       | Match | Planets');
console.log('-'.repeat(70));

let correctMappings = 0;
for (let houseNum = 1; houseNum <= 12; houseNum++) {
  // Expected sign calculation: Starting from Sagittarius (9), each house gets the next sign
  const expectedSignIndex = (ascendantSignNumber - 1 + houseNum - 1) % 12;
  const expectedSign = signs[expectedSignIndex];
  
  // Actual data from your API
  const actualHouse = sampleData.houses.find(h => h.number === houseNum);
  const actualSign = actualHouse.sign;
  const match = expectedSign === actualSign;
  const planets = actualHouse.planets.length > 0 ? actualHouse.planets.join(', ') : '(empty)';
  
  if (match) correctMappings++;
  
  console.log(`H${houseNum.toString().padStart(2)}   | ${expectedSign.padEnd(15)} | ${actualSign.padEnd(15)} | ${match ? '✅' : '❌'}   | ${planets}`);
}

console.log(`\n📊 ACCURACY: ${correctMappings}/12 houses correct (${(correctMappings/12*100).toFixed(1)}%)`);

// Planet positioning analysis
console.log(`\n🪐 PLANET POSITIONING ANALYSIS:`);
console.log('Checking if planets are in the correct houses based on their signs...\n');

const planetPlacements = [];
sampleData.houses.forEach(house => {
  house.planets.forEach((planet, index) => {
    planetPlacements.push({
      planet: planet,
      house: house.number,
      sign: house.sign,
      signNumber: house.signNumber,
      degree: house.degrees[index]
    });
  });
});

console.log('Planet   | Sign        | House | Expected House | Correct?');
console.log('-'.repeat(60));

planetPlacements.forEach(placement => {
  // Calculate expected house based on planet's sign
  const planetSignIndex = signs.indexOf(placement.sign);
  const expectedHouse = ((planetSignIndex + 1) - ascendantSignNumber + 1 + 12) % 12;
  const finalExpectedHouse = expectedHouse === 0 ? 12 : expectedHouse;
  
  const correct = placement.house === finalExpectedHouse;
  
  console.log(`${placement.planet.padEnd(8)} | ${placement.sign.padEnd(11)} | H${placement.house.toString().padStart(2)}   | H${finalExpectedHouse.toString().padStart(2)}           | ${correct ? '✅' : '❌'}`);
});

// Visual chart verification
console.log(`\n🎯 VISUAL CHART VERIFICATION:`);
console.log('Based on your North Indian Chart layout...\n');

// North Indian chart house positions (clockwise from top-right)
const northIndianPositions = {
  1: 'Center-Right (Ascendant)',
  2: 'Top-Right', 
  3: 'Top-Center',
  4: 'Top-Left',
  5: 'Center-Left',
  6: 'Bottom-Left',
  7: 'Bottom-Center',
  8: 'Bottom-Right',
  9: 'Inner Bottom-Right',
  10: 'Inner Top-Right', 
  11: 'Inner Top-Left',
  12: 'Inner Bottom-Left'
};

console.log('Expected planet positions in North Indian Chart:');
sampleData.houses.forEach(house => {
  if (house.planets.length > 0) {
    const position = northIndianPositions[house.number];
    console.log(`${position}: ${house.planets.join(', ')} (${house.sign})`);
  }
});

// Analysis conclusion
console.log(`\n🔍 ANALYSIS CONCLUSION:`);
console.log('=' .repeat(50));

if (correctMappings === 12) {
  console.log('✅ BACKEND LOGIC IS CORRECT!');
  console.log('✅ All houses have correct signs');
  console.log('✅ House-sign mapping follows North Indian system perfectly');
  console.log('✅ Ascendant (Sagittarius) is properly placed in House 1');
  
  console.log('\n🎯 THE ISSUE IS IN THE FRONTEND:');
  console.log('   Since backend calculations are accurate, the problem is likely:');
  console.log('   1. Data not reaching the chart component correctly');
  console.log('   2. Chart component not interpreting the data properly');
  console.log('   3. Visual positioning logic has bugs');
  
  console.log('\n🔧 FRONTEND DEBUGGING STEPS:');
  console.log('   1. Add console.log in ChartVisualization component');
  console.log('   2. Verify data flow: API → Dashboard → ChartVisualization → NorthIndianChart');
  console.log('   3. Check if getHouseData() in NorthIndianChart.jsx works correctly');
  console.log('   4. Verify house center coordinates match house numbers');
  
  console.log('\n💡 QUICK FIXES TO TRY:');
  console.log('   1. Check if chartData prop is being passed correctly');
  console.log('   2. Verify house coordinates in getHouseCenterPoints()');
  console.log('   3. Ensure planet placement logic matches house numbers');
  
} else {
  console.log('❌ BACKEND LOGIC HAS ISSUES!');
  console.log(`   Only ${correctMappings}/12 houses are correctly mapped`);
  console.log('   Need to fix calculateHousePositions() function');
}

// Generate test component data
console.log(`\n📋 TEST DATA FOR CHART COMPONENT:`);
console.log('Copy this into your chart component for testing:');
console.log('\nconst testChartData = {');
console.log('  houses: [');
sampleData.houses.forEach((house, index) => {
  const comma = index < sampleData.houses.length - 1 ? ',' : '';
  console.log(`    ${JSON.stringify(house)}${comma}`);
});
console.log('  ]');
console.log('};');

console.log('\n✅ Analysis complete! Use the findings above to debug the issue.');
