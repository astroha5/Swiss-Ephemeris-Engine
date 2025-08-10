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
import AccuracyTooltip from '../../components/ui/AccuracyTooltip';

const HomeLandingPage = () => {
  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Astrova - AI-Powered Vedic Astrology Platform</title>
        <meta 
          name="description" 
          content="Generate comprehensive Vedic birth charts with AI-powered interpretations. Enter birth details manually for personalized astrological analysis." 
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
          
          {/* Technical Accuracy Section */}
          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Unmatched Scientific Precision
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our calculations use the Swiss Ephemeris with precise historical timezone data and Lahiri Ayanamsa, 
                ensuring your birth chart reflects the exact planetary positions at your time of birth.
              </p>
              <AccuracyTooltip trigger="Learn why our calculations are more accurate" />
            </div>
          </section>
          
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