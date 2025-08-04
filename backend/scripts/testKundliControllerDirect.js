const kundliController = require('../controllers/kundliController');
const logger = require('../utils/logger');

/**
 * Direct test of the Kundli controller to validate aspects integration
 */
async function testKundliControllerDirect() {
  try {
    logger.info('🧪 Testing Kundli Controller directly with planetary aspects...');
    
    // Mock request and response objects
    const mockReq = {
      body: {
        date: '1990-01-15',
        time: '10:30',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 'Asia/Kolkata',
        name: 'Test Person',
        place: 'New Delhi, India'
      }
    };
    
    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = { statusCode: code, data };
          return mockRes;
        }
      })
    };
    
    logger.info(`📊 Test parameters: ${mockReq.body.date} ${mockReq.body.time} at ${mockReq.body.place}`);
    
    // Call the controller
    await kundliController.generateKundli(mockReq, mockRes);
    
    if (!responseData) {
      throw new Error('No response received from controller');
    }
    
    if (responseData.statusCode !== 200) {
      throw new Error(`Controller returned error: ${JSON.stringify(responseData.data)}`);
    }
    
    const result = responseData.data;
    
    if (!result.success) {
      throw new Error(`Controller failed: ${result.error}`);
    }
    
    const kundliData = result.data;
    
    // Validate basic structure
    logger.info('✅ Controller executed successfully');
    logger.info(`📋 Generated chart for: ${kundliData.birthDetails.name}`);
    logger.info(`🏠 Houses: ${kundliData.charts.lagna.houses.length}`);
    logger.info(`🪐 Planets: ${kundliData.planetaryData.length}`);
    
    // Validate aspects data
    if (!kundliData.aspects) {
      throw new Error('Missing aspects data in response');
    }
    
    const aspects = kundliData.aspects;
    logger.info('🎯 ASPECTS VALIDATION:');
    logger.info(`   ✅ Planetary aspects: ${aspects.summary.totalPlanetaryAspects}`);
    logger.info(`   ✅ House aspects: ${aspects.summary.planetsWithHouseAspects} planets`);
    logger.info(`   ✅ Strongest aspects: ${aspects.strongestAspects.length}`);
    logger.info(`   📐 Rahu/Ketu special: ${aspects.summary.rahuKetuSpecialAspectsEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    // Display top 3 strongest aspects
    if (aspects.strongestAspects.length > 0) {
      logger.info('   💪 Top 3 strongest aspects:');
      aspects.strongestAspects.slice(0, 3).forEach((aspect, index) => {
        logger.info(`      ${index + 1}. ${aspect.planet1} → ${aspect.planet2}: ${aspect.aspect}`);
        logger.info(`         Strength: ${aspect.strength}, Nature: ${aspect.nature}, Orb: ${aspect.orb}°`);
      });
    }
    
    // Validate house aspects structure
    if (aspects.houseAspects) {
      logger.info('   🏠 House aspects validation:');
      const samplePlanets = Object.keys(aspects.houseAspects).slice(0, 3);
      
      samplePlanets.forEach(planet => {
        const planetAspect = aspects.houseAspects[planet];
        logger.info(`      ${planetAspect.planetName} (House ${planetAspect.currentHouse}):`);
        
        planetAspect.aspectsToHouses.forEach(aspect => {
          const special = aspect.isSpecialAspect ? ' ⭐' : '';
          logger.info(`        → House ${aspect.houseNumber}: ${aspect.aspectType} (${aspect.strength})${special}`);
        });
      });
    }
    
    // Test specific case: find a planet and validate its aspects
    const jupiter = kundliData.planetaryData.find(p => p.planet === 'Jupiter');
    if (jupiter && aspects.houseAspects.jupiter) {
      const jupiterAspects = aspects.houseAspects.jupiter;
      logger.info(`♃ JUPITER TEST CASE:`);
      logger.info(`   Position: ${jupiter.sign} in House ${jupiter.house}`);
      logger.info(`   Expected aspects from house ${jupiter.house}: 5th, 7th, 9th houses`);
      
      const expectedHouses = [
        jupiter.house + 4 > 12 ? jupiter.house + 4 - 12 : jupiter.house + 4,  // 5th
        jupiter.house + 6 > 12 ? jupiter.house + 6 - 12 : jupiter.house + 6,  // 7th
        jupiter.house + 8 > 12 ? jupiter.house + 8 - 12 : jupiter.house + 8   // 9th
      ];
      
      const actualHouses = jupiterAspects.aspectsToHouses.map(a => a.houseNumber).sort();
      logger.info(`   Calculated aspects to houses: ${actualHouses.join(', ')}`);
      
      const aspectsMatch = expectedHouses.sort().join(',') === actualHouses.join(',');
      logger.info(`   ✅ Jupiter aspects ${aspectsMatch ? 'CORRECT' : 'INCORRECT'}`);
    }
    
    logger.info('🎉 Direct controller test completed successfully!');
    return true;
    
  } catch (error) {
    logger.error('❌ Controller test failed:', error.message);
    throw error;
  }
}

// Run the test
testKundliControllerDirect()
  .then(() => {
    logger.info('✅ All direct controller tests passed!');
    process.exit(0);
  })
  .catch(error => {
    logger.error('💥 Direct controller test failed:', error.message);
    process.exit(1);
  });
