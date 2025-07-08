import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
// Add your imports here
import HomeLandingPage from "pages/home-landing-page";
import ErrorHandlingPage from "pages/error-handling-page";
import KundliUpload from "pages/kundli-upload";
import BirthDetailsForm from "pages/birth-details-form";
import ChartResultsDashboard from "pages/chart-results-dashboard";
import ChartTestPage from "pages/chart-test";
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
        <Route path="/kundli-upload" element={<KundliUpload />} />
        <Route path="/birth-details-form" element={<BirthDetailsForm />} />
        <Route path="/chart-results-dashboard" element={<ChartResultsDashboard />} />
        <Route path="/chart-test" element={<ChartTestPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;