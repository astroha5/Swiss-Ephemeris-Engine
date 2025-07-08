import React from 'react';
import NorthIndianChart from './src/components/charts/NorthIndianChart';

const TestNewChart = () => {
  // Birth Details provided:
  // Full Name: Rahul Jana
  // Date of Birth: 30 September 2000
  // Time of Birth: 12:00 PM
  // Place of Birth: Kolkata, West Bengal, India
  // Coordinates: 22.5726459°N, 88.3638953°E

  // For this test, let's assume the backend calculates the Ascendant as Sagittarius
  // Based on your exact logic:
  // 1. Houses are FIXED (never move)
  // 2. Signs rotate based on Ascendant
  // 3. Planets follow signs

  const testChartData = {
    houses: [
      // H1: Sagittarius (Ascendant) - FIXED coordinates: x: 350, y: 330
      { number: 1, sign: 'Sagittarius', signNumber: 9, planets: ['Ketu'], degrees: ['27°25\''] },
      
      // H2: Capricorn - FIXED coordinates: x: 175, y: 150
      { number: 2, sign: 'Capricorn', signNumber: 10, planets: [], degrees: [] },
      
      // H3: Aquarius - FIXED coordinates: x: 150, y: 175
      { number: 3, sign: 'Aquarius', signNumber: 11, planets: [], degrees: [] },
      
      // H4: Pisces - FIXED coordinates: x: 330, y: 350
      { number: 4, sign: 'Pisces', signNumber: 12, planets: [], degrees: [] },
      
      // H5: Aries - FIXED coordinates: x: 150, y: 525
      { number: 5, sign: 'Aries', signNumber: 1, planets: [], degrees: [] },
      
      // H6: Taurus - FIXED coordinates: x: 175, y: 550
      { number: 6, sign: 'Taurus', signNumber: 2, planets: ['Jupiter', 'Saturn'], degrees: ['17°22\'', '6°49\''] },
      
      // H7: Gemini - FIXED coordinates: x: 350, y: 370
      { number: 7, sign: 'Gemini', signNumber: 3, planets: ['Rahu'], degrees: ['27°25\''] },
      
      // H8: Cancer - FIXED coordinates: x: 525, y: 550
      { number: 8, sign: 'Cancer', signNumber: 4, planets: [], degrees: [] },
      
      // H9: Leo - FIXED coordinates: x: 550, y: 525
      { number: 9, sign: 'Leo', signNumber: 5, planets: ['Mars'], degrees: ['14°28\''] },
      
      // H10: Virgo - FIXED coordinates: x: 370, y: 350
      { number: 10, sign: 'Virgo', signNumber: 6, planets: ['Sun'], degrees: ['13°32\''] },
      
      // H11: Libra - FIXED coordinates: x: 550, y: 175
      { number: 11, sign: 'Libra', signNumber: 7, planets: ['Moon', 'Venus', 'Mercury'], degrees: ['14°28\'', '13°00\'', '8°13\''] },
      
      // H12: Scorpio - FIXED coordinates: x: 525, y: 150
      { number: 12, sign: 'Scorpio', signNumber: 8, planets: [], degrees: [] }
    ]
  };

  const handleHouseClick = (house) => {
    console.log('House clicked:', house);
    alert(`House ${house.number} (${house.sign})\nPlanets: ${house.planets.join(', ') || 'None'}`);
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Birth Info Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">North Indian Chart Test</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Name:</strong> Rahul Jana</p>
              <p><strong>Birth Date:</strong> 30 September 2000</p>
              <p><strong>Birth Time:</strong> 12:00 PM</p>
            </div>
            <div>
              <p><strong>Birth Place:</strong> Kolkata, West Bengal, India</p>
              <p><strong>Coordinates:</strong> 22.5726459°N, 88.3638953°E</p>
              <p><strong>Ascendant:</strong> Sagittarius</p>
            </div>
          </div>
        </div>

        {/* Chart Component */}
        <NorthIndianChart 
          chartData={testChartData}
          title="Rahul Jana - North Indian Chart (Test)"
          onHouseClick={handleHouseClick}
          className="mb-8"
        />

        {/* Logic Explanation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🧭 North Indian Chart Logic Applied:</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-green-600">✅ Step 1: Houses Are Fixed (Never Move)</h3>
              <p>House coordinates are always the same:</p>
              <ul className="ml-4 text-xs font-mono">
                <li>H1: x: 350, y: 330 (Center-Right - Ascendant)</li>
                <li>H2: x: 175, y: 150 (Top-Left)</li>
                <li>H5: x: 150, y: 525 (Bottom-Left)</li>
                <li>H7: x: 350, y: 370 (Bottom-Center)</li>
                <li>And so on...</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-600">🔄 Step 2: Signs Rotate Based on Ascendant</h3>
              <p>With Sagittarius (Sign 9) as Ascendant:</p>
              <ul className="ml-4 text-xs">
                <li>H1 = Sagittarius, H2 = Capricorn, H3 = Aquarius...</li>
                <li>H5 = Aries, H6 = Taurus, H7 = Gemini...</li>
                <li>H11 = Libra, H12 = Scorpio</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-purple-600">🪐 Step 3: Planets Follow Signs</h3>
              <p>Each planet is placed in the house containing its sign:</p>
              <ul className="ml-4 text-xs">
                <li>Ketu (Sagittarius) → H1 (Center-Right)</li>
                <li>Jupiter & Saturn (Taurus) → H6 (Bottom-Left corner)</li>
                <li>Rahu (Gemini) → H7 (Bottom-Center)</li>
                <li>Mars (Leo) → H9 (Inner positions)</li>
                <li>Sun (Virgo) → H10 (Inner positions)</li>
                <li>Moon, Venus & Mercury (Libra) → H11 (Inner positions)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-2 text-orange-600">🎯 Expected Visual Results:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {testChartData.houses
                .filter(house => house.planets.length > 0)
                .map(house => (
                  <div key={house.number} className="flex justify-between bg-gray-100 p-2 rounded">
                    <span>H{house.number} ({house.sign}):</span>
                    <span className="font-medium">{house.planets.join(', ')}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNewChart;
