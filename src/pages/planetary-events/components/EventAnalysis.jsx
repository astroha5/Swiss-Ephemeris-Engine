import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../services/api';

const EventAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [historicalEvents, setHistoricalEvents] = useState([]);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalEnhanced, setTotalEnhanced] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [expandedAspects, setExpandedAspects] = useState(new Set());

  const toggleAspectsExpansion = (eventId) => {
    setExpandedAspects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadHistoricalEvents(0, true);
  }, []);

const loadHistoricalEvents = async (currentOffset = 0, reset = false) => {
    const currentScrollPosition = window.pageYOffset; // Store current scroll position
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/planetary-events/events', {
        params: { limit: 50, offset: currentOffset }
      });
      const data = response.data;
      
      if (data?.success) {
        const newEvents = data.data;
        setHasMore(newEvents.length === 50);

        // Process each event to extract necessary planetary data if available
        const processedEvents = newEvents.map(event => {
          return {
            ...event,
            planetary_snapshot: event.planetary_snapshot || {},
            source_url: event.source_url || 'No source available'
          };
        });
        
        if (reset) {
          setHistoricalEvents(processedEvents);
          setOffset(processedEvents.length);
        } else {
          setHistoricalEvents(prev => [...prev, ...processedEvents]);
          setOffset(prev => prev + processedEvents.length);
          
          // Restore scroll position for infinite scroll experience
          setTimeout(() => window.scrollTo(0, currentScrollPosition), 0);
        }
      }
    } catch (error) {
      console.error('Error loading historical events:', error);
      setError('Failed to load historical events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    await loadHistoricalEvents(0, true);
  };

  const enhancePlanetaryDataForBatch = async (events) => {
    // Find events that need planetary data enhancement
    const eventsNeedingEnhancement = events.filter(event => 
      event.latitude && event.longitude && !event.sun_sign
    );
    
    if (eventsNeedingEnhancement.length === 0) {
      return;
    }

    setEnhancing(true);
    setCurrentBatch(prev => prev + 1);
    
    try {
      const eventIds = eventsNeedingEnhancement.map(e => e.id);
      const { data } = await api.post('/api/planetary-events/enhance-planetary-data', {
        event_ids: eventIds,
        force_recalculate: false
      });
      
      if (data?.success) {
        setTotalEnhanced(prev => prev + (data.enhanced_count || 0));
        
        // Refresh the events to show updated planetary data
        const updatedResponse = await api.get('/api/planetary-events/events', {
          params: { limit: historicalEvents.length, offset: 0 }
        });
        const updatedData = updatedResponse.data;
        
        if (updatedData?.success) {
          setHistoricalEvents(updatedData.data);
        }
      }
    } catch (error) {
      console.error('Error enhancing planetary data:', error);
    } finally {
      setEnhancing(false);
      setTotalProcessed(prev => prev + eventsNeedingEnhancement.length);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl shadow-soft p-6 border border-border">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-text-secondary">Analyzing patterns in historical events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-soft p-6 border border-border">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-text-primary">
          Pattern Analysis
        </h2>
        <p className="text-lg text-text-secondary">
          Discover astrological patterns in historical events
        </p>
      </div>

      {/* Historical Patterns & Events Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <span>🔎</span>
          <span>Find Patterns</span>
        </h3>
        <p className="text-lg text-gray-600 mb-8">
          Past Planetary Patterns & Events
        </p>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={runAnalysis}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Historical Events Display */}
      {historicalEvents.length > 0 ? (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {historicalEvents.map((event, index) => (
    <motion.div
      key={event.id || index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 50) * 0.02 }}
      className="bg-surface rounded-2xl shadow-lg border border-border overflow-hidden"
    >
      {/* Header with planet icon and date */}
      <div className="bg-gradient-to-r from-primary to-accent p-4 flex justify-between items-center">
        <div className="text-2xl text-text-inverse">🪐</div>
        <span className="text-xs font-medium text-background bg-primary px-3 py-1 rounded-full">
          {new Date(event.event_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>

      {/* Card content */}
      <div className="p-4">
        <h4 className="text-xl font-medium text-text-primary mb-2">
          {event.title}
        </h4>

{/* Display Planetary Snapshot if available */}
{event.planetary_snapshot && (
  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 mb-4 border border-border">
    <h5 className="text-lg font-heading font-semibold text-text-primary mb-3 flex items-center">
      <span className="mr-2">🌌</span> Planetary Snapshot
    </h5>
    {/* Helper functions for house and Nakshatra */}
      {(() => {
        const getHouseForPlanet = (planetName) => {
          if (event.planetary_snapshot.aspects) {
            const aspect = event.planetary_snapshot.aspects.find(a =>
              a.fromPlanet?.toLowerCase() === planetName.toLowerCase()
            );
            return aspect ? aspect.fromHouse : null;
          }
          return null;
        };
        const getOrdinalHouse = (houseNum) => {
          if (!houseNum) return '';
          const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
          return ordinals[houseNum] || `${houseNum}th`;
        };
        const planetList = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];
        const planetSymbols = {
          sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃',
          saturn: '♄', rahu: '☊', ketu: '☋'
        };
        return (
          <div className="grid grid-cols-2 gap-3">
            {planetList.map((planet) => {
              if (!event.planetary_snapshot[planet]) return null;
              const house = getHouseForPlanet(planet);
              const houseText = house ? `, ${getOrdinalHouse(house)} House` : '';
              const nakshatra = planet === 'moon' && event.planetary_snapshot.nakshatra
                ? `, Nakshatra: ${event.planetary_snapshot.nakshatra}`
                : '';
              return (
                <div key={planet} className="flex items-center text-sm text-text-secondary bg-surface rounded-lg p-2">
                  <span className="text-base mr-2 text-primary">{planetSymbols[planet]}</span>
                  <div className="flex-1">
                    <span className="font-medium capitalize text-text-primary">{planet}:</span>
                    <span className="ml-1 text-xs">{event.planetary_snapshot[planet]}{houseText}{nakshatra}</span>
                  </div>
                </div>
              );
            })}
            {/* Ascendant */}
            {event.planetary_snapshot.ascendant && (
              <div className="flex items-center text-sm text-text-secondary bg-surface rounded-lg p-2">
                <span className="text-base mr-2 text-primary">🔭</span>
                <div className="flex-1">
                  <span className="font-medium text-text-primary">Ascendant:</span>
                  <span className="ml-1 text-xs">{event.planetary_snapshot.ascendant}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}
  </div>
)}
{/* Vedic Aspects Section */}
{event.planetary_snapshot.aspects && event.planetary_snapshot.aspects.length > 0 && (
  <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-4 border border-border">
    <h6 className="text-base font-heading font-semibold text-text-primary mb-3 flex items-center">
      <span className="mr-2">🔗</span> Vedic Aspects
    </h6>
    <div className="space-y-2">
      {event.planetary_snapshot.aspects.slice(0, 5).map((aspect, idx) => (
        <div key={idx} className="text-sm text-text-secondary bg-surface rounded-lg p-2">
          • {aspect.description || `${aspect.fromPlanet} ${aspect.aspectType} ${aspect.toPlanet}`}
        </div>
      ))}
      {event.planetary_snapshot.aspects.length > 5 && (
        <div className="text-xs text-text-muted italic bg-surface rounded-lg p-2">
          {!expandedAspects.has(event.id) && `...and {event.planetary_snapshot.aspects.length - 5} more aspects`}
          {expandedAspects.has(event.id) && event.planetary_snapshot.aspects.slice(5).map((aspect, idx) => (
            <div key={`more-aspect-${idx}`} className="text-sm text-text-secondary bg-surface rounded-lg p-2">
              • {aspect.description || `${aspect.fromPlanet} ${aspect.aspectType} ${aspect.toPlanet}`}
            </div>
          ))}
        </div>
      )}
      {event.planetary_snapshot.aspects.length > 5 && (
        <button
          className="text-xs font-medium text-primary mt-2"
          onClick={() => toggleAspectsExpansion(event.id)}
        >
          {expandedAspects.has(event.id) ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  </div>
)}

        <p className="text-sm font-body text-text-secondary">
          <strong>Event:</strong> {event.description || event.title}
        </p>
        <div className="mt-3 flex items-center space-x-4">
          <span className={`text-xs px-2 py-1 rounded-full ${
            event.impact_level === 'extreme' ? 'bg-red-100 text-red-800' :
            event.impact_level === 'high' ? 'bg-orange-100 text-orange-800' :
            event.impact_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {event.impact_level?.toUpperCase()} IMPACT
          </span>
          <span className="text-xs font-caption text-text-muted capitalize">
            Category: {event.category?.replace('_', ' ')}
          </span>
          {event.location_name && (
            <span className="text-xs font-caption text-text-muted">
              📍 {event.location_name}
            </span>
          )}
        </div>
      </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl shadow-lg p-8 text-center border border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              No matching patterns found
            </h3>
            <p className="text-gray-600 mb-6">
              Try refining your filters or check back later as more historical data becomes available.
            </p>
          </div>
        )}

        {/* Analysis Results Summary */}
        {analysisData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mt-8 border border-blue-200">
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <span>📃</span>
              <span>Pattern Analysis Summary</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-xl text-center shadow-lg border border-gray-200">
                <div className="text-3xl font-bold text-blue-600">
                  {analysisData.total_events_analyzed || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Events Analyzed</div>
              </div>
              <div className="bg-white p-6 rounded-xl text-center shadow-lg border border-gray-200">
                <div className="text-3xl font-bold text-purple-600">
                  {analysisData.patterns ? Object.keys(analysisData.patterns).length : 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Pattern Types</div>
              </div>
              <div className="bg-white p-6 rounded-xl text-center shadow-lg border border-gray-200">
                <div className="text-3xl font-bold text-green-600">
                  {historicalEvents.length}
                </div>
                <div className="text-sm text-gray-600 mt-2">Historical Events</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 shadow-lg flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Refresh Patterns</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              const eventsNeedingEnhancement = historicalEvents.filter(event => 
                event.latitude && event.longitude && !event.sun_sign
              );
              if (eventsNeedingEnhancement.length > 0) {
                enhancePlanetaryDataForBatch(eventsNeedingEnhancement);
              } else {
                alert('No events need planetary data enhancement. All events with location data already have precomputed planetary positions.');
              }
            }}
            disabled={enhancing || loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium disabled:opacity-50 shadow-lg flex items-center space-x-2"
          >
            {enhancing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <span>🔭</span>
                <span>Enhance Missing Data</span>
              </>
            )}
          </button>
          {hasMore && (
            <button
              onClick={() => loadHistoricalEvents(historicalEvents.length, false)}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 shadow-lg flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>Load More Events</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EventAnalysis;
