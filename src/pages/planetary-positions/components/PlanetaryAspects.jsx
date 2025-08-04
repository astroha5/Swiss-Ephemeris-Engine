
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PlanetaryAspects = ({ planetaryData }) => {
  const { houseAspects, planets } = planetaryData;
  const [showOnlyAspectsToPlanets, setShowOnlyAspectsToPlanets] = useState(false);

  const getPlanetsInHouse = (houseNumber) => {
    return planets.filter(p => p.house === houseNumber);
  };

  const planetInfo = {
    'Sun': { symbol: '☉', color: 'text-orange-500' },
    'Moon': { symbol: '☽', color: 'text-blue-400' },
    'Mars': { symbol: '♂', color: 'text-red-500' },
    'Mercury': { symbol: '☿', color: 'text-green-500' },
    'Jupiter': { symbol: '♃', color: 'text-yellow-500' },
    'Venus': { symbol: '♀', color: 'text-pink-500' },
    'Saturn': { symbol: '♄', color: 'text-purple-600' },
    'Rahu': { symbol: '☊', color: 'text-gray-600' },
    'Ketu': { symbol: '☋', color: 'text-gray-500' }
  };

  return (
    <div className="border-t border-border bg-surface-secondary">
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
                <Button
                    variant={showOnlyAspectsToPlanets ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowOnlyAspectsToPlanets(!showOnlyAspectsToPlanets)}
                    iconName="Filter"
                    iconPosition="left"
                    className="text-xs"
                >
                    {showOnlyAspectsToPlanets ? 'Show All Aspects' : 'Show Only Aspects to Planets'}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(houseAspects).map(([planetKey, planetAspectData]) => {
            const aspects = planetAspectData.aspectsToHouses.map(aspect => {
              const planetsInHouse = getPlanetsInHouse(aspect.houseNumber);
              return { ...aspect, planetsInHouse };
            });

            const filteredAspects = showOnlyAspectsToPlanets 
              ? aspects.filter(a => a.planetsInHouse.length > 0)
              : aspects;

            if (filteredAspects.length === 0) return null;

            const planetName = planetAspectData.planetName;
            const planetSymbol = planetInfo[planetName]?.symbol || '●';
            const planetColor = planetInfo[planetName]?.color || 'text-text-primary';

            return (
              <div key={planetKey} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`text-lg ${planetColor}`}>{planetSymbol}</span>
                  <div>
                    <h5 className="font-medium text-text-primary">{planetName}</h5>
                    <p className="text-xs text-text-muted">In House {planetAspectData.currentHouse}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredAspects.map((aspect, idx) => (
                    <div key={idx} className="text-sm">
                      <span className={`font-semibold ${aspect.isSpecialAspect ? 'text-accent' : 'text-primary'}`}>
                        {aspect.aspectType} to House {aspect.houseNumber}
                      </span>
                      {aspect.planetsInHouse.length > 0 && (
                        <span className="text-text-secondary ml-2">
                          (aspecting {aspect.planetsInHouse.map(planet => 
                            `${planetInfo[planet.name]?.symbol} ${planet.name}`
                          ).join(', ')})
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
  );
};

export default PlanetaryAspects;

