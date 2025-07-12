import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import TypewriterText from '../../../components/ui/TypewriterText';
import { getPlanetaryTransits } from '../../../services/api';

const MonthlyPredictionSection = ({ chartData, currentDasha, birthDetails }) => {
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

      console.log('🔄 Generating monthly prediction with data:', {
        hasChartData: !!chartData,
        hasBirthDetails: !!birthDetails,
        hasCurrentDasha: !!currentDasha,
        selectedMonth,
        selectedYear,
        chartData: chartData ? Object.keys(chartData) : null,
        birthDetails: birthDetails ? Object.keys(birthDetails) : null
      });

      // Get current transits for the selected month
      const transitResponse = await getPlanetaryTransits(selectedYear, 'UTC');
      const currentTransits = transitResponse.success ? transitResponse.data.transits : [];

      // Prepare data for AI analysis
      const analysisData = {
        birthDetails: birthDetails,
        chartData: chartData,
        currentDasha: currentDasha,
        currentTransits: currentTransits,
        selectedMonth: selectedMonth,
        selectedYear: selectedYear,
        natalChart: {
          ascendant: chartData?.ascendant || 'Aries',
          moonSign: chartData?.moonSign || 'Aries',
          sunSign: chartData?.sunSign || 'Aries',
          planets: chartData?.planets || []
        }
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
      
      // Call the AI service (using meta-llama/llama-3.3-70b-instruct:free)
      const API_BASE_URL = import.meta.env.VITE_API_URL || (
        import.meta.env.PROD 
          ? 'https://astrova-backend.onrender.com' 
          : 'http://localhost:3001'
      );
      
      const response = await fetch(`${API_BASE_URL}/api/ai/monthly-prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free', // Use meta-llama for Monthly Prediction
          prompt: prompt,
          chartData: data.chartData,
          dashaData: data.currentDasha,
          birthDetails: data.birthDetails,
          planetaryTransits: data.currentTransits,
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
        // Transform backend response to match frontend expectations
        const transformedData = transformBackendPrediction(result.prediction, data);
        // Mark as real AI data
        transformedData.isAIGenerated = true;
        transformedData.note = result.note;
        
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
    return `
As an expert Vedic astrologer, analyze the following birth chart and current transits to provide a comprehensive monthly prediction for ${monthNames[data.selectedMonth - 1]} ${data.selectedYear}.

BIRTH DETAILS:
- Ascendant (Lagna): ${data.natalChart.ascendant}
- Moon Sign (Rashi): ${data.natalChart.moonSign}
- Sun Sign: ${data.natalChart.sunSign}
- Birth Date: ${data.birthDetails?.birthDate || 'Not available'}
- Birth Time: ${data.birthDetails?.birthTime || 'Not available'}
- Birth Location: ${data.birthDetails?.birthLocation || 'Not available'}

CURRENT DASHA:
- Main Period: ${data.currentDasha?.mainPeriod || 'Not available'}
- Sub Period: ${data.currentDasha?.subPeriod || 'Not available'}
- Duration: ${data.currentDasha?.duration || 'Not available'}

CURRENT TRANSITS:
${data.currentTransits.map(transit => 
  `- ${transit.planet}: ${transit.fromSign} → ${transit.toSign} (${transit.ingressDate})`
).join('\n')}

Please provide a detailed monthly prediction covering:
1. Overall theme and energy for the month (at least 3-4 sentences)
2. Career and profession prospects (detailed description with specific opportunities and challenges)
3. Relationships and personal life (romantic, family, friendships with specific advice)
4. Health and wellness guidance (physical and mental health with specific recommendations)
5. Financial outlook (income, expenses, investments, savings with specific advice)
6. Spiritual and personal growth (growth opportunities, practices, insights)
7. Favorable dates for general activities, career, relationships, health, and finances
8. Daily, weekly, and monthly remedies including gemstones, colors, and mantras
9. Dasha impact analysis based on current planetary periods

Be very specific and detailed in each section. Provide at least 2-3 sentences for each area description and 3-5 key points for each category. Include practical, actionable advice that the person can implement.
    `;
  };

  const transformBackendPrediction = (backendPrediction, data) => {
    // Transform the backend response to match the frontend expected format
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    console.log('🔍 Transforming backend prediction:', backendPrediction);

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
            const day = parseInt(dayMatch[0]);
            return {
              date: `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
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
        
        return dates.length > 0 ? dates.slice(0, 5) : [
          { date: `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-07`, activity: "Important meetings and decisions" },
          { date: `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-15`, activity: "Financial transactions and investments" },
          { date: `${data.selectedYear}-${data.selectedMonth.toString().padStart(2, '0')}-23`, activity: "Relationship discussions and proposals" }
        ];
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
        title: backendPrediction.dashaImpact?.period || `${data.currentDasha?.mainPeriod || 'Current'} Dasha Impact`,
        description: backendPrediction.dashaImpact?.influence || 'The current dasha period brings specific influences that shape your monthly experience.',
        effects: [
          backendPrediction.dashaImpact?.effects || "Focus on personal growth and positive karma",
          backendPrediction.dashaImpact?.duration || "Effects vary based on planetary periods",
          "Maintain spiritual practices",
          "Practice patience and understanding"
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
          description: `This month brings a blend of opportunities and challenges for ${data.natalChart.ascendant} Ascendant individuals. The current transits suggest a period of transformation and growth.`,
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
          title: `${data.currentDasha?.mainPeriod || 'Current'} Dasha Impact`,
          description: `The current dasha period brings specific influences that shape your monthly experience. Understanding these planetary periods helps in making informed decisions.`,
          effects: [
            "Enhanced intuition and psychic abilities",
            "Focus on long-term planning and goals",
            "Increased responsibility in professional life",
            "Need for patience in personal relationships"
          ]
        }
      }
    };
  };

  useEffect(() => {
    // Only generate prediction if we have required data
    if (chartData && birthDetails) {
      console.log('🔄 Triggering monthly prediction generation');
      generateMonthlyPrediction();
    } else {
      console.warn('⚠️ Skipping monthly prediction - missing required data:', {
        hasChartData: !!chartData,
        hasBirthDetails: !!birthDetails
      });
    }
  }, [selectedMonth, selectedYear]); // Remove chartData and birthDetails to prevent infinite loop

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

      {/* Loading State */}
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
