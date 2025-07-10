import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { geocodeLocation } from '../../../services/api';

const LocationSelector = ({ location, onLocationChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);

  // Predefined suggestions for common searches
  const getSuggestions = (query) => {
    const suggestions = [
      'Kolkata, India', 'Mumbai, India', 'Delhi, India', 'Chennai, India', 'Bangalore, India',
      'Hyderabad, India', 'Pune, India', 'Ahmedabad, India', 'Jaipur, India', 'Lucknow, India',
      'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA', 'Phoenix, USA',
      'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Liverpool, UK', 'Leeds, UK',
      'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
      'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Yokohama, Japan',
      'Dubai, UAE', 'Abu Dhabi, UAE', 'Singapore', 'Hong Kong', 'Seoul, South Korea',
      'Bangkok, Thailand', 'Kuala Lumpur, Malaysia', 'Manila, Philippines'
    ];
    
    if (!query || query.length < 2) return [];
    
    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    const suggestions = getSuggestions(value);
    setSearchResults(suggestions);
    setShowSuggestions(value.length >= 2 && suggestions.length > 0);
  };

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError(null);
      
      const result = await geocodeLocation(searchQuery);
      
      // Format the result for our component
      const locationData = {
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone,
        formattedAddress: result.formattedAddress,
        city: result.city || 'Unknown',
        country: result.country || 'Unknown'
      };

      onLocationChange(locationData);
      setSearchQuery('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Location search failed:', error);
      setError(error.message || 'Failed to find location. Please try a different search term.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    try {
      setIsSearching(true);
      setError(null);
      
      const result = await geocodeLocation(suggestion);
      
      const locationData = {
        latitude: result.latitude,
        longitude: result.longitude,
        timezone: result.timezone,
        formattedAddress: result.formattedAddress,
        city: result.city || 'Unknown',
        country: result.country || 'Unknown'
      };

      onLocationChange(locationData);
      setSearchQuery('');
    } catch (error) {
      console.error('Location search failed:', error);
      setError(error.message || 'Failed to find location. Please try a different search term.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'Astrova-App/1.0 (https://astrova.app)'
                }
              }
            );
            const data = await response.json();
            
            const locationData = {
              latitude,
              longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              formattedAddress: data.display_name,
              city: data.address?.city || data.address?.town || data.address?.village || 'Current Location',
              country: data.address?.country || 'Unknown'
            };
            
            onLocationChange(locationData);
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
            // Fallback to coordinates only
            onLocationChange({
              latitude,
              longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: 'Current Location',
              country: 'Unknown'
            });
          }
        },
        (error) => {
          console.error('Geolocation failed:', error);
          setError('Geolocation failed. Please search for a location manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const formatCoordinates = (lat, lng) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Location</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDetectLocation}
          iconName="MapPin"
          iconPosition="left"
          className="text-xs h-6"
        >
          Detect
        </Button>
      </div>

      {/* Current Location Display */}
      {location && (
        <div className="bg-background border border-border rounded-lg p-3">
          <div className="flex items-start space-x-3">
            <Icon name="MapPin" size={16} className="text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {location.city}
              </div>
              <div className="text-xs text-text-muted truncate">
                {location.country}
              </div>
              <div className="text-xs text-text-muted font-mono mt-1">
                {formatCoordinates(location.latitude, location.longitude)}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {location.timezone}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Search */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">
          Search Location
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter city, country..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              onFocus={() => {
                if (searchQuery.length >= 2) {
                  const suggestions = getSuggestions(searchQuery);
                  setShowSuggestions(suggestions.length > 0);
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicks
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              disabled={isSearching}
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface border border-border rounded-lg shadow-strong max-h-48 overflow-y-auto">
                {searchResults.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon name="MapPin" size={12} className="text-text-muted" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationSearch}
            disabled={isSearching || !searchQuery.trim()}
            iconName={isSearching ? 'Loader2' : 'Search'}
            iconPosition="left"
            className={`h-9 px-3 text-xs ${isSearching ? 'animate-spin' : ''}`}
          >
            {isSearching ? '' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/5 border border-error/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Icon name="AlertCircle" size={14} className="text-error mt-0.5" />
            <p className="text-xs text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Popular Locations */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">
          Popular Locations
        </label>
        <div className="grid grid-cols-1 gap-1">
          {[
            { name: 'Kolkata, India', lat: 22.5726, lng: 88.3639, tz: 'Asia/Kolkata' },
            { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777, tz: 'Asia/Kolkata' },
            { name: 'Delhi, India', lat: 28.6139, lng: 77.2090, tz: 'Asia/Kolkata' },
            { name: 'Chennai, India', lat: 13.0827, lng: 80.2707, tz: 'Asia/Kolkata' },
            { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946, tz: 'Asia/Kolkata' },
            { name: 'New York, USA', lat: 40.7128, lng: -74.0060, tz: 'America/New_York' },
            { name: 'London, UK', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
            { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
            { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
            { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' }
          ].map((loc) => (
            <Button
              key={loc.name}
              variant="ghost"
              size="sm"
              onClick={() => onLocationChange({
                latitude: loc.lat,
                longitude: loc.lng,
                timezone: loc.tz,
                formattedAddress: loc.name,
                city: loc.name.split(',')[0],
                country: loc.name.split(',')[1]?.trim() || 'Unknown'
              })}
              className="justify-start text-xs h-7 text-text-muted hover:text-text-primary"
              fullWidth
            >
              {loc.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Coordinates Input (Advanced) */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
          Advanced: Enter Coordinates
        </summary>
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Latitude"
              step="0.0001"
              min="-90"
              max="90"
              className="p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
            />
            <input
              type="number"
              placeholder="Longitude"
              step="0.0001"
              min="-180"
              max="180"
              className="p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            fullWidth
          >
            Use Coordinates
          </Button>
        </div>
      </details>
    </div>
  );
};

export default LocationSelector;
