import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
// Add your imports here
import HomeLandingPage from "pages/home-landing-page";
import ErrorHandlingPage from "pages/error-handling-page";
import BirthDetailsForm from "pages/birth-details-form";
import ChartResultsDashboard from "pages/chart-results-dashboard";
import PlanetaryPositions from "pages/planetary-positions";
import PlanetTransit from "pages/planet-transits";
import PlanetaryEvents from "pages/planetary-events";
import PricingPage from "pages/pricing";
// import ChartTestPage from "pages/chart-test";
import AuthCallback from "pages/auth/callback";
import NotFound from "pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your routes here */}
        <Route path="/" element={<HomeLandingPage />} />
        <Route path="/home-landing-page" element={<HomeLandingPage />} />
        <Route path="/error-handling-page" element={<ErrorHandlingPage />} />
        <Route path="/birth-details-form" element={<BirthDetailsForm />} />
        <Route path="/chart-results-dashboard" element={<ChartResultsDashboard />} />
        <Route path="/planetary-positions" element={<PlanetaryPositions />} />
        <Route path="/planet-transits" element={<PlanetTransit />} />
        <Route path="/planetary-events" element={<PlanetaryEvents />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* <Route path="/chart-test" element={<ChartTestPage />} /> */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;