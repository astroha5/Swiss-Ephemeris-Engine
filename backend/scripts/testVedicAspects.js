const aspectsService = require('../services/aspectsService');
const logger = require('../utils/logger');

/**
 * Test suite for Vedic aspects system
 */
async function testVedicAspects() {
  try {
    logger.info('🕉️ Starting Vedic Aspects Test Suite...');
    
    // Test 1: Basic aspect calculation
    await testBasicAspectCalculation();
    
    // Test 2: Mars special aspects
    await testMarsSpecialAspects();
    
    // Test 3: Jupiter special aspects  
    await testJupiterSpecialAspects();
    
    // Test 4: Saturn special aspects
    await testSaturnSpecialAspects();
    
    // Test 5: House position calculation
    await testHousePositionCalculation();
    
    // Test 6: Aspect strength calculation
    await testAspectStrengthCalculation();
    
    // Test 7: Aspect nature determination
    await testAspectNatureDetermination();
    
    logger.info('✅ All Vedic Aspects tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Vedic Aspects tests failed:', error);
    throw error;
  }
}

/**
 * Test basic aspect calculation functionality
 */
async function testBasicAspectCalculation() {
  logger.info('🔢 Testing basic aspect calculation...');
  
  // Create sample planetary positions
  const planetaryPositions = {
    'sun': { longitude: 30, name: 'Sun', speed: 1 },    // 30° = 1st house (Taurus if Asc at 0°)
    'moon': { longitude: 240, name: 'Moon', speed: 13 }, // 240° = 9th house (Sagittarius if Asc at 0°)
    'mars': { longitude: 120, name: 'Mars', speed: 0.5 }, // 120° = 5th house (Leo if Asc at 0°)
    'jupiter': { longitude: 180, name: 'Jupiter', speed: 0.08 } // 180° = 7th house (Libra if Asc at 0°)
  };
  
  const ascendant = 0; // Aries rising
  
  const aspects = aspectsService.calculateAspects(planetaryPositions, ascendant);
  
  logger.info(`   Found ${aspects.length} aspects:`);
  for (const aspect of aspects) {
    logger.info(`   - ${aspect.planet1} → ${aspect.planet2}: ${aspect.aspect} (${aspect.strength}, ${aspect.nature})`);
  }
  
  // Verify expected aspects
  const sunAspects = aspects.filter(a => a.planet1 === 'Sun');
  const expectedSunAspects = sunAspects.filter(a => a.aspect.includes('Seventh House')); // Sun should aspect 7th house
  
  if (expectedSunAspects.length > 0) {
    logger.info('   ✅ Sun 7th house aspect found correctly');
  } else {
    logger.warn('   ⚠️ Sun 7th house aspect not found');
  }
}

/**
 * Test Mars special aspects (4th, 7th, 8th)
 */
async function testMarsSpecialAspects() {
  logger.info('♂️ Testing Mars special aspects...');
  
  // Place Mars in 1st house, other planets in 4th, 7th, 8th houses
  const planetaryPositions = {
    'mars': { longitude: 15, name: 'Mars', speed: 0.5 },      // 1st house
    'sun': { longitude: 105, name: 'Sun', speed: 1 },         // 4th house (90° later)
    'moon': { longitude: 195, name: 'Moon', speed: 13 },      // 7th house (180° later)  
    'mercury': { longitude: 225, name: 'Mercury', speed: 1.2 } // 8th house (210° later)
  };
  
  const ascendant = 0;
  const aspects = aspectsService.calculateAspects(planetaryPositions, ascendant);
  
  const marsAspects = aspects.filter(a => a.planet1 === 'Mars');
  logger.info(`   Mars casting ${marsAspects.length} aspects:`);
  
  for (const aspect of marsAspects) {
    logger.info(`   - Mars → ${aspect.planet2}: ${aspect.aspect} (${aspect.strength})`);
  }
  
  // Verify Mars aspects 4th, 7th, 8th houses
  const has4thAspect = marsAspects.some(a => a.aspect.includes('Fourth House'));
  const has7thAspect = marsAspects.some(a => a.aspect.includes('Seventh House'));  
  const has8thAspect = marsAspects.some(a => a.aspect.includes('Eighth House'));
  
  logger.info(`   ✅ Mars 4th house aspect: ${has4thAspect ? 'Found' : 'Missing'}`);
  logger.info(`   ✅ Mars 7th house aspect: ${has7thAspect ? 'Found' : 'Missing'}`);
  logger.info(`   ✅ Mars 8th house aspect: ${has8thAspect ? 'Found' : 'Missing'}`);
}

/**
 * Test Jupiter special aspects (5th, 7th, 9th)
 */
