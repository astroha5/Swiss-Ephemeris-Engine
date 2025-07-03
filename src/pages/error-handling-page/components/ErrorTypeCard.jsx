import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ErrorTypeCard = ({ 
  errorType, 
  title, 
  description, 
  icon, 
  primaryAction, 
  secondaryAction,
  tips = [],
  isActive = false,
  onSelect
}) => {
  return (
    <div 
      className={`
        bg-surface rounded-lg border transition-celestial cursor-pointer hover-scale
        ${isActive 
          ? 'border-primary shadow-medium bg-primary/5' 
          : 'border-border hover:border-primary/50'
        }
      `}
      onClick={() => onSelect && onSelect(errorType)}
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`
            flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
            ${isActive ? 'bg-primary text-primary-foreground' : 'bg-error/10 text-error'}
          `}>
            <Icon name={icon} size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
              {title}
            </h3>
            <p className="text-text-secondary font-body mb-4 leading-relaxed">
              {description}
            </p>
            
            {tips.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">
                  Helpful Tips:
                </h4>
                <ul className="space-y-1">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-text-secondary">
                      <Icon name="CheckCircle2" size={14} className="text-success mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant={primaryAction.variant || 'primary'}
                onClick={primaryAction.onClick}
                iconName={primaryAction.icon}
                iconPosition="left"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {primaryAction.label}
              </Button>
              
              {secondaryAction && (
                <Button
                  variant={secondaryAction.variant || 'ghost'}
                  onClick={secondaryAction.onClick}
                  iconName={secondaryAction.icon}
                  iconPosition="left"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorTypeCard;