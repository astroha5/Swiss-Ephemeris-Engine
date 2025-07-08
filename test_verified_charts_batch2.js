#!/usr/bin/env node

/**
 * Test Batch #2 - Modern International Personalities
 * Verified birth charts from Astro-Databank with Lahiri Ayanamsa (Sidereal)
 */

const axios = require('axios');

// Batch #2 test data - Modern international personalities
const verifiedChartsBatch2 = [
  {
    id: 1,
    name: "Barack Obama",
    date: "1961-08-04",
    time: "19:24",
    place: "Honolulu, USA",
    coordinates: { lat: 21.3099, lng: -157.8581 },
    timezone: "Pacific/Honolulu",
    expected: {
      ascendant: "Capricorn",
      moonSign: "Capricorn"
    }
  },
  {
    id: 2,
    name: "Steve Jobs",
    date: "1955-02-24",
    time: "19:15",
    place: "San Francisco, USA",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    timezone: "America/Los_Angeles",
    expected: {
      ascendant: "Virgo",
      moonSign: "Taurus"
    }
  },
  {
    id: 3,
    name: "Bill Gates",
    date: "1955-10-28",
    time: "22:00",
    place: "Seattle, USA",
    coordinates: { lat: 47.6062, lng: -122.3321 },
    timezone: "America/Los_Angeles",
    expected: {
      ascendant: "Cancer",
      moonSign: "Virgo"
    }
  },
  {
    id: 4,
    name: "Nelson Mandela",
    date: "1918-07-18",
    time: "14:54",
    place: "Mvezo, South Africa",
    coordinates: { lat: -31.7764, lng: 28.6322 },
    timezone: "Africa/Johannesburg",
    expected: {
      ascendant: "Sagittarius",
      moonSign: "Gemini"
    }
  },
  {
    id: 5,
    name: "Warren Buffett",
    date: "1930-08-30",
    time: "15:00",
    place: "Omaha, USA",
    coordinates: { lat: 41.2565, lng: -95.9345 },
    timezone: "America/Chicago",
    expected: {
      ascendant: "Scorpio",
      moonSign: "Cancer"
    }
  },
  {
    id: 6,
    name: "Mark Zuckerberg",
    date: "1984-05-14",
    time: "13:00",
    place: "White Plains, NY",
    coordinates: { lat: 41.0340, lng: -73.7629 },
    timezone: "America/New_York",
    expected: {
      ascendant: "Leo",
      moonSign: "Cancer"
    }
  },
  {
    id: 7,
    name: "Elon Musk",
    date: "1971-06-28",
    time: "19:30",
    place: "Pretoria, South Africa",
    coordinates: { lat: -25.7479, lng: 28.2293 },
    timezone: "Africa/Johannesburg",
    expected: {
      ascendant: "Scorpio",
      moonSign: "Virgo"
    }
  },
  {
    id: 8,
    name: "Angela Merkel",
    date: "1954-07-17",
    time: "18:00",
    place: "Hamburg, Germany",
    coordinates: { lat: 53.5511, lng: 9.9937 },
    timezone: "Europe/Berlin",
    expected: {
      ascendant: "Capricorn",
      moonSign: "Sagittarius"
    }
  },
  {
    id: 9,
    name: "Shah Rukh Khan",
    date: "1965-11-02",
    time: "02:30",
    place: "Delhi, India",
    coordinates: { lat: 28.7041, lng: 77.1025 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Virgo",
      moonSign: "Gemini"
    }
  },
  {
    id: 10,
    name: "Aishwarya Rai",
    date: "1973-11-01",
    time: "16:00",
    place: "Mangalore, India",
    coordinates: { lat: 12.9141, lng: 74.8560 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Pisces",
      moonSign: "Cancer"
    }
  }
];

