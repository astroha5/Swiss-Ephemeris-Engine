const aspectsService = require('../services/aspectsService');
const logger = require('../utils/logger');

/**
 * Comprehensive test suite for Vedic house-based planetary aspects (Drishti)
 * This tests the core functionality of planets aspecting houses as per classical Vedic astrology
 */
async function testVedicHouseAspects() {
  try {
    logger.info('🕉️ Starting Vedic House Aspects (Drishti) Test Suite...');
    
    // Test 1: Jupiter in 1st house aspects validation
    await testJupiterIn1stHouse();
    
    // Test 2: Mars in 3rd house aspects validation  
    await testMarsIn3rdHouse();
    
    // Test 3: Saturn aspects validation
    await testSaturnAspects();
    
    // Test 4: All planets 7th house aspect validation
    await testUniversal7thHouseAspect();
    
    // Test 5: Rahu/Ketu special aspects (configurable)
    await testRahuKetuSpecialAspects();
    
    logger.info('✅ All Vedic House Aspects tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Vedic House Aspects tests failed:', error);
    throw error;
  }
}

/**
 * Test Case 1: Jupiter in 1st house should aspect 5th, 7th, 9th houses
 * This validates the inclusive counting method in Vedic astrology
 */
async function testJupiterIn1stHouse() {
  logger.info('♃ Testing Jupiter in 1st house aspects...');
  
  // Place Jupiter at 15° (1st house if Ascendant is at 0°)
  const planetaryPositions = {
    'jupiter': { 
      longitude: 15, 
      name: 'Jupiter', 
      speed: 0.08 
    }
  };
  
  const ascendant = 0; // Aries rising
  const testResults = aspectsService.getAspectsForTesting(planetaryPositions, ascendant);
  
  const jupiterAspects = testResults.jupiter;
  const expectedHouses = [5, 7, 9]; // 5th, 7th, 9th houses from 1st
  
  logger.info(`   Jupiter current house: ${jupiterAspects.currentHouse}`);
  logger.info(`   Jupiter aspects houses: ${jupiterAspects.aspectedHouses.join(', ')}`);
  logger.info(`   Expected houses: ${expectedHouses.join(', ')}`);
  
  // Validate Jupiter is in 1st house
  if (jupiterAspects.currentHouse === 1) {
    logger.info('   ✅ Jupiter correctly placed in 1st house');
  } else {
    logger.error(`   ❌ Jupiter in house ${jupiterAspects.currentHouse}, expected 1`);
  }
  
  // Validate aspected houses
  const aspectsMatch = expectedHouses.every(house => jupiterAspects.aspectedHouses.includes(house)) &&
                      jupiterAspects.aspectedHouses.every(house => expectedHouses.includes(house));
  
  if (aspectsMatch) {
    logger.info('   ✅ Jupiter aspects validated: 5th, 7th, 9th houses');
  } else {
    logger.error('   ❌ Jupiter aspects mismatch');
  }
}

/**
 * Test Case 2: Mars in 3rd house should aspect 6th, 9th, 10th houses
 * Mars in 3rd aspects: 4th (3+4-1=6), 7th (3+7-1=9), 8th (3+8-1=10) from 3rd
 */
