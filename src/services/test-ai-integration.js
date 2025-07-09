import { generateAstrologicalInterpretation } from './deepseekApi';

// Test function to verify AI interpretation is working
export const testAIInterpretation = async () => {
  const mockChartData = {
    charts: {
      lagna: {
        houses: [
          { number: 1, sign: 'Aries', planets: ['Sun', 'Mercury'] },
          { number: 2, sign: 'Taurus', planets: ['Venus'] },
          { number: 5, sign: 'Leo', planets: ['Jupiter'] },
          { number: 7, sign: 'Libra', planets: ['Mars'] },
          { number: 9, sign: 'Sagittarius', planets: ['Saturn'] },
          { number: 11, sign: 'Aquarius', planets: ['Rahu'] },
          { number: 12, sign: 'Pisces', planets: ['Ketu'] }
        ]
      }
    },
    birthDetails: {
      name: 'Test User',
      dateOfBirth: '1990-05-15',
      timeOfBirth: '14:30',
      placeOfBirth: 'Mumbai, India'
    }
  };

  try {
    console.log('Testing AI interpretation...');
    const result = await generateAstrologicalInterpretation(mockChartData);
    
    if (result.success) {
      console.log('✅ AI interpretation successful!');
      console.log('Model used:', result.model);
      console.log('Interpretation preview:', result.interpretation.substring(0, 200) + '...');
      return true;
    } else {
      console.error('❌ AI interpretation failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing AI interpretation:', error);
    return false;
  }
};

// Export for manual testing
window.testAIInterpretation = testAIInterpretation;
