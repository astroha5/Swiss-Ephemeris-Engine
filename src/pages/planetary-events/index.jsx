import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import EventAnalysis from './components/EventAnalysis';
import PlanetaryPositionsTab from './components/PlanetaryPositionsTab';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import { useLocation, useNavigate } from 'react-router-dom';

const PlanetaryEventsPage = () => {
  const [activeView, setActiveView] = useState('patterns');
  const location = useLocation();
  const navigate = useNavigate();

  const views = [
    { id: 'patterns', label: 'Find Patterns', icon: '🔍', description: 'See what patterns emerge from the data' },
    { id: 'positions', label: 'Planetary Positions', icon: '🪐', description: 'Explore real-time and historical planetary positions' },
  ];

  // Sync from URL `tab` param → state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && views.some(v => v.id === tab) && tab !== activeView) {
      setActiveView(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Set state → push URL `tab` param
  const setView = (viewId) => {
    setActiveView(viewId);
    const params = new URLSearchParams(location.search);
    params.set('tab', viewId);
    navigate({ pathname: '/planetary-events', search: `?${params.toString()}` });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'patterns':
        return <EventAnalysis />;
      case 'positions':
        return <PlanetaryPositionsTab />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundaryNavigation>
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        <main className="pt-20 md:pt-24 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-4">
            🌌 Planetary Event Correlation Engine
          </h1>
          <p className="text-lg text-text-secondary font-body max-w-3xl mx-auto">
            Discover patterns between major world events and planetary transits.
            Analyze historical data to predict future trends using astrological correlations.
          </p>
        </motion.div>

        {/* Navigation Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto"
        >
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setView(view.id)}
              className={`p-6 rounded-xl text-left transition-all duration-200 ${
                activeView === view.id 
                  ? 'bg-primary text-primary-foreground shadow-lg transform scale-105' 
                  : 'bg-surface hover:bg-surface-secondary shadow-md hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{view.icon}</span>
                <h3 className="font-semibold text-lg">{view.label}</h3>
              </div>
              <p className={`text-sm ${
                activeView === view.id ? 'text-primary-foreground/80' : 'text-text-muted'
              }`}>
                {view.description}
              </p>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {renderActiveView()}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-text-muted text-sm"
        >
          <p>
            Built with Swiss Ephemeris for precise planetary calculations •
            Data stored in Supabase •
            Pattern recognition powered by statistical analysis
          </p>
        </motion.div>
          </div>
        </main>
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default PlanetaryEventsPage;
