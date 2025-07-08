import React from 'react';
import NorthIndianChart from '../../components/charts/NorthIndianChart';

const ChartTestPage = () => {
  // Test data that matches the backend structure
  const testChartData = {
    houses: [
      { 
        number: 1, 
        sign: 'Aries', 
        planets: ['Sun', 'Mercury'], 
        degrees: ['15°23\'12"', '28°45\'30"'],
        signLord: 'Mars'
      },
      { 
        number: 2, 
        sign: 'Taurus', 
        planets: ['Venus'], 
        degrees: ['12°18\'45"'],
        signLord: 'Venus'
      },
      { 
        number: 3, 
        sign: 'Gemini', 
        planets: [], 
        degrees: [],
        signLord: 'Mercury'
      },
      { 
        number: 4, 
        sign: 'Cancer', 
        planets: ['Moon'], 
        degrees: ['05°32\'18"'],
        signLord: 'Moon'
      },
      { 
        number: 5, 
        sign: 'Leo', 
        planets: ['Jupiter'], 
        degrees: ['22°15\'54"'],
        signLord: 'Sun'
      },
      { 
        number: 6, 
        sign: 'Virgo', 
        planets: [], 
        degrees: [],
        signLord: 'Mercury'
      },
      { 
        number: 7, 
        sign: 'Libra', 
        planets: ['Mars'], 
        degrees: ['18°42\'36"'],
        signLord: 'Venus'
      },
      { 
        number: 8, 
        sign: 'Scorpio', 
        planets: [], 
        degrees: [],
        signLord: 'Mars'
      },
      { 
        number: 9, 
        sign: 'Sagittarius', 
        planets: ['Saturn'], 
        degrees: ['09°28\'12"'],
        signLord: 'Jupiter'
      },
      { 
        number: 10, 
        sign: 'Capricorn', 
        planets: [], 
        degrees: [],
        signLord: 'Saturn'
      },
      { 
        number: 11, 
        sign: 'Aquarius', 
        planets: ['Rahu'], 
        degrees: ['25°16\'48"'],
        signLord: 'Saturn'
      },
      { 
        number: 12, 
        sign: 'Pisces', 
        planets: ['Ketu'], 
        degrees: ['25°16\'48"'],
        signLord: 'Jupiter'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Chart Rendering Test</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Chart Data:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(testChartData, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <NorthIndianChart 
            chartData={testChartData}
            title="Test Lagna Chart (D1)"
            className="w-full"
          />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Check the browser console for debug logs about chart data structure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartTestPage;
