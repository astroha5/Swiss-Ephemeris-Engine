import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ActionButtonCluster from '../../components/ui/ActionButtonCluster';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import Icon from '../../components/AppIcon';
import api, { generateDasha } from '../../services/api';

// Import all components
import ChartOverview from './components/ChartOverview';
import ChartVisualization from './components/ChartVisualization';
import PlanetaryPositionsTable from './components/PlanetaryPositionsTable';
import VimshottariDashaTable from './components/VimshottariDashaTable';
import AIInterpretationSection from './components/AIInterpretationSection';
import ResultsSidebar from './components/ResultsSidebar';

const ChartResultsDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [dashaData, setDashaData] = useState(null);
  const [dashaLoading, setDashaLoading] = useState(false);
  const [dashaError, setDashaError] = useState(null);

  // Check if user came from birth details form or upload
  const sourceRoute = location.state?.from || '/home-landing-page';
  const inputMethod = sourceRoute.includes('birth-details') ? 'Manual Entry' : 'Upload';
  
  // Extract chart data from location state OR localStorage
  let chartData = location.state?.chartData;
  let birthDetails = location.state?.birthDetails;
  
  // If no chart data in navigation state, try localStorage
  if (!chartData) {
    try {
      const storedData = localStorage.getItem('birthChartData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('📦 Retrieved chart data from localStorage:', parsedData);
        chartData = parsedData.chartData;
        birthDetails = {
          name: parsedData.fullName,
          dateOfBirth: parsedData.birthDate,
          timeOfBirth: parsedData.birthTime,
          placeOfBirth: parsedData.birthLocation,
          latitude: parsedData.locationData?.latitude,
          longitude: parsedData.locationData?.longitude,
          timezone: parsedData.locationData?.timezone
        };
      }
    } catch (error) {
      console.error('❌ Error reading chart data from localStorage:', error);
    }
  }
  
  // Fetch Dasha Data
  useEffect(() => {
    if (birthDetails) {
      const fetchDashaData = async () => {
        setDashaLoading(true);
        setDashaError(null);
        try {
          console.log('🔄 Fetching Dasha data for:', birthDetails);
          
          const data = await generateDasha(birthDetails);
          
          console.log('✅ Received Dasha data:', data);
          setDashaData(data);
        } catch (error) {
          console.error('❌ Failed to fetch dasha data:', error);
          setDashaError(error.message);
          setDashaData(null);
        } finally {
          setDashaLoading(false);
        }
      };
      fetchDashaData();
    }
  }, [birthDetails]);

  // Transform backend planetary data to component format
  const transformPlanetaryData = (backendData) => {
    console.log('🔄 Transforming chart data:', backendData);
    
    // Check if backend already has planetaryData array (new format)
    if (backendData?.planetaryData && Array.isArray(backendData.planetaryData)) {
      console.log('✅ Using direct planetaryData from backend:', backendData.planetaryData);
      return backendData.planetaryData;
    }
    
    // Fallback: Try to transform from charts.lagna.houses format
    if (backendData?.charts?.lagna?.houses) {
      const houses = backendData.charts.lagna.houses;
      const planetaryData = [];
      
      // Planet symbols mapping
      const planetSymbols = {
        'Sun': '☉', 'Moon': '☽', 'Mars': '♂', 'Mercury': '☿',
        'Jupiter': '♃', 'Venus': '♀', 'Saturn': '♄', 'Rahu': '☊', 'Ketu': '☋'
      };
      
      // Extract planets from houses
      houses.forEach(house => {
        if (house.planets && house.planets.length > 0) {
          house.planets.forEach((planetName, index) => {
            planetaryData.push({
              planet: planetName,
              symbol: planetSymbols[planetName] || '○',
              sign: house.sign || 'Unknown',
              house: house.number,
              degree: house.degrees?.[index] || '0°00\'00"',
              nakshatra: 'Unknown', // Not available in this format
              pada: 1,
              retrograde: false,
              strength: 'Moderate',
              nature: 'Neutral'
            });
          });
        }
      });
      
      console.log('✅ Transformed from houses data:', planetaryData);
      return planetaryData;
    }
    
    console.warn('❌ No suitable planetary data found in chart data');
    return null;
  };
  
  const planetaryData = chartData ? transformPlanetaryData(chartData) : null;
  
  // Debug: Log what data we're working with
  useEffect(() => {
    console.log('📊 Dashboard received location.state:', location.state);
    console.log('📈 Extracted chartData:', chartData);
    console.log('🪐 Transformed planetaryData:', planetaryData);
  }, [location.state, chartData, planetaryData]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownloadPDF = async () => {
    setIsLoading(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock PDF download
      const link = document.createElement('a');
      link.href = '#';
      link.download = 'vedic-chart-analysis.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChart = () => {
    navigate('/home-landing-page');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 64; // Header height
      const progressHeight = 80; // Progress indicator height
      const offset = headerHeight + progressHeight + 20;
      
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    if (!isMobile) {
      scrollToSection(sectionId);
    }
  };

  return (
    <ErrorBoundaryNavigation>
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-text-muted mb-2">
              <button
                onClick={() => navigate(sourceRoute)}
                className="flex items-center space-x-1 hover:text-primary transition-celestial"
              >
                <Icon name="ArrowLeft" size={14} />
                <span>Back to {inputMethod}</span>
              </button>
              <Icon name="ChevronRight" size={14} />
              <span>Chart Results</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
                  Your Vedic Chart Analysis
                </h1>
                <p className="text-text-secondary">
                  Comprehensive astrological insights based on your birth details
                </p>
              </div>
              
              {/* Generation Status */}
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-success/10 border border-success/20 rounded-lg">
                <Icon name="CheckCircle" size={16} className="text-success" />
                <span className="text-sm font-medium text-success">Chart Generated Successfully</span>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="flex gap-8">
            {/* Sidebar - Desktop Only */}
            {!isMobile && (
              <div className="w-64 flex-shrink-0">
                <ResultsSidebar
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                  isMobile={false}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Navigation */}
              {isMobile && (
                <ResultsSidebar
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                  isMobile={true}
                />
              )}

              {/* Content Sections */}
              <div className="space-y-8">
                {/* Overview Section */}
                <section id="overview" className="scroll-mt-32">
                  <ChartOverview 
                    birthDetails={birthDetails}
                    chartData={chartData}
                    isRealChart={!!chartData}
                    realData={location.state}
                  />
                </section>

                {/* Lagna Chart Section */}
                <section id="lagna-chart" className="scroll-mt-32">
                  <ChartVisualization 
                    chartType="lagna" 
                    chartData={chartData?.houses ? chartData : null}
                  />
                </section>

                {/* Navamsa Chart Section */}
                <section id="navamsa-chart" className="scroll-mt-32">
                  <ChartVisualization 
                    chartType="navamsa" 
                    chartData={chartData?.navamsa ? chartData.navamsa : null}
                  />
                </section>

                {/* Planetary Positions Section */}
                <section id="planetary-positions" className="scroll-mt-32">
                  <PlanetaryPositionsTable planetaryData={planetaryData} />
                </section>

                {/* Dasha Periods Section */}
                <section id="dasha-periods" className="scroll-mt-32">
                  <VimshottariDashaTable 
                    dashaData={dashaData} 
                    isLoading={dashaLoading}
                    error={dashaError}
                  />
                </section>

                {/* AI Interpretation Section */}
                <section id="ai-interpretation" className="scroll-mt-32">
                  <AIInterpretationSection />
                </section>

                {/* Remedies Section */}
                <section id="remedies" className="scroll-mt-32">
                  <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <Icon name="Shield" size={20} className="text-warning" />
                      </div>
                      <h3 className="text-xl font-heading font-semibold text-text-primary">
                        Recommended Remedies
                      </h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-heading font-semibold text-text-primary">Gemstone Recommendations</h4>
                        <div className="space-y-2">
                          <div className="p-3 bg-surface-secondary rounded-lg">
                            <div className="font-medium text-text-primary">Red Coral (Moonga)</div>
                            <div className="text-sm text-text-muted">For Mars - Wear on Tuesday</div>
                          </div>
                          <div className="p-3 bg-surface-secondary rounded-lg">
                            <div className="font-medium text-text-primary">Yellow Sapphire (Pukhraj)</div>
                            <div className="text-sm text-text-muted">For Jupiter - Wear on Thursday</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-heading font-semibold text-text-primary">Mantras & Prayers</h4>
                        <div className="space-y-2">
                          <div className="p-3 bg-surface-secondary rounded-lg">
                            <div className="font-medium text-text-primary">Hanuman Chalisa</div>
                            <div className="text-sm text-text-muted">Daily recitation for Mars</div>
                          </div>
                          <div className="p-3 bg-surface-secondary rounded-lg">
                            <div className="font-medium text-text-primary">Guru Mantra</div>
                            <div className="text-sm text-text-muted">108 times on Thursday</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Export Options Section */}
                <section id="export-options" className="scroll-mt-32">
                  <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon name="Download" size={20} className="text-primary" />
                      </div>
                      <h3 className="text-xl font-heading font-semibold text-text-primary">
                        Export & Share Options
                      </h3>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-2 p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-celestial disabled:opacity-50"
                      >
                        <Icon name={isLoading ? 'Loader2' : 'FileText'} size={20} className={isLoading ? 'animate-spin' : ''} />
                        <span>Download PDF</span>
                      </button>
                      
                      <button className="flex items-center justify-center space-x-2 p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-celestial">
                        <Icon name="Share" size={20} />
                        <span>Share Results</span>
                      </button>
                      
                      <button className="flex items-center justify-center space-x-2 p-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-celestial">
                        <Icon name="Bookmark" size={20} />
                        <span>Save Chart</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Cluster */}
        <ActionButtonCluster
          customActions={{
            primary: {
              label: 'Download PDF',
              icon: 'Download',
              onClick: handleDownloadPDF,
              variant: 'primary',
              loading: isLoading
            },
            secondary: {
              label: 'New Chart',
              icon: 'Plus',
              onClick: handleNewChart,
              variant: 'secondary'
            }
          }}
          isLoading={isLoading}
          className="mt-8"
        />
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default ChartResultsDashboard;