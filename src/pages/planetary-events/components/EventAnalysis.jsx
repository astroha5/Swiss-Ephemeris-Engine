import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const autoLoadingRef = useRef(false);

  // Advanced filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    impact_level: '',
    start_date: '',
    end_date: '',
    event_type: '',
    country_code: '',
    // Planet-in-sign filter
    positionPlanets: new Set(),
    positionSigns: new Set(),
    // Aspects filter (from planets aspecting to planets)
    aspectFromPlanets: new Set(),
    aspectToPlanets: new Set(),
    
  });

  const categoryOptions = [
    'financial', 'natural_disaster', 'political', 'war', 'terrorism', 'pandemic', 'technology', 'social', 'accident', 'other'
  ];
  const impactOptions = ['extreme', 'high', 'medium', 'low'];
  const eventTypeOptions = useMemo(() => {
    const set = new Set();
    historicalEvents.forEach(e => { if (e.event_type) set.add(e.event_type); });
    return Array.from(set).sort();
  }, [historicalEvents]);
  const planetOptions = ['sun','moon','mars','mercury','jupiter','venus','saturn','rahu','ketu'];
  const signOptions = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

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

  // Load on mount
  useEffect(() => {
    loadHistoricalEvents(0, true);
  }, []);

  // Build server-backed filters
  const buildServerFilters = () => {
    const { category, impact_level, start_date, end_date } = filters;
    const params = {};
    if (category) params.category = category;
    if (impact_level) params.impact_level = impact_level;
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;
    return params;
  };

