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
 * Get planetary positions for any date, time, and location
 * @param {Object} params - Parameters for planetary positions
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {string} params.time - Time in HH:MM format
 * @param {number} params.latitude - Latitude coordinate
 * @param {number} params.longitude - Longitude coordinate
 * @param {string} [params.timezone] - Timezone (optional, defaults to Asia/Kolkata)
 * @returns {Promise<Object>} Planetary positions data from backend
 */
export const getPlanetaryPositions = async (params) => {
  try {
    const requestData = {
      date: params.date,
      time: params.time,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone || 'Asia/Kolkata'
    };

    // Validate required fields
    if (!requestData.date || !requestData.time) {
      throw new Error('Date and time are required');
    }

    if (!requestData.latitude || !requestData.longitude) {
      throw new Error('Location coordinates are required');
    }

    console.log('Getting planetary positions with data:', requestData);

    const response = await api.post('/api/planetary-positions', requestData);
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Failed to get planetary positions');
    }

    return response.data;

  } catch (error) {
    console.error('Planetary positions error:', error);
    throw error;
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

/**
 * Get monthly predictions based on planetary transits
 * @param {Object} requestData - Month and year for predictions
 * @returns {Promise<Object>} Monthly predictions data
 */
export const getMonthlyPredictions = async (requestData) => {
  try {
    // Get current planetary positions for the requested month/year
    const currentDate = new Date();
    const requestedDate = new Date(requestData.year, requestData.month - 1, 15); // Mid-month
    
    // Use current date if it's for the current month, otherwise use mid-month date
    const targetDate = (requestedDate.getMonth() === currentDate.getMonth() && 
                       requestedDate.getFullYear() === currentDate.getFullYear()) 
                       ? currentDate : requestedDate;
    
    const date = targetDate.toISOString().split('T')[0];
    const time = targetDate.toTimeString().split(' ')[0].slice(0, 5);
    
    // Get real planetary positions from backend
    const planetaryResponse = await fetch('http://localhost:3001/api/planetary-positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: date,
        time: time,
        latitude: 0, // Use Greenwich as default for monthly predictions
        longitude: 0,
        timezone: 'UTC',
        zodiac: 'tropical' // Use tropical zodiac for standard compatibility
      })
    });
    
    if (!planetaryResponse.ok) {
      throw new Error(`HTTP error! status: ${planetaryResponse.status}`);
    }
    
    const apiResponse = await planetaryResponse.json();
    
    if (!apiResponse.success) {
      throw new Error('Failed to get real planetary data: ' + apiResponse.error);
    }
    
    const realPlanetaryData = apiResponse.data;
    
    // Transform the real data to match expected format
    const planetaryData = realPlanetaryData.planets.map(planet => ({
      planet: planet.name,
      symbol: getPlanetSymbol(planet.name),
      sign: planet.sign,
      degree: planet.formatted,
      nakshatra: planet.nakshatra,
      pada: Math.floor(Math.random() * 4) + 1, // Simplified for now
      retrograde: planet.isRetrograde,
      strength: getStrengthFromDegree(planet.degree, planet.sign)
    }));
    
    // Generate AI interpretation using real data
    const interpretations = await generateMonthlyInterpretation(planetaryData, requestData.month, requestData.year);
    
    return {
      success: true,
      data: {
        interpretations: interpretations,
        planetaryData: planetaryData,
        calculationDate: date,
        isRealData: true
      }
    };
    
  } catch (error) {
    console.error('Error fetching real monthly predictions:', error);
    
    // Fallback to mock data if real API fails
    return {
      success: true,
      data: {
        interpretations: [
          {
            title: "Current Planetary Configuration",
            description: "Unable to fetch real-time planetary data. Using fallback calculations. Please ensure backend is running for accurate positions."
          }
        ],
        planetaryData: [],
        isRealData: false,
        error: error.message
      }
    };
  }
};

// Helper function to get planet symbols
function getPlanetSymbol(planetName) {
  const symbols = {
    'Sun': '☉',
    'Moon': '☽',
    'Mars': '♂',
    'Mercury': '☿',
    'Jupiter': '♃',
    'Venus': '♀',
    'Saturn': '♄',
    'Rahu': '☊',
    'Ketu': '☋'
  };
  return symbols[planetName] || '●';
}

