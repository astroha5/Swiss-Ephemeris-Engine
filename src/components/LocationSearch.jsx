import React, { useState, useEffect, useRef } from 'react';
import { searchLocations } from '../services/locationService';

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
        await searchLocations(query);
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

  const searchLocations = async (searchQuery) => {
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
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
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
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
                    
                    {/* Source indicator */}
                    <div className={`px-2 py-1 text-xs rounded ${
                      location.source === 'local' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {location.source === 'local' ? 'Precise' : 'External'}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Footer with precision note */}
              <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t">
                💡 <strong>Tip:</strong> Choose "Precise" locations for most accurate astrological calculations
              </div>
            </>
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No locations found. Try searching for a major city or area.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
