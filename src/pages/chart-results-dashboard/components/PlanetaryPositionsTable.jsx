import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const PlanetaryPositionsTable = ({ planetaryData }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [sortBy, setSortBy] = useState('planet');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Debug: Log received data
  console.log('🪐 PlanetaryPositionsTable received planetaryData:', planetaryData);

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
      strength: 'Strong',
      nature: 'Benefic'
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
      strength: 'Exalted',
      nature: 'Benefic'
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
      strength: 'Debilitated',
      nature: 'Malefic'
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
      strength: 'Moderate',
      nature: 'Neutral'
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
      strength: 'Strong',
      nature: 'Benefic'
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
      strength: 'Exalted',
      nature: 'Benefic'
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
      strength: 'Moderate',
      nature: 'Malefic'
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
      strength: 'Strong',
      nature: 'Malefic'
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
      strength: 'Moderate',
      nature: 'Malefic'
    }
  ];

  const data = planetaryData || mockPlanetaryData;

  const getStrengthColor = (strength) => {
    switch (strength.toLowerCase()) {
      case 'exalted': return 'text-success';
      case 'strong': return 'text-primary';
      case 'moderate': return 'text-warning';
      case 'debilitated': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  const getNatureColor = (nature) => {
    switch (nature.toLowerCase()) {
      case 'benefic': return 'text-success';
      case 'malefic': return 'text-error';
      case 'neutral': return 'text-text-secondary';
      default: return 'text-text-secondary';
    }
  };

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
                viewMode === 'table' ?'bg-primary text-primary-foreground' :'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon name="Table" size={16} className="inline mr-1" />
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-celestial ${
                viewMode === 'cards' ?'bg-primary text-primary-foreground' :'text-text-muted hover:text-text-primary'
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
                  { key: 'strength', label: 'Strength' },
                  { key: 'nature', label: 'Nature' }
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
                  <td className="py-3 px-2">
                    <span className={`font-medium ${getStrengthColor(planet.strength)}`}>
                      {planet.strength}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`font-medium ${getNatureColor(planet.nature)}`}>
                      {planet.nature}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards View */}
      {(viewMode === 'cards' || window.innerWidth < 1024) && (
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
                <div className="text-right">
                  <div className={`font-medium ${getStrengthColor(planet.strength)}`}>
                    {planet.strength}
                  </div>
                  <div className={`text-sm ${getNatureColor(planet.nature)}`}>
                    {planet.nature}
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
    </div>
  );
};

export default PlanetaryPositionsTable;