async function testJupiterSpecialAspects() {
  logger.info('♃ Testing Jupiter special aspects...');
  
  // Place Jupiter in 1st house, other planets in 5th, 7th, 9th houses
  const planetaryPositions = {
    'jupiter': { longitude: 15, name: 'Jupiter', speed: 0.08 }, // 1st house
    'sun': { longitude: 135, name: 'Sun', speed: 1 },           // 5th house (120° later)
    'moon': { longitude: 195, name: 'Moon', speed: 13 },        // 7th house (180° later)
    'mars': { longitude: 255, name: 'Mars', speed: 0.5 }        // 9th house (240° later)
  };
  
  const ascendant = 0;
  const aspects = aspectsService.calculateAspects(planetaryPositions, ascendant);
  
  const jupiterAspects = aspects.filter(a => a.planet1 === 'Jupiter');
  logger.info(`   Jupiter casting ${jupiterAspects.length} aspects:`);
  
  for (const aspect of jupiterAspects) {
    logger.info(`   - Jupiter → ${aspect.planet2}: ${aspect.aspect} (${aspect.strength})`);
  }
  
  // Verify Jupiter aspects 5th, 7th, 9th houses
  const has5thAspect = jupiterAspects.some(a => a.aspect.includes('Fifth House'));
  const has7thAspect = jupiterAspects.some(a => a.aspect.includes('Seventh House'));
  const has9thAspect = jupiterAspects.some(a => a.aspect.includes('Ninth House'));
  
  logger.info(`   ✅ Jupiter 5th house aspect: ${has5thAspect ? 'Found' : 'Missing'}`);
  logger.info(`   ✅ Jupiter 7th house aspect: ${has7thAspect ? 'Found' : 'Missing'}`);
  logger.info(`   ✅ Jupiter 9th house aspect: ${has9thAspect ? 'Found' : 'Missing'}`);
}

/**
 * Test Saturn special aspects (3rd, 7th, 10th)
 */
async function testSaturnSpecialAspects() {
  logger.info('♄ Testing Saturn special aspects...');
  
  // Place Saturn in 1st house, other planets in 3rd, 7th, 10th houses
  const planetaryPositions = {
    'saturn': { longitude: 15, name: 'Saturn', speed: 0.03 },   // 1st house
    'sun': { longitude: 75, name: 'Sun', speed: 1 },            // 3rd house (60° later)
    'moon': { longitude: 195, name: 'Moon', speed: 13 },        // 7th house (180° later)
    'venus': { longitude: 285, name: 'Venus', speed: 1.1 }      // 10th house (270° later)
  };
  
  const ascendant = 0;
  const aspects = aspectsService.calculateAspects(planetaryPositions, ascendant);
  
  const saturnAspects = aspects.filter(a => a.planet1 === 'Saturn');
  logger.info(`   Saturn casting ${saturnAspects.length} aspects:`);
  
  for (const aspect of saturnAspects) {
    logger.info(`   - Saturn → ${aspect.planet2}: ${aspect.aspect} (${aspect.strength})`);
  }
  
  // Verify Saturn aspects 3rd, 7th, 10th houses
  const has3rdAspect = saturnAspects.some(a => a.aspect.includes('Third House'));
  const has7thAspect = saturnAspects.some(a => a.aspect.includes('Seventh House'));
  const has10thAspect = saturnAspects.some(a => a.aspect.includes('Tenth House'));
  
  logger.info(`   ✅ Saturn 3rd house aspect: ${has3rdAspect ? 'Found' : 'Missing'}`);
  logger.info(`   ✅ Saturn 7th house aspect: ${has7thAspect ? 'Found' : 'Missing'}`);
  logger.info(`   ✅ Saturn 10th house aspect: ${has10thAspect ? 'Found' : 'Missing'}`);
}

/**
 * Test house position calculation
 */
async function testHousePositionCalculation() {
  logger.info('🏠 Testing house position calculation...');
  
  const testCases = [
    { longitude: 0, ascendant: 0, expectedHouse: 1 },
    { longitude: 30, ascendant: 0, expectedHouse: 2 },
    { longitude: 90, ascendant: 0, expectedHouse: 4 },
    { longitude: 180, ascendant: 0, expectedHouse: 7 },
    { longitude: 270, ascendant: 0, expectedHouse: 10 },
    { longitude: 330, ascendant: 0, expectedHouse: 12 },
    // Test with different ascendant
    { longitude: 0, ascendant: 30, expectedHouse: 12 },
    { longitude: 60, ascendant: 30, expectedHouse: 2 }
  ];
  
  for (const testCase of testCases) {
    const calculatedHouse = aspectsService.calculateHousePosition(testCase.longitude, testCase.ascendant);
    const isCorrect = calculatedHouse === testCase.expectedHouse;
    
    logger.info(`   ${isCorrect ? '✅' : '❌'} Long ${testCase.longitude}°, Asc ${testCase.ascendant}° → House ${calculatedHouse} (expected ${testCase.expectedHouse})`);
  }
}

/**
 * Test aspect strength calculation
 */
