import React from 'react';
import NorthIndianChart from './NorthIndianChart_Enhanced';

const TestChartComponent = () => {
  // Test data with verified correct logic from your backend
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

  // Example with different Ascendant to test the logic
  const testChartData2 = {
    houses: [
      {"number":1,"sign":"Taurus","signNumber":2,"planets":["Sun"],"degrees":["15°23'12\""]},
      {"number":2,"sign":"Gemini","signNumber":3,"planets":["Mercury"],"degrees":["28°45'18\""]},
      {"number":3,"sign":"Cancer","signNumber":4,"planets":["Moon"],"degrees":["5°32'45\""]},
      {"number":4,"sign":"Leo","signNumber":5,"planets":["Jupiter"],"degrees":["22°15'42\""]},
      {"number":5,"sign":"Virgo","signNumber":6,"planets":[],"degrees":[]},
      {"number":6,"sign":"Libra","signNumber":7,"planets":["Mars"],"degrees":["18°42'30\""]},
      {"number":7,"sign":"Scorpio","signNumber":8,"planets":[],"degrees":[]},
      {"number":8,"sign":"Sagittarius","signNumber":9,"planets":[],"degrees":[]},
      {"number":9,"sign":"Capricorn","signNumber":10,"planets":["Saturn"],"degrees":["9°28'33\""]},
      {"number":10,"sign":"Aquarius","signNumber":11,"planets":["Rahu"],"degrees":["25°16'20\""]},
      {"number":11,"sign":"Pisces","signNumber":12,"planets":["Venus"],"degrees":["12°18'55\""]},
      {"number":12,"sign":"Aries","signNumber":1,"planets":["Ketu"],"degrees":["25°16'20\""]}
    ]
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Chart Positioning Test</h1>
      
      {/* Test Case 1: Sagittarius Ascendant */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test 1: Sagittarius Ascendant</h2>
        <div className="mb-4">
          <h3 className="font-medium">Expected Positions (Refined Layout):</h3>
          <ul className="text-sm space-y-1 mt-2">
            <li>• <strong>Ketu 27°25'</strong> in H1 (Center-Right) - Sagittarius Ascendant</li>
            <li>• <strong>Saturn 6°49'</strong> in H5 (Center-Left) - Aries</li>
            <li>• <strong>Jupiter 17°22'</strong> in H6 (Bottom-Left) - Taurus</li>
            <li>• <strong>Rahu 27°25'</strong> in H7 (Bottom-Center) - Gemini</li>
            <li>• <strong>Mars 14°28'</strong> in H9 (Inner Bottom-Right) - Leo</li>
            <li>• <strong>Sun 13°32' & Mercury 8°13'</strong> in H10 (Inner Top-Right) - Virgo</li>
            <li>• <strong>Moon 14°28' & Venus 13°00'</strong> in H11 (Inner Top-Left) - Libra</li>
          </ul>
          <div className="text-xs text-gray-600 mt-2">
            <p>✅ <strong>Refinements:</strong> Bigger layout, no planet symbols, shortened degrees, smaller sign numbers</p>
          </div>
        </div>
        <NorthIndianChart 
          chartData={testChartData}
          title="Test Chart 1: Sagittarius Ascendant"
        />
      </div>

      {/* Test Case 2: Taurus Ascendant */}
      <div className="bg-green-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test 2: Taurus Ascendant</h2>
        <div className="mb-4">
          <h3 className="font-medium">Your Logic Applied:</h3>
          <div className="text-sm space-y-1 mt-2">
            <p><strong>Step 1:</strong> Ascendant = Taurus → H1</p>
            <p><strong>Step 2:</strong> Signs follow houses: H1=Taurus, H2=Gemini, H3=Cancer, H4=Leo...</p>
            <p><strong>Step 3:</strong> Planets follow signs:</p>
            <ul className="ml-4 space-y-1">
              <li>• Sun (Taurus) → H1, Mercury (Gemini) → H2</li>
              <li>• Moon (Cancer) → H3, Jupiter (Leo) → H4</li>
              <li>• Mars (Libra) → H6, Saturn (Capricorn) → H9</li>
              <li>• Rahu (Aquarius) → H10, Venus (Pisces) → H11, Ketu (Aries) → H12</li>
            </ul>
          </div>
        </div>
        <NorthIndianChart 
          chartData={testChartData2}
          title="Test Chart 2: Taurus Ascendant (Following Your Logic)"
        />
      </div>

      {/* Logic Explanation */}
      <div className="bg-yellow-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">✅ Your Logic Implementation</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium">Step 1: Ascendant Sign = House 1 (H1)</h3>
            <p>Whatever sign was rising at birth becomes H1. H1 coordinates are fixed at center-right position.</p>
          </div>
          
          <div>
            <h3 className="font-medium">Step 2: Signs Follow Houses (H1 → H12)</h3>
            <p>Starting from the Ascendant sign, assign signs sequentially to houses:</p>
            <div className="ml-4 font-mono text-xs bg-white p-2 rounded">
              H1: Ascendant Sign<br/>
              H2: Next Sign<br/>
              H3: Next Sign<br/>
              ...<br/>
              H12: Previous Sign (wraps around)
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">Step 3: Planets Follow Signs</h3>
            <p>Each planet's sky position determines its sign, then find which house contains that sign:</p>
            <div className="ml-4 font-mono text-xs bg-white p-2 rounded">
              Planet in Sign X → Find house containing Sign X → Draw planet at that house's coordinates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestChartComponent;
