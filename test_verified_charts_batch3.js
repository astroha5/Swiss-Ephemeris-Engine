#!/usr/bin/env node

/**
 * Test Batch #3 - High-Quality Verified Charts
 * Cross-validated with Jagannatha Hora and Astrosage using Lahiri Ayanamsa (Sidereal)
 */

const axios = require('axios');

// Batch #3 test data - Cross-validated high-quality charts
const verifiedChartsBatch3 = [
  {
    id: 1,
    name: "Dalai Lama XIV",
    date: "1935-07-06",
    time: "04:38",
    place: "Taktser, Tibet",
    coordinates: { lat: 29.0, lng: 91.0 },
    timezone: "Asia/Kathmandu",
    expected: {
      ascendant: "Gemini",
      moonSign: "Scorpio"
    }
  },
  {
    id: 2,
    name: "Oprah Winfrey",
    date: "1954-01-29",
    time: "04:30",
    place: "Kosciusko, MS, USA",
    coordinates: { lat: 33.7, lng: -90.7 },
    timezone: "America/Chicago",
    expected: {
      ascendant: "Sagittarius",
      moonSign: "Scorpio"
    }
  },
  {
    id: 3,
    name: "John F. Kennedy",
    date: "1917-05-29",
    time: "15:00",
    place: "Brookline, MA, USA",
    coordinates: { lat: 42.3, lng: -71.1 },
    timezone: "America/New_York",
    expected: {
      ascendant: "Virgo",
      moonSign: "Virgo"
    }
  },
  {
    id: 4,
    name: "Charlie Chaplin",
    date: "1889-04-16",
    time: "20:00",
    place: "London, UK",
    coordinates: { lat: 51.5, lng: -0.1 },
    timezone: "Europe/London",
    expected: {
      ascendant: "Libra",
      moonSign: "Sagittarius"
    }
  },
  {
    id: 5,
    name: "Adolf Hitler",
    date: "1889-04-20",
    time: "18:30",
    place: "Braunau am Inn, Austria",
    coordinates: { lat: 48.3, lng: 13.1 },
    timezone: "Europe/Berlin",
    expected: {
      ascendant: "Libra",
      moonSign: "Capricorn"
    }
  },
  {
    id: 6,
    name: "Leonardo DiCaprio",
    date: "1974-11-11",
    time: "02:47",
    place: "Los Angeles, CA, USA",
    coordinates: { lat: 34.1, lng: -118.2 },
    timezone: "America/Los_Angeles",
    expected: {
      ascendant: "Virgo",
      moonSign: "Aries"
    }
  },
  {
    id: 7,
    name: "Taylor Swift",
    date: "1989-12-13",
    time: "05:17",
    place: "West Reading, PA, USA",
    coordinates: { lat: 40.6, lng: -75.5 },
    timezone: "America/New_York",
    expected: {
      ascendant: "Scorpio",
      moonSign: "Sagittarius"
    }
  },
  {
    id: 8,
    name: "Priyanka Chopra",
    date: "1982-07-18",
    time: "00:00",
    place: "Jamshedpur, India",
    coordinates: { lat: 26.9, lng: 80.9 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Aries",
      moonSign: "Leo"
    }
  },
  {
    id: 9,
    name: "Rabindranath Tagore",
    date: "1861-05-07",
    time: "04:00",
    place: "Kolkata, India",
    coordinates: { lat: 22.6, lng: 88.4 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Taurus",
      moonSign: "Libra"
    }
  },
  {
    id: 10,
    name: "Bruce Lee",
    date: "1940-11-27",
    time: "07:12",
    place: "San Francisco, CA, USA",
    coordinates: { lat: 37.8, lng: -122.4 },
    timezone: "America/Los_Angeles",
    expected: {
      ascendant: "Scorpio",
      moonSign: "Capricorn"
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

async function runBatch3Tests() {
  console.log("🧪 TESTING BATCH #3 - HIGH-QUALITY VERIFIED CHARTS");
  console.log("=".repeat(80));
  console.log("📊 Cross-validated with Jagannatha Hora & Astrosage using Lahiri Ayanamsa");
  console.log("🌍 International locations with historical date range (1861-1989)");
  console.log("=".repeat(80));
  console.log();

  const results = [];
  
  for (let i = 0; i < verifiedChartsBatch3.length; i++) {
    const chart = verifiedChartsBatch3[i];
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
  console.log("📈 BATCH #3 SUMMARY STATISTICS:");
  console.log("=".repeat(80));
  console.log(`Total Charts Tested: ${results.length}`);
  console.log(`Successful Calculations: ${successfulTests}/${results.length}`);
  console.log(`Perfect Matches (Both Asc + Moon): ${totalMatches}/${successfulTests} (${((totalMatches/successfulTests)*100).toFixed(1)}%)`);
  console.log(`Ascendant Matches: ${ascendantMatches}/${successfulTests} (${((ascendantMatches/successfulTests)*100).toFixed(1)}%)`);
  console.log(`Moon Sign Matches: ${moonSignMatches}/${successfulTests} (${((moonSignMatches/successfulTests)*100).toFixed(1)}%)`);
  
  console.log();
  
  // Performance analysis
  if (totalMatches === successfulTests) {
    console.log("🎉 PERFECT SCORE! Your app achieved 100% accuracy on cross-validated charts!");
    console.log("✅ Excellent alignment with Jagannatha Hora and Astrosage.");
  } else if (totalMatches >= successfulTests * 0.8) {
    console.log("🌟 EXCELLENT! Your app shows high accuracy on cross-validated charts.");
    console.log("🔧 Minor refinements may further improve precision.");
  } else if (totalMatches >= successfulTests * 0.6) {
    console.log("✅ GOOD performance on cross-validated charts.");
    console.log("🛠️ Some specific calculation differences to investigate.");
  } else if (totalMatches >= successfulTests * 0.4) {
    console.log("⚠️ MODERATE accuracy on cross-validated charts.");
    console.log("🔍 Systematic differences with reference software detected.");
  } else {
    console.log("⚠️ SIGNIFICANT differences with cross-validated references.");
    console.log("🔍 May indicate different calculation methodology or Ayanamsa.");
  }

  console.log();
  console.log("🔍 CROSS-VALIDATION ANALYSIS:");
  
  // Era analysis
  const eras = {
    'Historical (1861-1889)': results.filter(r => r.name && ['Tagore', 'Chaplin', 'Hitler'].some(n => r.name.includes(n))),
    'Early 20th Century (1917-1940)': results.filter(r => r.name && ['Kennedy', 'Dalai', 'Bruce'].some(n => r.name.includes(n))),
    'Mid 20th Century (1954-1974)': results.filter(r => r.name && ['Oprah', 'Leonardo'].some(n => r.name.includes(n))),
    'Modern Era (1982-1989)': results.filter(r => r.name && ['Priyanka', 'Taylor'].some(n => r.name.includes(n)))
  };

  Object.entries(eras).forEach(([era, charts]) => {
    if (charts.length > 0) {
      const eraAccuracy = charts.filter(c => c.status === 'SUCCESS' && c.matches.ascendant && c.matches.moonSign).length;
      const eraTotal = charts.filter(c => c.status === 'SUCCESS').length;
      console.log(`• ${era}: ${eraAccuracy}/${eraTotal} perfect matches (${eraTotal > 0 ? ((eraAccuracy/eraTotal)*100).toFixed(1) : 0}%)`);
    }
  });

  // Regional analysis
  const regions = {
    'USA/Americas': results.filter(r => r.timezone && r.timezone.includes('America')),
    'Europe': results.filter(r => r.timezone && r.timezone.includes('Europe')),
    'Asia': results.filter(r => r.timezone && (r.timezone.includes('Asia') || r.timezone.includes('Kathmandu'))),
  };

  console.log();
  console.log("🌍 REGIONAL PERFORMANCE:");
  Object.entries(regions).forEach(([region, charts]) => {
    const successful = charts.filter(c => c.status === 'SUCCESS');
    const perfect = successful.filter(c => c.matches.ascendant && c.matches.moonSign);
    if (successful.length > 0) {
      console.log(`• ${region}: ${perfect.length}/${successful.length} perfect (${((perfect.length/successful.length)*100).toFixed(1)}%)`);
    }
  });

  if (ascendantMatches > moonSignMatches) {
    console.log("\n• Ascendant calculations outperform Moon position accuracy");
    console.log("• Focus on refining planetary position algorithms");
  } else if (moonSignMatches > ascendantMatches) {
    console.log("\n• Moon calculations outperform Ascendant accuracy");  
    console.log("• Focus on house system or sidereal time calculations");
  } else if (ascendantMatches === moonSignMatches && ascendantMatches < successfulTests) {
    console.log("\n• Balanced accuracy suggests consistent methodology");
    console.log("• May indicate systematic Ayanamsa or epoch differences");
  }

  console.log();
  console.log("=".repeat(80));
  console.log("🎯 CROSS-VALIDATION with Jagannatha Hora & Astrosage completed!");
  
  return results;
}

// Run the tests
runBatch3Tests().catch(error => {
  console.error("Failed to run Batch #3 tests:", error.message);
  console.log("\n💡 Make sure your backend server is running:");
  console.log("   cd backend && npm start");
});
