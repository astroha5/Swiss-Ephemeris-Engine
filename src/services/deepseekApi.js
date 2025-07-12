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
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key is not configured. Please add VITE_DEEPSEEK_API_KEY to your environment variables.');
    }

    // Use different model lists based on the interpretation type
    const isMonthlyPrediction = chartData.type === 'monthly_prediction' || options.focus === 'monthly_transits';
    const modelsList = isMonthlyPrediction ? monthlyPredictionModels : chartInterpretationModels;

    const payload = {
      model: modelsList[0],
      messages: [
        {
          role: 'system',
          content: `You are a Vedic astrologer. Provide friendly, insightful interpretations based on traditional Jyotish principles. Focus on constructive guidance and personal empowerment. ${chartData.focus === 'remedies' ? 'For remedies, return ONLY valid JSON without any markdown formatting or additional text.' : 'Return only valid JSON.'}`
        },
        {
          role: 'user',
          content: `Based on the following birth chart analysis, provide a detailed Vedic astrological interpretation:

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
            'Provide JSON with 6 sections: {"overview":{"content":"...","keyPoints":["..."],"recommendations":["..."]}, "career":{"content":"...","keyPoints":["..."],"recommendations":["..."]}, "relationships":{"content":"...","keyPoints":["..."],"recommendations":["..."]}, "health":{"content":"...","keyPoints":["..."],"recommendations":["..."]}, "wealth":{"content":"...","keyPoints":["..."],"recommendations":["..."]}, "spirituality":{"content":"...","keyPoints":["..."],"recommendations":["..."]}}. Each section must include content, keyPoints, and recommendations.'
          }`
        }
      ],
      max_tokens: 6000,
      temperature: 0.3,
      stream: options.stream || false,
      ...options
    };

    let response;
    let lastError;
    
    for (let i = 0; i < modelsList.length; i++) {
      const model = modelsList[i];
      payload.model = model;
      
      try {
        console.log(`Attempting to use model: ${model}`);
        response = await deepseekApi.post('/chat/completions', payload);
        if (response.data?.choices?.[0]?.message?.content) {
          console.log(`Successfully used model: ${model}`);
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} failed:`, err.message);
        lastError = err;
        
        // Add delay before trying next model to avoid rate limiting
        if (i < modelsList.length - 1) {
          console.log('Waiting 2 seconds before trying next model...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!response || !response.data?.choices?.[0]?.message?.content) {
      throw new Error(lastError ? `All models failed. Last error: ${lastError.message}` : 'All models failed to generate an interpretation.');
    }

    const rawContent = response.data.choices[0].message.content;
    
    // For remedies requests, try to extract JSON
    let processedContent = rawContent;
    if (chartData.focus === 'remedies') {
      const extractedJson = extractJsonFromResponse(rawContent);
      if (extractedJson) {
        processedContent = JSON.stringify(extractedJson);
      }
    }
    
    return {
      success: true,
      interpretation: processedContent,
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
