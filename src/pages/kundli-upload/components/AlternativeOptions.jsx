import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AlternativeOptions = () => {
  const navigate = useNavigate();

  const alternatives = [
    {
      icon: 'Edit3',
      title: 'Manual Entry',
      description: 'Enter your birth details manually for accurate chart generation',
      benefits: ['More accurate calculations', 'Detailed planetary positions', 'Custom location support'],
      action: 'Enter Details',
      onClick: () => navigate('/birth-details-form'),
      variant: 'primary'
    },
    {
      icon: 'HelpCircle',
      title: 'Need Help?',
      description: 'Get assistance with uploading or understanding your kundli',
      benefits: ['Upload troubleshooting', 'Chart format guidance', 'Technical support'],
      action: 'Get Support',
      onClick: () => navigate('/error-handling-page'),
      variant: 'secondary'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
          Alternative Options
        </h3>
        <p className="text-sm text-text-secondary">
          Having trouble with upload? Try these alternatives
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alternatives.map((option, index) => (
          <div key={index} className="bg-surface border border-border rounded-lg p-6 hover-scale transition-celestial">
            {/* Option Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name={option.icon} size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-heading font-semibold text-text-primary">
                  {option.title}
                </h4>
                <p className="text-sm text-text-secondary">
                  {option.description}
                </p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="mb-6">
              <ul className="space-y-2">
                {option.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-center space-x-2">
                    <Icon name="Check" size={14} className="text-success flex-shrink-0" />
                    <span className="text-xs text-text-secondary">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <Button
              variant={option.variant}
              onClick={option.onClick}
              iconName="ArrowRight"
              iconPosition="right"
              fullWidth
              className="shadow-soft"
            >
              {option.action}
            </Button>
          </div>
        ))}
      </div>

      {/* Quick Comparison */}
      <div className="bg-surface-secondary border border-border-light rounded-lg p-4 mt-6">
        <div className="text-center mb-4">
          <h4 className="text-sm font-medium text-text-primary">
            Quick Comparison
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="text-center">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Icon name="Upload" size={16} className="text-primary" />
            </div>
            <div className="font-medium text-text-primary mb-1">Upload Method</div>
            <ul className="text-text-muted space-y-1">
              <li>• Quick & convenient</li>
              <li>• Uses existing chart</li>
              <li>• AI-powered analysis</li>
            </ul>
          </div>

          <div className="text-center">
            <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Icon name="Edit3" size={16} className="text-secondary" />
            </div>
            <div className="font-medium text-text-primary mb-1">Manual Entry</div>
            <ul className="text-text-muted space-y-1">
              <li>• Most accurate</li>
              <li>• Fresh calculations</li>
              <li>• Detailed analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativeOptions;