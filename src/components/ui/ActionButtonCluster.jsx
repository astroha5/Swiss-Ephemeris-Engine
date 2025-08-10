import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import LoginModal from '../auth/LoginModal';

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
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const getDefaultActions = () => {
    const currentPath = location.pathname;

    switch (currentPath) {
      case '/home-landing-page':
        return {
          primary: {
            label: isAuthenticated ? 'Generate Chart' : 'Sign In to Generate Chart',
            icon: isAuthenticated ? 'Calculator' : 'User',
            onClick: () => isAuthenticated ? navigate('/birth-details-form') : setShowLoginModal(true),
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
            onClick: () => {
              if (isAuthenticated) {
                if (onPrimaryAction) {
                  onPrimaryAction();
                } else {
                  navigate('/chart-results-dashboard');
                }
              } else {
                setShowLoginModal(true);
              }
            },
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
      
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          // You can add signup modal logic here if needed
        }}
      />
    </div>
  );
};

export default ActionButtonCluster;