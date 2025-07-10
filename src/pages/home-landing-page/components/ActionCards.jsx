import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ActionCards = () => {
  const navigate = useNavigate();

  const actionOptions = [
    {
      id: 'manual-entry',
      title: 'Enter Birth Details',
      description: 'Manually input your birth information for accurate chart generation',
      icon: 'Edit3',
      route: '/birth-details-form',
      color: 'primary',
      features: ['Date & Time Input', 'Location Search', 'Instant Processing']
    },
    {
      id: 'planetary-positions',
      title: 'Planetary Positions',
      description: 'View real-time planetary positions with interactive charts and navigation',
      icon: 'Globe',
      route: '/planetary-positions',
      color: 'accent',
      features: ['Live Positions', 'Historical Data', 'Interactive Charts']
    }
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <section className="py-16 lg:py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-text-primary mb-4">
            Choose Your Path
          </h2>
          <p className="text-lg text-text-secondary font-body max-w-2xl mx-auto">
            Start your astrological journey by selecting how you'd like to generate your birth chart
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {actionOptions.map((option) => (
            <div
              key={option.id}
              className="group relative bg-background rounded-xl border border-border hover:border-primary/30 shadow-soft hover:shadow-medium transition-celestial cursor-pointer overflow-hidden"
              onClick={() => handleCardClick(option.route)}
            >
              {/* Card Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${
                option.color === 'primary' ?'from-primary/5 via-transparent to-primary/10' :'from-accent/5 via-transparent to-accent/10'
              } opacity-0 group-hover:opacity-100 transition-celestial`}></div>
              
              <div className="relative p-8">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl ${
                  option.color === 'primary' ? 'bg-primary/10' : 'bg-accent/10'
                } flex items-center justify-center mb-6 group-hover:scale-110 transition-celestial`}>
                  <Icon 
                    name={option.icon} 
                    size={32} 
                    className={option.color === 'primary' ? 'text-primary' : 'text-accent'}
                  />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-heading font-semibold text-text-primary mb-3 group-hover:text-primary transition-celestial">
                  {option.title}
                </h3>
                
                <p className="text-text-secondary font-body mb-6 leading-relaxed">
                  {option.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2 mb-8">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3 text-sm text-text-muted">
                      <Icon name="Check" size={16} className="text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button
                  variant={option.color === 'primary' ? 'primary' : 'secondary'}
                  iconName="ArrowRight"
                  iconPosition="right"
                  fullWidth
                  size="lg"
                  className="group-hover:shadow-medium transition-celestial"
                >
                  Get Started
                </Button>
              </div>

              {/* Decorative Corner */}
              <div className={`absolute top-0 right-0 w-20 h-20 ${
                option.color === 'primary' ? 'bg-primary/5' : 'bg-accent/5'
              } rounded-bl-full opacity-50`}></div>
            </div>
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12">
          <p className="text-text-muted font-caption mb-4">
            Not sure which option to choose?
          </p>
          <Button
            variant="ghost"
            iconName="HelpCircle"
            iconPosition="left"
            onClick={() => navigate('/error-handling-page')}
          >
            Get Help & Support
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActionCards;