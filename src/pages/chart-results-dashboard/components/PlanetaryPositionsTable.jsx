import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const PlanetaryPositionsTable = ({ planetaryData, aspectsData }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [sortBy, setSortBy] = useState('planet');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showPlanetaryAspects, setShowPlanetaryAspects] = useState(true);
  const [showOnlyAspectsToPlanets, setShowOnlyAspectsToPlanets] = useState(false);

  // Debug: Log received data
  console.log('🪐 PlanetaryPositionsTable received planetaryData:', planetaryData);
  console.log('🎯 PlanetaryPositionsTable received aspectsData:', aspectsData);

  // Use real data if available, otherwise use mock data for demonstration
  const hasRealData = planetaryData && planetaryData.length > 0;
  const hasAspectsData = aspectsData && (aspectsData.planetaryAspects || aspectsData.houseAspects);

  // Mock planetary positions data
  const mockPlanetaryData = [
    {
      planet: 'Sun',
      symbol: '☉',
      sign: 'Aries',
      house: 1,
      degree: '15°23\'12"',
      nakshatra: 'Bharani',
      pada: 2,
      retrograde: false,
    },
    {
      planet: 'Moon',
      symbol: '☽',
      sign: 'Cancer',
      house: 4,
      degree: '05°32\'45"',
      nakshatra: 'Pushya',
      pada: 1,
      retrograde: false,
    },
    {
      planet: 'Mars',
      symbol: '♂',
      sign: 'Libra',
      house: 7,
      degree: '18°42\'30"',
      nakshatra: 'Swati',
      pada: 3,
      retrograde: false,
    },
    {
      planet: 'Mercury',
      symbol: '☿',
      sign: 'Aries',
      house: 1,
      degree: '28°45\'18"',
      nakshatra: 'Krittika',
      pada: 1,
      retrograde: true,
    },
    {
      planet: 'Jupiter',
      symbol: '♃',
      sign: 'Leo',
      house: 5,
      degree: '22°15\'42"',
      nakshatra: 'Purva Phalguni',
      pada: 4,
      retrograde: false,
    },
    {
      planet: 'Venus',
      symbol: '♀',
      sign: 'Taurus',
      house: 2,
      degree: '12°18\'55"',
      nakshatra: 'Rohini',
      pada: 2,
      retrograde: false,
    },
    {
      planet: 'Saturn',
      symbol: '♄',
      sign: 'Sagittarius',
      house: 9,
      degree: '09°28\'33"',
      nakshatra: 'Mula',
      pada: 1,
      retrograde: true,
    },
    {
      planet: 'Rahu',
      symbol: '☊',
      sign: 'Aquarius',
      house: 11,
      degree: '25°16\'20"',
      nakshatra: 'Purva Bhadrapada',
      pada: 4,
      retrograde: true,
    },
    {
      planet: 'Ketu',
      symbol: '☋',
      sign: 'Leo',
      house: 5,
      degree: '25°16\'20"',
      nakshatra: 'Purva Phalguni',
      pada: 4,
      retrograde: true,
    }
  ];

  const data = planetaryData || mockPlanetaryData;

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'house' || sortBy === 'pada') {
        aValue = parseInt(aValue);
        bValue = parseInt(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedData = sortData(data);

  const getAspectsForPlanet = (planetName) => {
    if (!aspectsData?.houseAspects) return [];
    const planetKey = planetName.toLowerCase();
    const planetAspectData = aspectsData.houseAspects[planetKey];
    if (!planetAspectData) return [];

    return planetAspectData.aspectsToHouses.map(aspect => {
        const houseNumber = aspect.houseNumber;
        const planetsInHouse = sortedData.filter(p => p.house === houseNumber && p.planet !== planetName).map(p => p.planet);
        return {
            houseNumber,
            planetsInHouse,
        };
    });
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-semibold text-text-primary">
          Planetary Positions
        </h3>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex bg-surface-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-celestial ${
                viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon name="Table" size={16} className="inline mr-1" />
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-celestial ${
                viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon name="Grid3X3" size={16} className="inline mr-1" />
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      {viewMode === 'table' && (
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                {[
                  { key: 'planet', label: 'Planet' },
                  { key: 'sign', label: 'Sign' },
                  { key: 'house', label: 'House' },
                  { key: 'degree', label: 'Degree' },
                  { key: 'nakshatra', label: 'Nakshatra' },
                ].map((column) => (
                  <th
                    key={column.key}
                    className="text-left py-3 px-2 font-heading font-semibold text-text-primary cursor-pointer hover:text-primary transition-celestial"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortBy === column.key && (
                        <Icon 
                          name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                          size={14} 
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((planet, index) => (
                <tr 
                  key={planet.planet}
                  className="border-b border-border-light hover:bg-primary/5 transition-celestial"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{planet.symbol}</span>
                      <div>
                        <div className="font-medium text-text-primary">{planet.planet}</div>
                        {planet.retrograde && (
                          <div className="text-xs text-error font-caption">Retrograde</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-text-secondary">{planet.sign}</td>
                  <td className="py-3 px-2 text-text-secondary">{planet.house}</td>
                  <td className="py-3 px-2 font-mono text-sm text-text-secondary">{planet.degree}</td>
                  <td className="py-3 px-2">
                    <div className="text-text-secondary">
                      {planet.nakshatra}
                      <span className="text-xs text-text-muted ml-1">({planet.pada})</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards View */}
      {(viewMode === 'cards' || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
        <div className="lg:hidden space-y-4">
          {sortedData.map((planet, index) => (
            <div 
              key={planet.planet}
              className="bg-surface-secondary rounded-lg border border-border-light p-4 hover:border-primary/40 transition-celestial"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{planet.symbol}</span>
                  <div>
                    <h4 className="font-heading font-semibold text-text-primary">{planet.planet}</h4>
                    {planet.retrograde && (
                      <span className="text-xs text-error font-caption">Retrograde</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-muted font-caption">Sign:</span>
                  <span className="ml-2 text-text-primary">{planet.sign}</span>
                </div>
                <div>
                  <span className="text-text-muted font-caption">House:</span>
                  <span className="ml-2 text-text-primary">{planet.house}</span>
                </div>
                <div>
                  <span className="text-text-muted font-caption">Degree:</span>
                  <span className="ml-2 font-mono text-text-primary">{planet.degree}</span>
                </div>
                <div>
                  <span className="text-text-muted font-caption">Nakshatra:</span>
                  <span className="ml-2 text-text-primary">{planet.nakshatra} ({planet.pada})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Planetary Aspects (Graha Drishti) Section re-styled to match PlanetaryAspects.jsx */}
      {hasAspectsData && (
        <div className="border-t border-border bg-surface-secondary mt-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <Icon name="Eye" size={16} className="text-accent" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-heading font-semibold text-text-primary">
                      Planetary Aspects (Graha Drishti)
                    </h3>
                    <div className="relative group">
                      <Icon name="Info" size={16} className="text-text-muted cursor-help" />
                      <div className="absolute left-0 top-6 bg-surface border border-border rounded-lg p-3 text-xs text-text-secondary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-80">
                        <p className="font-medium mb-2">Vedic Planetary Aspects (Graha Drishti)</p>
                        <p>In Vedic astrology, each planet casts its gaze (Drishti) on specific houses. Mars, Jupiter, and Saturn have special aspects beyond the standard 7th house aspect that all planets share.</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Each planet aspects specific houses based on Vedic principles.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowOnlyAspectsToPlanets(!showOnlyAspectsToPlanets)}
                  className={`px-3 py-1 text-xs rounded font-semibold border transition-all duration-200 flex items-center space-x-2 ${showOnlyAspectsToPlanets ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface text-text-secondary border-border hover:bg-primary/5'}`}
                >
                  <Icon name="Filter" size={15} className="inline-block mr-1" />
                  {showOnlyAspectsToPlanets ? 'Show All Aspects' : 'Show Only Aspects to Planets'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bring planet colors/symbol map locally here to match reference */}
              {sortedData.map(planet => {
                // Colors and symbols matching reference file
                const planetInfo = {
                  'Sun':   { symbol: '☉', color: 'text-orange-500' },
                  'Moon':  { symbol: '☽', color: 'text-blue-400' },
                  'Mars':  { symbol: '♂', color: 'text-red-500' },
                  'Mercury': { symbol: '☿', color: 'text-green-500' },
                  'Jupiter': { symbol: '♃', color: 'text-yellow-500' },
                  'Venus': { symbol: '♀', color: 'text-pink-500' },
                  'Saturn': { symbol: '♄', color: 'text-purple-600' },
                  'Rahu': { symbol: '☊', color: 'text-gray-600' },
                  'Ketu': { symbol: '☋', color: 'text-gray-500' }
                };
                const aspects = getAspectsForPlanet(planet.planet);
                // Fetch info for current planet
                const planetSymbol = planetInfo[planet.planet]?.symbol || '●';
                const planetColor = planetInfo[planet.planet]?.color || 'text-text-primary';
                // For each: get house+planetsInHouse for display (showOnlyAspectsToPlanets logic)
                const filteredAspects = showOnlyAspectsToPlanets
                  ? aspects.filter(a => a.planetsInHouse.length > 0)
                  : aspects;
                if (filteredAspects.length === 0) return null;
                return (
                  <div key={planet.planet} className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`text-lg ${planetColor}`}>{planetSymbol}</span>
                      <div>
                        <h5 className="font-medium text-text-primary">{planet.planet}</h5>
                        <p className="text-xs text-text-muted">In House {planet.house}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {filteredAspects.map((aspect, idx) => (
                        <div key={idx} className="text-sm">
                          <span className={`font-semibold text-primary`}>
                            aspects {aspect.houseNumber}th
                          </span>
                          {aspect.planetsInHouse.length > 0 && (
                            <span className="text-text-secondary ml-2">
                              (aspecting {aspect.planetsInHouse.map(name => {
                                const info = planetInfo[name] || { symbol: '●', color: '' };
                                return `${info.symbol} ${name}`;
                              }).join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanetaryPositionsTable;
