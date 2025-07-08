#!/usr/bin/env node

/**
 * Comprehensive test script for Batch #3 verified Lahiri Sidereal test cases
 * Tests all 10 charts and compares Ascendant and Moon signs with expected values
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Batch #3 - Verified Lahiri Sidereal Test Cases
const batch3Charts = [
  {
    id: 1,
    name: "Dalai Lama XIV",
    date: "1935-07-06", // DD-MM-YYYY converted to YYYY-MM-DD
    time: "04:38",
    latitude: 29.0,
    longitude: 91.0,
    timezone: "Asia/Kathmandu",
    place: "Lhasa, Tibet",
    expected: { ascendant: "Gemini", moon: "Scorpio" }
  },
  {
    id: 2,
    name: "Oprah Winfrey",
    date: "1954-01-29",
    time: "04:30",
    latitude: 33.7,
    longitude: -90.7,
    timezone: "America/Chicago",
    place: "Kosciusko, MS, USA",
    expected: { ascendant: "Sagittarius", moon: "Scorpio" }
  },
  {
    id: 3,
    name: "John F. Kennedy",
    date: "1917-05-29",
    time: "15:00",
    latitude: 42.3,
    longitude: -71.1,
    timezone: "America/New_York",
    place: "Brookline, MA, USA",
    expected: { ascendant: "Virgo", moon: "Virgo" }
  },
  {
    id: 4,
    name: "Charlie Chaplin",
    date: "1889-04-16",
    time: "20:00",
    latitude: 51.5,
    longitude: -0.1,
    timezone: "Europe/London",
    place: "London, UK",
    expected: { ascendant: "Libra", moon: "Sagittarius" }
  },
  {
    id: 5,
    name: "Adolf Hitler",
    date: "1889-04-20",
    time: "18:30",
    latitude: 48.3,
    longitude: 13.1,
    timezone: "Europe/Berlin",
    place: "Braunau am Inn, Austria",
    expected: { ascendant: "Libra", moon: "Capricorn" }
  },
  {
    id: 6,
    name: "Leonardo DiCaprio",
    date: "1974-11-11",
    time: "02:47",
    latitude: 34.1,
    longitude: -118.2,
    timezone: "America/Los_Angeles",
    place: "Los Angeles, CA, USA",
    expected: { ascendant: "Virgo", moon: "Aries" }
  },
  {
    id: 7,
    name: "Taylor Swift",
    date: "1989-12-13",
    time: "05:17",
    latitude: 40.6,
    longitude: -75.5,
    timezone: "America/New_York",
    place: "West Reading, PA, USA",
    expected: { ascendant: "Scorpio", moon: "Sagittarius" }
  },
  {
    id: 8,
    name: "Priyanka Chopra",
    date: "1982-07-18",
    time: "00:00",
    latitude: 26.9,
    longitude: 80.9,
    timezone: "Asia/Kolkata",
    place: "Jamshedpur, India",
    expected: { ascendant: "Aries", moon: "Leo" }
  },
  {
    id: 9,
    name: "Rabindranath Tagore",
    date: "1861-05-07",
    time: "04:00",
    latitude: 22.6,
    longitude: 88.4,
    timezone: "Asia/Kolkata",
    place: "Kolkata, India",
    expected: { ascendant: "Taurus", moon: "Libra" }
  },
  {
    id: 10,
    name: "Bruce Lee",
    date: "1940-11-27",
    time: "07:12",
    latitude: 37.8,
    longitude: -122.4,
    timezone: "America/Los_Angeles",
    place: "San Francisco, CA, USA",
    expected: { ascendant: "Scorpio", moon: "Capricorn" }
  }
];

async function testSingleChart(chart) {
  try {
    console.log(`\n🧪 Testing #${chart.id}: ${chart.name}`);
    console.log(`📊 Input: ${chart.date} ${chart.time} at ${chart.latitude}°N, ${chart.longitude}°E`);
    
    const response = await axios.post(`${API_BASE}/api/kundli`, {
      name: chart.name,
      date: chart.date,
      time: chart.time,
      latitude: chart.latitude,
      longitude: chart.longitude,
      timezone: chart.timezone,
      place: chart.place
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    if (response.status === 200) {
      const data = response.data.data;
      const actualAscendant = data.chartSummary.ascendant.sign;
      const actualMoon = data.chartSummary.moonSign.sign;
      
      const ascendantMatch = actualAscendant === chart.expected.ascendant;
      const moonMatch = actualMoon === chart.expected.moon;
      
      console.log(`✅ Status: SUCCESS (200)`);
      console.log(`🔮 Expected: Asc=${chart.expected.ascendant}, Moon=${chart.expected.moon}`);
      console.log(`🎯 Actual: Asc=${actualAscendant}, Moon=${actualMoon}`);
      console.log(`📊 Match: Asc=${ascendantMatch ? '✅' : '❌'}, Moon=${moonMatch ? '✅' : '❌'}`);
      
      return {
        id: chart.id,
        name: chart.name,
        status: 'success',
        ascendantMatch,
        moonMatch,
        expected: chart.expected,
        actual: { ascendant: actualAscendant, moon: actualMoon },
        julianDay: data.julianDay || 'N/A'
      };
    } else {
      console.log(`❌ HTTP Error: ${response.status}`);
      return {
        id: chart.id,
        name: chart.name,
        status: 'error',
        error: `HTTP ${response.status}`,
        ascendantMatch: false,
        moonMatch: false
      };
    }
    
  } catch (error) {
    let errorMsg = 'Unknown error';
    if (error.response) {
      errorMsg = `HTTP ${error.response.status}: ${error.response.data.message || 'API Error'}`;
      console.log(`❌ API Error: ${error.response.status}`);
      console.log(`📝 Message: ${error.response.data.message || 'Unknown error'}`);
    } else if (error.request) {
      errorMsg = 'Network error - server not responding';
      console.log(`❌ Network Error: Server not responding`);
    } else {
      errorMsg = error.message;
      console.log(`❌ Request Error: ${error.message}`);
    }
    
    return {
      id: chart.id,
      name: chart.name,
      status: 'error',
      error: errorMsg,
      ascendantMatch: false,
      moonMatch: false
    };
  }
}

async function runBatchTest() {
  console.log('🎯 BATCH #3 COMPREHENSIVE TEST');
  console.log('📋 Testing 10 verified Lahiri Sidereal charts\n');
  
  const results = [];
  
  for (const chart of batch3Charts) {
    const result = await testSingleChart(chart);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary Report
  console.log('\n📊 BATCH TEST SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');
  const ascendantMatches = successful.filter(r => r.ascendantMatch);
  const moonMatches = successful.filter(r => r.moonMatch);
  const bothMatches = successful.filter(r => r.ascendantMatch && r.moonMatch);
  
  console.log(`📈 Success Rate: ${successful.length}/${results.length} (${((successful.length/results.length)*100).toFixed(1)}%)`);
  console.log(`🎯 Ascendant Accuracy: ${ascendantMatches.length}/${successful.length} (${successful.length > 0 ? ((ascendantMatches.length/successful.length)*100).toFixed(1) : 0}%)`);
  console.log(`🌙 Moon Accuracy: ${moonMatches.length}/${successful.length} (${successful.length > 0 ? ((moonMatches.length/successful.length)*100).toFixed(1) : 0}%)`);
  console.log(`✨ Perfect Matches: ${bothMatches.length}/${successful.length} (${successful.length > 0 ? ((bothMatches.length/successful.length)*100).toFixed(1) : 0}%)`);
  
  if (failed.length > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    failed.forEach(f => {
      console.log(`   #${f.id}: ${f.name} - ${f.error}`);
    });
  }
  
  if (successful.length > 0) {
    console.log(`\n📋 DETAILED RESULTS:`);
    successful.forEach(r => {
      const ascIcon = r.ascendantMatch ? '✅' : '❌';
      const moonIcon = r.moonMatch ? '✅' : '❌';
      console.log(`   #${r.id}: ${r.name.padEnd(20)} | Asc: ${ascIcon} ${r.actual.ascendant.padEnd(11)} (exp: ${r.expected.ascendant.padEnd(11)}) | Moon: ${moonIcon} ${r.actual.moon.padEnd(11)} (exp: ${r.expected.moon.padEnd(11)})`);
    });
  }
  
  console.log('\n🎉 Batch test completed!');
}

// Run the comprehensive test
runBatchTest().catch(console.error);
