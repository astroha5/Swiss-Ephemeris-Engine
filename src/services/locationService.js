import axios from 'axios';

/**
 * Enhanced Location Service for accurate astrological calculations
 * Uses multiple APIs for better coverage and precision
 */

// Predefined Indian cities with precise coordinates (as fallback)
const INDIAN_CITIES_DB = {
  'Delhi': [
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'North Delhi', lat: 28.7041, lng: 77.1025, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'South Delhi', lat: 28.5355, lng: 77.2267, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'Central Delhi', lat: 28.6500, lng: 77.2100, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'East Delhi', lat: 28.6508, lng: 77.3152, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'West Delhi', lat: 28.6692, lng: 77.1178, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'Connaught Place', lat: 28.6315, lng: 77.2167, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'Karol Bagh', lat: 28.6519, lng: 77.1909, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'Paharganj', lat: 28.6448, lng: 77.2167, state: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'Lajpat Nagar', lat: 28.5677, lng: 77.2434, state: 'Delhi', timezone: 'Asia/Kolkata' }
  ],
  'Mumbai': [
    { name: 'Mumbai Central', lat: 19.0176, lng: 72.8562, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Andheri', lat: 19.1136, lng: 72.8697, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Bandra', lat: 19.0544, lng: 72.8406, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Borivali', lat: 19.2307, lng: 72.8567, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Colaba', lat: 18.9067, lng: 72.8147, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Dadar', lat: 19.0176, lng: 72.8562, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Malad', lat: 19.1864, lng: 72.8493, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Powai', lat: 19.1176, lng: 72.9060, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Thane', lat: 19.2183, lng: 72.9781, state: 'Maharashtra', timezone: 'Asia/Kolkata' },
    { name: 'Worli', lat: 19.0176, lng: 72.8177, state: 'Maharashtra', timezone: 'Asia/Kolkata' }
  ],
  'Kolkata': [
    { name: 'Kolkata Central', lat: 22.5726, lng: 88.3639, state: 'West Bengal', timezone: 'Asia/Kolkata' },
    { name: 'Salt Lake', lat: 22.5847, lng: 88.4166, state: 'West Bengal', timezone: 'Asia/Kolkata' },
    { name: 'Park Street', lat: 22.5543, lng: 88.3616, state: 'West Bengal', timezone: 'Asia/Kolkata' },
    { name: 'Howrah', lat: 22.5958, lng: 88.2636, state: 'West Bengal', timezone: 'Asia/Kolkata' },
    { name: 'Ballygunge', lat: 22.5344, lng: 88.3656, state: 'West Bengal', timezone: 'Asia/Kolkata' }
  ],
  'Chennai': [
    { name: 'Chennai Central', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', timezone: 'Asia/Kolkata' },
    { name: 'T. Nagar', lat: 13.0418, lng: 80.2341, state: 'Tamil Nadu', timezone: 'Asia/Kolkata' },
    { name: 'Anna Nagar', lat: 13.0850, lng: 80.2101, state: 'Tamil Nadu', timezone: 'Asia/Kolkata' },
    { name: 'Adyar', lat: 13.0067, lng: 80.2567, state: 'Tamil Nadu', timezone: 'Asia/Kolkata' },
    { name: 'Velachery', lat: 12.9816, lng: 80.2209, state: 'Tamil Nadu', timezone: 'Asia/Kolkata' }
  ]
};

/**
 * Search for locations with autocomplete functionality
 * @param {string} query - Search term
 * @param {number} limit - Maximum results (default: 10)
 * @returns {Promise<Array>} Array of location suggestions
 */
export const searchLocations = async (query, limit = 10) => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // First, search in our predefined database for Indian cities
    const localResults = searchLocalDatabase(query, limit);
    
    // If we have good local results, return them
    if (localResults.length >= 3) {
      return localResults;
    }

    // Otherwise, use external APIs
    const externalResults = await searchExternalAPIs(query, limit);
    
    // Combine and deduplicate
    const allResults = [...localResults, ...externalResults];
    const uniqueResults = deduplicateResults(allResults);
    
    return uniqueResults.slice(0, limit);
  } catch (error) {
    console.error('Location search error:', error);
    // Return local results as fallback
    return searchLocalDatabase(query, limit);
  }
};

