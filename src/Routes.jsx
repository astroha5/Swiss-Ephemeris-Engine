import React, { lazy, Suspense } from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Lazy-loaded components
const HomeLandingPage = lazy(() => import('./pages/home-landing-page'));
const BirthDetailsForm = lazy(() => import('./pages/birth-details-form'));
const ChartResultsDashboard = lazy(() => import('./pages/chart-results-dashboard'));
const PlanetaryEvents = lazy(() => import('./pages/planetary-events'));
const PlanetTransits = lazy(() => import('./pages/planet-transits'));
const ErrorHandlingPage = lazy(() => import('./pages/error-handling-page'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PricingPage = lazy(() => import('./pages/pricing'));
const AuthCallback = lazy(() => import('./pages/auth/callback'));

// Add our new pages
const PrivacyPolicy = lazy(() => import('./pages/privacy-policy'));
const TermsOfService = lazy(() => import('./pages/terms-of-service'));
const RefundPolicy = lazy(() => import('./pages/refund-policy'));
const ContactPage = lazy(() => import('./pages/contact'));

const Routes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <RouterRoutes>
        <Route path="/" element={<Navigate to="/home-landing-page" replace />} />
        <Route path="/home-landing-page" element={<HomeLandingPage />} />
        <Route path="/birth-details-form" element={<BirthDetailsForm />} />
        <Route path="/chart-results-dashboard" element={<ChartResultsDashboard />} />
        {/* Redirect old Planetary Positions path to new tab under Event Correlations */}
        <Route path="/planetary-positions" element={<Navigate to="/planetary-events?tab=positions" replace />} />
        <Route path="/planetary-events" element={<PlanetaryEvents />} />
        <Route path="/planet-transits" element={<PlanetTransits />} />
        <Route path="/error-handling-page" element={<ErrorHandlingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* New routes for legal pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/contact" element={<ContactPage />} />
        
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
    </Suspense>
  );
};

export default Routes;