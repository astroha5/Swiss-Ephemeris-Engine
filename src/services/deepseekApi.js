import axios from 'axios';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Create axios instance with OpenRouter configuration
const deepseekApi = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window?.location?.origin || 'https://astrova.app',
    'X-Title': 'Astrova - AI Vedic Astrology',
  },
  timeout: 120000, // 2 minutes timeout for image processing
});

// Request interceptor for logging
deepseekApi.interceptors.request.use(
  (config) => {
    console.log('OpenRouter API Request:', {
      url: config.url,
      method: config.method,
      timestamp: new Date().toISOString()
    });
    return config;
  },
  (error) => {
    console.error('OpenRouter API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
deepseekApi.interceptors.response.use(
  (response) => {
    console.log('OpenRouter API Response:', {
      status: response.status,
      url: response.config.url,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    console.error('OpenRouter API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message,
      url: error.config?.url,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your OpenRouter API configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 402) {
      throw new Error('Insufficient credits. Please check your OpenRouter account balance.');
    } else if (error.response?.status >= 500) {
      throw new Error('OpenRouter API service is temporarily unavailable. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Analyze kundli image using DeepSeek VL R1 0528 model via OpenRouter
export const analyzeKundliImage = async (imageData, options = {}) => {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key is not configured. Please add VITE_DEEPSEEK_API_KEY to your environment variables.');
    }

    // Ensure image data is properly formatted for OpenRouter
    const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;

    const payload = {
      model: 'deepseek/deepseek-r1',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert Vedic astrologer with deep knowledge of traditional Indian astrology charts. 
              
              Analyze this Vedic astrology birth chart (kundli) image and extract the following information in a structured JSON format:

              1. **Chart Identification**:
                 - Chart Type (D1/Lagna, D9/Navamsa, or other divisional chart)
                 - Chart Style (North Indian, South Indian, or East Indian)
                 - Overall chart quality and readability

              2. **Planetary Positions**:
                 - Extract positions of all 9 planets: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu
                 - Include house numbers (1-12) for each planet
                 - Include degrees if visible and readable
                 - Note any planetary conjunctions

              3. **Ascendant & Houses**:
                 - Identify the Lagna (Ascendant) sign and house
                 - Note the house system being used
                 - Identify any special house placements

              4. **Astrological Features**:
                 - Identify any visible yogas (Raja Yoga, Dhana Yoga, etc.)
                 - Note significant planetary aspects
                 - Identify any doshas (Mangal Dosha, Kaal Sarp Dosha, etc.)

              5. **Text & Symbols**:
                 - Extract any visible text, numbers, or Sanskrit symbols
                 - Note any additional information provided in the chart

              Please respond with a detailed JSON object containing all extracted information. Be precise and only include information that is clearly visible in the chart. If something is unclear or not visible, mark it as "not_visible" or "unclear".`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1,
      stream: false,
      ...options
    };

    const response = await deepseekApi.post('/chat/completions', payload);
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    return {
      success: true,
      analysis: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter'
    };

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze kundli image',
      timestamp: new Date().toISOString()
    };
  }
};

// Generate astrological interpretation based on chart data
export const generateAstrologicalInterpretation = async (chartData, options = {}) => {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key is not configured. Please add VITE_DEEPSEEK_API_KEY to your environment variables.');
    }

    const payload = {
      model: 'deepseek/deepseek-r1',
      messages: [
        {
          role: 'system',
          content: `You are a highly knowledgeable Vedic astrologer with decades of experience in traditional Indian astrology (Jyotish Shastra). 
          
          Your expertise includes:
          - Classical Sanskrit texts like Brihat Parashara Hora Shastra, Saravali, and Phaladeepika
          - Traditional calculation methods and house systems
          - Planetary periods (Vimshottari Dasha) and their effects
          - Yogas, doshas, and remedial measures
          - Practical guidance rooted in traditional wisdom
          
          Provide comprehensive, accurate, and insightful interpretations while maintaining respect for traditional astrological principles. 
          Always offer constructive guidance and avoid overly negative predictions.`
        },
        {
          role: 'user',
          content: `Based on the following birth chart analysis, provide a detailed Vedic astrological interpretation:

          **Chart Analysis Data:**
          ${JSON.stringify(chartData, null, 2)}

          Please provide interpretations in the following structured format as a JSON object:

          {
            "overall_personality": {
              "title": "Personality & Life Path",
              "content": "Detailed personality analysis based on ascendant and planetary positions",
              "key_traits": ["trait1", "trait2", "trait3"],
              "life_themes": ["theme1", "theme2"]
            },
            "career_profession": {
              "title": "Career & Professional Life",
              "content": "Career prospects and professional inclinations",
              "suitable_fields": ["field1", "field2"],
              "timing": "Career growth periods and challenges"
            },
            "relationships_marriage": {
              "title": "Relationships & Marriage",
              "content": "Relationship patterns and marriage prospects",
              "compatibility_factors": ["factor1", "factor2"],
              "marriage_timing": "Favorable marriage periods"
            },
            "health_wellness": {
              "title": "Health & Wellness",
              "content": "Health indications and wellness recommendations",
              "health_strengths": ["strength1", "strength2"],
              "areas_to_watch": ["area1", "area2"],
              "remedial_measures": ["measure1", "measure2"]
            },
            "wealth_finance": {
              "title": "Wealth & Financial Prospects",
              "content": "Financial prospects and wealth accumulation potential",
              "income_sources": ["source1", "source2"],
              "investment_guidance": "Investment timing and strategies",
              "wealth_periods": "Periods of financial growth"
            },
            "spirituality_growth": {
              "title": "Spirituality & Personal Growth",
              "content": "Spiritual inclinations and growth opportunities",
              "spiritual_practices": ["practice1", "practice2"],
              "growth_areas": ["area1", "area2"],
              "moksha_path": "Path to spiritual liberation"
            },
            "dasha_analysis": {
              "title": "Current Planetary Periods (Dasha)",
              "content": "Analysis of current and upcoming planetary periods",
              "current_period": "Current dasha effects",
              "upcoming_changes": "What to expect in future periods",
              "remedial_actions": ["action1", "action2"]
            },
            "remedial_measures": {
              "title": "Remedial Measures & Recommendations",
              "content": "Traditional remedies and suggestions for improvement",
              "gemstones": ["gemstone1", "gemstone2"],
              "mantras": ["mantra1", "mantra2"],
              "donations": ["donation1", "donation2"],
              "fasting": "Recommended fasting days",
              "deity_worship": "Recommended deities for worship"
            }
          }

          Ensure all interpretations are based on traditional Vedic astrology principles and provide practical, constructive guidance.`
        }
      ],
      max_tokens: 6000,
      temperature: 0.3,
      stream: false,
      ...options
    };

    const response = await deepseekApi.post('/chat/completions', payload);
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    return {
      success: true,
      interpretation: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter'
    };

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate astrological interpretation',
      timestamp: new Date().toISOString()
    };
  }
};

// Validate API key with OpenRouter
export const validateApiKey = async () => {
  try {
    if (!DEEPSEEK_API_KEY) {
      return {
        valid: false,
        error: 'API key not configured'
      };
    }

    // Test the API key with a simple request
    const response = await deepseekApi.get('/models');
    
    return {
      valid: true,
      models: response.data?.data || [],
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter'
    };

  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Failed to validate API key',
      timestamp: new Date().toISOString()
    };
  }
};

// Get API usage statistics from OpenRouter
export const getApiUsage = async () => {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('API key not configured');
    }

    // OpenRouter provides usage info in response headers
    const response = await deepseekApi.get('/models');
    
    return {
      success: true,
      usage: {
        credits_used: response.headers['x-ratelimit-remaining-requests'] || 'unknown',
        credits_remaining: response.headers['x-ratelimit-limit-requests'] || 'unknown',
        reset_time: response.headers['x-ratelimit-reset-requests'] || 'unknown'
      },
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter'
    };

  } catch (error) {
    console.error('Failed to get API usage:', error);
    return {
      success: false,
      error: error.message || 'Failed to get API usage',
      timestamp: new Date().toISOString()
    };
  }
};

// Generate birth chart data from manual input
export const generateBirthChart = async (birthDetails, options = {}) => {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key is not configured.');
    }

    const { name, dateOfBirth, timeOfBirth, placeOfBirth } = birthDetails;

    const payload = {
      model: 'deepseek/deepseek-r1',
      messages: [
        {
          role: 'system',
          content: `You are an expert Vedic astrologer with comprehensive knowledge of:
          - Astronomical calculations for planetary positions
          - Ayanamsa calculations (Lahiri Ayanamsa preferred)
          - Traditional Vedic house systems
          - Vimshottari Dasha calculations
          - Chart construction principles
          
          Calculate birth chart details accurately based on the provided birth information.`
        },
        {
          role: 'user',
          content: `Calculate a comprehensive Vedic birth chart (Janma Kundli) for the following birth details:

          **Birth Information:**
          - Name: ${name}
          - Date of Birth: ${dateOfBirth}
          - Time of Birth: ${timeOfBirth}
          - Place of Birth: ${placeOfBirth}

          Please provide the calculations in the following JSON format:

          {
            "birth_details": {
              "name": "${name}",
              "date_of_birth": "${dateOfBirth}",
              "time_of_birth": "${timeOfBirth}",
              "place_of_birth": "${placeOfBirth}",
              "coordinates": "latitude, longitude (if determinable)",
              "timezone": "local timezone"
            },
            "lagna_chart": {
              "ascendant": {
                "sign": "ascendant sign",
                "degree": "degree and minutes",
                "house": 1
              },
              "planetary_positions": {
                "Sun": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Moon": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Mars": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Mercury": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Jupiter": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Venus": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Saturn": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Rahu": {"sign": "sign", "degree": "degree", "house": "house_number"},
                "Ketu": {"sign": "sign", "degree": "degree", "house": "house_number"}
              }
            },
            "navamsa_chart": {
              "planetary_positions": {
                "Sun": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Moon": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Mars": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Mercury": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Jupiter": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Venus": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Saturn": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Rahu": {"sign": "navamsa_sign", "house": "navamsa_house"},
                "Ketu": {"sign": "navamsa_sign", "house": "navamsa_house"}
              }
            },
            "vimshottari_dasha": {
              "current_mahadasha": {
                "planet": "current ruling planet",
                "start_date": "start date",
                "end_date": "end date",
                "remaining_years": "years remaining"
              },
              "current_antardasha": {
                "planet": "current sub-period planet",
                "start_date": "start date",
                "end_date": "end date"
              },
              "dasha_sequence": [
                {"planet": "planet1", "duration": "duration in years", "start_date": "date", "end_date": "date"},
                {"planet": "planet2", "duration": "duration in years", "start_date": "date", "end_date": "date"}
              ]
            },
            "special_yogas": [
              {"name": "yoga name", "description": "brief description", "effects": "positive/negative effects"}
            ],
            "calculation_notes": "Any important notes about the calculations or assumptions made"
          }

          Provide accurate calculations based on standard Vedic astrology principles using Lahiri Ayanamsa.`
        }
      ],
      max_tokens: 5000,
      temperature: 0.1,
      stream: false,
      ...options
    };

    const response = await deepseekApi.post('/chat/completions', payload);
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    return {
      success: true,
      chartData: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter'
    };

  } catch (error) {
    console.error('Chart generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate birth chart',
      timestamp: new Date().toISOString()
    };
  }
};

export default deepseekApi;