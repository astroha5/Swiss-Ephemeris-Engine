import React, { useState, useEffect, useRef } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { geocodeLocation } from '../../../services/api';

const LocationSection = ({ formData, errors, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Mock location data with emphasis on Indian cities
  const mockLocations = [
    { city: "Mumbai", state: "Maharashtra", country: "India", timezone: "Asia/Kolkata", lat: 19.0760, lng: 72.8777 },
    { city: "Delhi", state: "Delhi", country: "India", timezone: "Asia/Kolkata", lat: 28.7041, lng: 77.1025 },
    { city: "Bangalore", state: "Karnataka", country: "India", timezone: "Asia/Kolkata", lat: 12.9716, lng: 77.5946 },
    { city: "Chennai", state: "Tamil Nadu", country: "India", timezone: "Asia/Kolkata", lat: 13.0827, lng: 80.2707 },
    { city: "Kolkata", state: "West Bengal", country: "India", timezone: "Asia/Kolkata", lat: 22.5726, lng: 88.3639 },
    { city: "Hyderabad", state: "Telangana", country: "India", timezone: "Asia/Kolkata", lat: 17.3850, lng: 78.4867 },
    { city: "Pune", state: "Maharashtra", country: "India", timezone: "Asia/Kolkata", lat: 18.5204, lng: 73.8567 },
    { city: "Ahmedabad", state: "Gujarat", country: "India", timezone: "Asia/Kolkata", lat: 23.0225, lng: 72.5714 },
    { city: "Jaipur", state: "Rajasthan", country: "India", timezone: "Asia/Kolkata", lat: 26.9124, lng: 75.7873 },
    { city: "Lucknow", state: "Uttar Pradesh", country: "India", timezone: "Asia/Kolkata", lat: 26.8467, lng: 80.9462 },
    { city: "Kanpur", state: "Uttar Pradesh", country: "India", timezone: "Asia/Kolkata", lat: 26.4499, lng: 80.3319 },
    { city: "Nagpur", state: "Maharashtra", country: "India", timezone: "Asia/Kolkata", lat: 21.1458, lng: 79.0882 },
    { city: "Indore", state: "Madhya Pradesh", country: "India", timezone: "Asia/Kolkata", lat: 22.7196, lng: 75.8577 },
    { city: "Thane", state: "Maharashtra", country: "India", timezone: "Asia/Kolkata", lat: 19.2183, lng: 72.9781 },
    { city: "Bhopal", state: "Madhya Pradesh", country: "India", timezone: "Asia/Kolkata", lat: 23.2599, lng: 77.4126 },
    { city: "Visakhapatnam", state: "Andhra Pradesh", country: "India", timezone: "Asia/Kolkata", lat: 17.6868, lng: 83.2185 },
    { city: "Pimpri-Chinchwad", state: "Maharashtra", country: "India", timezone: "Asia/Kolkata", lat: 18.6298, lng: 73.7997 },
    { city: "Patna", state: "Bihar", country: "India", timezone: "Asia/Kolkata", lat: 25.5941, lng: 85.1376 },
    { city: "Vadodara", state: "Gujarat", country: "India", timezone: "Asia/Kolkata", lat: 22.3072, lng: 73.1812 },
    { city: "Ghaziabad", state: "Uttar Pradesh", country: "India", timezone: "Asia/Kolkata", lat: 28.6692, lng: 77.4538 },
    // International cities
    { city: "New York", state: "New York", country: "United States", timezone: "America/New_York", lat: 40.7128, lng: -74.0060 },
    { city: "London", state: "England", country: "United Kingdom", timezone: "Europe/London", lat: 51.5074, lng: -0.1278 },
    { city: "Dubai", state: "Dubai", country: "United Arab Emirates", timezone: "Asia/Dubai", lat: 25.2048, lng: 55.2708 },
    { city: "Singapore", state: "Singapore", country: "Singapore", timezone: "Asia/Singapore", lat: 1.3521, lng: 103.8198 },
    { city: "Toronto", state: "Ontario", country: "Canada", timezone: "America/Toronto", lat: 43.6532, lng: -79.3832 },
    { city: "Sydney", state: "New South Wales", country: "Australia", timezone: "Australia/Sydney", lat: -33.8688, lng: 151.2093 }
  ];

  const searchLocations = (query) => {
    if (!query || query.length < 2) return [];
    
    const filtered = mockLocations.filter(location => 
      location.city.toLowerCase().includes(query.toLowerCase()) ||
      location.state.toLowerCase().includes(query.toLowerCase()) ||
      location.country.toLowerCase().includes(query.toLowerCase())
    );
    
    // Prioritize Indian cities
    return filtered.sort((a, b) => {
      if (a.country === "India" && b.country !== "India") return -1;
      if (a.country !== "India" && b.country === "India") return 1;
      return 0;
    }).slice(0, 8);
  };

  const handleLocationInput = (e) => {
    const value = e.target.value;
    onChange({
      target: {
        name: 'birthLocation',
        value: value
      }
    });

    if (value.length >= 2) {
      setIsLoading(true);
      // First show local suggestions immediately
      const localResults = searchLocations(value);
      setSuggestions(localResults);
      setShowSuggestions(true);
      setIsLoading(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // New function to handle geocoding when user enters custom location
  const handleGeocodeLocation = async (locationString) => {
    // Check if location is already in our suggestions
    const existingSuggestion = suggestions.find(loc => 
      `${loc.city}, ${loc.state}, ${loc.country}`.toLowerCase() === locationString.toLowerCase()
    );
    
    if (existingSuggestion) {
      selectLocation(existingSuggestion);
      return;
    }

    // If not in suggestions, use real geocoding
    setIsLoading(true);
    try {
      const geocodedData = await geocodeLocation(locationString);
      
      // Store the geocoded location data
      onChange({
        target: {
          name: 'locationData',
          value: {
            latitude: geocodedData.latitude,
            longitude: geocodedData.longitude,
            timezone: geocodedData.timezone,
            formattedAddress: geocodedData.formattedAddress,
            city: geocodedData.city,
            state: geocodedData.state,
            country: geocodedData.country
          }
        }
      });
      
      console.log('Location geocoded successfully:', geocodedData);
    } catch (error) {
      console.error('Geocoding failed:', error);
      // Set error state
      onChange({
        target: {
          name: 'locationData',
          value: null
        }
      });
      
      // Show error to user
      alert(`Location not found: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectLocation = (location) => {
    const locationString = `${location.city}, ${location.state}, ${location.country}`;
    onChange({
      target: {
        name: 'birthLocation',
        value: locationString
      }
    });
    
    // Store additional location data
    onChange({
      target: {
        name: 'locationData',
        value: {
          city: location.city,
          state: location.state,
          country: location.country,
          timezone: location.timezone,
          latitude: location.lat,
          longitude: location.lng,
          coordinates: { lat: location.lat, lng: location.lng }
        }
      }
    });

    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClickOutside = (event) => {
    if (
      inputRef.current && !inputRef.current.contains(event.target) &&
      suggestionsRef.current && !suggestionsRef.current.contains(event.target)
    ) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-soft">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
          <Icon name="MapPin" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Birth Location
          </h3>
          <p className="text-sm text-text-secondary font-caption">
            Location determines planetary positions and house calculations
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="birthLocation" className="block text-sm font-medium text-text-primary mb-2">
            Place of Birth <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Input
              ref={inputRef}
              id="birthLocation"
              name="birthLocation"
              type="text"
              placeholder="Start typing city name..."
              value={formData.birthLocation}
              onChange={handleLocationInput}
              required
              className={`${errors.birthLocation ? 'border-error focus:border-error' : ''} pr-10`}
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <Icon name="Loader2" size={16} className="text-text-muted animate-spin" />
              ) : (
                <Icon name="Search" size={16} className="text-text-muted" />
              )}
            </div>
          </div>

          {/* Location Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-strong max-h-64 overflow-y-auto"
            >
              {suggestions.map((location, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectLocation(location)}
                  className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-celestial border-b border-border-light last:border-b-0 focus:outline-none focus:bg-primary/5"
                >
                  <div className="flex items-center space-x-3">
                    <Icon name="MapPin" size={14} className="text-primary" />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {location.city}
                      </div>
                      <div className="text-xs text-text-secondary font-caption">
                        {location.state}, {location.country}
                      </div>
                    </div>
                    {location.country === "India" && (
                      <div className="ml-auto">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-caption">
                          India
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {errors.birthLocation && (
            <div className="flex items-center space-x-2 mt-2">
              <Icon name="AlertCircle" size={14} className="text-error" />
              <span className="text-sm text-error font-caption">{errors.birthLocation}</span>
            </div>
          )}
          <p className="text-xs text-text-muted mt-1 font-caption">
            Type at least 2 characters to see suggestions. Indian cities are prioritized.
          </p>
        </div>

        {/* Selected Location Display */}
        {formData.locationData && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-success mb-2">
                  Location Confirmed
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary font-caption">
                  <div>
                    <span className="font-medium">Timezone:</span> {formData.locationData.timezone}
                  </div>
                  <div>
                    <span className="font-medium">Coordinates:</span> {formData.locationData.coordinates?.lat.toFixed(4)}, {formData.locationData.coordinates?.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Icon name="Lightbulb" size={16} className="text-primary mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary mb-1">
                Location Tips (स्थान सुझाव)
              </h4>
              <ul className="text-xs text-text-secondary space-y-1 font-caption">
                <li>• Use your exact birth city for most accurate results</li>
                <li>• If born in a small town, use the nearest major city</li>
                <li>• Hospital location is preferred over home address</li>
                <li>• Time zone will be automatically calculated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSection;