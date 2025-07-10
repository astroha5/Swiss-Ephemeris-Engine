import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import DateSelector from './components/DateSelector';
import LocationSelector from './components/LocationSelector';
import PlanetaryChart from './components/PlanetaryChart';
import PlanetaryTable from './components/PlanetaryTable';
import LoadingShimmer from './components/LoadingShimmer';
import TimeZoneWidget from './components/TimeZoneWidget';
import BookmarkedDates from './components/BookmarkedDates';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { generateKundli } from '../../services/api';

const PlanetaryPositions = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [location, setLocation] = useState(null);
  const [planetaryData, setPlanetaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarkedDates, setBookmarkedDates] = useState([]);

  // Detect user's location on component mount
  useEffect(() => {
    detectUserLocation();
  }, []);

  // Auto-fetch data when date, time, or location changes
  useEffect(() => {
    if (location) {
      fetchPlanetaryData();
    }
  }, [selectedDate, selectedTime, location]);

  const detectUserLocation = async () => {
    try {
      setIsLoading(true);
      
      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get location name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': 'Astrova-App/1.0 (https://astrova.app)'
                  }
                }
              );
              const data = await response.json();
              
              const locationData = {
                latitude,
                longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                formattedAddress: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
                country: data.address?.country || 'Unknown'
              };
              
              setLocation(locationData);
            } catch (error) {
              console.error('Reverse geocoding failed:', error);
              // Fallback to coordinates only
              setLocation({
                latitude,
                longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                city: 'Current Location',
                country: 'Unknown'
              });
            }
          },
          (error) => {
            console.error('Geolocation failed:', error);
            setDefaultLocation();
          }
        );
      } else {
        setDefaultLocation();
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      setDefaultLocation();
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultLocation = () => {
    // Default to New Delhi, India
    setLocation({
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 'Asia/Kolkata',
      formattedAddress: 'New Delhi, India',
      city: 'New Delhi',
      country: 'India'
    });
  };

  const fetchPlanetaryData = async () => {
    if (!location) return;

    try {
      setIsLoading(true);
      setError(null);

      // Format date for API
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      const requestData = {
        date: formattedDate,
        time: selectedTime,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        name: 'Planetary Positions',
        place: location.formattedAddress
      };

      const response = await generateKundli(requestData);
      
      if (response && response.success) {
        setPlanetaryData(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch planetary data');
      }
    } catch (error) {
      console.error('Error fetching planetary data:', error);
      setError(error.message || 'Failed to fetch planetary positions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const handleQuickDateSelect = (type) => {
    const today = new Date();
    const newDate = new Date(today);

    switch (type) {
      case 'today':
        setSelectedDate(today);
        break;
      case 'yesterday':
        newDate.setDate(today.getDate() - 1);
        setSelectedDate(newDate);
        break;
      case 'tomorrow':
        newDate.setDate(today.getDate() + 1);
        setSelectedDate(newDate);
        break;
      case 'nextWeek':
        newDate.setDate(today.getDate() + 7);
        setSelectedDate(newDate);
        break;
      case 'prevWeek':
        newDate.setDate(today.getDate() - 7);
        setSelectedDate(newDate);
        break;
      default:
        break;
    }
  };

  const handleBookmarkDate = () => {
    const bookmark = {
      id: Date.now(),
      date: selectedDate,
      time: selectedTime,
      location: location,
      timestamp: new Date()
    };

    setBookmarkedDates(prev => [bookmark, ...prev.slice(0, 4)]); // Keep only 5 bookmarks
  };

  const handleLoadBookmark = (bookmark) => {
    setSelectedDate(new Date(bookmark.date));
    setSelectedTime(bookmark.time);
    setLocation(bookmark.location);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Planetary Positions - Astrova</title>
        <meta 
          name="description" 
          content="View real-time planetary positions with interactive charts and detailed tables. Navigate through different dates and locations to see how planetary positions change over time." 
        />
        <meta name="keywords" content="planetary positions, astrology, real-time planets, ephemeris, astronomical data" />
        <link rel="canonical" href="/planetary-positions" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        
        {/* Floating Timezone & Location Widget */}
        {location && <TimeZoneWidget location={location} />}
        
        <main className="pt-4 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Globe" size={24} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
                    Planetary Positions
                  </h1>
                  <p className="text-text-secondary font-body">
                    {isToday ? 'Today\'s live planetary positions' : 'Historical planetary positions'} for your location
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
                <span className="text-primary">Planetary Positions</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Controls Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Date Selector */}
                <DateSelector
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onQuickSelect={handleQuickDateSelect}
                  selectedTime={selectedTime}
                  onTimeChange={handleTimeChange}
                />

                {/* Location Selector */}
                <LocationSelector
                  location={location}
                  onLocationChange={handleLocationChange}
                />

                {/* Bookmarked Dates */}
                {bookmarkedDates.length > 0 && (
                  <BookmarkedDates
                    bookmarks={bookmarkedDates}
                    onLoadBookmark={handleLoadBookmark}
                    onClearBookmarks={() => setBookmarkedDates([])}
                  />
                )}

                {/* Bookmark Current */}
                {location && (
                  <div className="bg-surface border border-border rounded-lg p-4">
                    <Button
                      variant="outline"
                      onClick={handleBookmarkDate}
                      iconName="Bookmark"
                      iconPosition="left"
                      fullWidth
                      className="text-sm"
                    >
                      Bookmark This Date & Location
                    </Button>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-8">
                {isLoading ? (
                  <LoadingShimmer />
                ) : error ? (
                  <div className="bg-error/5 border border-error/20 rounded-lg p-6 text-center">
                    <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-error mb-2">Error Loading Data</h3>
                    <p className="text-text-secondary mb-4">{error}</p>
                    <Button
                      variant="primary"
                      onClick={fetchPlanetaryData}
                      iconName="RefreshCw"
                      iconPosition="left"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : planetaryData ? (
                  <>
                    {/* Planetary Chart */}
                    <PlanetaryChart 
                      chartData={planetaryData}
                      selectedDate={selectedDate}
                      location={location}
                    />

                    {/* Planetary Table */}
                    <PlanetaryTable 
                      planetaryData={planetaryData.planetaryData}
                      selectedDate={selectedDate}
                      location={location}
                    />
                  </>
                ) : (
                  <div className="bg-surface border border-border rounded-lg p-12 text-center">
                    <Icon name="Search" size={48} className="text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Select Date and Location
                    </h3>
                    <p className="text-text-secondary">
                      Choose a date and location to view planetary positions and charts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default PlanetaryPositions;
