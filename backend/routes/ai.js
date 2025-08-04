const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const axios = require('axios');

// OpenRouter Configuration
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// AI Task Models Configuration (Sequential Execution Order)
const AI_MODELS = {
  CHART_INTERPRETATION: 'shisa-ai/shisa-v2-llama3.3-70b:free',
  MONTHLY_PREDICTIONS: 'shisa-ai/shisa-v2-llama3.3-70b:free', // Changed to avoid rate limits
  QA_SECTION: 'shisa-ai/shisa-v2-llama3.3-70b:free'
};

// Simple in-memory cache to reduce API calls
const predictionCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Create axios instance for OpenRouter
const openRouterApi = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://astrova.app',
    'X-Title': 'Astrova AI Astrology App',
  },
  timeout: 120000, // Extended timeout for AI processing
});

// Helper function to validate OpenRouter connection (for future use)
async function validateOpenRouterConnection() {
  if (!OPENROUTER_API_KEY) {
    return { connected: false, error: 'API key not configured' };
  }
  
  try {
    // TODO: Test OpenRouter connection when implemented
    logger.info('OpenRouter validation - ready for future implementation');
    return { connected: true, stubbed: true };
  } catch (error) {
    logger.warn('OpenRouter connection failed:', error.message);
    return { connected: false, error: error.message };
  }
}

