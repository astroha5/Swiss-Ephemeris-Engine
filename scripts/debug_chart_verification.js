#!/usr/bin/env node

/**
 * Chart Verification and Debugging Script
 * 
 * This script provides detailed analysis of birth chart calculations including:
 * - Timezone conversion validation
 * - Julian Day calculation verification
 * - Swiss Ephemeris sidereal position calculations
 * - Moon sign and Ascendant sign determination
 * - Side-by-side comparison with reference data
 * 
 * Usage:
 *   node debug_chart_verification.js
 *   
 *   or for a specific chart:
 *   node debug_chart_verification.js --chart "chart_name"
 */

const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const BATCH_3_CHARTS_FILE = path.join(__dirname, '..', 'test_data', 'batch_3_verified_charts.json');

// Enhanced chart debugging function
async function debugChart(chartData, showDetails = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 DEBUGGING CHART: ${chartData.name}`);
  console.log('='.repeat(80));
  
  try {
    // 1. Display input data
    console.log('\n📝 INPUT DATA:');
    console.log(`   Name: ${chartData.name}`);
    console.log(`   Birth Date: ${chartData.birthDate}`);
    console.log(`   Birth Time: ${chartData.birthTime}`);
    console.log(`   Place: ${chartData.place}`);
    console.log(`   Timezone: ${chartData.timezone}`);
    console.log(`   Coordinates: ${chartData.coordinates ? `${chartData.coordinates.lat}°N, ${chartData.coordinates.lng}°E` : 'Not provided'}`);
    
    // 2. Call backend API
    console.log('\n🌐 CALLING BACKEND API...');
    const apiStartTime = Date.now();
    
    const response = await axios.post(`${API_BASE_URL}/calculate-chart`, {
      name: chartData.name,
      birthDate: chartData.birthDate,
      birthTime: chartData.birthTime,
      place: chartData.place,
      timezone: chartData.timezone,
      coordinates: chartData.coordinates
    });
    
    const apiDuration = Date.now() - apiStartTime;
    console.log(`   ✅ API Response received in ${apiDuration}ms`);
    
    if (!response.data || !response.data.success) {
      console.log(`   ❌ API Error: ${response.data?.error || 'Unknown error'}`);
      return null;
    }
    
    const calculation = response.data.data;
    
    // 3. Display timezone conversion details
    if (showDetails) {
      console.log('\n⏰ TIMEZONE CONVERSION ANALYSIS:');
      console.log(`   Input Local Time: ${chartData.birthDate} ${chartData.birthTime}`);
      console.log(`   Calculated UTC: ${calculation.julianDay ? new Date((calculation.julianDay - 2440587.5) * 86400000).toISOString() : 'Not available'}`);
      console.log(`   Julian Day: ${calculation.julianDay?.toFixed(8) || 'Not available'}`);
      console.log(`   Year: ${new Date(chartData.birthDate).getFullYear()} (Historical: ${new Date(chartData.birthDate).getFullYear() < 1955 ? 'YES' : 'NO'})`);
    }
    
    // 4. Display calculated positions
    console.log('\n🌙 CALCULATED POSITIONS:');
    if (calculation.moonPosition) {
      console.log(`   Moon Longitude: ${calculation.moonPosition.longitude?.toFixed(6)}°`);
      console.log(`   Moon Sign: ${calculation.moonPosition.sign} (Sidereal)`);
    } else {
      console.log(`   ❌ Moon position not calculated`);
    }
    
    if (calculation.ascendantPosition) {
      console.log(`   Ascendant Longitude: ${calculation.ascendantPosition.longitude?.toFixed(6)}°`);
      console.log(`   Ascendant Sign: ${calculation.ascendantPosition.sign} (Sidereal)`);
    } else {
      console.log(`   ❌ Ascendant position not calculated`);
    }
    
    // 5. Compare with reference data
    console.log('\n📊 REFERENCE COMPARISON:');
    if (chartData.expectedMoonSign) {
      const moonMatch = calculation.moonPosition?.sign === chartData.expectedMoonSign;
      console.log(`   Expected Moon: ${chartData.expectedMoonSign}`);
      console.log(`   Calculated Moon: ${calculation.moonPosition?.sign || 'N/A'}`);
      console.log(`   Moon Match: ${moonMatch ? '✅ YES' : '❌ NO'}`);
    }
    
    if (chartData.expectedAscendant) {
      const ascMatch = calculation.ascendantPosition?.sign === chartData.expectedAscendant;
      console.log(`   Expected Ascendant: ${chartData.expectedAscendant}`);
      console.log(`   Calculated Ascendant: ${calculation.ascendantPosition?.sign || 'N/A'}`);
      console.log(`   Ascendant Match: ${ascMatch ? '✅ YES' : '❌ NO'}`);
    }
    
    // 6. Additional debugging info
    if (showDetails && calculation.debugInfo) {
      console.log('\n🔧 DEBUG INFORMATION:');
      if (calculation.debugInfo.timezone) {
        console.log(`   Timezone Validation: ${calculation.debugInfo.timezone.validTimezone ? '✅' : '❌'}`);
        console.log(`   International Region: ${calculation.debugInfo.timezone.internationalRegion || 'Not identified'}`);
        console.log(`   Is Historical: ${calculation.debugInfo.timezone.isHistorical ? 'Yes' : 'No'}`);
        console.log(`   Suggested Offset: UTC${calculation.debugInfo.timezone.suggestedOffset >= 0 ? '+' : ''}${calculation.debugInfo.timezone.suggestedOffset}`);
      }
      
      if (calculation.debugInfo.ephemeris) {
        console.log(`   Swiss Ephemeris Version: ${calculation.debugInfo.ephemeris.version || 'Unknown'}`);
        console.log(`   Sidereal Mode: ${calculation.debugInfo.ephemeris.siderealMode || 'Lahiri'}`);
        console.log(`   House System: ${calculation.debugInfo.ephemeris.houseSystem || 'Placidus'}`);
      }
    }
    
    // 7. Manual verification data
    console.log('\n📋 MANUAL VERIFICATION DATA:');
    console.log(`   Use this data to manually verify with other astrology software:`);
    console.log(`   Date: ${chartData.birthDate}`);
    console.log(`   Time: ${chartData.birthTime}`);
    console.log(`   Location: ${chartData.place}`);
    console.log(`   Coordinates: ${chartData.coordinates ? `${chartData.coordinates.lat}°N, ${chartData.coordinates.lng}°E` : 'Use coordinate lookup'}`);
    console.log(`   Timezone: ${chartData.timezone}`);
    console.log(`   Calendar: Gregorian`);
    console.log(`   Ayanamsa: Lahiri (Chitrapaksha)`);
    console.log(`   House System: Placidus`);
    console.log(`   Coordinate System: Sidereal`);
    
    return {
      name: chartData.name,
      success: true,
      calculation: calculation,
      moonMatch: chartData.expectedMoonSign ? calculation.moonPosition?.sign === chartData.expectedMoonSign : null,
      ascendantMatch: chartData.expectedAscendant ? calculation.ascendantPosition?.sign === chartData.expectedAscendant : null
    };
    
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    if (error.response?.data) {
      console.log(`   API Error Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return {
      name: chartData.name,
      success: false,
      error: error.message
    };
  }
}

