import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import TypewriterText from '../../../components/ui/TypewriterText';
import { getPlanetaryTransits } from '../../../services/api';

const MonthlyPredictionSection = ({ chartData, dashaData, birthDetails }) => {
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Extract currentDasha from dashaData prop - handle different possible structures
  const currentDasha = dashaData?.data || dashaData;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateMonthlyPrediction = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required data before making API call
      if (!chartData || !birthDetails) {
        throw new Error('Chart data and birth details are required to generate predictions');
      }

      // Ensure dashaData integrity
      if (!currentDasha || !currentDasha.currentMahadasha) {
        throw new Error('Incomplete Dasha data');
      }

      console.log('🔄 Generating monthly prediction with optimized data:', {
        hasChartData: !!chartData,
        hasBirthDetails: !!birthDetails,
        hasCurrentDasha: !!currentDasha,
        selectedMonth,
        selectedYear
      });
      
      // Get current transits for the selected month (limit to essential data)
      const transitResponse = await getPlanetaryTransits(selectedYear, 'UTC');
      const currentTransits = transitResponse.success ? 
        transitResponse.data.transits.slice(0, 9) : []; // Limit to 9 main planets only

      // Ensure essential transit data
      if (currentTransits.length === 0) {
        throw new Error('Failed to retrieve actual planetary transits');
      }

      console.log('🔍 DEBUG - Final Extracted Dasha Data for AI:', {
        mainPeriod: currentDasha?.currentMahadasha?.planet,
        subPeriod: currentDasha?.currentAntardasha?.planet
      });

      // Lagna Planetary Data - Generate planets list
      let planetsList = [];

      if (chartData?.houses && Array.isArray(chartData.houses)) {
        chartData.houses.forEach(house => {
          if (house.planets && Array.isArray(house.planets)) {
            house.planets.forEach((planet, idx) => {
              planetsList.push({
                name: typeof planet === 'string' ? planet : planet.name,
                sign: house.sign
              });
            });
          }
        });
      }

      // Include Ascendant (house 1 sign) explicitly
      const ascendantHouse = chartData?.houses?.find(h => h.number === 1);
      if (ascendantHouse) {
        planetsList.push({
          name: 'Ascendant',
          sign: ascendantHouse.sign
        });
      }

      // Ensure Moon is included (may already be included, but do a check)
      const moonAlreadyIncluded = planetsList.some(p => p.name === 'Moon');
      if (!moonAlreadyIncluded && chartData?.houses && Array.isArray(chartData.houses)) {
        // Try to find Moon from houses, add if found
        for (const house of chartData.houses) {
          if (house.planets && house.planets.includes('Moon')) {
            planetsList.push({
              name: 'Moon',
              sign: house.sign
            });
            break;
          }
        }
      }

      // Limit to 9 main planets only
      planetsList = planetsList.slice(0, 9);

      // Refactored Payload - Include only essentials
      const analysisData = {
        // Essential birth details only
        birthDetails: {
          name: birthDetails.name || 'User',
          dateOfBirth: birthDetails.dateOfBirth || birthDetails.birthDate,
          timeOfBirth: birthDetails.timeOfBirth || birthDetails.birthTime,
          placeOfBirth: birthDetails.placeOfBirth || birthDetails.birthLocation
        },

        // Lagna Planetary Data
        planets: planetsList,

        // Dasha Timeline - extract the correct current dasha values
        // Access currentDasha data properly from the API response structure
        currentDasha: currentDasha ? {
          mainPeriod: currentDasha?.currentMahadasha?.planet || 'Unknown',
          subPeriod: currentDasha?.currentAntardasha?.planet || 'Unknown', 
          startDate: currentDasha?.currentMahadasha?.startDate || null,
          endDate: currentDasha?.currentMahadasha?.endDate || null
        } : {
          mainPeriod: 'Unknown',
          subPeriod: 'Unknown',
          startDate: null,
          endDate: null
        },

        // Current transits - essential data only
        currentTransits: currentTransits.map(transit => ({
          planet: transit.planet,
          sign: transit.toSign || transit.sign
        })).slice(0, 9),  // Limit to 9 main planets

        selectedMonth: selectedMonth,
        selectedYear: selectedYear
      };

      // Call AI service for monthly prediction
      const predictionResponse = await generateAIPrediction(analysisData);
      
      if (predictionResponse.success) {
        setPredictions(predictionResponse.data);
      } else {
        throw new Error(predictionResponse.error || 'Failed to generate prediction');
      }
    } catch (error) {
      console.error('Error generating monthly prediction:', error);
      setError(error.message || 'Failed to generate monthly prediction');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIPrediction = async (data) => {
    try {
      // Create a comprehensive prompt for the AI model
      const prompt = createPredictionPrompt(data);
      
      console.log('🤖 Making AI prediction request to backend...');
      
// Call the AI service (using OpenRouter with Llama-3.3-70B)
      const API_BASE_URL = import.meta.env.VITE_API_URL || (
        import.meta.env.PROD 
          ? 'https://astrova-backend.onrender.com' 
          : 'http://localhost:3001'
      );
      
      // Attach Supabase token so backend can enforce plan
      const session = await (await import('../../../services/authService')).getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/ai/monthly-prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          // Model is determined server-side; client value ignored
          prompt: prompt,
          // Send only essential data - dramatically reduced payload
          chartData: {
            planets: data.planets // Essential planetary positions only
          },
          dashaData: data.currentDasha, // Already optimized
          birthDetails: data.birthDetails, // Already optimized
          planetaryTransits: data.currentTransits, // Already optimized
          selectedMonth: data.selectedMonth,
          selectedYear: data.selectedYear
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ AI prediction response received:', {
        hasPrediction: !!result.prediction,
        hasNote: !!result.note,
        timestamp: result.timestamp
      });
      
      // Check if result has prediction data
      if (result.prediction) {
        // Log the actual prediction data to debug
        console.log('🔍 Raw AI prediction data:', result.prediction);
        
        // Transform backend response to match frontend expectations
        const transformedData = transformBackendPrediction(result.prediction, data);
        // Mark as real AI data
        transformedData.isAIGenerated = true;
        transformedData.note = result.note;

        console.log('🔍 Transformed AI data:', transformedData);

        return {
          success: true,
          data: transformedData
        };
      } else {
        throw new Error('No prediction data received from backend');
      }
    } catch (error) {
      console.error('❌ AI prediction error:', error);
      console.warn('⚠️ Falling back to mock data due to AI service failure');
      
      // Fallback to mock data but mark it as such
      const mockData = getMockPrediction(data);
      mockData.data.isAIGenerated = false;
      mockData.data.fallbackReason = error.message;
      
      return mockData;
    }
  };

  const createPredictionPrompt = (data) => {
    // Create a concise, optimized prompt to reduce token usage
    const planetaryText = data.planets.map(p => `${p.name} in ${p.sign}`).join(', ');
    const transitText = data.currentTransits.map(t => `${t.planet} in ${t.sign}`).join(', ');
    
    // Debug log to verify current dasha data and ensure accuracy
    console.log('🔍 DEBUG - Current Dasha in Prompt:', {
      mainPeriod: data.currentDasha?.mainPeriod,
      subPeriod: data.currentDasha?.subPeriod,
      fullData: data.currentDasha
    });
    
    // Validate that we have correct dasha data before sending to AI
    if (!data.currentDasha?.mainPeriod || data.currentDasha.mainPeriod === 'Unknown') {
      console.warn('⚠️ WARNING: Invalid or missing Mahadasha data being sent to AI');
    }
    
    return `Generate monthly prediction for ${monthNames[data.selectedMonth - 1]} ${data.selectedYear}:

BIRTH: ${data.birthDetails.name}, ${data.birthDetails.dateOfBirth}, ${data.birthDetails.timeOfBirth}, ${data.birthDetails.placeOfBirth}
PLANETS: ${planetaryText}

**CURRENT VIMSHOTTARI DASHA PERIODS (Swiss Ephemeris Calculation):**
- Current Mahadasha: ${data.currentDasha?.mainPeriod || 'Unknown'}
- Current Antardasha: ${data.currentDasha?.subPeriod || 'Unknown'} 
- Period: ${data.currentDasha?.startDate || 'Unknown'} to ${data.currentDasha?.endDate || 'Unknown'}

**CRITICAL: Use ONLY these Vimshottari Dasha periods in your analysis. Do NOT calculate different dasha periods.**

TRANSITS: ${transitText}

Return ONLY a valid JSON object with this exact structure:
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
    "period": "${data.currentDasha?.mainPeriod || 'Current'} Mahadasha - ${data.currentDasha?.subPeriod || 'Current'} Antardasha",
    "influence": "How the current ${data.currentDasha?.mainPeriod || 'planetary'} Mahadasha specifically influences this month",
    "duration": "Timeline effects based on the ${data.currentDasha?.mainPeriod || 'current'} Mahadasha period",
    "effects": "Specific effects of ${data.currentDasha?.mainPeriod || 'current'} Mahadasha and ${data.currentDasha?.subPeriod || 'current'} Antardasha combination"
  }
}

Focus on practical Vedic guidance. Be concise but insightful.`;
  };

  const transformBackendPrediction = (backendPrediction, data) => {
    // Transform the backend response to match the frontend expected format
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    console.log('🔍 Transforming backend prediction:', backendPrediction);
    console.log('🔍 Available prediction fields:', Object.keys(backendPrediction));
    
    // Check if we have actual AI data or if it's empty/null
    const hasValidOverview = backendPrediction.overview && backendPrediction.overview.trim() !== '';
    const hasValidCareer = backendPrediction.career && Object.keys(backendPrediction.career).length > 0;
    
    console.log('🔍 Data validation:', { hasValidOverview, hasValidCareer });

    return {
      monthlyOverview: {
        title: `${monthNames[data.selectedMonth - 1]} ${data.selectedYear} Overview`,
        description: backendPrediction.overview || 'AI-generated monthly prediction based on your birth chart and current transits.',
        overallRating: 4, // Default rating
        keyTheme: "AI-Generated Insights"
      },
      predictions: [
        {
          category: "Career \u0026 Profession",
          icon: "Briefcase",
          rating: 4,
          description: backendPrediction.career?.outlook || 'Professional opportunities are highlighted this month.',
          keyPoints: backendPrediction.career?.keyAreas?.length ? backendPrediction.career.keyAreas : [
            backendPrediction.career?.challenges || "Focus on professional development",
            backendPrediction.career?.opportunities || "Networking opportunities may arise"
          ]
        },
        {
          category: "Relationships \u0026 Love",
          icon: "Heart",
          rating: 3,
          description: backendPrediction.relationships?.romantic || 'Personal relationships require attention and communication.',
          keyPoints: [
            backendPrediction.relationships?.romantic || "Venus brings harmony in relationships",
            backendPrediction.relationships?.family || "Family bonds strengthen with patience",
            backendPrediction.relationships?.friendships || "Social connections expand positively",
            backendPrediction.relationships?.advice || "Communication is key"
          ].filter(Boolean)
        },
        {
          category: "Health \u0026 Wellness",
          icon: "Heart",
          rating: 3,
          description: backendPrediction.health?.physical || 'Focus on maintaining physical and mental well-being.',
          keyPoints: [
            backendPrediction.health?.mental || "Mental health requires attention",
            ...(backendPrediction.health?.recommendations?.length ? backendPrediction.health.recommendations : [
              "Maintain regular exercise",
              "Focus on stress management",
              "Ensure adequate rest"
            ]),
            backendPrediction.health?.warningAreas || "Be cautious about stress"
          ].filter(Boolean)
        },
        {
          category: "Finances",
          icon: "DollarSign",
          rating: 4,
          description: backendPrediction.finances?.income || 'Financial stability is indicated with careful planning.',
          keyPoints: [
            backendPrediction.finances?.income || "Steady income growth is indicated",
            backendPrediction.finances?.investments || "Research-based investments are favored",
            backendPrediction.finances?.savings || "Good time to build savings and plan budgets",
            backendPrediction.finances?.expenses || "Manage expenses carefully",
            backendPrediction.finances?.advice || "Budget wisely"
          ].filter(Boolean)
        },
        {
          category: "Spiritual Growth",
          icon: "Sparkles",
          rating: 5,
          description: backendPrediction.spiritual?.growth || 'Spiritual practices and self-reflection are favored.',
          keyPoints: [
            backendPrediction.spiritual?.practices || "Regular meditation and prayer are beneficial",
            backendPrediction.spiritual?.insights || "Intuitive insights and dreams are heightened",
            backendPrediction.spiritual?.connections || "Spiritual mentors may enter your life"
          ].filter(Boolean)
        }
      ],
favorableDates: (() => {
        const dates = [];
        
        // Helper function to parse date strings from AI response
        const parseDateString = (dateStr, activity) => {
          // Handle formats like "July 3", "3", etc.
          const dayMatch = dateStr.match(/\d+/);
          if (dayMatch) {
            let day = parseInt(dayMatch[0]);
            
            // Get the maximum days for the selected month and year
            const maxDaysInMonth = new Date(data.selectedYear, data.selectedMonth, 0).getDate();
            
            // Clamp the day to be within valid range for the month
            if (day > maxDaysInMonth) {
              day = maxDaysInMonth;
            }
            if (day < 1) {
              day = 1;
            }
            
            const dateStr = `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Validate that the constructed date is valid
            const testDate = new Date(dateStr);
            if (isNaN(testDate.getTime())) {
              return null; // Invalid date
            }
            
            return {
              date: dateStr,
              activity: activity
            };
          }
          return null;
        };
        
        if (backendPrediction.favorableDates?.general?.length) {
          backendPrediction.favorableDates.general.forEach(dateStr => {
            const parsed = parseDateString(dateStr, "Favorable for general activities");
            if (parsed) dates.push(parsed);
          });
        }
        if (backendPrediction.favorableDates?.career?.length) {
          backendPrediction.favorableDates.career.forEach(dateStr => {
            const parsed = parseDateString(dateStr, "Career opportunities");
            if (parsed) dates.push(parsed);
          });
        }
        if (backendPrediction.favorableDates?.relationships?.length) {
          backendPrediction.favorableDates.relationships.forEach(dateStr => {
            const parsed = parseDateString(dateStr, "Relationship matters");
            if (parsed) dates.push(parsed);
          });
        }
        if (backendPrediction.favorableDates?.health?.length) {
          backendPrediction.favorableDates.health.forEach(dateStr => {
            const parsed = parseDateString(dateStr, "Health and wellness");
            if (parsed) dates.push(parsed);
          });
        }
        if (backendPrediction.favorableDates?.financial?.length) {
          backendPrediction.favorableDates.financial.forEach(dateStr => {
            const parsed = parseDateString(dateStr, "Financial matters");
            if (parsed) dates.push(parsed);
          });
        }
        return dates.length > 0 ? dates.slice(0, 5) : [];
      })(),
      remedies: [
        ...(backendPrediction.remedies?.daily || []),
        ...(backendPrediction.remedies?.weekly || []),
        ...(backendPrediction.remedies?.monthly || []),
        backendPrediction.remedies?.mantras || "Chant 'Om Gam Ganapataye Namaha' 108 times daily",
        backendPrediction.remedies?.gemstones || "Practice meditation for inner peace",
        backendPrediction.remedies?.colors || "Donate to charitable causes"
      ].filter(Boolean).slice(0, 6),
      dashaInfluence: {
        title: backendPrediction.dashaImpact?.period || 
               (data.currentDasha?.mainPeriod !== 'Unknown' ? 
                 `${data.currentDasha?.mainPeriod} Mahadasha - ${data.currentDasha?.subPeriod || 'Current'} Antardasha` :
                 'Current Dasha Period'),
        description: backendPrediction.dashaImpact?.influence || 
                    (data.currentDasha?.mainPeriod !== 'Unknown' ? 
                      `The current ${data.currentDasha?.mainPeriod} Mahadasha and ${data.currentDasha?.subPeriod || 'planetary'} Antardasha combination brings specific influences that shape your monthly experience according to Vimshottari Dasha system.` :
                      'The current dasha period influences are being calculated based on your birth chart. Planetary transits will still have an impact on your life during this month according to Vedic astrology principles.'),
        effects: [
          backendPrediction.dashaImpact?.effects || 
            (data.currentDasha?.mainPeriod !== 'Unknown' ? 
              `${data.currentDasha?.mainPeriod} Mahadasha effects are prominent this month` :
              'Planetary transits and their effects are considered for this month\'s predictions'),
          backendPrediction.dashaImpact?.duration || 
            (data.currentDasha?.subPeriod !== 'Unknown' ? 
              `${data.currentDasha?.subPeriod} Antardasha modifies the overall planetary influence` :
              'Current transits modify the general cosmic influences'),
          data.currentDasha?.mainPeriod !== 'Unknown' ? 
            "Consider the combined effect of both planetary periods" :
            "Transit effects are analyzed for practical guidance",
          "Practice patience and positive karma during this planetary period"
        ].filter(Boolean)
      }
    };
  };

  const getMockPrediction = (data) => {
    return {
      success: true,
      data: {
        monthlyOverview: {
          title: `${monthNames[data.selectedMonth - 1]} ${data.selectedYear} Overview`,
          description: `This month brings a blend of opportunities and challenges based on your birth chart. The current transits suggest a period of transformation and growth.`,
          overallRating: 4,
          keyTheme: "Transformation and New Beginnings"
        },
        predictions: [
          {
            category: "Career & Profession",
            icon: "Briefcase",
            rating: 4,
            description: "Professional growth is highlighted this month. Your natural leadership abilities will be recognized, leading to new opportunities. The transit of Jupiter through your 10th house suggests career advancement.",
            keyPoints: [
              "Excellent time for job interviews and promotions",
              "New projects may require your expertise",
              "Networking will prove beneficial",
              "Avoid hasty decisions in the last week"
            ]
          },
          {
            category: "Relationships & Love",
            icon: "Heart",
            rating: 3,
            description: "Mixed influences in personal relationships. While Venus brings harmony in the first half, Mars transit may create some tension. Communication will be key to maintaining balance.",
            keyPoints: [
              "Good time for marriage discussions",
              "Existing relationships need patience",
              "Family gatherings bring joy",
              "Avoid arguments during Mercury retrograde"
            ]
          },
          {
            category: "Health & Wellness",
            icon: "Heart",
            rating: 3,
            description: "Focus on preventive healthcare this month. The planetary configuration suggests minor health concerns related to stress. Regular exercise and meditation will be beneficial.",
            keyPoints: [
              "Monitor stress levels carefully",
              "Digestive issues may arise",
              "Good time for starting new fitness routines",
              "Avoid overexertion in the third week"
            ]
          },
          {
            category: "Finances",
            icon: "DollarSign",
            rating: 4,
            description: "Financial stability is indicated with opportunities for additional income. Saturn's influence brings discipline in spending habits. Good time for investments.",
            keyPoints: [
              "Unexpected income sources possible",
              "Avoid impulsive purchases",
              "Real estate investments favored",
              "Debts can be cleared gradually"
            ]
          },
          {
            category: "Spiritual Growth",
            icon: "Sparkles",
            rating: 5,
            description: "Excellent period for spiritual practices and self-reflection. The alignment of planets supports meditation, learning, and inner transformation.",
            keyPoints: [
              "Perfect time for starting meditation",
              "Spiritual teachers may enter your life",
              "Dreams and intuition are heightened",
              "Pilgrimage or spiritual travel favored"
            ]
          }
        ],
        favorableDates: [
          { date: `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-07`, activity: "Important meetings and decisions" },
          { date: `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-15`, activity: "Financial transactions and investments" },
          { date: `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-23`, activity: "Relationship discussions and proposals" }
        ],
        remedies: [
          "Chant 'Om Gam Ganapataye Namaha' 108 times daily",
          "Wear a blue sapphire or blue cloth on Saturdays",
          "Donate food to the needy on Thursdays",
          "Perform Surya Namaskar at sunrise",
          "Meditate for 15 minutes daily during sunset"
        ],
        dashaInfluence: {
          title: `${data.currentDasha?.mainPeriod || 'Current'} Mahadasha - ${data.currentDasha?.subPeriod || 'Current'} Antardasha Impact`,
          description: `The current ${data.currentDasha?.mainPeriod || 'planetary'} Mahadasha and ${data.currentDasha?.subPeriod || 'planetary'} Antardasha combination brings specific influences according to Vimshottari Dasha system. These planetary periods shape your monthly experience and help in understanding the timing of events.`,
          effects: [
            `${data.currentDasha?.mainPeriod || 'Current'} Mahadasha brings its characteristic influences`,
            `${data.currentDasha?.subPeriod || 'Current'} Antardasha modifies the main period effects`,
            "Understanding dasha timing helps in planning important decisions",
            "Practice remedies specific to the ruling planets"
          ]
        }
      }
    };
  };
  useEffect(() => {
    // Only start monthly prediction after all required data is available
    // This ensures Dasha data extraction is complete before starting prediction
    let debounceTimer;
    
    if (chartData && birthDetails && (currentDasha || dashaData)) {
      console.log('🔄 All required data available - triggering monthly prediction generation:', {
        hasChartData: !!chartData,
        hasBirthDetails: !!birthDetails,
        hasCurrentDasha: !!currentDasha,
        extractedMahadasha: currentDasha?.currentMahadasha?.planet,
        extractedAntardasha: currentDasha?.currentAntardasha?.planet,
        selectedMonth,
        selectedYear
      });
      
      debounceTimer = setTimeout(() => {
        generateMonthlyPrediction();
      }, 500);  // 500ms debounce to ensure data is fully processed
    }
    
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashaData, currentDasha, selectedMonth, selectedYear]);  // Dependencies that should trigger regeneration
  

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="Star"
        size={16}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">
            Monthly Prediction
          </h2>
          <p className="text-text-secondary">
            AI-powered analysis of current transits and their impact on your chart
          </p>
        </div>
        
        {/* Month/Year Selector */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          
          <Button
            onClick={generateMonthlyPrediction}
            disabled={isLoading}
            iconName="RefreshCw"
            iconPosition="left"
            size="sm"
          >
            {isLoading ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>
      </div>

      {/* Loading State for dasha data */}
      {!currentDasha && !isLoading && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <Icon name="Clock" size={32} className="text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading Dasha data...</p>
          <p className="text-sm text-text-muted mt-2">Waiting for planetary period calculations to complete</p>
        </div>
      )}

      {/* Loading State for prediction generation */}
      {isLoading && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <Icon name="Loader2" size={32} className="text-primary mx-auto mb-4 animate-spin" />
          <p className="text-text-secondary">Analyzing your chart and current transits...</p>
          <p className="text-sm text-text-muted mt-2">This may take a few moments</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 text-center">
          <Icon name="AlertCircle" size={32} className="text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-error mb-2">Error Generating Prediction</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={generateMonthlyPrediction} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Monthly Overview */}
      {predictions && !isLoading && (
        <>
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-semibold text-text-primary">
                {predictions.monthlyOverview.title}
              </h3>
              <div className="flex items-center space-x-1">
                {getRatingStars(predictions.monthlyOverview.overallRating)}
              </div>
            </div>
            
            <div className="mb-4 flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {predictions.monthlyOverview.keyTheme}
              </span>
              {predictions.isAIGenerated === true && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                  <Icon name="Sparkles" size={12} className="mr-1" />
                  AI Generated
                </span>
              )}
              {predictions.isAIGenerated === false && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                  <Icon name="AlertTriangle" size={12} className="mr-1" />
                  Mock Data
                </span>
              )}
            </div>
            
            <TypewriterText
              text={predictions.monthlyOverview.description}
              className="text-text-secondary leading-relaxed"
              speed={50}
            />
          </div>

          {/* Prediction Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.predictions.map((prediction, index) => (
              <div
                key={index}
                className="bg-surface border border-border rounded-xl p-6 hover:shadow-strong transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon name={prediction.icon} size={20} className="text-primary" />
                    </div>
                    <h4 className="font-heading font-semibold text-text-primary">
                      {prediction.category}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getRatingStars(prediction.rating)}
                  </div>
                </div>
                
                <p className="text-text-secondary mb-4 leading-relaxed">
                  {prediction.description}
                </p>
                
                <div className="space-y-2">
                  <h5 className="font-medium text-text-primary">Key Points:</h5>
                  <ul className="space-y-1">
                    {prediction.keyPoints.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start space-x-2 text-sm">
                        <Icon name="CheckCircle" size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-text-secondary">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Favorable Dates */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center">
              <Icon name="Calendar" size={20} className="mr-2 text-accent" />
              Favorable Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictions.favorableDates.map((item, index) => (
                <div key={index} className="bg-surface-secondary rounded-lg p-4 text-center">
                  <div className="text-lg font-semibold text-primary mb-1">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {item.activity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dasha Influence */}
          {predictions.dashaInfluence && (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center">
                <Icon name="Clock" size={20} className="mr-2 text-accent" />
                {predictions.dashaInfluence.title}
              </h3>
              <p className="text-text-secondary mb-4">{predictions.dashaInfluence.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predictions.dashaInfluence.effects.map((effect, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Icon name="ArrowRight" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-secondary">{effect}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remedies */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center">
              <Icon name="Shield" size={20} className="mr-2 text-accent" />
              Recommended Remedies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predictions.remedies.map((remedy, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Icon name="Star" size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{remedy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-surface-secondary border border-border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-text-primary mb-1">
                  {predictions.isAIGenerated === true ? 'AI-Generated Prediction' : 'Sample Prediction'}
                </h4>
                <p className="text-sm text-text-secondary">
                  {predictions.isAIGenerated === true ? (
                    'This prediction is generated using AI analysis of your birth chart and current planetary transits. While based on traditional Vedic astrology principles, it should be used as guidance rather than absolute truth. For personalized consultation, consider speaking with a qualified astrologer.'
                  ) : (
                    'This is sample prediction data displayed when the AI service is unavailable. For accurate predictions based on your birth chart, please ensure your internet connection is stable and try regenerating the prediction.'
                  )}
                </p>
                {predictions.fallbackReason && (
                  <p className="text-xs text-warning mt-2">
                    <strong>Note:</strong> {predictions.fallbackReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyPredictionSection;