// OpenRouter API call function with specific model support
async function callOpenRouter(prompt, modelKey, systemPrompt = 'You are an expert Vedic astrologer with deep knowledge of traditional Jyotish principles.', maxRetries = 3) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.');
  }
  
  const model = AI_MODELS[modelKey] || AI_MODELS.CHART_INTERPRETATION;
  logger.info(`🚀 Calling OpenRouter with model: ${model}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openRouterApi.post('/chat/completions', {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 4000
      });
      
      if (response.data?.choices?.[0]?.message?.content) {
        logger.info(`✅ Successfully generated response with OpenRouter (${model})`);
        return response.data.choices[0].message.content;
      }
      
      throw new Error('Empty response from OpenRouter');
    } catch (error) {
      logger.error(`❌ OpenRouter call failed (attempt ${attempt}/${maxRetries}):`, error.response?.data || error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`OpenRouter integration failed after ${maxRetries} attempts: ${error.response?.data?.error?.message || error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// 🧠 AI TASK 1: Chart Interpretation Endpoint
router.post('/chart-interpretation', async (req, res) => {
  try {
    const { chartData, birthDetails, dashaData } = req.body;

    // Validate required data
    if (!chartData || !birthDetails) {
      return res.status(400).json({
        error: 'Missing required data: chartData and birthDetails are required'
      });
    }

    logger.info('🔮 Starting AI Chart Interpretation Task');

    // Generate chart interpretation using OpenRouter
    const interpretation = await generateChartInterpretation({
      chartData,
      birthDetails,
      dashaData
    });

    res.json({
      taskId: 1,
      taskName: 'AI Chart Interpretation',
      model: AI_MODELS.CHART_INTERPRETATION,
      interpretation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error generating chart interpretation:', error);
    res.status(500).json({
      error: 'Failed to generate chart interpretation',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🧠 AI TASK 2: Monthly Predictions Endpoint
router.post('/monthly-prediction', async (req, res) => {
  try {
    const { model, chartData, dashaData, birthDetails, planetaryTransits, selectedMonth, selectedYear } = req.body;

    // Validate required data
    if (!chartData || !birthDetails) {
      return res.status(400).json({
        error: 'Missing required data: chartData and birthDetails are required'
      });
    }

    logger.info('Generating AI monthly prediction for user');

    // Generate AI prediction using the specified model
    const prediction = await generateAIMonthlyPrediction({
      model: model || 'microsoft/DialoGPT-medium',
      chartData,
      dashaData,
      birthDetails,
      planetaryTransits,
      selectedMonth,
      selectedYear
    });

    res.json({
      prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating monthly prediction:', error);
    
    // Fallback to mock prediction if AI fails
    try {
      const { chartData, dashaData, birthDetails, planetaryTransits } = req.body;
      const fallbackPrediction = await generateMonthlyPrediction({
        chartData,
        dashaData,
        birthDetails,
        planetaryTransits
      });
      
      res.json({
        prediction: fallbackPrediction,
        timestamp: new Date().toISOString(),
        note: 'AI service unavailable, using fallback prediction'
      });
    } catch (fallbackError) {
      logger.error('Fallback prediction failed:', fallbackError);
      res.status(500).json({
        error: 'Failed to generate monthly prediction',
        message: error.message
      });
    }
  }
});

// AI chat endpoint with OpenRouter integration
router.post('/chat', async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body;

    // Validate required data
    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required data: prompt is required'
      });
    }

    logger.info('AI chat request received - using OpenRouter integration');

    // Use the appropriate model or default to CHART_INTERPRETATION
    const modelKey = model ? Object.keys(AI_MODELS).find(key => 
      AI_MODELS[key] === model || key === model
    ) : 'CHART_INTERPRETATION';
    
    const systemPrompt = 'You are an expert Vedic astrologer with deep knowledge of traditional Jyotish principles.';
    
    // Call OpenRouter with the provided prompt
    const response = await callOpenRouter(prompt, modelKey || 'CHART_INTERPRETATION', systemPrompt);
    
    res.json({
      response,
      model: AI_MODELS[modelKey || 'CHART_INTERPRETATION'],
      timestamp: new Date().toISOString(),
      status: 'success'
    });

  } catch (error) {
    logger.error('Error in chat endpoint:', error);
    
    res.status(500).json({
      error: 'Failed to process AI chat request',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🧠 AI TASK 3: Q&A Section Endpoint
router.post('/astrological-qa', async (req, res) => {
  try {
    const { question, chartData, birthDetails, dashaData } = req.body;

    // Validate required data
    if (!question) {
      return res.status(400).json({
        error: 'Missing required data: question is required'
      });
    }

    logger.info('👤 Starting AI Q&A Task');

    // Generate AI response using the Q&A function
    const answer = await generateAstrologicalQA({
      question,
      chartData,
      birthDetails,
      dashaData
    });

    res.json({
      taskId: 3,
      taskName: 'AI Q&A Section',
      model: AI_MODELS.QA_SECTION,
      question,
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error generating astrological Q&A response:', error);
    
    // Fallback response
    res.json({
      taskId: 3,
      taskName: 'AI Q&A Section (Fallback)',
      question: req.body.question,
      answer: "I apologize, but I'm currently unable to provide a detailed astrological analysis. This could be due to high demand or technical issues. Please try asking your question again, or consider the following general guidance:\n\nFor questions about career: Focus on your strengths and long-term goals.\nFor relationships: Communication and understanding are key.\nFor health: Maintain balance and listen to your body.\nFor spirituality: Regular meditation and self-reflection are beneficial.\n\nFor personalized insights, please try again or consult with a qualified astrologer.",
      timestamp: new Date().toISOString(),
      note: 'AI service unavailable, using fallback response',
      fallback: true
    });
  }
});

// 🧠 AI TASK 1: Chart Interpretation Function
async function generateChartInterpretation({ chartData, birthDetails, dashaData }) {
  const systemPrompt = `You are an expert Vedic astrologer with deep knowledge of traditional Jyotish principles. 

Analyze birth charts using:
- House lords and their placements
- Planetary dignity (own sign, exalted, debilitated)
- Aspects (drishti) from key planets
- Nakshatra of Moon and Ascendant
- Current Mahadasha and Antardasha effects
- Relevant yogas or doshas

Provide a comprehensive interpretation covering:
1. Overall personality and life path
2. Career and profession
3. Relationships and marriage
4. Health and vitality
5. Wealth and finances
6. Spiritual growth
7. Personalized remedies

Base your analysis strictly on Vedic astrological principles and avoid generic interpretations.`;

  const prompt = `Please interpret this Vedic birth chart:

**Birth Details:**
${JSON.stringify(birthDetails, null, 2)}

**Chart Data:**
${JSON.stringify(chartData, null, 2)}

${dashaData ? `**Dasha Information:**\n${JSON.stringify(dashaData, null, 2)}` : ''}

Provide a detailed Vedic astrological interpretation with specific insights based on planetary positions, house lords, and current dasha periods. Include personalized remedies.`;

  return await callOpenRouter(prompt, 'CHART_INTERPRETATION', systemPrompt);
}

// 🧠 AI TASK 2: Enhanced Monthly Predictions Function
async function generateAIMonthlyPrediction({
  model = 'meta-llama/llama-3.3-70b-instruct:free',
  chartData,
  dashaData,
  birthDetails,
  planetaryTransits,
  selectedMonth,
  selectedYear
}) {
  const systemPrompt = `You are an expert Vedic astrologer with deep knowledge of traditional Jyotish principles and predictive astrology.

Analyze monthly predictions using accurate Swiss Ephemeris data:
- Planetary positions and dignity (own sign, exalted, debilitated)
- Current Mahadasha and Antardasha influences
- Transit effects on natal planets and houses
- Aspects (drishti) from transiting planets
- Seasonal and cosmic timing influences
- Traditional yogas and doshas affecting the month

Provide comprehensive monthly guidance covering:
1. Overall monthly theme based on transit analysis
2. Career and professional opportunities
3. Relationships and personal connections
4. Health and wellness guidance
5. Financial prospects and investment advice
6. Spiritual growth opportunities
7. Favorable dates and optimal timing
8. Personalized remedies and practices

Base your analysis strictly on traditional Vedic astrological principles while providing practical, actionable guidance with specific remedies.`;

  const prompt = createMonthlyPredictionPrompt({
    chartData,
    dashaData,
    birthDetails,
    planetaryTransits,
    selectedMonth,
    selectedYear
  });

  try {
    const response = await callOpenRouter(prompt, 'MONTHLY_PREDICTIONS', systemPrompt);
    return parseAIMonthlyResponse(response, { selectedMonth, selectedYear });
  } catch (error) {
    logger.error('❌ AI Monthly Prediction failed:', error);
    throw error;
  }
}

function createMonthlyPredictionPrompt({
  chartData,
  dashaData,
  birthDetails,
  planetaryTransits,
  selectedMonth,
  selectedYear
}) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Extract user's key astrological data
  const userPlanets = chartData?.planets || chartData?.planetaryData || [];
  const ascendant = userPlanets.find(p => p.name === 'Ascendant' || p.planet === 'Ascendant');
  const moon = userPlanets.find(p => p.name === 'Moon' || p.planet === 'Moon');
  const sun = userPlanets.find(p => p.name === 'Sun' || p.planet === 'Sun');
  
  // Format natal planetary positions
  const natalPlanets = userPlanets.slice(0, 9).map(planet => 
    `${planet.name || planet.planet} in ${planet.sign} at ${planet.degree || planet.degreeFormatted || '0°'}`
  ).join(', ');
  
  // Format current transits
  const currentTransits = (planetaryTransits || []).slice(0, 9).map(transit => 
    `${transit.planet} in ${transit.sign || transit.toSign}`
  ).join(', ');
  
  // Current Dasha information - handle both direct dashaData and nested .data structure
  // Debug log the full dasha data structure to understand the format
  logger.info('🔍 DEBUG - Complete Dasha Data Structure:', JSON.stringify(dashaData, null, 2));
  
  const currentMahadasha = dashaData?.currentMahadasha?.planet || dashaData?.data?.currentMahadasha?.planet || 'Unknown';
  const currentAntardasha = dashaData?.currentAntardasha?.planet || dashaData?.data?.currentAntardasha?.planet || 'Unknown';
  const mahadashaStartDate = dashaData?.currentMahadasha?.startDate || dashaData?.data?.currentMahadasha?.startDate || 'Unknown';
  const mahadashaEndDate = dashaData?.currentMahadasha?.endDate || dashaData?.data?.currentMahadasha?.endDate || 'Unknown';
  
  // Log extracted dasha info for verification
  logger.info('🔍 DEBUG - Extracted Dasha Info:', {
    currentMahadasha,
    currentAntardasha,
    mahadashaStartDate,
    mahadashaEndDate
  });
  
  return `Generate comprehensive monthly prediction for ${monthNames[selectedMonth - 1]} ${selectedYear}:

**BIRTH DETAILS:**
Name: ${birthDetails?.name || 'User'}
Date: ${birthDetails?.dateOfBirth || birthDetails?.birthDate || 'Unknown'}
Time: ${birthDetails?.timeOfBirth || birthDetails?.birthTime || 'Unknown'}
Place: ${birthDetails?.placeOfBirth || birthDetails?.birthLocation || 'Unknown'}

**NATAL CHART:**
Ascendant: ${ascendant?.sign || 'Unknown'}
Moon Sign: ${moon?.sign || 'Unknown'} (${moon?.nakshatra || 'Unknown nakshatra'})
Sun Sign: ${sun?.sign || 'Unknown'}
Planetary Positions: ${natalPlanets}

**CURRENT VIMSHOTTARI DASHA PERIODS (CALCULATED BY SWISS EPHEMERIS):**
Mahadasha: ${currentMahadasha} (${mahadashaStartDate} to ${mahadashaEndDate})
Antardasha: ${currentAntardasha}

**IMPORTANT INSTRUCTIONS FOR DASHA ANALYSIS:**
- Use ONLY the Vimshottari Dasha periods provided above
- DO NOT calculate or infer different dasha periods
- The current Mahadasha is ${currentMahadasha} - base all dasha-related predictions on this
- The current Antardasha is ${currentAntardasha} - factor this into your analysis
- These periods are accurately calculated using Swiss Ephemeris astronomical data

**CURRENT PLANETARY TRANSITS:**
${currentTransits}

Provide a detailed analysis in JSON format with this structure:
{
  "overview": "Comprehensive monthly overview analyzing current transits affecting the natal chart",
  "career": {
    "outlook": "Career prospects and opportunities",
    "keyAreas": ["area1", "area2", "area3"],
    "challenges": "Potential challenges to watch for",
    "opportunities": "Key opportunities to pursue",
    "favorableDates": ["YYYY-MM-DD", "YYYY-MM-DD"]
  },
  "relationships": {
    "romantic": "Romantic relationship guidance",
    "family": "Family dynamics and relationships",
    "friendships": "Social connections and friendships",
    "advice": "General relationship advice",
    "favorableDates": ["YYYY-MM-DD", "YYYY-MM-DD"]
  },
  "health": {
    "physical": "Physical health indicators",
    "mental": "Mental and emotional wellbeing",
    "recommendations": ["health tip 1", "health tip 2", "health tip 3"],
    "warningAreas": "Health areas requiring attention",
    "favorableDates": ["YYYY-MM-DD"]
  },
  "finances": {
    "income": "Income and earning prospects",
    "expenses": "Expense management guidance",
    "investments": "Investment opportunities and advice",
    "savings": "Savings and financial planning",
    "advice": "General financial guidance",
    "favorableDates": ["YYYY-MM-DD", "YYYY-MM-DD"]
  },
  "spiritual": {
    "growth": "Spiritual development opportunities",
    "practices": "Recommended spiritual practices",
    "insights": "Spiritual insights for the month",
    "connections": "Spiritual mentorship and guidance"
  },
  "dashaInfluence": {
    "period": "${currentMahadasha} Mahadasha - ${currentAntardasha} Antardasha",
    "influence": "How the current ${currentMahadasha} Mahadasha and ${currentAntardasha} Antardasha specifically influence this month according to Vimshottari Dasha system",
    "duration": "Timeline effects based on ${currentMahadasha} Mahadasha running from ${mahadashaStartDate} to ${mahadashaEndDate}",
    "effects": "Specific effects and manifestations of ${currentMahadasha} Mahadasha period combined with ${currentAntardasha} Antardasha"
  },
  "remedies": {
    "daily": ["daily remedy 1", "daily remedy 2"],
    "weekly": ["weekly remedy 1", "weekly remedy 2"],
    "monthly": ["monthly remedy 1"],
    "gemstones": "Recommended gemstone for this month",
    "colors": "Favorable colors to wear",
    "mantras": "Powerful mantras for this period"
  }
}

Focus on practical Vedic guidance based on the specific planetary transits affecting this person's natal chart. Consider the current dasha period's influence on all life areas.`;
}

function parseAIMonthlyResponse(aiResponse, { selectedMonth, selectedYear }) {
  try {
    // Try to extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Transform to frontend format
    return transformToFrontendFormat(parsedData, selectedMonth, selectedYear);
  } catch (error) {
    logger.warn('Failed to parse AI response as JSON, using fallback format');
    
    // Fallback: treat as plain text and create structured response
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return {
      overview: aiResponse.slice(0, 500) + '...', // First 500 chars as overview
      career: {
        outlook: 'AI-generated career insights based on current transits.',
        keyAreas: ['Professional growth', 'Leadership opportunities', 'Skill development'],
        challenges: 'Navigate workplace dynamics carefully.',
        opportunities: 'New projects and collaborations are favored.',
        favorableDates: [`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-07`, `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-21`]
      },
      relationships: {
        romantic: 'Focus on communication and understanding in relationships.',
        family: 'Family harmony requires patience and compromise.',
        friendships: 'Social connections bring joy and support.',
        advice: 'Practice empathy and active listening.',
        favorableDates: [`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-14`]
      },
      health: {
        physical: 'Maintain regular exercise and healthy eating habits.',
        mental: 'Stress management through meditation and relaxation.',
        recommendations: ['Daily yoga practice', 'Adequate sleep', 'Balanced nutrition'],
        warningAreas: 'Monitor stress levels and avoid overexertion.',
        favorableDates: [`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-28`]
      },
      finances: {
        income: 'Steady income with potential for growth.',
        expenses: 'Plan expenses carefully and avoid impulse purchases.',
        investments: 'Research-based investments are favored.',
        savings: 'Good time to build emergency fund.',
        advice: 'Maintain financial discipline and long-term planning.',
        favorableDates: [`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-03`, `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-18`]
      },
      spiritual: {
        growth: 'Excellent period for meditation and self-reflection.',
        practices: 'Regular prayer, meditation, and charity work.',
        insights: 'Trust your intuition and inner wisdom.',
        connections: 'Spiritual mentors may provide guidance.'
      },
      dashaInfluence: {
        period: 'Current planetary periods bring specific influences',
        influence: 'The current dasha combination affects all life areas',
        duration: 'Effects continue based on planetary timelines',
        effects: 'Focus on patience, discipline, and positive karma'
      },
      remedies: {
        daily: ['Chant chosen mantra 108 times', 'Practice gratitude meditation'],
        weekly: ['Visit temple or sacred place', 'Perform charity work'],
        monthly: ['Observe fasting on favorable days'],
        gemstones: 'Consult astrologer for personalized gemstone recommendation',
        colors: 'Wear white, yellow, or blue colors for positive energy',
        mantras: 'Om Gam Ganapataye Namaha - removes obstacles'
      }
    };
  }
}

function transformToFrontendFormat(parsedData, selectedMonth, selectedYear) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    monthlyOverview: {
      title: `${monthNames[selectedMonth - 1]} ${selectedYear} Prediction`,
      description: parsedData.overview || 'AI-generated monthly prediction based on your birth chart and current transits.',
      overallRating: 4,
      keyTheme: 'Cosmic Guidance'
    },
    predictions: [
      {
        category: 'Career  Profession',
        icon: 'Briefcase',
        rating: 4,
        description: parsedData.career?.outlook || 'Professional opportunities are highlighted.',
        keyPoints: [
          ...(parsedData.career?.keyAreas || ['Professional growth', 'New opportunities']),
          parsedData.career?.challenges || 'Navigate challenges wisely',
          parsedData.career?.opportunities || 'Embrace new opportunities'
        ]
      },
      {
        category: 'Relationships  Love',
        icon: 'Heart',
        rating: 3,
        description: parsedData.relationships?.romantic || 'Personal relationships require attention.',
        keyPoints: [
          parsedData.relationships?.romantic || 'Focus on communication',
          parsedData.relationships?.family || 'Family harmony is important',
          parsedData.relationships?.friendships || 'Social connections flourish',
          parsedData.relationships?.advice || 'Practice patience and understanding'
        ]
      },
      {
        category: 'Health  Wellness',
        icon: 'Heart',
        rating: 3,
        description: parsedData.health?.physical || 'Focus on physical and mental wellbeing.',
        keyPoints: [
          parsedData.health?.physical || 'Maintain physical fitness',
          parsedData.health?.mental || 'Practice stress management',
          ...(parsedData.health?.recommendations || ['Regular exercise', 'Healthy diet', 'Adequate rest']),
          parsedData.health?.warningAreas || 'Monitor health indicators'
        ]
      },
      {
        category: 'Finances',
        icon: 'DollarSign',
        rating: 4,
        description: parsedData.finances?.income || 'Financial stability with careful planning.',
        keyPoints: [
          parsedData.finances?.income || 'Income prospects are stable',
          parsedData.finances?.investments || 'Investment opportunities arise',
          parsedData.finances?.savings || 'Focus on savings goals',
          parsedData.finances?.expenses || 'Manage expenses wisely',
          parsedData.finances?.advice || 'Financial planning is key'
        ]
      },
      {
        category: 'Spiritual Growth',
        icon: 'Sparkles',
        rating: 5,
        description: parsedData.spiritual?.growth || 'Excellent period for spiritual development.',
        keyPoints: [
          parsedData.spiritual?.practices || 'Regular meditation is beneficial',
          parsedData.spiritual?.insights || 'Trust your inner wisdom',
          parsedData.spiritual?.connections || 'Spiritual guidance is available'
        ]
      }
    ],
    favorableDates: [
      ...getAllFavorableDates(parsedData, selectedMonth, selectedYear)
    ].slice(0, 6),
    remedies: [
      ...(parsedData.remedies?.daily || []),
      ...(parsedData.remedies?.weekly || []),
      ...(parsedData.remedies?.monthly || []),
      parsedData.remedies?.mantras || 'Practice chosen mantra',
      parsedData.remedies?.gemstones || 'Consult for gemstone guidance',
      parsedData.remedies?.colors || 'Wear favorable colors'
    ].filter(Boolean).slice(0, 6),
    dashaInfluence: {
      title: parsedData.dashaInfluence?.period || 'Current Dasha Impact',
      description: parsedData.dashaInfluence?.influence || 'Current planetary periods bring specific influences.',
      effects: [
        parsedData.dashaInfluence?.effects || 'Focus on positive karma',
        parsedData.dashaInfluence?.duration || 'Effects continue based on timeline',
        'Practice patience and discipline',
        'Embrace spiritual growth opportunities'
      ]
    }
  };
}

function getAllFavorableDates(data, selectedMonth, selectedYear) {
  const allDates = [];
  
  // Collect all favorable dates from different categories
  const categories = ['career', 'relationships', 'health', 'finances'];
  
  categories.forEach(category => {
    if (data[category]?.favorableDates) {
      data[category].favorableDates.forEach(dateStr => {
        // Convert to proper date format
        const date = new Date(dateStr);
        if (date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear) {
          allDates.push({
            date: dateStr,
            activity: `${category.charAt(0).toUpperCase() + category.slice(1)} activities`
          });
        }
      });
    }
  });
  
  // Add some default dates if none provided
  if (allDates.length === 0) {
    allDates.push(
      { 
        date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-07`, 
        activity: 'Important decisions and meetings' 
      },
      { 
        date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-15`, 
        activity: 'Financial planning and investments' 
      },
      { 
        date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-23`, 
        activity: 'Relationship discussions' 
      }
    );
  }
  
  return allDates;
}
async function generateAIMonthlyPrediction({ chartData, dashaData, birthDetails, planetaryTransits, selectedMonth, selectedYear }) {
  const systemPrompt = `You are an expert Vedic astrologer specializing in predictive astrology and transit analysis.

Analyze current planetary transits against the natal chart, considering:
- Transit effects on natal planets and houses
- Dasha and Antardasha influences
- Planetary aspects during transits
- Timing of events based on transit patterns
- Remedial measures for challenging transits

Provide monthly predictions covering:
1. Overall monthly outlook
2. Career and professional matters
3. Relationships and family
4. Health and well-being
5. Financial prospects
6. Favorable dates and timing
7. Transit-specific remedies

Base predictions on authentic Vedic transit principles and current dasha periods.

IMPORTANT: Return your response as a valid JSON object with this exact structure:
{
  "overview": "overall monthly analysis",
  "career": {
    "outlook": "career outlook",
    "keyAreas": ["area1", "area2", "area3"],
    "challenges": "challenges",
    "opportunities": "opportunities"
  },
  "relationships": {
    "romantic": "romantic relationships",
    "family": "family relationships",
    "friendships": "friendships",
    "advice": "relationship advice"
  },
  "health": {
    "physical": "physical health",
    "mental": "mental health",
    "recommendations": ["rec1", "rec2", "rec3"],
    "warningAreas": "areas to watch"
  },
  "finances": {
    "income": "income prospects",
    "expenses": "expense guidance",
    "investments": "investment advice",
    "savings": "savings guidance",
    "advice": "financial advice"
  },
  "spiritual": {
    "growth": "spiritual growth",
    "practices": "recommended practices",
    "insights": "spiritual insights",
    "connections": "spiritual connections"
  },
  "favorableDates": {
    "general": ["date1", "date2", "date3"],
    "career": ["date1", "date2"],
    "relationships": ["date1", "date2"],
    "health": ["date1", "date2"],
    "financial": ["date1", "date2"]
  },
  "remedies": {
    "daily": ["remedy1", "remedy2", "remedy3"],
    "weekly": ["remedy1", "remedy2"],
    "monthly": ["remedy1", "remedy2"],
    "gemstones": "gemstone recommendation",
    "colors": "color recommendation",
    "mantras": "mantra recommendation"
  },
  "dashaImpact": {
    "period": "current dasha period",
    "influence": "dasha influence",
    "duration": "duration info",
    "effects": "effects description"
  }
}`;

  const currentMonth = selectedMonth || new Date().toLocaleString('default', { month: 'long' });
  const currentYear = selectedYear || new Date().getFullYear();

  const prompt = `Generate monthly predictions for ${currentMonth} ${currentYear}:

**Birth Details:**
${JSON.stringify(birthDetails, null, 2)}

**Natal Chart:**
${JSON.stringify(chartData, null, 2)}

${dashaData ? `**Current Dasha:**\n${JSON.stringify(dashaData, null, 2)}` : ''}

${planetaryTransits ? `**Current Transits:**\n${JSON.stringify(planetaryTransits, null, 2)}` : ''}

Analyze how current planetary transits will affect this person during ${currentMonth} ${currentYear}. Consider the interplay between transits, natal chart, and current dasha period. Provide specific predictions and remedies.

Return ONLY a valid JSON object following the exact structure specified above. Do not include any text before or after the JSON.`;

  const response = await callOpenRouter(prompt, 'MONTHLY_PREDICTIONS', systemPrompt);
  
  // Parse the AI response to ensure it's valid JSON
  try {
    const parsedResponse = JSON.parse(response);
    return parsedResponse;
  } catch (parseError) {
    logger.warn('AI response was not valid JSON, attempting to extract:', parseError.message);
    
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const extractedJson = JSON.parse(jsonMatch[0]);
        return extractedJson;
      } catch (extractError) {
        logger.error('Failed to extract JSON from AI response:', extractError.message);
      }
    }
    
    // If all else fails, return fallback structured data
    logger.warn('Falling back to mock prediction due to JSON parsing failure');
    throw new Error('AI response was not valid JSON - falling back to mock prediction');
  }
}

// 🧠 AI TASK 3: Q&A Function
async function generateAstrologicalQA({ question, chartData, birthDetails, dashaData }) {
  const systemPrompt = `You are an expert Vedic astrologer providing personalized answers to astrological questions.

When answering questions:
- Reference specific planetary positions and house placements
- Consider current dasha periods and their effects
- Provide timing insights when relevant
- Suggest appropriate remedies
- Base answers on traditional Vedic principles
- Be specific and avoid generic responses

Examples of questions you might receive:
- \"What will Saturn retrograde in Pisces mean for me?\"
- \"I'm in Venus-Ketu Dasha. How will this affect marriage?\"
- \"When is the best time for career changes?\"
- \"What remedies can help with health issues?\"`;

  const prompt = `Please answer this astrological question based on the person's chart:

**Question:** ${question}

**Birth Details:**
${JSON.stringify(birthDetails, null, 2)}

**Chart Data:**
${JSON.stringify(chartData, null, 2)}

${dashaData ? `**Current Dasha:**\n${JSON.stringify(dashaData, null, 2)}` : ''}

Provide a detailed, personalized answer based on their specific chart placements, current dasha period, and relevant Vedic astrological principles. Include timing insights and remedies when appropriate.`;

  return await callOpenRouter(prompt, 'QA_SECTION', systemPrompt);
}

// Fallback mock prediction generation function
async function generateMonthlyPrediction({ chartData, dashaData, birthDetails, planetaryTransits }) {
  try {
    // For now, we'll use a mock AI service
    // In production, this would call an actual AI service like OpenAI, Anthropic, or local model
    
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    // Generate comprehensive prediction based on input data
    const prediction = {
      overview: generateOverview(chartData, birthDetails, currentMonth, currentYear),
      career: generateCareerPrediction(chartData, dashaData, planetaryTransits),
      relationships: generateRelationshipPrediction(chartData, planetaryTransits),
      health: generateHealthPrediction(chartData, planetaryTransits),
      finances: generateFinancialPrediction(chartData, dashaData, planetaryTransits),
      spiritual: generateSpiritualPrediction(chartData, planetaryTransits),
      favorableDates: generateFavorableDates(chartData, currentMonth, currentYear),
      remedies: generateRemedies(chartData, dashaData, planetaryTransits),
      dashaImpact: generateDashaImpact(dashaData, currentMonth, currentYear)
    };

    return prediction;

  } catch (error) {
    logger.error('Error in AI prediction generation:', error);
    throw new Error('Failed to generate AI prediction');
  }
}

// Helper functions for generating different sections
function generateOverview(chartData, birthDetails, month, year) {
  // Debug log to help understand chart data structure
  logger.info('🔍 DEBUG - generateOverview chartData structure:', {
    hasHouses: !!chartData?.houses,
    hasPlanets: !!chartData?.planets,
    housesType: Array.isArray(chartData?.houses) ? 'array' : typeof chartData?.houses,
    planetsType: Array.isArray(chartData?.planets) ? 'array' : typeof chartData?.planets,
    housesLength: chartData?.houses?.length,
    planetsLength: chartData?.planets?.length
  });
  
  // Extract ascendant from chart data structure
  let ascendant = 'Unknown';
  let moonSign = 'Unknown';
  
  // Try to find ascendant from houses data
  if (chartData?.houses && Array.isArray(chartData.houses)) {
    const ascendantHouse = chartData.houses.find(house => house.number === 1);
    if (ascendantHouse?.sign) {
      ascendant = ascendantHouse.sign;
      logger.info('✅ Found ascendant from houses:', ascendant);
    } else {
      logger.warn('⚠️ Ascendant house found but no sign:', ascendantHouse);
    }
  } else {
    logger.warn('⚠️ No valid houses array in chartData');
  }
  
  // Try to find Moon sign from planets data (structured planet objects)
  if (chartData?.planets && Array.isArray(chartData.planets)) {
    const moonPlanet = chartData.planets.find(planet => 
      (typeof planet === 'object' && (planet.name === 'Moon' || planet.planet === 'Moon'))
    );
    if (moonPlanet && moonPlanet.sign) {
      moonSign = moonPlanet.sign;
      logger.info('✅ Found moon sign from planets array:', moonSign);
    } else {
      logger.warn('⚠️ Moon planet found but no sign:', moonPlanet);
    }
  }
  
  // Fallback: try to extract Moon from houses by finding Moon
  if (moonSign === 'Unknown' && chartData?.houses && Array.isArray(chartData.houses)) {
    for (const house of chartData.houses) {
      if (house.planets && house.planets.includes('Moon')) {
        moonSign = house.sign;
        logger.info('✅ Found moon sign from houses (fallback):', moonSign);
        break;
      }
    }
  }
  
  // Additional fallback: try to extract from the planets list sent from frontend
  if ((ascendant === 'Unknown' || moonSign === 'Unknown') && chartData?.planets) {
    // Handle the case where planets is sent as a simple array from frontend
    if (Array.isArray(chartData.planets)) {
      for (const planet of chartData.planets) {
        if (typeof planet === 'object') {
          if ((planet.name === 'Ascendant' || planet.planet === 'Ascendant') && planet.sign && ascendant === 'Unknown') {
            ascendant = planet.sign;
            logger.info('✅ Found ascendant from frontend planets:', ascendant);
          }
          if ((planet.name === 'Moon' || planet.planet === 'Moon') && planet.sign && moonSign === 'Unknown') {
            moonSign = planet.sign;
            logger.info('✅ Found moon sign from frontend planets:', moonSign);
          }
        }
      }
    }
  }
  
  // Log final extracted values
  logger.info('🎯 Final Overview extraction result:', { ascendant, moonSign });
  
  // Generate a more dynamic overview based on what we have
  if (ascendant === 'Unknown' && moonSign === 'Unknown') {
    return `For ${month} ${year}, your chart shows a period of transformation and growth. The planetary configurations suggest opportunities for personal development and spiritual insights. Current transits indicate a time of positive change and new beginnings.`;
  } else if (ascendant === 'Unknown') {
    return `For ${month} ${year}, your chart shows a period of transformation and growth. With Moon in ${moonSign}, your emotional nature and intuitive abilities will be highlighted. The planetary configurations suggest opportunities for personal development and spiritual insights.`;
  } else if (moonSign === 'Unknown') {
    return `For ${month} ${year}, your chart shows a period of transformation and growth. With ${ascendant} rising, your natural leadership qualities and approach to life will be emphasized. The planetary configurations suggest opportunities for personal development and spiritual insights.`;
  } else {
    return `For ${month} ${year}, your chart shows a period of transformation and growth. With ${ascendant} rising and Moon in ${moonSign}, you're entering a phase where your natural leadership qualities and intuitive abilities will be highlighted. The planetary configurations suggest opportunities for personal development and spiritual insights.`;
  }
}

function generateCareerPrediction(chartData, dashaData, planetaryTransits) {
  const suggestions = [
    "Focus on long-term planning and strategic thinking",
    "Networking and professional relationships will be key",
    "Innovation and creative problem-solving will be rewarded",
    "Consider skill development in emerging technologies",
    "Leadership opportunities may present themselves"
  ];

  return {
    outlook: "Positive momentum in professional sphere with opportunities for advancement",
    keyAreas: suggestions.slice(0, 3),
    challenges: "Avoid rushing into major decisions without proper research",
    opportunities: "New partnerships or collaborations may emerge"
  };
}

function generateRelationshipPrediction(chartData, planetaryTransits) {
  return {
    romantic: "Venus transits suggest increased harmony and understanding in romantic relationships",
    family: "Family bonds strengthen, but patience may be required with elder relatives",
    friendships: "Social circle expands with like-minded individuals entering your life",
    advice: "Focus on authentic communication and emotional intelligence"
  };
}

function generateHealthPrediction(chartData, planetaryTransits) {
  return {
    physical: "Overall vitality is strong, but pay attention to stress management",
    mental: "Mental clarity improves mid-month, creative thinking enhanced",
    recommendations: [
      "Maintain regular exercise routine",
      "Practice meditation or mindfulness",
      "Ensure adequate sleep schedule",
      "Stay hydrated and eat nutritious foods"
    ],
    warningAreas: "Avoid overexertion and maintain work-life balance"
  };
}

function generateFinancialPrediction(chartData, dashaData, planetaryTransits) {
  return {
    income: "Steady growth potential with possible additional income sources",
    expenses: "Exercise caution with large purchases in the first half of the month",
    investments: "Research-based investments show promise, avoid speculative ventures",
    savings: "Good time to build emergency fund and review financial goals",
    advice: "Create a detailed budget and stick to it"
  };
}

function generateSpiritualPrediction(chartData, planetaryTransits) {
  return {
    growth: "Spiritual awareness deepens through meditation and self-reflection",
    practices: "Regular prayer or spiritual study will provide guidance",
    insights: "Dreams and intuitive insights may provide important messages",
    connections: "Spiritual communities or mentors may play important roles"
  };
}

function generateFavorableDates(chartData, month, year) {
  const currentDate = new Date();
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  
  // Generate some favorable dates for the month
  const favorableDates = [];
  for (let i = 0; i < 5; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    favorableDates.push(`${month} ${day}, ${year}`);
  }

  return {
    general: favorableDates.slice(0, 3),
    career: favorableDates.slice(2, 4),
    relationships: favorableDates.slice(1, 3),
    health: favorableDates.slice(0, 2),
    financial: favorableDates.slice(3, 5)
  };
}

function generateRemedies(chartData, dashaData, planetaryTransits) {
  const remedies = [
    "Chant Om Namah Shivaya 108 times daily",
    "Wear a silver bracelet or ring",
    "Donate to educational institutions",
    "Plant a tree or maintain a garden",
    "Practice gratitude meditation",
    "Read spiritual texts regularly",
    "Offer water to the Sun at sunrise",
    "Light a lamp every evening",
    "Perform acts of service to others",
    "Maintain a positive mindset"
  ];

  return {
    daily: remedies.slice(0, 3),
    weekly: remedies.slice(3, 5),
    monthly: remedies.slice(5, 7),
    gemstones: "Consider wearing Pearl or Moonstone for enhanced intuition",
    colors: "Blue and white colors will be particularly beneficial",
    mantras: "Om Gam Ganapataye Namaha for removing obstacles"
  };
}

function generateDashaImpact(dashaData, month, year) {
  // Debug log to help understand dasha data structure
  logger.info('🔍 DEBUG - generateDashaImpact dashaData structure:', {
    hasDashaData: !!dashaData,
    dashaDataType: typeof dashaData,
    hasCurrentMahadasha: !!dashaData?.currentMahadasha,
    hasNestedData: !!dashaData?.data,
    hasNestedCurrentMahadasha: !!dashaData?.data?.currentMahadasha,
    hasLegacyCurrentDasha: !!dashaData?.currentDasha,
    dashaDataKeys: dashaData ? Object.keys(dashaData) : [],
    nestedDataKeys: dashaData?.data ? Object.keys(dashaData.data) : []
  });
  
  // Handle different dasha data structures
  let currentMahadasha = null;
  let currentAntardasha = null;
  let extractionMethod = 'none';
  
  if (!dashaData) {
    logger.warn('⚠️ No dashaData provided to generateDashaImpact');
  } else {
    // Method 1: Try to extract from direct structure
    if (dashaData.currentMahadasha) {
      currentMahadasha = dashaData.currentMahadasha;
      currentAntardasha = dashaData.currentAntardasha;
      extractionMethod = 'direct';
      logger.info('✅ Found dasha data using direct structure:', {
        mahadasha: currentMahadasha?.planet,
        antardasha: currentAntardasha?.planet
      });
    }
    // Method 2: Try to extract from nested data structure
    else if (dashaData.data?.currentMahadasha) {
      currentMahadasha = dashaData.data.currentMahadasha;
      currentAntardasha = dashaData.data.currentAntardasha;
      extractionMethod = 'nested';
      logger.info('✅ Found dasha data using nested structure:', {
        mahadasha: currentMahadasha?.planet,
        antardasha: currentAntardasha?.planet
      });
    }
    // Method 3: Try legacy structure (currentDasha)
    else if (dashaData.currentDasha) {
      currentMahadasha = dashaData.currentDasha;
      extractionMethod = 'legacy';
      logger.info('✅ Found dasha data using legacy structure:', {
        mahadasha: currentMahadasha?.planet || currentMahadasha
      });
    }
    // Method 4: Try to extract from mainPeriod/subPeriod (frontend format)
    else if (dashaData.mainPeriod) {
      currentMahadasha = {
        planet: dashaData.mainPeriod,
        startDate: dashaData.startDate,
        endDate: dashaData.endDate
      };
      if (dashaData.subPeriod) {
        currentAntardasha = {
          planet: dashaData.subPeriod
        };
      }
      extractionMethod = 'frontend';
      logger.info('✅ Found dasha data using frontend format:', {
        mahadasha: currentMahadasha?.planet,
        antardasha: currentAntardasha?.planet
      });
    }
    // Method 5: Try to extract if dashaData itself has planet property
    else if (dashaData.planet) {
      currentMahadasha = dashaData;
      extractionMethod = 'simple';
      logger.info('✅ Found dasha data using simple structure:', {
        mahadasha: currentMahadasha?.planet
      });
    }
    else {
      logger.warn('⚠️ Could not extract dasha data from any known structure');
      logger.warn('Raw dashaData:', JSON.stringify(dashaData, null, 2));
    }
  }
  
  // Validate extracted data
  const isValidMahadasha = currentMahadasha && 
    (currentMahadasha.planet || (typeof currentMahadasha === 'string' && currentMahadasha !== 'Unknown'));
  
  logger.info('🎯 Final Dasha extraction result:', {
    extractionMethod,
    isValidMahadasha,
    mahadashaPlanet: currentMahadasha?.planet || currentMahadasha,
    antardashaplanet: currentAntardasha?.planet,
    hasStartDate: !!currentMahadasha?.startDate,
    hasEndDate: !!currentMahadasha?.endDate,
    hasRemainingYears: !!currentMahadasha?.remainingYears
  });
  
  // Return fallback if no valid dasha data found
  if (!isValidMahadasha) {
    logger.warn('⚠️ No valid Mahadasha data found, returning fallback dasha impact');
    return {
      period: "Current dasha information not available",
      influence: "The planetary periods are being calculated based on your birth chart. Focus on personal growth and positive karma during this time.",
      duration: "Planetary timeline effects are considered for monthly predictions",
      effects: "Maintain spiritual practices and ethical conduct. Transit effects will still influence your monthly experience."
    };
  }

  // Extract planet name (handle both object and string formats)
  const mahadashaPlanet = currentMahadasha.planet || currentMahadasha;
  const antardashaText = currentAntardasha?.planet ? ` - ${currentAntardasha.planet} Antardasha` : '';
  
  // Validate planet name
  if (!mahadashaPlanet || mahadashaPlanet === 'Unknown') {
    logger.warn('⚠️ Mahadasha planet is Unknown or invalid:', mahadashaPlanet);
    return {
      period: "Current dasha period is being calculated",
      influence: "Planetary influences are based on current transits and birth chart positions",
      duration: "Timeline effects are determined by planetary movements",
      effects: "Focus on spiritual growth and positive actions during this period"
    };
  }
  
  logger.info('✅ Successfully generating dasha impact for planet:', mahadashaPlanet);
  
  return {
    period: `${mahadashaPlanet} Mahadasha${antardashaText}`,
    influence: `${mahadashaPlanet} energy emphasizes ${getDashaInfluence(mahadashaPlanet)}`,
    duration: currentMahadasha.remainingYears ? 
      `${Math.round(currentMahadasha.remainingYears * 10) / 10} years remaining` : 
      currentMahadasha.startDate && currentMahadasha.endDate ?
        `Period from ${currentMahadasha.startDate} to ${currentMahadasha.endDate}` :
        "Duration based on current planetary timeline",
    effects: `This period brings opportunities for ${getDashaEffects(mahadashaPlanet)}`
  };
}

function getDashaInfluence(planet) {
  const influences = {
    'Sun': 'leadership, authority, and self-expression',
    'Moon': 'emotions, intuition, and nurturing',
    'Mars': 'action, courage, and determination',
    'Mercury': 'communication, learning, and business',
    'Jupiter': 'wisdom, spirituality, and growth',
    'Venus': 'creativity, relationships, and beauty',
    'Saturn': 'discipline, responsibility, and structure',
    'Rahu': 'transformation, innovation, and material success',
    'Ketu': 'spirituality, detachment, and inner wisdom'
  };
  return influences[planet] || 'personal development and growth';
}

function getDashaEffects(planet) {
  const effects = {
    'Sun': 'recognition, career advancement, and leadership roles',
    'Moon': 'emotional fulfillment, family harmony, and intuitive insights',
    'Mars': 'achievement through effort, property matters, and physical vitality',
    'Mercury': 'education, communication skills, and business opportunities',
    'Jupiter': 'spiritual growth, teaching, and knowledge expansion',
    'Venus': 'artistic expression, romantic relationships, and material comforts',
    'Saturn': 'long-term success through patience and hard work',
    'Rahu': 'unconventional success, technology, and foreign connections',
    'Ketu': 'spiritual realization, research, and inner transformation'
  };
  return effects[planet] || 'overall personal development';
}

// Analyze Mars-Saturn interactions
function getMarsSaturnAnalysis() {
  const marsAnalyses = [
    'heightened tension requiring careful navigation',
    'disciplined action leading to sustainable results',
    'challenges that strengthen long-term foundations',
    'strategic patience yielding breakthrough moments'
  ];
  return marsAnalyses[Math.floor(Math.random() * marsAnalyses.length)];
}

// Analyze Jupiter's current influence
function getJupiterAnalysis() {
  const jupiterAnalyses = [
    'expanded opportunities in education and spiritual growth',
    'beneficial developments in international relations', 
    'wisdom-based solutions to complex problems',
    'philosophical breakthroughs and cultural evolution'
  ];
  return jupiterAnalyses[Math.floor(Math.random() * jupiterAnalyses.length)];
}

// Analyze Mercury-Uranus aspects
function getMercuryUranusAnalysis() {
  return 'breakthroughs in communication and AI development';
}

// Perform historical correlation analysis
function performHistoricalCorrelationAnalysis(eventAnalysis) {
  logger.info('📊 Performing historical correlation analysis');
  
  const correlationStrength = eventAnalysis.correlationStrength;
  const strongCorrelations = eventAnalysis.highImpactEvents;
  const totalAnalyzed = eventAnalysis.totalEvents;
  
  // Calculate correlation percentage
  const correlationPercentage = Math.round(correlationStrength * 100);
  
  return {
    description: `Historical Correlation Strength\n\nOur analysis shows a ${correlationPercentage}% correlation between Saturn-Pluto aspects and major economic shifts. This pattern has held consistent across the past century of data.\n\nOf ${totalAnalyzed} events analyzed, ${strongCorrelations} show strong planetary correlations, particularly during outer planet aspects and eclipse periods.`,
    strength: correlationStrength,
    topPattern: eventAnalysis.topCategories[0] || 'Mixed patterns'
  };
}

// Generate upcoming planetary considerations
function generateUpcomingConsiderations(eventAnalysis) {
  logger.info('🔮 Generating upcoming planetary considerations');
  
  const riskLevel = assessRiskLevel(eventAnalysis);
  const timeframe = '60-90 days';
  
  // Calculate future date for Mars-Saturn square
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6);
  const monthsUntilAspect = 6;
  
  return {
    description: `Upcoming Considerations\n\nThe next major Mars-Saturn square occurs in ${monthsUntilAspect} months. Historical data suggests increased geopolitical tensions during such periods. Monitor developments closely.\n\nCurrent patterns indicate ${riskLevel} risk levels for the next ${timeframe}, with particular attention needed in ${eventAnalysis.topCategories.slice(0, 2).join(' and ')} sectors.`,
    risk: riskLevel,
    timeframe: timeframe
  };
}

// Generate comprehensive local analysis summary
function generateComprehensiveLocalAnalysis(eventAnalysis, planetaryAnalysis, correlationAnalysis, futureAnalysis) {
  logger.info('📝 Generating comprehensive local analysis');
  
  return `Current Planetary Climate Analysis\n\n${planetaryAnalysis.description}\n\n${correlationAnalysis.description}\n\n${futureAnalysis.description}\n\nRecommendations:\n\n• Monitor planetary transits affecting global stability\n• Pay attention to Mars-Saturn squares indicating potential conflicts\n• Jupiter aspects suggest opportunities for diplomatic resolution\n• Mercury-Uranus combinations favor technological solutions\n\nThis analysis combines traditional Vedic principles with statistical pattern recognition, providing a ${Math.round(planetaryAnalysis.confidence * 100)}% confidence assessment based on ${eventAnalysis.totalEvents} historical events and current planetary positions.`;
}

module.exports = router;
