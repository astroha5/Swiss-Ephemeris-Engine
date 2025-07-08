const axios = require('axios');
const moment = require('moment-timezone');

/**
 * Debug Chart Verifier Script
 * 
 * This script provides detailed analysis of chart calculations by:
 * 1. Converting Julian Day back to UTC datetime for verification
 * 2. Logging all intermediate conversion steps
 * 3. Comparing results with reference charts
 * 4. Providing detailed timezone conversion audit trail
 */

class DebugChartVerifier {
  constructor(apiBaseUrl = 'http://localhost:3000') {
    this.apiBaseUrl = apiBaseUrl;
    this.testCases = [
      {
        id: 'test_1',
        name: 'Steve Jobs',
        birthDate: '1955-02-24',
        birthTime: '19:15:00',
        birthPlace: 'San Francisco, CA, USA',
        timezone: 'America/Los_Angeles',
        latitude: 37.7749,
        longitude: -122.4194,
        expectedMoonSign: 'Scorpio',
        expectedAscendant: 'Virgo',
        reference: 'Jagannatha Hora'
      },
      {
        id: 'test_2', 
        name: 'Albert Einstein',
        birthDate: '1879-03-14',
        birthTime: '11:30:00',
        birthPlace: 'Ulm, Germany',
        timezone: 'Europe/Berlin',
        latitude: 48.4011,
        longitude: 9.9876,
        expectedMoonSign: 'Sagittarius',
        expectedAscendant: 'Cancer',
        reference: 'Jagannatha Hora'
      },
      {
        id: 'test_3',
        name: 'Mahatma Gandhi',
        birthDate: '1869-10-02',
        birthTime: '07:45:00',
        birthPlace: 'Porbandar, India',
        timezone: 'Asia/Kolkata',
        latitude: 21.6417,
        longitude: 69.6293,
        expectedMoonSign: 'Leo',
        expectedAscendant: 'Libra',
        reference: 'Jagannatha Hora'
      }
    ];
  }

  /**
   * Convert Julian Day back to UTC datetime for verification
   */
  julianDayToUTC(julianDay) {
    // Julian Day 0 corresponds to January 1, 4713 BCE in the proleptic Julian calendar
    // JavaScript Date uses January 1, 1970 as epoch
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const julianEpoch = 2440587.5; // Julian Day for January 1, 1970 00:00:00 UTC
    
    const daysSinceEpoch = julianDay - julianEpoch;
    const millisecondsSinceEpoch = daysSinceEpoch * millisecondsPerDay;
    
    return new Date(millisecondsSinceEpoch);
  }

  /**
   * Format datetime for logging
   */
  formatDateTime(date, timezone = 'UTC') {
    if (timezone === 'UTC') {
      return `${date.toISOString().replace('T', ' ').replace('Z', '')} UTC`;
    }
    return moment(date).tz(timezone).format('YYYY-MM-DD HH:mm:ss z');
  }

  /**
   * Calculate Julian Day manually for verification
   */
  calculateJulianDay(year, month, day, hour, minute, second) {
    // Gregorian calendar Julian Day calculation
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    // Add fractional day
    const fractionOfDay = (hour + minute / 60 + second / 3600) / 24;
    
    return jdn + fractionOfDay - 0.5; // Subtract 0.5 because Julian Day starts at noon
  }

  /**
   * Perform detailed timezone conversion analysis
   */
  analyzeTimezoneConversion(birthDateTime, timezone, coordinates) {
    console.log('\n=== TIMEZONE CONVERSION ANALYSIS ===');
    
    // Parse birth date/time
    const localDateTime = moment.tz(`${birthDateTime}`, timezone);
    console.log(`📅 Local Birth DateTime: ${localDateTime.format('YYYY-MM-DD HH:mm:ss z')}`);
    
    // Get UTC conversion
    const utcDateTime = localDateTime.utc();
    console.log(`🌍 UTC DateTime: ${utcDateTime.format('YYYY-MM-DD HH:mm:ss')} UTC`);
    
    // Calculate timezone offset
    const offsetMinutes = localDateTime.utcOffset();
    const offsetHours = offsetMinutes / 60;
    console.log(`⏰ Timezone Offset: ${offsetHours >= 0 ? '+' : ''}${offsetHours.toFixed(2)} hours (${offsetMinutes} minutes)`);
    
    // Manual Julian Day calculation
    const utcYear = utcDateTime.year();
    const utcMonth = utcDateTime.month() + 1; // moment.js uses 0-based months
    const utcDay = utcDateTime.date();
    const utcHour = utcDateTime.hour();
    const utcMinute = utcDateTime.minute();
    const utcSecond = utcDateTime.second();
    
    const calculatedJD = this.calculateJulianDay(utcYear, utcMonth, utcDay, utcHour, utcMinute, utcSecond);
    console.log(`🔢 Manual Julian Day: ${calculatedJD.toFixed(8)}`);
    
    // Convert back to verify
    const verificationUTC = this.julianDayToUTC(calculatedJD);
    console.log(`✅ JD Back to UTC: ${this.formatDateTime(verificationUTC)}`);
    
    return {
      localDateTime: localDateTime.format(),
      utcDateTime: utcDateTime.format(),
      offsetHours,
      calculatedJD,
      verificationUTC
    };
  }

