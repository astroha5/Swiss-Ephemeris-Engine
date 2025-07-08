import React from 'react';
import NorthIndianChart from './NorthIndianChart_Enhanced';

const TestRahulJanaChart = () => {
  // Birth Data for Rahul Jana:
  // Date: 15 April 1989, Time: 14:30 IST, Place: Kolkata, India
  // Coordinates: 22.5726° N, 88.3639° E
  
  // Chart data following your 3-step logic:
  // 1. Ascendant Sign = House 1 (H1) = Sagittarius
  // 2. Signs follow houses sequentially from H1 to H12 
  // 3. Planets positioned based on their signs relative to Ascendant
  
  const rahulJanaChartData = {
    houses: [
      // H1 - Sagittarius (Ascendant)
      { 
        number: 1, 
        sign: 'Sagittarius', 
        planets: ['Jupiter'], 
        degrees: ['15°42\''] 
      },
      
      // H2 - Capricorn
      { 
        number: 2, 
        sign: 'Capricorn', 
        planets: ['Saturn'], 
        degrees: ['28°15\''] 
      },
      
      // H3 - Aquarius
      { 
        number: 3, 
        sign: 'Aquarius', 
        planets: [], 
        degrees: [] 
      },
      
      // H4 - Pisces
      { 
        number: 4, 
        sign: 'Pisces', 
        planets: ['Sun', 'Mercury'], 
        degrees: ['25°32\'', '12°18\''] 
      },
      
      // H5 - Aries
      { 
        number: 5, 
        sign: 'Aries', 
        planets: ['Mars'], 
        degrees: ['08°45\''] 
      },
      
      // H6 - Taurus
      { 
        number: 6, 
        sign: 'Taurus', 
        planets: ['Venus'], 
        degrees: ['18°23\''] 
      },
      
      // H7 - Gemini
      { 
        number: 7, 
        sign: 'Gemini', 
        planets: [], 
        degrees: [] 
      },
      
      // H8 - Cancer
      { 
        number: 8, 
        sign: 'Cancer', 
        planets: ['Moon'], 
        degrees: ['22°56\''] 
      },
      
      // H9 - Leo
      { 
        number: 9, 
        sign: 'Leo', 
        planets: [], 
        degrees: [] 
      },
      
      // H10 - Virgo
      { 
        number: 10, 
        sign: 'Virgo', 
        planets: [], 
        degrees: [] 
      },
      
      // H11 - Libra
      { 
        number: 11, 
        sign: 'Libra', 
        planets: ['Rahu'], 
        degrees: ['27°25\''] 
      },
      
      // H12 - Scorpio
      { 
        number: 12, 
        sign: 'Scorpio', 
        planets: ['Ketu'], 
        degrees: ['27°25\''] 
      }
    ],
    
    // Additional metadata
    metadata: {
      birthDate: '15 April 1989',
      birthTime: '14:30 IST',
      birthPlace: 'Kolkata, India',
      coordinates: '22.5726° N, 88.3639° E',
      ascendant: 'Sagittarius',
      ascendantDegree: '15°42\'',
      nativeName: 'Rahul Jana'
    }
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Birth Chart Analysis</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Name:</strong> {rahulJanaChartData.metadata.nativeName}</p>
              <p><strong>Birth Date:</strong> {rahulJanaChartData.metadata.birthDate}</p>
              <p><strong>Birth Time:</strong> {rahulJanaChartData.metadata.birthTime}</p>
            </div>
            <div>
              <p><strong>Birth Place:</strong> {rahulJanaChartData.metadata.birthPlace}</p>
              <p><strong>Coordinates:</strong> {rahulJanaChartData.metadata.coordinates}</p>
              <p><strong>Ascendant:</strong> {rahulJanaChartData.metadata.ascendant} {rahulJanaChartData.metadata.ascendantDegree}</p>
            </div>
          </div>
        </div>

        {/* Chart Component */}
        <NorthIndianChart 
          chartData={rahulJanaChartData}
          title="Rahul Jana - Lagna Chart (D1)"
          onHouseClick={handleHouseClick}
          className="mb-8"
        />

        {/* Chart Logic Explanation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Chart Drawing Logic Applied:</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Step 1:</strong> Ascendant Sign (Sagittarius) placed in House 1 (H1)</p>
            <p><strong>Step 2:</strong> Signs follow houses sequentially: H1=Sagittarius, H2=Capricorn, H3=Aquarius, etc.</p>
            <p><strong>Step 3:</strong> Planets positioned based on their signs relative to Ascendant</p>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold mb-2">Planet Positions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {rahulJanaChartData.houses
                .filter(house => house.planets.length > 0)
                .map(house => (
                  <div key={house.number} className="flex justify-between">
                    <span>H{house.number} ({house.sign}):</span>
                    <span>{house.planets.join(', ')}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRahulJanaChart;
