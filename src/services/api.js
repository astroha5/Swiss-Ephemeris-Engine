import axios from 'axios';

// Backend API configuration
// Environment-based API URL configuration:
// - Development: Uses localhost:3001 (from .env.local)
// - Production: Uses https://astrova-backend.onrender.com (from .env.production)
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? 'https://astrova-backend.onrender.com' 
    : 'http://localhost:3001'
);

// Log the current API configuration for debugging
console.log('🔗 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV
});

// Create axios instance for backend API
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for chart generation
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('Backend API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      timestamp: new Date().toISOString()
    });
    return config;
  },
  (error) => {
    console.error('Backend API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('Backend API Response:', {
      status: response.status,
      url: response.config.url,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    console.error('Backend API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error cases
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Invalid birth details provided');
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while generating chart. Please try again.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Chart generation is taking longer than expected.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to chart generation service. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generate Kundli chart from birth details
 * @param {Object} formData - Birth details from the form
 * @returns {Promise<Object>} Chart data from backend
 */
export const generateKundli = async (formData) => {
  try {
    // Convert form data to backend API format
    const requestData = {
      date: formData.birthDate,
      time: formData.birthTime,
      latitude: formData.locationData?.latitude || 0,
      longitude: formData.locationData?.longitude || 0,
      timezone: formData.locationData?.timezone || 'Asia/Kolkata',
      name: formData.fullName,
      place: formData.birthLocation
    };

    // Validate required fields
    if (!requestData.date || !requestData.time) {
      throw new Error('Birth date and time are required');
    }

    if (!requestData.latitude || !requestData.longitude) {
      throw new Error('Location coordinates are required. Please ensure your birth location is properly geocoded.');
    }

    console.log('Generating Kundli with data:', requestData);

    const response = await api.post('/api/kundli', requestData);
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to generate chart');
    }

    return response.data;

  } catch (error) {
    console.error('Kundli generation error:', error);
    throw error;
  }
};

/**
 * Geocode location string to coordinates
 * @param {string} location - Location string from user
 * @returns {Promise<Object>} Coordinates and timezone data
 */
export const geocodeLocation = async (location) => {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&addressdetails=1`;
    
    const response = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'Astrova-App/1.0 (https://astrova.app)' // Required by Nominatim
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error(`Location "${location}" not found. Please try a more specific address.`);
    }

    const result = response.data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    // Determine timezone based on coordinates (simplified)
    // In production, you'd want to use a proper timezone API
    let timezone = 'Asia/Kolkata'; // Default for India
    
    // Basic timezone detection based on longitude
    if (longitude >= -180 && longitude < -150) timezone = 'Pacific/Honolulu';
    else if (longitude >= -150 && longitude < -120) timezone = 'America/Anchorage';
    else if (longitude >= -120 && longitude < -105) timezone = 'America/Los_Angeles';
    else if (longitude >= -105 && longitude < -90) timezone = 'America/Denver';
    else if (longitude >= -90 && longitude < -75) timezone = 'America/Chicago';
    else if (longitude >= -75 && longitude < -60) timezone = 'America/New_York';
    else if (longitude >= -30 && longitude < 15) timezone = 'Europe/London';
    else if (longitude >= 15 && longitude < 30) timezone = 'Europe/Berlin';
    else if (longitude >= 30 && longitude < 45) timezone = 'Europe/Moscow';
    else if (longitude >= 60 && longitude < 90) timezone = 'Asia/Kolkata';
    else if (longitude >= 90 && longitude < 120) timezone = 'Asia/Shanghai';
    else if (longitude >= 120 && longitude < 150) timezone = 'Asia/Tokyo';
    else if (longitude >= 150 && longitude <= 180) timezone = 'Pacific/Auckland';

    return {
      latitude,
      longitude,
      timezone,
      formattedAddress: result.display_name,
      country: result.address?.country,
      state: result.address?.state,
      city: result.address?.city || result.address?.town || result.address?.village
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    if (error.message.includes('not found')) {
      throw error;
    }
    throw new Error('Failed to find location coordinates. Please check your internet connection and try again.');
  }
};

/**
 * Generate Dasha data from birth details
 * @param {Object} birthDetails - Birth details for Dasha calculation
 * @returns {Promise<Object>} Dasha data from backend
 */
export const generateDasha = async (birthDetails) => {
  try {
    // Convert birth details to backend API format
    const requestData = {
      birthDate: birthDetails.dateOfBirth || birthDetails.birthDate,
      birthTime: birthDetails.timeOfBirth || birthDetails.birthTime,
      latitude: parseFloat(birthDetails.latitude),
      longitude: parseFloat(birthDetails.longitude),
      ...(birthDetails.timezone && { timezone: birthDetails.timezone }),
      ...(birthDetails.name && { name: birthDetails.name }),
      ...(birthDetails.placeOfBirth && { place: birthDetails.placeOfBirth })
    };

    // Validate required fields
    if (!requestData.birthDate || !requestData.birthTime) {
      throw new Error('Birth date and time are required for Dasha calculation');
    }

    if (!requestData.latitude || !requestData.longitude) {
      throw new Error('Location coordinates are required for Dasha calculation');
    }

    console.log('Generating Dasha with data:', requestData);

    const response = await api.post('/api/dasha', requestData);
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to generate Dasha data');
    }

    return response.data;

  } catch (error) {
    console.error('Dasha generation error:', error);
    throw error;
  }
};

/**
 * Get current Dasha periods
 * @param {Object} birthDetails - Birth details for current Dasha
 * @returns {Promise<Object>} Current Dasha periods
 */
export const getCurrentDasha = async (birthDetails) => {
  try {
    const requestData = {
      birthDate: birthDetails.dateOfBirth || birthDetails.birthDate,
      birthTime: birthDetails.timeOfBirth || birthDetails.birthTime,
      latitude: parseFloat(birthDetails.latitude),
      longitude: parseFloat(birthDetails.longitude),
      ...(birthDetails.timezone && { timezone: birthDetails.timezone })
    };

    const response = await api.post('/api/dasha/current', requestData);
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to get current Dasha');
    }

    return response.data;

  } catch (error) {
    console.error('Current Dasha error:', error);
    throw error;
  }
};

/**
 * Get Dasha periods reference
 * @returns {Promise<Object>} Dasha periods reference data
 */
export const getDashaPeriods = async () => {
  try {
    const response = await api.get('/api/dasha/periods');
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to get Dasha periods');
    }

    return response.data;

  } catch (error) {
    console.error('Dasha periods error:', error);
    throw error;
  }
};

/**
 * Health check for backend API
 * @returns {Promise<boolean>} True if backend is healthy
 */
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data?.status === 'healthy';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export default api;