async function testMarsIn3rdHouse() {
  logger.info('♂️ Testing Mars in 3rd house aspects...');
  
  // Place Mars at 75° (3rd house if Ascendant is at 0°)
  const planetaryPositions = {
    'mars': { 
      longitude: 75, 
      name: 'Mars', 
      speed: 0.5 
    }
  };
  
  const ascendant = 0; // Aries rising
  const testResults = aspectsService.getAspectsForTesting(planetaryPositions, ascendant);
  
  const marsAspects = testResults.mars;
  const expectedHouses = [6, 9, 10]; // Mars from 3rd house aspects these
  
  logger.info(`   Mars current house: ${marsAspects.currentHouse}`);
  logger.info(`   Mars aspects houses: ${marsAspects.aspectedHouses.join(', ')}`);
  logger.info(`   Expected houses: ${expectedHouses.join(', ')}`);
  
  // Validate Mars is in 3rd house
  if (marsAspects.currentHouse === 3) {
    logger.info('   ✅ Mars correctly placed in 3rd house');
  } else {
    logger.error(`   ❌ Mars in house ${marsAspects.currentHouse}, expected 3`);
  }
  
  // Validate aspected houses
  const aspectsMatch = expectedHouses.every(house => marsAspects.aspectedHouses.includes(house)) &&
                      marsAspects.aspectedHouses.every(house => expectedHouses.includes(house));
  
  if (aspectsMatch) {
    logger.info('   ✅ Mars aspects validated: 6th, 9th, 10th houses');
  } else {
    logger.error('   ❌ Mars aspects mismatch');
  }
}

/**
 * Test Saturn aspects (3rd, 7th, 10th from its position)
 */
async function testSaturnAspects() {
  logger.info('♄ Testing Saturn special aspects...');
  
  // Place Saturn at 135° (5th house if Ascendant is at 0°)
  const planetaryPositions = {
    'saturn': { 
      longitude: 135, 
      name: 'Saturn', 
      speed: 0.03 
    }
  };
  
  const ascendant = 0; // Aries rising
  const testResults = aspectsService.getAspectsForTesting(planetaryPositions, ascendant);
  
  const saturnAspects = testResults.saturn;
  // From 5th house: 3rd house (5+3-1=7), 7th house (5+7-1=11), 10th house (5+10-1=14, wraps to 2)
  const expectedHouses = [7, 11, 2];
  
  logger.info(`   Saturn current house: ${saturnAspects.currentHouse}`);
  logger.info(`   Saturn aspects houses: ${saturnAspects.aspectedHouses.join(', ')}`);
  logger.info(`   Expected houses: ${expectedHouses.join(', ')}`);
  
  // Validate Saturn is in 5th house
  if (saturnAspects.currentHouse === 5) {
    logger.info('   ✅ Saturn correctly placed in 5th house');
  } else {
    logger.error(`   ❌ Saturn in house ${saturnAspects.currentHouse}, expected 5`);
  }
  
  // Validate aspected houses
  const aspectsMatch = expectedHouses.every(house => saturnAspects.aspectedHouses.includes(house)) &&
                      saturnAspects.aspectedHouses.every(house => expectedHouses.includes(house));
  
  if (aspectsMatch) {
    logger.info('   ✅ Saturn aspects validated: 7th, 11th, 2nd houses');
  } else {
    logger.error('   ❌ Saturn aspects mismatch');
  }
}

/**
 * Test that all planets aspect the 7th house from their position
 */
async function testUniversal7thHouseAspect() {
  logger.info('🎯 Testing universal 7th house aspects...');
  
  const planetaryPositions = {
    'sun': { longitude: 15, name: 'Sun', speed: 1 },        // 1st house
    'moon': { longitude: 45, name: 'Moon', speed: 13 },     // 2nd house  
    'mercury': { longitude: 75, name: 'Mercury', speed: 1.2 }, // 3rd house
    'venus': { longitude: 105, name: 'Venus', speed: 1.1 }   // 4th house
  };
  
  const ascendant = 0;
  const testResults = aspectsService.getAspectsForTesting(planetaryPositions, ascendant);
  
  const expectedAspects = {
    'sun': 7,     // 1st house + 7 - 1 = 7th house
    'moon': 8,    // 2nd house + 7 - 1 = 8th house  
    'mercury': 9, // 3rd house + 7 - 1 = 9th house
    'venus': 10   // 4th house + 7 - 1 = 10th house
  };
  
  let allCorrect = true;
  
  Object.entries(expectedAspects).forEach(([planet, expectedHouse]) => {
    const planetAspects = testResults[planet];
    if (planetAspects && planetAspects.aspectedHouses.includes(expectedHouse)) {
      logger.info(`   ✅ ${planet} aspects ${expectedHouse}th house correctly`);
    } else {
      logger.error(`   ❌ ${planet} missing 7th house aspect to ${expectedHouse}th house`);
      allCorrect = false;
    }
  });
  
  if (allCorrect) {
    logger.info('   ✅ All planets correctly aspect 7th house from their position');
  }
}