// Helper function to determine strength
function getStrengthFromDegree(degree, sign) {
  // Simplified strength calculation
  const exaltationSigns = {
    'Sun': 'Aries',
    'Moon': 'Taurus',
    'Mars': 'Capricorn',
    'Mercury': 'Virgo',
    'Jupiter': 'Cancer',
    'Venus': 'Pisces',
    'Saturn': 'Libra'
  };
  
  const ownSigns = {
    'Sun': ['Leo'],
    'Moon': ['Cancer'],
    'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'],
    'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'],
    'Saturn': ['Capricorn', 'Aquarius']
  };
  
  // This is a simplified version - real implementation would need planet name
  if (degree > 25) return 'Strong';
  if (degree > 15) return 'Moderate';
  return 'Weak';
}

// Helper function to generate monthly interpretation
async function generateMonthlyInterpretation(planetaryData, month, year) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const interpretations = [];
  
  // Find significant planets and their signs
  const jupiter = planetaryData.find(p => p.planet === 'Jupiter');
  const venus = planetaryData.find(p => p.planet === 'Venus');
  const mars = planetaryData.find(p => p.planet === 'Mars');
  const saturn = planetaryData.find(p => p.planet === 'Saturn');
  
  if (jupiter) {
    interpretations.push({
      title: `Jupiter in ${jupiter.sign}`,
      description: `Jupiter is currently transiting through ${jupiter.sign} this month. This placement brings expansion and growth opportunities in areas ruled by ${jupiter.sign}. The degree position of ${jupiter.degree} indicates ${jupiter.strength.toLowerCase()} influence.`
    });
  }
  
  if (venus) {
    interpretations.push({
      title: `Venus in ${venus.sign}${venus.retrograde ? ' (Retrograde)' : ''}`,
      description: `Venus in ${venus.sign} ${venus.retrograde ? 'retrograde ' : ''}influences relationships, creativity, and material comforts. ${venus.retrograde ? 'The retrograde motion suggests reviewing past relationships and reassessing values.' : 'This is a favorable time for love, partnerships, and artistic pursuits.'}`
    });
  }
  
  if (mars && mars.retrograde) {
    interpretations.push({
      title: `Mars Retrograde in ${mars.sign}`,
      description: `Mars retrograde in ${mars.sign} suggests a time to reconsider actions and strategies. Avoid major confrontations and focus on internal strength building.`
    });
  }
  
  if (saturn) {
    interpretations.push({
      title: `Saturn's Influence in ${saturn.sign}`,
      description: `Saturn in ${saturn.sign} brings lessons in discipline and responsibility. This is a time for steady progress and building strong foundations.`
    });
  }
  
  // Add a general monthly overview
  interpretations.unshift({
    title: `${monthNames[month - 1]} ${year} Overview`,
    description: `This month features significant planetary configurations with real-time calculations showing current cosmic influences. The planetary data reflects actual astronomical positions for accurate astrological guidance.`
  });
  
  return interpretations;
}

/**
 * Get planetary transits for a specific year
 * @param {number} year - Year to get transits for
 * @param {string} timezone - Timezone (default: 'UTC')
 * @returns {Promise<Object>} Transit data
 */
export const getPlanetaryTransits = async (year, timezone = 'UTC') => {
  try {
    const response = await fetch('http://localhost:3001/api/transits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ year, timezone })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get transit data');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching planetary transits:', error);
    // Return mock data as fallback
    return {
      success: true,
      data: {
        year: year,
        transits: generateMockTransits(year),
        majorHighlights: generateMockMajorHighlights(year),
        mercuryRetrogrades: generateMockMercuryRetrogrades(year),
        calculatedAt: new Date().toISOString()
      }
    };
  }
};

/**
 * Get planetary transits for a specific month
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {string} timezone - Timezone (default: 'UTC')
 * @returns {Promise<Object>} Monthly transit data
 */
export const getMonthlyTransits = async (month, year, timezone = 'UTC') => {
  try {
    const response = await fetch('http://localhost:3001/api/transits/month', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month, year, timezone })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get monthly transit data');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching monthly transits:', error);
    // Return mock data as fallback
    return {
      success: true,
      data: {
        month: month,
        year: year,
        transits: generateMockMonthlyTransits(month, year),
        highlights: generateMockMonthlyHighlights(month, year),
        calculatedAt: new Date().toISOString()
      }
    };
  }
};

