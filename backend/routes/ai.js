const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Create axios instance for OpenRouter
const openRouterApi = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://astrova.app',
    'X-Title': 'Astrova - AI Vedic Astrology',
  },
  timeout: 60000, // 1 minute timeout
});

// Monthly prediction endpoint
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
      model: model || 'meta-llama/llama-3.3-70b-instruct:free',
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

// AI-powered monthly prediction generation
async function generateAIMonthlyPrediction({ model, chartData, dashaData, birthDetails, planetaryTransits, selectedMonth, selectedYear }) {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = monthNames[selectedMonth - 1] || 'Current Month';

    const payload = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an expert Vedic astrologer providing monthly predictions. Focus on practical guidance and positive insights while maintaining traditional Jyotish principles. Always return valid JSON format.`
        },
        {
          role: 'user',
          content: `Generate a comprehensive monthly prediction for ${monthName} ${selectedYear} based on the following chart data:

**Birth Chart Data:**
${JSON.stringify(chartData, null, 2)}

**Current Dasha:**
${JSON.stringify(dashaData, null, 2)}

**Birth Details:**
${JSON.stringify(birthDetails, null, 2)}

**Planetary Transits:**
${JSON.stringify(planetaryTransits, null, 2)}

Provide a detailed monthly prediction in JSON format with the following structure:

{
  "overview": "General overview for the month",
  "career": {
    "outlook": "Career prospects",
    "keyAreas": ["key area 1", "key area 2", "key area 3"],
    "challenges": "Main challenges",
    "opportunities": "Key opportunities"
  },
  "relationships": {
    "romantic": "Romantic relationships insight",
    "family": "Family relationships insight",
    "friendships": "Friendships and social connections",
    "advice": "Relationship advice"
  },
  "health": {
    "physical": "Physical health overview",
    "mental": "Mental health insights",
    "recommendations": ["health tip 1", "health tip 2", "health tip 3"],
    "warningAreas": "Areas to be cautious about"
  },
  "finances": {
    "income": "Income prospects",
    "expenses": "Expense management",
    "investments": "Investment guidance",
    "savings": "Savings recommendations",
    "advice": "Financial advice"
  },
  "spiritual": {
    "growth": "Spiritual growth opportunities",
    "practices": "Recommended practices",
    "insights": "Spiritual insights",
    "connections": "Spiritual connections"
  },
  "favorableDates": {
    "general": ["date 1", "date 2", "date 3"],
    "career": ["date 1", "date 2"],
    "relationships": ["date 1", "date 2"],
    "health": ["date 1", "date 2"],
    "financial": ["date 1", "date 2"]
  },
  "remedies": {
    "daily": ["daily remedy 1", "daily remedy 2", "daily remedy 3"],
    "weekly": ["weekly remedy 1", "weekly remedy 2"],
    "monthly": ["monthly remedy 1", "monthly remedy 2"],
    "gemstones": "Gemstone recommendations",
    "colors": "Beneficial colors",
    "mantras": "Recommended mantras"
  },
  "dashaImpact": {
    "period": "Current dasha period",
    "influence": "Dasha influence description",
    "duration": "Duration information",
    "effects": "Expected effects"
  }
}

Return only the JSON object, no additional text or markdown formatting.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.4,
      stream: false
    };

    const response = await openRouterApi.post('/chat/completions', payload);
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    const aiResponse = response.data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      const prediction = JSON.parse(aiResponse);
      return prediction;
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const prediction = JSON.parse(jsonMatch[0]);
          return prediction;
        } catch (extractError) {
          logger.warn('Failed to parse extracted JSON from AI response:', extractError);
        }
      }
      
      // If all parsing fails, return a structured response with the raw AI text
      return {
        overview: aiResponse,
        career: {
          outlook: "AI-generated career guidance available",
          keyAreas: ["Professional development", "Strategic planning", "Networking"],
          challenges: "Minor challenges expected",
          opportunities: "Growth opportunities present"
        },
        relationships: {
          romantic: "Positive energy in relationships",
          family: "Family harmony favored",
          friendships: "Social connections strengthen",
          advice: "Focus on communication"
        },
        health: {
          physical: "Good physical health indicated",
          mental: "Mental clarity improved",
          recommendations: ["Regular exercise", "Balanced diet", "Adequate rest"],
          warningAreas: "Manage stress levels"
        },
        finances: {
          income: "Stable income expected",
          expenses: "Control unnecessary expenses",
          investments: "Research before investing",
          savings: "Good time to save",
          advice: "Budget wisely"
        },
        spiritual: {
          growth: "Spiritual development favored",
          practices: "Meditation and prayer beneficial",
          insights: "Inner wisdom increases",
          connections: "Spiritual mentors may appear"
        },
        favorableDates: {
          general: [`${monthName} 7`, `${monthName} 15`, `${monthName} 23`],
          career: [`${monthName} 10`, `${monthName} 20`],
          relationships: [`${monthName} 5`, `${monthName} 18`],
          health: [`${monthName} 3`, `${monthName} 12`],
          financial: [`${monthName} 8`, `${monthName} 25`]
        },
        remedies: {
          daily: ["Chant Om Gam Ganapataye Namaha", "Practice gratitude", "Meditate for 10 minutes"],
          weekly: ["Donate to charity", "Fast on Thursdays"],
          monthly: ["Visit temple", "Perform puja"],
          gemstones: "Wear your birth stone",
          colors: "Blue and white are beneficial",
          mantras: "Om Namah Shivaya"
        },
        dashaImpact: {
          period: "Current planetary period",
          influence: "Positive planetary influence",
          duration: "Ongoing influence",
          effects: "Personal growth and development"
        },
        note: "AI response could not be parsed as JSON, using structured fallback"
      };
    }

  } catch (error) {
    logger.error('Error in AI prediction generation:', error);
    throw error;
  }
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
  const ascendant = chartData.ascendant || 'Unknown';
  const moonSign = chartData.moonSign || 'Unknown';
  
  return `For ${month} ${year}, your chart shows a period of transformation and growth. With ${ascendant} rising and Moon in ${moonSign}, you're entering a phase where your natural leadership qualities and intuitive abilities will be highlighted. The planetary configurations suggest opportunities for personal development and spiritual insights.`;
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
  if (!dashaData || !dashaData.currentDasha) {
    return {
      period: "Current dasha information not available",
      influence: "Focus on personal growth and positive karma",
      duration: "Unknown",
      effects: "Maintain spiritual practices and ethical conduct"
    };
  }

  const currentDasha = dashaData.currentDasha;
  return {
    period: `${currentDasha.planet} Mahadasha period`,
    influence: `${currentDasha.planet} energy emphasizes ${getDashaInfluence(currentDasha.planet)}`,
    duration: `${Math.round(currentDasha.remaining)} years remaining`,
    effects: `This period brings opportunities for ${getDashaEffects(currentDasha.planet)}`
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

module.exports = router;
