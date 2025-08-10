import React, { useState, useEffect } from 'react';
import DateSelector from '../../planetary-positions/components/DateSelector';
import LocationSelector from '../../planetary-positions/components/LocationSelector';
import PlanetaryChart from '../../planetary-positions/components/PlanetaryChart';
import PlanetaryTable from '../../planetary-positions/components/PlanetaryTable';
import LoadingShimmer from '../../planetary-positions/components/LoadingShimmer';
import TimeZoneWidget from '../../planetary-positions/components/TimeZoneWidget';
import BookmarkedDates from '../../planetary-positions/components/BookmarkedDates';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { getPlanetaryPositions, getPlanetaryPositionsReport } from '../../../services/api';

const PlanetaryPositionsTab = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [location, setLocation] = useState(null);
  const [planetaryData, setPlanetaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarkedDates, setBookmarkedDates] = useState([]);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    detectUserLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchPlanetaryData();
    }
  }, [selectedDate, selectedTime, location]);

  const detectUserLocation = async () => {
    try {
      setIsLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                { headers: { 'User-Agent': 'Astrova-App/1.0 (https://astrova.app)' } }
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
    setLocation({
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
      formattedAddress: 'Kolkata, West Bengal, India',
      city: 'Kolkata',
      country: 'India'
    });
  };

  const fetchPlanetaryData = async () => {
    if (!location) return;
    try {
      setIsLoading(true);
      setError(null);
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
      const response = await getPlanetaryPositions(requestData);
      if (response && response.success) {
        setPlanetaryData(response.data);
        generateReport(formattedDate, selectedTime, location);
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

  const generateReport = async (dateStr, timeStr, loc) => {
    try {
      setReportLoading(true);
      setReportError(null);
      setReport(null);
      const payload = {
        date: dateStr,
        time: timeStr,
        latitude: loc.latitude,
        longitude: loc.longitude,
        timezone: loc.timezone,
        place: loc.formattedAddress,
        location_name: loc.city || loc.formattedAddress
      };
      const response = await getPlanetaryPositionsReport(payload);
      if (response && response.success) {
        setReport(response.data);
      } else {
        throw new Error(response?.message || 'Failed to generate report');
      }
    } catch (e) {
      console.error('Report generation failed:', e);
      setReportError(e.message || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDateChange = (date) => setSelectedDate(date);
  const handleTimeChange = (time) => setSelectedTime(time);
  const handleLocationChange = (newLocation) => setLocation(newLocation);

  const handleQuickDateSelect = (type) => {
    const today = new Date();
    const newDate = new Date(today);
    switch (type) {
      case 'today':
        setSelectedDate(today);
        break;
      case 'previousDay':
        newDate.setDate(today.getDate() - 1);
        setSelectedDate(newDate);
        break;
      case 'nextDay':
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
    setBookmarkedDates((prev) => [bookmark, ...prev.slice(0, 4)]);
  };

  const handleLoadBookmark = (bookmark) => {
    setSelectedDate(new Date(bookmark.date));
    setSelectedTime(bookmark.time);
    setLocation(bookmark.location);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      {location && <TimeZoneWidget location={location} />}

      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Globe" size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Planetary Positions</h2>
            <p className="text-text-secondary font-body">
              {isToday ? "Today's live planetary positions" : 'Historical planetary positions'} for your location
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onQuickSelect={handleQuickDateSelect}
            selectedTime={selectedTime}
            onTimeChange={handleTimeChange}
            timezoneLabel={location?.timezone}
          />

          <LocationSelector location={location} onLocationChange={handleLocationChange} />

          {bookmarkedDates.length > 0 && (
            <BookmarkedDates
              bookmarks={bookmarkedDates}
              onLoadBookmark={handleLoadBookmark}
              onClearBookmarks={() => setBookmarkedDates([])}
            />
          )}

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

        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <LoadingShimmer />
          ) : error ? (
            <div className="bg-error/5 border border-error/20 rounded-lg p-6 text-center">
              <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-error mb-2">Error Loading Data</h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <Button variant="primary" onClick={fetchPlanetaryData} iconName="RefreshCw" iconPosition="left">
                Try Again
              </Button>
            </div>
          ) : planetaryData ? (
            <>
              <PlanetaryChart chartData={planetaryData} selectedDate={selectedDate} location={location} />

              <PlanetaryTable planetaryData={planetaryData} selectedDate={selectedDate} location={location} />

              <div className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Pattern-Aware Predictive Report</h3>
                  <Button
                    variant="outline"
                    iconName="RefreshCw"
                    onClick={() => generateReport(selectedDate.toISOString().split('T')[0], selectedTime, location)}
                  >
                    Refresh Report
                  </Button>
                </div>
                {reportLoading ? (
                  <LoadingShimmer />
                ) : reportError ? (
                  <div className="text-error text-sm">{reportError}</div>
                ) : report ? (
                  <div className="space-y-6">
                    <div className="text-sm text-text-muted">
                      {`${location?.city ? `${location.city}${location.country ? `, ${location.country}` : ''}` : (location?.formattedAddress || 'Selected Location')}`}
                      {` — ${selectedDate.toISOString().split('T')[0]} ${selectedTime} (${location?.timezone || 'Local Time'})`}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {(() => {
                        const activeCount = Array.isArray(report.activePatterns) ? report.activePatterns.length : 0;
                        const histCount = Array.isArray(report.historicalParallels) ? report.historicalParallels.length : 0;
                        const topSignals = Array.isArray(report.predictiveOutlook)
                          ? [...report.predictiveOutlook]
                              .sort((a, b) => (b?.probability || 0) - (a?.probability || 0))
                              .slice(0, 2)
                          : [];
                        const toTitleCase = (text) => (typeof text === 'string' && text.length > 0) ? text.charAt(0).toUpperCase() + text.slice(1) : '';
                        const topSignalsText = topSignals.length
                          ? `; top signals: ${topSignals.map((s) => `${toTitleCase(s.category)} (${s.probability}%)`).join(', ')}`
                          : '';
                        return `At a glance: ${activeCount} active patterns; ${histCount} historical parallels${topSignalsText}`;
                      })()}
                    </div>

                    <section>
                      <h4 className="text-md font-semibold mb-2">Active Patterns</h4>
                      {report.activePatterns?.length ? (
                        <ul className="space-y-2 text-sm">
                          {report.activePatterns.map((p, idx) => (
                            <li key={idx} className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{p.headline || p.name || ''}</span>
                              </div>
                              {!p.headline && p.interpretation && (
                                <div className="text-text-secondary">
                                  <span className="text-text-primary/80">Interpretation:</span> {p.interpretation}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-text-muted text-sm">No strong patterns found. Focus on planetary overview.</div>
                      )}
                    </section>

                    <section>
                      <h4 className="text-md font-semibold mb-2">Historical Parallels</h4>
                      {report.historicalParallels?.length ? (
                        <ul className="space-y-1.5 text-sm">
                          {report.historicalParallels.map((e, idx) => (
                            <li key={idx}>
                              <div>
                                <span className="font-medium">{e.date?.slice(0, 10)}</span>{' '}— {e.title}{' '}
                                <span className="text-text-muted">{`${e.category || 'General'} · ${e.impact_level || '—'}${typeof e.similarity_score === 'number' ? ` · ${e.similarity_score}% similarity` : ''}`}</span>
                              </div>
                              {e.summary && <div className="text-text-secondary text-xs">{e.summary}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-text-muted text-sm">No close historical parallels found.</div>
                      )}
                    </section>

                    <section>
                      <h4 className="text-md font-semibold mb-2">Predictive Outlook</h4>
                      {report.predictiveOutlook?.length ? (
                        <ul className="space-y-1.5 text-sm">
                          {report.predictiveOutlook.map((o, idx) => (
                            <li key={idx}>
                              <div className="flex items-center justify-between">
                                <span className="capitalize">{o.category}</span>
                                <span className={`text-text-muted`}>{o.likelihood} · {o.probability}%</span>
                              </div>
                              {o.context && <div className="text-text-secondary text-xs">{o.context}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-text-muted text-sm">Insufficient signal for predictions.</div>
                      )}
                    </section>

                    {report.timeline?.enabled && (
                      <section>
                        <h4 className="text-md font-semibold mb-2">Timeline View (±24h)</h4>
                        <div className="text-text-secondary text-xs mb-2">{report.timeline.note}</div>
                        {Array.isArray(report.timeline.entries) && report.timeline.entries.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {report.timeline.entries.map((t, idx) => (
                              <li key={idx} className="flex items-center justify-between">
                                <span>
                                  {t.pair} — {t.aspect}
                                  {t.fromHouse && t.toHouse ? ` (H${t.fromHouse}→H${t.toHouse})` : ''}
                                  {` (orb ${t.orb}°)`}
                                </span>
                                <span className="text-text-muted">{t.status} · {t.strength} · {t.window}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-text-muted text-sm">No key progressions identified.</div>
                        )}
                      </section>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-12 text-center">
              <Icon name="Search" size={48} className="text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Select Date and Location</h3>
              <p className="text-text-secondary">Choose a date and location to view planetary positions and charts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanetaryPositionsTab;
