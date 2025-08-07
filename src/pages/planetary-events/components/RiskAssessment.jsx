import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LocationSearch from '../../../components/LocationSearch';
import api from '../../../services/api';

const RiskAssessment = () => {
  const [location, setLocation] = useState({
    latitude: 0,
    longitude: 0,
    name: 'Greenwich, UK'
  });
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedPatterns, setExpandedPatterns] = useState(new Set());
  const [historicalEvents, setHistoricalEvents] = useState({});

  useEffect(() => {
    // Get current location or default to Greenwich
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: 'Current Location'
          });
        },
        () => {
          // Use default location if geolocation fails
          fetchRiskAssessment();
        }
      );
    } else {
      fetchRiskAssessment();
    }
  }, []);

  useEffect(() => {
    if (location.latitude !== 0 || location.longitude !== 0) {
      fetchRiskAssessment();
    }
  }, [location]);

  const fetchRiskAssessment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude) }).toString();
      const response = await api.get(`/api/planetary-events/today-risk?${params}`);
      const data = response.data;

      if (data?.success) {
        setRiskData(data.data);
      } else {
        throw new Error(data?.error || 'Failed to fetch risk assessment');
      }
    } catch (err) {
      console.error('Risk assessment fetch error:', err);
      setError(err.message || 'Failed to fetch risk assessment');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'extreme': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'extreme': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  const togglePatternExpansion = async (patternIndex, pattern) => {
    const newExpandedPatterns = new Set(expandedPatterns);
    if (newExpandedPatterns.has(patternIndex)) {
      newExpandedPatterns.delete(patternIndex);
    } else {
      newExpandedPatterns.add(patternIndex);
      // Fetch historical events for this pattern if not already fetched
      if (!historicalEvents[pattern.pattern_name]) {
        const events = await fetchHistoricalData(pattern.pattern_name);
        setHistoricalEvents(prev => ({
          ...prev,
          [pattern.pattern_name]: events
        }));
      }
    }
    setExpandedPatterns(newExpandedPatterns);
  };

  const fetchHistoricalData = async (patternName) => {
    try {
      const response = await api.get(`/api/planetary-events/historical-pattern`, {
        params: { pattern: patternName }
      });
      const data = response.data;
      return data?.success ? data.data : [];
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      return [];
    }
  };

  const getPlanetIcon = (planet) => {
    const icons = {
      sun: '☉',
      moon: '☽',
      mars: '♂',
      mercury: '☿',
      jupiter: '♃',
      venus: '♀',
      saturn: '♄',
      rahu: '☊',
      ketu: '☋'
    };
    return icons[planet] || '●';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">🌌</div>
          <p className="text-gray-600">Calculating today's risk assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Risk Assessment</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchRiskAssessment}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Today's Risk Assessment
        </h2>
        <p className="text-gray-600 mb-4">
          Current planetary conditions and their correlation with historical events
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
          <h3 className="font-semibold text-blue-900 mb-2">💡 What is Risk Assessment?</h3>
          <p className="text-blue-800 text-sm">
            This tool analyzes current planetary positions and compares them to historical patterns 
            associated with major world events. It provides a risk level based on astrological correlations, 
            helping you understand potential influences of current cosmic conditions.
          </p>
          <p className="text-blue-700 text-xs mt-2">
            <strong>Note:</strong> This is for informational purposes only and should not be used 
            as the sole basis for important decisions.
          </p>
        </div>
      </div>

      {/* Location Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📍 Assessment Location
        </h3>
        <LocationSearch
          onLocationSelect={(selectedLocation) => {
            setLocation({
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              name: selectedLocation.displayName || selectedLocation.name
            });
          }}
          placeholder="Enter location for risk assessment..."
        />
        <p className="text-sm text-gray-500 mt-2">
          Current: {location.name} ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
        </p>
      </motion.div>

      {riskData && (
        <>
          {/* Main Risk Level */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl p-8 border-2 ${getRiskColor(riskData.risk_level)}`}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{getRiskIcon(riskData.risk_level)}</div>
              <h3 className="text-2xl font-bold mb-2 capitalize">
                {riskData.risk_level} Risk Level — {riskData.overall_risk_score}/10
              </h3>
            </div>
            
            <div className="text-left space-y-4 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-1">🌌</span>
                <div>
                  <h4 className="font-semibold mb-1">Today's Cosmic Pattern:</h4>
                  <p className="text-sm leading-relaxed">
                    {riskData.interpretation || "Current planetary alignments resemble patterns historically associated with significant global events."}
                  </p>
                </div>
              </div>
              
              {riskData.matching_patterns && riskData.matching_patterns.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">🔍</span>
                  <div>
                    <h4 className="font-semibold mb-1">Key Triggers:</h4>
                    <p className="text-sm leading-relaxed">
                      {riskData.matching_patterns.slice(0, 2).map((pattern, idx) => {
                        const readableName = pattern.pattern_name
                          .replace(/_/g, ' ')
                          .replace(/jupiter/gi, 'Jupiter')
                          .replace(/mars/gi, 'Mars')
                          .replace(/venus/gi, 'Venus')
                          .replace(/saturn/gi, 'Saturn')
                          .replace(/mercury/gi, 'Mercury')
                          .replace(/sun/gi, 'Sun')
                          .replace(/moon/gi, 'Moon')
                          .replace(/rahu/gi, 'Rahu (North Node)')
                          .replace(/ketu/gi, 'Ketu (South Node)')
                          .replace(/financial/gi, 'economic')
                          .replace(/events/gi, 'influences');
                        return (
                          <span key={idx}>
                            {readableName} ({pattern.match_strength}% match){idx < 1 && riskData.matching_patterns.length > 1 ? ', ' : ''}
                          </span>
                        );
                      })}
                      {riskData.matching_patterns.length > 2 && ` and ${riskData.matching_patterns.length - 2} other patterns`}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <span className="text-xl mt-1">📊</span>
                <div>
                  <h4 className="font-semibold mb-1">Interpretation:</h4>
                  <p className="text-sm leading-relaxed">
                    {riskData.interpretation}
                  </p>
                </div>
              </div>
              
              
            </div>
          </motion.div>

          {/* Current Planetary Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🌌 Current Planetary Positions
            </h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-800">
                <strong>Reading the Positions:</strong> Each planet's position in a zodiac sign and its degree affects the overall cosmic energy. The combination of these positions creates the "astrological weather" for today.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(riskData.planetary_positions).map(([planet, data]) => (
                <div key={planet} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">{getPlanetIcon(planet)}</div>
                  <div className="font-semibold text-gray-900 capitalize mb-1">
                    {planet}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.sign}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.degree?.toFixed(1)}°
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Combined Historical Insights */}
          {riskData.matching_patterns && riskData.matching_patterns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  🎯 Historical Insights
                </h3>
                <span className="text-xs text-gray-500">
                  {riskData.matching_patterns?.length || 0} matching patterns
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>What are Historical Patterns?</strong> These are specific planetary configurations that have coincided with significant world events in the past. We analyze current cosmic conditions against our database of historical correlations to assess potential influences.
                </p>
              </div>

              {/* Summary row previously in "Historical Context" */}
              <div className="space-y-4 text-sm text-gray-700 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Total Matching Patterns</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {riskData.matching_patterns?.length || 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Avg. Pattern Risk</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const pats = riskData.matching_patterns || [];
                        if (!pats.length) return '—';
                        const avg = pats.reduce((s, p) => s + (Number(p.risk_level) || 0), 0) / pats.length;
                        return avg.toFixed(2) + '/10';
                      })()}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Avg. Match Strength</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const pats = riskData.matching_patterns || [];
                        if (!pats.length) return '—';
                        const avg = pats.reduce((s, p) => s + (Number(p.match_strength) || 0), 0) / pats.length;
                        return avg.toFixed(1) + '%';
                      })()}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Avg. Historical Success</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const pats = riskData.matching_patterns || [];
                        if (!pats.length) return '—';
                        const avg = pats.reduce((s, p) => s + (Number(p.success_rate) || 0), 0) / pats.length;
                        return avg.toFixed(1) + '%';
                      })()}
                    </div>
                  </div>
                </div>

                {/* Top patterns and common planets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Top Patterns Today</div>
                    <ul className="space-y-2">
                      {(() => {
                        const pats = (riskData.matching_patterns || [])
                          .slice()
                          .sort((a, b) => (Number(b.match_strength) || 0) - (Number(a.match_strength) || 0))
                          .slice(0, 3);
                        if (!pats.length) {
                          return <li className="text-gray-500 italic">No patterns available</li>;
                        }
                        return pats.map((p, idx) => (
                          <li key={idx} className="flex items-center justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-800">
                              {p.pattern_name
                                .replace(/_/g, ' ')
                                .replace(/jupiter/gi, 'Jupiter')
                                .replace(/mars/gi, 'Mars')
                                .replace(/venus/gi, 'Venus')
                                .replace(/saturn/gi, 'Saturn')
                                .replace(/mercury/gi, 'Mercury')
                                .replace(/sun/gi, 'Sun')
                                .replace(/moon/gi, 'Moon')
                                .replace(/rahu/gi, 'Rahu (North Node)')
                                .replace(/ketu/gi, 'Ketu (South Node)')
                                .replace(/financial/gi, 'Economic')
                                .replace(/events/gi, 'Influences')
                                .split(' ')
                                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ')}
                            </span>
                            <span className="text-xs text-gray-600">
                              Match {p.match_strength}% • Risk {p.risk_level}/10 • Success {p.success_rate}%
                            </span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Common Planetary Involvements</div>
                    <div className="text-xs text-gray-600">
                      {(() => {
                        const pats = riskData.matching_patterns || [];
                        if (!pats.length) return 'No data';
                        const planetKeys = ['sun','moon','mercury','venus','mars','jupiter','saturn','rahu','ketu'];
                        const counts = {};
                        pats.forEach(p => {
                          const name = (p.pattern_name || '').toLowerCase();
                          planetKeys.forEach(pk => {
                            if (name.includes(pk)) counts[pk] = (counts[pk] || 0) + 1;
                          });
                        });
                        const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);
                        if (!sorted.length) return 'No identifiable planetary references in pattern names';
                        return (
                          <ul className="flex flex-wrap gap-2">
                            {sorted.map(([k, v]) => (
                              <li key={k} className="bg-gray-100 rounded-full px-2 py-1">
                                {k.charAt(0).toUpperCase() + k.slice(1)}: {v}
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed per-pattern list with expandable historical events */}
              <div className="space-y-4">
                {riskData.matching_patterns.map((pattern, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {pattern.pattern_name
                          .replace(/_/g, ' ')
                          .replace(/jupiter/gi, 'Jupiter')
                          .replace(/mars/gi, 'Mars')
                          .replace(/venus/gi, 'Venus')
                          .replace(/saturn/gi, 'Saturn')
                          .replace(/mercury/gi, 'Mercury')
                          .replace(/sun/gi, 'Sun')
                          .replace(/moon/gi, 'Moon')
                          .replace(/rahu/gi, 'Rahu (North Node)')
                          .replace(/ketu/gi, 'Ketu (South Node)')
                          .replace(/financial/gi, 'Economic')
                          .replace(/events/gi, 'Influences')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          Risk: {pattern.risk_level}/10
                        </span>
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {pattern.match_strength}% match
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {pattern.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Success Rate: {pattern.success_rate}%</span>
                      <button
                        onClick={() => togglePatternExpansion(index, pattern)}
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors"
                      >
                        Occurrences: {pattern.total_occurrences} {expandedPatterns.has(index) ? '▼' : '▶'}
                      </button>
                    </div>

                    {expandedPatterns.has(index) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <span className="mr-2">📊</span>
                          Historical Events for this Pattern
                        </h5>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p className="mb-3">
                            <strong>Pattern Analysis:</strong> This pattern has occurred {pattern.total_occurrences} times 
                            in our historical database with a {pattern.success_rate}% correlation rate.
                          </p>

                          <div className="bg-white rounded p-3 border">
                            <p className="font-medium text-gray-700 mb-1">Recent Notable Occurrences:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {historicalEvents[pattern.pattern_name]?.length > 0 ? (
                                historicalEvents[pattern.pattern_name].map((event, idx) => (
                                  <li key={idx} className="flex items-center justify-between">
                                    <span>• {event.title} - {new Date(event.date).toLocaleDateString()} ({event.correlation} correlation)</span>
                                    {event.source_url && (
                                      <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline ml-2">Source</a>
                                    )}
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500 italic">Loading historical events...</li>
                              )}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            <span className="text-xs text-gray-500">Pattern ID: {pattern.pattern_name}</span>
                            <span className="text-xs text-gray-500">Last updated: Today</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Recent Historical Examples summary moved here */}
              <div className="mt-6">
                <div className="font-semibold text-gray-900 mb-2">Recent Historical Examples (Summary)</div>
                <div className="space-y-2">
                  {(() => {
                    const entries = Object.entries(historicalEvents || {});
                    if (!entries.length) {
                      return (
                        <p className="text-xs text-gray-500">
                          Expand a pattern above to load and preview recent historical occurrences here.
                        </p>
                      );
                    }
                    return entries.map(([patternId, events]) => {
                      const ev = Array.isArray(events) && events.length ? events[0] : null;
                      if (!ev) return null;
                      const niceName = patternId
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                      return (
                        <div key={patternId} className="bg-gray-50 rounded p-2 text-xs text-gray-700 flex items-center justify-between">
                          <span>
                            <strong>{niceName}:</strong> {ev.title} — {new Date(ev.date).toLocaleDateString()} ({ev.correlation} correlation)
                          </span>
                          {ev.source_url && (
                            <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2">
                              Source
                            </a>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
                <strong>Disclaimer:</strong> This assessment is for informational purposes only. 
                Astrological correlations do not guarantee future events and should not be used 
                as the sole basis for important decisions.
              </div>
            </motion.div>
          )}

          

          {/* Refresh Button */}
          <div className="text-center">
            <button
              onClick={fetchRiskAssessment}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              🔄 Refresh Assessment
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default RiskAssessment;
