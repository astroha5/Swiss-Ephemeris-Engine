import React from 'react';
import NorthIndianChart from '../../../components/charts/NorthIndianChart';

const ChartVisualization = ({ chartData, chartType = 'lagna' }) => {
  // Debug: Log received data
  console.log('🔍 ChartVisualization received chartData:', chartData);
  console.log('🔍 chartType:', chartType);
  
  // Mock chart data structure for fallback (correctly structured)
  const mockChartData = {
    lagna: {
      houses: [
        { number: 1, sign: 'Aries', planets: ['Sun', 'Mercury'], degrees: ['15°23\'', '28°45\''] },
        { number: 2, sign: 'Taurus', planets: ['Venus'], degrees: ['12°18\''] },
        { number: 3, sign: 'Gemini', planets: [], degrees: [] },
        { number: 4, sign: 'Cancer', planets: ['Moon'], degrees: ['05°32\''] },
        { number: 5, sign: 'Leo', planets: ['Jupiter'], degrees: ['22°15\''] },
        { number: 6, sign: 'Virgo', planets: [], degrees: [] },
        { number: 7, sign: 'Libra', planets: ['Mars'], degrees: ['18°42\''] },
        { number: 8, sign: 'Scorpio', planets: [], degrees: [] },
        { number: 9, sign: 'Sagittarius', planets: ['Saturn'], degrees: ['09°28\''] },
        { number: 10, sign: 'Capricorn', planets: [], degrees: [] },
        { number: 11, sign: 'Aquarius', planets: ['Rahu'], degrees: ['25°16\''] },
        { number: 12, sign: 'Pisces', planets: ['Ketu'], degrees: ['25°16\''] }
      ]
    },
    navamsa: {
      houses: [
        { number: 1, sign: 'Leo', planets: ['Sun'], degrees: ['15°23\''] },
        { number: 2, sign: 'Virgo', planets: ['Mercury', 'Venus'], degrees: ['28°45\'', '12°18\''] },
        { number: 3, sign: 'Libra', planets: [], degrees: [] },
        { number: 4, sign: 'Scorpio', planets: ['Moon', 'Mars'], degrees: ['05°32\'', '18°42\''] },
        { number: 5, sign: 'Sagittarius', planets: [], degrees: [] },
        { number: 6, sign: 'Capricorn', planets: ['Jupiter'], degrees: ['22°15\''] },
        { number: 7, sign: 'Aquarius', planets: [], degrees: [] },
        { number: 8, sign: 'Pisces', planets: ['Saturn'], degrees: ['09°28\''] },
        { number: 9, sign: 'Aries', planets: [], degrees: [] },
        { number: 10, sign: 'Taurus', planets: [], degrees: [] },
        { number: 11, sign: 'Gemini', planets: ['Rahu'], degrees: ['25°16\''] },
        { number: 12, sign: 'Cancer', planets: ['Ketu'], degrees: ['25°16\''] }
      ]
    }
  };

  // ✅ FIXED: Proper data extraction following the correct structure
  let currentChart = null;
  
  // Try multiple data structures to find the correct one
  if (chartData) {
    console.log('🔍 Analyzing chartData structure...');
    
    // Structure 1: chartData.charts.lagna.houses (from API)
    if (chartData.charts && chartData.charts[chartType] && chartData.charts[chartType].houses) {
      currentChart = chartData.charts[chartType];
      console.log('✅ Found data in chartData.charts.' + chartType + '.houses');
    }
    // Structure 2: chartData.houses (direct houses array)
    else if (chartData.houses && Array.isArray(chartData.houses)) {
      currentChart = chartData;
      console.log('✅ Found data in chartData.houses');
    }
    // Structure 3: chartData[chartType].houses (nested by chart type)
    else if (chartData[chartType] && chartData[chartType].houses) {
      currentChart = chartData[chartType];
      console.log('✅ Found data in chartData.' + chartType + '.houses');
    }
    else {
      console.warn('❌ No valid chart data structure found, using mock data');
      currentChart = mockChartData[chartType];
    }
  } else {
    console.warn('❌ No chartData provided, using mock data');
    currentChart = mockChartData[chartType];
  }

  console.log('🎯 Final currentChart data:', currentChart);
  console.log('🏠 Houses count:', currentChart?.houses?.length);
  
  const chartTitle = chartType === 'lagna' ? 'Lagna Chart (D1)' : 'Navamsa Chart (D9)';

  return (
    <NorthIndianChart
      chartData={currentChart}
      title={chartTitle}
      className="bg-surface rounded-xl border-golden shadow-strong p-6"
    /e
  );
};

export default ChartVisualization;
