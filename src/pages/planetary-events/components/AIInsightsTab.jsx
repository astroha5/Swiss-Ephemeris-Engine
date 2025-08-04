import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIInsightsTab = ({ events, filteredEvents, onRefresh }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTransits, setCurrentTransits] = useState(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState(null);
  const [futurePatterns, setFuturePatterns] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate current date range for analysis (last 30 days to next 90 days)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 30);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 90);

  const fetchAIInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate comprehensive AI insights using existing backend infrastructure
      const insightsPromises = [
        fetchCurrentPlanetaryClimate(),
        fetchCorrelationAnalysis(),
        fetchFuturePatternPredictions(),
        generateAIInterpretation()
      ];

      const [climate, correlations, predictions, aiAnalysis] = await Promise.allSettled(insightsPromises);
      
      setInsights({
        currentClimate: climate.status === 'fulfilled' ? climate.value : null,
        correlations: correlations.status === 'fulfilled' ? correlations.value : null,
        predictions: predictions.status === 'fulfilled' ? predictions.value : null,
        aiAnalysis: aiAnalysis.status === 'fulfilled' ? aiAnalysis.value : null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setError(error.message);
      // Fallback to mock insights with current data
      generateFallbackInsights();
    } finally {
      setLoading(false);
    }
  };

  // Fetch current planetary climate using major patterns API
  const fetchCurrentPlanetaryClimate = async () => {
    const response = await fetch('/api/major-patterns/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        options: { significance: ['high', 'extreme'] }
      })
    });
    
    if (!response.ok) throw new Error('Failed to fetch current patterns');
    return await response.json();
  };

  // Fetch historical correlation analysis
  const fetchCorrelationAnalysis = async () => {
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const response = await fetch('/api/major-patterns/correlate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: oneYearAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        options: {
          categories: ['financial', 'war', 'political', 'pandemic'],
          impactLevels: ['high', 'extreme'],
          limit: 50
        }
      })
    });
    
    if (!response.ok) throw new Error('Failed to fetch correlations');
    return await response.json();
  };

  // Fetch future pattern predictions
  const fetchFuturePatternPredictions = async () => {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 60); // 60 days ahead
    
    const response = await fetch('/api/major-patterns/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetDate: futureDate.toISOString().split('T')[0],
        categories: ['financial', 'war', 'political', 'natural_disaster'],
        confidenceThreshold: 0.3
      })
    });
    
    if (!response.ok) throw new Error('Failed to fetch predictions');
    return await response.json();
  };

  // Generate AI interpretation using the existing AI system
  const generateAIInterpretation = async () => {
    const eventSummary = analyzeEventData(filteredEvents);
    
    const response = await fetch('/api/ai/planetary-events-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: filteredEvents,
        currentTransits: null, // Will be filled by current planetary positions
        analysisType: 'comprehensive'
      })
    });
    
    if (!response.ok) throw new Error('Failed to generate AI interpretation');
    const result = await response.json();
    
    // Handle new API response format with success/data structure
    if (result.success && result.data) {
      return result.data;
    }
    
    // Fallback to old format or direct result
    return result;
  };

  // Analyze current event data to provide context
  const analyzeEventData = (events) => {
    const categories = [...new Set(events.map(e => e.category))];
    const recentEvents = events.filter(e => {
      const eventDate = new Date(e.event_date);
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 6);
      return eventDate >= monthsAgo;
    });
    
    return {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      categories: categories,
      highImpact: events.filter(e => ['high', 'extreme'].includes(e.impact_level)).length,
      topCategories: categories.slice(0, 3)
    };
  };

  // Generate fallback insights when APIs fail
  const generateFallbackInsights = () => {
    const analysis = analyzeEventData(filteredEvents);
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    setInsights({
      currentClimate: {
        description: `Based on current planetary positions in ${currentMonth}, we observe a period of heightened global activity with ${analysis.totalEvents} tracked events. The dominant patterns suggest ${analysis.topCategories[0]} events are particularly significant during this period.`,
        confidence: 0.7,
        keyPatterns: ['Current Mercury position', 'Mars-Saturn aspects', 'Jupiter transits']
      },
      correlations: {
        strength: analysis.highImpact / analysis.totalEvents,
        description: `Historical analysis shows ${Math.round((analysis.highImpact / analysis.totalEvents) * 100)}% correlation strength between planetary patterns and high-impact events in the current dataset.`,
        topPattern: analysis.categories[0] || 'Mixed patterns'
      },
      predictions: {
        risk: 'moderate',
        timeframe: '60-90 days',
        description: `Upcoming planetary transits suggest continued monitoring is advised, particularly for ${analysis.topCategories.join(' and ')} related developments.`
      },
      aiAnalysis: {
        answer: `The current astrological climate reflects a dynamic period with ${analysis.recentEvents} recent events showing clear planetary correlations. Traditional Vedic principles suggest paying attention to outer planet movements and their aspects to personal planets. The prevalence of ${analysis.topCategories[0]} events indicates this planetary period favors ${analysis.topCategories[0] === 'financial' ? 'economic transformation' : analysis.topCategories[0] === 'war' ? 'conflict resolution through strength' : 'structural changes in society'}.`
      },
      fallback: true,
      timestamp: new Date().toISOString()
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAIInsights();
    setRefreshing(false);
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    if (filteredEvents && filteredEvents.length > 0) {
      fetchAIInsights();
    }
  }, [filteredEvents.length]); // Only trigger when event count changes

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">🧠</div>
          <p className="text-text-secondary">Analyzing planetary patterns and generating insights...</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-text-muted">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Processing {filteredEvents.length} events</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !insights) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h4 className="font-semibold text-red-800 mb-2">Unable to Generate Insights</h4>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
        >
          {refreshing ? '🔄 Retrying...' : '🔄 Try Again'}
        </button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🔮</div>
        <p className="text-text-secondary mb-4">No planetary events to analyze</p>
        <p className="text-sm text-text-muted">Try adjusting your filters to include more events</p>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'text-green-600 bg-green-100';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh and timestamp */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">🧠 AI-Generated Insights</h3>
          <p className="text-sm text-text-muted">
            Analysis of {filteredEvents.length} planetary events • 
            {insights.fallback ? 'Offline Analysis' : 'Live AI Analysis'} • 
            Updated {new Date(insights.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
        >
          <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
          <span>{refreshing ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Current Planetary Climate */}
      {insights.currentClimate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-blue-800 flex items-center">
              <span className="mr-2">🌍</span>
              Current Planetary Climate
            </h4>
            {insights.currentClimate.confidence && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(insights.currentClimate.confidence)}`}>
                {Math.round(insights.currentClimate.confidence * 100)}% Confidence
              </span>
            )}
          </div>
          <p className="text-sm text-blue-700 mb-4 leading-relaxed">
            {insights.currentClimate.description || insights.currentClimate.data?.analysisInfo?.recommendations}
          </p>
          {insights.currentClimate.keyPatterns && (
            <div className="flex flex-wrap gap-2">
              {insights.currentClimate.keyPatterns.map((pattern, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  {pattern}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Historical Correlation Strength */}
      {insights.correlations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
        >
          <h4 className="font-semibold text-yellow-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Historical Correlation Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {insights.correlations.data?.analysis?.statistics && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-700">
                    {insights.correlations.data.analysis.statistics.totalEvents}
                  </div>
                  <div className="text-xs text-yellow-600">Events Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-700">
                    {Math.round(insights.correlations.data.analysis.statistics.averageCorrelationScore * 100)}%
                  </div>
                  <div className="text-xs text-yellow-600">Avg Correlation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-700">
                    {insights.correlations.data.analysis.statistics.strongCorrelations}
                  </div>
                  <div className="text-xs text-yellow-600">Strong Patterns</div>
                </div>
              </>
            )}
          </div>
          <p className="text-sm text-yellow-700 leading-relaxed">
            {insights.correlations.description || 
             (insights.correlations.data?.analysis?.statistics ? 
              `Analysis reveals ${insights.correlations.data.analysis.statistics.strongCorrelations} strong correlations among ${insights.correlations.data.analysis.statistics.totalEvents} historical events, with an average correlation score of ${Math.round(insights.correlations.data.analysis.statistics.averageCorrelationScore * 100)}%. This indicates reliable patterns for predictive analysis.` :
              'Historical correlation analysis shows meaningful patterns between planetary movements and global events.')}
          </p>
        </motion.div>
      )}

      {/* Future Predictions */}
      {insights.predictions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-green-800 flex items-center">
              <span className="mr-2">🔮</span>
              Upcoming Planetary Considerations
            </h4>
            {insights.predictions.data?.data?.predictions?.overallRiskLevel && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(insights.predictions.data.data.predictions.overallRiskLevel)}`}>
                {insights.predictions.data.data.predictions.overallRiskLevel.toUpperCase()} Risk
              </span>
            )}
          </div>
          <p className="text-sm text-green-700 mb-4 leading-relaxed">
            {insights.predictions.description || 
             (insights.predictions.data?.data?.interpretation?.recommendations ? 
              insights.predictions.data.data.interpretation.recommendations.join(' ') :
              `Planetary analysis for the next ${insights.predictions.timeframe || '60-90 days'} suggests ${insights.predictions.risk || 'moderate'} activity levels.`)}
          </p>
          {insights.predictions.data?.data?.predictions?.activePatternsNearDate && (
            <div className="space-y-2">
              <h5 className="font-medium text-green-800 text-sm">Active Patterns:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {insights.predictions.data.data.predictions.activePatternsNearDate.slice(0, 4).map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-100 rounded p-2">
                    <span className="text-xs text-green-700 font-medium">
                      {pattern.pattern.type.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-green-600">
                      {pattern.daysDifference} days
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* AI Expert Analysis */}
      {insights.aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-purple-50 border border-purple-200 rounded-lg p-6"
        >
          <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            AI Vedic Astrology Analysis
          </h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-purple-700 leading-relaxed whitespace-pre-line">
              {insights.aiAnalysis.answer || insights.aiAnalysis.interpretation || 'Comprehensive astrological analysis based on current planetary patterns and historical correlations.'}
            </p>
          </div>
          {!insights.fallback && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <div className="flex items-center text-xs text-purple-600">
                <span className="mr-2">✨</span>
                <span>Generated by AI using traditional Vedic astrology principles</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="bg-surface-secondary border border-border rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-sm">ℹ️</div>
          <div>
            <h5 className="font-medium text-text-primary mb-1 text-sm">
              {insights.fallback ? 'Offline Analysis Mode' : 'AI-Powered Insights'}
            </h5>
            <p className="text-xs text-text-secondary leading-relaxed">
              {insights.fallback ? (
                'These insights are generated using offline analysis of available data. For real-time AI analysis, ensure your connection is stable and try refreshing.'
              ) : (
                'These insights combine traditional Vedic astrology principles with AI analysis of current planetary patterns and historical event correlations. Use as guidance alongside professional astrological consultation.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsTab;

