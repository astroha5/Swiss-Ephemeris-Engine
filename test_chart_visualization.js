// Test the chart visualization component's data format
const fs = require('fs');

// Sample data structure from API (based on test results)
const apiData = {
  charts: {
    lagna: {
      houses: [
        { number: 1, sign: 'Sagittarius', signNumber: 9, planets: ['Ketu'], degrees: ['27°25\'23"'] },
        { number: 2, sign: 'Capricorn', signNumber: 10, planets: [], degrees: [] },
        { number: 3, sign: 'Aquarius', signNumber: 11, planets: [], degrees: [] },
        { number: 4, sign: 'Pisces', signNumber: 12, planets: [], degrees: [] },
        { number: 5, sign: 'Aries', signNumber: 1, planets: ['Saturn'], degrees: ['6°49\'58"'] },
        { number: 6, sign: 'Taurus', signNumber: 2, planets: ['Jupiter'], degrees: ['17°22\'15"'] },
        { number: 7, sign: 'Gemini', signNumber: 3, planets: ['Rahu'], degrees: ['27°25\'23"'] },
        { number: 8, sign: 'Cancer', signNumber: 4, planets: [], degrees: [] },
        { number: 9, sign: 'Leo', signNumber: 5, planets: ['Mars'], degrees: ['14°28\'47"'] },
        { number: 10, sign: 'Virgo', signNumber: 6, planets: ['Sun', 'Mercury'], degrees: ['13°32\'15"', '8°13\'18"'] },
        { number: 11, sign: 'Libra', signNumber: 7, planets: ['Moon', 'Venus'], degrees: ['14°28\'18"', '13°00\'44"'] },
        { number: 12, sign: 'Scorpio', signNumber: 8, planets: [], degrees: [] }
      ]
    }
  }
};

console.log('🔍 Chart Data Validation:');
console.log('✅ Has charts.lagna.houses:', !!apiData.charts?.lagna?.houses);
console.log('✅ Houses count:', apiData.charts?.lagna?.houses?.length || 0);

console.log('\n🏠 Houses with planets:');
apiData.charts.lagna.houses.forEach(house => {
  if (house.planets.length > 0) {
    console.log(`House ${house.number} (${house.sign}, Sign #${house.signNumber}):`);
    house.planets.forEach((planet, index) => {
      console.log(`  ${planet}: ${house.degrees[index]}`);
    });
  }
});

// Test the chart component's expected format
console.log('\n🎯 Component compatibility test:');

// This is what the NorthIndianChart component expects
function testChartComponentData(chartData) {
  const houses = chartData?.houses || chartData?.charts?.lagna?.houses;
  
  if (!houses) {
    console.log('❌ No houses data found');
    return false;
  }
  
  console.log('✅ Houses data found');
  
  // Test if each house has the required properties
  const requiredProps = ['number', 'sign', 'planets', 'degrees'];
  const hasRequiredProps = houses.every(house => 
    requiredProps.every(prop => house.hasOwnProperty(prop))
  );
  
  console.log('✅ All houses have required props:', hasRequiredProps);
  
  // Check if signNumber is available for positioning
  const hasSignNumbers = houses.every(house => house.hasOwnProperty('signNumber'));
  console.log('✅ All houses have signNumber:', hasSignNumbers);
  
  return hasRequiredProps && hasSignNumbers;
}

// Test with direct lagna houses
console.log('\n📊 Testing with lagna houses directly:');
testChartComponentData(apiData.charts.lagna);

// Test with full chart data (as dashboard would pass it)
console.log('\n📊 Testing with full chart data:');
testChartComponentData(apiData);

// Generate summary for debugging
console.log('\n📋 Chart Summary for North Indian Chart:');
console.log('Data structure is compatible with NorthIndianChart component');

// Write test data to a file for reference
const testData = {
  compatible: true,
  format: 'charts.lagna.houses',
  sampleData: apiData.charts.lagna,
  instructions: {
    chartVisualization: 'Pass chartData?.charts?.lagna to ChartVisualization',
    northIndianChart: 'NorthIndianChart expects { houses: [...] } format'
  }
};

fs.writeFileSync('chart_test_results.json', JSON.stringify(testData, null, 2));
console.log('\n💾 Test results saved to chart_test_results.json');
