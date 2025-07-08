const axios = require('axios');

// Test the house positioning logic specifically
async function debugHousePositioning() {
  try {
    console.log('🔍 Debugging house positioning logic...');
    
    const response = await axios.post('http://localhost:3001/api/kundli', {
      name: "Rahul Jana",
      date: "2000-09-30", 
      time: "12:00",
      latitude: 22.5726459,
      longitude: 88.3638953,
      timezone: "Asia/Kolkata"
    });
    
    if (!response.data.success) {
      console.error('API call failed:', response.data);
      return;
    }
    
    const data = response.data.data;
    
    console.log('\n📊 Raw Planetary Data from API:');
    data.planetaryData.forEach(planet => {
      console.log(`${planet.planet}: Longitude ${planet.degree}, Sign ${planet.sign}, House ${planet.house}`);
    });
    
    console.log('\n🏠 Houses from API:');
    data.charts.lagna.houses.forEach(house => {
      if (house.planets.length > 0) {
        console.log(`House ${house.number} (${house.sign}, Sign #${house.signNumber}): ${house.planets.join(', ')}`);
      }
    });
    
    console.log('\n🌅 Ascendant Info:');
    console.log(`Ascendant: ${data.chartSummary.ascendant.sign} ${data.chartSummary.ascendant.degree}`);
    
    // Manual calculation verification
    console.log('\n🧮 Manual House Calculation Verification:');
    
    // Expected positions from your data:
    const expectedHouses = {
      'Jupiter': 6,
      'Ketu': 1,
      'Mars': 9,
      'Mercury': 11,
      'Moon': 11, 
      'Rahu': 7,
      'Saturn': 6,
      'Sun': 10,
      'Venus': 11
    };
    
    console.log('\n📋 Comparison with Expected Houses:');
    data.planetaryData.forEach(planet => {
      const expected = expectedHouses[planet.planet];
      const actual = planet.house;
      const match = expected === actual;
      
      console.log(`${planet.planet}:`);
      console.log(`  Expected House: ${expected}`);
      console.log(`  Actual House:   ${actual}`);
      console.log(`  Match: ${match ? '✅' : '❌'}`);
      
      if (!match) {
        console.log(`  ❌ MISMATCH: ${planet.planet} should be in house ${expected}, but API shows house ${actual}`);
      }
    });
    
    // Check if the issue is in the house number calculation
    console.log('\n🔍 Analyzing House Calculation Logic:');
    
    // If Ascendant is Sagittarius (sign 9), then:
    // House 1 = Sagittarius (9)
    // House 2 = Capricorn (10) 
    // House 3 = Aquarius (11)
    // House 4 = Pisces (12)
    // House 5 = Aries (1)
    // House 6 = Taurus (2)
    // House 7 = Gemini (3)
    // House 8 = Cancer (4)
    // House 9 = Leo (5)
    // House 10 = Virgo (6)
    // House 11 = Libra (7)
    // House 12 = Scorpio (8)
    
    const ascendantSign = data.chartSummary.ascendant.sign;
    const ascendantSignNumber = getSignNumber(ascendantSign);
    
    console.log(`Ascendant is ${ascendantSign} (Sign #${ascendantSignNumber})`);
    console.log('\nExpected House to Sign mapping:');
    
    for (let house = 1; house <= 12; house++) {
      const signIndex = (ascendantSignNumber - 1 + house - 1) % 12;
      const signName = getSignName(signIndex + 1);
      console.log(`House ${house}: ${signName} (Sign #${signIndex + 1})`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function getSignNumber(signName) {
  const signs = {
    'Aries': 1, 'Taurus': 2, 'Gemini': 3, 'Cancer': 4,
    'Leo': 5, 'Virgo': 6, 'Libra': 7, 'Scorpio': 8,
    'Sagittarius': 9, 'Capricorn': 10, 'Aquarius': 11, 'Pisces': 12
  };
  return signs[signName];
}

function getSignName(signNumber) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[signNumber - 1];
}

debugHousePositioning();
