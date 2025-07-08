const axios = require('axios');

// Rahul Jana's birth details
const birthDetails = {
  name: "Rahul Jana",
  date: "2000-09-30",
  time: "12:00",
  latitude: 22.5726459,
  longitude: 88.3638953,
  timezone: "Asia/Kolkata"
};

async function testChartGeneration() {
  try {
    console.log('🔄 Testing chart generation for Rahul Jana...');
    console.log('Birth Details:', birthDetails);
    
    const response = await axios.post('http://localhost:3001/api/kundli', birthDetails);
    
    if (response.data.success) {
      const chartData = response.data.data;
      
      console.log('\n✅ Chart generated successfully!');
      console.log('\n📊 Chart Summary:');
      console.log('Ascendant:', chartData.chartSummary.ascendant);
      console.log('Moon Sign:', chartData.chartSummary.moonSign);
      console.log('Sun Sign:', chartData.chartSummary.sunSign);
      
      console.log('\n🏠 Lagna Chart Houses:');
      chartData.charts.lagna.houses.forEach(house => {
        if (house.planets.length > 0) {
          console.log(`House ${house.number} (${house.sign}): ${house.planets.join(', ')}`);
          console.log(`  Sign Number: ${house.signNumber}`);
          console.log(`  Degrees: ${house.degrees.join(', ')}`);
        }
      });
      
      console.log('\n🪐 Planetary Data:');
      chartData.planetaryData.forEach(planet => {
        console.log(`${planet.planet} (${planet.symbol}): House ${planet.house}, ${planet.sign}, ${planet.degree}`);
      });
      
      // Check data structure for chart component
      console.log('\n🔍 Data Structure Analysis:');
      console.log('Has charts.lagna.houses:', !!chartData.charts?.lagna?.houses);
      console.log('Houses count:', chartData.charts?.lagna?.houses?.length || 0);
      console.log('Has planetaryData:', !!chartData.planetaryData);
      console.log('Planetary count:', chartData.planetaryData?.length || 0);
      
      // Test the specific houses mentioned in your birth data
      console.log('\n📋 Comparing with your provided data:');
      
      const yourData = {
        'Jupiter': { house: 6, sign: 'Taurus', degree: '17°22\'15"' },
        'Ketu': { house: 1, sign: 'Sagittarius', degree: '27°25\'23"' },
        'Mars': { house: 9, sign: 'Leo', degree: '14°28\'47"' },
        'Mercury': { house: 11, sign: 'Libra', degree: '08°13\'18"' },
        'Moon': { house: 11, sign: 'Libra', degree: '14°28\'18"' },
        'Rahu': { house: 7, sign: 'Gemini', degree: '27°25\'23"' },
        'Saturn': { house: 6, sign: 'Taurus', degree: '06°49\'58"' },
        'Sun': { house: 10, sign: 'Virgo', degree: '13°32\'15"' },
        'Venus': { house: 11, sign: 'Libra', degree: '13°00\'44"' }
      };
      
      chartData.planetaryData.forEach(planet => {
        const yourPlanet = yourData[planet.planet];
        if (yourPlanet) {
          const houseMatch = planet.house === yourPlanet.house;
          const signMatch = planet.sign === yourPlanet.sign;
          
          console.log(`${planet.planet}:`);
          console.log(`  API: House ${planet.house}, ${planet.sign}, ${planet.degree}`);
          console.log(`  Your: House ${yourPlanet.house}, ${yourPlanet.sign}, ${yourPlanet.degree}`);
          console.log(`  Match: House ${houseMatch ? '✅' : '❌'}, Sign ${signMatch ? '✅' : '❌'}`);
        }
      });
      
    } else {
      console.error('❌ Chart generation failed:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing chart generation:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testChartGeneration();
