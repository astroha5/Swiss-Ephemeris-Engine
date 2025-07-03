import React from 'react';
import Icon from '../../../components/AppIcon';

const HeroSection = () => {
  const ZodiacLogo = () => (
    <div className="relative w-24 h-24 mx-auto mb-6">
      {/* AI Neural Orbit Background */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse">
        <div className="absolute inset-2 rounded-full border border-primary/30"></div>
        <div className="absolute inset-4 rounded-full border border-primary/40"></div>
      </div>
      
      {/* Central Sagittarius Glyph */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          {/* Sagittarius Arrow */}
          <path
            d="M8 32 L32 8 M24 8 L32 8 L32 16"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cross element */}
          <path
            d="M12 20 L20 20 M16 16 L16 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      
      {/* Orbital Dots */}
      <div className="absolute top-2 right-6 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      <div className="absolute bottom-6 left-2 w-1.5 h-1.5 bg-primary/70 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute top-8 left-8 w-1 h-1 bg-primary/50 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>
  );

  return (
    <section className="relative bg-gradient-to-br from-background via-primary/5 to-background py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Zodiac Logo */}
          <ZodiacLogo />
          
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-text-primary mb-6">
            Welcome to{' '}
            <span className="text-primary">Astrova</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-text-secondary font-body mb-4 max-w-3xl mx-auto leading-relaxed">
            AI-Powered Vedic Astrology Platform
          </p>
          
          {/* Description */}
          <p className="text-lg text-text-muted font-caption mb-8 max-w-2xl mx-auto leading-relaxed">
            Generate comprehensive birth charts, receive personalized interpretations, and explore the ancient wisdom of Vedic astrology with modern AI technology.
          </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
            <div className="flex items-center space-x-2">
              <Icon name="Shield" size={16} className="text-success" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Zap" size={16} className="text-primary" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Star" size={16} className="text-accent" />
              <span>Vedic Tradition</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/5 rounded-full blur-xl"></div>
    </section>
  );
};

export default HeroSection;