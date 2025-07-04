import React from 'react';
import NorthIndianChart from '../../../components/charts/NorthIndianChart';

const ChartVisualization = ({ chartData, chartType = 'lagna' }) => {
  // Mock chart data structure for fallback
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

  const currentChart = chartData || mockChartData[chartType];
  const chartTitle = chartType === 'lagna' ? 'Lagna Chart (D1)' : 'Navamsa Chart (D9)';

  return (
    <NorthIndianChart
      chartData={currentChart}
      title={chartTitle}
      className="bg-surface rounded-xl border border-border shadow-soft p-6"
    />
  );
};

export default ChartVisualization;