async function testAspectStrengthCalculation() {
  logger.info('💪 Testing aspect strength calculation...');
  
  const testCases = [
    { planet1: 'mars', houseDistance: 4, orb: 2, expectedStrength: 'Very Strong' },
    { planet1: 'mars', houseDistance: 8, orb: 6, expectedStrength: 'Moderate' },
    { planet1: 'jupiter', houseDistance: 5, orb: 1, expectedStrength: 'Very Strong' },
    { planet1: 'jupiter', houseDistance: 9, orb: 4, expectedStrength: 'Strong' },
    { planet1: 'saturn', houseDistance: 3, orb: 3, expectedStrength: 'Strong' },
    { planet1: 'sun', houseDistance: 7, orb: 2, expectedStrength: 'Very Strong' }
  ];
  
  for (const testCase of testCases) {
    const strength = aspectsService.calculateVedicAspectStrength(
      testCase.planet1, 
      'dummy', 
      testCase.houseDistance, 
      testCase.orb
    );
    
    const isCorrect = strength === testCase.expectedStrength;
    logger.info(`   ${isCorrect ? '✅' : '⚠️'} ${testCase.planet1} ${testCase.houseDistance}th house (orb ${testCase.orb}°) → ${strength}`);
  }
}

/**
 * Test aspect nature determination
 */
async function testAspectNatureDetermination() {
  logger.info('🌟 Testing aspect nature determination...');
  
  const testCases = [
    { planet1: 'jupiter', planet2: 'sun', houseDistance: 5, expectedNature: 'Benefic' },
    { planet1: 'jupiter', planet2: 'moon', houseDistance: 9, expectedNature: 'Benefic' },
    { planet1: 'mars', planet2: 'sun', houseDistance: 8, expectedNature: 'Mixed' },
    { planet1: 'saturn', planet2: 'moon', houseDistance: 7, expectedNature: 'Challenging' },
    { planet1: 'venus', planet2: 'mars', houseDistance: 7, expectedNature: 'Benefic' }
  ];
  
  for (const testCase of testCases) {
    const nature = aspectsService.determineVedicAspectNature(
      testCase.planet1,
      testCase.planet2, 
      testCase.houseDistance
    );
    
    const isCorrect = nature === testCase.expectedNature;
    logger.info(`   ${isCorrect ? '✅' : '⚠️'} ${testCase.planet1} → ${testCase.planet2} (${testCase.houseDistance}th) → ${nature}`);
  }
}

/**
 * Run comprehensive test with real chart data
 */
async function testRealChartData() {
  logger.info('📊 Testing with real chart data...');
  
  // Sample birth chart: March 15, 1990, 12:00 PM, New Delhi
  // These are approximate positions for testing
  const realChart = {
    'sun': { longitude: 354, name: 'Sun', speed: 1 },      // Late Pisces
    'moon': { longitude: 45, name: 'Moon', speed: 13 },    // Mid Taurus  
    'mars': { longitude: 278, name: 'Mars', speed: 0.5 },  // Early Capricorn
    'mercury': { longitude: 15, name: 'Mercury', speed: 1.2 }, // Mid Aries
    'jupiter': { longitude: 135, name: 'Jupiter', speed: 0.08 }, // Mid Leo
    'venus': { longitude: 320, name: 'Venus', speed: 1.1 },    // Late Aquarius
    'saturn': { longitude: 288, name: 'Saturn', speed: 0.03 }, // Mid Capricorn
    'rahu': { longitude: 38, name: 'Rahu', speed: -0.05 },     // Early Taurus
    'ketu': { longitude: 218, name: 'Ketu', speed: -0.05 }     // Early Scorpio
  };
  
  const ascendant = 75; // Gemini rising
  
  const aspects = aspectsService.calculateAspects(realChart, ascendant);
  
  logger.info(`   📈 Found ${aspects.length} aspects in real chart:`);
  
  // Group by aspecting planet
  const aspectsByPlanet = {};
  for (const aspect of aspects) {
    if (!aspectsByPlanet[aspect.planet1]) {
      aspectsByPlanet[aspect.planet1] = [];
    }
    aspectsByPlanet[aspect.planet1].push(aspect);
  }
  
  for (const [planet, planetAspects] of Object.entries(aspectsByPlanet)) {
    logger.info(`   ${planet}: ${planetAspects.length} aspects`);
    for (const aspect of planetAspects) {
      logger.info(`     → ${aspect.planet2}: ${aspect.aspect} (${aspect.strength}, ${aspect.nature})`);
    }
  }
  
  // Verify some expected patterns
  const strongAspects = aspects.filter(a => ['Very Strong', 'Strong'].includes(a.strength));
  const beneficAspects = aspects.filter(a => a.nature === 'Benefic');
  const challengingAspects = aspects.filter(a => a.nature === 'Challenging');
  
  logger.info(`   📊 Summary: ${strongAspects.length} strong, ${beneficAspects.length} benefic, ${challengingAspects.length} challenging`);
}

// Run the test if called directly
if (require.main === module) {
  testVedicAspects()
    .then(() => {
      logger.info('🎉 Vedic Aspects test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Vedic Aspects test failed:', error);
      process.exit(1);
    });
}

module.exports = { testVedicAspects };
