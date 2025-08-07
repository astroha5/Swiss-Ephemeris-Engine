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
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
    {historicalEvents.map((event, index) => {
      const impactClass =
        event.impact_level === 'extreme'
          ? 'text-red-500 bg-red-500/10 ring-red-500/30'
          : event.impact_level === 'high'
          ? 'text-orange-500 bg-orange-500/10 ring-orange-500/30'
          : event.impact_level === 'medium'
          ? 'text-yellow-500 bg-yellow-500/10 ring-yellow-500/30'
          : 'text-green-500 bg-green-500/10 ring-green-500/30';

      return (
        <motion.article
          key={event.id || index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (index % 24) * 0.015 }}
          className="group relative flex flex-col h-full rounded-xl border border-border/80 bg-surface/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary"
        >
          {/* Top meta bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/70">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-lg shrink-0">🪐</div>
              <div className="truncate text-xs text-text-secondary" title={event.category?.replace('_',' ') || 'category'}>
                {event.category?.replace('_',' ') || 'Other'}
              </div>
            </div>
            <time
              className="text-[11px] font-medium text-text-muted bg-background/60 px-2 py-0.5 rounded-full"
              dateTime={event.event_date}
            >
              {new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </time>
          </div>

          {/* Body */}
          <div className="flex flex-col p-4 gap-3 flex-1">
            <h4 className="text-base md:text-lg font-semibold leading-snug text-text-primary line-clamp-2" title={event.title}>
              {event.title}
            </h4>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              {event.location_name && (
                <div className="inline-flex items-center gap-1">
                  <span>📍</span>
                  <span className="truncate max-w-[12rem]" title={event.location_name}>{event.location_name}</span>
                </div>
              )}
              {event.event_type && (
                <div className="inline-flex items-center gap-1">
                  <span>🏷️</span>
                  <span className="capitalize truncate max-w-[10rem]" title={event.event_type.replace('_',' ')}>{event.event_type.replace('_',' ')}</span>
                </div>
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 ${impactClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span className="uppercase tracking-wide font-medium">{event.impact_level || 'low'}</span>
              </span>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-text-secondary line-clamp-3">
                {event.description}
              </p>
            )}

            {/* Snapshot chips */}
            {event.planetary_snapshot && (
              <div className="mt-1 flex flex-wrap gap-2">
                {['sun','moon','mars','mercury','jupiter','venus','saturn'].map(p => {
                  const val = event.planetary_snapshot[p];
                  if (!val) return null;
                  return (
                    <span key={p} className="text-[11px] px-2 py-0.5 rounded-md bg-background/60 border border-border/70 text-text-muted capitalize">
                      {p}: {String(val).split(' ')[0]}
                    </span>
                  );
                })}
                {event.planetary_snapshot.ascendant && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-background/60 border border-border/70 text-text-muted">
                    Asc: {event.planetary_snapshot.ascendant.split(' ')[0]}
                  </span>
                )}
              </div>
            )}

            {/* Aspects summary */}
            {event.planetary_snapshot?.aspects?.length > 0 && (
              <div className="mt-1">
                <button
                  type="button"
                  aria-expanded={expandedAspects.has(event.id)}
                  onClick={() => toggleAspectsExpansion(event.id)}
                  className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                >
                  <span>🔗 Vedic Aspects</span>
                  <span className="text-[11px] text-text-muted">
                    ({expandedAspects.has(event.id) ? 'hide' : `+${Math.max(0, event.planetary_snapshot.aspects.length - 0)}`})
                  </span>
                </button>
                <div className={`${expandedAspects.has(event.id) ? 'block' : 'hidden'} mt-2 space-y-1 max-h-40 overflow-y-auto pr-1`}>
                  {event.planetary_snapshot.aspects.slice(0, 12).map((aspect, idx) => (
                    <div key={idx} className="text-xs text-text-secondary bg-surface/70 border border-border/60 rounded-md px-2 py-1">
                      • {aspect.description || `${aspect.fromPlanet} ${aspect.aspectType} ${aspect.toPlanet}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-2 flex items-center justify-between">
              {/* Confidence placeholder if present in data in future */}
              <div className="text-[11px] text-text-muted">
                Source: {event.source_name || 'manual'}
              </div>
              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View source →
                </a>
              )}
            </div>
          </div>
        </motion.article>
      );
    })}
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
        {hasMore && (
          <div className="flex justify-center mb-6">
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

        {/* Action Buttons removed as per feedback */}
      </motion.div>
    </div>
  );
};

export default EventAnalysis;