/**
 * Search in local database for Indian cities
 */
function searchLocalDatabase(query, limit) {
  const results = [];
  const queryLower = query.toLowerCase();

  // Search through all cities and subcities
  Object.keys(INDIAN_CITIES_DB).forEach(cityKey => {
    const locations = INDIAN_CITIES_DB[cityKey];
    
    locations.forEach(location => {
      if (location.name.toLowerCase().includes(queryLower)) {
        results.push({
          name: location.name,
          displayName: `${location.name}, ${location.state}, India`,
          latitude: location.lat,
          longitude: location.lng,
          city: location.name,
          state: location.state,
          country: 'India',
          timezone: location.timezone,
          source: 'local'
        });
      }
    });
  });

  return results.slice(0, limit);
}

/**
 * Search using external APIs
 */
async function searchExternalAPIs(query, limit) {
  const results = [];

  try {
    // Use OpenStreetMap Nominatim with better parameters
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?` + 
      `format=json&q=${encodeURIComponent(query)}&` +
      `limit=${limit}&addressdetails=1&countrycodes=in&` +
      `bounded=1&viewbox=68,8,97,38`; // India bounding box

    const response = await axios.get(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en'
      },
      timeout: 10000
    });

    if (response.data && response.data.length > 0) {
      response.data.forEach(item => {
        const location = {
          name: item.display_name.split(',')[0],
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: item.address?.city || item.address?.town || item.address?.village,
          state: item.address?.state,
          country: item.address?.country,
          timezone: getTimezoneFromCoordinates(parseFloat(item.lat), parseFloat(item.lon)),
          source: 'nominatim'
        };
        results.push(location);
      });
    }
  } catch (error) {
    console.warn('Nominatim search failed:', error.message);
  }

  return results;
}

/**
 * Remove duplicate results
 */
function deduplicateResults(results) {
  const seen = new Set();
  return results.filter(item => {
    const key = `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Get timezone from coordinates
 */
function getTimezoneFromCoordinates(lat, lng) {
  // For Indian subcontinent
  if (lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
    return 'Asia/Kolkata';
  }
  
  // Basic timezone detection for other regions
  if (lng >= -180 && lng < -150) return 'Pacific/Honolulu';
  if (lng >= -150 && lng < -120) return 'America/Anchorage';
  if (lng >= -120 && lng < -105) return 'America/Los_Angeles';
  if (lng >= -105 && lng < -90) return 'America/Denver';
  if (lng >= -90 && lng < -75) return 'America/Chicago';
  if (lng >= -75 && lng < -60) return 'America/New_York';
  if (lng >= -30 && lng < 15) return 'Europe/London';
  if (lng >= 15 && lng < 30) return 'Europe/Berlin';
  if (lng >= 30 && lng < 45) return 'Europe/Moscow';
  if (lng >= 60 && lng < 90) return 'Asia/Kolkata';
  if (lng >= 90 && lng < 120) return 'Asia/Shanghai';
  if (lng >= 120 && lng < 150) return 'Asia/Tokyo';
  if (lng >= 150 && lng <= 180) return 'Pacific/Auckland';
  
  return 'UTC';
}

/**
 * Get precise location details
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Detailed location information
 */
export const getLocationDetails = async (latitude, longitude) => {
  try {
    const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

    const response = await axios.get(reverseGeocodeUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en'
      },
      timeout: 10000
    });

    if (response.data) {
      const address = response.data.address || {};
      return {
        latitude,
        longitude,
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        country: address.country || '',
        formattedAddress: response.data.display_name || `${latitude}, ${longitude}`,
        timezone: getTimezoneFromCoordinates(latitude, longitude)
      };
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }

  // Fallback
  return {
    latitude,
    longitude,
    city: '',
    state: '',
    country: '',
    formattedAddress: `${latitude}, ${longitude}`,
    timezone: getTimezoneFromCoordinates(latitude, longitude)
  };
};

export default {
  searchLocations,
  getLocationDetails
};
