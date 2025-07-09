import React from 'react';
import NorthIndianChart from './src/components/charts/NorthIndianChart';

const DebugChart = () => {
  // Test data with Sagittarius Ascendant from the chart_test_results.json
  const testChartDataSagittarius = {
    houses: [
      { number: 1, sign: "Sagittarius", signNumber: 9, planets: ["Ketu"], degrees: ["27°25'23\""] },
      { number: 2, sign: "Capricorn", signNumber: 10, planets: [], degrees: [] },
      { number: 3, sign: "Aquarius", signNumber: 11, planets: [], degrees: [] },
      { number: 4, sign: "Pisces", signNumber: 12, planets: [], degrees: [] },
      { number: 5, sign: "Aries", signNumber: 1, planets: ["Saturn"], degrees: ["6°49'58\""] },
      { number: 6, sign: "Taurus", signNumber: 2, planets: ["Jupiter"], degrees: ["17°22'15\""] },
      { number: 7, sign: "Gemini", signNumber: 3, planets: ["Rahu"], degrees: ["27°25'23\""] },
      { number: 8, sign: "Cancer", signNumber: 4, planets: [], degrees: [] },
      { number: 9, sign: "Leo", signNumber: 5, planets: ["Mars"], degrees: ["14°28'47\""] },
      { number: 10, sign: "Virgo", signNumber: 6, planets: ["Sun", "Mercury"], degrees: ["13°32'15\"", "8°13'18\""] },
      { number: 11, sign: "Libra", signNumber: 7, planets: ["Moon", "Venus"], degrees: ["14°28'18\"", "13°00'44\""] },
      { number: 12, sign: "Scorpio", signNumber: 8, planets: [], degrees: [] }
    ]
  };
  
  // Test data with Pisces Ascendant (what you're currently seeing)
  const testChartDataPisces = {
    houses: [
      { number: 1, sign: 'Pisces', signNumber: 12, planets: ['Saturn'], degrees: ['6°49\'58\"'] },
      { number: 2, sign: 'Aries', signNumber: 1, planets: [], degrees: [] },
      { number: 3, sign: 'Taurus', signNumber: 2, planets: [], degrees: [] },
      { number: 4, sign: 'Gemini', signNumber: 3, planets: ['Jupiter'], degrees: ['17°22\'15\"'] },
      { number: 5, sign: 'Cancer', signNumber: 4, planets: [], degrees: [] },
      { number: 6, sign: 'Leo', signNumber: 5, planets: ['Mars'], degrees: ['14°28\'47\"'] },
      { number: 7, sign: 'Virgo', signNumber: 6, planets: ['Rahu'], degrees: ['27°25\'23\"'] },
      { number: 8, sign: 'Libra', signNumber: 7, planets: [], degrees: [] },
      { number: 9, sign: 'Scorpio', signNumber: 8, planets: [], degrees: [] },
      { number: 10, sign: 'Sagittarius', signNumber: 9, planets: ['Sun', 'Mercury'], degrees: ['13°32\'15\"', '8°13\'18\"'] },
      { number: 11, sign: 'Capricorn', signNumber: 10, planets: ['Moon'], degrees: ['14°28\'18\"'] },
      { number: 12, sign: 'Aquarius', signNumber: 11, planets: ['Venus', 'Ketu'], degrees: ['13°00\'44\"', '27°25\'23\"'] }
    ]
  };

  console.log('🧪 Debug Chart Data:', testChartData);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🐛 Debug: Sign Number Issue</h1>
      
      <div className="bg-yellow-50 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Expected for Sagittarius Ascendant:</h2>
        <ul className="text-sm space-y-1">
          <li>• <strong>House 1 (H1)</strong> should show <strong>Sign 9</strong> (Sagittarius)</li>
          <li>• <strong>House 2 (H2)</strong> should show <strong>Sign 10</strong> (Capricorn)</li>
          <li>• <strong>House 3 (H3)</strong> should show <strong>Sign 11</strong> (Aquarius)</li>
          <li>• etc.</li>
        </ul>
      </div>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Current Issue:</h2>
        <p className="text-sm">House 1 shows Sign 5 (Leo) instead of Sign 9 (Sagittarius)</p>
      </div>
      
      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-4">Chart (Check Console for Debug Info):</h2>
        <NorthIndianChart 
          chartData={testChartData}
          title="Debug Chart - Sagittarius Ascendant"
        />
      </div>
      
      <div className="mt-4 text-sm">
        <p><strong>Instructions:</strong> Open browser console and check the debug logs to see what's happening with the sign numbers.</p>
      </div>
    </div>
  );
};

export default DebugChart;
