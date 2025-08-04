import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const ChartOverview = ({ chartData, birthDetails, dashaData, dashaLoading }) => {
  const [realData, setRealData] = useState(null);
  const [isRealChart, setIsRealChart] = useState(false);

  // Load real chart data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('birthChartData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setRealData(parsedData);
        setIsRealChart(parsedData.isRealData === true);
      } catch (error) {
        console.error('Failed to parse stored chart data:', error);
      }
    }
  }, []);

  // Mock data as fallback
  const mockBirthDetails = {
    name: 'Sample User',
    dateOfBirth: '1990-03-15',
    timeOfBirth: '14:30',
    placeOfBirth: 'Mumbai, Maharashtra, India',
    latitude: '19.0760',
    longitude: '72.8777',
    timezone: 'Asia/Kolkata'
  };

  const mockChartSummary = {
    ascendant: {
      sign: 'Aries',
      degree: '15°23\'',
      lord: 'Mars',
      nakshatra: 'Bharani'
    },
    moonSign: {
      sign: 'Cancer',
      degree: '05°32\'',
      lord: 'Moon',
      nakshatra: 'Pushya'
    },
    sunSign: {
      sign: 'Aries',
      degree: '15°23\'',
      lord: 'Sun',
      nakshatra: 'Bharani'
    },
    currentDasha: {
      mahadasha: 'Jupiter',
      antardasha: 'Saturn',
      remainingYears: 12.2,
      remainingMonths: 14.5
    },
    yogas: [
      { name: 'Gaja Kesari Yoga', strength: 'Strong', effect: 'Wealth and wisdom' },
      { name: 'Raj Yoga', strength: 'Moderate', effect: 'Leadership and authority' },
      { name: 'Dhana Yoga', strength: 'Weak', effect: 'Financial prosperity' }
    ],
    doshas: [
      { name: 'Mangal Dosha', present: false, severity: null },
      { name: 'Kaal Sarp Dosha', present: true, severity: 'Mild' },
      { name: 'Pitra Dosha', present: false, severity: null }
    ]
  };

  // Use real data if available, otherwise use mock data
  let details, summary;
  
  // Try to extract real data from various sources
  const extractedChartData = chartData || realData?.chartData;
  const extractedBirthDetails = birthDetails || realData;
  
  // Check if we have real dasha data from API
  const hasRealDashaData = dashaData && (dashaData.currentMahadasha || dashaData.data);
  
  if (extractedChartData) {
    // Extract birth details from real data
    details = {
      name: extractedBirthDetails?.fullName || extractedBirthDetails?.name || 'Unknown',
      dateOfBirth: extractedBirthDetails?.birthDate || extractedBirthDetails?.dateOfBirth || 'Unknown',
      timeOfBirth: extractedBirthDetails?.birthTime || extractedBirthDetails?.timeOfBirth || 'Unknown', 
      placeOfBirth: extractedBirthDetails?.birthLocation || extractedBirthDetails?.placeOfBirth || 'Unknown',
      latitude: extractedBirthDetails?.locationData?.latitude?.toFixed(4) || extractedBirthDetails?.latitude || 'Unknown',
      longitude: extractedBirthDetails?.locationData?.longitude?.toFixed(4) || extractedBirthDetails?.longitude || 'Unknown',
      timezone: extractedBirthDetails?.locationData?.timezone || extractedBirthDetails?.timezone || 'Unknown'
    };
    
    // Extract chart summary from real backend data
    const chartSummary = extractedChartData.chartSummary || {};
    const vimshottariDasha = extractedChartData.vimshottariDasha || {};
    
    // Extract real dasha data - prioritize API data over embedded chart data
    let realCurrentDasha = {};
    
    if (hasRealDashaData) {
      // Use real dasha data from API
      const dashaApiData = dashaData.data || dashaData;
      realCurrentDasha = {
        mahadasha: dashaApiData?.currentMahadasha?.planet || 'Loading...',
        antardasha: dashaApiData?.currentAntardasha?.planet || 'Loading...',
        remainingYears: dashaApiData?.currentMahadasha?.remainingYears || 'Loading...'
      };
    } else if (vimshottariDasha.currentMahadasha) {
      // Fallback to embedded chart data
      realCurrentDasha = {
        mahadasha: vimshottariDasha.currentMahadasha?.planet || 'Unknown',
        antardasha: vimshottariDasha.currentAntardasha?.planet || 'Unknown',
        remainingYears: vimshottariDasha.currentMahadasha?.remainingYears || 'Unknown'
      };
    } else {
      // Only use mock data if no real data is available
      realCurrentDasha = mockChartSummary.currentDasha;
    }
    
    summary = {
      ascendant: chartSummary.ascendant || mockChartSummary.ascendant,
      moonSign: chartSummary.moonSign || mockChartSummary.moonSign,
      sunSign: chartSummary.sunSign || mockChartSummary.sunSign,
      currentDasha: realCurrentDasha,
      yogas: chartSummary.yogas || [],
      doshas: chartSummary.doshas || []
    };
  } else {
    // Fallback to provided props or mock data
    details = extractedBirthDetails || mockBirthDetails;
    
    // Even in fallback, use real dasha data if available
    if (hasRealDashaData) {
      const dashaApiData = dashaData.data || dashaData;
      summary = {
        ...mockChartSummary,
        currentDasha: {
          mahadasha: dashaApiData?.currentMahadasha?.planet || mockChartSummary.currentDasha.mahadasha,
          antardasha: dashaApiData?.currentAntardasha?.planet || mockChartSummary.currentDasha.antardasha,
          remainingYears: dashaApiData?.currentMahadasha?.remainingYears || mockChartSummary.currentDasha.remainingYears
        }
      };
    } else {
      summary = mockChartSummary; // Use mock summary only as last resort
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getYogaStrengthColor = (strength) => {
    switch (strength.toLowerCase()) {
      case 'strong': return 'text-success';
      case 'moderate': return 'text-warning';
      case 'weak': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  const getDoshaColor = (present, severity) => {
    if (!present) return 'text-success';
    switch (severity?.toLowerCase()) {
      case 'mild': return 'text-warning';
      case 'moderate': return 'text-error';
      case 'severe': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Birth Details Card */}
      <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary">
            Birth Details
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-caption text-text-muted">Full Name</label>
              <p className="font-medium text-text-primary">{details.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-caption text-text-muted">Date of Birth</label>
              <p className="font-medium text-text-primary">{formatDate(details.dateOfBirth)}</p>
            </div>
            
            <div>
              <label className="text-sm font-caption text-text-muted">Time of Birth</label>
              <p className="font-medium text-text-primary">{details.timeOfBirth}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-caption text-text-muted">Place of Birth</label>
              <p className="font-medium text-text-primary">{details.placeOfBirth}</p>
            </div>
            
            <div>
              <label className="text-sm font-caption text-text-muted">Coordinates</label>
              <p className="font-mono text-sm text-text-secondary">
                {details.latitude}°N, {details.longitude}°E
              </p>
            </div>
            
            <div>
              <label className="text-sm font-caption text-text-muted">Timezone</label>
              <p className="font-medium text-text-primary">{details.timezone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ascendant */}
        <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Sunrise" size={20} className="text-primary" />
            </div>
            <h4 className="font-heading font-semibold text-text-primary">Ascendant</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Sign:</span>
              <span className="font-medium text-text-primary">{summary?.ascendant?.sign || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Degree:</span>
              <span className="font-mono text-sm text-text-secondary">{summary?.ascendant?.degree || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Lord:</span>
              <span className="font-medium text-text-primary">{summary?.ascendant?.lord || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Nakshatra:</span>
              <span className="font-medium text-text-primary">{summary?.ascendant?.nakshatra || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Moon Sign */}
        <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Icon name="Moon" size={20} className="text-secondary" />
            </div>
            <h4 className="font-heading font-semibold text-text-primary">Moon Sign</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Sign:</span>
              <span className="font-medium text-text-primary">{summary?.moonSign?.sign || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Degree:</span>
              <span className="font-mono text-sm text-text-secondary">{summary?.moonSign?.degree || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Lord:</span>
              <span className="font-medium text-text-primary">{summary?.moonSign?.lord || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Nakshatra:</span>
              <span className="font-medium text-text-primary">{summary?.moonSign?.nakshatra || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Sun Sign */}
        <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Icon name="Sun" size={20} className="text-warning" />
            </div>
            <h4 className="font-heading font-semibold text-text-primary">Sun Sign</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Sign:</span>
              <span className="font-medium text-text-primary">{summary?.sunSign?.sign || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Degree:</span>
              <span className="font-mono text-sm text-text-secondary">{summary?.sunSign?.degree || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Lord:</span>
              <span className="font-medium text-text-primary">{summary?.sunSign?.lord || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Nakshatra:</span>
              <span className="font-medium text-text-primary">{summary?.sunSign?.nakshatra || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Current Dasha */}
        <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              {dashaLoading ? (
                <Icon name="Loader2" size={20} className="text-accent animate-spin" />
              ) : (
                <Icon name="Clock" size={20} className="text-accent" />
              )}
            </div>
            <h4 className="font-heading font-semibold text-text-primary">Current Dasha</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Mahadasha:</span>
              <span className="font-medium text-text-primary">
                {dashaLoading ? 'Loading...' : (summary?.currentDasha?.mahadasha || 'Unknown')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Antardasha:</span>
              <span className="font-medium text-text-primary">
                {dashaLoading ? 'Loading...' : (summary?.currentDasha?.antardasha || 'Unknown')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-caption">Remaining:</span>
              <span className="font-medium text-accent">
                {dashaLoading ? 'Loading...' : `${summary?.currentDasha?.remainingYears || 'Unknown'}y`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Yogas and Doshas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Yogas */}
        <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon name="Star" size={20} className="text-success" />
            </div>
            <h4 className="font-heading font-semibold text-text-primary">Beneficial Yogas</h4>
          </div>
          
          <div className="space-y-3">
            {(summary?.yogas || []).map((yoga, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                <div>
                  <div className="font-medium text-text-primary">{yoga?.name || 'Unknown Yoga'}</div>
                  <div className="text-sm text-text-muted font-caption">{yoga?.effect || 'No description available'}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getYogaStrengthColor(yoga?.strength || 'unknown')} bg-current/10`}>
                  {yoga?.strength || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Doshas */}
        <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Icon name="AlertTriangle" size={20} className="text-warning" />
            </div>
            <h4 className="font-heading font-semibold text-text-primary">Doshas Analysis</h4>
          </div>
          
          <div className="space-y-3">
            {(summary?.doshas || []).map((dosha, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                <div className="flex items-center space-x-2">
                  <Icon 
                    name={dosha?.present ? 'AlertCircle' : 'CheckCircle'} 
                    size={16} 
                    className={getDoshaColor(dosha?.present, dosha?.severity)}
                  />
                  <span className="font-medium text-text-primary">{dosha?.name || 'Unknown Dosha'}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDoshaColor(dosha?.present, dosha?.severity)} bg-current/10`}>
                  {dosha?.present ? (dosha?.severity || 'Present') : 'Absent'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartOverview;