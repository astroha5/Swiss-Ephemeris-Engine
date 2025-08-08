import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { getPlanetaryTransits, getMonthlyTransits } from '../../services/api';

const PlanetTransit = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState('yearly'); // 'yearly' or 'monthly'
  const [transitData, setTransitData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showRetrograde, setShowRetrograde] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Auto-fetch data when year or view mode changes
  useEffect(() => {
    fetchTransitData();
  }, [selectedYear, selectedMonth, viewMode]);

  const fetchTransitData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      if (viewMode === 'yearly') {
        response = await getPlanetaryTransits(selectedYear, 'UTC');
      } else {
        response = await getMonthlyTransits(selectedMonth, selectedYear, 'UTC');
      }
      
      if (response && response.success) {
        setTransitData(response.data);
      } else {
        throw new Error(response?.error || 'Failed to fetch planetary transits');
      }
    } catch (error) {
      console.error('Error fetching transits:', error);
      setError(error.message || 'Failed to fetch planetary transits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (increment) => {
    setSelectedYear(prev => prev + increment);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleRowExpansion = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const getAngularStatus = (transit) => {
    // Calculate Vedic aspects with other planets
    const aspects = [];
    if (transitData?.transits) {
      const currentDate = new Date(transit.ingressDate);
      const sameDayTransits = transitData.transits.filter(t => 
        t.planet !== transit.planet && 
        Math.abs(new Date(t.ingressDate) - currentDate) < 7 * 24 * 60 * 60 * 1000 // Within a week
      );
      
      // Vedic aspect rules
      const vedicAspects = {
        'Mars': [4, 7, 8],
        'Jupiter': [5, 7, 9], 
        'Saturn': [3, 7, 10],
        'Sun': [7],
        'Moon': [7],
        'Mercury': [7],
        'Venus': [7],
        'Rahu': [7],
        'Ketu': [7]
      };
      
      const aspectRules = vedicAspects[transit.planet] || [7];
      
      sameDayTransits.forEach(otherTransit => {
        const signsDiff = getSignDistance(transit.toSign, otherTransit.toSign);
        
        // Check if the sign distance matches any Vedic aspect
        if (aspectRules.includes(signsDiff)) {
          const aspectName = signsDiff === 7 ? 'Opposition' : `${signsDiff}th House Aspect`;
          const degreesDiff = Math.abs(transit.degreeInSign - otherTransit.degreeInSign);
          aspects.push({ 
            type: aspectName.toLowerCase().replace(/[^a-z]/g, ''), 
            planet: otherTransit.planet, 
            orb: degreesDiff,
            houseDistance: signsDiff
          });
        }
      });
    }
    return aspects;
  };

  const getSignDistance = (sign1, sign2) => {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const index1 = signs.indexOf(sign1);
    const index2 = signs.indexOf(sign2);
    let distance = index2 - index1;
    if (distance <= 0) distance += 12;
    return distance;
  };

  const getAspectIcon = (aspectType) => {
    const icons = {
      opposition: '☍',
      '3rdhouseaspect': '3',
      '4thhouseaspect': '4', 
      '5thhouseaspect': '5',
      '7thhouseaspect': '☍',
      '8thhouseaspect': '8',
      '9thhouseaspect': '9',
      '10thhouseaspect': '10'
    };
    return icons[aspectType] || '◯';
  };

  const getAspectColor = (aspectType) => {
    const colors = {
      opposition: 'text-red-500',
      '3rdhouseaspect': 'text-orange-500',
      '4thhouseaspect': 'text-orange-600',
      '5thhouseaspect': 'text-green-500',
      '7thhouseaspect': 'text-red-500',
      '8thhouseaspect': 'text-purple-600',
      '9thhouseaspect': 'text-green-600',
      '10thhouseaspect': 'text-blue-600'
    };
    return colors[aspectType] || 'text-gray-500';
  };

  const exportTransitData = () => {
    const dataToExport = {
      year: selectedYear,
      viewMode: viewMode,
      transits: filteredTransits,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `astrova-transits-${selectedYear}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareTransit = (transit) => {
    const shareText = `${transit.planet} transits from ${transit.fromSign} to ${transit.toSign} on ${new Date(transit.ingressDate).toLocaleDateString()}\n\n${transit.description || 'Astrological transit information'}\n\nCalculated by Astrova - Swiss Ephemeris`;
    
    if (navigator.share) {
      navigator.share({
        title: `${transit.planet} Transit - Astrova`,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Transit information copied to clipboard!');
    }
  };

  const handleViewImpactOnChart = () => {
    // Check if user has generated a chart (stored in localStorage)
    const hasGeneratedChart = localStorage.getItem('astrova_chart_data') || 
                              localStorage.getItem('astrova_birth_details') ||
                              sessionStorage.getItem('astrova_chart_data') ||
                              sessionStorage.getItem('astrova_birth_details');
    
    if (hasGeneratedChart) {
      // Redirect to dashboard with Monthly Prediction section
      window.location.href = '/chart-results-dashboard?section=monthly-prediction';
    } else {
      // Redirect to birth details form to generate chart first
      window.location.href = '/birth-details-form';
    }
  };

  const getMoonTransits = () => {
    if (!transitData?.transits) return [];
    return transitData.transits.filter(t => t.planet === 'Moon');
  };

  const getTithi = (moonDegree) => {
    // Simplified tithi calculation - in real app would use proper lunar calendar
    const tithiNames = [
      'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami',
      'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya/Purnima'
    ];
    const tithiIndex = Math.floor(moonDegree / 12) % 15;
    return tithiNames[tithiIndex];
  };

  const getFilteredTransits = () => {
    if (!transitData?.transits) return [];

    let filtered = transitData.transits;

    // Apply planet filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(transit => 
        transit.planet.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    // Apply retrograde filter
    if (showRetrograde) {
      filtered = filtered.filter(transit => transit.isRetrograde);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || a.ingressDate;
      let bValue = b[sortBy] || b.ingressDate;
      
      if (sortBy === 'date') {
        aValue = new Date(a.ingressDate);
        bValue = new Date(b.ingressDate);
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const getPlanetSymbol = (planet) => {
    const symbols = {
      'Sun': '☉',
      'Moon': '☽',
      'Mars': '♂',
      'Mercury': '☿',
      'Jupiter': '♃',
      'Venus': '♀',
      'Saturn': '♄',
      'Rahu': '☊',
      'Ketu': '☋'
    };
    return symbols[planet] || '●';
  };

  const getPlanetColor = (planet) => {
    const colors = {
      'Sun': 'text-orange-500',
      'Moon': 'text-blue-400',
      'Mars': 'text-red-500',
      'Mercury': 'text-green-500',
      'Jupiter': 'text-yellow-500',
      'Venus': 'text-pink-500',
      'Saturn': 'text-purple-600',
      'Rahu': 'text-gray-600',
      'Ketu': 'text-gray-500'
    };
    return colors[planet] || 'text-text-muted';
  };

  const getSignificanceBadge = (significance) => {
    const badgeClasses = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeClasses[significance] || badgeClasses.medium}`}>
        {significance?.charAt(0).toUpperCase() + significance?.slice(1)}
      </span>
    );
  };

  const getRetrogradeBadge = (isRetrograde) => {
    if (isRetrograde) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
          <Icon name="RotateCcw" size={10} className="mr-1" />
          R
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
        <Icon name="ArrowRight" size={10} className="mr-1" />
        D
      </span>
    );
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <Icon name="ArrowUpDown" size={14} className="text-text-muted opacity-50" />;
    }
    return (
      <Icon 
        name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} 
        size={14} 
        className="text-primary" 
      />
    );
  };

  const filteredTransits = getFilteredTransits();

  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Planetary Transits - Astrova</title>
        <meta 
          name="description" 
          content="Explore accurate planetary transits based on Swiss Ephemeris calculations. Track major planet movements through zodiac signs and nakshatras with precise timing." 
        />
        <meta name="keywords" content="planetary transits, astrology, vedic astrology, swiss ephemeris, planet movements, zodiac signs, nakshatra" />
        <link rel="canonical" href="/planet-transits" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        
        {/* Add top padding to account for fixed header height */}
        <main className="pt-20 md:pt-24 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Globe" size={24} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
                    Planetary Transits
                  </h1>
                  <p className="text-text-secondary font-body">
                    Accurate planetary movements and cosmic influences
                  </p>
                </div>
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center justify-center space-x-2 text-sm text-text-muted">
                <Button
                  variant="link"
                  onClick={() => window.location.href = '/home-landing-page'}
                  className="text-text-muted hover:text-primary p-0 h-auto"
                >
                  Home
                </Button>
                <Icon name="ChevronRight" size={14} />
                <span className="text-primary">Planetary Transits</span>
              </div>
            </div>

            {/* View Mode Toggle & Navigation */}
            <div className="text-center mb-8">
              <div className="bg-surface border border-border rounded-xl p-6 max-w-4xl mx-auto">
                {/* View Mode Toggle */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <Button
                    variant={viewMode === 'yearly' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('yearly')}
                    iconName="Calendar"
                    iconPosition="left"
                  >
                    Yearly View
                  </Button>
                  <Button
                    variant={viewMode === 'monthly' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('monthly')}
                    iconName="CalendarDays"
                    iconPosition="left"
                  >
                    Monthly View
                  </Button>
                </div>

                <h2 className="text-4xl font-heading font-bold text-primary mb-2">
                  {viewMode === 'yearly' ? `${selectedYear} Transit Calendar` : 
                   `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth - 1]} ${selectedYear} Transits`}
                </h2>
                <p className="text-text-secondary mb-6">
                  {viewMode === 'yearly' ? 'Comprehensive planetary movements based on Swiss Ephemeris' : 
                   'Monthly planetary movements and cosmic influences'}
                </p>
                
                {/* Navigation Controls */}
                <div className="flex items-center justify-center space-x-4">
                  {viewMode === 'yearly' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleYearChange(-1)}
                        iconName="ChevronLeft"
                        iconPosition="left"
                      >
                        {selectedYear - 1}
                      </Button>
                      
                      <div className="text-lg font-semibold text-text-primary px-4">
                        {selectedYear}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleYearChange(1)}
                        iconName="ChevronRight"
                        iconPosition="right"
                      >
                        {selectedYear + 1}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMonth(prev => prev === 1 ? 12 : prev - 1)}
                        iconName="ChevronLeft"
                        iconPosition="left"
                      >
                        {['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][selectedMonth - 1]}
                      </Button>
                      
                      <div className="text-lg font-semibold text-text-primary px-4">
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth - 1]} {selectedYear}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMonth(prev => prev === 12 ? 1 : prev + 1)}
                        iconName="ChevronRight"
                        iconPosition="right"
                      >
                        {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'][selectedMonth - 1]}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Major Highlights */}
            {transitData?.majorHighlights && transitData.majorHighlights.length > 0 && (
              <div className="bg-surface border border-border rounded-xl shadow-strong p-6 mb-8">
                <h3 className="text-xl font-heading font-semibold text-text-primary mb-4 flex items-center space-x-2">
                  <Icon name="Star" size={20} className="text-accent" />
                  <span>{selectedYear} Major Transit Highlights</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transitData.majorHighlights.slice(0, 6).map((highlight, index) => (
                    <div key={index} className="bg-surface-secondary rounded-lg p-4 border border-border">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-lg ${getPlanetColor(highlight.planet)}`}>
                          {getPlanetSymbol(highlight.planet)}
                        </span>
                        <h4 className="font-semibold text-text-primary">{highlight.planet}</h4>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">
                        {highlight.fromSign} → {highlight.toSign}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(highlight.ingressDate).toLocaleDateString()}
                      </p>
                      {highlight.description && (
                        <p className="text-sm text-text-secondary mt-2">
                          {highlight.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="space-y-8">
              {isLoading ? (
                <div className="bg-surface border border-border rounded-xl shadow-strong p-8 text-center">
                  <Icon name="Loader2" size={32} className="text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-text-secondary">Loading planetary transits...</p>
                </div>
              ) : error ? (
                <div className="bg-error/5 border border-error/20 rounded-lg p-6 text-center">
                  <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-error mb-2">Error Loading Data</h3>
                  <p className="text-text-secondary mb-4">{error}</p>
                  <Button
                    variant="primary"
                    onClick={fetchTransitData}
                    iconName="RefreshCw"
                    iconPosition="left"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-xl shadow-strong overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-accent/5 to-primary/5 border-b border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                          <Icon name="Calendar" size={20} className="text-accent" />
                        </div>
                        <div>
                          <h2 className="text-xl font-heading font-semibold text-text-primary">
                            Transit Calendar
                          </h2>
                          <p className="text-sm text-text-secondary">
                            {filteredTransits.length} planetary movements for {selectedYear}
                          </p>
                        </div>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={showRetrograde ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setShowRetrograde(!showRetrograde)}
                          iconName="RotateCcw"
                          iconPosition="left"
                          className="text-xs"
                        >
                          {showRetrograde ? 'All' : 'Retrograde'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportTransitData}
                          iconName="Download"
                          iconPosition="left"
                          className="text-xs"
                        >
                          Export
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleViewImpactOnChart}
                          iconName="User"
                          iconPosition="left"
                          className="text-xs"
                        >
                          View Impact on My Chart
                        </Button>
                      </div>
                    </div>
                    
                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {['all', 'Jupiter', 'Saturn', 'Mars', 'Venus', 'Mercury', 'Sun', 'Moon'].map(filter => (
                        <Button
                          key={filter}
                          variant={activeFilter === filter ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handleFilterChange(filter)}
                          className="text-xs"
                        >
                          {filter === 'all' ? 'All Planets' : filter}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-secondary border-b border-border">
                        <tr>
                          <th 
                            className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-secondary/50 transition-colors"
                            onClick={() => handleSort('planet')}
                          >
                            <div className="flex items-center space-x-2">
                              <span>Planet</span>
                              <SortIcon column="planet" />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-secondary/50 transition-colors"
                            onClick={() => handleSort('date')}
                          >
                            <div className="flex items-center space-x-2">
                              <span>Ingress Date</span>
                              <SortIcon column="date" />
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Transit
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Nakshatra
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Motion
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Significance
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Angular Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredTransits.map((transit, index) => (
                          <React.Fragment key={index}>
                            <tr className="hover:bg-surface-secondary/30 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <span className={`text-lg ${getPlanetColor(transit.planet)}`}>
                                    {getPlanetSymbol(transit.planet)}
                                  </span>
                                  <div className="text-sm font-medium text-text-primary">
                                    {transit.planet}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-text-primary">
                                  {new Date(transit.ingressDate).toLocaleDateString()}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-text-primary">
                                  <span className="text-text-muted">{transit.fromSign}</span>
                                  <Icon name="ArrowRight" size={12} className="mx-1 text-text-muted" />
                                  <span className="font-medium">{transit.toSign}</span>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  <div className="font-medium text-text-primary">
                                    {transit.nakshatra}
                                  </div>
                                  <div className="text-text-muted text-xs">
                                    Pada {transit.nakshatraPada}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getRetrogradeBadge(transit.isRetrograde)}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-text-secondary">
                                  {transit.duration}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getSignificanceBadge(transit.significance)}
                              </td>
                              
                              {/* Angular Status */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {getAngularStatus(transit).slice(0, 3).map((aspect, aspectIndex) => (
                                    <span 
                                      key={aspectIndex}
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getAspectColor(aspect.type)} bg-opacity-10`}
                                      title={`${aspect.type} with ${aspect.planet} (${aspect.orb.toFixed(1)}°)`}
                                    >
                                      <span className="mr-1">{getAspectIcon(aspect.type)}</span>
                                      {aspect.planet}
                                    </span>
                                  ))}
                                  {getAngularStatus(transit).length === 0 && (
                                    <span className="text-xs text-text-muted">None</span>
                                  )}
                                  {getAngularStatus(transit).length > 3 && (
                                    <span className="text-xs text-text-muted">+{getAngularStatus(transit).length - 3} more</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Actions */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleRowExpansion(index)}
                                    className="text-primary hover:text-primary-dark transition-colors"
                                    title="View Details"
                                  >
                                    <Icon 
                                      name={expandedRows.has(index) ? "ChevronUp" : "ChevronDown"} 
                                      size={16} 
                                    />
                                  </button>
                                  <button
                                    onClick={() => shareTransit(transit)}
                                    className="text-text-muted hover:text-text-primary transition-colors"
                                    title="Share Transit"
                                  >
                                    <Icon name="Share" size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {expandedRows.has(index) && (
                              <tr className="bg-surface-secondary/30">
                                <td colSpan="9" className="px-6 py-4">
                                  <div className="space-y-4">
                                    {/* Transit Description */}
                                    {transit.description && (
                                      <div className="bg-surface rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-text-primary mb-2 flex items-center">
                                          <Icon name="BookOpen" size={16} className="mr-2" />
                                          Astrological Interpretation
                                        </h4>
                                        <p className="text-text-secondary text-sm leading-relaxed">
                                          {transit.description}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Detailed Angular Status */}
                                    {getAngularStatus(transit).length > 0 && (
                                      <div className="bg-surface rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-text-primary mb-2 flex items-center">
                                          <Icon name="Zap" size={16} className="mr-2" />
                                          Angular Relationships
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {getAngularStatus(transit).map((aspect, aspectIndex) => (
                                            <div key={aspectIndex} className="flex items-center space-x-2 text-sm">
                                              <span className={`${getAspectColor(aspect.type)} font-medium`}>
                                                {getAspectIcon(aspect.type)}
                                              </span>
                                              <span className="text-text-secondary">
                                                {aspect.type} with {aspect.planet} (Orb: {aspect.orb.toFixed(1)}°)
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Moon-specific Details */}
                                    {transit.planet === 'Moon' && (
                                      <div className="bg-surface rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-text-primary mb-2 flex items-center">
                                          <Icon name="Moon" size={16} className="mr-2" />
                                          Lunar Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium text-text-primary">Tithi:</span>
                                            <span className="ml-2 text-text-secondary">
                                              {getTithi(transit.degreeInSign || 0)}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-text-primary">Degree:</span>
                                            <span className="ml-2 text-text-secondary">
                                              {transit.degreeInSign?.toFixed(2) || 'N/A'}° in {transit.toSign}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Additional Info */}
                                    <div className="bg-surface rounded-lg p-4 border border-border">
                                      <h4 className="font-semibold text-text-primary mb-2 flex items-center">
                                        <Icon name="Info" size={16} className="mr-2" />
                                        Additional Information
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium text-text-primary">Exact Time:</span>
                                          <span className="ml-2 text-text-secondary">
                                            {new Date(transit.ingressDate).toLocaleString()}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-text-primary">Transit Speed:</span>
                                          <span className="ml-2 text-text-secondary">
                                            {transit.isRetrograde ? 'Retrograde' : 'Direct'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-text-primary">Impact Level:</span>
                                          <span className="ml-2 text-text-secondary">
                                            {transit.significance} significance
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t border-border bg-surface-secondary p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4 text-text-muted">
                        <div className="flex items-center space-x-1">
                          <Icon name="Calendar" size={14} />
                          <span>Year: {selectedYear}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon name="Info" size={14} />
                          <span>Total: {filteredTransits.length} transits</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-text-muted">
                        <Icon name="Zap" size={14} />
                        <span>Swiss Ephemeris</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default PlanetTransit;
