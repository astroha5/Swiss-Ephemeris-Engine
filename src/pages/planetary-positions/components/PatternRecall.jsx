import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { patternRecallApi } from '../../../services/api';

const PatternRecall = ({ planetaryData, selectedDate, location }) => {
  const [activeTab, setActiveTab] = useState('all-events');
  const [searchParams, setSearchParams] = useState({
    planet: 'sun',
    sign: 'Aries',
    planetA: 'Sun',
    planetB: 'Moon',
    aspectType: 'conjunction',
    tags: '',
    date: selectedDate || new Date().toISOString().split('T')[0], // Use selected date if available
    dateRange: 30, // Days before/after the selected date
    limit: 50,
    // Simple search options
    searchType: 'all-events', // all-events, planetary-position, aspects, location, tags
    enableAdvanced: false
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
  const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const aspects = ['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx'];

  // Load system stats on mount
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      const response = await patternRecallApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Calculate date range from single date + range
      const centerDate = new Date(searchParams.date);
      const startDate = new Date(centerDate);
      const endDate = new Date(centerDate);
      
      startDate.setDate(centerDate.getDate() - searchParams.dateRange);
      endDate.setDate(centerDate.getDate() + searchParams.dateRange);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      let response;
      
      switch (activeTab) {
        case 'all-events':
          response = await patternRecallApi.getAllEvents(
            startDateStr,
            endDateStr,
            searchParams.limit
          );
          break;
        case 'planetary-position':
          response = await patternRecallApi.getByPlanetaryPosition(
            searchParams.planet,
            searchParams.sign,
            startDateStr,
            endDateStr,
            searchParams.limit
          );
          break;
        case 'aspects':
          response = await patternRecallApi.getByAspects(
            searchParams.planetA,
            searchParams.planetB,
            searchParams.aspectType,
            startDateStr,
            endDateStr,
            searchParams.limit
          );
          break;
        case 'location':
          if (location) {
            response = await patternRecallApi.getByLocation(
              location.latitude,
              location.longitude,
              100, // radius in km
              startDateStr,
              endDateStr,
              searchParams.limit
            );
          } else {
            setError('Location not available');
            return;
          }
          break;
        case 'tags':
          response = await patternRecallApi.getByTags(
            searchParams.tags,
            startDateStr,
            endDateStr,
            searchParams.limit
          );
          break;
        default:
          throw new Error('Invalid search type');
      }

      if (response.success) {
        setResults(response.data.events);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const handlePatternAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range from single date + range
      const centerDate = new Date(searchParams.date);
      const startDate = new Date(centerDate);
      const endDate = new Date(centerDate);
      
      startDate.setDate(centerDate.getDate() - searchParams.dateRange);
      endDate.setDate(centerDate.getDate() + searchParams.dateRange);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await patternRecallApi.getPatternAnalysis(
        searchParams.planet,
        searchParams.sign,
        startDateStr,
        endDateStr
      );

      if (response.success) {
        // Display pattern analysis results
        console.log('Pattern Analysis:', response.data);
        alert(`Pattern Analysis Results:\n\nTotal Events: ${response.data.analysis.totalEvents}\nAverage Tone: ${response.data.analysis.averageTone}\nCountries: ${response.data.analysis.countries.join(', ')}\n\nTop Events found! Check console for details.`);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Pattern analysis error:', error);
      setError(error.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'GDELT': return 'bg-blue-100 text-blue-800';
      case 'RSS': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderSearchForm = () => {
    switch (activeTab) {
      case 'planetary-position':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Planet</label>
              <select
                value={searchParams.planet}
                onChange={(e) => setSearchParams({...searchParams, planet: e.target.value})}
                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
              >
                {planets.map(planet => (
                  <option key={planet} value={planet}>{planet.charAt(0).toUpperCase() + planet.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Sign</label>
              <select
                value={searchParams.sign}
                onChange={(e) => setSearchParams({...searchParams, sign: e.target.value})}
                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
              >
                {signs.map(sign => (
                  <option key={sign} value={sign}>{sign}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'aspects':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Planet A</label>
              <select
                value={searchParams.planetA}
                onChange={(e) => setSearchParams({...searchParams, planetA: e.target.value})}
                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
              >
                {planetNames.map(planet => (
                  <option key={planet} value={planet}>{planet}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Planet B</label>
              <select
                value={searchParams.planetB}
                onChange={(e) => setSearchParams({...searchParams, planetB: e.target.value})}
                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
              >
                {planetNames.map(planet => (
                  <option key={planet} value={planet}>{planet}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Aspect Type</label>
              <select
                value={searchParams.aspectType}
                onChange={(e) => setSearchParams({...searchParams, aspectType: e.target.value})}
                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
              >
                {aspects.map(aspect => (
                  <option key={aspect} value={aspect}>{aspect.charAt(0).toUpperCase() + aspect.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="text-center py-4">
            <Icon name="MapPin" size={32} className="text-primary mx-auto mb-2" />
            <p className="text-text-secondary">
              Search for events near your current location
            </p>
            {location && (
              <p className="text-sm text-text-muted mt-2">
                {location.city}, {location.country} ({location.latitude.toFixed(2)}, {location.longitude.toFixed(2)})
              </p>
            )}
          </div>
        );

      case 'tags':
        return (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={searchParams.tags}
              onChange={(e) => setSearchParams({...searchParams, tags: e.target.value})}
              placeholder="e.g., conflict, finance, sun-aries"
              className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              Common tags: conflict, cooperation, finance, gdelt, sun-aries, moon-pisces
            </p>
          </div>
        );

      case 'all-events':
        return (
          <div className="text-center py-4">
            <Icon name="Calendar" size={32} className="text-primary mx-auto mb-2" />
            <p className="text-text-secondary">
              View all events within the selected date range
            </p>
            <p className="text-sm text-text-muted mt-2">
              No filters applied - showing all available events
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-strong overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Icon name="Search" size={20} className="text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                Pattern Recall
              </h2>
              <p className="text-sm text-text-secondary">
                Search historical events by planetary patterns
              </p>
            </div>
          </div>
          
          {/* System Stats */}
          {stats && (
            <div className="text-right text-sm text-text-muted">
              <div>Total Events: {stats.totalEvents?.toLocaleString() || 0}</div>
              <div>GDELT: {stats.gdeltEvents?.toLocaleString() || 0} | RSS: {stats.rssEvents?.toLocaleString() || 0}</div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
          {[
            { id: 'all-events', label: 'All Events', icon: 'Calendar' },
            { id: 'planetary-position', label: 'Planetary Position', icon: 'Globe' },
            { id: 'aspects', label: 'Aspects', icon: 'Zap' },
            { id: 'location', label: 'Location', icon: 'MapPin' },
            { id: 'tags', label: 'Tags', icon: 'Tag' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-text-muted hover:text-text-primary hover:bg-surface'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <div className="p-6 border-b border-border">
        {renderSearchForm()}
        
        {/* User-Friendly Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Center Date</label>
            <input
              type="date"
              value={searchParams.date}
              onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
              className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
            />
            <p className="text-xs text-text-muted mt-1">Search events around this date</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Date Range (± days)</label>
            <select
              value={searchParams.dateRange}
              onChange={(e) => setSearchParams({...searchParams, dateRange: parseInt(e.target.value)})}
              className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
            >
              <option value={7}>± 7 days (2 weeks total)</option>
              <option value={15}>± 15 days (1 month total)</option>
              <option value={30}>± 30 days (2 months total)</option>
              <option value={60}>± 60 days (4 months total)</option>
              <option value={90}>± 90 days (6 months total)</option>
              <option value={180}>± 180 days (1 year total)</option>
            </select>
            <p className="text-xs text-text-muted mt-1">How many days before/after to search</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={loading}
              iconName={loading ? "Loader2" : "Search"}
              iconPosition="left"
              className={loading ? "animate-spin" : ""}
            >
              {loading ? 'Searching...' : 'Search Events'}
            </Button>
            
            {activeTab === 'planetary-position' && (
              <Button
                variant="secondary"
                onClick={handlePatternAnalysis}
                disabled={loading}
                iconName="BarChart3"
                iconPosition="left"
              >
                Pattern Analysis
              </Button>
            )}
          </div>
          
          <div className="text-sm text-text-muted">
            Limit: {searchParams.limit} events
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-6">
        {error && (
          <div className="bg-error/5 border border-error/20 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={20} className="text-error" />
              <span className="text-error font-medium">Error</span>
            </div>
            <p className="text-text-secondary mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Icon name="Loader2" size={32} className="text-primary mx-auto mb-4 animate-spin" />
            <p className="text-text-secondary">Searching through historical events...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                Found {results.length} Events
              </h3>
              <Button
                variant="ghost"
                size="sm"
                iconName="Download"
                iconPosition="left"
                onClick={() => {
                  const csvContent = results.map(event => 
                    `"${event.title}","${event.timestamp}","${event.source}","${event.location?.city || ''}"`
                  ).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'pattern-recall-results.csv';
                  a.click();
                }}
              >
                Export CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {results.map((event, index) => (
                <div key={index} className="bg-surface-secondary rounded-lg border border-border p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary mb-1">{event.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        <div className="flex items-center space-x-1">
                          <Icon name="Calendar" size={14} />
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                        {event.location?.city && (
                          <div className="flex items-center space-x-1">
                            <Icon name="MapPin" size={14} />
                            <span>{event.location.city}</span>
                          </div>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(event.source)}`}>
                          {event.source}
                        </span>
                      </div>
                    </div>
                    
                    {event.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(event.link, '_blank')}
                        iconName="ExternalLink"
                        iconPosition="right"
                      >
                        View
                      </Button>
                    )}
                  </div>

                  {event.summary && (
                    <p className="text-sm text-text-secondary mb-3">{event.summary}</p>
                  )}

                  {/* Planetary Data */}
                  {event.astroSnapshot && (
                    <div className="bg-surface rounded-lg p-3 text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(event.astroSnapshot).slice(0, 4).map(([planet, data]) => (
                          <div key={planet} className="text-center">
                            <div className="font-medium text-text-primary">{planet.charAt(0).toUpperCase() + planet.slice(1)}</div>
                            <div className="text-text-muted">{data.sign}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {event.tags.slice(0, 5).map((tag, tagIndex) => (
                        <span key={tagIndex} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {event.tags.length > 5 && (
                        <span className="text-text-muted text-xs">+{event.tags.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center py-8">
            <Icon name="Search" size={48} className="text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No Events Found
            </h3>
            <p className="text-text-secondary">
              Try adjusting your search parameters or expanding the date range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternRecall;
