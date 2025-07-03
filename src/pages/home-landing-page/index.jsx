import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ActionButtonCluster from '../../components/ui/ActionButtonCluster';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import HeroSection from './components/HeroSection';
import ActionCards from './components/ActionCards';
import FeaturesSection from './components/FeaturesSection';
import TestimonialsSection from './components/TestimonialsSection';
import FooterSection from './components/FooterSection';

const HomeLandingPage = () => {
  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Astrova - AI-Powered Vedic Astrology Platform</title>
        <meta 
          name="description" 
          content="Generate comprehensive Vedic birth charts with AI-powered interpretations. Upload kundli images or enter birth details manually for personalized astrological analysis." 
        />
        <meta name="keywords" content="vedic astrology, birth chart, kundli, AI astrology, horoscope, dasha, navamsa" />
        <meta property="og:title" content="Astrova - AI-Powered Vedic Astrology Platform" />
        <meta property="og:description" content="Discover your cosmic blueprint through ancient Vedic wisdom and modern AI technology" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/home-landing-page" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header />
        
        {/* Progress Indicator */}
        <ProgressIndicator />
        
        {/* Main Content */}
        <main className="pt-16">
          {/* Hero Section */}
          <HeroSection />
          
          {/* Action Cards Section */}
          <ActionCards />
          
          {/* Features Section */}
          <FeaturesSection />
          
          {/* Testimonials Section */}
          <TestimonialsSection />
          
          {/* Action Button Cluster */}
          <ActionButtonCluster />
        </main>
        
        {/* Footer */}
        <FooterSection />
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default HomeLandingPage;