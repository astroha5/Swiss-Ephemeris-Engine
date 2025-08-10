import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from './Button';


const ActionButtonCluster = ({ 
  customActions = null,
  isLoading = false,
  onPrimaryAction = null,
  onSecondaryAction = null,
  disabled = false,
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getDefaultActions = () => {
    const currentPath = location.pathname;

    switch (currentPath) {
      case '/home-landing-page':
        return {
          primary: {
            label: 'Generate Chart',
            icon: 'Calculator',
            onClick: () => navigate('/birth-details-form'),
            variant: 'primary'
          },
          secondary: {
            label: 'View Positions',
            icon: 'MapPin',
            onClick: () => navigate('/planetary-events?tab=positions'),
            variant: 'secondary'
          }
        };

      case '/birth-details-form':
        return {
          primary: {
            label: 'Generate Chart',
            icon: 'Sparkles',
            onClick: onPrimaryAction || (() => navigate('/chart-results-dashboard')),
            variant: 'primary',
            loading: isLoading
          },
          secondary: {
            label: 'Back to Home',
            icon: 'ArrowLeft',
            onClick: onSecondaryAction || (() => navigate('/home-landing-page')),
            variant: 'ghost'
          }
        };


      case '/chart-results-dashboard':
        return {
          primary: {
            label: 'Download PDF',
            icon: 'Download',
            onClick: onPrimaryAction || (() => console.log('Download PDF')),
            variant: 'primary'
          },
          secondary: {
            label: 'New Chart',
            icon: 'Plus',
            onClick: onSecondaryAction || (() => navigate('/home-landing-page')),
            variant: 'secondary'
          }
        };

      case '/error-handling-page':
        return {
          primary: {
            label: 'Try Again',
            icon: 'RefreshCw',
            onClick: onPrimaryAction || (() => navigate('/home-landing-page')),
            variant: 'primary'
          },
          secondary: {
            label: 'Get Help',
            icon: 'HelpCircle',
            onClick: onSecondaryAction || (() => console.log('Contact support')),
            variant: 'ghost'
          }
        };

      default:
        return null;
    }
  };

  const actions = customActions || getDefaultActions();

  if (!actions) return null;

  return (
    <div className={`action-button-cluster ${className}`}>
      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-center space-x-4 py-6">
        {actions.secondary && (
          <Button
            variant={actions.secondary.variant}
            onClick={actions.secondary.onClick}
            disabled={disabled}
            iconName={actions.secondary.icon}
            iconPosition="left"
            size="lg"
            className="min-w-[140px]"
          >
            {actions.secondary.label}
          </Button>
        )}
        
        <Button
          variant={actions.primary.variant}
          onClick={actions.primary.onClick}
          disabled={disabled}
          loading={actions.primary.loading}
          iconName={actions.primary.icon}
          iconPosition="right"
          size="lg"
          className="min-w-[160px] shadow-medium hover-scale"
        >
          {actions.primary.label}
        </Button>
      </div>

      {/* Mobile Layout - Sticky Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-80 bg-surface/95 backdrop-blur-sm border-t border-border shadow-strong">
        <div className="px-4 py-4 space-y-3">
          <Button
            variant={actions.primary.variant}
            onClick={actions.primary.onClick}
            disabled={disabled}
            loading={actions.primary.loading}
            iconName={actions.primary.icon}
            iconPosition="right"
            size="lg"
            fullWidth
            className="shadow-medium"
          >
            {actions.primary.label}
          </Button>
          
          {actions.secondary && (
            <Button
              variant={actions.secondary.variant}
              onClick={actions.secondary.onClick}
              disabled={disabled}
              iconName={actions.secondary.icon}
              iconPosition="left"
              size="md"
              fullWidth
            >
              {actions.secondary.label}
            </Button>
          )}
        </div>
        
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-surface/95"></div>
      </div>

      {/* Mobile spacing to prevent content overlap */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
};

export default ActionButtonCluster;