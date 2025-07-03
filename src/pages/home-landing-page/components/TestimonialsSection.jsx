import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      location: 'Mumbai, India',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      text: `The AI interpretations are incredibly accurate and detailed. I've been studying astrology for years, and Astrova's insights match what I would expect from a professional astrologer. The North Indian chart format is perfect!`,
      highlight: 'Professional Quality'
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      location: 'Delhi, India',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      text: `I uploaded my old kundli image and was amazed at how accurately the AI could read and interpret it. The PDF report is comprehensive and beautifully formatted. Highly recommended for anyone interested in Vedic astrology.`,
      highlight: 'Image Recognition Excellence'
    },
    {
      id: 3,
      name: 'Anita Patel',
      location: 'Ahmedabad, India',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      text: `The Vimshottari dasha calculations are spot-on, and the mobile interface is so smooth. I can check my planetary periods anytime, anywhere. The golden theme is beautiful and calming.`,
      highlight: 'Mobile Experience'
    }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="Star"
        size={16}
        className={index < rating ? 'text-primary fill-current' : 'text-border'}
      />
    ));
  };

  return (
    <section className="py-16 lg:py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-text-primary mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-text-secondary font-body max-w-2xl mx-auto">
            Discover how Astrova has helped thousands explore their astrological journey
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-background rounded-xl border border-border shadow-soft hover:shadow-medium transition-celestial p-6 hover-scale"
            >
              {/* Header */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <Image
                    src={testimonial.avatar}
                    alt={`${testimonial.name} profile`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-text-primary">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-text-muted font-caption">
                    {testimonial.location}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {renderStars(testimonial.rating)}
                <span className="text-sm text-text-muted ml-2 font-caption">
                  {testimonial.rating}.0
                </span>
              </div>

              {/* Testimonial Text */}
              <blockquote className="text-text-secondary font-body leading-relaxed mb-4">
                "{testimonial.text}"
              </blockquote>

              {/* Highlight Badge */}
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-caption">
                <Icon name="Award" size={14} />
                <span>{testimonial.highlight}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl border border-border p-8">
            <h3 className="text-xl font-heading font-semibold text-text-primary mb-6">
              Trusted by Astrology Enthusiasts Worldwide
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Icon name="Users" size={32} className="text-primary mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-text-primary">50K+</div>
                <div className="text-sm text-text-muted font-caption">Active Users</div>
              </div>
              
              <div className="text-center">
                <Icon name="Star" size={32} className="text-primary mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-text-primary">4.9</div>
                <div className="text-sm text-text-muted font-caption">Average Rating</div>
              </div>
              
              <div className="text-center">
                <Icon name="Globe" size={32} className="text-primary mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-text-primary">25+</div>
                <div className="text-sm text-text-muted font-caption">Countries</div>
              </div>
              
              <div className="text-center">
                <Icon name="Shield" size={32} className="text-primary mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-text-primary">100%</div>
                <div className="text-sm text-text-muted font-caption">Secure</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;