// Load test charts
function loadTestCharts() {
  try {
    if (!fs.existsSync(BATCH_3_CHARTS_FILE)) {
      console.log(`❌ Test data file not found: ${BATCH_3_CHARTS_FILE}`);
      return [];
    }
    
    const data = fs.readFileSync(BATCH_3_CHARTS_FILE, 'utf8');
    const charts = JSON.parse(data);
    console.log(`✅ Loaded ${charts.length} test charts`);
    return charts;
  } catch (error) {
    console.log(`❌ Error loading test charts: ${error.message}`);
    return [];
  }
}

// Main function
async function main() {
  console.log('🔬 ASTROLOGY CHART VERIFICATION & DEBUGGING TOOL');
  console.log('='.repeat(60));
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const chartNameArg = args.find(arg => arg.startsWith('--chart='));
  const specificChart = chartNameArg ? chartNameArg.split('=')[1] : null;
  
  const charts = loadTestCharts();
  if (charts.length === 0) {
    console.log('No test charts available. Exiting.');
    return;
  }
  
  let chartsToTest = charts;
  if (specificChart) {
    chartsToTest = charts.filter(chart => 
      chart.name.toLowerCase().includes(specificChart.toLowerCase())
    );
    
    if (chartsToTest.length === 0) {
      console.log(`❌ No charts found matching "${specificChart}"`);
      console.log('Available charts:');
      charts.forEach(chart => console.log(`   - ${chart.name}`));
      return;
    }
  }
  
  console.log(`\n🎯 Testing ${chartsToTest.length} chart(s):`);
  chartsToTest.forEach(chart => console.log(`   - ${chart.name}`));
  
  // Test charts
  const results = [];
  for (const chart of chartsToTest) {
    const result = await debugChart(chart, true);
    if (result) {
      results.push(result);
    }
    
    // Add delay between requests
    if (chartsToTest.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  if (results.length > 1) {
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY RESULTS');
    console.log('='.repeat(80));
    
    const successful = results.filter(r => r.success);
    const moonMatches = results.filter(r => r.moonMatch === true);
    const ascendantMatches = results.filter(r => r.ascendantMatch === true);
    const perfectMatches = results.filter(r => r.moonMatch === true && r.ascendantMatch === true);
    
    console.log(`✅ Successful calculations: ${successful.length}/${results.length} (${((successful.length/results.length)*100).toFixed(0)}%)`);
    console.log(`🌙 Moon sign matches: ${moonMatches.length}/${results.length} (${((moonMatches.length/results.length)*100).toFixed(0)}%)`);
    console.log(`⬆️ Ascendant matches: ${ascendantMatches.length}/${results.length} (${((ascendantMatches.length/results.length)*100).toFixed(0)}%)`);
    console.log(`🎯 Perfect matches: ${perfectMatches.length}/${results.length} (${((perfectMatches.length/results.length)*100).toFixed(0)}%)`);
    
    console.log('\n📋 Individual Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const moonStatus = result.moonMatch === true ? '🌙✅' : result.moonMatch === false ? '🌙❌' : '🌙➖';
      const ascStatus = result.ascendantMatch === true ? '⬆️✅' : result.ascendantMatch === false ? '⬆️❌' : '⬆️➖';
      console.log(`   ${status} ${moonStatus} ${ascStatus} ${result.name}`);
    });
  }
  
  console.log('\n🏁 Verification complete!');
  console.log('\nNext steps:');
  console.log('1. Check server logs for detailed timezone conversion info');
  console.log('2. Compare calculated positions with reference astrology software');
  console.log('3. Verify historical timezone data for any discrepancies');
  console.log('4. Consider birth time sensitivity analysis (+/- 15 minutes)');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { debugChart, loadTestCharts };
