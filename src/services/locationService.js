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
    // Prefer worldwide external search first
    const externalResults = await searchExternalAPIs(query, limit);

    // Augment with local Indian presets (useful for neighborhoods)
    const localResults = searchLocalDatabase(query, limit);

    // Combine and deduplicate, prioritize external first, then local
    // Ensure same city from local and OSM doesn't appear twice
    const allResults = [...externalResults, ...localResults];
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
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
      `format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1&accept-language=en`;

    const response = await axios.get(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
        // Nominatim requires a proper identifiable UA; axios sets one but you may add one server-side if proxied.
      },
      timeout: 10000
    });

    if (Array.isArray(response.data)) {
      for (const item of response.data) {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        results.push({
          name: item.address?.city || item.address?.town || item.address?.village || item.address?.hamlet || item.display_name?.split(',')[0] || 'Unknown',
          displayName: item.display_name,
          latitude: lat,
          longitude: lon,
          city: item.address?.city || item.address?.town || item.address?.village || item.address?.hamlet || '',
          state: item.address?.state || item.address?.region || item.address?.state_district || '',
          country: item.address?.country || '',
          timezone: getTimezoneFromCoordinates(lat, lon),
          source: 'nominatim'
        });
      }
    }
  } catch (error) {
    console.warn('Nominatim search failed:', error?.message || String(error));
  }

  return results;
}

/**
 * Remove duplicate results
 */
function deduplicateResults(results) {
  // Strategy:
  // - Build a stable signature on normalized name|admin1|country
  // - Within each signature bucket, group by rounded coordinates to collapse same place across sources
  // - Prefer higher quality source order: nominatim > local (but keep first occurrence order from combined array)
  // - Enhance displayName to a consistent, disambiguated format
  const normalize = (s) =>
    (s || '')
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const signatureFor = (r) => {
    const name = normalize(r.name || r.city || '');
    const admin = normalize(r.state || '');
    const country = normalize(r.country || '');
    return `${name}|${admin}|${country}`;
  };

  const coordKey = (r) => {
    // 3 dp ~ 100m precision; good to merge near-identical duplicates without collapsing distinct towns
    const lat = (Number(r.latitude) || 0).toFixed(3);
    const lon = (Number(r.longitude) || 0).toFixed(3);
    return `${lat},${lon}`;
  };

  // Bucket by signature then coordinates
  const bySignature = new Map();
  for (const r of results) {
    const sig = signatureFor(r);
    if (!bySignature.has(sig)) bySignature.set(sig, new Map());
    const bucket = bySignature.get(sig);
    const ck = coordKey(r);
    if (!bucket.has(ck)) {
      bucket.set(ck, r);
    } else {
      // Prefer sources in this order; keep existing if it's higher priority
      const existing = bucket.get(ck);
      const rank = (src) => (src === 'nominatim' ? 2 : src === 'local' ? 1 : 0);
      if (rank(r.source) > rank(existing.source)) {
        bucket.set(ck, r);
      }
    }
  }

  // Flatten keeping original order preference implicitly handled above,
  // and enhance labels for clarity
  const deduped = [];
  for (const [, coordMap] of bySignature) {
    for (const [, item] of coordMap) {
      // Build a clear, consistent display label:
      // City (or name), State, Country — with coordinates
      const cityOrName = item.name || item.city || 'Unknown';
      const parts = [cityOrName];
      if (item.state) parts.push(item.state);
      if (item.country) parts.push(item.country);
      const baseLabel = parts.join(', ');
      const latStr = typeof item.latitude === 'number' ? item.latitude.toFixed(4) : String(item.latitude || '');
      const lonStr = typeof item.longitude === 'number' ? item.longitude.toFixed(4) : String(item.longitude || '');
      const enhancedDisplay = `${baseLabel} (${latStr}, ${lonStr})`;

      deduped.push({
        ...item,
        // Use enhanced display to avoid ambiguous duplicates in UI
        displayName: enhancedDisplay
      });
    }
  }

  // To keep results deterministic for the UI, sort by:
  // - source rank
  // - then by name lexicographically
  const rank = (src) => (src === 'nominatim' ? 2 : src === 'local' ? 1 : 0);
  deduped.sort((a, b) => {
    const rdiff = rank(b.source) - rank(a.source);
    if (rdiff !== 0) return rdiff;
    const an = (a.name || a.city || '').toLowerCase();
    const bn = (b.name || b.city || '').toLowerCase();
    return an.localeCompare(bn);
  });

  return deduped;
}

/**
 * Get timezone from coordinates
 */
function getTimezoneFromCoordinates(lat, lng) {
  // Prefer timezone returned by a dedicated API when possible.
  // Fallback heuristic by longitude bands (very coarse).
  if (lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) return 'Asia/Kolkata';
  if (lng >= -180 && lng < -150) return 'Pacific/Honolulu';
  if (lng >= -150 && lng < -120) return 'America/Anchorage';
  if (lng >= -122 && lng < -112) return 'America/Los_Angeles';
  if (lng >= -112 && lng < -102) return 'America/Denver';
  if (lng >= -102 && lng < -87) return 'America/Chicago';
  if (lng >= -87 && lng < -67) return 'America/New_York';
  if (lng >= -30 && lng < 15) return 'Europe/London';
  if (lng >= 15 && lng < 30) return 'Europe/Berlin';
  if (lng >= 30 && lng < 50) return 'Europe/Moscow';
  if (lng >= 50 && lng < 80) return 'Asia/Tashkent';
  if (lng >= 80 && lng < 95) return 'Asia/Kolkata';
  if (lng >= 95 && lng < 110) return 'Asia/Bangkok';
  if (lng >= 110 && lng < 125) return 'Asia/Shanghai';
  if (lng >= 125 && lng < 140) return 'Asia/Tokyo';
  if (lng >= 140 && lng <= 180) return 'Pacific/Auckland';
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
