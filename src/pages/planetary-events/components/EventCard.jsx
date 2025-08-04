import React from 'react';

const EventCard = ({ event, onClose }) => {
  const getImpactColor = (level) => {
    switch (level) {
      case 'extreme': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      financial: '💰',
      natural_disaster: '🌪️',
      political: '🏛️',
      war: '⚔️',
      terrorism: '💥',
      pandemic: '🦠',
      technology: '💻',
      social: '👥',
      accident: '🚨',
      other: '📄'
    };
    return icons[category] || '📄';
  };

  const getPlanetIcon = (planet) => {
    const icons = {
      sun: '☉',
      moon: '☽',
      mars: '♂',
      mercury: '☿',
      jupiter: '♃',
      venus: '♀',
      saturn: '♄',
      rahu: '☊',
      ketu: '☋'
    };
    return icons[planet] || '●';
  };


  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getCategoryIcon(event.category)}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(event.impact_level)}`}>
                {event.impact_level} impact
              </span>
              <span className="text-gray-500">
                {new Date(event.event_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
        <p className="text-gray-700 leading-relaxed">{event.description}</p>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium">{event.category.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{event.event_type?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{event.location_name || 'Global'}</span>
            </div>
            {event.country_code && (
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span className="font-medium">{event.country_code}</span>
              </div>
            )}
            {event.affected_population && (
              <div className="flex justify-between">
                <span className="text-gray-600">Affected:</span>
                <span className="font-medium">{event.affected_population.toLocaleString()} people</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Coordinates</h3>
          <div className="space-y-2 text-sm">
            {event.latitude && event.longitude && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-medium">{event.latitude.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-medium">{event.longitude.toFixed(4)}°</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Source:</span>
              <span className="font-medium">{event.source_name || 'manual'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Planetary Positions */}
      {eventData.sun_sign && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🌌 Planetary Positions</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { key: 'sun', name: 'Sun' },
              { key: 'moon', name: 'Moon' },
              { key: 'mars', name: 'Mars' },
              { key: 'mercury', name: 'Mercury' },
              { key: 'jupiter', name: 'Jupiter' },
              { key: 'venus', name: 'Venus' },
              { key: 'saturn', name: 'Saturn' },
              { key: 'rahu', name: 'Rahu' },
              { key: 'ketu', name: 'Ketu' }
            ].map(planet => {
              const sign = eventData[`${planet.key}_sign`];
              const degree = eventData[`${planet.key}_degree_in_sign`];
              const nakshatra = eventData[`${planet.key}_nakshatra`];
              
              if (!sign) return null;
              
              return (
                <div key={planet.key} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl mb-1">{getPlanetIcon(planet.key)}</div>
                  <div className="text-sm font-medium text-gray-900">{planet.name}</div>
                  <div className="text-xs text-gray-600">{sign}</div>
                  {degree && (
                    <div className="text-xs text-gray-500">{degree.toFixed(1)}°</div>
                  )}
                  {nakshatra && planet.key === 'moon' && (
                    <div className="text-xs text-blue-600 mt-1">{nakshatra}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Ascendant if available */}
          {eventData.ascendant_sign && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900 mb-1">Ascendant</div>
              <div className="text-lg text-blue-600">{eventData.ascendant_sign} {eventData.ascendant_degree_in_sign?.toFixed(1)}°</div>
            </div>
          )}
        </div>
      )}
      
      {/* Missing Planetary Data Notice */}
      {!eventData.sun_sign && event.latitude && event.longitude && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔭 Planetary Data Available</h3>
                <p className="text-sm text-yellow-700">
                  This event has location and time data. We can calculate the planetary positions, signs, aspects, and nakshatras.
                </p>
              </div>
              <button
                onClick={handleEnhanceWithPlanetaryData}
                disabled={enhancing}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
              >
                {enhancing ? '🔄 Calculating...' : '✨ Calculate Now'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* No Location Data Notice */}
      {!eventData.sun_sign && (!event.latitude || !event.longitude) && (
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">📏 Missing Location Data</h3>
            <p className="text-sm text-gray-600">
              Planetary calculations require precise location coordinates. This event is missing latitude/longitude data.
            </p>
          </div>
        </div>
      )}

      {/* Source Link */}
      {event.source_url && (
        <div className="text-center pt-4 border-t">
          <a
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            📖 View Source
          </a>
        </div>
      )}
    </div>
  );
};

export default EventCard;
