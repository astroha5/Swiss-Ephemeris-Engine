const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Test the Kundli API to ensure planetary aspects are included
 */
async function testKundliWithAspects() {
  try {
    logger.info('🧪 Testing Kundli API with planetary aspects integration...');
    
    const testData = {
      date: '1990-01-15',
      time: '10:30',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 'Asia/Kolkata',
      name: 'Test Person',
      place: 'New Delhi, India'
    };
    
    logger.info(`📊 Test data: ${JSON.stringify(testData, null, 2)}`);
    
    // Make the request to the Kundli endpoint
    const response = await axios.post('http://localhost:3001/api/kundli', testData);
    
    if (!response.data.success) {
      throw new Error(`API request failed: ${response.data.error}`);
    }
    
    const kundliData = response.data.data;
    
    // Test basic structure
    logger.info('✅ API request successful');
    logger.info(`📋 Birth Details: ${kundliData.birthDetails.name} born on ${kundliData.birthDetails.dateOfBirth}`);
    logger.info(`🏠 Chart has ${kundliData.charts.lagna.houses.length} houses`);
    logger.info(`🪐 Found ${kundliData.planetaryData.length} planets`);
    
    // Test aspects integration
    if (kundliData.aspects) {
      const aspects = kundliData.aspects;
      
      logger.info('🎯 ASPECTS DATA FOUND:');
      logger.info(`   - Planetary aspects: ${aspects.summary.totalPlanetaryAspects}`);
      logger.info(`   - Planets with house aspects: ${aspects.summary.planetsWithHouseAspects}`);
      logger.info(`   - Rahu/Ketu special aspects: ${aspects.summary.rahuKetuSpecialAspectsEnabled ? 'ENABLED' : 'DISABLED'}`);
      logger.info(`   - Strongest aspects: ${aspects.strongestAspects.length}`);
      
      // Display strongest aspects
      if (aspects.strongestAspects.length > 0) {
        logger.info('   💪 Top aspects:');
        aspects.strongestAspects.forEach((aspect, index) => {
          logger.info(`      ${index + 1}. ${aspect.planet1} → ${aspect.planet2}: ${aspect.aspect} (${aspect.strength}, ${aspect.nature})`);
        });
      }
      
      // Display sample house aspects
      if (aspects.houseAspects) {
        logger.info('   🏠 Sample house aspects:');
        const planets = Object.keys(aspects.houseAspects).slice(0, 3);
        planets.forEach(planet => {
          const planetAspect = aspects.houseAspects[planet];
          const houses = planetAspect.aspectsToHouses.map(a => a.houseNumber).join(', ');
          logger.info(`      ${planetAspect.planetName} (House ${planetAspect.currentHouse}) → Houses ${houses}`);
        });
      }
      
      logger.info('✅ Aspects integration test PASSED');
    } else {
      logger.error('❌ No aspects data found in response');
    }
    
    // Test specific planetary positions for our test cases
    const jupiter = kundliData.planetaryData.find(p => p.planet === 'Jupiter');
    const mars = kundliData.planetaryData.find(p => p.planet === 'Mars');
    
    if (jupiter) {
      logger.info(`♃ Jupiter: ${jupiter.sign} in House ${jupiter.house}`);
      const jupiterAspects = kundliData.aspects.houseAspects?.jupiter;
      if (jupiterAspects) {
        const aspectedHouses = jupiterAspects.aspectsToHouses.map(a => a.houseNumber).sort().join(', ');
        logger.info(`   Jupiter aspects houses: ${aspectedHouses}`);
      }
    }
    
    if (mars) {
      logger.info(`♂ Mars: ${mars.sign} in House ${mars.house}`);
      const marsAspects = kundliData.aspects.houseAspects?.mars;
      if (marsAspects) {
        const aspectedHouses = marsAspects.aspectsToHouses.map(a => a.houseNumber).sort().join(', ');
        logger.info(`   Mars aspects houses: ${aspectedHouses}`);
      }
    }
    
    logger.info('🎉 Kundli API integration test completed successfully!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logger.error('❌ Server not running. Please start the server with: npm start');
    } else {
      logger.error('❌ Test failed:', error.message);
      if (error.response) {
        logger.error('Response data:', error.response.data);
      }
    }
    throw error;
  }
}

// Run the test
testKundliWithAspects()
  .then(() => {
    logger.info('✅ All tests passed!');
    process.exit(0);
  })
  .catch(error => {
    logger.error('💥 Test failed:', error.message);
    process.exit(1);
  });