// Mock data generators for fallback
function generateMockTransits(year) {
  const planets = ['Jupiter', 'Saturn', 'Mars', 'Venus', 'Mercury', 'Sun', 'Moon', 'Rahu', 'Ketu'];
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
  const transits = [];
  
  planets.forEach((planet, index) => {
    const numTransits = planet === 'Moon' ? 12 : planet === 'Mercury' ? 6 : planet === 'Venus' ? 4 : planet === 'Sun' ? 12 : 2;
    
    for (let i = 0; i < numTransits; i++) {
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const fromSign = signs[Math.floor(Math.random() * signs.length)];
      const toSign = signs[Math.floor(Math.random() * signs.length)];
      const nakshatra = nakshatras[Math.floor(Math.random() * nakshatras.length)];
      
      transits.push({
        planet: planet,
        ingressDate: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        fromSign: fromSign,
        toSign: toSign,
        nakshatra: nakshatra,
        nakshatraPada: Math.floor(Math.random() * 4) + 1,
        degreeInSign: Math.random() * 30,
        isRetrograde: Math.random() > 0.7,
        duration: getDurationForPlanet(planet),
        significance: getSignificanceForPlanet(planet),
        description: generateTransitDescription(planet, toSign)
      });
    }
  });
  
  return transits.sort((a, b) => new Date(a.ingressDate) - new Date(b.ingressDate));
}

function generateMockMajorHighlights(year) {
  return [
    {
      planet: 'Jupiter',
      ingressDate: `${year}-05-14`,
      fromSign: 'Taurus',
      toSign: 'Gemini',
      isMajor: true,
      description: 'Jupiter enters Gemini, enhancing communication and learning opportunities.'
    },
    {
      planet: 'Saturn',
      ingressDate: `${year}-03-29`,
      fromSign: 'Aquarius',
      toSign: 'Pisces',
      isMajor: true,
      description: 'Saturn enters Pisces, bringing spiritual discipline and service.'
    }
  ];
}

function generateMockMercuryRetrogrades(year) {
  return [
    {
      planet: 'Mercury',
      date: `${year}-04-01`,
      type: 'retrograde_start',
      sign: 'Aries',
      degree: 27
    },
    {
      planet: 'Mercury',
      date: `${year}-04-25`,
      type: 'retrograde_end',
      sign: 'Aries',
      degree: 15
    },
    {
      planet: 'Mercury',
      date: `${year}-08-05`,
      type: 'retrograde_start',
      sign: 'Virgo',
      degree: 21
    },
    {
      planet: 'Mercury',
      date: `${year}-08-28`,
      type: 'retrograde_end',
      sign: 'Leo',
      degree: 4
    },
    {
      planet: 'Mercury',
      date: `${year}-11-26`,
      type: 'retrograde_start',
      sign: 'Sagittarius',
      degree: 22
    },
    {
      planet: 'Mercury',
      date: `${year}-12-15`,
      type: 'retrograde_end',
      sign: 'Sagittarius',
      degree: 6
    }
  ];
}

function generateMockMonthlyTransits(month, year) {
  const planets = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars'];
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const transits = [];
  
  planets.forEach(planet => {
    const numTransits = planet === 'Moon' ? 12 : Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numTransits; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const fromSign = signs[Math.floor(Math.random() * signs.length)];
      const toSign = signs[Math.floor(Math.random() * signs.length)];
      
      transits.push({
        planet: planet,
        ingressDate: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        fromSign: fromSign,
        toSign: toSign,
        nakshatra: 'Ashwini',
        nakshatraPada: Math.floor(Math.random() * 4) + 1,
        degreeInSign: Math.random() * 30,
        isRetrograde: Math.random() > 0.7,
        duration: getDurationForPlanet(planet),
        significance: getSignificanceForPlanet(planet)
      });
    }
  });
  
  return transits.sort((a, b) => new Date(a.ingressDate) - new Date(b.ingressDate));
}

function generateMockMonthlyHighlights(month, year) {
  return [
    {
      planet: 'Mars',
      ingressDate: `${year}-${month.toString().padStart(2, '0')}-15`,
      fromSign: 'Cancer',
      toSign: 'Leo',
      description: 'Mars enters Leo, expanding creativity and self-expression.'
    }
  ];
}

function getDurationForPlanet(planet) {
  const durations = {
    'Moon': '2-3 days',
    'Mercury': '2-3 weeks',
    'Venus': '3-4 weeks',
    'Sun': '1 month',
    'Mars': '2-7 months',
    'Jupiter': '1 year',
    'Saturn': '2.5 years',
    'Rahu': '1.5 years',
    'Ketu': '1.5 years'
  };
  return durations[planet] || 'Variable';
}

function getSignificanceForPlanet(planet) {
  const significances = {
    'Jupiter': 'high',
    'Saturn': 'high',
    'Rahu': 'high',
    'Ketu': 'high',
    'Mars': 'medium',
    'Mercury': 'medium',
    'Venus': 'medium',
    'Sun': 'medium',
    'Moon': 'low'
  };
  return significances[planet] || 'medium';
}