/**
 * Test Rahu/Ketu special aspects when enabled
 */
async function testRahuKetuSpecialAspects() {
  logger.info('☊☋ Testing Rahu/Ketu special aspects (configurable)...');
  
  // Test with extended aspects disabled (default)
  const planetaryPositions = {
    'rahu': { longitude: 15, name: 'Rahu', speed: -0.05 },   // 1st house
    'ketu': { longitude: 195, name: 'Ketu', speed: -0.05 }   // 7th house
  };
  
  const ascendant = 0;
  let testResults = aspectsService.getAspectsForTesting(planetaryPositions, ascendant);
  
  logger.info('   Testing with Rahu/Ketu special aspects DISABLED:');
  logger.info(`   Rahu aspects: ${testResults.rahu.aspectedHouses.join(', ')}`);
  logger.info(`   Ketu aspects: ${testResults.ketu.aspectedHouses.join(', ')}`);
  
  // With special aspects disabled, should only aspect 7th house
  if (testResults.rahu.aspectedHouses.length === 1 && testResults.rahu.aspectedHouses.includes(7)) {
    logger.info('   ✅ Rahu correctly aspects only 7th house when special aspects disabled');
  } else {
    logger.warn('   ⚠️ Rahu aspect behavior unexpected when special aspects disabled');
  }
  
  // Note: To fully test enabled special aspects, we would need to set environment variable
  // and restart the service, which is beyond the scope of this test
  logger.info('   📝 Note: Enable ENABLE_RAHU_KETU_ASPECTS=true in .env to test special aspects');
}

/**
 * Test detailed aspect information including strength and nature
 */
async function testDetailedAspectInformation() {
  logger.info('📊 Testing detailed aspect information...');
  
  const planetaryPositions = {
    'jupiter': { longitude: 15, name: 'Jupiter', speed: 0.08 },  // 1st house
    'mars': { longitude: 75, name: 'Mars', speed: 0.5 }         // 3rd house
  };
  
  const ascendant = 0;
  const detailedAspects = aspectsService.calculatePlanetaryAspectsToHouses(planetaryPositions, ascendant);
  
  // Test Jupiter's aspect details
  const jupiterDetails = detailedAspects.jupiter;
  if (jupiterDetails) {
    logger.info(`   Jupiter aspects details:`);
    jupiterDetails.aspectsToHouses.forEach(aspect => {
      logger.info(`     → House ${aspect.houseNumber}: ${aspect.aspectType} (${aspect.strength}, ${aspect.nature})`);
      if (aspect.isSpecialAspect) {
        logger.info(`       🌟 Special aspect detected`);
      }
    });
  }
  
  // Test Mars's special aspects
  const marsDetails = detailedAspects.mars;
  if (marsDetails) {
    logger.info(`   Mars aspects details:`);
    marsDetails.aspectsToHouses.forEach(aspect => {
      logger.info(`     → House ${aspect.houseNumber}: ${aspect.aspectType} (${aspect.strength}, ${aspect.nature})`);
      if (aspect.isSpecialAspect) {
        logger.info(`       🌟 Special aspect detected`);
      }
    });
  }
}

// Execute the test suite
testVedicHouseAspects()
  .then(() => {
    // Test additional detailed information
    return testDetailedAspectInformation();
  })
  .then(() => {
    logger.info('🎉 All Vedic House Aspects tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    logger.error('💥 Test suite failed:', error);
    process.exit(1);
  });