const loadHistoricalEvents = async (currentOffset = 0, reset = false) => {
    const currentScrollPosition = window.pageYOffset; // Store current scroll position
    setLoading(true);
    setError(null);
    try {
      const serverFilters = buildServerFilters();
      const planetaryActive = (filters.positionPlanets.size > 0 && filters.positionSigns.size > 0) || (filters.aspectFromPlanets.size > 0 || filters.aspectToPlanets.size > 0);
      const pageSize = planetaryActive ? 200 : 50;
      const response = await api.get('/api/planetary-events/events', {
        params: { limit: pageSize, offset: currentOffset, ...serverFilters }
      });
      const data = response.data;
      
      if (data?.success) {
        const newEvents = data.data;
        setHasMore(newEvents.length === pageSize);

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

        return processedEvents;
      }
    } catch (error) {
      console.error('Error loading historical events:', error);
      setError('Failed to load historical events. Please try again.');
      return [];
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

  // Derived filtered events (client-side filters beyond what server supports)
  // Predicate to check if an event matches current filters
  const eventMatchesFilters = (evt) => {
    const search = filters.search.trim().toLowerCase();
    const eventType = filters.event_type.trim();
    const country = filters.country_code.trim().toUpperCase();

    if (search) {
      const hay = `${evt.title || ''} ${evt.description || ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (eventType && (evt.event_type || '') !== eventType) return false;
    if (country && (evt.country_code || '').toUpperCase() !== country) return false;

    if (filters.positionPlanets.size > 0 && filters.positionSigns.size > 0) {
      const signOfPlanet = (planetKey) => {
        const pdata = (evt.planetary_snapshot || {})[planetKey];
        let sign = '';
        if (typeof pdata === 'string') {
          sign = (pdata.split(' ')[0] || '').trim();
        } else if (pdata && typeof pdata === 'object') {
          sign = (pdata.sign || pdata.Sign || '').trim();
        }
        if (!sign) {
          const topLevelSign = evt[`${planetKey}_sign`] || evt[`${planetKey}_Sign`];
          if (topLevelSign) sign = String(topLevelSign).trim();
        }
        return sign;
      };

      if (filters.positionSigns.size === 1) {
        const [requiredSign] = Array.from(filters.positionSigns);
        const allMatch = Array.from(filters.positionPlanets).every(p => signOfPlanet(p) === requiredSign);
        if (!allMatch) return false;
      } else {
        const signs = Array.from(filters.positionSigns);
        const existsCommonSign = signs.some(s =>
          Array.from(filters.positionPlanets).every(p => signOfPlanet(p) === s)
        );
        if (!existsCommonSign) return false;
      }
    }

    if (filters.aspectFromPlanets.size > 0 || filters.aspectToPlanets.size > 0) {
      const aspects = (evt.planetary_snapshot && Array.isArray(evt.planetary_snapshot.aspects)) ? evt.planetary_snapshot.aspects : [];
      if (aspects.length === 0) return false;
      const hasAspectMatch = aspects.some(a => {
        const from = (a.fromPlanet || a.from || '').toString().toLowerCase();
        const to = (a.toPlanet || a.to || '').toString().toLowerCase();
        const fromOk = filters.aspectFromPlanets.size === 0 || filters.aspectFromPlanets.has(from);
        const toOk = filters.aspectToPlanets.size === 0 || filters.aspectToPlanets.has(to);
        return fromOk && toOk;
      });
      if (!hasAspectMatch) return false;
    }

    return true;
  };

  const filteredEvents = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const eventType = filters.event_type.trim();
    const country = filters.country_code.trim().toUpperCase();

    return historicalEvents.filter(eventMatchesFilters);
  }, [historicalEvents, filters]);

  // Auto-load more pages when planetary filters are active and no matches yet
  useEffect(() => {
    const planetaryActive = (filters.positionPlanets.size > 0 && filters.positionSigns.size > 0) || (filters.aspectFromPlanets.size > 0 || filters.aspectToPlanets.size > 0);
    if (!planetaryActive) return;
    if (loading) return;
    if (filteredEvents.length > 0) return;
    if (!hasMore) return;
    if (autoLoadingRef.current) return;

    let cancelled = false;
    autoLoadingRef.current = true;

    (async () => {
      let offsetLocal = historicalEvents.length;
      let attempts = 0;
      while (!cancelled && attempts < 20) {
        const nextBatch = await loadHistoricalEvents(offsetLocal, false);
        offsetLocal += nextBatch.length;
        attempts += 1;
        // If we got fewer than 50, no more pages
        if (nextBatch.length < 50) break;
        // If the nextBatch has a match, we can stop early
        if (nextBatch.some(eventMatchesFilters)) break;
        // If after appending we have any match, stop
        if (historicalEvents.some(eventMatchesFilters)) break;
      }
      autoLoadingRef.current = false;
    })();

    return () => { cancelled = true; };
  }, [filters.positionPlanets, filters.positionSigns, filters.aspectFromPlanets, filters.aspectToPlanets, filteredEvents.length, hasMore, loading]);

  // Auto-apply filters when key filters change (so user doesn't have to click Apply)
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!loading) {
        handleApplyFilters();
      }
    }, 150);
    return () => clearTimeout(debounce);
  }, [
    filters.category,
    filters.impact_level,
    filters.start_date,
    filters.end_date,
    filters.event_type,
    filters.country_code,
    filters.positionPlanets,
    filters.positionSigns,
    filters.aspectFromPlanets,
    filters.aspectToPlanets
  ]);

  // Apply filters with auto-fetch for planetary configs if no matches found
  const handleApplyFilters = async () => {
    const firstBatch = await loadHistoricalEvents(0, true);

    const planetaryFiltersActive = (filters.positionPlanets.size > 0 && filters.positionSigns.size > 0) || (filters.aspectFromPlanets.size > 0 || filters.aspectToPlanets.size > 0);
    if (!planetaryFiltersActive) return;

    // If no matches in the first page, progressively load more until matches found or no more pages
    let attempts = 0;
    let offsetLocal = firstBatch.length;
    let found = firstBatch.some(eventMatchesFilters);
    let keepGoing = firstBatch.length === 50;
    while (!found && keepGoing && attempts < 20) {
      const nextBatch = await loadHistoricalEvents(offsetLocal, false);
      offsetLocal += nextBatch.length;
      found = nextBatch.some(eventMatchesFilters);
      keepGoing = nextBatch.length === 50 && nextBatch.length > 0;
      attempts += 1;
      if (nextBatch.length === 0) break;
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
        {/* Advanced Filters */}
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted mb-1">Search</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="Title or description..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            {/* Category */}
            <div>
              <label className="block text-xs text-text-muted mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-white"
                value={filters.category}
                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">All</option>
                {categoryOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.replace('_',' ')}</option>
                ))}
              </select>
            </div>
            {/* Impact */}
            <div>
              <label className="block text-xs text-text-muted mb-1">Impact</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-white"
                value={filters.impact_level}
                onChange={(e) => setFilters(f => ({ ...f, impact_level: e.target.value }))}
              >
                <option value="">Any</option>
                {impactOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {/* Dates */}
            <div>
              <label className="block text-xs text-text-muted mb-1">Start date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.start_date}
                onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">End date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={filters.end_date}
                onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            {/* Event type (dropdown) */}
            <div>
              <label className="block text-xs text-text-muted mb-1">Event type</label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-white"
                value={filters.event_type}
                onChange={(e) => setFilters(f => ({ ...f, event_type: e.target.value }))}
              >
                <option value="">All</option>
                {eventTypeOptions.map(et => (
                  <option key={et} value={et}>{et.replace('_',' ')}</option>
                ))}
              </select>
            </div>
            {/* Country */}
            <div>
              <label className="block text-xs text-text-muted mb-1">Country code</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="US, IN, GB..."
                value={filters.country_code}
                onChange={(e) => setFilters(f => ({ ...f, country_code: e.target.value }))}
              />
            </div>
            {/* Planet in Sign: Planets */}
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted mb-2">Planets (position filter)</label>
              <div className="flex flex-wrap gap-2">
                {planetOptions.map(p => {
                  const checked = filters.positionPlanets.has(p);
                  return (
                    <label key={`pos-${p}`} className={`px-3 py-1 rounded-md border cursor-pointer select-none text-sm ${checked ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-white border-border text-text-secondary'}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={(e) => setFilters(f => {
                          const next = new Set(f.positionPlanets);
                          if (e.target.checked) next.add(p); else next.delete(p);
                          return { ...f, positionPlanets: next };
                        })}
                      />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </label>
                  );
                })}
              </div>
            </div>
            {/* Planet in Sign: Signs */}
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted mb-2">Signs</label>
              <div className="flex flex-wrap gap-2">
                {signOptions.map(s => {
                  const checked = filters.positionSigns.has(s);
                  return (
                    <label key={`sign-${s}`} className={`px-3 py-1 rounded-md border cursor-pointer select-none text-sm ${checked ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-white border-border text-text-secondary'}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={(e) => setFilters(f => {
                          const next = new Set(f.positionSigns);
                          if (e.target.checked) next.add(s); else next.delete(s);
                          return { ...f, positionSigns: next };
                        })}
                      />
                      {s}
                    </label>
                  );
                })}
              </div>
            </div>
            {/* Aspects: From planets */}
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted mb-2">Aspecting planets (from)</label>
              <div className="flex flex-wrap gap-2">
                {planetOptions.map(p => {
                  const checked = filters.aspectFromPlanets.has(p);
                  return (
                    <label key={`af-${p}`} className={`px-3 py-1 rounded-md border cursor-pointer select-none text-sm ${checked ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-white border-border text-text-secondary'}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={(e) => setFilters(f => {
                          const next = new Set(f.aspectFromPlanets);
                          if (e.target.checked) next.add(p); else next.delete(p);
                          return { ...f, aspectFromPlanets: next };
                        })}
                      />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </label>
                  );
                })}
              </div>
            </div>
            {/* Aspects: To planets */}
            <div className="md:col-span-2">
              <label className="block text-xs text-text-muted mb-2">Aspected planets (to)</label>
              <div className="flex flex-wrap gap-2">
                {planetOptions.map(p => {
                  const checked = filters.aspectToPlanets.has(p);
                  return (
                    <label key={`at-${p}`} className={`px-3 py-1 rounded-md border cursor-pointer select-none text-sm ${checked ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-border text-text-secondary'}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={(e) => setFilters(f => {
                          const next = new Set(f.aspectToPlanets);
                          if (e.target.checked) next.add(p); else next.delete(p);
                          return { ...f, aspectToPlanets: next };
                        })}
                      />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Apply Filters
              </button>
              <button
                onClick={() => { setFilters({
                  search: '', category: '', impact_level: '', start_date: '', end_date: '', event_type: '', country_code: '', positionPlanets: new Set(), positionSigns: new Set(), aspectFromPlanets: new Set(), aspectToPlanets: new Set()
                }); loadHistoricalEvents(0, true); }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
            <div className="text-sm text-text-muted">Showing {filteredEvents.length} of {historicalEvents.length}{hasMore ? '+' : ''}</div>
          </div>
        </div>
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
    {filteredEvents.map((event, index) => {
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
          className="group relative flex flex-col h-full rounded-xl border border-border bg-white shadow hover:shadow-md transition-all duration-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary"
        >
          {/* Top meta bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
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
          <div className="flex flex-col p-5 gap-3 flex-1">
            <h4 className="text-base md:text-lg font-semibold leading-snug text-text-primary line-clamp-2" title={event.title}>
              {event.title}
            </h4>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
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
              <p className="text-[13px] leading-6 text-gray-700 line-clamp-4">
                {event.description}
              </p>
            )}

            {/* Snapshot chips with Vedic dignities */}
            {event.planetary_snapshot && (
              <div className="mt-2 flex flex-wrap gap-2 items-start">
                {['sun','moon','mars','mercury','jupiter','venus','saturn','rahu','ketu'].map(p => {
                  const pdata = event.planetary_snapshot[p];
                  if (!pdata) return null;

                  // Normalize to an object shape whether pdata is string or object
                  let sign = '';
                  let deg = '';
                  let dignity = '';

                  if (typeof pdata === 'string') {
                    // Expect formats like "Aries 10°" or "Aries"
                    const parts = pdata.split(' ');
                    sign = parts[0] || '';
                    deg = parts[1] || '';
                  } else if (typeof pdata === 'object') {
                    sign = pdata.sign || pdata.Sign || '';
                    const degreeVal = pdata.degreeInSign || pdata.degree || pdata.degree_in_sign;
                    if (typeof degreeVal === 'number') deg = `${degreeVal.toFixed(0)}°`;
                    dignity = pdata.dignity || pdata.dignity_status || '';
                  }

                  // If backend hasn't supplied dignity, compute Vedic dignity client-side as fallback
                  const computeDignity = (planet, s) => {
                    // Special handling: Nodes (Rahu/Ketu) don't use dignity like grahas
                    if (planet === 'rahu') return 'Rahu';
                    if (planet === 'ketu') return 'Ketu';

                    const exalt = {
                      sun: 'Aries', moon: 'Taurus', mars: 'Capricorn', mercury: 'Virgo',
                      jupiter: 'Cancer', venus: 'Pisces', saturn: 'Libra'
                    };
                    const debil = {
                      sun: 'Libra', moon: 'Scorpio', mars: 'Cancer', mercury: 'Pisces',
                      jupiter: 'Capricorn', venus: 'Virgo', saturn: 'Aries'
                    };
                    const own = {
                      sun: ['Leo'],
                      moon: ['Cancer'],
                      mars: ['Aries','Scorpio'],
                      mercury: ['Gemini','Virgo'],
                      jupiter: ['Sagittarius','Pisces'],
                      venus: ['Taurus','Libra'],
                      saturn: ['Capricorn','Aquarius']
                    };
                    if (!s) return '';
                    if (s === exalt[planet]) return 'Exalted';
                    if (s === debil[planet]) return 'Debilitated';
                    if (own[planet]?.includes(s)) return 'Own Sign';
                    // Moolatrikona simplified by sign
                    const moola = {
                      sun: 'Leo', moon: 'Taurus', mars: 'Aries', mercury: 'Virgo',
                      jupiter: 'Sagittarius', venus: 'Libra', saturn: 'Aquarius'
                    };
                    if (s === moola[planet]) return 'Moolatrikona';
                    return '';
                  };

                  const finalDignity = dignity || computeDignity(p, sign);
                  // Avoid repeating the label for nodes. If computeDignity returned "Rahu"/"Ketu",
                  // then treat that as the planet label only (no trailing bullet label).
                  const showLabel = !(p === 'rahu' && finalDignity === 'Rahu') && !(p === 'ketu' && finalDignity === 'Ketu');

                  const badgeClass =
                    p === 'rahu'
                      ? 'text-fuchsia-900 bg-fuchsia-50 border-fuchsia-200'
                      : p === 'ketu'
                      ? 'text-rose-900 bg-rose-50 border-rose-200'
                      : finalDignity === 'Exalted'
                      ? 'text-emerald-900 bg-emerald-50 border-emerald-200'
                      : finalDignity === 'Debilitated'
                      ? 'text-red-900 bg-red-50 border-red-200'
                      : finalDignity === 'Own Sign'
                      ? 'text-blue-900 bg-blue-50 border-blue-200'
                      : finalDignity === 'Moolatrikona'
                      ? 'text-purple-900 bg-purple-50 border-purple-200'
                      : 'text-gray-800 bg-gray-50 border-gray-200';

                  return (
                    <span key={p} className={`text-[12px] px-2.5 py-1 rounded-md border ${badgeClass}`}>
                      <span className="capitalize">{p}</span>{sign ? `: ${sign}` : ''}{deg ? ` ${deg}` : ''}
                      {showLabel && finalDignity ? <span className="ml-1">• {finalDignity}</span> : null}
                    </span>
                  );
                })}

                {/* Ascendant */}
                {event.planetary_snapshot.ascendant && (
                  <span className="text-[12px] px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                    Asc: {typeof event.planetary_snapshot.ascendant === 'string'
                      ? event.planetary_snapshot.ascendant.split(' ')[0]
                      : (event.planetary_snapshot.ascendant.sign || '')}
                  </span>
                )}

                {/* Unified Aspects popover + Separate Conjunctions */}
                {Array.isArray(event.planetary_snapshot.aspects) && event.planetary_snapshot.aspects.length > 0 && (() => {
                  const aspects = event.planetary_snapshot.aspects;
                  const conjunctions = aspects.filter(a => a.aspectType === 'conjunction');
                  const nonConjunctions = aspects.filter(a => a.aspectType !== 'conjunction');

                  return (
                    <>
                      {/* Conjunctions pill (separate) */}
                      {conjunctions.length > 0 && (
                        <details className="group relative">
                          <summary className="list-none cursor-pointer text-[12px] px-2.5 py-1 rounded-md border text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100 select-none inline-flex items-center gap-1">
                            <span>Conjunctions</span>
                            <span className="text-[10px] text-amber-800/80">({conjunctions.length})</span>
                          </summary>
                          {/* Full-screen modal */}
                          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => {
                            if (e.target === e.currentTarget || (e.target instanceof Element && e.target.classList.contains('modal-backdrop'))) {
                              const details = e.currentTarget.closest('details');
                              if (details) details.removeAttribute('open');
                            }
                          }}>
                            <div className="absolute inset-0 bg-black/40 modal-backdrop" />
                            <div className="relative bg-white rounded-xl shadow-2xl border border-amber-200 w-[min(96vw,900px)] max-h-[90vh] overflow-y-auto p-5">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-lg font-semibold text-amber-900">Conjunctions</h5>
                                <button
                                  className="text-amber-800 hover:text-amber-900 text-sm px-2 py-1 rounded-md hover:bg-amber-50"
                                  onClick={(e) => {
                                    // close the <details>
                                    const el = e.currentTarget.closest('details');
                                    if (el) el.removeAttribute('open');
                                  }}
                                >
                                  Close ✕
                                </button>
                              </div>
                              <div className="space-y-2">
                                {conjunctions.map((a, idx) => {
                                  const label = a.description || `${a.fromPlanet} conjunct ${a.toPlanet}`;
                                  return (
                                    <div key={idx} className="text-[14px] px-3 py-2 rounded border border-amber-200 bg-amber-50 text-amber-900">
                                      • {label}{typeof a.orb === 'number' ? ` (${a.orb.toFixed(1)}°)` : ''}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </details>
                      )}

                      {/* Unified Aspects pill (all aspects except conjunctions, merged top+all) */}
                      {nonConjunctions.length > 0 && (
                        <details className="group relative">
                          <summary className="list-none cursor-pointer text-[12px] px-2.5 py-1 rounded-md border text-indigo-800 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 select-none inline-flex items-center gap-1">
                            <span>Aspects</span>
                            <span className="text-[10px] text-indigo-700/80">({nonConjunctions.length})</span>
                          </summary>
                          {/* Full-screen modal */}
                          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => {
                            // Close when clicking the dim backdrop or outside content box
                            if (e.target === e.currentTarget || (e.target instanceof Element && e.target.classList.contains('modal-backdrop'))) {
                              const details = e.currentTarget.closest('details');
                              if (details) details.removeAttribute('open');
                            }
                          }}>
                            <div className="absolute inset-0 bg-black/40 modal-backdrop" />
                            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-[min(96vw,1000px)] max-h-[90vh] overflow-y-auto p-5">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-lg font-semibold text-indigo-900">Aspects</h5>
                                <button
                                  className="text-indigo-800 hover:text-indigo-900 text-sm px-2 py-1 rounded-md hover:bg-indigo-50"
                                  onClick={(e) => {
                                    const el = e.currentTarget.closest('details');
                                    if (el) el.removeAttribute('open');
                                  }}
                                >
                                  Close ✕
                                </button>
                              </div>
                              <div className="space-y-2">
                                {nonConjunctions.map((a, idx) => {
                                  const label = a.description || `${a.fromPlanet} ${a.aspectType} ${a.toPlanet}`;
                                  const style =
                                    a.aspectType === 'opposition' || a.aspectType === 'square' ? 'border-rose-200 bg-rose-50 text-rose-900' :
                                    a.aspectType === 'trine' || a.aspectType === 'sextile' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' :
                                    a.aspectType === 'drishti' ? 'border-indigo-200 bg-indigo-50 text-indigo-900' :
                                    'border-gray-200 bg-gray-50 text-gray-800';
                                  return (
                                    <div key={idx} className={`text-[14px] px-3 py-2 rounded border ${style}`}>
                                      • {label}{typeof a.orb === 'number' ? ` (${a.orb.toFixed(1)}°)` : ''}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </details>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Removed separate expanded list; unified into popovers above to keep UI clean */}

            <div className="mt-auto pt-3 flex items-center justify-between">
              {/* Confidence placeholder if present in data in future */}
              <div className="text-[12px] text-gray-500">
                Source: {event.source_name || 'manual'}
              </div>
              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
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
