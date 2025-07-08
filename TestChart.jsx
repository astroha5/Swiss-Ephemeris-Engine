import React from 'react';
import NorthIndianChart from './src/components/charts/NorthIndianChart';

// This is the VERIFIED CORRECT data from your backend
const testChartData = {
  houses: [
    {"number":1,"sign":"Sagittarius","signNumber":9,"planets":["Ketu"],"degrees":["27°25'23\""]},
    {"number":2,"sign":"Capricorn","signNumber":10,"planets":[],"degrees":[]},
    {"number":3,"sign":"Aquarius","signNumber":11,"planets":[],"degrees":[]},
    {"number":4,"sign":"Pisces","signNumber":12,"planets":[],"degrees":[]},
    {"number":5,"sign":"Aries","signNumber":1,"planets":["Saturn"],"degrees":["6°49'58\""]},
    {"number":6,"sign":"Taurus","signNumber":2,"planets":["Jupiter"],"degrees":["17°22'15\""]},
    {"number":7,"sign":"Gemini","signNumber":3,"planets":["Rahu"],"degrees":["27°25'23\""]},
    {"number":8,"sign":"Cancer","signNumber":4,"planets":[],"degrees":[]},
    {"number":9,"sign":"Leo","signNumber":5,"planets":["Mars"],"degrees":["14°28'47\""]},
    {"number":10,"sign":"Virgo","signNumber":6,"planets":["Sun","Mercury"],"degrees":["13°32'15\"","8°13'18\""]},
    {"number":11,"sign":"Libra","signNumber":7,"planets":["Moon","Venus"],"degrees":["14°28'18\"","13°00'44\""]},
    {"number":12,"sign":"Scorpio","signNumber":8,"planets":[],"degrees":[]}
  ]
};

const TestChart = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Chart with Verified Data</h1>
      <p className="mb-4">This should show planets in correct positions:</p>
      <ul className="mb-6">
        <li>• Ketu in Center-Right (House 1, Sagittarius)</li>
        <li>• Saturn in Center-Left (House 5, Aries)</li>
        <li>• Jupiter in Bottom-Left (House 6, Taurus)</li>
        <li>• Rahu in Bottom-Center (House 7, Gemini)</li>
        <li>• Mars in Inner Bottom-Right (House 9, Leo)</li>
        <li>• Sun & Mercury in Inner Top-Right (House 10, Virgo)</li>
        <li>• Moon & Venus in Inner Top-Left (House 11, Libra)</li>
      </ul>
      
      <NorthIndianChart 
        chartData={testChartData}
        title="Test Chart (Verified Backend Data)"
      />
    </div>
  );
};

export default TestChart;
