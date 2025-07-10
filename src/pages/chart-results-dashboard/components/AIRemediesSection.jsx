import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { generateAstrologicalInterpretation } from '../../../services/deepseekApi';
import { generateCacheKey, getCachedInterpretation, setCachedInterpretation } from '../../../services/interpretationCache';

const AIRemediesSection = ({ chartData, birthDetails, dashaData }) => {
  const [remedies, setRemedies] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Mock remedies data (fallback)
  const mockRemedies = {
    gemstones: [
      { name: 'Red Coral (Moonga)', planet: 'Mars', instruction: 'Wear on Tuesday' },
      { name: 'Yellow Sapphire (Pukhraj)', planet: 'Jupiter', instruction: 'Wear on Thursday' }
    ],
    mantras: [
      { name: 'Hanuman Chalisa', instruction: 'Daily recitation for Mars' },
      { name: 'Guru Mantra', instruction: '108 times on Thursday' }
    ],
    donations: [
      { item: 'Red lentils', instruction: 'Donate on Tuesday for Mars' },
      { item: 'Yellow items', instruction: 'Donate on Thursday for Jupiter' }
    ],
    fasting: [
      { day: 'Tuesday', instruction: 'For Mars strength' },
      { day: 'Thursday', instruction: 'For Jupiter blessings' }
    ]
  };

  // Generate remedies on mount
  useEffect(() => {
    if (chartData && !remedies) {
      generateRemedies();
    }
  }, [chartData, remedies]);

  const generateRemedies = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Check cache first
      const cacheKey = generateCacheKey(chartData, birthDetails) + '_remedies';
      const cachedResult = getCachedInterpretation(cacheKey);
      
      if (cachedResult) {
        console.log('✅ Using cached remedies');
        setRemedies(cachedResult);
        setIsGenerating(false);
        return;
      }
      
      // Prepare data for AI
      const remedyData = {
        chartData,
        birthDetails,
        dashaData,
        focus: 'remedies',
        timestamp: new Date().toISOString()
      };
      
      const result = await generateAstrologicalInterpretation(remedyData, {
        focus: 'remedies',
        temperature: 0.2,
        max_tokens: 2000
      });
      
      if (result.success) {
        console.log('Raw AI response for remedies:', result.interpretation);
        const parsedRemedies = parseRemediesResponse(result.interpretation);
        setRemedies(parsedRemedies);
        
        // Cache the result
        setCachedInterpretation(cacheKey, parsedRemedies);
      } else {
        setError(result.error);
        setRemedies(mockRemedies);
      }
    } catch (error) {
      console.error('Error generating remedies:', error);
      setError(error.message);
      setRemedies(mockRemedies);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseRemediesResponse = (response) => {
    try {
      // First try to parse as-is (API layer should have already processed it)
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch (error) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1].trim());
          } catch (parseError) {
            console.warn('Failed to parse JSON from markdown:', parseError);
          }
        }
        
        // Try to find JSON object in the response
        if (!parsed) {
          const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            try {
              parsed = JSON.parse(jsonObjectMatch[0]);
            } catch (parseError) {
              console.warn('Failed to parse extracted JSON object:', parseError);
            }
          }
        }
      }
      
      if (parsed && typeof parsed === 'object') {
        // Validate that we have the required structure
        const validRemedies = {
          gemstones: Array.isArray(parsed.gemstones) ? parsed.gemstones : mockRemedies.gemstones,
          mantras: Array.isArray(parsed.mantras) ? parsed.mantras : mockRemedies.mantras,
          donations: Array.isArray(parsed.donations) ? parsed.donations : mockRemedies.donations,
          fasting: Array.isArray(parsed.fasting) ? parsed.fasting : mockRemedies.fasting
        };
        
        console.log('Successfully parsed remedies:', validRemedies);
        return validRemedies;
      }
    } catch (error) {
      console.warn('Failed to parse remedies response:', error);
    }
    
    console.warn('Failed to parse remedies response as JSON, using mock data');
    console.log('Raw response:', response);
    return mockRemedies;
  };

  const data = remedies || mockRemedies;

  return (
    <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Icon name="Shield" size={20} className="text-warning" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary">
            Recommended Remedies
          </h3>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Icon name="Sparkles" size={16} />
          <span className="font-caption">
            {isGenerating ? 'Generating Remedies...' : 
             (remedies && remedies !== mockRemedies) ? 'AI Generated' : 'Demo Mode'}
          </span>
          {isGenerating && (
            <Icon name="Loader2" size={16} className="animate-spin text-primary" />
          )}
        </div>
      </div>
      
      {isGenerating ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Icon name="Loader2" size={32} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-text-muted">Generating personalized remedies...</p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gemstone Recommendations */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-text-primary">Gemstone Recommendations</h4>
            <div className="space-y-2">
              {data.gemstones.map((gemstone, index) => (
                <div key={index} className="p-3 bg-surface-secondary rounded-lg">
                  <div className="font-medium text-text-primary">{gemstone.name}</div>
                  <div className="text-sm text-text-muted">
                    {gemstone.planet && `For ${gemstone.planet} - `}{gemstone.instruction}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mantras & Prayers */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-text-primary">Mantras & Prayers</h4>
            <div className="space-y-2">
              {data.mantras.map((mantra, index) => (
                <div key={index} className="p-3 bg-surface-secondary rounded-lg">
                  <div className="font-medium text-text-primary">{mantra.name}</div>
                  <div className="text-sm text-text-muted">{mantra.instruction}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Donations */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-text-primary">Charitable Donations</h4>
            <div className="space-y-2">
              {data.donations.map((donation, index) => (
                <div key={index} className="p-3 bg-surface-secondary rounded-lg">
                  <div className="font-medium text-text-primary">{donation.item}</div>
                  <div className="text-sm text-text-muted">{donation.instruction}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Fasting */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold text-text-primary">Fasting Recommendations</h4>
            <div className="space-y-2">
              {data.fasting.map((fast, index) => (
                <div key={index} className="p-3 bg-surface-secondary rounded-lg">
                  <div className="font-medium text-text-primary">{fast.day}</div>
                  <div className="text-sm text-text-muted">{fast.instruction}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <span className="text-sm text-error">Failed to generate remedies: {error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRemediesSection;
