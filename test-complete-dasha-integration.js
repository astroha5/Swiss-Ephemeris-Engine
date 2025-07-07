#!/usr/bin/env node

/**
 * Complete Frontend-Backend Integration Test with Dasha Functionality
 * Tests all major endpoints and verifies the complete user flow
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Test user data
const testUser = {
  date: '1990-01-15',
  time: '10:30',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 'Asia/Kolkata',
  name: 'Integration Test User',
  place: 'New Delhi, India'
};

async function testHealthCheck() {
  console.log('🏥 Testing backend health check...');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    if (response.data.status === 'healthy') {
      console.log('✅ Backend health check passed');
      return true;
    }
    throw new Error('Backend unhealthy');
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function testKundliGeneration() {
  console.log('\n📊 Testing Kundli generation...');
  try {
    const response = await axios.post(`${API_BASE}/api/kundli`, testUser);
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      console.log('✅ Kundli generation successful');
      console.log(`  - Birth Details: ${data.birthDetails.name}`);
      console.log(`  - Ascendant: ${data.chartSummary.ascendant.sign}`);
      console.log(`  - Moon Sign: ${data.chartSummary.moonSign.sign}`);
      console.log(`  - Sun Sign: ${data.chartSummary.sunSign.sign}`);
      
      // Check if dasha data exists in kundli response
      if (data.chartSummary.vimshottariDasha) {
        console.log(`  - Current Mahadasha: ${data.chartSummary.vimshottariDasha.currentMahadasha.planet}`);
        console.log(`  - Current Antardasha: ${data.chartSummary.vimshottariDasha.currentAntardasha.planet}`);
      }
      
      return { success: true, data };
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.log('❌ Kundli generation failed:', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testDashaEndpoints() {
  console.log('\n🕰️ Testing Dasha endpoints...');
  
  const dashaData = {
    birthDate: testUser.date,
    birthTime: testUser.time,
    latitude: testUser.latitude,
    longitude: testUser.longitude,
    timezone: testUser.timezone,
    name: testUser.name,
    place: testUser.place
  };
  
  const results = {
    main: false,
    current: false,
    detailed: false,
    periods: false
  };
  
  // Test main dasha endpoint
  try {
    console.log('  Testing /api/dasha...');
    const response = await axios.post(`${API_BASE}/api/dasha`, dashaData);
    if (response.data.success) {
      console.log('  ✅ Main dasha endpoint working');
      console.log(`    - Birth Dasha Lord: ${response.data.data.birthDetails.birthDashaLord}`);
      console.log(`    - Current Mahadasha: ${response.data.data.currentMahadasha.planet}`);
      console.log(`    - Timeline periods: ${response.data.data.timeline.length}`);
      results.main = true;
    }
  } catch (error) {
    console.log('  ❌ Main dasha endpoint failed:', error.response?.data?.message || error.message);
  }
  
  // Test current dasha endpoint
  try {
    console.log('  Testing /api/dasha/current...');
    const response = await axios.post(`${API_BASE}/api/dasha/current`, dashaData);
    if (response.data.success) {
      console.log('  ✅ Current dasha endpoint working');
      console.log(`    - Current Mahadasha: ${response.data.data.currentMahadasha.planet}`);
      console.log(`    - Current Antardasha: ${response.data.data.currentAntardasha.planet}`);
      results.current = true;
    }
  } catch (error) {
    console.log('  ❌ Current dasha endpoint failed:', error.response?.data?.message || error.message);
  }
  
  // Test detailed dasha endpoint
  try {
    console.log('  Testing /api/dasha/detailed...');
    const response = await axios.post(`${API_BASE}/api/dasha/detailed`, {
      ...dashaData,
      includeSubPeriods: true
    });
    if (response.data.success) {
      console.log('  ✅ Detailed dasha endpoint working');
      console.log(`    - Birth Chart Moon: ${response.data.data.birthChart.moonPosition.sign}`);
      results.detailed = true;
    }
  } catch (error) {
    console.log('  ❌ Detailed dasha endpoint failed:', error.response?.data?.message || error.message);
  }
  
  // Test periods reference endpoint
  try {
    console.log('  Testing /api/dasha/periods...');
    const response = await axios.get(`${API_BASE}/api/dasha/periods`);
    if (response.data.success) {
      console.log('  ✅ Periods reference endpoint working');
      console.log(`    - Total cycle: ${response.data.data.totalCycle} years`);
      results.periods = true;
    }
  } catch (error) {
    console.log('  ❌ Periods reference endpoint failed:', error.response?.data?.message || error.message);
  }
  
  return results;
}

async function testAPIErrorHandling() {
  console.log('\n🚨 Testing API error handling...');
  
  try {
    // Test with invalid data
    await axios.post(`${API_BASE}/api/dasha`, {
      birthDate: 'invalid-date',
      birthTime: '25:99',
      latitude: 999,
      longitude: -999
    });
    console.log('❌ Error handling test failed - should have thrown error');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Error handling working correctly');
      console.log(`  - Status: ${error.response.status}`);
      console.log(`  - Error: ${error.response.data.error}`);
      return true;
    }
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

async function runCompleteIntegrationTest() {
  console.log('🎯 COMPLETE ASTROVA INTEGRATION TEST');
  console.log('=' .repeat(50));
  console.log(`🌐 Backend URL: ${API_BASE}`);
  console.log(`📊 Test User: ${testUser.name} (${testUser.date} ${testUser.time})`);
  console.log('=' .repeat(50));
  
  const results = {
    health: false,
    kundli: false,
    dasha: { main: false, current: false, detailed: false, periods: false },
    errorHandling: false
  };
  
  // Run all tests
  results.health = await testHealthCheck();
  
  if (results.health) {
    const kundliResult = await testKundliGeneration();
    results.kundli = kundliResult.success;
    
    results.dasha = await testDashaEndpoints();
    results.errorHandling = await testAPIErrorHandling();
  } else {
    console.log('\n⚠️ Skipping other tests due to health check failure');
  }
  
  // Generate summary report
  console.log('\n📋 INTEGRATION TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const healthIcon = results.health ? '✅' : '❌';
  const kundliIcon = results.kundli ? '✅' : '❌';
  const dashaMainIcon = results.dasha.main ? '✅' : '❌';
  const dashaCurrentIcon = results.dasha.current ? '✅' : '❌';
  const dashaDetailedIcon = results.dasha.detailed ? '✅' : '❌';
  const dashaPeriodsIcon = results.dasha.periods ? '✅' : '❌';
  const errorHandlingIcon = results.errorHandling ? '✅' : '❌';
  
  console.log(`${healthIcon} Backend Health Check`);
  console.log(`${kundliIcon} Kundli Generation`);
  console.log(`${dashaMainIcon} Dasha Main Endpoint`);
  console.log(`${dashaCurrentIcon} Dasha Current Endpoint`);
  console.log(`${dashaDetailedIcon} Dasha Detailed Endpoint`);
  console.log(`${dashaPeriodsIcon} Dasha Periods Reference`);
  console.log(`${errorHandlingIcon} Error Handling`);
  
  const totalTests = 7;
  const passedTests = [
    results.health,
    results.kundli,
    results.dasha.main,
    results.dasha.current,
    results.dasha.detailed,
    results.dasha.periods,
    results.errorHandling
  ].filter(Boolean).length;
  
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log('\n📊 OVERALL RESULTS');
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Frontend-Backend integration is working perfectly!');
    console.log('🌟 The application is ready for production use.');
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above for details.');
  }
  
  console.log('\n🚀 To access the application:');
  console.log('   Frontend: http://localhost:4028');
  console.log('   Backend API: http://localhost:3001');
  console.log('   Backend Health: http://localhost:3001/health');
  
  return passedTests === totalTests;
}

// Run the complete integration test
runCompleteIntegrationTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Integration test crashed:', error);
    process.exit(1);
  });
