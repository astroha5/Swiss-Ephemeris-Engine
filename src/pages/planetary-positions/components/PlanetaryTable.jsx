import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PlanetaryAspects from './PlanetaryAspects';

const PlanetaryTable = ({ planetaryData, selectedDate, location }) => {
  // Debug logging to identify the issue
  console.log('🪐 PlanetaryTable received planetaryData:', planetaryData);
  console.log('🎯 Aspects data structure:', {
    hasAspects: !!planetaryData?.aspects,
    aspectsKeys: planetaryData?.aspects ? Object.keys(planetaryData.aspects) : [],
    planetaryAspects: planetaryData?.aspects?.planetaryAspects,
    planetaryAspectsLength: planetaryData?.aspects?.planetaryAspects?.length || 0,
    houseAspects: planetaryData?.aspects?.houseAspects,
    strongestAspects: planetaryData?.aspects?.strongestAspects
  });
  const [sortBy, setSortBy] = useState('planet');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showDegrees, setShowDegrees] = useState(true);
  const planets = Array.isArray(planetaryData) ? planetaryData : (planetaryData?.planets || []);
  const houses = planetaryData?.charts?.lagna?.houses || [];
  
  const planetInfo = {
    'Sun': { symbol: '☉', color: 'text-orange-500', description: 'Soul, ego, vitality' },
    'Moon': { symbol: '☽', color: 'text-blue-400', description: 'Mind, emotions, intuition' },
    'Mars': { symbol: '♂', color: 'text-red-500', description: 'Energy, action, courage' },
    'Mercury': { symbol: '☿', color: 'text-green-500', description: 'Communication, intellect' },
    'Jupiter': { symbol: '♃', color: 'text-yellow-500', description: 'Wisdom, expansion, luck' },
    'Venus': { symbol: '♀', color: 'text-pink-500', description: 'Love, beauty, harmony' },
    'Saturn': { symbol: '♄', color: 'text-purple-600', description: 'Discipline, structure, karma' },
    'Rahu': { symbol: '☊', color: 'text-gray-600', description: 'Desires, obsessions, future' },
    'Ketu': { symbol: '☋', color: 'text-gray-500', description: 'Liberation, past karma' }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanetHouse = (planet) => {
    if (planet.house) {
      return planet.house;
    }
    if (!houses || houses.length === 0) return 'N/A';
    for (let i = 0; i < houses.length; i++) {
      const house = houses[i];
      if (house.planets && house.planets.includes(planet.name)) {
        return house.number;
      }
    }
    return 'N/A';
  };

  const sortedData = planets ? [...planets].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'degree') {
      aValue = parseFloat(a.degree || 0);
      bValue = parseFloat(b.degree || 0);
    } else if (sortBy === 'planet') {
      aValue = a.name;
      bValue = b.name;
    }
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  }) : [];

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getRetrogradeBadge = (isRetrograde) => {
    if (isRetrograde) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
          <Icon name="RotateCcw" size={10} className="mr-1" />
          R
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
        <Icon name="ArrowRight" size={10} className="mr-1" />
        D
      </span>
    );
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <Icon name="ArrowUpDown" size={14} className="text-text-muted opacity-50" />;
    }
    return (
      <Icon 
        name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} 
        size={14} 
        className="text-primary" 
      />
    );
  };

  if (!planets || planets.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl shadow-strong p-8 text-center">
        <Icon name="Table" size={48} className="text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No Planetary Data Available
        </h3>
        <p className="text-text-secondary">
          Please select a date and location to view detailed planetary positions.
        </p>
      </div>
    );
  }

return (
    <div className="bg-surface border border-border rounded-xl shadow-strong overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/5 to-primary/5 border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <Icon name="Table" size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                Planetary Positions Table
              </h2>
              <p className="text-sm text-text-secondary">
                Detailed planetary data with signs, degrees, and nakshatras
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant={showDegrees ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowDegrees(!showDegrees)}
              iconName="RotateCw"
              iconPosition="left"
              className="text-xs"
            >
              {showDegrees ? 'Hide' : 'Show'} Degrees
            </Button>
          </div>
        </div>

        {/* Date & Location Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-text-muted" />
            <span className="font-medium text-text-primary">
              {formatDate(selectedDate)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="MapPin" size={16} className="text-text-muted" />
            <span className="font-medium text-text-primary">
              {location?.city}, {location?.country}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-secondary border-b border-border">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-secondary/50 transition-colors"
                onClick={() => handleSort('planet')}
              >
                <div className="flex items-center space-x-2">
                  <span>Planet</span>
                  <SortIcon column="planet" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-secondary/50 transition-colors"
                onClick={() => handleSort('sign')}
              >
                <div className="flex items-center space-x-2">
                  <span>Sign</span>
                  <SortIcon column="sign" />
                </div>
              </th>
              {showDegrees && (
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-secondary/50 transition-colors"
                  onClick={() => handleSort('degree')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Degree</span>
                    <SortIcon column="degree" />
                  </div>
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Nakshatra
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Motion
              </th>
<th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-secondary/50 transition-colors">
                House
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedData.map((planet, index) => {
              const info = planetInfo[planet.name] || { symbol: '●', color: 'text-text-muted', description: '' };
              
              return (
                <tr 
                  key={planet.name}
                  className="hover:bg-surface-secondary/30 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg ${info.color}`}>
                        {info.symbol}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {planet.name}
                        </div>
                        <div className="text-xs text-text-muted hidden md:block">
                          {info.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-text-primary">
                      {planet.sign}
                    </span>
                  </td>
                  
{showDegrees && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-text-primary">
                    {planet.formatted}
                  </span>
                </td>
              )}

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  <div className="font-medium text-text-primary">
                    {planet.nakshatra || 'N/A'}
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                {getRetrogradeBadge(planet.isRetrograde)}
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {getPlanetHouse(planet)}
                </span>
              </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-surface-secondary p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-text-muted">
            <div className="flex items-center space-x-1">
              <Icon name="Info" size={14} />
              <span>Total Planets: {planets.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Zap" size={14} />
              <span>Calculations: Swiss Ephemeris</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              iconName="Download"
              iconPosition="left"
              className="text-xs"
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Unified Planetary Aspects Section */}
      {planetaryData?.aspects?.houseAspects && Object.keys(planetaryData.aspects.houseAspects).length > 0 && (
        <PlanetaryAspects planetaryData={{
          houseAspects: planetaryData.aspects.houseAspects,
          planets: planets
        }} />
      )}
    </div>
  );
};

export default PlanetaryTable;
