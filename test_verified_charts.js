#!/usr/bin/env node

/**
 * Test 10 Verified Birth Charts against Astrova App
 * All charts use Lahiri Ayanamsa and Sidereal calculations
 */

const axios = require('axios');

// Test data - 10 verified birth charts
const verifiedCharts = [
  {
    id: 1,
    name: "Indira Gandhi",
    date: "1917-11-19",
    time: "23:11",
    place: "Allahabad, India",
    coordinates: { lat: 25.4358, lng: 81.8463 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Cancer",
      moonSign: "Capricorn"
    }
  },
  {
    id: 2,
    name: "Sachin Tendulkar", 
    date: "1973-04-24",
    time: "18:01",
    place: "Mumbai, India",
    coordinates: { lat: 19.076, lng: 72.8777 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Libra",
      moonSign: "Sagittarius"
    }
  },
  {
    id: 3,
    name: "Narendra Modi",
    date: "1950-09-17", 
    time: "11:00",
    place: "Vadnagar, India",
    coordinates: { lat: 23.7864, lng: 72.6411 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Scorpio",
      moonSign: "Scorpio"
    }
  },
  {
    id: 4,
    name: "Amitabh Bachchan",
    date: "1942-10-11",
    time: "16:00", 
    place: "Allahabad, India",
    coordinates: { lat: 25.4358, lng: 81.8463 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Aquarius",
      moonSign: "Sagittarius"
    }
  },
  {
    id: 5,
    name: "APJ Abdul Kalam",
    date: "1931-10-15",
    time: "11:50",
    place: "Rameswaram, India", 
    coordinates: { lat: 9.2876, lng: 79.3129 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Sagittarius",
      moonSign: "Aries"
    }
  },
  {
    id: 6,
    name: "Swami Vivekananda",
    date: "1863-01-12",
    time: "06:33",
    place: "Kolkata, India",
    coordinates: { lat: 22.5726, lng: 88.3639 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Capricorn", 
      moonSign: "Capricorn"
    }
  },
  {
    id: 7,
    name: "Mahatma Gandhi",
    date: "1869-10-02",
    time: "07:11",
    place: "Porbandar, India",
    coordinates: { lat: 21.6417, lng: 69.6293 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Libra",
      moonSign: "Pisces"
    }
  },
  {
    id: 8,
    name: "Mother Teresa",
    date: "1910-08-26", 
    time: "14:25",
    place: "Skopje, N. Macedonia",
    coordinates: { lat: 41.9973, lng: 21.4280 },
    timezone: "Europe/Skopje", // CET timezone
    expected: {
      ascendant: "Sagittarius",
      moonSign: "Aries"
    }
  },
  {
    id: 9,
    name: "Jawaharlal Nehru",
    date: "1889-11-14",
    time: "23:27",
    place: "Allahabad, India",
    coordinates: { lat: 25.4358, lng: 81.8463 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Cancer",
      moonSign: "Cancer"
    }
  },
  {
    id: 10,
    name: "Dr. B.R. Ambedkar",
    date: "1891-04-14",
    time: "14:12",
    place: "Mhow, India",
    coordinates: { lat: 22.5522, lng: 75.7566 },
    timezone: "Asia/Kolkata",
    expected: {
      ascendant: "Leo",
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
      }
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

async function runAllTests() {
  console.log("🧪 TESTING 10 VERIFIED BIRTH CHARTS");
  console.log("=".repeat(80));
  console.log("Using Lahiri Ayanamsa (Sidereal) - Industry Standard");
  console.log("=".repeat(80));
  console.log();

  const results = [];
  
  for (let i = 0; i < verifiedCharts.length; i++) {
    const chart = verifiedCharts[i];
    console.log(`Testing ${i + 1}/10: ${chart.name}...`);
    
    const result = await testChart(chart);
    results.push(result);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
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
    console.log(`   Expected: Asc: ${result.expected.ascendant} | Moon: ${result.expected.moonSign}`);
    console.log(`   Your App: Asc: ${result.actual.ascendant} | Moon: ${result.actual.moonSign}`);
    console.log(`   Matches:  Asc: ${ascMatch} | Moon: ${moonMatch}`);
    console.log(`   Degrees:  Asc: ${result.degrees.ascendant} | Moon: ${result.degrees.moonSign}`);
  });

  console.log();
  console.log("📈 SUMMARY STATISTICS:");
  console.log("=".repeat(80));
  console.log(`Total Charts Tested: ${results.length}`);
  console.log(`Successful Calculations: ${successfulTests}/${results.length}`);
  console.log(`Perfect Matches (Both Asc + Moon): ${totalMatches}/${successfulTests} (${((totalMatches/successfulTests)*100).toFixed(1)}%)`);
  console.log(`Ascendant Matches: ${ascendantMatches}/${successfulTests} (${((ascendantMatches/successfulTests)*100).toFixed(1)}%)`);
  console.log(`Moon Sign Matches: ${moonSignMatches}/${successfulTests} (${((moonSignMatches/successfulTests)*100).toFixed(1)}%)`);
  
  console.log();
  if (totalMatches === successfulTests) {
    console.log("🎉 PERFECT SCORE! Your app is 100% accurate!");
    console.log("✅ All calculations match verified Vedic astrology references.");
  } else if (totalMatches >= successfulTests * 0.8) {
    console.log("✅ EXCELLENT! Your app shows high accuracy.");
    console.log("🔧 Minor adjustments may be needed for perfect alignment.");
  } else if (totalMatches >= successfulTests * 0.5) {
    console.log("⚠️  MODERATE accuracy detected.");
    console.log("🛠️  Significant calculation issues need investigation.");
  } else {
    console.log("❌ LOW accuracy detected.");
    console.log("🚨 Major calculation errors - immediate debugging required.");
  }

  console.log();
  console.log("🔍 ANALYSIS:");
  
  if (ascendantMatches > moonSignMatches) {
    console.log("• Ascendant calculations are more accurate than Moon positions");
    console.log("• Focus debugging on Moon/planetary position calculations");
  } else if (moonSignMatches > ascendantMatches) {
    console.log("• Moon calculations are more accurate than Ascendant positions");  
    console.log("• Focus debugging on Ascendant/house calculations");
  } else if (ascendantMatches === moonSignMatches && ascendantMatches < successfulTests) {
    console.log("• Both Ascendant and Moon show similar accuracy issues");
    console.log("• Suggests systematic calculation problem (timezone, ayanamsa, etc.)");
  }

  console.log();
  console.log("=".repeat(80));
  console.log("Test completed!");
  
  return results;
}

// Run the tests
runAllTests().catch(error => {
  console.error("Failed to run tests:", error.message);
  console.log("\n💡 Make sure your backend server is running:");
  console.log("   cd backend && npm start");
});
