// Browser-compatible cache using localStorage
const CACHE_PREFIX = 'astrova_interpretation_';
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Generate cache key from chart data
export const generateCacheKey = (chartData, birthDetails) => {
  const keyData = {
    ascendant: chartData?.charts?.lagna?.ascendant || 'unknown',
    planets: chartData?.charts?.lagna?.houses?.map(h => ({ sign: h.sign, planets: h.planets })) || [],
    birthDate: birthDetails?.dateOfBirth || '',
    birthTime: birthDetails?.timeOfBirth || '',
    location: birthDetails?.placeOfBirth || ''
  };
  
  // Create a simple hash from the key data
  const keyString = JSON.stringify(keyData);
  const hash = btoa(keyString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  return `${CACHE_PREFIX}${hash}`;
};

export const getCachedInterpretation = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
};

export const setCachedInterpretation = (key, interpretation) => {
  try {
    const cacheData = {
      data: interpretation,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error writing to cache:', error);
  }
};

// Clear old cache entries
export const clearExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        getCachedInterpretation(key); // This will remove expired entries
      }
    });
  } catch (error) {
    console.warn('Error clearing expired cache:', error);
  }
};