  /**
   * Verify a single chart calculation
   */
  async verifyChart(testCase) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔍 VERIFYING CHART: ${testCase.name}`);
    console.log('='.repeat(60));
    
    // Analyze timezone conversion
    const birthDateTime = `${testCase.birthDate} ${testCase.birthTime}`;
    const timezoneAnalysis = this.analyzeTimezoneConversion(birthDateTime, testCase.timezone, {
      latitude: testCase.latitude,
      longitude: testCase.longitude
    });
    
    // Prepare API request
    const requestData = {
      birthDate: testCase.birthDate,
      birthTime: testCase.birthTime,
      birthPlace: testCase.birthPlace,
      timezone: testCase.timezone,
      latitude: testCase.latitude,
      longitude: testCase.longitude
    };
    
    console.log('\n📤 API REQUEST DATA:');
    console.log(JSON.stringify(requestData, null, 2));
    
    try {
      // Make API call
      const response = await axios.post(`${this.apiBaseUrl}/api/chart/calculate`, requestData);
      
      if (response.data.success) {
        const chart = response.data.chart;
        
        console.log('\n📊 CHART CALCULATION RESULTS:');
        console.log(`🌙 Moon Sign: ${chart.planets.moon.sign} (Expected: ${testCase.expectedMoonSign})`);
        console.log(`🌅 Ascendant: ${chart.ascendant.sign} (Expected: ${testCase.expectedAscendant})`);
        
        // Detailed planetary positions
        console.log('\n🪐 PLANETARY POSITIONS:');
        Object.entries(chart.planets).forEach(([planet, data]) => {
          console.log(`  ${planet.toUpperCase()}: ${data.sign} ${data.degreeFormatted} (${data.longitude.toFixed(4)}°)`);
        });
        
        // Julian Day verification
        if (chart.julianDay) {
          console.log(`\n🔢 API Julian Day: ${chart.julianDay.toFixed(8)}`);
          const apiJDtoUTC = this.julianDayToUTC(chart.julianDay);
          console.log(`✅ API JD Back to UTC: ${this.formatDateTime(apiJDtoUTC)}`);
          
          const jdDifference = Math.abs(chart.julianDay - timezoneAnalysis.calculatedJD);
          console.log(`📏 Julian Day Difference: ${jdDifference.toFixed(8)} days`);
          
          if (jdDifference > 0.0001) {
            console.log('⚠️  WARNING: Significant Julian Day difference detected!');
          }
        }
        
        // Match analysis
        const moonMatch = chart.planets.moon.sign === testCase.expectedMoonSign;
        const ascendantMatch = chart.ascendant.sign === testCase.expectedAscendant;
        
        console.log('\n📈 ACCURACY ANALYSIS:');
        console.log(`🌙 Moon Sign Match: ${moonMatch ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🌅 Ascendant Match: ${ascendantMatch ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📊 Reference: ${testCase.reference}`);
        
        // If there's a mismatch, provide detailed analysis
        if (!moonMatch || !ascendantMatch) {
          console.log('\n🔍 MISMATCH ANALYSIS:');
          if (!moonMatch) {
            console.log(`  Moon: Got ${chart.planets.moon.sign}, Expected ${testCase.expectedMoonSign}`);
            console.log(`  Moon Longitude: ${chart.planets.moon.longitude.toFixed(4)}°`);
          }
          if (!ascendantMatch) {
            console.log(`  Ascendant: Got ${chart.ascendant.sign}, Expected ${testCase.expectedAscendant}`);
            console.log(`  Ascendant Longitude: ${chart.ascendant.longitude.toFixed(4)}°`);
          }
        }
        
        return {
          success: true,
          moonMatch,
          ascendantMatch,
          chart,
          timezoneAnalysis
        };
        
      } else {
        console.log('❌ API Error:', response.data.error);
        return { success: false, error: response.data.error };
      }
      
    } catch (error) {
      console.log('❌ Request Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run verification for all test cases
   */
  async runAllVerifications() {
    console.log('🚀 Starting Debug Chart Verification');
    console.log(`📡 API Base URL: ${this.apiBaseUrl}`);
    
    const results = [];
    
    for (const testCase of this.testCases) {
      const result = await this.verifyChart(testCase);
      results.push({
        testCase: testCase.id,
        name: testCase.name,
        ...result
      });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const moonMatches = successful.filter(r => r.moonMatch);
    const ascendantMatches = successful.filter(r => r.ascendantMatch);
    
    console.log(`✅ Successful API calls: ${successful.length}/${results.length}`);
    console.log(`🌙 Moon sign matches: ${moonMatches.length}/${successful.length} (${(moonMatches.length/successful.length*100).toFixed(1)}%)`);
    console.log(`🌅 Ascendant matches: ${ascendantMatches.length}/${successful.length} (${(ascendantMatches.length/successful.length*100).toFixed(1)}%)`);
    
    // Failed cases
    const failedCases = successful.filter(r => !r.moonMatch || !r.ascendantMatch);
    if (failedCases.length > 0) {
      console.log('\n❌ FAILED CASES:');
      failedCases.forEach(result => {
        console.log(`  ${result.name}: Moon ${result.moonMatch ? '✅' : '❌'}, Ascendant ${result.ascendantMatch ? '✅' : '❌'}`);
      });
    }
    
    return results;
  }

  /**
   * Run verification for a single test case by ID
   */
  async verifySingle(testId) {
    const testCase = this.testCases.find(t => t.id === testId);
    if (!testCase) {
      console.log(`❌ Test case '${testId}' not found`);
      return null;
    }
    
    return await this.verifyChart(testCase);
  }
}

// CLI usage
async function main() {
  const verifier = new DebugChartVerifier();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run all verifications
    await verifier.runAllVerifications();
  } else if (args[0] === 'single' && args[1]) {
    // Run single verification
    await verifier.verifySingle(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node debug_chart_verifier.js                 # Run all verifications');
    console.log('  node debug_chart_verifier.js single test_1   # Run single test case');
    console.log('');
    console.log('Available test cases:');
    console.log('  test_1 - Steve Jobs');
    console.log('  test_2 - Albert Einstein');
    console.log('  test_3 - Mahatma Gandhi');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DebugChartVerifier;
