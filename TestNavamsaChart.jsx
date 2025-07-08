import React from 'react';
import NorthIndianChart from './src/components/charts/NorthIndianChart';

const TestNavamsaChart = () => {
  // Test Navamsa data from the API response (with fixed backend)
  // Birth Details: 30 September 2000, 12:00 PM, Kolkata
  // Navamsa Ascendant: Pisces (Sign 12)
  
  const navamsaChartData = {
    houses: [
      // H1: Pisces (Navamsa Ascendant) - Sign 12
      { number: 1, sign: 'Pisces', signNumber: 12, planets: ['Saturn'], degrees: ['6°49\'58\"'] },
      
      // H2: Aries - Sign 1
      { number: 2, sign: 'Aries', signNumber: 1, planets: [], degrees: [] },
      
      // H3: Taurus - Sign 2
      { number: 3, sign: 'Taurus', signNumber: 2, planets: [], degrees: [] },
      
      // H4: Gemini - Sign 3
      { number: 4, sign: 'Gemini', signNumber: 3, planets: ['Jupiter'], degrees: ['17°22\'15\"'] },
      
      // H5: Cancer - Sign 4
      { number: 5, sign: 'Cancer', signNumber: 4, planets: [], degrees: [] },
      
      // H6: Leo - Sign 5
      { number: 6, sign: 'Leo', signNumber: 5, planets: ['Ketu'], degrees: ['27°25\'23\"'] },
      
      // H7: Virgo - Sign 6
      { number: 7, sign: 'Virgo', signNumber: 6, planets: ['Sun'], degrees: ['13°32\'15\"'] },
      
      // H8: Libra - Sign 7
      { number: 8, sign: 'Libra', signNumber: 7, planets: [], degrees: [] },
      
      // H9: Scorpio - Sign 8
      { number: 9, sign: 'Scorpio', signNumber: 8, planets: [], degrees: [] },
      
      // H10: Sagittarius - Sign 9
      { number: 10, sign: 'Sagittarius', signNumber: 9, planets: ['Mercury', 'Mars'], degrees: ['8°13\'18\"', '14°28\'47\"'] },
      
      // H11: Capricorn - Sign 10
      { number: 11, sign: 'Capricorn', signNumber: 10, planets: ['Venus'], degrees: ['13°00\'44\"'] },
      
      // H12: Aquarius - Sign 11
      { number: 12, sign: 'Aquarius', signNumber: 11, planets: ['Moon', 'Rahu'], degrees: ['14°28\'18\"', '27°25\'23\"'] }
    ]
  };

  const handleHouseClick = (house) => {
    console.log('Navamsa House clicked:', house);
    alert(`Navamsa H${house.number} (${house.sign})\nPlanets: ${house.planets.join(', ') || 'None'}`);
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">🔧 Navamsa Chart (D9) - Fixed!</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Birth Details:</strong> 30 September 2000, 12:00 PM, Kolkata</p>
              <p><strong>Chart Type:</strong> Navamsa (D9) - Marriage & Spirituality</p>
              <p><strong>Navamsa Ascendant:</strong> Pisces (Sign 12)</p>
            </div>
            <div>
              <p><strong>✅ Fixed Issues:</strong></p>
              <ul className="text-xs list-disc ml-4">
                <li>Now uses proper Navamsa ascendant (Pisces)</li>
                <li>Planets positioned correctly in Navamsa houses</li>
                <li>Different from Lagna chart (as it should be)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chart Component */}
        <NorthIndianChart 
          chartData={navamsaChartData}
          title="Navamsa Chart (D9) - Fixed Backend Logic"
          onHouseClick={handleHouseClick}
          className="mb-8"
        />

        {/* Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🆚 Lagna vs Navamsa Comparison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Lagna Chart (D1)</h3>
              <ul className="text-sm space-y-1">
                <li><strong>Ascendant:</strong> Sagittarius</li>
                <li><strong>Purpose:</strong> Overall life, personality</li>
                <li><strong>Ketu:</strong> H1 (Sagittarius)</li>
                <li><strong>Saturn:</strong> H5 (Aries)</li>
                <li><strong>Jupiter:</strong> H6 (Taurus)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-purple-600 mb-2">Navamsa Chart (D9)</h3>
              <ul className="text-sm space-y-1">
                <li><strong>Ascendant:</strong> Pisces ✨</li>
                <li><strong>Purpose:</strong> Marriage, spirituality, inner self</li>
                <li><strong>Saturn:</strong> H1 (Pisces) ✨</li>
                <li><strong>Ketu:</strong> H6 (Leo) ✨</li>
                <li><strong>Jupiter:</strong> H4 (Gemini) ✨</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-2 text-green-600">🎯 Expected Navamsa Positions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {navamsaChartData.houses
                .filter(house => house.planets.length > 0)
                .map(house => (
                  <div key={house.number} className="flex justify-between bg-gray-100 p-2 rounded">
                    <span>H{house.number} ({house.sign}):</span>
                    <span className="font-medium">{house.planets.join(', ')}</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-green-600">
            <p><strong>✅ Fix Applied:</strong> Backend now calculates proper Navamsa ascendant and places planets correctly!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNavamsaChart;
