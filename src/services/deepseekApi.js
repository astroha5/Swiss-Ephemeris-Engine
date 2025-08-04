import axios from 'axios';

// Backend API configuration
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Cloud AI configuration (ready for OpenRouter integration)
const CLOUD_AI_CONFIG = {
  model: 'anthropic/claude-3-haiku',
  provider: 'openrouter',
  maxTokens: 4000,
  temperature: 0.4
};

// Create axios instance for backend API
const backendApi = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes timeout for AI processing to match backend
});

// Helper function to call backend AI service
const callBackendAI = async (prompt, options = {}) => {
  try {
    console.log('Backend AI service call initiated');
    
    const response = await backendApi.post('/api/ai/chat', {
      prompt,
      model: options.model || CLOUD_AI_CONFIG.model,
      temperature: options.temperature || CLOUD_AI_CONFIG.temperature,
      maxTokens: options.maxTokens || CLOUD_AI_CONFIG.maxTokens
    });
    
    if (response.data && response.data.response) {
      console.log('Successfully received response from backend AI');
      return response.data.response;
    }
    
    throw new Error('Empty response from backend AI service');
  } catch (error) {
    console.error('Backend AI call failed:', error);
    throw new Error(`Backend AI service error: ${error.message}`);
  }
};

// Request interceptor for logging
backendApi.interceptors.request.use(
  (config) => {
    console.log('Backend AI API Request:', {
      url: config.url,
      method: config.method,
      timestamp: new Date().toISOString()
    });
    return config;
  },
  (error) => {
    console.error('Backend AI API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
backendApi.interceptors.response.use(
  (response) => {
    console.log('Backend AI API Response:', {
      status: response.status,
      url: response.config.url,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    console.error('Backend AI API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      url: error.config?.url,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      throw new Error('AI service endpoint not found. Please check backend configuration.');
    } else if (error.response?.status >= 500) {
      throw new Error('Backend AI service is temporarily unavailable. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Note: Image analysis is not supported by local Ollama integration
export const analyzeKundliImage = async (imageData, options = {}) => {
  return {
    success: false,
    error: 'Image analysis is not supported with the current local AI integration. Please use manual chart data entry instead.',
    timestamp: new Date().toISOString()
  };};

// Generate astrological interpretation based on chart data
// Updated model sequence - removed problematic model and reordered
const chartInterpretationModels = ["shisa-ai/shisa-v2-llama3.3-70b:free", "deepseek/deepseek-r1-distill-llama-70b:free"];
const monthlyPredictionModels = ["meta-llama/llama-3.3-70b-instruct:free", "deepseek/deepseek-r1-distill-llama-70b:free"];

// Helper function to extract JSON from markdown-wrapped responses
const extractJsonFromResponse = (response) => {
  try {
    // First try to parse as-is
    return JSON.parse(response);
  } catch (error) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (parseError) {
        console.warn('Failed to parse JSON from markdown:', parseError);
      }
    }
    
    // Try to find JSON object in the response
    const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (parseError) {
        console.warn('Failed to parse extracted JSON object:', parseError);
      }
    }
    
    // If all else fails, return null
    return null;
  }
};

export const generateAstrologicalInterpretation = async (chartData, options = {}) => {
  try {
    // Create enhanced Vedic astrology prompt
    const prompt = `You are an expert Vedic astrologer with deep knowledge of traditional Jyotish principles. 

IMPORTANT: Your response must be ONLY valid JSON. Do not include any text before or after the JSON object. Do not use markdown formatting. Start your response directly with { and end with }.

Based on Vedic astrology using sidereal zodiac with Lahiri Ayanamsa, interpret the chart using:

- House lords and their placements
- Planetary dignity (own sign, exalted, debilitated)
- Aspects (drishti) from key planets
- Nakshatra of Moon and Ascendant
- Current Mahadasha and Antardasha effects
- Do not use generic or Western-style interpretations
- Mention any relevant yogas or doshas if present
- Focus on specific planetary lordships and their house placements
- Consider planetary strengths and weaknesses based on sign placement
- Analyze aspects between planets according to Vedic principles

**Chart Analysis Data:**
${JSON.stringify(chartData, null, 2)}

${chartData.focus === 'remedies' ? 
  `Provide remedial measures in JSON format only. No additional text or explanations. Return exactly this structure:
  
  {
    "gemstones": [
      {"name": "specific gemstone name", "planet": "ruling planet", "instruction": "how to wear and when"},
      {"name": "specific gemstone name", "planet": "ruling planet", "instruction": "how to wear and when"}
    ],
    "mantras": [
      {"name": "specific mantra name", "instruction": "how to chant and frequency"},
      {"name": "specific mantra name", "instruction": "how to chant and frequency"}
    ],
    "donations": [
      {"item": "specific items to donate", "instruction": "when and how to donate"},
      {"item": "specific items to donate", "instruction": "when and how to donate"}
    ],
    "fasting": [
      {"day": "specific day", "instruction": "purpose and benefits"},
      {"day": "specific day", "instruction": "purpose and benefits"}
    ]
  }
  
  Return only the JSON object, no markdown formatting.` :
  `Provide interpretations for 6 areas: Overview, Career, Health, Relationships, Wealth, Spirituality.

Return results in this exact JSON format:
{
  "overview": {
    "content": "Analysis based on Lagna lord placement, Moon nakshatra, and key planetary combinations. Mention specific house lordships and their effects.",
    "keyPoints": ["Specific Vedic insights based on planetary lordships", "Nakshatra influences", "Dasha effects"],
    "recommendations": ["Specific actions based on planetary positions", "Timing considerations based on current dasha"]
  },
  "career": {
    "content": "Analysis of 10th house, 10th lord placement, aspects to 10th house, and relevant yogas for profession.",
    "keyPoints": ["10th lord analysis", "Planetary influences on career", "Professional strengths"],
    "recommendations": ["Career directions based on planetary positions", "Timing for career moves"]
  },
  "relationships": {
    "content": "Analysis of 7th house, 7th lord, Venus placement, and marriage/partnership indicators.",
    "keyPoints": ["7th lord placement effects", "Venus analysis", "Partnership compatibility factors"],
    "recommendations": ["Relationship guidance based on planetary positions", "Timing for partnerships"]
  },
  "health": {
    "content": "Analysis of 6th house, 6th lord, Ascendant strength, and planetary influences on health.",
    "keyPoints": ["Health indicators from planetary positions", "Areas of strength/weakness", "Preventive measures"],
    "recommendations": ["Health practices based on chart analysis", "Preventive care timing"]
  },
  "wealth": {
    "content": "Analysis of 2nd house, 11th house, their lords, and dhana yogas for wealth accumulation.",
    "keyPoints": ["Wealth-generating combinations", "Income sources indicated", "Financial stability factors"],
    "recommendations": ["Financial strategies based on planetary positions", "Investment timing"]
  },
  "spirituality": {
    "content": "Analysis of 9th house, 12th house, Jupiter placement, and spiritual indicators in the chart.",
    "keyPoints": ["Spiritual inclinations shown", "Dharmic path indicators", "Moksha karaka influences"],
    "recommendations": ["Spiritual practices suited to chart", "Growth opportunities"]
  }
}

Each section must include content, keyPoints, and recommendations based on actual Vedic principles.`
}`;

    const rawContent = await callBackendAI(prompt);
    
    // Always try to extract JSON from the response
    let processedContent = rawContent;
    const extractedJson = extractJsonFromResponse(rawContent);
    if (extractedJson) {
      processedContent = JSON.stringify(extractedJson);
    } else {
      // If JSON extraction fails, try to clean up the response
      processedContent = rawContent.replace(/^.*?\{/, '{').replace(/\}[^}]*$/, '}');
    }
    
    return {
      success: true,
      interpretation: processedContent,
      model: CLOUD_AI_CONFIG.model,
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter (Cloud) - Pending Configuration'
    };

  } catch (error) {
    console.error('Backend AI Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate astrological interpretation',
      timestamp: new Date().toISOString()
    };
  }
};

// Validate API connectivity with backend AI service
export const validateApiKey = async () => {
  try {
    // Test the backend AI service with a simple request
    const testPrompt = 'Hello';
    await callBackendAI(testPrompt);
    
    return {
      valid: true,
      model: CLOUD_AI_CONFIG.model,
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter (Cloud) - Pending Configuration'
    };

  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Failed to validate backend AI connection',
      timestamp: new Date().toISOString()
    };
  }
};

// Get API usage statistics (cloud AI ready for configuration)
export const getApiUsage = async () => {
  try {
    return {
      success: true,
      usage: {
        note: 'Cloud AI integration ready - configure OpenRouter API key',
        model: CLOUD_AI_CONFIG.model,
        rate_limit: 'Cloud provider rate limits apply'
      },
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter (Cloud) - Pending Configuration'
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

// Generate birth chart data from manual input using local AI
export const generateBirthChart = async (birthDetails, options = {}) => {
  try {
    const { name, dateOfBirth, timeOfBirth, placeOfBirth } = birthDetails;

    const prompt = `You are an expert Vedic astrologer with comprehensive knowledge of:
    - Astronomical calculations for planetary positions
    - Ayanamsa calculations (Lahiri Ayanamsa preferred)
    - Traditional Vedic house systems
    - Vimshottari Dasha calculations
    - Chart construction principles
    
    Calculate birth chart details accurately based on the provided birth information.

    Calculate a comprehensive Vedic birth chart (Janma Kundli) for the following birth details:

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

    Provide accurate calculations based on standard Vedic astrology principles using Lahiri Ayanamsa.`;

    const chartData = await callBackendAI(prompt);

    return {
      success: true,
      chartData: chartData,
      model: CLOUD_AI_CONFIG.model,
      timestamp: new Date().toISOString(),
      provider: 'OpenRouter (Cloud) - Pending Configuration'
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

export default backendApi;