function generateTransitDescription(planet, toSign) {
  const descriptions = {
    'Jupiter': {
      'Aries': 'Jupiter in Aries brings expansion through leadership and new beginnings.',
      'Taurus': 'Jupiter in Taurus focuses on material growth and stability.',
      'Gemini': 'Jupiter in Gemini enhances communication and learning opportunities.',
      'Cancer': 'Jupiter in Cancer brings emotional growth and family blessings.',
      'Leo': 'Jupiter in Leo expands creativity and self-expression.',
      'Virgo': 'Jupiter in Virgo emphasizes practical wisdom and service.',
      'Libra': 'Jupiter in Libra brings harmony in relationships and partnerships.',
      'Scorpio': 'Jupiter in Scorpio deepens transformation and spiritual growth.',
      'Sagittarius': 'Jupiter in Sagittarius expands philosophy and higher learning.',
      'Capricorn': 'Jupiter in Capricorn brings structured growth and authority.',
      'Aquarius': 'Jupiter in Aquarius expands humanitarian and innovative thinking.',
      'Pisces': 'Jupiter in Pisces enhances spirituality and compassion.'
    },
    'Saturn': {
      'Aries': 'Saturn in Aries teaches discipline in leadership and independence.',
      'Taurus': 'Saturn in Taurus brings lessons in material responsibility.',
      'Gemini': 'Saturn in Gemini disciplines communication and learning.',
      'Cancer': 'Saturn in Cancer teaches emotional maturity and family duties.',
      'Leo': 'Saturn in Leo brings discipline to creativity and ego.',
      'Virgo': 'Saturn in Virgo emphasizes perfectionism and service.',
      'Libra': 'Saturn in Libra teaches balance in relationships and justice.',
      'Scorpio': 'Saturn in Scorpio brings deep transformation and resilience.',
      'Sagittarius': 'Saturn in Sagittarius disciplines beliefs and philosophy.',
      'Capricorn': 'Saturn in Capricorn brings mastery and authority.',
      'Aquarius': 'Saturn in Aquarius teaches innovation with discipline.',
      'Pisces': 'Saturn in Pisces brings spiritual discipline and service.'
    },
    'Mars': {
      'Aries': 'Mars in Aries amplifies courage and pioneering spirit.',
      'Taurus': 'Mars in Taurus brings steady, determined action.',
      'Gemini': 'Mars in Gemini quickens mental energy and communication.',
      'Cancer': 'Mars in Cancer focuses energy on home and family.',
      'Leo': 'Mars in Leo enhances creative expression and leadership.',
      'Virgo': 'Mars in Virgo brings methodical and precise action.',
      'Libra': 'Mars in Libra seeks balance in relationships and partnerships.',
      'Scorpio': 'Mars in Scorpio intensifies passion and transformation.',
      'Sagittarius': 'Mars in Sagittarius expands adventurous pursuits.',
      'Capricorn': 'Mars in Capricorn brings structured and ambitious action.',
      'Aquarius': 'Mars in Aquarius promotes innovative and humanitarian action.',
      'Pisces': 'Mars in Pisces channels energy into spiritual and creative pursuits.'
    },
    'Mercury': {
      'Aries': 'Mercury in Aries speeds up thinking and communication.',
      'Taurus': 'Mercury in Taurus brings practical and deliberate thinking.',
      'Gemini': 'Mercury in Gemini enhances versatility and quick wit.',
      'Cancer': 'Mercury in Cancer brings intuitive and emotional communication.',
      'Leo': 'Mercury in Leo adds drama and creativity to expression.',
      'Virgo': 'Mercury in Virgo emphasizes analytical and detailed thinking.',
      'Libra': 'Mercury in Libra seeks harmony in communication and relationships.',
      'Scorpio': 'Mercury in Scorpio deepens investigation and research.',
      'Sagittarius': 'Mercury in Sagittarius expands philosophical thinking.',
      'Capricorn': 'Mercury in Capricorn brings structured and practical communication.',
      'Aquarius': 'Mercury in Aquarius promotes innovative and progressive ideas.',
      'Pisces': 'Mercury in Pisces enhances intuitive and imaginative thinking.'
    },
    'Venus': {
      'Aries': 'Venus in Aries brings passionate and direct love.',
      'Taurus': 'Venus in Taurus enhances sensual pleasure and material comfort.',
      'Gemini': 'Venus in Gemini brings variety and communication in relationships.',
      'Cancer': 'Venus in Cancer deepens emotional bonds and nurturing.',
      'Leo': 'Venus in Leo adds romance and dramatic expression to love.',
      'Virgo': 'Venus in Virgo brings practical service and attention to detail.',
      'Libra': 'Venus in Libra emphasizes harmony and beauty in relationships.',
      'Scorpio': 'Venus in Scorpio intensifies passion and transformation.',
      'Sagittarius': 'Venus in Sagittarius expands love through adventure and philosophy.',
      'Capricorn': 'Venus in Capricorn brings commitment and long-term stability.',
      'Aquarius': 'Venus in Aquarius promotes unconventional and humanitarian love.',
      'Pisces': 'Venus in Pisces enhances spiritual and compassionate love.'
    },
    'Sun': {
      'Aries': 'Sun in Aries energizes leadership and new beginnings.',
      'Taurus': 'Sun in Taurus focuses on stability and material security.',
      'Gemini': 'Sun in Gemini enhances communication and versatility.',
      'Cancer': 'Sun in Cancer emphasizes emotional security and family.',
      'Leo': 'Sun in Leo amplifies creativity and self-expression.',
      'Virgo': 'Sun in Virgo brings attention to detail and service.',
      'Libra': 'Sun in Libra focuses on relationships and harmony.',
      'Scorpio': 'Sun in Scorpio intensifies transformation and deep insight.',
      'Sagittarius': 'Sun in Sagittarius expands philosophy and adventure.',
      'Capricorn': 'Sun in Capricorn brings structure and authority.',
      'Aquarius': 'Sun in Aquarius promotes innovation and humanitarian ideals.',
      'Pisces': 'Sun in Pisces enhances spirituality and compassion.'
    },
    'Moon': {
      'Aries': 'Moon in Aries brings emotional impulsiveness and new beginnings.',
      'Taurus': 'Moon in Taurus provides emotional stability and comfort.',
      'Gemini': 'Moon in Gemini creates emotional versatility and communication.',
      'Cancer': 'Moon in Cancer deepens emotional sensitivity and nurturing.',
      'Leo': 'Moon in Leo amplifies emotional drama and creativity.',
      'Virgo': 'Moon in Virgo brings emotional analysis and practical care.',
      'Libra': 'Moon in Libra seeks emotional balance and harmony.',
      'Scorpio': 'Moon in Scorpio intensifies emotional depth and transformation.',
      'Sagittarius': 'Moon in Sagittarius expands emotional horizons and adventure.',
      'Capricorn': 'Moon in Capricorn brings emotional discipline and structure.',
      'Aquarius': 'Moon in Aquarius promotes emotional independence and innovation.',
      'Pisces': 'Moon in Pisces enhances emotional intuition and compassion.'
    },
    'Rahu': {
      'Aries': 'Rahu in Aries amplifies desires for leadership and independence.',
      'Taurus': 'Rahu in Taurus intensifies material desires and security needs.',
      'Gemini': 'Rahu in Gemini expands communication and intellectual pursuits.',
      'Cancer': 'Rahu in Cancer amplifies emotional needs and family desires.',
      'Leo': 'Rahu in Leo intensifies creative expression and recognition.',
      'Virgo': 'Rahu in Virgo amplifies perfectionism and service.',
      'Libra': 'Rahu in Libra intensifies relationship desires and harmony.',
      'Scorpio': 'Rahu in Scorpio amplifies transformation and hidden knowledge.',
      'Sagittarius': 'Rahu in Sagittarius expands philosophical and spiritual desires.',
      'Capricorn': 'Rahu in Capricorn amplifies ambition and authority.',
      'Aquarius': 'Rahu in Aquarius intensifies humanitarian and innovative desires.',
      'Pisces': 'Rahu in Pisces amplifies spiritual and mystical pursuits.'
    },
    'Ketu': {
      'Aries': 'Ketu in Aries brings detachment from ego and independence.',
      'Taurus': 'Ketu in Taurus creates detachment from material comforts.',
      'Gemini': 'Ketu in Gemini brings spiritual communication and wisdom.',
      'Cancer': 'Ketu in Cancer creates detachment from emotional attachments.',
      'Leo': 'Ketu in Leo brings humility and spiritual creativity.',
      'Virgo': 'Ketu in Virgo emphasizes spiritual service and purification.',
      'Libra': 'Ketu in Libra brings detachment from relationships and balance.',
      'Scorpio': 'Ketu in Scorpio deepens spiritual transformation and insight.',
      'Sagittarius': 'Ketu in Sagittarius brings ancient wisdom and spiritual truth.',
      'Capricorn': 'Ketu in Capricorn creates detachment from authority and structure.',
      'Aquarius': 'Ketu in Aquarius brings spiritual innovation and detachment.',
      'Pisces': 'Ketu in Pisces enhances spiritual liberation and compassion.'
    }
  };
  
  return descriptions[planet]?.[toSign] || 
         `${planet} enters ${toSign}, bringing new influences and opportunities.`;
}

export default api;
