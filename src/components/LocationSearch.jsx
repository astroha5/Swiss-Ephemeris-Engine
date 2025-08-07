import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Location Search Component with Autocomplete
 * Provides precise coordinates for accurate astrological calculations
 */
const LocationSearch = ({ onLocationSelect, initialValue = '', placeholder = "Enter birth place (e.g., New Delhi, Delhi, India)" }) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        await performSearch(query);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return;

    setIsLoading(true);
    try {
      const { searchLocations: searchLocationsFn } = await import('../services/locationService');
      const results = await searchLocationsFn(searchQuery, 8);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSuggestionClick = (location) => {
    setQuery(location.displayName);
    setShowSuggestions(false);
    // Notify parent immediately; do NOT auto-open map here.
    onLocationSelect({
      name: location.name,
      displayName: location.displayName,
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      state: location.state,
      country: location.country,
      timezone: location.timezone,
      coordinates: {
        lat: location.latitude,
        lng: location.longitude
      }
    });
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay hiding suggestions to allow for clicks.
    // Guard against cases where relatedTarget is null (e.g., clicking outside the window)
    setTimeout(() => {
      const container = suggestionsRef.current;
      const next = e.relatedTarget;
      const inside = container && next && container.contains(next);
      if (!inside) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  // Map picker state
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Lazy load Leaflet only when needed to avoid initial bundle bloat
  const openMap = async () => {
    if (!mapLoaded) {
      try {
        await Promise.all([
          import('leaflet'),
          import('leaflet/dist/leaflet.css')
        ]);
        setMapLoaded(true);
      } catch (e) {
        console.error('Failed to load map libraries:', e);
      }
    }
    setShowMap(true);

    // After opening the modal, auto-drop a pin if current query corresponds to a selected location.
    // We use the currently selectedIndex if valid; otherwise, if user typed and selected earlier,
    // try to match by displayName from suggestions; as a fallback, do nothing.
    setTimeout(() => {
      try {
        // Prefer exact match by displayName from suggestions
        let target = null;
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          target = suggestions[selectedIndex];
        } else {
          target = suggestions.find(s => s.displayName === query) || null;
        }
        if (target && typeof target.latitude === 'number' && typeof target.longitude === 'number') {
          window.dispatchEvent(new CustomEvent('astrova:setMapPin', {
            detail: {
              lat: target.latitude,
              lng: target.longitude
            }
          }));
        }
      } catch (e) {
        console.error('Failed to auto-set pin after opening map:', e);
      }
    }, 50);
  };

  const closeMap = () => setShowMap(false);

  const handleMapPick = async (lat, lng) => {
    // Reverse geocode to fill display fields using existing service
    try {
      const { getLocationDetails } = await import('../services/locationService');
      const details = await getLocationDetails(lat, lng);
      const displayName = details.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      setQuery(displayName);
      onLocationSelect({
        name: details.city || displayName,
        displayName,
        latitude: lat,
        longitude: lng,
        city: details.city,
        state: details.state,
        country: details.country,
        timezone: details.timezone,
        coordinates: { lat, lng },
        source: 'map'
      });
    } catch (e) {
      console.error('Reverse geocode failed:', e);
      setQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      onLocationSelect({
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
        city: '',
        state: '',
        country: '',
        timezone: undefined,
        coordinates: { lat, lng },
        source: 'map'
      });
    } finally {
      setShowMap(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          autoComplete="off"
        />
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Search Icon */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={openMap}
              className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 border border-blue-200 rounded-md bg-blue-50"
              title="Pick on map"
              aria-label="Pick location on map"
            >
              Map
            </button>
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((location, index) => (
                <div
                  key={`${location.latitude}-${location.longitude}-${index}`}
                  onClick={() => handleSuggestionClick(location)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {location.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {location.displayName}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
                      </div>
                    </div>
                    
                    {/* Source indicator - clearer labels */}
                    <div className={`px-2 py-1 text-xs rounded ${
                      location.source === 'local' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {location.source === 'local' ? 'Verified (Local)' : 'Global (OSM)'}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Footer with clarity note */}
              <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t">
                💡 <strong>Tip:</strong> Items marked "Verified (Local)" are curated local entries. "Global (OSM)" results come from OpenStreetMap and cover worldwide places.
              </div>
            </>
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No locations found. Try searching for a major city or area.
            </div>
          )}
        </div>
      )}

      {/* Map modal (Leaflet) */}
      {showMap && (
        <LeafletModal onClose={closeMap} onPick={handleMapPick} />
      )}
    </div>
  );
};

/**
 * Lightweight Leaflet modal with OSM tiles
 * - Lazy imports handled in parent; here we import on first render of modal
 */
const LeafletModal = ({ onClose, onPick }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let L;
    let cleanup = () => {};
    let onExternalSetPin = null;
    (async () => {
      const leaflet = await import('leaflet');
      L = leaflet.default || leaflet;

      // Fix default marker icons path when bundling with Vite
      const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
      const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
      const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
      const DefaultIcon = L.icon({
        iconUrl,
        iconRetinaUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // India center as default
        zoom: 4,
        worldCopyJump: true
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Place or move marker on click
      const onMapClick = (e) => {
        if (!markerRef.current) {
          markerRef.current = L.marker(e.latlng, { draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => {
            // no-op; pick happens via button
          });
        } else {
          markerRef.current.setLatLng(e.latlng);
        }
      };

      map.on('click', onMapClick);

      // Listen for external request to set an initial pin
      onExternalSetPin = (ev) => {
        try {
          const { lat, lng } = ev.detail || {};
          if (typeof lat === 'number' && typeof lng === 'number') {
            const latlng = L.latLng(lat, lng);
            if (!markerRef.current) {
              markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
              markerRef.current.on('dragend', () => {});
            } else {
              markerRef.current.setLatLng(latlng);
            }
            map.setView(latlng, Math.max(map.getZoom(), 12), { animate: true });
          }
        } catch (e) {
          console.error('Failed to apply external pin:', e);
        }
      };
      window.addEventListener('astrova:setMapPin', onExternalSetPin);

      cleanup = () => {
        map.off('click', onMapClick);
        if (onExternalSetPin) {
          window.removeEventListener('astrova:setMapPin', onExternalSetPin);
        }
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    })();

    return () => cleanup();
  }, []);

  const confirmPick = () => {
    if (!markerRef.current) return;
    const { lat, lng } = markerRef.current.getLatLng();
    onPick(lat, lng);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-3xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Pick location on map</div>
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={onClose}
            aria-label="Close map"
          >
            ✕
          </button>
        </div>
        <div className="p-0">
          <div
            ref={mapContainerRef}
            className="w-full h-[60vh] rounded-b-lg"
            role="region"
            aria-label="Map"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
          <button
            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={confirmPick}
            // Avoid reading ref.current during render; keep button always enabled and guide via title.
            title="Click on the map to drop a pin, then confirm"
          >
            Use this location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSearch;
