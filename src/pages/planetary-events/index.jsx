import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EventAnalysis from './components/EventAnalysis';
import RiskAssessment from './components/RiskAssessment';
import { useAuth } from '../../contexts/AuthContext';

const PlanetaryEventsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeView, setActiveView] = useState('patterns');

  const views = [
    { id: 'patterns', label: 'Find Patterns', icon: '🔍', description: 'See what patterns emerge from the data' },
    { id: 'predict', label: 'What About Today?', icon: '🎯', description: 'Check current planetary conditions' },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'patterns':
        return <EventAnalysis />;
      case 'predict':
        return <RiskAssessment />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
              onClick={() => setActiveView(view.id)}
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
    </div>
  );
};

export default PlanetaryEventsPage;
