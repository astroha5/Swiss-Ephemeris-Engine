import React from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const ProgressIndicator = () => {
  const location = useLocation();

  const steps = [
    {
      id: 'home',
      label: 'Home',
      path: '/home-landing-page',
      icon: 'Home',
      description: 'Welcome'
    },
    {
      id: 'input',
      label: 'Input',
      paths: ['/birth-details-form'],
      icon: 'Edit3',
      description: 'Enter Details'
    },
    {
      id: 'processing',
      label: 'Processing',
      path: null,
      icon: 'Loader2',
      description: 'Generating Chart'
    },
    {
      id: 'results',
      label: 'Results',
      path: '/chart-results-dashboard',
      icon: 'BarChart3',
      description: 'Your Analysis'
    }
  ];

  const getCurrentStepIndex = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/home-landing-page') return 0;
    if (currentPath === '/birth-details-form') return 1;
    if (currentPath === '/chart-results-dashboard') return 3;
    
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();
  
  // Don't show progress indicator on error page or if not in workflow
  if (location.pathname === '/error-handling-page' || currentStepIndex === -1) {
    return null;
  }

  const isStepCompleted = (stepIndex) => {
    return stepIndex < currentStepIndex;
  };

  const isStepActive = (stepIndex) => {
    return stepIndex === currentStepIndex;
  };

  return (
    <div className="sticky top-16 z-900 bg-background/95 backdrop-blur-sm border-b border-border-light">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Desktop Progress Indicator */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-celestial
                    ${isStepCompleted(index)
                      ? 'bg-success text-success-foreground border-success'
                      : isStepActive(index)
                      ? 'bg-primary text-primary-foreground border-primary animate-pulse-soft'
                      : 'bg-surface text-text-muted border-border'
                    }
                  `}
                >
                  {isStepCompleted(index) ? (
                    <Icon name="Check" size={16} />
                  ) : (
                    <Icon 
                      name={step.icon} 
                      size={16} 
                      className={isStepActive(index) && step.icon === 'Loader2' ? 'animate-spin' : ''}
                    />
                  )}
                </div>
                
                <div className="ml-3">
                  <div
                    className={`
                      text-sm font-medium transition-celestial
                      ${isStepActive(index)
                        ? 'text-primary'
                        : isStepCompleted(index)
                        ? 'text-success' :'text-text-muted'
                      }
                    `}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-text-muted font-caption">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`
                      h-0.5 transition-celestial
                      ${isStepCompleted(index)
                        ? 'bg-success' :'bg-border'
                      }
                    `}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Progress Indicator */}
        <div className="md:hidden">
          <div className="flex items-center justify-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                    w-3 h-3 rounded-full transition-celestial
                    ${isStepCompleted(index)
                      ? 'bg-success'
                      : isStepActive(index)
                      ? 'bg-primary animate-pulse-soft' :'bg-border'
                    }
                  `}
                />
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-8 h-0.5 mx-1 transition-celestial
                      ${isStepCompleted(index)
                        ? 'bg-success' :'bg-border'
                      }
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Current Step Info */}
          <div className="text-center mt-3">
            <div className="text-sm font-medium text-primary">
              {steps[currentStepIndex]?.label}
            </div>
            <div className="text-xs text-text-muted font-caption">
              {steps[currentStepIndex]?.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;