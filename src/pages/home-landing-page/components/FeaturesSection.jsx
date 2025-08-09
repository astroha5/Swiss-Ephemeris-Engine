import React from 'react';
import Icon from '../../../components/AppIcon';

const FeaturesSection = () => {
  const features = [
    {
      id: 'ai-interpretation',
      icon: 'Brain',
      title: 'AI-Powered Interpretations',
      description: 'Advanced artificial intelligence analyzes your birth chart and provides detailed, personalized interpretations based on Vedic principles.',
      benefits: ['Natural language explanations', 'Personalized insights', 'Complex pattern recognition']
    },
    {
      id: 'north-indian-charts',
      icon: 'Grid3X3',
      title: 'North Indian Chart Style',
      description: 'Authentic North Indian style birth charts (Lagna D1 and Navamsa D9) with precise planetary positions and degrees display.',
      benefits: ['Traditional chart format', 'Accurate calculations', 'Degree precision']
    },
    {
      id: 'comprehensive-reports',
      icon: 'FileText',
      title: 'Downloadable Reports',
      description: 'Complete kundli reports with detailed explanations, planetary positions, and dasha periods available for download as PDF.',
      benefits: ['Professional formatting', 'Comprehensive analysis', 'Offline access']
    },
    {
      id: 'vimshottari-dasha',
      icon: 'Calendar',
      title: 'Vimshottari Dasha',
      description: 'Detailed Vimshottari dasha calculations showing planetary periods and their influences throughout your lifetime.',
      benefits: ['Accurate time periods', 'Life phase insights', 'Future predictions']
    },
    {
      id: 'mobile-responsive',
      icon: 'Smartphone',
      title: 'Mobile Optimized',
      description: 'Fully responsive design ensures seamless experience across all devices - desktop, tablet, and mobile.',
      benefits: ['Touch-friendly interface', 'Optimized layouts', 'Fast loading']
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-surface to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-text-primary mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-text-secondary font-body max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive tools and capabilities that make Astrova the most advanced Vedic astrology platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group bg-background rounded-xl border border-border hover:border-primary/20 shadow-soft hover:shadow-medium transition-celestial p-6 hover-scale"
            >
              {/* Feature Icon */}
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-celestial">
                <Icon 
                  name={feature.icon} 
                  size={28} 
                  className="text-primary group-hover:scale-110 transition-celestial"
                />
              </div>

              {/* Feature Content */}
              <h3 className="text-xl font-heading font-semibold text-text-primary mb-3 group-hover:text-primary transition-celestial">
                {feature.title}
              </h3>
              
              <p className="text-text-secondary font-body mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Benefits List */}
              <ul className="space-y-2">
                {feature.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-text-muted">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Icon name="Sparkles" size={32} className="text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-text-primary mb-3">
              Ready to Explore Your Cosmic Blueprint?
            </h3>
            <p className="text-text-secondary font-body mb-6 max-w-2xl mx-auto">
              Join thousands of users who have discovered deeper insights about themselves through the ancient wisdom of Vedic astrology combined with modern AI technology.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-2xl font-heading font-bold text-primary mb-1">10,000+</div>
                <div className="text-sm text-text-muted font-caption">Charts Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-heading font-bold text-primary mb-1">99.9%</div>
                <div className="text-sm text-text-muted font-caption">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-heading font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-text-muted font-caption">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;