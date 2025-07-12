import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import MonthYearSelector from './components/MonthYearSelector';
import MonthlyChart from './components/MonthlyChart';
import MonthlyPlanetaryTable from './components/MonthlyPlanetaryTable';
import MonthlyAIInterpretation from './components/MonthlyAIInterpretation';
import LoadingShimmer from './components/LoadingShimmer';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { getMonthlyPredictions } from '../../services/api';

const MonthlyPredictions = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fetch data when month or year changes
  useEffect(() => {
    fetchMonthlyPredictions();
  }, [selectedMonth, selectedYear]);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchMonthlyPredictions();
  }, []);

  const fetchMonthlyPredictions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const requestData = {
        month: selectedMonth + 1, // Convert to 1-based month
        year: selectedYear
      };

      const response = await getMonthlyPredictions(requestData);
      
      if (response && response.success) {
        setMonthlyData(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch monthly predictions');
      }
    } catch (error) {
      console.error('Error fetching monthly predictions:', error);
      setError(error.message || 'Failed to fetch monthly predictions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Monthly Predictions - Astrova</title>
        <meta 
          name="description" 
          content="Get comprehensive monthly astrological predictions based on current planetary positions, transits, and cosmic influences. Discover what the stars have in store for you this month." 
        />
        <meta name="keywords" content="monthly predictions, astrology forecast, planetary transits, monthly horoscope, vedic predictions" />
        <link rel="canonical" href="/monthly-predictions" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        
        <main className="pt-4 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Calendar" size={24} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
                    Monthly Predictions
                  </h1>
                  <p className="text-text-secondary font-body">
                    {isCurrentMonth ? 'Current month\'s' : 'Monthly'} astrological insights and cosmic guidance
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
                <span className="text-primary">Monthly Predictions</span>
              </div>
            </div>

            {/* Month and Year Display */}
            <div className="text-center mb-8">
              <div className="bg-surface border border-border rounded-xl p-6 max-w-2xl mx-auto">
                <h2 className="text-4xl font-heading font-bold text-primary mb-2">
                  {monthNames[selectedMonth]} {selectedYear}
                </h2>
                <p className="text-text-secondary">
                  Cosmic influences and planetary guidance for this month
                </p>
                
                {/* Month/Year Selector */}
                <div className="mt-6">
                  <MonthYearSelector
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthChange={handleMonthChange}
                    onYearChange={handleYearChange}
                  />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
              {isLoading ? (
                <LoadingShimmer />
              ) : error ? (
                <div className="bg-error/5 border border-error/20 rounded-lg p-6 text-center">
                  <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-error mb-2">Error Loading Data</h3>
                  <p className="text-text-secondary mb-4">{error}</p>
                  <Button
                    variant="primary"
                    onClick={fetchMonthlyPredictions}
                    iconName="RefreshCw"
                    iconPosition="left"
                  >
                    Try Again
                  </Button>
                </div>
              ) : monthlyData ? (
                <>
                  {/* Dynamic Visual Chart */}
                  <MonthlyChart 
                    chartData={monthlyData}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />

                  {/* Detailed Planetary Table */}
                  <MonthlyPlanetaryTable 
                    planetaryData={monthlyData?.planetaryData || []}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />

                  {/* AI Interpretation */}
                  <MonthlyAIInterpretation 
                    monthlyData={monthlyData}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </>
              ) : (
                <div className="bg-surface border border-border rounded-lg p-12 text-center">
                  <Icon name="Calendar" size={48} className="text-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Select Month and Year
                  </h3>
                  <p className="text-text-secondary">
                    Choose a month and year to view detailed astrological predictions and cosmic insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default MonthlyPredictions;