async function testChart(chart) {
  try {
    const payload = {
      date: chart.date,
      time: chart.time,
      latitude: chart.coordinates.lat,
      longitude: chart.coordinates.lng,
      timezone: chart.timezone,
      name: chart.name,
      place: chart.place
    };

    const response = await axios.post('http://localhost:3001/api/kundli', payload);
    
    if (!response.data.success) {
      return {
        id: chart.id,
        name: chart.name,
        status: 'ERROR',
        error: response.data.error || 'Unknown error'
      };
    }

    const result = response.data.data.chartSummary;
    
    return {
      id: chart.id,
      name: chart.name,
      status: 'SUCCESS',
      expected: chart.expected,
      actual: {
        ascendant: result.ascendant.sign,
        moonSign: result.moonSign.sign
      },
      matches: {
        ascendant: result.ascendant.sign === chart.expected.ascendant,
        moonSign: result.moonSign.sign === chart.expected.moonSign
      },
      degrees: {
        ascendant: result.ascendant.degree,
        moonSign: result.moonSign.degree
      },
      coordinates: chart.coordinates,
      timezone: chart.timezone
    };

  } catch (error) {
    return {
      id: chart.id,
      name: chart.name,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function runBatch2Tests() {
  console.log("🧪 TESTING BATCH #2 - MODERN INTERNATIONAL PERSONALITIES");
  console.log("=".repeat(80));
  console.log("📊 Astro-Databank verified charts using Lahiri Ayanamsa (Sidereal)");
  console.log("🌍 International locations with proper timezone handling");
  console.log("=".repeat(80));
  console.log();

  const results = [];
  
  for (let i = 0; i < verifiedChartsBatch2.length; i++) {
    const chart = verifiedChartsBatch2[i];
    console.log(`Testing ${i + 1}/10: ${chart.name} (${chart.place})...`);
    
    const result = await testChart(chart);
    results.push(result);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log();
  console.log("📊 DETAILED RESULTS:");
  console.log("=".repeat(80));
  
  let totalMatches = 0;
  let ascendantMatches = 0;
  let moonSignMatches = 0;
  let successfulTests = 0;

  results.forEach(result => {
    if (result.status === 'ERROR') {
      console.log(`❌ #${result.id} ${result.name}: ERROR - ${result.error}`);
      return;
    }

    successfulTests++;
    const ascMatch = result.matches.ascendant ? '✅' : '❌';
    const moonMatch = result.matches.moonSign ? '✅' : '❌';
    
    if (result.matches.ascendant) ascendantMatches++;
    if (result.matches.moonSign) moonSignMatches++;
    if (result.matches.ascendant && result.matches.moonSign) totalMatches++;

    console.log();
    console.log(`👤 #${result.id} ${result.name}`);
    console.log(`   🌍 Location: ${result.coordinates.lat}°, ${result.coordinates.lng}° (${result.timezone})`);
    console.log(`   Expected: Asc: ${result.expected.ascendant} | Moon: ${result.expected.moonSign}`);
    console.log(`   Your App: Asc: ${result.actual.ascendant} | Moon: ${result.actual.moonSign}`);
    console.log(`   Matches:  Asc: ${ascMatch} | Moon: ${moonMatch}`);
    console.log(`   Degrees:  Asc: ${result.degrees.ascendant} | Moon: ${result.degrees.moonSign}`);
  });

  console.log();
  console.log("📈 BATCH #2 SUMMARY STATISTICS:");
  console.log("=".repeat(80));
  console.log(`Total Charts Tested: ${results.length}`);
  console.log(`Successful Calculations: ${successfulTests}/${results.length}`);
  console.log(`Perfect Matches (Both Asc + Moon): ${totalMatches}/${successfulTests} (${((totalMatches/successfulTests)*100).toFixed(1)}%)`);
  console.log(`Ascendant Matches: ${ascendantMatches}/${successfulTests} (${((ascendantMatches/successfulTests)*100).toFixed(1)}%)`);
  console.log(`Moon Sign Matches: ${moonSignMatches}/${successfulTests} (${((moonSignMatches/successfulTests)*100).toFixed(1)}%)`);
  
  console.log();
  
  // Performance analysis
  if (totalMatches === successfulTests) {
    console.log("🎉 PERFECT SCORE! Your app achieved 100% accuracy on modern charts!");
    console.log("✅ Excellent performance on international timezones and coordinates.");
  } else if (totalMatches >= successfulTests * 0.8) {
    console.log("🌟 EXCELLENT! Your app shows high accuracy on modern international charts.");
    console.log("🔧 Minor refinements may further improve precision.");
  } else if (totalMatches >= successfulTests * 0.6) {
    console.log("✅ GOOD performance on modern charts.");
    console.log("🛠️ Some specific timezone or coordinate issues to investigate.");
  } else {
    console.log("⚠️ MODERATE accuracy on modern charts.");
    console.log("🔍 Investigate timezone handling for international locations.");
  }

  console.log();
  console.log("🔍 TECHNICAL ANALYSIS:");
  
  // Regional analysis
  const regions = {
    'USA': results.filter(r => r.name && ['Obama', 'Jobs', 'Gates', 'Buffett', 'Zuckerberg'].some(n => r.name.includes(n))),
    'South Africa': results.filter(r => r.name && ['Mandela', 'Musk'].some(n => r.name.includes(n))),
    'Europe': results.filter(r => r.name && ['Merkel'].some(n => r.name.includes(n))),
    'India': results.filter(r => r.name && ['Khan', 'Rai'].some(n => r.name.includes(n)))
  };

  Object.entries(regions).forEach(([region, charts]) => {
    if (charts.length > 0) {
      const regionAccuracy = charts.filter(c => c.status === 'SUCCESS' && c.matches.ascendant && c.matches.moonSign).length;
      const regionTotal = charts.filter(c => c.status === 'SUCCESS').length;
      console.log(`• ${region}: ${regionAccuracy}/${regionTotal} perfect matches (${regionTotal > 0 ? ((regionAccuracy/regionTotal)*100).toFixed(1) : 0}%)`);
    }
  });

  if (ascendantMatches > moonSignMatches) {
    console.log("• Ascendant calculations outperform Moon position accuracy");
    console.log("• Focus on refining planetary position algorithms");
  } else if (moonSignMatches > ascendantMatches) {
    console.log("• Moon calculations outperform Ascendant accuracy");  
    console.log("• Focus on house system or sidereal time calculations");
  } else if (ascendantMatches === moonSignMatches && ascendantMatches < successfulTests) {
    console.log("• Balanced accuracy suggests systematic improvements working");
    console.log("• Continue with current methodology and fine-tuning");
  }

  console.log();
  console.log("🌍 TIMEZONE PERFORMANCE:");
  const timezoneGroups = {
    'US Timezones': results.filter(r => r.timezone && r.timezone.includes('America')),
    'European Timezones': results.filter(r => r.timezone && r.timezone.includes('Europe')),
    'African Timezones': results.filter(r => r.timezone && r.timezone.includes('Africa')),
    'Asian Timezones': results.filter(r => r.timezone && r.timezone.includes('Asia')),
    'Pacific Timezones': results.filter(r => r.timezone && r.timezone.includes('Pacific'))
  };

  Object.entries(timezoneGroups).forEach(([group, charts]) => {
    const successful = charts.filter(c => c.status === 'SUCCESS');
    const perfect = successful.filter(c => c.matches.ascendant && c.matches.moonSign);
    if (successful.length > 0) {
      console.log(`• ${group}: ${perfect.length}/${successful.length} perfect (${((perfect.length/successful.length)*100).toFixed(1)}%)`);
    }
  });

  console.log();
  console.log("=".repeat(80));
  console.log("Batch #2 testing completed!");
  
  return results;
}

// Run the tests
runBatch2Tests().catch(error => {
  console.error("Failed to run Batch #2 tests:", error.message);
  console.log("\n💡 Make sure your backend server is running:");
  console.log("   cd backend && npm start");
});
