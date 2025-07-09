import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { generateAstrologicalInterpretation } from '../../../services/deepseekApi';
import { generateCacheKey, getCachedInterpretation, setCachedInterpretation, clearExpiredCache } from '../../../services/interpretationCache';
import ProgressiveLoader from '../../../components/ui/ProgressiveLoader';
import performanceMonitor from '../../../utils/performanceMonitor';

const AIInterpretationSection = ({ interpretationData, chartData, birthDetails, dashaData }) => {
  const [expandedSection, setExpandedSection] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customInterpretation, setCustomInterpretation] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [generatedInterpretation, setGeneratedInterpretation] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState([]);

  // Loading steps for progressive enhancement
  const interpretationSteps = [
    { title: 'Analyzing Birth Chart', description: 'Examining planetary positions and houses' },
    { title: 'Evaluating Dasha Periods', description: 'Analyzing current and upcoming planetary periods' },
    { title: 'Identifying Yogas & Doshas', description: 'Finding astrological combinations and patterns' },
    { title: 'Generating Personality Insights', description: 'Creating overview and character analysis' },
    { title: 'Analyzing Life Areas', description: 'Interpreting career, relationships, health, and wealth' },
    { title: 'Finalizing Interpretation', description: 'Compiling comprehensive analysis' }
  ];

  // Mock AI interpretation data (fallback)
  const mockInterpretationData = {
    overview: {
      title: 'Chart Overview',
      icon: 'Eye',
      content: `Your birth chart reveals a dynamic personality with strong leadership qualities. The Sun in Aries in the 1st house indicates natural leadership abilities and pioneering spirit.\n\nJupiter's placement in the 5th house brings creativity, wisdom, and good fortune in matters related to education, children, and speculative ventures. The exalted Moon in Cancer shows emotional depth and strong intuitive abilities.\n\nThe presence of Mars in the 7th house suggests an active approach to partnerships and relationships, though care should be taken to avoid conflicts with business partners or spouse.`,
      keyPoints: [
        'Strong leadership and pioneering spirit','Excellent creative and intellectual abilities','Deep emotional intelligence and intuition','Active approach to relationships and partnerships'
      ]
    },
    // ... keep existing mock data structure ...
    career: {
      title: 'Career & Profession',icon: 'Briefcase',
      content: `Your career path is strongly influenced by the Sun-Mercury conjunction in Aries, indicating success in leadership roles, entrepreneurship, or fields requiring quick decision-making.\n\nJupiter in Leo in the 5th house suggests careers in education, entertainment, creative fields, or working with children. The strong placement also indicates potential for government positions or advisory roles.\n\nSaturn's influence suggests steady progress through hard work and discipline. Avoid hasty career changes during Saturn's transit periods.`,
      keyPoints: [
        'Natural leadership and entrepreneurial abilities','Success in education, creative, or entertainment fields','Government positions or advisory roles favorable','Steady progress through disciplined approach'
      ],
      recommendations: [
        'Consider leadership or management positions','Explore opportunities in education or creative industries','Build long-term career strategies rather than quick changes','Leverage communication skills for professional growth'
      ]
    },
    relationships: {
      title: 'Relationships & Marriage',icon: 'Heart',
      content: `Venus exalted in Taurus in the 2nd house brings harmony in relationships and attracts material comforts through partnerships. You have a natural charm and ability to maintain long-lasting relationships.\n\nMars in the 7th house indicates an active and sometimes challenging approach to partnerships. Your spouse may be energetic, ambitious, and possibly from a different cultural background.\n\nThe Moon in Cancer provides emotional depth and nurturing qualities, making you a caring and supportive partner. However, be mindful of mood swings affecting relationships.`,
      keyPoints: [
        'Natural charm and ability to attract partners','Long-lasting and harmonious relationships','Spouse likely to be energetic and ambitious','Strong nurturing and caring qualities'
      ],
      recommendations: [
        'Practice patience in partnerships','Communicate openly about emotional needs','Avoid making relationship decisions during emotional highs/lows','Focus on building mutual respect and understanding'
      ]
    },
    health: {
      title: 'Health & Wellness',icon: 'Activity',
      content: `Your health profile shows generally good vitality with the Sun strongly placed in Aries. However, Mars in Libra suggests potential issues with kidneys, lower back, or reproductive system.\n\nThe Moon in Cancer indicates a sensitive digestive system and potential for water retention or emotional eating patterns. Regular exercise and stress management are crucial for maintaining optimal health.\n\nSaturn's influence suggests the need for disciplined health routines and preventive care, especially regarding bones, teeth, and chronic conditions.`,
      keyPoints: [
        'Generally good vitality and energy levels',
        'Attention needed for kidney and lower back health',
        'Sensitive digestive system requiring care',
        'Importance of regular exercise and stress management'
      ],
      recommendations: [
        'Maintain regular exercise routine, especially cardio',
        'Follow a balanced diet with attention to digestive health',
        'Practice stress management techniques like meditation',
        'Regular health check-ups for preventive care'
      ]
    },
    wealth: {
      title: 'Wealth & Finance',
      icon: 'DollarSign',
      content: `Venus in the 2nd house indicates good earning potential and ability to accumulate wealth through personal efforts and partnerships. You have a natural talent for managing resources and creating financial stability.\n\nJupiter's aspect on the 2nd house brings expansion in wealth and multiple income sources. However, be cautious of overspending during Jupiter's transit periods.\n\nSaturn's influence suggests wealth accumulation through patient, long-term investments rather than speculative ventures. Property investments may prove particularly beneficial.`,
      keyPoints: [
        'Good earning potential and resource management','Multiple income sources and financial expansion','Wealth through partnerships and collaborations','Long-term investments more favorable than speculation'
      ],
      recommendations: [
        'Focus on building multiple income streams','Invest in long-term, stable financial instruments','Consider property investments for wealth building','Avoid impulsive financial decisions during emotional periods'
      ]
    },
    spirituality: {
      title: 'Spirituality & Growth',icon: 'Compass',content: `Your spiritual journey is marked by Jupiter's strong placement, indicating natural wisdom and inclination towards higher learning and philosophical pursuits.\n\nThe Moon in Cancer provides deep intuitive abilities and connection to ancestral wisdom. You may find spiritual fulfillment through nurturing others and connecting with your roots.\n\nKetu's placement suggests past-life spiritual practices and natural detachment from material pursuits when seeking higher consciousness. Meditation and introspective practices will be particularly beneficial.`,
      keyPoints: [
        'Natural wisdom and philosophical inclinations','Strong intuitive abilities and ancestral connections','Past-life spiritual practices and natural detachment','Meditation and introspection highly beneficial'
      ],
      recommendations: [
        'Explore philosophical and spiritual studies','Practice regular meditation and mindfulness','Connect with ancestral traditions and wisdom','Balance material pursuits with spiritual growth'
      ]
    }
  };

  // Helper function to extract JSON from AI response
  const extractJsonFromAIResponse = (response) => {
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

  // Generate interpretation on mount if chart data is available
  useEffect(() => {
    if (chartData && isInitialLoad && !interpretationData) {
      generateInitialInterpretation();
    }
  }, [chartData, isInitialLoad, interpretationData]);

  const generateInitialInterpretation = async () => {
    setIsGenerating(true);
    setIsInitialLoad(false);
    
    // Start performance monitoring
    performanceMonitor.startTimer('ai_interpretation_generation');
    
    try {
      // Clear expired cache entries
      clearExpiredCache();
      
      // Check cache first
      const cacheKey = generateCacheKey(chartData, birthDetails);
      const cachedResult = getCachedInterpretation(cacheKey);
      
      if (cachedResult) {
        console.log('✅ Using cached interpretation');
        setGeneratedInterpretation(cachedResult);
        setIsGenerating(false);
        performanceMonitor.endTimer('ai_interpretation_generation');
        return;
      }
      
      // Prepare comprehensive data for AI interpretation
      const interpretationData = {
        chartData,
        birthDetails,
        dashaData,
        timestamp: new Date().toISOString()
      };
      
      const result = await generateAstrologicalInterpretation(interpretationData);
      
      if (result.success) {
        const parsedInterpretation = extractJsonFromAIResponse(result.interpretation);
        
        if (parsedInterpretation) {
          const formattedInterpretation = formatAIInterpretation(parsedInterpretation);
          setGeneratedInterpretation(formattedInterpretation);
          
          // Cache the successful result
          setCachedInterpretation(cacheKey, formattedInterpretation);
        } else {
          console.warn('Could not parse AI interpretation as JSON, using raw text');
          // Use raw interpretation if parsing fails
          const rawInterpretation = {
            overview: {
              title: 'Chart Overview',
              icon: 'Eye',
              content: result.interpretation,
              keyPoints: ['AI generated interpretation'],
              aiGenerated: true
            }
          };
          setGeneratedInterpretation(rawInterpretation);
          
          // Cache even the raw result
          setCachedInterpretation(cacheKey, rawInterpretation);
        }
      } else {
        console.error('Failed to generate initial interpretation:', result.error);
      }
    } catch (error) {
      console.error('Error generating initial interpretation:', error);
    } finally {
      setIsGenerating(false);
      performanceMonitor.endTimer('ai_interpretation_generation');
    }
  };

  const formatAIInterpretation = (aiData) => {
    const formatSection = (sectionData, key, icon) => ({
      title: sectionData.title || {
        "overview": "Chart Overview",
        "career": "Career & Profession",
        "relationships": "Relationships & Marriage",
        "health": "Health & Wellness",
        "wealth": "Wealth & Finance",
        "spirituality": "Spirituality & Growth"
      }[key] || `${key.charAt(0).toUpperCase() + key.slice(1)} Analysis`,
      icon: icon,
      content: sectionData.content || 'No content available',
      keyPoints: sectionData.key_traits || sectionData.keyPoints || sectionData.suitable_fields || sectionData.health_strengths || sectionData.income_sources || sectionData.spiritual_practices || [],
      recommendations: sectionData.recommendations || sectionData.remedial_measures || sectionData.remedial_actions || [],
      aiGenerated: true
    });

    return {
      overview: formatSection(aiData.overall_personality || aiData.overview || {}, 'overview', 'Eye'),
      career: formatSection(aiData.career_profession || aiData.career || {}, 'career', 'Briefcase'),
      relationships: formatSection(aiData.relationships_marriage || aiData.relationships || {}, 'relationships', 'Heart'),
      health: formatSection(aiData.health_wellness || aiData.health || {}, 'health', 'Activity'),
      wealth: formatSection(aiData.wealth_finance || aiData.wealth || {}, 'wealth', 'DollarSign'),
      spirituality: formatSection(aiData.spirituality_growth || aiData.spirituality || {}, 'spirituality', 'Compass')
    };
  };

  // Use provided interpretation data or generated data or fallback to mock data
  const data = interpretationData || customInterpretation || generatedInterpretation || mockInterpretationData;

  const toggleSection = (sectionKey) => {
    setExpandedSection(expandedSection === sectionKey ? null : sectionKey);
  };

  const regenerateInterpretation = async (sectionKey) => {
    if (!chartData) {
      console.warn('No chart data available for regeneration');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Prepare comprehensive data for AI interpretation
      const interpretationData = {
        chartData,
        birthDetails,
        dashaData,
        focus: sectionKey,
        timestamp: new Date().toISOString()
      };
      
      // Generate new interpretation using AI API
      const result = await generateAstrologicalInterpretation(interpretationData, {
        focus: sectionKey,
        temperature: 0.4 // Slightly more creative for regeneration
      });

      if (result.success) {
        const newInterpretation = extractJsonFromAIResponse(result.interpretation);
        
        if (newInterpretation) {
          setCustomInterpretation(prev => ({
            ...prev,
            [sectionKey]: {
              ...data[sectionKey],
              content: newInterpretation[sectionKey]?.content || newInterpretation.content,
              keyPoints: newInterpretation[sectionKey]?.keyPoints || newInterpretation.keyPoints,
              recommendations: newInterpretation[sectionKey]?.recommendations || newInterpretation.recommendations,
              aiGenerated: true
            }
          }));
        } else {
          // If JSON parsing fails, use the raw text
          setCustomInterpretation(prev => ({
            ...prev,
            [sectionKey]: {
              ...data[sectionKey],
              content: result.interpretation,
              keyPoints: [`Generated interpretation for ${sectionKey}`],
              aiGenerated: true
            }
          }));
        }
      } else {
        console.error('Failed to regenerate interpretation:', result.error);
        // Fallback to mock regeneration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error regenerating interpretation:', error);
      // Simulate regeneration as fallback
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsGenerating(false);
    }
  };

  const getSectionColor = (sectionKey) => {
    const colors = {
      overview: 'text-primary',
      career: 'text-accent',
      relationships: 'text-error',
      health: 'text-success',
      wealth: 'text-warning',
      spirituality: 'text-secondary'
    };
    return colors[sectionKey] || 'text-text-primary';
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-semibold text-text-primary">
          AI Chart Interpretation
        </h3>
        
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Icon name="Sparkles" size={16} />
          <span className="font-caption">
            {isGenerating ? 'Generating AI Interpretation...' : 
             (interpretationData || generatedInterpretation) ? 'AI Generated' : 'Demo Mode'}
          </span>
          {isGenerating && (
            <Icon name="Loader2" size={16} className="animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 p-2 bg-surface-secondary rounded-lg">
        {Object.entries(data).map(([key, section]) => (
          <button
            key={key}
            onClick={() => toggleSection(key)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-celestial
              ${expandedSection === key
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }
            `}
          >
            <Icon name={section.icon} size={16} />
            <span>{section.title}</span>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {isGenerating && !generatedInterpretation ? (
          <div className="border border-border-light rounded-lg p-6 bg-surface-secondary">
            <ProgressiveLoader 
              isLoading={isGenerating}
              steps={interpretationSteps}
            />
          </div>
        ) : (
          Object.entries(data).map(([key, section]) => (
            <div
              key={key}
              className={`
                transition-all duration-300 overflow-hidden
                ${expandedSection === key ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              {expandedSection === key && (
                <div className="border border-border-light rounded-lg p-6 bg-surface-secondary">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-surface ${getSectionColor(key)}`}>
                        <Icon name={section.icon} size={20} />
                      </div>
                      <h4 className="text-lg font-heading font-semibold text-text-primary">
                        {section.title}
                      </h4>
                      {section.aiGenerated && (
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          AI Generated
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => regenerateInterpretation(key)}
                      disabled={isGenerating}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-text-muted hover:text-primary transition-celestial disabled:opacity-50"
                    >
                      <Icon 
                        name="RefreshCw" 
                        size={14} 
                        className={isGenerating ? 'animate-spin' : ''}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>
  
                  {/* Main Content */}
                  <div className="prose prose-sm max-w-none mb-6">
                    <div className="text-text-secondary leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>

                  {/* Key Points */}
                  {section.keyPoints && (
                    <div className="mb-6">
                      <h5 className="font-heading font-semibold text-text-primary mb-3">
                        Key Insights
                      </h5>
                      <div className="grid md:grid-cols-2 gap-2">
                        {section.keyPoints.map((point, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Icon name="CheckCircle" size={16} className="text-success mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-text-secondary">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
  
                  {/* Recommendations */}
                  {section.recommendations && (
                    <div>
                      <h5 className="font-heading font-semibold text-text-primary mb-3">
                        Recommendations
                      </h5>
                      <div className="space-y-2">
                        {section.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Icon name="Lightbulb" size={16} className="text-warning mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-text-secondary">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* AI Disclaimer */}
      <div className="mt-6 pt-4 border-t border-border-light">
        <div className="flex items-start space-x-2 text-xs text-text-muted">
          <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
          <p className="font-caption leading-relaxed">
            {(interpretationData || generatedInterpretation) 
              ? 'This interpretation is generated by AI using advanced language models (Llama 3.3, Shisa, DeepSeek) based on traditional Vedic astrology principles.' 
              : 'The AI will automatically generate personalized insights when you provide your birth chart data.'}
            For personalized guidance, consider consulting with a qualified astrologer. 
            The insights provided are for educational and entertainment purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIInterpretationSection;